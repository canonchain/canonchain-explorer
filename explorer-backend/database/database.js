let BigNumber = require('bignumber.js').default;

let Czr = require("../czr/index");
let czr = new Czr();
// let profiler = require("./profiler");

let pgclient = require('./PG');// 引用上述文件
pgclient.getConnection();

//写日志
let log4js = require('./log_config');
let logger = log4js.getLogger('write_db');//此处使用category的值
let self;
const WITNESS_ARY = [
    'czr_321JDA7Brgbnm64iY2Xh8yHMEqEgBDutnoTKVLcxW2DJvJLUsS',
    'czr_32RmC9FsxjgLkgRQ58j3CdLg79cQE3KaY2wAT1QthBTU25vpd3',
    'czr_3MnXfV9hbmxVPdgfrPqgUiH6N7VbkSEhn5VqBCzBcxzTzkEUxU',
    'czr_3SrfL6LnPbtyf6sanrgtKs1BTYDN8taacGBVG37LfZVqXvRHbf',
    'czr_3igvJpdDiV4v5HxEzCifFcUpKvWsk3qWYNrTrbEVQztKbpyW1z',
    'czr_3tiy2jgoUENkszPjrHjQGfmopqwV5m9BcEh2Grb1zDYgSGnBF7',
    'czr_47E2jJ9rXVk5GRBcTLQMLQHXqsrnVcV5Kv2CWQJ6dnUaugnvii',
    'czr_4HhYojuHanxQ57thkSxwy5necRtDFwiQP7zqngBDZHMjqdPiMS',
    'czr_4MYTD6Xctkb6fEL8xUZxUwY6eqYB7ReEfB61YFrMHaZxsqLCKd',
    'czr_4URkteqck9rM8Vo6VzWmvKtMWoSH8vo4A1rADNAFrQHxAR23Tb',
    'czr_4ZJ8hBdR6dLv4hb1RPCmajdZf7ozkH1sHU18kT7xnXj4mjxxKE',
    'czr_4iig3fTcXQmz7bT2ztJPrpH8usrqGTN5zmygFqsCJQ4HgiuNvP'
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
let next_index = '';
let MCI_LIMIT = 100;
let stableCount = 0;//异步控制
let unitInsertAry = [];//不存在unit,插入[Db]
let unitUpdateAry = [];//存在的unit,更新[Db]
let accountsInsertAry = [];//不存在的账户,插入[Db]
let accountsUpdateAry = [];//存在的账户,更新[Db]
let parentsTotalAry = [];//储存预处理的parents信息[Db]
let witnessTotal = {};//储存预处理的见证人信息[Db]

let accountsTotal = {};//储存预处理的账户信息
let unitAryForSql = [];//作为语句，从数据库搜索已有unit

let timestampTotal = {};//储存预处理的时间戳信息
let timestampInsertAry = [];//没有的timestamp,插入[Db]
let timestampUpdateAry = [];//存在的timestamp,更新[Db]

let timestamp10Total = {};//储存预处理的时间戳信息
let timestamp10InsertAry = [];//没有的timestamp,插入[Db]
let timestamp10UpdateAry = [];//存在的timestamp,更新[Db]
// 操作稳定Unit相关变量 End

// 批量操作不稳定Unit相关变量 Start
let unstable_next_index = '';
let unstableCount = 0//异步控制;
let unstableUnitHashAry = [];//不稳定Unit Hash组成的数组
let unstableParentsAry = [];//需要插入的Parents
let unstableWitnessTotal = {};//需要预处理的Witness
let unstableInsertBlockAry = [];//需要插入的Block
let unstableUpdateBlockAry = [];//需要更新的Block
// 批量操作不稳定Unit相关变量 End


let pageUtility = {
    init() {
        self = this;
        let SearchOptions = {
            // TODO PKID改为基于MCI，索引时候需要考虑
            // text: "select mci from transaction where (is_stable = $1) order by pkid desc limit 1",
            text: "select mci from transaction where (is_stable = $1) order by mci desc limit 1",
            values: [true]
        };
        pgclient.query(SearchOptions, (data) => {
            if (data.length === 0) {
                dbStableMci = 0;
            } else if (data.length === 1) {
                if (firstGetDb) {
                    firstGetDb = !firstGetDb;
                    dbStableMci = Number(data[0].mci);
                } else {
                    dbStableMci = Number(data[0].mci) + 1;
                }
            } else if (data.length > 1) {
                logger.info("get dataCurrentMai is Error");
                return;
            }
            // logger.info(`当前数据库稳定MCI : 需要拿 ${dbStableMci} 去获取最新数据`);
            pageUtility.readyGetData();
        });
    },
    readyGetData() {
        getRpcTimer = setTimeout(function () {
            pageUtility.getRPC()
        }, 5000)
    },
    getRPC() {
        //获取网络中最新稳定的MCI
        logger.info(`获取网络中最新稳定的MCI-Start`);
        czr.request.status().then(function (status) {
            logger.info(`获取网络中最新稳定的MCI-Success `);
            logger.info(status);
            return status
        }).catch((err) => {
            logger.info(`获取网络中最新稳定的MCI-Error : ${err}`);
        })
            .then(function (status) {
                rpcStableMci = Number(status.last_stable_mci);
                if ((dbStableMci <= rpcStableMci) || (dbStableMci === 0)) {
                    isStableDone = dbStableMci < rpcStableMci ? false : true;
                    pageUtility.searchMci(status);
                } else {
                    getUnstableTimer = setTimeout(function () {
                        pageUtility.getUnstableBlocks();//查询所有不稳定 block 信息
                    }, 1000)
                }
            })
    },

    //插入Mci信息
    searchMci(status) {
        pgclient.query("Select * FROM global WHERE key = $1", ["last_stable_mci"], (data) => {
            if (data.length > 1) {
                logger.info("searchMci is Error");
                logger.info(data);
                return;
            } else {
                if (data.length === 0) {
                    logger.info("数据库无 LAST_STABLE_MCI ，第一次创建KEY_VALUE值");
                    pageUtility.insertMci(status);
                } else {
                    let currentMci = data[0];
                    if (Number(currentMci.last_stable_mci) !== Number(status.last_stable_mci)) {
                        logger.info("需要更新 LAST_STABLE_MCI");
                        pageUtility.updateMci(status);
                    } else {
                        pageUtility.getUnitByMci();//查询所有稳定 block 信息
                    }
                }
            }
        });
    },
    insertMci(status) {
        const insertVal = "('last_mci'," + Number(status.last_mci) + "),('last_stable_mci'," + Number(status.last_stable_mci) + ")";
        let globalFirstInsert = "INSERT INTO global (key,value) VALUES " + insertVal;
        pgclient.query(globalFirstInsert, (res) => {
            let typeVal = Object.prototype.toString.call(res);
            if (typeVal === '[object Error]') {
                logger.info(`第一次LAST_MCI插入失败 ${res}`);
            } else {
                logger.info(`第一次LAST_MCI插入成功`);
                pageUtility.getUnitByMci();//查询所有稳定 block 信息
            }
        })
    },
    updateMci(status) {
        let globalUpdateMci = "update global set value=temp.value from (values ('last_mci'," + Number(status.last_mci) + "),('last_stable_mci'," + Number(status.last_stable_mci) + ")) as temp(key,value) where global.key = temp.key"
        pgclient.query(globalUpdateMci, (res) => {
            let typeVal = Object.prototype.toString.call(res);
            if (typeVal === '[object Error]') {
                logger.info(`MCI插更新败 ${res}`);
            } else {
                logger.info(`MCI更新成功`);
                pageUtility.getUnitByMci();//查询所有稳定 block 信息
            }
        })

    },
    //插入稳定的Unit ------------------------------------------------ Start
    getUnitByMci() {
        logger.info(`通过 ${dbStableMci} ${MCI_LIMIT} ${next_index} 获取blocks ===============================`);
        // profiler.start();
        czr.request.stableBlocks(dbStableMci, MCI_LIMIT, next_index).then(function (data) {
            logger.info(`拿到了结果 ${dbStableMci} ${MCI_LIMIT} => ${data.next_index}`);
            // profiler.stop('RPC=> mciBlocks');
            // profiler.start();
            if (data.blocks) {
                data.blocks.forEach((item) => {
                    if (dbStableMci === 0) {
                        item.type = 1;
                    }
                    //写 is_witness
                    if (WITNESS_ARY.indexOf(item.from) > -1) {
                        item.is_witness = true;
                    } else {
                        item.is_witness = false;
                    }
                    unitInsertAry.push(item);
                });
                next_index = data.next_index ? data.next_index : '';
                // profiler.stop('mciBlocks后Blocks重写');
                pageUtility.validateBlocks();
            } else {
                logger.info(`mciBlocks : data.blocks => false`);
                logger.info(data);
                pageUtility.readyGetData();
            }
        }).catch((err) => {
            logger.info(`mciBlocks-Error : ${err}`);
        })
    },
    validateBlocks() {
        //如果是已经存在并且稳定的Block，需要移除掉(否则金额对不上)
        unitInsertAry.forEach(blockInfo => {
            unitAryForSql.push(blockInfo.hash);
        })
        let upsertBlockSql = {
            text: "select hash from transaction where is_stable=true and hash = ANY ($1)",
            values: [unitAryForSql]
        };
        let curIndex = 0;
        pgclient.query(upsertBlockSql, (blockRes) => {
            blockRes.forEach(dbItem => {
                curIndex = unitAryForSql.indexOf(dbItem.hash)
                unitInsertAry.splice(curIndex, 1);
                unitAryForSql.splice(curIndex, 1);
            });
            pageUtility.filterData();
        });

    },
    filterData() {
        // profiler.start(); 
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
            parentsTotalAry.push({
                item: blockInfo.hash,
                parent: blockInfo.parents,
                is_witness: blockInfo.is_witness
            });

            // 处理witness
            if (blockInfo.witness_list.length > 0) {
                witnessTotal[blockInfo.hash] = blockInfo.witness_list;
            }

            //DO timestamp 1秒
            //DO timestamp 10秒 timestamp10Total
            if (blockInfo.hasOwnProperty("stable_timestamp")) {
                if (!timestampTotal.hasOwnProperty(blockInfo.stable_timestamp)) {
                    timestampTotal[blockInfo.stable_timestamp] = {
                        timestamp: blockInfo.stable_timestamp,
                        type: 1,
                        count: 1
                    }
                } else {
                    timestampTotal[blockInfo.stable_timestamp].count += 1;
                }
                //10
                if (!timestamp10Total.hasOwnProperty(self.formatTimestamp(blockInfo.stable_timestamp))) {
                    timestamp10Total[self.formatTimestamp(blockInfo.stable_timestamp)] = {
                        timestamp: self.formatTimestamp(blockInfo.stable_timestamp),
                        type: 10,
                        count: 1
                    }
                } else {
                    timestamp10Total[self.formatTimestamp(blockInfo.stable_timestamp)].count += 1;
                }

            } else {
                logger.info(`stable_timestamp-Error`);
            }
        });
        /*
        * 处理账户
        * 处理Parent
        * 处理Block
        * */
        // profiler.stop('mciBlocks后数据组装');
        // profiler.start();
        logger.info(`数据过滤分装完成，开始发送异步操作`);
        pageUtility.searchBlockBaseDb();
        pageUtility.searchAccountBaseDb();
        pageUtility.searchTimestampBaseDb();
        pageUtility.searchTimestamp10BaseDb();
        pageUtility.searchWitnessBaseDb();
    },
    searchAccountBaseDb() {
        //处理账户
        let tempAccountAllAry = Object.keys(accountsTotal);
        let upsertSql = {
            text: "select account from accounts where account = ANY ($1)",
            values: [tempAccountAllAry]
        };
        // // profiler.start();
        pgclient.query(upsertSql, (accountRes) => {
            // // profiler.stop('SQL=> selectAccountFromAccounts');
            // // profiler.start();
            accountRes.forEach(item => {
                if (accountsTotal.hasOwnProperty(item.account)) {
                    accountsUpdateAry.push(accountsTotal[item.account]);
                    delete accountsTotal[item.account];
                }
            });
            Object.keys(accountsTotal).forEach(function (key) {
                accountsInsertAry.push(accountsTotal[key]);
            });
            // // profiler.stop('selectAccount后数据处理');
            logger.info(`Account完成     合计:${tempAccountAllAry.length} 更新:${accountsUpdateAry.length} 插入:${accountsInsertAry.length}`);
            pageUtility.stableInsertControl();
        });
    },
    searchTimestampBaseDb() {
        //处理Timestamp
        let tempTimesAllAry = Object.keys(timestampTotal);
        let upsertSql = {
            text: "select timestamp from timestamp where timestamp = ANY ($1)",
            values: [tempTimesAllAry]
        };
        // // profiler.start();
        pgclient.query(upsertSql, (timestampRes) => {
            // // profiler.stop('SQL=> searchTimestamp');
            // // profiler.start();
            timestampRes.forEach(item => {
                if (timestampTotal.hasOwnProperty(item.timestamp)) {
                    timestampUpdateAry.push(timestampTotal[item.timestamp]);
                    delete timestampTotal[item.timestamp];
                }
            });
            Object.keys(timestampTotal).forEach(function (key) {
                timestampInsertAry.push(timestampTotal[key]);
            });
            // // profiler.stop('searchTimestamp后的处理');
            logger.info(`Timestamp完成   合计:${tempTimesAllAry.length} 更新:${timestampUpdateAry.length} 插入:${timestampInsertAry.length}`);
            //处理Timestamp 结束
            pageUtility.stableInsertControl();
        });
    },
    searchTimestamp10BaseDb() {
        //处理 10Timestamp 开始
        let tempTimes10AllAry = Object.keys(timestamp10Total);
        let upsert10Sql = {
            text: "select timestamp from timestamp where timestamp = ANY ($1)",
            values: [tempTimes10AllAry]
        };
        // // profiler.start();
        pgclient.query(upsert10Sql, (timestampRes) => {
            // // profiler.stop('SQL=> searchTimestamp10');
            // // profiler.start();
            timestampRes.forEach(item => {
                if (timestamp10Total.hasOwnProperty(item.timestamp)) {
                    timestamp10UpdateAry.push(timestamp10Total[item.timestamp]);
                    delete timestamp10Total[item.timestamp];
                }
            });
            Object.keys(timestamp10Total).forEach(function (key) {
                timestamp10InsertAry.push(timestamp10Total[key]);
            });
            // // profiler.stop('searchTimestamp10后的处理');
            logger.info(`Timestamp10完成 合计:${tempTimes10AllAry.length} 更新:${timestamp10UpdateAry.length} 插入:${timestamp10InsertAry.length}`);
            //处理 10Timestamp 结束
            pageUtility.stableInsertControl();

        });
    },
    searchWitnessBaseDb() {
        // 处理witness  witnessTotal
        let witnessAllAry = Object.keys(witnessTotal);
        if (witnessAllAry.length) {
            let upsertWitnessSql = {
                text: "select item from witness where item = ANY ($1)",
                values: [witnessAllAry]
            };
            // // profiler.start();
            pgclient.query(upsertWitnessSql, (witnessRes) => {
                // // profiler.stop('SQL=> searchWitnessBaseDb');
                // // profiler.start();
                let hashWitnessObj = {};
                witnessRes.forEach((item) => {
                    hashWitnessObj[item.item] = item.item;
                });
                let beforeWitnsLeng = Object.keys(witnessTotal).length;
                for (let witness in hashWitnessObj) {
                    delete witnessTotal[witness];
                }
                // // profiler.stop('searchWitness后续操作');
                logger.info(`Witness完成     合计:${beforeWitnsLeng}, 已存在:${Object.keys(hashWitnessObj).length} 需处理:${Object.keys(witnessTotal).length}`);
                pageUtility.stableInsertControl();
            })
        } else {
            logger.info(`Witness完成     合计:0`);
            pageUtility.stableInsertControl();
        }
    },
    searchBlockBaseDb() {
        //处理Block unBlock插入后，在mci插入，可能有些是插入后的
        let upsertBlockSql = {
            text: "select hash from transaction where hash = ANY ($1)",
            values: [unitAryForSql]
        };
        // // profiler.start();
        pgclient.query(upsertBlockSql, (blockRes) => {
            // // profiler.stop('SQL=> searchBlockBaseDb');
            // // profiler.start();
            let beforParentLeng = Object.keys(parentsTotalAry).length;
            let hashParentObj = [];
            blockRes.forEach(dbItem => {
                for (let i = 0; i < unitInsertAry.length; i++) {
                    if (unitInsertAry[i].hash === dbItem.hash) {
                        unitUpdateAry.push(unitInsertAry[i]);//数据库存在的Block
                        unitInsertAry.splice(i, 1);

                        hashParentObj.push(dbItem.item);
                        parentsTotalAry.splice(i, 1);//除基因unit外，所有unit都肯定有parents；第一波插入数据库时，数据库没有unit，所以这句没有BUG

                        i--;
                    }
                }
            });
            unitInsertAry = [].concat(unitInsertAry);
            // // profiler.stop('searchBlock后处理Block和parents');
            logger.info(`Block完成       合计:${unitAryForSql.length}, 需更新:${unitUpdateAry.length}, 需插入:${unitInsertAry.length}`);
            logger.info(`Parents完成     合计:${beforParentLeng}, 已存在:${hashParentObj.length}, 需处理:${Object.keys(parentsTotalAry).length}`);//parentsTotalAry 是目标数据 
            pageUtility.writePrototype(parentsTotalAry, '1', pageUtility.stableInsertControl)
        });
    },
    stableInsertControl() {
        stableCount++;
        if (stableCount === 5) {
            // profiler.stop('异步需要的时间');
            stableCount = 0;
            pageUtility.batchInsertStable();
        }
    },
    batchInsertStable() {
        //批量提交
        // profiler.start();
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
            if (accountsUpdateAry.length > 0) {
                pageUtility.batchUpdateAccount(accountsUpdateAry)
            }
            if (timestampUpdateAry.length > 0) {
                pageUtility.batchUpdateTimestamp(timestampUpdateAry)
            }
            if (timestamp10UpdateAry.length > 0) {
                pageUtility.batchUpdateTimestamp(timestamp10UpdateAry)
            }


            pgclient.query('COMMIT', (err) => {
                if (pageUtility.shouldAbort(err, "操作不稳定BlockStart")) {
                    return;
                }
                logger.info("准备批量插入 END");
                // profiler.stop('SQL批量=> batchInsertStable');
                //归零数据
                unitInsertAry = [];
                accountsTotal = {};
                parentsTotalAry = [];
                witnessTotal = {};
                unitAryForSql = [];//用来从数据库搜索的数组
                accountsUpdateAry = [];
                unitUpdateAry = [];
                accountsInsertAry = [];

                timestampTotal = {};
                timestampInsertAry = [];
                timestampUpdateAry = [];

                timestamp10Total = {};
                timestamp10InsertAry = [];
                timestamp10UpdateAry = [];


                //Other
                isStableDone = dbStableMci < rpcStableMci ? false : true;
                logger.info(`本次小结：Db稳定MCI:${dbStableMci}, next_index:${next_index} ,RPC稳定Mci:${rpcStableMci},是否完成稳定MCI的插入:${isStableDone} 
                `);

                // if((dbStableMci%1000==0)&&dbStableMci!==0){
                //     console.log(dbStableMci);
                //     // profiler.print();
                // }
                if ((!isStableDone) || (next_index)) {
                    if (!next_index) {
                        //处理 xxx 和 isDone
                        dbStableMci++;
                        if (dbStableMci <= rpcStableMci) {
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
        unstableInsertBlockAry = [];//获取的不稳定block
        unstableUnitHashAry = [];//不稳定的unit hash 数组，sql用的
        unstableParentsAry = [];//不稳定的parents
        unstableWitnessTotal = {};
        unstableUpdateBlockAry = [];
        logger.info(`获取不稳定的Unit ${MCI_LIMIT} ${unstable_next_index} **********************************`);
        czr.request.unstableBlocks(MCI_LIMIT, unstable_next_index).then(function (data) {
            unstableInsertBlockAry = data.blocks;
            logger.info(`拿到了结果 Blocks.length:${unstableInsertBlockAry.length}  next_index: ${data.next_index}`)
            unstable_next_index = data.next_index ? data.next_index : '';
            if (unstableInsertBlockAry.length > 0) {
                //@A 拆分数据
                unstableInsertBlockAry.forEach(blockInfo => {
                    //写 is_witness
                    if (WITNESS_ARY.indexOf(blockInfo.from) != -1) {
                        blockInfo.is_witness = true;
                    } else {
                        blockInfo.is_witness = false;
                    }
                    //处理parents
                    // if (blockInfo.parents.length > 0) {}//不能加if，否则可能有问题啊；
                    unstableParentsAry.push({
                        item: blockInfo.hash,
                        parent: blockInfo.parents,
                        is_witness: blockInfo.is_witness
                    })

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

            } else {
                logger.info("unstable的blocks是空的,需要从头跑")
                logger.info(data);
                pageUtility.init();
            }
        })
    },
    //搜索哪些hash已经存在数据库中,哪些
    searchBlockFromDb() {
        let upsertBlockSql = {
            text: "select hash from transaction where hash = ANY ($1)",
            values: [unstableUnitHashAry]
        };
        pgclient.query(upsertBlockSql, (blockRes) => {
            let hashParentObj = [];//数据库中存在的parents
            let beforUnParentLen = unstableParentsAry.length;
            blockRes.forEach(dbItem => {
                for (let i = 0; i < unstableInsertBlockAry.length; i++) {
                    if (unstableInsertBlockAry[i].hash === dbItem.hash) {
                        //已经存在的,好像没有移除干净
                        unstableUpdateBlockAry.push(unstableInsertBlockAry[i]);
                        unstableInsertBlockAry.splice(i, 1);

                        hashParentObj.push(dbItem.hash);
                        unstableParentsAry.splice(i, 1);

                        i--;
                    }
                }
            });
            logger.info(`BlockHash 合计有:${unstableUnitHashAry.length} 表里有:${blockRes.length} 更新:${unstableUpdateBlockAry.length} 需插入:${unstableInsertBlockAry.length}`);
            logger.info(`Parents   合计有:${beforUnParentLen} 已存在:${hashParentObj.length} 需处理:${unstableParentsAry.length}`);
            // pageUtility.unstableInsertControl();
            pageUtility.writePrototype(unstableParentsAry, '2', pageUtility.unstableInsertControl);
        });
    },
    //搜索哪些Witness已经存在数据库中,并把 unstableWitnessTotal 改为最终需要处理的数据
    searchWitnessFromDb() {
        let unstableWitnessAllAry = Object.keys(unstableWitnessTotal);
        if (unstableWitnessAllAry.length) {
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
        } else {
            logger.info(`Witness 合计有:0`);
            pageUtility.unstableInsertControl();
        }
    },
    unstableInsertControl() {
        unstableCount++;
        if (unstableCount === 2) {
            unstableCount = 0;
            pageUtility.batchInsertUnstable();
        }
    },
    batchInsertUnstable() {
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
                if (pageUtility.shouldAbort(err, "操作不稳定BlockStart")) {
                    return;
                }
                logger.info(`批量插入不稳定 END  ${Boolean(unstable_next_index)} \n`);
                if (unstable_next_index) {
                    //没有获取完，需要获取
                    pageUtility.getUnstableBlocks();
                } else {
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
    batchInsertParent(parentAry) {
        /* 
        let parentAry=[
            {
                item:"xxxx",
                parent:"AAA",
                is_witness:true
            },
        ];
        */
        let tempAry = [];
        parentAry.forEach(item => {
            tempAry.push("('" + item.item + "','" + item.parent + "','" + item.is_witness + "','')");
        })
        let batchInsertSql = {
            text: "INSERT INTO parents (item,parent,is_witness,prototype) VALUES " + tempAry.toString()
        };
        pgclient.query(batchInsertSql, (res) => {
            //ROLLBACK
            if (pageUtility.shouldAbort(res, "batchInsertParent")) {
                logger.info(`batchInsertSql发生错误的sql如下`)
                logger.info(batchInsertSql);
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
    batchInsertTimestamp(timestampAry) {
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
                item.hash + "'," +
                Number(item.type) + ",'" +
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
                (item.is_stable === 1) + "," +
                Number(item.status) + "," +
                (item.is_on_mc === 1) + "," +
                Number(Boolean(item.mci != 'null') ? item.mci : -1) + "," +//item.mci可能为null
                (Number(item.latest_included_mci) || 0) + "," +//latest_included_mci 可能为0 =>12303
                (Number(item.mc_timestamp) || 0) + "," +
                (Number(item.stable_timestamp) || 0) +
                ")");
        });

        let batchInsertSql = {
            text: 'INSERT INTO transaction(hash,type,"from","to",amount,previous,witness_list_block,last_summary,last_summary_block,data,exec_timestamp,signature,is_free,is_witness,level,witnessed_level,best_parent,is_stable,"status",is_on_mc,mci,latest_included_mci,mc_timestamp,stable_timestamp) VALUES' + tempAry.toString()
        };
        pgclient.query(batchInsertSql, (res) => {
            //ROLLBACK
            if (pageUtility.shouldAbort(res, "batchInsertBlock")) {
                logger.info(batchInsertSql)
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
                (item.is_stable === 1) + "," +
                Number(item.status) + "," +
                (item.is_on_mc === 1) + "," +
                (item.mc_timestamp) + "," +
                (item.stable_timestamp) + "," +
                Number(Boolean(item.mci != 'null') ? item.mci : -1) + //item.mci可能为null
                ")");
        });
        let batchUpdateSql = 'update transaction set is_free=tmp.is_free , is_stable=tmp.is_stable , "status"=tmp.status , is_on_mc=tmp.is_on_mc , mc_timestamp=tmp.mc_timestamp , stable_timestamp=tmp.stable_timestamp, mci=tmp.mci from (values ' + tempAry.toString() +
            ') as tmp (hash,is_free,is_stable,"status",is_on_mc,mc_timestamp,stable_timestamp,mci) where transaction.hash=tmp.hash';
        pgclient.query(batchUpdateSql, (res) => {
            //ROLLBACK
            if (pageUtility.shouldAbort(res, "batchUpdateBlock")) {
                return;
            }
        });
    },

    //批量更新账户
    batchUpdateAccount(accountAry) {
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
    batchUpdateTimestamp(timestampAry) {
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

    //写原型
    writePrototype(sources_ary, flag, fn) {
        // // profiler.start();
        //falg : 1=>稳定 2=>不稳定
        logger.info(`写原型数据 Start`)
        let tempAry = [];//辅助展开parents作用
        let inDbParents = [];//已经在数据里的数据
        let allUnit = [];//当前所有的unit
        let allParent = [];//当前所有的parent
        sources_ary.forEach(item => {
            //展开parents
            if (item.parent.length > 0) {
                item.parent.forEach(childrenItem => {
                    tempAry.push({
                        item: item.item,
                        parent: childrenItem,//单个parents
                        is_witness: item.is_witness
                    });
                    allUnit.push(item.item);//判断parent的值有哪里是已经存在allUnit的
                    allParent.push(childrenItem);//判断parent的值有哪里是已经存在allParent的
                })
            }
        })
        sources_ary = tempAry;
        if (flag == "1") {
            //赋值稳定的
            parentsTotalAry = sources_ary;
        } else if (flag == "2") {
            //赋值不稳定的
            unstableParentsAry = sources_ary;
        }
        // // profiler.stop('SearchParents后续操作');
        // logger.info(`写原型数据 End`)
        fn();
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
                logger.info(`已经ROLLBACK了  ${sources}`);
                //TODO.给改为结束进程
                // release the client back to the pool
                // pageUtility.init();
            })
        }
        return typeVal === '[object Error]'
    },
    formatTimestamp(stable_timestamp) {
        return Math.floor(stable_timestamp / 10);
    },
    isFail(obj) {
        //true 是失败的
        return (obj.is_stable === 1) && (obj.status !== 0);
    }
};
pageUtility.init();