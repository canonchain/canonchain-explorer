let BigNumber = require('bignumber.js').default;

let Czr = require("../czr/index");
let czr = new Czr();

let pgclient = require('./PG');// 引用上述文件
pgclient.getConnection();

//写日志
let log4js = require('./log_config');
let logger = log4js.getLogger('write_db');//此处使用category的值

let dbStableMci;//本地数据库的最高稳定MCI
let rpcStableMci;//RPC接口请求到的最高稳定MCI

let cartMci = 0;//大量数据分批存储时候，用来记录MCI
let tempMci;//大量数据分批存储时候，临时MCI
let isStableDone = false;//稳定的MCI是否插入完成

let stableUnitAry;//用来保存稳定tran的数组；
let getRpcTimer = null,
    getUnstableTimer = null;

let accountsTotal = {};
let parentsTotal = {};
let witnessTotal = {};

let pageUtility = {
    init() {
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
        }, 1500)
    },
    getRPC() {
        //获取网络中最新稳定的MCI
        logger.info(`获取网络中最新稳定的MCI-Start`);
        czr.request.status().then(function (status) {
            logger.info(`获取网络中最新稳定的MCI-Success : ${status}`);
            return status
        }).catch((err)=>{
            logger.info(`获取网络中最新稳定的MCI-Error : ${err}`);
        })
        .then(function (status) {
            rpcStableMci = Number(status.status.last_stable_mci);
            if ((dbStableMci < rpcStableMci) || (rpcStableMci ===0)) {
                if ((dbStableMci + 1000) < rpcStableMci) {
                    //数量太多，需要分批插入
                    cartMci = dbStableMci + 1000;
                    isStableDone = false;
                } else {
                    //一次可以插入完
                    isStableDone = true;
                }
                logger.info(`dbStableMci:${dbStableMci} , rpcStableMci:${rpcStableMci}, 开始准备插入数据 ${dbStableMci < rpcStableMci}`);
                pageUtility.startInsertData();
            } else {
                getUnstableTimer = setTimeout(function () {
                    pageUtility.getUnstableBlocks();
                }, 1000 * 7)
            }
        })
    },
    startInsertData() {
        stableUnitAry = [];
        //1、查询所有稳定 block 信息
        let getUnitByMci = function () {
            logger.info(`通过稳定MCI值 ${dbStableMci} 获取网络中block信息 BY czr.request.mciBlocks`);
            czr.request.mciBlocks(dbStableMci).then(function (data) {
                data.blocks.forEach((item) => {
                    stableUnitAry.push(item);
                });
                dbStableMci++;//7001

                //当前是否完成，控制一次插入多少
                if (isStableDone) {
                    tempMci = rpcStableMci;
                } else {
                    tempMci = cartMci;
                }

                if (dbStableMci <= tempMci) {
                    getUnitByMci();
                } else {
                    //2、整理稳定并且储存,储存到trans action 表中
                    stableUnitAry.sort(function (a, b) {
                        return Number(a.level) - Number(b.level);
                    });
                    accountsTotal = {};
                    parentsTotal = {};
                    witnessTotal = {};

                    //stableUnitAry 是所有block数据
                    let tempBlockAllAry = [];//用来从数据库搜索的数组
                    stableUnitAry.forEach(blockInfo => {
                        //DO 处理账户
                        //发款方不在当前 accountsTotal 时 （以前已经储存在数据库了）
                        if (!accountsTotal.hasOwnProperty(blockInfo.from)) {
                            accountsTotal[blockInfo.from] = {
                                account: blockInfo.from,
                                type: 1,
                                balance: "0"
                            }
                        }

                        let isFail = pageUtility.isFail(blockInfo);//交易失败了
                        if (!isFail) {
                            //处理收款方
                            if (accountsTotal.hasOwnProperty(blockInfo.to)) {
                                //有：更新数据 TODO 这句肯定会挂
                                accountsTotal[blockInfo.to].balance = BigNumber(accountsTotal[blockInfo.to].balance).plus(blockInfo.amount).toString(10);
                            } else {
                                //无：写入数据
                                accountsTotal[blockInfo.to] = {
                                    account: blockInfo.to,
                                    type: 1,
                                    balance: blockInfo.amount
                                }
                            }
                            //处理发款方
                            if (Number(blockInfo.level) !== 0) {
                                accountsTotal[blockInfo.from].balance = BigNumber(accountsTotal[blockInfo.from].balance).minus(blockInfo.amount).toString(10);
                            }
                        }

                        //DO 处理 parents 数据
                        if (blockInfo.parents.length > 0) {
                            parentsTotal[blockInfo.hash] = blockInfo.parents;
                        }

                        // 处理witness
                        if (blockInfo.witness_list.length > 0) {
                            witnessTotal[blockInfo.hash] = blockInfo.witness_list;
                        }

                        //DO 交易
                        tempBlockAllAry.push(blockInfo.hash);
                    });

                    /*
                    * A.处理账户
                    * B.处理Parent
                    * C.处理Block
                    * */

                    //A处理账户
                    let tempAccountAllAry = [];
                    let tempUpdateAccountAry = [];//存在的账户,更新
                    let tempInsertAccountAry = [];//不存在的账户

                    for (let item in accountsTotal) {
                        tempAccountAllAry.push(item);
                    }
                    logger.info(`本次处理账户:${tempAccountAllAry.length}`);

                    let upsertSql = {
                        text: "select account from accounts where account = ANY ($1)",
                        values: [tempAccountAllAry]
                    };
                    pgclient.query(upsertSql, (accountRes) => {
                        accountRes.forEach(item => {
                            if (accountsTotal.hasOwnProperty(item.account)) {
                                tempUpdateAccountAry.push(accountsTotal[item.account]);
                                delete accountsTotal[item.account];
                            }
                        });
                        for (let item in accountsTotal) {
                            tempInsertAccountAry.push(accountsTotal[item]);
                        }
                        logger.info(`更新账户数量:${tempUpdateAccountAry.length}`);
                        // logger.info(tempUpdateAccountAry);
                        logger.info(`插入账户数量:${tempInsertAccountAry.length}`);
                        // logger.info(tempInsertAccountAry);
                        // @tempUpdateAccountAry 和 tempInsertAccountAry 是目标数据

                        //B处理Parent
                        let tempParentsAllAry = [];
                        for (let item in parentsTotal) {
                            tempParentsAllAry.push(item);
                        }
                        logger.info(`处理前Parents:${Object.keys(parentsTotal).length}`);
                        // logger.info(`本次处理Parent:${tempParentsAllAry.length},${tempParentsAllAry}`);
                        let upsertParentSql = {
                            text: "select item from parents where item = ANY ($1)",
                            values: [tempParentsAllAry]
                        };
                        pgclient.query(upsertParentSql, (res) => {
                            let hashParentObj = {};
                            res.forEach((item) => {
                                hashParentObj[item.item] = item.item;
                            });
                            logger.info(`已存在Parents:${Object.keys(hashParentObj).length}`);
                            for (let parent in hashParentObj) {
                                delete parentsTotal[parent];
                            }
                            logger.info(`处理后Parents:${Object.keys(parentsTotal).length}`);

                            //@parentsTotal 是目标数据
                            // logger.info(parentsTotal);

                            //C处理Block
                            let tempUpdateBlockAry = [];//存在的账户,更新
                            let tempInsertBlockAry = [];//不存在的账户
                            logger.info(`本次处理Block:${tempBlockAllAry.length}`);
                            let upsertBlockSql = {
                                text: "select hash from transaction where hash = ANY ($1)",
                                values: [tempBlockAllAry]
                            };
                            pgclient.query(upsertBlockSql, (blockRes) => {
                                logger.info(`transaction表里有的Block数量:${blockRes.length}`);
                                blockRes.forEach(dbItem => {
                                    stableUnitAry.forEach((stableItem, index) => {
                                        if (stableItem.hash === dbItem.hash) {
                                            tempUpdateBlockAry.push(stableItem);
                                            stableUnitAry.splice(index, 1);
                                        }
                                    })
                                });
                                tempInsertBlockAry = [].concat(stableUnitAry);
                                logger.info(`更新Block数量:${tempUpdateBlockAry.length}`);
                                // logger.info(tempUpdateBlockAry);
                                logger.info(`插入Block数量:${tempInsertBlockAry.length}`);
                                // logger.info(tempInsertBlockAry);

                                // D 处理witness  witnessTotal
                                let witnessAllAry = [];
                                for (let item in witnessTotal) {
                                    witnessAllAry.push(item);
                                }
                                logger.info(`本次处理稳定 Witness:${witnessAllAry.length}`);
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
                                    logger.info(`已存在 Witness:${Object.keys(hashWitnessObj).length}`);
                                    for (let witness in hashWitnessObj) {
                                        delete witnessTotal[witness];
                                    }
                                    logger.info(`处需要处理的稳定 Witness:${Object.keys(witnessTotal).length}`);

                                    logger.info("****** 准备批量插入账户、Parent、Block，并批量更新Block ******");
                                    //@ 批量提交
                                    pgclient.query('BEGIN', (err) => {
                                        logger.info("操作稳定 Block Start", err);
                                        if (pageUtility.shouldAbort(res, "操作稳定BlockStart")) {
                                            return;
                                        }
                                        /*
                                        * 批量插入 账户       tempInsertAccountAry
                                        * 批量插入 Witness    witnessTotal:object
                                        * 批量插入 Parent、   parentsTotal:object
                                        * 批量插入 Block、    tempInsertBlockAry
                                        * 批量更新 Block、    tempUpdateBlockAry
                                        * */
                                        if (Object.keys(witnessTotal).length > 0) {
                                            logger.info("插入 witnessTotal By batchInsertWitness");
                                            pageUtility.batchInsertWitness(witnessTotal);
                                        }

                                        if (Object.keys(parentsTotal).length > 0) {
                                            logger.info("插入 parentsTotal By batchInsertParent");
                                            pageUtility.batchInsertParent(parentsTotal);
                                        }

                                        if (tempInsertAccountAry.length > 0) {
                                            logger.info("插入 tempInsertAccountAry By batchInsertAccount");
                                            pageUtility.batchInsertAccount(tempInsertAccountAry);
                                        }
                                        if (tempInsertBlockAry.length > 0) {
                                            logger.info("插入 tempInsertBlockAry By batchInsertBlock");
                                            pageUtility.batchInsertBlock(tempInsertBlockAry);
                                        }

                                        if (tempUpdateBlockAry.length > 0) {
                                            logger.info("插入 tempUpdateBlockAry By batchUpdateBlock");
                                            pageUtility.batchUpdateBlock(tempUpdateBlockAry);
                                        }

                                        pgclient.query('COMMIT', (err) => {
                                            logger.info("操作插入稳定 Block End", err);
                                            logger.info("需要更新的Account数量 ", tempUpdateAccountAry.length);
                                            //批量更新账户、       tempUpdateAccountAry
                                            tempUpdateAccountAry.forEach(account => {
                                                pageUtility.aloneUpdateAccount(account)
                                            });
                                            //归零数据
                                            // accountsTotal={};
                                            // parentsTotal={};
                                            // tempInsertAccountAry=[];
                                            // tempInsertBlockAry=[];
                                            // tempUpdateBlockAry=[];
                                            // tempUpdateAccountAry=[];


                                            //Other
                                            logger.info(`
                                        是否插入不稳定Unit:${isStableDone} 
                                        dbStableMci:${dbStableMci}, 
                                        rpcStableMci:${rpcStableMci}, 
                                        tempMci:${tempMci} 
                                        isStableDone:${isStableDone}`);

                                            if (!isStableDone) {
                                                //没有完成,处理 cartMci 和 isDone
                                                if ((cartMci + 1000) < rpcStableMci) {
                                                    //数量太多，需要分批插入
                                                    cartMci += 1000;
                                                    isStableDone = false;
                                                } else {
                                                    //下一次可以插入完
                                                    cartMci = rpcStableMci;
                                                    isStableDone = true;
                                                }
                                                stableUnitAry = [];
                                                getUnitByMci();
                                            } else {
                                                //最后：获取 不稳定的unstable_blocks 存储
                                                pageUtility.getUnstableBlocks();
                                            }
                                        })
                                    });

                                })

                            });
                        });

                    });

                }
            })
        };
        getUnitByMci();
    },
    getUnstableBlocks() {
        czr.request.unstableBlocks().then(function (data) {
            let unstableUnitAry = data.blocks;
            let unstableBlockHashAry = [];
            //排序 level 由小到大
            unstableUnitAry.sort(function (a, b) {
                return Number(a.level) - Number(b.level);
            });

            //@ A处理parent
            let unstableParentsTotal = {};
            let unstableWitnessTotal = {};
            unstableUnitAry.forEach(blockInfo => {
                if (blockInfo.parents.length > 0) {
                    // {"AAAA":["BBB","CCC"]}
                    unstableParentsTotal[blockInfo.hash] = blockInfo.parents;
                }
                //witness
                if (blockInfo.witness_list.length > 0) {
                    // {"AAAA":["BBB","CCC"]}
                    unstableWitnessTotal[blockInfo.hash] = blockInfo.witness_list;
                }
                //DO 交易
                unstableBlockHashAry.push(blockInfo.hash);
            });
            let unstableParentsAllAry = [];
            for (let item in unstableParentsTotal) {
                unstableParentsAllAry.push(item);
            }
            logger.info(`本次处理不稳定Parent:${unstableParentsAllAry.length}`);
            let upsertParentSql = {
                text: "select item from parents where item = ANY ($1)",
                values: [unstableParentsAllAry]
            };
            pgclient.query(upsertParentSql, (res) => {
                let hashParentObj = {};
                res.forEach((item) => {
                    hashParentObj[item.item] = item.item;
                });
                logger.info(`合计不稳定Parents:${Object.keys(unstableParentsTotal).length}`);
                logger.info(`已存在不稳定Parents:${Object.keys(hashParentObj).length}`);
                for (let parent in hashParentObj) {
                    delete unstableParentsTotal[parent];
                }
                logger.info(`处需要处理的Parents:${Object.keys(unstableParentsTotal).length}`);
                //@unstableParentsTotal 是目标数据
                // logger.info(unstableParentsTotal);

                // B处理Block
                let unstableUpdateBlockAry = [];//存在的账户,更新
                let unstableInsertBlockAry = [];//不存在的账户
                logger.info(`本次处理不稳定Block:${unstableBlockHashAry.length}`);
                let upsertBlockSql = {
                    text: "select hash from transaction where hash = ANY ($1)",
                    values: [unstableBlockHashAry]
                };
                pgclient.query(upsertBlockSql, (blockRes) => {
                    logger.info(`transaction表里有的Block数量:${blockRes.length}`);
                    blockRes.forEach(dbItem => {
                        unstableUnitAry.forEach((unstableItem, index) => {
                            if (unstableItem.hash === dbItem.hash) {
                                unstableUpdateBlockAry.push(unstableItem);
                                unstableUnitAry.splice(index, 1);
                            }
                        })
                    });
                    unstableInsertBlockAry = [].concat(unstableUnitAry);
                    logger.info(`更新不稳定Block数量:${unstableUpdateBlockAry.length}`);
                    // logger.info(unstableUpdateBlockAry);
                    logger.info(`插入不稳定Block数量:${unstableInsertBlockAry.length}`);
                    // logger.info(unstableInsertBlockAry);

                    //C 处理 witness
                    let unstableWitnessAllAry = [];
                    for (let item in unstableWitnessTotal) {
                        unstableWitnessAllAry.push(item);
                    }
                    logger.info(`本次处理不稳定 Witness:${unstableWitnessAllAry.length}`);
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
                        logger.info(`已存在 Witness:${Object.keys(hashWitnessObj).length}`);
                        for (let witness in hashWitnessObj) {
                            delete unstableWitnessTotal[witness];
                        }
                        logger.info(`处需要处理的 Witness:${Object.keys(unstableWitnessTotal).length}`);

                        //开始插入数据库
                        pgclient.query('BEGIN', (err) => {
                            logger.info("批量操作不稳定 Unit Start", err);
                            if (pageUtility.shouldAbort(res, "操作不稳定BlockStart")) {
                                return;
                            }
                            /*
                            * 批量插入 Witness   unstableWitnessTotal:object
                            * 批量插入 Parent、   unstableParentsTotal:object
                            * 批量插入 Block、    unstableInsertBlockAry
                            * 批量更新 Block、    unstableUpdateBlockAry
                            * */
                            if (Object.keys(unstableWitnessTotal).length > 0) {
                                pageUtility.batchInsertWitness(unstableWitnessTotal);
                            }

                            if (Object.keys(unstableParentsTotal).length > 0) {
                                pageUtility.batchInsertParent(unstableParentsTotal);
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

                    })
                });
            });
        })
    },

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
    batchInsertParent(parentObj){
        // let parentObj={
        //     '5D81C966F0E1B1DFA0F77488FD4A577BB557CBEF4C87DE39141CB0FF7639F583': [ '8281B037A0A930A488B1407AE9AB6425D02D277182488641238F47F6304F604A' ],
        //     '94960D6352BC14287A68327373B45E0D8F21BC4C434287C893BD0DF9100E4F35':
        //         [ '2FF3BB4217F640015171CFC207DC8BA831B98BD8160FB8D54A95B5E29BCF74AD',
        //             '8281B037A0A930A488B1407AE9AB6425D02D277182488641238F47F6304F604A',
        //             'C469079D2879A0C2F8964D4F07B08424EEB5EF46D6BBA6A9C81D1ADF24F4A140' ]
        // };
        let tempAry=[];
        for (let key in parentObj){
            parentObj[key].forEach((item)=>{
                tempAry.push("('"+key+"','"+item+"')");
            });
        }
        let batchInsertSql = {
            text: "INSERT INTO parents (item,parent) VALUES"+tempAry.toString()
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
                item.level + "','" +
                item.witnessed_level + "','" +
                item.best_parent + "'," +
                (item.is_stable === '1') + "," +
                (item.is_fork === '1') + "," +
                (item.is_invalid === '1') + "," +
                (item.is_fail === '1') + "," +
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
            text: 'INSERT INTO transaction(hash,"from","to",amount,previous,witness_list_block,last_summary,last_summary_block,data,exec_timestamp,signature,is_free,level,witnessed_level,best_parent,is_stable,is_fork,is_invalid,is_fail,is_on_mc,mci,latest_included_mci,mc_timestamp) VALUES' + tempAry.toString()
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
            is_fork=tmp.is_fork ,
            is_invalid=tmp.is_invalid ,
            is_fail=tmp.is_fail ,
            is_on_mc=tmp.is_on_mc
        from (values
              ('B5956299E1BC73B23A56D4CC1C58D42F2D494808FBDEE073259B48F571CCE97C',true,true,true,true,true,true),
              ('5F2B6FA741A33CDD506C5E150E37FCC73842082B24948A7159DFEB4C07500A08',true,true,true,true,true,true)
             )
        as tmp (hash,is_free,is_stable,is_fork,is_invalid,is_fail,is_on_mc)
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
                (item.is_fork === '1') + "," +
                (item.is_invalid === '1') + "," +
                (item.is_fail === '1') + "," +
                (item.is_on_mc === '1') + "," +
                (item.mc_timestamp) +
                ")");
        });
        let batchUpdateSql = "update transaction set is_free=tmp.is_free , is_stable=tmp.is_stable , is_fork=tmp.is_fork , is_invalid=tmp.is_invalid , is_fail=tmp.is_fail , is_on_mc=tmp.is_on_mc , mc_timestamp=tmp.mc_timestamp from (values " + tempAry.toString() +
            ") as tmp (hash,is_free,is_stable,is_fork,is_invalid,is_fail,is_on_mc,mc_timestamp) where transaction.hash=tmp.hash";
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
                    logger.info(`Account更新成功 ${accountObj.account}`);
                }
            });
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
    isFail(obj) {
        //true 是失败的
        return (obj.is_stable === "1") && ((obj.is_fork === "1") || (obj.is_invalid === "1") || (obj.is_fail === "1"));
    }
};
pageUtility.init();