let BigNumber = require('bignumber.js').default;

let Czr = require("../czr/index");
let czr = new Czr();

let pgclient = require('./PG');// 引用上述文件
pgclient.getConnection();

//写日志
let log4js = require('./log_config');
let logger = log4js.getLogger('write_db');//此处使用category的值
let self; 
const WITNESS_ARY=[
    "czr_321JDA7Brgbnm64iY2Xh8yHMEqEgBDutnoTKVLcxW2DJvJLUsS",
    "czr_32RmC9FsxjgLkgRQ58j3CdLg79cQE3KaY2wAT1QthBTU25vpd3",
    "czr_3MnXfV9hbmxVPdgfrPqgUiH6N7VbkSEhn5VqBCzBcxzTzkEUxU",
    "czr_3SrfL6LnPbtyf6sanrgtKs1BTYDN8taacGBVG37LfZVqXvRHbf",
    "czr_3igvJpdDiV4v5HxEzCifFcUpKvWsk3qWYNrTrbEVQztKbpyW1z",
    "czr_3tiy2jgoUENkszPjrHjQGfmopqwV5m9BcEh2Grb1zDYgSGnBF7",
    "czr_47E2jJ9rXVk5GRBcTLQMLQHXqsrnVcV5Kv2CWQJ6dnUaugnvii",
    "czr_4HhYojuHanxQ57thkSxwy5necRtDFwiQP7zqngBDZHMjqdPiMS",
    "czr_4MYTD6Xctkb6fEL8xUZxUwY6eqYB7ReEfB61YFrMHaZxsqLCKd",
    "czr_4URkteqck9rM8Vo6VzWmvKtMWoSH8vo4A1rADNAFrQHxAR23Tb",
    "czr_4ZJ8hBdR6dLv4hb1RPCmajdZf7ozkH1sHU18kT7xnXj4mjxxKE",
    "czr_4iig3fTcXQmz7bT2ztJPrpH8usrqGTN5zmygFqsCJQ4HgiuNvP"
];

//辅助数据 Start
let getRpcTimer = null,
    getUnstableTimer = null;
let dbStableMci,        //本地数据库的最高稳定MCI
    rpcStableMci;       //RPC接口请求到的最高稳定MCI
let cartMci = 0;        //大量数据分批存储时候，用来记录MCI
let cartStep = 10;      //如果数据过多时候，每批处理地数据
let tempMci;            //大量数据分批存储时候，临时MCI
let isStableDone = false;//稳定的MCI是否插入完成
//辅助数据 End

// 操作稳定Unit相关变量 Start
let unitInsertAry       = [];//不存在unit,插入[Db]
let unitUpdateAry       = [];//存在的unit,更新[Db]
let accountsInsertAry   = [];//不存在的账户,插入[Db]
let accountsUpdateAry   = [];//存在的账户,更新[Db]
let parentsTotalAry     = [];//储存预处理的parents信息[Db]
let witnessTotal        = {};//储存预处理的见证人信息[Db]

let accountsTotal   = {};//储存预处理的账户信息
let unitAryForSql   = [];//作为语句，从数据库搜索已有unit

let timestampTotal  = {};//储存预处理的时间戳信息
let timestampInsertAry   = [];//没有的timestamp,插入[Db]
let timestampUpdateAry   = [];//存在的timestamp,更新[Db]

let timestamp10Total  = {};//储存预处理的时间戳信息
let timestamp10InsertAry   = [];//没有的timestamp,插入[Db]
let timestamp10UpdateAry   = [];//存在的timestamp,更新[Db]
// 操作稳定Unit相关变量 End

// 批量操作不稳定Unit相关变量 Start
let unstableUnitHashAry     = [];//不稳定Unit Hash组成的数组
let unstableParentsAry      = [];//需要插入的Parents
let unstableWitnessTotal    = {};//需要预处理的Witness
let unstableInsertBlockAry  = [];//需要插入的Block
let unstableUpdateBlockAry  = [];//需要更新的Block
// 批量操作不稳定Unit相关变量 End


let pageUtility = {
    init() {
        self =this;
        let SearchOptions = {
            text: "select mci from transaction where (is_stable = $1) order by pkid desc limit 1",
            values: [true]
        };
        pgclient.query(SearchOptions, (data) => {
            if (data.length === 0) {
                dbStableMci = 0;
            } else if (data.length === 1) {
                dbStableMci = Number(data[0].mci) + 1;
            } else if (data.length > 1) {
                logger.info("get dataCurrentMai is Error");
                return;
            }
            logger.info(`应该使用的稳定MCI-dbStableMci : ${dbStableMci}`);
            pageUtility.readyGetData();
        });
    },
    readyGetData() {
        getRpcTimer = setTimeout(function () {
            pageUtility.getRPC()
        }, 1000)
    },
    getRPC() {
        //获取网络中最新稳定的MCI
        logger.info(`获取网络中最新稳定的MCI-Start`);
        czr.request.status().then(function (status) {
            logger.info(`获取网络中最新稳定的MCI-Success `);
            logger.info(status);
            return status
        }).catch((err)=>{
            logger.info(`获取网络中最新稳定的MCI-Error : ${err}`);
        })
        .then(function (status) {
            rpcStableMci = Number(status.status.last_stable_mci);
            if ((dbStableMci < rpcStableMci) || (dbStableMci ===0)) {
                if ((dbStableMci + cartStep) < rpcStableMci) {
                    //数量太多，需要分批插入
                    cartMci = dbStableMci + cartStep;
                    isStableDone = false;
                } else {
                    //一次可以插入完
                    isStableDone = true;
                }
                logger.info(`dbStableMci:${dbStableMci} , rpcStableMci:${rpcStableMci}, 开始准备插入数据 ${dbStableMci < rpcStableMci}`);
                pageUtility.searchMci(status.status);
            } else {
                getUnstableTimer = setTimeout(function () {
                    pageUtility.getUnstableBlocks();//查询所有不稳定 block 信息
                }, 1000)
            }
        })
    },

    //插入Mci信息
    searchMci(status) {
        pgclient.query("Select * FROM mci  WHERE last_stable_mci = $1", [Number(status.last_stable_mci)], (data) => {
            if (data.length > 1) {
                logger.info("searchMci is Error");
                return;
            }else{
                let currentMci = data[0];
                if (data.length === 0) {
                    logger.info("searchMci 数据库无Mci，第一次插入");
                    pageUtility.insertMci(status);
                } else if (data.length === 1) {
                    logger.info("searchMci 判断是否最新的MCI",currentMci.last_mci,status.last_mci);
                    if(Number(currentMci.last_mci)!==Number(status.last_mci)){
                        logger.info("searchMci 插入最新MCI");
                        pageUtility.insertMci(status);
                    }else{
                        logger.info("searchMci 无需插入最新MCI,直接更新吧老铁!");
                        pageUtility.getUnitByMci();//查询所有稳定 block 信息
                    }
                } 
            }
            
        });
    },
    insertMci(status){
        const mciText = 'INSERT INTO mci(last_mci,last_stable_mci) VALUES($1,$2)';
        const mciValues = [Number(status.last_mci),Number(status.last_stable_mci)];
        pgclient.query(mciText,mciValues,(res) => {
            let typeVal = Object.prototype.toString.call(res);
            if (typeVal === '[object Error]') {
                logger.info(`MCI插入失败`);
                logger.info(res);
            } else {
                logger.info(`MCI插入成功`);
                pageUtility.getUnitByMci();//查询所有稳定 block 信息
            }
        })
    },
    //插入稳定的Unit ------------------------------------------------ Start
    getUnitByMci(){
        logger.info(`通过稳定MCI值 ${dbStableMci} 获取网络中block信息 BY czr.request.mciBlocks`);
        czr.request.mciBlocks(dbStableMci).then(function (data) {
            if(data.blocks){
                data.blocks.forEach((item) => {
                    //写 is_witness
                    if(WITNESS_ARY.indexOf(item.from)>-1){
                        item.is_witness = true;
                    }else{ 
                        item.is_witness = false;
                    }
                    unitInsertAry.push(item);
                });
                dbStableMci++;//7001
    
                //当前是否完成，控制一次插入多少
                if (isStableDone) {
                    tempMci = rpcStableMci;
                } else {
                    tempMci = cartMci;
                }
    
                if (dbStableMci <= tempMci) {
                    pageUtility.getUnitByMci();
                    // logger.info(`dbStableMci <= tempMci  true`);
                } else {
                    logger.info(`dbStableMci <= tempMci  false`);
                    pageUtility.filterData();
                }
            }else{
                logger.info(`mciBlocks : data.blocks => false`);
                pageUtility.getRPC();
            }
        }).catch((err)=>{
            logger.info(`mciBlocks-Error : ${err}`);
        })
    },
    filterData(){
        //2、根据稳定Units数据，筛选Account Parent Witness Timestamp，方便后续储存
        unitInsertAry.sort(function (a, b) {
            return Number(a.level) - Number(b.level);
        });
        unitInsertAry.forEach(blockInfo => {
            //DO 处理账户，发款方不在当前 accountsTotal 时 （以前已经储存在数据库了）
            if (!accountsTotal.hasOwnProperty(blockInfo.from)) {
                accountsTotal[blockInfo.from] = {
                    account: blockInfo.from,
                    type: 1,
                    balance: "0"
                }
            }

            //账户余额 只有是成功的交易才操作账户余额
            let isFail = pageUtility.isFail(blockInfo);//交易失败了
            if (!isFail) {
                //处理收款方余额
                if (accountsTotal.hasOwnProperty(blockInfo.to)) {
                    //有：更新数据
                    accountsTotal[blockInfo.to].balance = BigNumber(accountsTotal[blockInfo.to].balance).plus(blockInfo.amount).toString(10);
                } else {
                    //无：写入数据
                    accountsTotal[blockInfo.to] = {
                        account: blockInfo.to,
                        type: 1,
                        balance: blockInfo.amount
                    }
                }
                //处理发款方余额
                if (Number(blockInfo.level) !== 0) {
                    accountsTotal[blockInfo.from].balance = BigNumber(accountsTotal[blockInfo.from].balance).minus(blockInfo.amount).toString(10);
                }
            }

            //DO 处理 parents 数据
            if (blockInfo.parents.length > 0) {
                parentsTotalAry.push({
                    item:blockInfo.hash,
                    parent:blockInfo.parents,
                    is_witness:blockInfo.is_witness,
                    prototype:""
                });
            }

            // 处理witness
            if (blockInfo.witness_list.length > 0) {
                witnessTotal[blockInfo.hash] = blockInfo.witness_list;
            }

            //DO 交易
            unitAryForSql.push(blockInfo.hash);

            //DO timestamp 1秒
            //DO timestamp 10秒 timestamp10Total
            if(blockInfo.hasOwnProperty("mc_timestamp")){
                if (!timestampTotal.hasOwnProperty(blockInfo.mc_timestamp)) {
                    timestampTotal[blockInfo.mc_timestamp] = {
                        timestamp: blockInfo.mc_timestamp,
                        type: 1,
                        count: 1
                    }
                }else{
                    timestampTotal[blockInfo.mc_timestamp].count+=1;
                }
                //10
                if (!timestamp10Total.hasOwnProperty(self.formatTimestamp(blockInfo.mc_timestamp))) {
                    timestamp10Total[self.formatTimestamp(blockInfo.mc_timestamp)] = {
                        timestamp: self.formatTimestamp(blockInfo.mc_timestamp),
                        type: 10,
                        count: 1
                    }
                }else{
                    timestamp10Total[self.formatTimestamp(blockInfo.mc_timestamp)].count+=1;
                }

            }else{
                logger.info(`mc_timestamp-Error`);
                logger.info(blockInfo);
            }

        });

        /*
        * 处理账户
        * 处理Parent
        * 处理Block
        * */
       logger.info(`pageUtility.searchAccountBaseDb();`);
       pageUtility.searchAccountBaseDb();
    },
    searchAccountBaseDb(){
        //处理账户
        let tempAccountAllAry = [];
        for (let item in accountsTotal) {
            tempAccountAllAry.push(item);
        }

        let upsertSql = {
            text: "select account from accounts where account = ANY ($1)",
            values: [tempAccountAllAry]
        };
        pgclient.query(upsertSql, (accountRes) => {
            accountRes.forEach(item => {
                if (accountsTotal.hasOwnProperty(item.account)) {
                    accountsUpdateAry.push(accountsTotal[item.account]);
                    delete accountsTotal[item.account];
                }
            });
            for (let item in accountsTotal) {
                accountsInsertAry.push(accountsTotal[item]);
            }
            logger.info(`合计 Account:${tempAccountAllAry.length}`);
            logger.info(`更新 Account:${accountsUpdateAry.length}`);//有用
            logger.info(`插入 Account:${accountsInsertAry.length}`);//有用
            pageUtility.searchTimestampBaseDb()

        });
    },
    searchTimestampBaseDb(){
        //处理Timestamp
        let tempTimesAllAry = [];
        for (let item in timestampTotal) {
            tempTimesAllAry.push(item);
        }

        let upsertSql = {
            text: "select timestamp from timestamp where timestamp = ANY ($1)",
            values: [tempTimesAllAry]
        };
        pgclient.query(upsertSql, (timestampRes) => {
            timestampRes.forEach(item => {
                if (timestampTotal.hasOwnProperty(item.timestamp)) {
                    timestampUpdateAry.push(timestampTotal[item.timestamp]);
                    delete timestampTotal[item.timestamp];
                }
            });
            for (let item in timestampTotal) {
                timestampInsertAry.push(timestampTotal[item]);
            }
            logger.info(`合计 Timestamp:${tempTimesAllAry.length}`);
            logger.info(`更新 Timestamp:${timestampUpdateAry.length}`);//有用
            logger.info(`插入 Timestamp:${timestampInsertAry.length}`);//有用
            //处理Timestamp 结束

            //处理 10Timestamp 开始
            let tempTimes10AllAry = [];
            for (let item10 in timestamp10Total) {
                tempTimes10AllAry.push(item10);
            }
    
            let upsert10Sql = {
                text: "select timestamp from timestamp where timestamp = ANY ($1)",
                values: [tempTimes10AllAry]
            };
            pgclient.query(upsert10Sql, (timestampRes) => {
                timestampRes.forEach(item => {
                    if (timestamp10Total.hasOwnProperty(item.timestamp)) {
                        timestamp10UpdateAry.push(timestamp10Total[item.timestamp]);
                        delete timestamp10Total[item.timestamp];
                    }
                });
                for (let item in timestamp10Total) {
                    timestamp10InsertAry.push(timestamp10Total[item]);
                }
                logger.info(`合计 Timestamp10:${tempTimes10AllAry.length}`);
                logger.info(`更新 Timestamp10:${timestamp10UpdateAry.length}`);//有用
                logger.info(`插入 Timestamp10:${timestamp10InsertAry.length}`);//有用

                //处理 10Timestamp 结束
                pageUtility.searchParentsBaseDb()
    
            });

        });
    },
    searchParentsBaseDb(){
        //处理Parent
        let tempParentsAllAry = [];
        parentsTotalAry.forEach(item=>{
            tempParentsAllAry.push(item.item);//key push 
        })

        let upsertParentSql = {
            text: "select item from parents where item = ANY ($1)",
            values: [tempParentsAllAry]
        };
        pgclient.query(upsertParentSql, (res) => {
            let hashParentObj = {};
            res.forEach((item) => {
                hashParentObj[item.item] = item.item;
            });
            logger.info(`合计 Parents:${Object.keys(parentsTotalAry).length}`);
            logger.info(`已存在 Parents:${Object.keys(hashParentObj).length}`);
            for (let parent in hashParentObj) {
                // delete parentsTotalAry[parent];
                parentsTotalAry.forEach((item,index)=>{
                    if(item.item==parent){
                        parentsTotalAry.splice(index,1);
                    }
                })
            }
            logger.info(`需处理 Parents:${Object.keys(parentsTotalAry).length}`);//parentsTotalAry 是目标数据
            pageUtility.writePrototype(parentsTotalAry ,'1', pageUtility.searchBlockBaseDb)
            // pageUtility.searchBlockBaseDb();
        });
    },
    searchBlockBaseDb(){
        //处理Block
        let upsertBlockSql = {
            text: "select hash from transaction where hash = ANY ($1)",
            values: [unitAryForSql]
        };
        pgclient.query(upsertBlockSql, (blockRes) => {
            logger.info(`合计  Block:${unitAryForSql.length}`);
            logger.info(`已存在 Block:${blockRes.length}`);
            blockRes.forEach(dbItem => {
                for (let i= 0;i<unitInsertAry.length;i++){
                    if(unitInsertAry[i].hash === dbItem.hash){
                        unitUpdateAry.push(unitInsertAry[i]);
                        unitInsertAry.splice(i,1);
                        i--;
                    }
                }
            });
            unitInsertAry = [].concat(unitInsertAry);
            logger.info(`更新Block数量:${unitUpdateAry.length}`);
            logger.info(`插入Block数量:${unitInsertAry.length}`);
            pageUtility.searchWitnessBaseDb();
        });
    },
    searchWitnessBaseDb(){
        // 处理witness  witnessTotal
        let witnessAllAry = [];
        for (let item in witnessTotal) {
            witnessAllAry.push(item);
        }
        let upsertWitnessSql = {
            text: "select item from witness where item = ANY ($1)",
            values: [witnessAllAry]
        };
        pgclient.query(upsertWitnessSql, (witnessRes) => {
            let hashWitnessObj = {};
            witnessRes.forEach((item) => {
                hashWitnessObj[item.item] = item.item;
            });
            logger.info(`合计有 Witness:${Object.keys(witnessTotal).length}`);
            for (let witness in hashWitnessObj) {
                delete witnessTotal[witness];
            }
            logger.info(`已存在 Witness:${Object.keys(hashWitnessObj).length}`);
            logger.info(`需处理 Witness:${Object.keys(witnessTotal).length}`);
            pageUtility.batchInsertStable();
        })
    },
    batchInsertStable(){
        //批量提交
        logger.info("****** 准备批量插入稳定账户、Parent、Block，并批量更新Block ******");
        pgclient.query('BEGIN', (res) => {
            logger.info("操作稳定 Block Start", res);
            if (pageUtility.shouldAbort(res, "操作稳定BlockStart")) {
                return;
            }
            /*
            * 批量插入 账户       accountsInsertAry
            * 批量插入 时间       timestampInsertAry
            * 批量插入 时间       timestamp10InsertAry
            * 批量插入 Parent、   parentsTotalAry:Ary
            * 批量插入 Witness    witnessTotal:object
            * 批量插入 Block、    unitInsertAry
            * 批量更新 Block、    unitUpdateAry
            * */
           
            if (accountsInsertAry.length > 0) {
                logger.info("插入 accountsInsertAry By batchInsertAccount");
                pageUtility.batchInsertAccount(accountsInsertAry);
            }
            if (timestampInsertAry.length > 0) {
                logger.info("插入 timestampInsertAry By batchInsertTimestamp");
                logger.info(timestampInsertAry);
                pageUtility.batchInsertTimestamp(timestampInsertAry);
            }
            if (timestamp10InsertAry.length > 0) {
                logger.info("插入 timestamp10InsertAry By batchInsertTimestamp");
                logger.info(timestamp10InsertAry);
                pageUtility.batchInsertTimestamp(timestamp10InsertAry);
            }
            if (parentsTotalAry.length > 0) {
                logger.info("插入 parentsTotalAry By batchInsertParent");
                pageUtility.batchInsertParent(parentsTotalAry);
            }
            if (Object.keys(witnessTotal).length > 0) {
                logger.info("插入 witnessTotal By batchInsertWitness");
                pageUtility.batchInsertWitness(witnessTotal);
            }

            if (unitInsertAry.length > 0) {
                logger.info("插入 unitInsertAry By batchInsertBlock");
                pageUtility.batchInsertBlock(unitInsertAry);
            }

            if (unitUpdateAry.length > 0) {
                logger.info("插入 unitUpdateAry By batchUpdateBlock");
                pageUtility.batchUpdateBlock(unitUpdateAry);
            }

            pgclient.query('COMMIT', (err) => {
                logger.info("操作插入稳定 Block End", err);
                logger.info("需要更新的Account数量 ", accountsUpdateAry.length);
                logger.info("需要更新的timestamp数量 ", timestampUpdateAry.length);
                logger.info("需要更新的timestamp数量 ", timestamp10UpdateAry.length);
                /* 
                批量更新账户、       accountsUpdateAry
                */
                accountsUpdateAry.forEach(account => {
                    pageUtility.aloneUpdateAccount(account)
                });
                timestampUpdateAry.forEach(timestamp => {
                    pageUtility.aloneUpdateTimestamp(timestamp)
                });
                timestamp10UpdateAry.forEach(timestamp => {
                    pageUtility.aloneUpdateTimestamp(timestamp);
                });

                //归零数据
                unitInsertAry = [];
                accountsTotal = {};
                parentsTotalAry = [];
                witnessTotal = {};
                unitAryForSql = [];//用来从数据库搜索的数组
                accountsUpdateAry=[];
                unitUpdateAry =[];
                accountsInsertAry=[];

                timestampTotal = {};
                timestampInsertAry=[];
                timestampUpdateAry=[];

                timestamp10Total = {};
                timestamp10InsertAry=[];
                timestamp10UpdateAry=[];


                //Other
                logger.info(`数据库稳定MCI:${dbStableMci}, RPC稳定Mci:${rpcStableMci}, 本次操作的最后一个Mci:${tempMci}，是否完成稳定MCI的操作:${isStableDone}`);
                if (!isStableDone) {
                    //没有完成,处理 cartMci 和 isDone
                    if ((cartMci + cartStep) < rpcStableMci) {
                        //数量太多，需要分批插入
                        cartMci += cartStep;
                        isStableDone = false;
                    } else {
                        //下一次可以插入完
                        cartMci = rpcStableMci;
                        isStableDone = true;
                    }
                    pageUtility.getUnitByMci();
                } else {
                    //最后：获取 不稳定的unstable_blocks 存储
                    pageUtility.getUnstableBlocks();
                }
            })
        });
    },
    //插入稳定的Unit ------------------------------------------------ End

    //插入不稳定的Unit ------------------------------------------------ Start
    getUnstableBlocks() {
        unstableUnitHashAry     = [];
        unstableParentsAry      = [];
        unstableWitnessTotal    = {};
        unstableInsertBlockAry  = [];
        unstableUpdateBlockAry  = [];
        czr.request.unstableBlocks().then(function (data) {
            unstableInsertBlockAry = data.blocks;
            if(unstableInsertBlockAry.length>0){
                //排序 level 由小到大
                unstableInsertBlockAry.sort(function (a, b) {
                    return Number(a.level) - Number(b.level);
                });
                //@A 拆分数据
                unstableInsertBlockAry.forEach(blockInfo => {
                     //写 is_witness
                     if(WITNESS_ARY.indexOf(blockInfo.from)!=-1){
                        blockInfo.is_witness = true;
                    }else{ 
                        blockInfo.is_witness = false;
                    }
                    //处理parents
                    if (blockInfo.parents.length > 0) {
                        // {"AAAA":["BBB","CCC"]}
                        unstableParentsAry.push({
                            item:blockInfo.hash,
                            parent:blockInfo.parents,
                            is_witness:blockInfo.is_witness,
                            prototype:""
                        })
                    }
                    //处理witness
                    if (blockInfo.witness_list.length > 0) {
                        // {"AAAA":["BBB","CCC"]}
                        unstableWitnessTotal[blockInfo.hash] = blockInfo.witness_list;
                    }
                    //处理Unit Hash
                    unstableUnitHashAry.push(blockInfo.hash);
                });


                /* 
                1.筛选好需要操作的Parent
                2.筛选好需要操作的Witness
                3.筛选好需要更新的Block
                筛选好需要插入的Block
                */
                pageUtility.searchParentsFromDb();
            }
        })
    },
    //1.搜索哪些Parents已经存在数据库中,并把 unstableParentsAry 改为最终需要处理的数据
    searchParentsFromDb(){
        let unstableParentsAllAry = [];
        unstableParentsAry.forEach(item=>{
            unstableParentsAllAry.push(item.item);//key push 
        })

        let upsertParentSql = {
            text: "select item from parents where item = ANY ($1)",
            values: [unstableParentsAllAry]
        };
        pgclient.query(upsertParentSql, (res) => {
            let hashParentObj = {};//数据库中存在的parents
            res.forEach((item) => {
                hashParentObj[item.item] = item.item;
            });
            logger.info(`合计有 Parents:${unstableParentsAry.length}`);
            for (let parent in hashParentObj) {
                // delete unstableParentsAry[parent];
                unstableParentsAry.forEach((item,index)=>{
                    if(item.item==parent){
                        unstableParentsAry.splice(index,1);
                    }
                })
            }
            logger.info(`已存在 Parents:${Object.keys(hashParentObj).length}`);
            logger.info(`需处理 Parents:${unstableParentsAry.length}`);//后面有用
            pageUtility.writePrototype(unstableParentsAry ,'2', pageUtility.searchWitnessFromDb)
            // pageUtility.searchWitnessFromDb();
        });
    },
    writePrototype(sources_ary,flag,fn){
        //falg : 1=>稳定 2=>不稳定
        let tempAry=[];
        let dbParents = [];//已经再数据里的数据
        let allUnit = [];//当前所有的unit
        let allParent = [];//当前所有的parent
        sources_ary.forEach(item=>{
            item.parent.forEach(childrenItem=>{
                tempAry.push({
                    item:item.item,
                    parent:childrenItem,//单个parents
                    is_witness:item.is_witness,
                    prototype:item.prototype
                });
                allUnit.push(item.item);//判断parent的值有哪里是已经存在allUnit的
                allParent.push(childrenItem);//判断parent的值有哪里是已经存在allParent的
            })
        })
        sources_ary = tempAry;
        logger.info("===================parents=====================")
        logger.info(`整理后的parents个数:${sources_ary.length}  (${flag=='1'?'稳定的':'不稳定的'})`)
        /* 
        写unit对应 prototype 值:
        1.unit对应parent的是在哪里，可能存在当前数组，也可能在Db中；需要进行分类
        2.先批量查Db里parents的is_witness
            T:则unit的 prototype 为 parent
            F:则unit的 prototype 为 parent.prototype
        3.再把存在当前数据里的进行处理
        */
       sources_ary.forEach((item,index)=>{
           if(allUnit.indexOf(item.parent)<0){
               dbParents.push(item.parent);//存在Db里
           }
       })
       let searchParentsSql = {
            text: "select item,parent,is_witness,prototype from parents where item = ANY ($1)",
            values: [dbParents]
        };
        pgclient.query(searchParentsSql, (parentsRes) => {
            let itemIndex=0;
            let dbHashParent = []
            logger.info(`数据库中存在的parents:${parentsRes.length}`);
            // logger.info(parentsRes);
            let hubUnit = [];//需要把is_hub更新为true的unit数组
            //根据数据库的写当前的prototype
            if(parentsRes.length>0){
                logger.info("allUnit",allParent);
                let hubObj = pageUtility.writeHub(parentsRes);
                parentsRes.forEach(item=>{
                    itemIndex = allParent.indexOf(item.item);
                    allParent[itemIndex]="IS_GET";
                    dbHashParent.push(item.item);
                    /* 
                        TODO：如果DE指向C，C指向AB；
                        C的is_witness为true，则DE的prototype值均为C；
                        C的is_witness为false,那么DE的prototype值是C(C此时是枢纽)

                        如果C后面不是DE，而是单独一个F；
                        C的is_witness为true，则F的prototype值为C；
                        C的is_witness为false,那么F的prototype为C，此时值是
                          
                    */
                    logger.info("item.item是否存在",itemIndex,item.item)
                    if(itemIndex>-1){
                        if(item.is_witness){
                            //当前是witness
                            sources_ary[itemIndex].prototype = item.item;
                        }else{
                            //非witness
                            //如果是枢纽，prototype的是item.item;
                            if(hubObj[item.item].is_hub){
                                logger.info("item是枢纽unit",hubObj[item.item])
                                hubUnit.push(item.item)
                                sources_ary[itemIndex].prototype = item.item; 
                                //更新tranction的对应item的is_hub属性
                            }else{
                                sources_ary[itemIndex].prototype = item.prototype;
                            }
                        }
                    }
                }); 
            }

            //根据当前的写当前的prototype
            let currentItemIndex=0;
            let targetItem={};
            sources_ary.forEach((currentItem,index)=>{
                currentItemIndex = allUnit.indexOf(currentItem.parent); 
                if(currentItemIndex>-1){
                    targetItem =sources_ary[currentItemIndex];
                    if(targetItem.is_witness){
                        currentItem.prototype = targetItem.item;
                    }else{
                        currentItem.prototype = targetItem.prototype;
                    }
                }

                //循环当前数组，这一步是处理假设AB同时指向C，C指向D；数据库只能查出的1条C；循环C，只会写A，B的proto会漏写
                let localItemIndex= dbHashParent.indexOf(currentItem.parent);
                if(localItemIndex>-1 && (!currentItem.prototype)){
                    if(parentsRes[localItemIndex].is_witness){
                        sources_ary[index].prototype = parentsRes[localItemIndex].item; 
                    }else{
                        sources_ary[index].prototype = parentsRes[localItemIndex].prototype;  
                    }
                }
            })
            
            //赋值对应的数据
            if(flag == "1"){
                //赋值稳定的
                parentsTotalAry = sources_ary;
            }else if(flag =="2"){
                //赋值不稳定的
                unstableParentsAry = sources_ary;
            }
            if(hubUnit.length>0){
                //需要更新枢纽属性
                pageUtility.updateHub(hubUnit,fn);
            }else{
                fn();
            }
        })
    },
    //2.搜索哪些Witness已经存在数据库中,并把 unstableWitnessTotal 改为最终需要处理的数据
    searchWitnessFromDb(){
        let unstableWitnessAllAry = [];
        for (let item in unstableWitnessTotal) {
            unstableWitnessAllAry.push(item);//push key 
        }
        let upsertWitnessSql = {
            text: "select item from witness where item = ANY ($1)",
            values: [unstableWitnessAllAry]
        };
        pgclient.query(upsertWitnessSql, (witnessRes) => {
            let hashWitnessObj = {};
            witnessRes.forEach((item) => {
                hashWitnessObj[item.item] = item.item;
            });
            logger.info(`合计有 Witness:${Object.keys(unstableWitnessTotal).length}`);
            for (let witness in hashWitnessObj) {
                delete unstableWitnessTotal[witness];
            }
            logger.info(`已存在 Witness:${Object.keys(hashWitnessObj).length}`);
            logger.info(`需处理 Witness:${Object.keys(unstableWitnessTotal).length}`);
            pageUtility.searchHashFromDb();
        })
    },

    //3.搜索哪些hash已经存在数据库中,哪些
    searchHashFromDb(){
        let upsertBlockSql = {
            text: "select hash from transaction where hash = ANY ($1)",
            values: [unstableUnitHashAry]
        };
        pgclient.query(upsertBlockSql, (blockRes) => {
            logger.info(`合计有 BlockHash:${unstableUnitHashAry.length}`);
            logger.info(`表里有 BlockHash:${blockRes.length}`);
            blockRes.forEach(dbItem => {
                for (let i= 0;i<unstableInsertBlockAry.length;i++){
                    if(unstableInsertBlockAry[i].hash === dbItem.hash){
                        unstableUpdateBlockAry.push(unstableInsertBlockAry[i]);
                        unstableInsertBlockAry.splice(i,1);
                        i--;
                    }
                }
            });
            logger.info(`更新不稳定Block数量:${unstableUpdateBlockAry.length}`);//这个后面有用
            logger.info(`插入不稳定Block数量:${unstableInsertBlockAry.length}`);//这个后面有用
            pageUtility.batchInsertUnstable();
        });
    },

    batchInsertUnstable(){
        //开始插入数据库
        pgclient.query('BEGIN', (res) => {
            logger.info("批量操作不稳定 Unit Start", res);
            if (pageUtility.shouldAbort(res, "操作不稳定BlockStart")) {
                return;
            }
            /*
            * 批量插入 Parent、   unstableParentsAry
            * 批量插入 Witness   unstableWitnessTotal:object
            * 批量插入 Block、    unstableInsertBlockAry
            * 批量更新 Block、    unstableUpdateBlockAry
            * */
            if (unstableParentsAry > 0) {
                pageUtility.batchInsertParent(unstableParentsAry);
            }

            if (Object.keys(unstableWitnessTotal).length > 0) {
                pageUtility.batchInsertWitness(unstableWitnessTotal);
            }

            if (unstableInsertBlockAry.length > 0) {
                pageUtility.batchInsertBlock(unstableInsertBlockAry);
            }
            if (unstableUpdateBlockAry.length > 0) {
                pageUtility.batchUpdateBlock(unstableUpdateBlockAry);
            }
            pgclient.query('COMMIT', (err) => {
                logger.info("批量操作不稳定 Unit End", err);
                pageUtility.readyGetData();
            })
        })
    },
    
    // 插入不稳定的Unit ------------------------------------------------ End

    //批量插入witness
    batchInsertWitness(witnessObj) {
        // let witnessObj={
        //     '5D81C966F0E1B1DFA0F77488FD4A577BB557CBEF4C87DE39141CB0FF7639F583': [ 'AAA' ],
        //     '94960D6352BC14287A68327373B45E0D8F21BC4C434287C893BD0DF9100E4F35':
        //         [ 'BBB',
        //             'CCC',
        //             'DDD' ]
        // };
        let tempAry = [];
        for (let key in witnessObj) {
            witnessObj[key].forEach((item) => {
                tempAry.push("('" + key + "','" + item + "')");
            });
        }
        let batchInsertSql = {
            text: "INSERT INTO witness (item,account) VALUES" + tempAry.toString()
        };
        pgclient.query(batchInsertSql, (res) => {
            //ROLLBACK
            if (pageUtility.shouldAbort(res, "batchInsertWitness")) {
                return;
            }
        });
    },

    //批量插入Parent
    batchInsertParent(parentAry){
        /* 
        let parentAry=[
            {
                item:"xxxx",
                parent:"AAA",
                is_witness:true,
                prototype:""
            },
        ];
        */
       //
        let tempAry=[];
        parentAry.forEach(item=>{
            tempAry.push("('"+item.item+"','"+item.parent+ "','"+ item.is_witness + "','"+ item.prototype  +"')");
        })        
        let batchInsertSql = {
            text: "INSERT INTO parents (item,parent,is_witness,prototype) VALUES "+tempAry.toString()
        };
        pgclient.query(batchInsertSql, (res) => {
            //ROLLBACK
            if(pageUtility.shouldAbort(res,"batchInsertParent")){
                return;
            }
        });
    },

    //批量插入账户
    batchInsertAccount(accountAry) {
        // accountAry=[{
        //         account: 'czr_341qh4575khs734rfi8q7s1kioa541mhm3bfb1mryxyscy19tzarhyitiot6',
        //         type: 1,
        //         balance: '0'
        //     },
        //     {
        //         account: 'czr_3n571ydsypy34ea5c7w6z7owyc1hxqgbnqa8em8p6bp6pkk3ii55j14btpn6',
        //         type: 1,
        //         balance: '0'
        //     }];
        let tempAry = [];
        accountAry.forEach((item) => {
            tempAry.push("('" + item.account + "'," + item.type + "," + item.balance + ")");
        });
        let batchInsertSql = {
            text: "INSERT INTO accounts (account,type,balance) VALUES" + tempAry.toString()
        };
        pgclient.query(batchInsertSql, (res) => {
            //ROLLBACK
            if (pageUtility.shouldAbort(res, "batchInsertAccount")) {
                return;
            }
        });
    },
    //批量插入 timestamp
    batchInsertTimestamp(timestampAry){
        // timestampAry=[{
        //         timestamp: '11111',
        //         type: 1,
        //         count: '0'
        //     },
        //     {
        //         timestamp: '2222',
        //         type: 1,
        //         balance: '0'
        //     }];
        let tempAry = [];
        timestampAry.forEach((item) => {
            tempAry.push("('" + item.timestamp + "'," + item.type + "," + item.count + ")");
        });
        //timestampAry
        let batchInsertSql = {
            text: "INSERT INTO timestamp (timestamp,type,count) VALUES" + tempAry.toString()
        };
        pgclient.query(batchInsertSql, (res) => {
            //ROLLBACK
            if (pageUtility.shouldAbort(res, "batchInsertTimestamp")) {
                return;
            }
        });
    },

    //批量插入Block
    batchInsertBlock(blockAry) {
        let tempAry = [];
        blockAry.forEach((item) => {
            tempAry.push(
                "('" +
                item.hash + "','" +
                item.from + "','" +
                item.to + "','" +
                item.amount + "','" +
                item.previous + "','" +
                item.witness_list_block + "','" +
                item.last_summary + "','" +
                item.last_summary_block + "','" +
                item.data + "'," +
                (Number(item.exec_timestamp) || 0) + ",'" +
                item.signature + "'," +
                (item.is_free === '1') + ",'" +
                item.is_witness + "','" +
                item.level + "','" +
                item.witnessed_level + "','" +
                item.best_parent + "'," +
                (item.is_stable === '1') + "," +
                Number(item.status) + "," +
                (item.is_on_mc === '1') + "," +
                (Number(item.mci) || 0) + "," +//item.mci可能为null
                (Number(item.latest_included_mci) || 0) + "," +//latest_included_mci 可能为0 =>12303
                (Number(item.mc_timestamp) || 0) +
                ")");

            if (!Number(item.exec_timestamp)) {
                logger.log("exec_timestamp 错了", item.mci, item.hash, item.latest_included_mci)
            }
            if (!Number(item.mci)) {
                logger.log("mci 错了", item.mci, item.hash, item.mci)
            }
            if (!Number(item.latest_included_mci)) {
                logger.log("latest_included_mci 错了", item.mci, item.hash, item.latest_included_mci)
            }
            if (!Number(item.mc_timestamp)) {
                logger.log("mc_timestamp 错了", item.mci, item.hash, item.mc_timestamp)
            }
        });

        let batchInsertSql = {
            text: 'INSERT INTO transaction(hash,"from","to",amount,previous,witness_list_block,last_summary,last_summary_block,data,exec_timestamp,signature,is_free,is_witness,level,witnessed_level,best_parent,is_stable,"status",is_on_mc,mci,latest_included_mci,mc_timestamp) VALUES' + tempAry.toString()
        };
        pgclient.query(batchInsertSql, (res) => {
            //ROLLBACK
            if (pageUtility.shouldAbort(res, "batchInsertBlock")) {
                return;
            }
        });
    },

    //批量更新Block
    batchUpdateBlock(updateBlockAry) {
        /*
        ﻿update transaction set
            is_free=tmp.is_free ,
            is_stable=tmp.is_stable ,
            status=tmp.status ,
            is_on_mc=tmp.is_on_mc
        from (values
              ('B5956299E1BC73B23A56D4CC1C58D42F2D494808FBDEE073259B48F571CCE97C',true,true,true,true,true,true),
              ('5F2B6FA741A33CDD506C5E150E37FCC73842082B24948A7159DFEB4C07500A08',true,true,true,true,true,true)
             )
        as tmp (hash,is_free,is_stable,status,is_on_mc)
        where
            transaction.hash=tmp.hash
        * */
        let tempAry = [];
        updateBlockAry.forEach((item) => {
            tempAry.push(
                "('" +
                item.hash + "'," +
                (item.is_free === '1') + "," +
                (item.is_stable === '1') + "," +
                item.status + "," +
                (item.is_on_mc === '1') + "," +
                (item.mc_timestamp) +
                ")");
        });
        let batchUpdateSql = 'update transaction set is_free=tmp.is_free , is_stable=tmp.is_stable , "status"=tmp.status , is_on_mc=tmp.is_on_mc , mc_timestamp=tmp.mc_timestamp from (values ' + tempAry.toString() +
            ') as tmp (hash,is_free,is_stable,"status",is_on_mc,mc_timestamp) where transaction.hash=tmp.hash';
        pgclient.query(batchUpdateSql, (res) => {
            //ROLLBACK
            if (pageUtility.shouldAbort(res, "batchUpdateBlock")) {
                return;
            }
        });
    },

    //单独更新
    aloneUpdateAccount(accountObj) {
        //需要先获取金额，然后再进行相加
        pgclient.query("Select * FROM accounts  WHERE account = $1", [accountObj.account], (data) => {
            let currentAccount = data[0];
            let targetBalance = BigNumber(currentAccount.balance).plus(accountObj.balance).toString(10);
            const sqlOptions = {
                text: "UPDATE accounts SET balance=$2 WHERE account=$1",
                values: [accountObj.account, targetBalance]
            };
            pgclient.query(sqlOptions, (res) => {
                let typeVal = Object.prototype.toString.call(res);
                if (typeVal === '[object Error]') {
                    logger.info(`Account更新失败 ${accountObj.account}`);
                    logger.info(res);
                    logger.info(`Account再次更新 ${accountObj.account}`);
                    pageUtility.aloneUpdateAccount(accountObj);
                } else {
                    // logger.info(`Account更新成功 ${accountObj.account}`);
                }
            });
        });
    },
    aloneUpdateTimestamp(timestampObj){
        //需要先获取time,然后再进行相加
        pgclient.query("Select * FROM timestamp  WHERE timestamp = $1", [timestampObj.timestamp], (data) => {
            let currentTime = data[0];
            let targetCount = BigNumber(currentTime.count).plus(timestampObj.count).toString(10);
            const sqlOptions = {
                text: "UPDATE timestamp SET count=$2 WHERE timestamp=$1",
                values: [timestampObj.timestamp, targetCount]
            };
            pgclient.query(sqlOptions, (res) => {
                let typeVal = Object.prototype.toString.call(res);
                if (typeVal === '[object Error]') {
                    logger.info(`timestamp 更新失败 ${timestampObj.timestamp}`);
                    logger.info(res);
                    logger.info(`timestamp 再次更新 ${timestampObj.timestamp}`);
                    pageUtility.aloneUpdateTimestamp(timestampObj);
                } else {
                    // logger.info(`timestamp 更新成功 ${timestampObj.timestamp}`);
                }
            });
        });
    },

    writeHub(arr) {
        let obj = {};
        for (let i = 0; i < arr.length; i++) {
            let currentItem = arr[i];
            if (!obj[currentItem.item]) {
                obj[currentItem.item] = {
                    item:currentItem.item,
                    prototype:[currentItem.prototype],
                    proto_total:1,
                    is_hub:false
                };
            } else {
                obj[currentItem.item].prototype.forEach(item=>{
                    if(currentItem.is_witness===false){
                        obj[currentItem.item].is_hub = true;//此时是枢纽
                    }
                });
                obj[currentItem.item].prototype.push(currentItem.prototype);
                obj[currentItem.item].proto_total++;
            }
    
        }
        /* 
        { '2319A50CBBAE851327E2B411430EE5718EB6415AC85FC6123853813C5F0F1D63': 
                { item: '2319A50CBBAE851327E2B411430EE5718EB6415AC85FC6123853813C5F0F1D63',
                    prototype: [ 
                        'ECE786885C9985104DB676A22442784DB1C7CBCC719CC3527B01417A950A4F88',
                        'ECE786885C9985104DB676A22442784DB1C7CBCC719CC3527B01417A950A4F88' 
                    ],
                    proto_total: 2,
                    is_hub: false 
                } 
        }
        */
        return obj;
    },
    updateHub(ary,fn){
        logger.info(`需要更新的枢纽unit数量为:`)
        logger.info(ary);
        let tempAry=[];
        ary.forEach(item=>{
            tempAry.push(
                "('" + 
                item + "'," +
                true +
                ")"
            )
        });
        let updateSql = 'update transaction set is_hub=tmp.is_hub from (values ' + tempAry.toString() +
        ') as tmp (hash,is_hub) where transaction.hash=tmp.hash';
        pgclient.query(updateSql, (res) => {
            //ROLLBACK
            if (pageUtility.shouldAbort(res, "updateHub")) {
                return;
            }
            fn();
        });
    },
    shouldAbort(err, sources) {
        let typeVal = Object.prototype.toString.call(err);
        if (typeVal === '[object Error]') {
            logger.error(`Error in ${sources}`);
            logger.error(err);
            pgclient.query('ROLLBACK', (roll_err) => {
                if (Object.prototype.toString.call(roll_err) === '[object Error]') {
                    logger.error(`Error rolling back client ${sources}`);
                    logger.error(roll_err);
                }
                logger.info(`已经ROLLBACK了`);
                // release the client back to the pool
                // pageUtility.readyGetData();
            })
        }
        return typeVal === '[object Error]'
    },
    formatTimestamp(mc_timestamp){
        return Math.floor(mc_timestamp/10);
    },
    isFail(obj) {
        //true 是失败的
        return (obj.is_stable === "1") && (obj.status !="0");
    }
};
pageUtility.init();