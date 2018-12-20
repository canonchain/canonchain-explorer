let BigNumber = require('bignumber.js').default;

let Czr = require("../czr/index");
let czr = new Czr();
let profiler = require("./profiler");

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
let firstGetDb = true;
let dbStableMci,        //本地数据库的最高稳定MCI
    rpcStableMci;       //RPC接口请求到的最高稳定MCI
// let cartStep = 0;       //如果数据过多时候，每批处理地数据，0是每次获取一个 ====> 需求改了，数据过大，不能一次插入多个MCI下的blocks 
let isStableDone = false;//稳定的MCI是否插入完成
//辅助数据 End

// 操作稳定Unit相关变量 Start
let next_index          = '';
let MCI_LIMIT           = 100;
let stableCount         = 0;//异步控制
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
let unstable_next_index     = '';
let unstableCount           = 0//异步控制;
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
                if(firstGetDb){
                    firstGetDb = !firstGetDb;
                    dbStableMci = Number(data[0].mci);
                }else{
                    dbStableMci = Number(data[0].mci) + 1;
                }
            } else if (data.length > 1) {
                logger.info("get dataCurrentMai is Error");
                return;
            }
            logger.info(`当前数据库稳定MCI : 需要拿 ${dbStableMci} 去获取最新数据`);
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
            if ((dbStableMci <= rpcStableMci) || (dbStableMci ===0)) {
                isStableDone = dbStableMci < rpcStableMci ? false : true;
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
                logger.info(data);
                return;
            }else{
                let currentMci = data[0];
                if (data.length === 0) {
                    logger.info("数据库无Mci，第一次插入");
                    pageUtility.insertMci(status);
                } else if (data.length === 1) {
                    if(Number(currentMci.last_stable_mci)!==Number(status.last_stable_mci)){
                        logger.info("需要更新MCI");
                        pageUtility.insertMci(status);
                    }else{
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
                logger.info(`MCI插入失败 ${res}`);
            } else {
                logger.info(`MCI插入成功`);
                pageUtility.getUnitByMci();//查询所有稳定 block 信息
            }
        })
    },
    //插入稳定的Unit ------------------------------------------------ Start
    getUnitByMci(){
        logger.info(`通过 ${dbStableMci} ${MCI_LIMIT} ${next_index} 获取blocks ===============================`);
        profiler.start();
        czr.request.mciBlocks(dbStableMci,MCI_LIMIT,next_index).then(function (data) {
            logger.info(`拿到了结果 ${dbStableMci} ${MCI_LIMIT} => ${data.next_index}`);
            profiler.stop('RPC=> mciBlocks');
            profiler.start();
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
                next_index = data.next_index ? data.next_index : '';
                profiler.stop('mciBlocks后Blocks重写');
                pageUtility.filterData();
            }else{
                logger.info(`mciBlocks : data.blocks => false`);
                logger.info(data);
                pageUtility.readyGetData();
            }
        }).catch((err)=>{
            logger.info(`mciBlocks-Error : ${err}`);
        })
    },
    validateBlocks(){

    },
    filterData(){
        profiler.start(); 
        //2、根据稳定Units数据，筛选Account Parent Witness Timestamp，方便后续储存
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
            } 
        });
        /*
        * 处理账户
        * 处理Parent
        * 处理Block
        * */
       profiler.stop('mciBlocks后数据组装');
       profiler.start();
       logger.info(`数据过滤分装完成，开始发送异步操作`);
       pageUtility.searchBlockBaseDb();
       pageUtility.searchAccountBaseDb();
       pageUtility.searchTimestampBaseDb();
       pageUtility.searchTimestamp10BaseDb();
       pageUtility.searchWitnessBaseDb();
    },
    searchAccountBaseDb(){
        //处理账户
        let tempAccountAllAry = Object.keys(accountsTotal); 
        let upsertSql = {
            text: "select account from accounts where account = ANY ($1)",
            values: [tempAccountAllAry]
        };
        // profiler.start();
        pgclient.query(upsertSql, (accountRes) => {
            // profiler.stop('SQL=> selectAccountFromAccounts');
            // profiler.start();
            accountRes.forEach(item => {
                if (accountsTotal.hasOwnProperty(item.account)) {
                    accountsUpdateAry.push(accountsTotal[item.account]);
                    delete accountsTotal[item.account];
                }
            });
            Object.keys(accountsTotal).forEach(function(key){
                accountsInsertAry.push(accountsTotal[key]);
            });
            // profiler.stop('selectAccount后数据处理');
            logger.info(`Account完成     合计:${tempAccountAllAry.length} 更新:${accountsUpdateAry.length} 插入:${accountsInsertAry.length}`);
            pageUtility.stableInsertControl();
        });
    },
    searchTimestampBaseDb(){
        //处理Timestamp
        let tempTimesAllAry = Object.keys(timestampTotal); 
        let upsertSql = {
            text: "select timestamp from timestamp where timestamp = ANY ($1)",
            values: [tempTimesAllAry]
        };
        // profiler.start();
        pgclient.query(upsertSql, (timestampRes) => {
            // profiler.stop('SQL=> searchTimestamp');
            // profiler.start();
            timestampRes.forEach(item => {
                if (timestampTotal.hasOwnProperty(item.timestamp)) {
                    timestampUpdateAry.push(timestampTotal[item.timestamp]);
                    delete timestampTotal[item.timestamp];
                }
            });
            Object.keys(timestampTotal).forEach(function(key){
                timestampInsertAry.push(timestampTotal[key]);
            });
            // profiler.stop('searchTimestamp后的处理');
            logger.info(`Timestamp完成   合计:${tempTimesAllAry.length} 更新:${timestampUpdateAry.length} 插入:${timestampInsertAry.length}`);
            //处理Timestamp 结束
            pageUtility.stableInsertControl();
        });
    },
    searchTimestamp10BaseDb(){
        //处理 10Timestamp 开始
        let tempTimes10AllAry = Object.keys(timestamp10Total); 
        let upsert10Sql = {
            text: "select timestamp from timestamp where timestamp = ANY ($1)",
            values: [tempTimes10AllAry]
        };
        // profiler.start();
        pgclient.query(upsert10Sql, (timestampRes) => {
            // profiler.stop('SQL=> searchTimestamp10');
            // profiler.start();
            timestampRes.forEach(item => {
                if (timestamp10Total.hasOwnProperty(item.timestamp)) {
                    timestamp10UpdateAry.push(timestamp10Total[item.timestamp]);
                    delete timestamp10Total[item.timestamp];
                }
            });
            Object.keys(timestamp10Total).forEach(function(key){
                timestamp10InsertAry.push(timestamp10Total[key]);
            }); 
            // profiler.stop('searchTimestamp10后的处理');
            logger.info(`Timestamp10完成 合计:${tempTimes10AllAry.length} 更新:${timestamp10UpdateAry.length} 插入:${timestamp10InsertAry.length}`);
            //处理 10Timestamp 结束
            pageUtility.stableInsertControl();

        });
    },
    searchWitnessBaseDb(){
        // 处理witness  witnessTotal
        let witnessAllAry = Object.keys(witnessTotal);
        if(witnessAllAry.length){
            let upsertWitnessSql = {
                text: "select item from witness where item = ANY ($1)",
                values: [witnessAllAry]
            };
            // profiler.start();
            pgclient.query(upsertWitnessSql, (witnessRes) => {
                // profiler.stop('SQL=> searchWitnessBaseDb');
                // profiler.start();
                let hashWitnessObj = {};
                witnessRes.forEach((item) => {
                    hashWitnessObj[item.item] = item.item;
                });
                let beforeWitnsLeng = Object.keys(witnessTotal).length;
                for (let witness in hashWitnessObj) {
                    delete witnessTotal[witness];
                }
                // profiler.stop('searchWitness后续操作');
                logger.info(`Witness完成     合计:${beforeWitnsLeng}, 已存在:${Object.keys(hashWitnessObj).length} 需处理:${Object.keys(witnessTotal).length}`);
                pageUtility.stableInsertControl();
            })
        }else{
            logger.info(`Witness完成     合计:0`);
            pageUtility.stableInsertControl();
        }
    },
    searchBlockBaseDb(){
        //处理Block unBlock插入后，在mci插入，可能有些是插入后的
        let upsertBlockSql = {
            text: "select hash from transaction where hash = ANY ($1)",
            values: [unitAryForSql]
        };
        // profiler.start();
        pgclient.query(upsertBlockSql, (blockRes) => {
            // profiler.stop('SQL=> searchBlockBaseDb');
            // profiler.start();
            let beforParentLeng = Object.keys(parentsTotalAry).length;
            let hashParentObj = [];
            blockRes.forEach(dbItem => {
                for (let i= 0;i<unitInsertAry.length;i++){
                    if(unitInsertAry[i].hash === dbItem.hash){
                        unitUpdateAry.push(unitInsertAry[i]);//数据库存在的Block
                        unitInsertAry.splice(i,1);

                        hashParentObj.push(dbItem.item);
                        parentsTotalAry.splice(i,1);//除基因unit外，所有unit都肯定有parents；第一波插入数据库时，数据库没有unit，所以这句没有BUG

                        i--;
                    }
                }
            });
            unitInsertAry = [].concat(unitInsertAry);
            // profiler.stop('searchBlock后处理Block和parents');
            logger.info(`Block完成       合计:${unitAryForSql.length}, 需更新:${unitUpdateAry.length}, 需插入:${unitInsertAry.length}`);
            logger.info(`Parents完成     合计:${beforParentLeng}, 已存在:${hashParentObj.length}, 需处理:${Object.keys(parentsTotalAry).length}`);//parentsTotalAry 是目标数据 
            pageUtility.writePrototype(parentsTotalAry ,'1', pageUtility.stableInsertControl)
        });
    },
    stableInsertControl(){
        stableCount++;
        if(stableCount === 5){
            profiler.stop('异步需要的时间');
            stableCount = 0;
            pageUtility.batchInsertStable();
        }
    },
    batchInsertStable(){
        //批量提交
        profiler.start();
        logger.info("准备批量插入 START");
        pgclient.query('BEGIN', (res) => {
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
                pageUtility.batchInsertAccount(accountsInsertAry);
            }
            if (timestampInsertAry.length > 0) {
                pageUtility.batchInsertTimestamp(timestampInsertAry);
            }
            if (timestamp10InsertAry.length > 0) {
                pageUtility.batchInsertTimestamp(timestamp10InsertAry);
            }
            if (parentsTotalAry.length > 0) {
                pageUtility.batchInsertParent(parentsTotalAry);
            }
            if (Object.keys(witnessTotal).length > 0) {
                pageUtility.batchInsertWitness(witnessTotal);
            }

            if (unitInsertAry.length > 0) {
                pageUtility.batchInsertBlock(unitInsertAry);
            }

            if (unitUpdateAry.length > 0) {
                pageUtility.batchUpdateBlock(unitUpdateAry);
            }

            /* 
            批量更新账户、       accountsUpdateAry
            批量更新timestamp
            */
           if(accountsUpdateAry.length > 0){
               pageUtility.batchUpdateAccount(accountsUpdateAry)
           }
           if(timestampUpdateAry.length > 0){
                pageUtility.batchUpdateTimestamp(timestampUpdateAry)
            }
            if(timestamp10UpdateAry.length > 0){
                pageUtility.batchUpdateTimestamp(timestamp10UpdateAry)
            }


            pgclient.query('COMMIT', (err) => {
                logger.info("准备批量插入 END");
                profiler.stop('SQL批量=> batchInsertStable');
                // logger.info(`批量插入稳结束, 需更新Account:${accountsUpdateAry.length} 需更新timestamp:${timestampUpdateAry.length} 需更新timestamp10:${timestamp10UpdateAry.length}`);

                // profiler.start();
                // accountsUpdateAry.forEach(account => {
                //     pageUtility.aloneUpdateAccount(account)
                // });
                // timestampUpdateAry.forEach(timestamp => {
                //     pageUtility.aloneUpdateTimestamp(timestamp)
                // });
                // timestamp10UpdateAry.forEach(timestamp => {
                //     pageUtility.aloneUpdateTimestamp(timestamp);
                // });
                // profiler.stop('SQL=> updateAccountTimestamp');
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
                isStableDone = dbStableMci < rpcStableMci ? false : true;
                logger.info(`本次小结：Db稳定MCI:${dbStableMci}, next_index:${next_index} ,RPC稳定Mci:${rpcStableMci},是否完成稳定MCI的插入:${isStableDone} 
                `);

                if((dbStableMci%1000==0)&&dbStableMci!==0){
                    console.log(dbStableMci);
                    profiler.print();
                }
                if (!isStableDone) {
                    if(!next_index){
                        //处理 xxx 和 isDone
                        dbStableMci++;
                        if (dbStableMci  <= rpcStableMci) {
                            //数量太多，需要分批插入
                            isStableDone = false;
                        } else {
                            //下一次可以插入完
                            isStableDone = true;
                        }
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
        unstableInsertBlockAry  = [];//获取的不稳定block
        unstableUnitHashAry     = [];//不稳定的unit hash 数组，sql用的
        unstableParentsAry      = [];//不稳定的parents
        unstableWitnessTotal    = {};
        unstableUpdateBlockAry  = [];
        logger.info(MCI_LIMIT,unstable_next_index,"获取不稳定的Unit**********************************");
        czr.request.unstableBlocks(MCI_LIMIT,unstable_next_index).then(function (data) {
            logger.info(`拿到了结果`)
            unstableInsertBlockAry = data.blocks;
            unstable_next_index = data.next_index ? data.next_index : '';
            if(unstableInsertBlockAry.length>0){
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
               logger.info("数据分装完成，准备异步操作");
                pageUtility.searchBlockFromDb();
                pageUtility.searchWitnessFromDb();
                
            }else{
                logger.info("unstable的blocks是空的,需要从头跑")
                logger.info(data);
                pageUtility.init();
            }
        })
    },
    //搜索哪些hash已经存在数据库中,哪些
    searchBlockFromDb(){
        let upsertBlockSql = {
            text: "select hash from transaction where hash = ANY ($1)",
            values: [unstableUnitHashAry]
        };
        pgclient.query(upsertBlockSql, (blockRes) => {
            let hashParentObj = [];//数据库中存在的parents
            let beforUnParentLen = unstableParentsAry.length;
            blockRes.forEach(dbItem => {
                for (let i= 0;i<unstableInsertBlockAry.length;i++){
                    if(unstableInsertBlockAry[i].hash === dbItem.hash){
                        unstableUpdateBlockAry.push(unstableInsertBlockAry[i]);
                        unstableInsertBlockAry.splice(i,1);

                        hashParentObj.push(dbItem.hash);
                        unstableParentsAry.splice(i,1);

                        i--;
                    }
                }
            });
            logger.info(`BlockHash 合计有:${unstableUnitHashAry.length} 表里有:${blockRes.length} 更新:${unstableUpdateBlockAry.length} 需插入:${unstableInsertBlockAry.length}`);
            logger.info(`Parents   合计有:${beforUnParentLen} 已存在:${hashParentObj.length} 需处理:${unstableParentsAry.length}`);
            // pageUtility.unstableInsertControl();
            pageUtility.writePrototype(unstableParentsAry ,'2', pageUtility.unstableInsertControl);
        });
    },
    //搜索哪些Witness已经存在数据库中,并把 unstableWitnessTotal 改为最终需要处理的数据
    searchWitnessFromDb(){
        let unstableWitnessAllAry = Object.keys(unstableWitnessTotal);
        if(unstableWitnessAllAry.length){
            let upsertWitnessSql = {
                text: "select item from witness where item = ANY ($1)",
                values: [unstableWitnessAllAry]
            };
            pgclient.query(upsertWitnessSql, (witnessRes) => {
                let hashWitnessObj = {};
                witnessRes.forEach((item) => {
                    hashWitnessObj[item.item] = item.item;
                });
                let beforeUnWitLen = Object.keys(unstableWitnessTotal).length;
                for (let witness in hashWitnessObj) {
                    delete unstableWitnessTotal[witness];
                }
                logger.info(`Witness 合计有:${beforeUnWitLen} 已存在${Object.keys(hashWitnessObj).length} 需处理:${Object.keys(unstableWitnessTotal).length}`);
                pageUtility.unstableInsertControl();
            })
        }else{
            logger.info(`Witness 合计有:0`);
            pageUtility.unstableInsertControl();
        }
    },
    unstableInsertControl(){
        unstableCount++;
        if(unstableCount === 2){
            unstableCount = 0;
            pageUtility.batchInsertUnstable();
        }
    },
    batchInsertUnstable(){
        //开始插入数据库
        logger.info("批量插入不稳定 START");
        pgclient.query('BEGIN', (res) => {
            if (pageUtility.shouldAbort(res, "操作不稳定BlockStart")) {
                return;
            }
            /*
            * 批量插入 Parent、   unstableParentsAry
            * 批量插入 Witness   unstableWitnessTotal:object
            * 批量插入 Block、    unstableInsertBlockAry
            * 批量更新 Block、    unstableUpdateBlockAry
            * */
            if (unstableParentsAry.length > 0) {
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
                logger.info(`批量插入不稳定 END  ${Boolean(unstable_next_index)}`);
                if(unstable_next_index){
                    //没有获取完，需要获取
                    pageUtility.getUnstableBlocks();
                }else{
                    //已经获取完毕了
                    pageUtility.init();
                }
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
                (Number(item.mci) || -1) + "," +//item.mci可能为null
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
        update transaction set
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
                Number(item.status) + "," +
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

    //批量更新账户
    batchUpdateAccount(accountAry){
        let tempAry = [];
        accountAry.forEach((item) => {
            tempAry.push(
                "('" +
                item.account + "'," +
                Number(item.balance) +
                ")");
        });
        let batchUpdateSql = 'update accounts set balance = accounts.balance + tmp.balance from (values ' + tempAry.toString() +
            ') as tmp (account,balance) where accounts.account=tmp.account';
        pgclient.query(batchUpdateSql, (res) => {
            //ROLLBACK
            if (pageUtility.shouldAbort(res, "batchUpdateAccount")) {
                return;
            }
        });
    },
    batchUpdateTimestamp(timestampAry){ 
        let tempAry = [];
        timestampAry.forEach((item) => {
            tempAry.push(
                "(" +
                item.timestamp + "," +
                Number(item.count) + 
                ")");
        });
        let batchUpdateSql = 'update timestamp set count= timestamp.count + tmp.count from (values ' + tempAry.toString() +
            ') as tmp (timestamp,count) where timestamp.timestamp=tmp.timestamp';
        pgclient.query(batchUpdateSql, (res) => {
            //ROLLBACK
            if (pageUtility.shouldAbort(res, "batchUpdateTimestamp")) {
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
                }
            });
        });
    },

    //写原型
    writePrototype(sources_ary,flag,fn){
        // profiler.start();
        //falg : 1=>稳定 2=>不稳定
        logger.info(`写原型数据 Start`)
        let tempAry     = [];//辅助展开parents作用
        let inDbParents = [];//已经在数据里的数据
        let allUnit     = [];//当前所有的unit
        let allParent   = [];//当前所有的parent
        sources_ary.forEach(item=>{
            //展开parents
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
               if(inDbParents.indexOf(item.parent)<0){
                    inDbParents.push(item.parent);//存在Db里
               }
           }
       })
        //profiler.stop("writePrototype前置处理");
       let searchParentsSql = {
            text: "select item,parent,is_witness,prototype from parents where item = ANY ($1)",
            values: [inDbParents]
        };
        // profiler.start();
        pgclient.query(searchParentsSql, (parentsRes) => {
            // profiler.stop("SQL=> SearchFromParents");
            // profiler.start();
            let itemIndex=0;//索引
            let dbHashParent = [];//数据库查出来的
            let targetDbParent = {};
            logger.info(`展开后需插表parents:${allUnit.length} 预估数据库中存在Parent的Item数${inDbParents.length} (${flag=='1'?'稳定的':'不稳定的'}) 数据库中存在parent条数:${parentsRes.length}`)
            logger.info("parent Start")
            //根据数据库的写当前的prototype
            if(parentsRes.length>0){
                //测试的START
                let hubObj = pageUtility.writeHub(parentsRes);//解决dbHashParent里可能多条相同parent TODO 需要优化，现在3S时间
                logger.info("   hubObj End")
                parentsRes.forEach(item=>{//4W- 3ms
                    dbHashParent.push(item.item);
                });
                logger.info("   dbHashParent End")
                //TODO 下面时间是2S
                sources_ary.forEach((currentItem,index)=>{//0.64
                    /* 
                        如果DE指向C，C指向AB；
                        C的is_witness为true，则DE的prototype值均为C；
                        C的is_witness为false,那么
                            D的prototype值是AB;
                            E的prototype值是AB;

                        如果C后面不是DE，而是单独一个F；
                        C的is_witness为true，则F的prototype值为C；
                        C的is_witness为false,
                            那么F的prototype为AB
                    */
                    itemIndex = dbHashParent.indexOf(currentItem.parent);
                    if(itemIndex>-1){
                        targetDbParent = parentsRes[itemIndex]
                        if(targetDbParent.is_witness){
                            //当前是witness
                            sources_ary[index].prototype = targetDbParent.item;
                        }else{
                            //非witness
                            sources_ary[index].prototype = hubObj[targetDbParent.item].prototype;
                        }
                    }

                }) 
                logger.info("   sources_ary End")
                //测试的END
            }
            logger.info("parent End")

            //根据当前的写当前的prototype
            let currentItemIndex=0;
            let targetLocItem={};
            logger.info("local Start")
            sources_ary.forEach((currentItem,index)=>{//0.64
                currentItemIndex = allUnit.indexOf(currentItem.parent);
                if(currentItemIndex>-1){
                    targetLocItem =sources_ary[currentItemIndex];
                    if(currentItem.prototype){
                        logger.info(`currentItem.prototype可能是空的:${currentItem.prototype} 断言成功？成功就要改代码`)
                    }
                    if(targetLocItem.is_witness){
                        currentItem.prototype = targetLocItem.item;//TODO 感觉有BUG，currentItem.prototype可能已经有值了
                    }else{
                        /* 
                            需要判断是否为枢纽，
                                1.非见证人
                                2.多个原型
                            =如果多个原型，则取出对应的原型
                                fn(sources_ary , targetLocItem.item) => 'B,C,D'
                        */
                       //如果是枢纽，prototype的是item.item;
                       currentItem.prototype = pageUtility.getLocalHubInfo(sources_ary,targetLocItem.prototype);//0.64
                    }
                }
            })
            logger.info("local End") 
            //赋值对应的数据
            if(flag == "1"){
                //赋值稳定的
                parentsTotalAry = sources_ary;
            }else if(flag =="2"){
                //赋值不稳定的
                unstableParentsAry = sources_ary;
            }
            // profiler.stop('SearchParents后续操作');
            logger.info(`写原型数据 End`)
            fn();
        })
    },
    writeHub(arr) {
        logger.info("writeHub Start")
        let obj = {};
        for (let i = 0; i < arr.length; i++) {
            let currentItem = arr[i];
            //currentItem.prototype 可能是 'AAA,BBB'
            let protoAry = currentItem.prototype.split(',');
            if (!obj[currentItem.item]) {
                obj[currentItem.item] = {
                    item:currentItem.item,
                    // prototype: (protoAry.length>1 ? protoAry :[currentItem.prototype])
                    prototype : protoAry
                };
            } else {
                protoAry.forEach(item=>{
                    if(obj[currentItem.item].prototype.indexOf(item)<0){
                        obj[currentItem.item].prototype.push(item);
                    }
                })
            }
    
        }
        /* 
        { '2319A50CBBAE851327E2B411430EE5718EB6415AC85FC6123853813C5F0F1D63': 
                { 
                    item: '2319A50CBBAE851327E2B411430EE5718EB6415AC85FC6123853813C5F0F1D63',
                    prototype: [ 
                        'ECE786885C9985104DB676A22442784DB1C7CBCC719CC3527B01417A950A4F88',
                        'ECE786885C9985104DB676A22442784DB1C7CBCC719CC3527B01417A950A4F88' 
                    ]
                } 
        }
        */
       logger.info("writeHub End")
       for(let key in obj){
           obj[key].prototype = obj[key].prototype.join(',');
       }
       logger.info("writeHub 格式化")
        return obj;
    },
    getLocalHubInfo(ary,hash){
        let tempProto=[];
        ary.forEach(item=>{
            if(item.item===hash){
                let proAry = item.prototype.split(",");
                proAry.forEach(childItem=>{
                    //没有的前提下，再push
                    if(tempProto.indexOf(childItem)<0){
                        tempProto.push(childItem);
                    }
                })
            }
        })
        return tempProto.join(",");
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
                // pageUtility.init();
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