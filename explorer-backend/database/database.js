(async () => {
    let BigNumber = require('bignumber.js').default;
    // let profiler = require("./profiler");//写 N 条MCI数据，算出每个阶段的耗时占比，方便针对性优化

    let pgPromise = require("./PG-promise"); //引入
    let client = await pgPromise.pool.connect(); //获取连接

    // let Czr = require("../czr/index");
    let Czr = require("czr");
    let czr = new Czr();

    //写日志
    let log4js = require('./log_config');
    let logger = log4js.getLogger('write_db'); //此处使用category的值
    let self;

    //辅助数据 Start
    let getRpcTimer = null,
        getUnstableTimer = null;
    let initTimer = null;
    let db_LSBI, //本地数据库的最高稳定 last stable block index
        rpc_LSBI; //RPC接口请求到的最高稳定 last stable block index
    let isStableDone = false; //稳定的MCI是否插入完成
    //辅助数据 End

    // 操作稳定Unit相关变量 Start
    let unitIsFail;
    let MCI_LIMIT = 500;
    // let stableCount = 0; //异步控制

    let BLOCKS_LENGTH = 0;
    let allTransTypeAry = [];
    let witnessTransInsertAry = []; //储存数据库不存在的unit,插入[Db]
    let genesisTransInsertAry = []; //插入[Db]
    let normalTransInsertAry = []; //插入[Db]
    let hashGroupAry = [];

    let accountsInsertAry = []; //不存在的账户,插入[Db]
    let accountsUpdateAry = []; //存在的账户,更新[Db]
    let parentsTotalAry = []; //储存预处理的parents信息[Db]

    let accountsTotal = {}; //储存预处理的账户信息

    let timestampTotal = {}; //储存预处理的时间戳信息
    let timestampInsertAry = []; //没有的timestamp,插入[Db]
    let timestampUpdateAry = []; //存在的timestamp,更新[Db]

    let timestamp10Total = {}; //储存预处理的时间戳信息
    let timestamp10InsertAry = []; //没有的timestamp,插入[Db]
    let timestamp10UpdateAry = []; //存在的timestamp,更新[Db]
    // let tempTransTokenInsertInfo = {};
    // 操作稳定Unit相关变量 End

    const getCount = require('./helper/count').getCount;
    const calcAccountTranCount = require('./account/transaction-count').calcCount; //更新账户交易计数

    //合约相关的开始
    /**
     * accounts表 更新 [没有做]
     *      is_token_account 
     *      is_has_token_assets 
     *      is_has_token_trans 
     *      is_has_intel_trans 
     *      is_has_event_logs 
     *      
     * trans_normal表 更新
     *      is_event_log
     *      is_token_trans
     *      is_intel_trans
     * 
     * global表 更新
     *      token_count
     *      internal_count
     * 
     * contract表 
     *      插入    contractInsertAry
     *      更新    contractUpdateAry
     * contract_code表 
     *      插入    contractCodeInsertAry
     * token表 
     *      插入    tokenInsertAry
     *      更新    tokenUpdateAry
     * Token交易表 
     *      插入    transTokenInsertAry
     * 内部交易表 
     *      插入    transInternalInsertAry
     * 事件日志表 
     *      插入    eventLogInsertAry
     * Token资产表 
     *      插入    tokenAssetInsertAry
     *      更新    tokenAssetUpdateAry
     * 
     */

    let contractInsertAry = [];//插入合约表 [Db]        /done
    let contractUpdateAry = [];//更新合约表 [Db]        /done
    let contractUpdateAryHelpObj = {};//更新合约表辅助对象

    let contractCodeInsertAry = []; //插入 合约code表[Db]       /done

    let tokenInsertAry = [];        //插入 token信息表   [Db]       /done
    let tokenUpdateAry = [];        //更新 token信息表   [Db]       /done
    let tokenUpdateAryHelpObj = {}
    let tokenInsertAryHelpObj = {};

    let transTokenInsertAry = [];   //插入 token交易表   [Db]       /done
    let transInternalInsertAry = [];//插入 内部交易表    [Db]       /done
    let eventLogInsertAry = [];     //插入 事件日志表    [Db]       /done

    let tokenAssetInsertAry = [];//插入[Db]     /done
    let tokenAssetUpdateAry = [];//更新[Db]     /done
    let tokenAccountsTotal = {};

    let allTokenInfo = {};
    let tempTokenInfo = {}
    //合约相关的结束

    // account index table
    let accountIndexTransAry = [];
    let accountIndexTransTokenAry = [];
    let accountIndexTransInternalAry = [];
    let accountIndexTransLogAry = [];

    let pageUtility = {
        async init() {
            self = this;
            initTimer = setTimeout(async () => {
                //标记由 MCI 改为 last_stable_block_index
                let SearchOptions = {
                    text: `
                    select 
                        value 
                    from 
                        global 
                    where 
                        "key" = $1
                `,
                    values: ["done_stable_index"]
                };
                let data = await client.query(SearchOptions);

                //TODO 为了方便修改，所以都没有写语法错误/节点关闭特殊场景的处理代码，后面需要加上
                if (data.rowCount === 0) {
                    //需要插入mci
                    pageUtility.createGlobalMci();
                } else if (data.rowCount === 1) {
                    pageUtility.setDbStableMci(data.rows)
                } else if (data.rowCount > 1) {
                    logger.info("get dataCurrentMai is Error");
                    return;
                }

                getCount('accountsCount', 'witness_count');
                getCount('normalCount', 'normal_count');
                getCount('accountsCount', 'accounts_count');
                getCount('accountsCount', 'token_count');
                getCount('accountsCount', 'internal_count');
            }, 5000)

        },
        async createGlobalMci() {
            let insertMciToGlobal = "INSERT INTO global (key,value) VALUES ('done_stable_index', 0)";
            let res = await client.query(insertMciToGlobal);
            if (res.code) {
                // 出错
                logger.error(`Global新建Mci : 失败`);
                logger.error(res)
            } else {
                //成功
                logger.info(`Global新建Mci : 成功`);
                db_LSBI = 0;
                pageUtility.getWitness_list()
            }
        },
        setDbStableMci(data) {
            // logger.info(`sql db_LSBI : ${data[0].value}`);
            db_LSBI = Number(data[0].value) + 1;
            // pageUtility.readyGetData();
            pageUtility.getWitness_list()
        },

        //写入 witness_list
        async getWitness_list() {
            /**
             * 搜索 witness_list 表是否有数据
             *      有数据，忽略 
             *      没有数据，插入
             */
            let SearchWitnessOptions = {
                text: `
                    select 
                        count(1) 
                    from
                        witness_list 
                `
            };
            let witData = await client.query(SearchWitnessOptions);
            if (witData.rows[0].count === "0") {
                //需要插入
                pageUtility.insertWitnessLiss();
            } else {
                pageUtility.readyGetData();
            }
        },
        async insertWitnessLiss() {
            czr.request.witnessList().then(function (wit_list) {
                logger.info(`获取网络中witness_list -Success `);
                logger.info(wit_list);
                return wit_list;
            }).catch((err) => {
                logger.info(`获取网络中witness_list -Error : ${err}`);
                pageUtility.init();
                return;
            }).then(async function (wit_list) {
                if (wit_list.witness_list) {
                    let witnessInfo = "('";
                    witnessInfo += wit_list.witness_list.join("'),('");
                    witnessInfo += "')";
                    let witnessInsertSql = "INSERT INTO witness_list (account) VALUES " + witnessInfo;
                    let res = await client.query(witnessInsertSql);
                    pageUtility.readyGetData();
                }
            })
        },
        readyGetData() {
            getRpcTimer = setTimeout(function () {
                pageUtility.getRPC()
            }, 3000);
            //TODO 时间抽出,定时器主要是为了unstable时候，避免无效读取 但 stable时候需要加快读取
        },
        getRPC() {
            //获取网络中最新稳定的MCI
            logger.info(`获取网络中最新稳定的 LSBI-Start`);
            czr.request.status().then(function (status) {
                logger.info(`获取网络中最新稳定的 LSBI-Success `);
                return status
            }).catch((err) => {
                logger.info(`获取网络中最新稳定的 LSBI-Error : ${err}`);
                pageUtility.readyGetData();
                return;
            })
                .then(function (status) {
                    if (status) {
                        rpc_LSBI = Number(status.last_stable_block_index);
                        if ((db_LSBI <= rpc_LSBI) || (db_LSBI === 0)) {
                            pageUtility.searchMci(status);
                        } else {
                            getUnstableTimer = setTimeout(function () {
                                // TODO 已经写完了，需要重新获取
                                pageUtility.readyGetData();
                            }, 1000)
                        }
                    }

                })
        },

        //插入Mci信息
        async searchMci(status) {
            let data = await client.query("Select * FROM global WHERE key = $1", ["last_stable_block_index"]);
            if (data.code) {
                // 出错
                logger.info(`searchMci is Error`);
                logger.info(res);
            } else {
                //成功
                if (data.rowCount === 0) {
                    logger.info("数据库无 LAST_STABLE_MCI ，第一次创建KEY_VALUE值");
                    pageUtility.insertMci(status);
                } else {
                    let currentMci = data.rows[0];
                    if (Number(currentMci.last_stable_block_index) !== Number(status.last_stable_block_index)) {
                        logger.info("需要更新 LAST_STABLE_MCI");
                        pageUtility.updateMci(status);
                    } else {
                        pageUtility.readyGetData(); //相同的
                    }
                }
            }
        },
        async insertMci(status) {
            const insertVal = `
                    ('last_mci',${Number(status.last_mci)} ),
                    ('last_stable_mci',${Number(status.last_stable_mci)}),
                    ('last_stable_block_index', ${Number(status.last_stable_block_index)} )
                `;
            let globalFirstInsert = "INSERT INTO global (key,value) VALUES " + insertVal;
            let res = await client.query(globalFirstInsert);
            if (res.code) {
                // 出错
                logger.info(`第一次LAST_MCI插入失败`);
                logger.info(res);
            } else {
                logger.info(`第一次LAST_MCI插入成功`);
                pageUtility.getUnitByLSBI(); //查询所有稳定 block 信息
            }
        },
        async updateMci(status) {
            let globalUpdateMci = `
                update 
                    global 
                set 
                    value=temp.value 
                        from (values 
                                ('last_mci',${Number(status.last_mci)}),
                                ('last_stable_mci',${Number(status.last_stable_mci)}),
                                ('last_stable_block_index', ${Number(status.last_stable_block_index)} )
                            ) 
                    as 
                        temp(key,value)
                where 
                    global.key = temp.key
            `
            let res = await client.query(globalUpdateMci);
            if (res.code) {
                // 出错
                logger.info(`MCI插更新败`);
                logger.info(res);
            } else {
                logger.info(`MCI更新成功`);
                pageUtility.getUnitByLSBI(); //查询所有稳定 block 信息
            }

        },
        //插入稳定的Unit ------------------------------------------------ Start
        getUnitByLSBI() {
            logger.info(`开始通过 ${MCI_LIMIT} ${db_LSBI} 向节点获取blocks ---------------------`);
            czr.request.stableBlocks(MCI_LIMIT, db_LSBI).then(async function (data) {
                //block信息一次拿不完，需要拿2次；
                BLOCKS_LENGTH = data.blocks.length;
                if (BLOCKS_LENGTH) {
                    //拿hash对应状态
                    data.blocks.forEach((item) => {
                        hashGroupAry.push(item.hash);
                    });
                    let hashStatesGroup;
                    try {
                        hashStatesGroup = await czr.request.getBlockStates(hashGroupAry);
                    } catch (error) {
                        logger.info(`getBlockStates Error`);
                        logger.info(error);
                        pageUtility.init();
                        return;
                    }
                    let blockStatesAry = hashStatesGroup.block_states;
                    // logger.info(blockStatesAry);
                    db_LSBI = blockStatesAry[blockStatesAry.length - 1].stable_content.stable_index;
                    logger.info(`拿到了结果, 最新LSBI: ${db_LSBI} ，hashGroupAry.length：${hashGroupAry.length}`);

                    //获取内部交易数据--- 开始
                    let blockTraces = {};
                    let tempBlockTraces;
                    // await Promise.all(hashGroupAry.map(async (hash) => {}));
                    let hash;
                    for (let groupIndex = 0, len = hashGroupAry.length; groupIndex < len;) {
                        hash = hashGroupAry[groupIndex];
                        try {
                            tempBlockTraces = await czr.request.blockTraces(hash);
                        } catch (error) {
                            logger.info(`blockTraces Error`);
                            logger.info(error);
                            pageUtility.init();
                            return;
                        }
                        if (tempBlockTraces.code === 0) {
                            blockTraces[hash] = tempBlockTraces.block_traces;
                        } else {
                            logger.info(`blockTraces[hash] Error`);
                            logger.info(tempBlockTraces);
                            pageUtility.init();
                            return;
                        }
                        groupIndex++;

                    }
                    //获取内部交易数据--- 结束

                    //写一级数据（TODO：目前继续使用以前一级数据模式，后期需要做调整）
                    data.blocks.forEach((item, index) => {
                        if (item.type === 0) {
                            //创世交易
                            data.blocks[index].timestamp = item.content.timestamp;
                            data.blocks[index].to = item.content.to;
                            data.blocks[index].amount = item.content.amount;
                            data.blocks[index].data_hash = item.content.data_hash;//++新增属性
                            data.blocks[index].data = item.content.data;
                            data.blocks[index].parents = [];
                            //status
                            data.blocks[index].witnessed_level = blockStatesAry[index].content.witnessed_level;
                            data.blocks[index].is_free = blockStatesAry[index].stable_content.is_free;
                            data.blocks[index].is_on_mc = blockStatesAry[index].stable_content.is_on_mc;

                        }
                        if (item.type === 1) {
                            //见证交易
                            data.blocks[index].timestamp = item.content.timestamp;
                            data.blocks[index].previous = item.content.previous;
                            data.blocks[index].parents = item.content.parents || [];
                            data.blocks[index].links = item.content.links.toString();//++新增属性
                            data.blocks[index].last_stable_block = item.content.last_stable_block;
                            data.blocks[index].last_summary_block = item.content.last_summary_block;
                            data.blocks[index].last_summary = item.content.last_summary;
                            //status
                            data.blocks[index].witnessed_level = blockStatesAry[index].content.witnessed_level;
                            data.blocks[index].best_parent = blockStatesAry[index].content.best_parent;
                            data.blocks[index].is_free = blockStatesAry[index].stable_content.is_free;
                            data.blocks[index].is_on_mc = blockStatesAry[index].stable_content.is_on_mc;

                        }

                        if (item.type === 2) {
                            data.blocks[index].to = item.content.to;
                            data.blocks[index].amount = item.content.amount;
                            data.blocks[index].data_hash = item.content.data_hash;//++新增属性
                            data.blocks[index].data = item.content.data;
                            //普通交易特有
                            data.blocks[index].previous = item.content.previous;
                            data.blocks[index].gas = item.content.gas;
                            data.blocks[index].gas_price = item.content.gas_price;
                            //内部交易
                            data.blocks[index].block_traces = blockTraces[item.hash];
                        }

                        //写状态数据
                        //共有状态
                        data.blocks[index].level = blockStatesAry[index].content.level;
                        data.blocks[index].is_stable = blockStatesAry[index].is_stable;
                        data.blocks[index].status = blockStatesAry[index].stable_content.status;
                        data.blocks[index].stable_index = blockStatesAry[index].stable_content.stable_index;
                        data.blocks[index].mc_timestamp = blockStatesAry[index].stable_content.mc_timestamp;
                        data.blocks[index].stable_timestamp = blockStatesAry[index].stable_content.stable_timestamp;
                        data.blocks[index].mci = blockStatesAry[index].stable_content.mci;

                        if ((item.type === 2) || (item.type === 0)) {
                            data.blocks[index].from_state = blockStatesAry[index].stable_content.from_state;
                            data.blocks[index].to_states = blockStatesAry[index].stable_content.to_states;
                            data.blocks[index].gas_used = blockStatesAry[index].stable_content.gas_used || 0;
                            data.blocks[index].log = blockStatesAry[index].stable_content.log;
                            data.blocks[index].log_bloom = blockStatesAry[index].stable_content.log_bloom;
                            //2019年10月18日上午，RPC接口的更改，block_state返回数据中的 contract_address 改为 contract_account , 与周友对接
                            data.blocks[index].contract_address = blockStatesAry[index].stable_content.contract_account;
                        }
                    });
                    hashGroupAry = [];

                    data.blocks.forEach((item) => {
                        //储存所有hash对应的type
                        allTransTypeAry.push({
                            "hash": item.hash,
                            "type": item.type
                        })
                        //需要保证信息都是数据库不存在的
                        if (item.type === 2) {
                            //普通交易
                            normalTransInsertAry.push(item);

                            //把账户对应的Hash存到索引表
                            accountIndexTransAry.push({
                                account: item.from,
                                hash: item.hash,
                                stable_index: item.stable_index,
                            })
                            if (item.from !== item.to) {
                                if (item.to) {
                                    accountIndexTransAry.push({
                                        account: item.to,
                                        hash: item.hash,
                                        stable_index: item.stable_index,
                                    })
                                } else {
                                    accountIndexTransAry.push({
                                        account: item.contract_address,
                                        hash: item.hash,
                                        stable_index: item.stable_index,
                                    })
                                }
                            }

                        } else {
                            //见证 / 创世交易
                            //其中创世的简要信息 写到 见证表中
                            witnessTransInsertAry.push(item);
                            if (item.type === 0) {
                                genesisTransInsertAry.push(item)
                            }
                        }
                    });
                    // db_LSBI = data.blocks[BLOCKS_LENGTH - 1].stable_index;
                    // logger.info(`拿到了结果, 最新LSBI: ${db_LSBI}`);
                    pageUtility.filterData();
                } else {
                    //该index没有值
                    logger.info(`mciBlocks : data.blocks => false`);
                    logger.info(data);
                }
            }).catch((err) => {
                logger.info(`mciBlocks-Error : ${err}`);
                pageUtility.init();
                return;
            })
        },
        async filterData() {
            //2、根据稳定Units数据，筛选Account Parent Witness Timestamp，方便后续储存
            logger.info(`数据分装 开始`);
            //创世交易 写入表: account / trans_genesis
            if (genesisTransInsertAry.length) {
                genesisTransInsertAry.forEach(blockInfo => {
                    //DO 写创世块的金额
                    accountsTotal[blockInfo.to] = {
                        account: blockInfo.to,
                        type: 1,
                        balance: blockInfo.amount,
                        is_token_account: false,//针对合约
                        is_has_token_assets: false,
                        is_has_token_trans: false,
                        is_has_intel_trans: false,
                        is_has_event_logs: false
                    };
                });
            }
            logger.info(`创世交易 结束`);

            //见证交易 操作表：trans_witness / parents
            witnessTransInsertAry.forEach(blockInfo => {
                //DO 处理 parents 数据
                parentsTotalAry.push({
                    item: blockInfo.hash,
                    parent: blockInfo.parents
                });
            });
            logger.info(`见证交易 结束`);

            //普通交易 操作表: account / timestamp / trans_nomaol
            for (let normalIndex = 0, len = normalTransInsertAry.length; normalIndex < len;) {
                let blockInfo = normalTransInsertAry[normalIndex];
                // await Promise.all(normalTransInsertAry.map(async (blockInfo) => {
                //DO 处理账户，发款方不在当前 accountsTotal 时 （以前已经储存在数据库了）
                if (!accountsTotal.hasOwnProperty(blockInfo.from)) {
                    accountsTotal[blockInfo.from] = {
                        account: blockInfo.from,
                        type: 1,
                        balance: "0",
                        is_token_account: false,//针对合约
                        is_has_token_assets: false,
                        is_has_token_trans: false,
                        is_has_intel_trans: false,
                        is_has_event_logs: false
                    }
                }

                // 删除Gas 确认状态，0：成功，1：双花，2：无效，3：智能合约执行失败。
                if ((blockInfo.status === 0) || (blockInfo.status === 3)) {
                    accountsTotal[blockInfo.from].balance = BigNumber(accountsTotal[blockInfo.from].balance).minus(blockInfo.gas_used * blockInfo.gas_price).toString(10);
                }

                //账户余额 只有是成功的交易才操作账户余额
                unitIsFail = pageUtility.isFail(blockInfo); //交易失败了
                if (!unitIsFail) {
                    //如果To为false，则为部署合约交易

                    //处理收款方余额
                    if (accountsTotal.hasOwnProperty(blockInfo.to)) {
                        //有,收款方地址已存在cache中：更新数据
                        accountsTotal[blockInfo.to].balance = BigNumber(accountsTotal[blockInfo.to].balance).plus(blockInfo.amount).toString(10);
                    } else {
                        //无，收款方地址不存在cache中：写入数据
                        if (!blockInfo.to) {
                            accountsTotal[blockInfo.contract_address] = {
                                account: blockInfo.contract_address,
                                type: 2,
                                balance: blockInfo.amount,
                                is_token_account: false,//针对合约
                                is_has_token_assets: false,
                                is_has_token_trans: false,
                                is_has_intel_trans: false,
                                is_has_event_logs: false
                            }
                            blockInfo.to = blockInfo.contract_address;
                        } else {
                            accountsTotal[blockInfo.to] = {
                                account: blockInfo.to,
                                type: 1,
                                balance: blockInfo.amount,
                                is_token_account: false,//针对合约
                                is_has_token_assets: false,
                                is_has_token_trans: false,
                                is_has_intel_trans: false,
                                is_has_event_logs: false
                            }
                        }
                    }
                    //处理发款方余额
                    accountsTotal[blockInfo.from].balance = BigNumber(accountsTotal[blockInfo.from].balance).minus(blockInfo.amount).toString(10);
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

                //********************************** 合约相关数据组装 开始 */
                //DO 创建合约交易[OK]
                if (blockInfo.contract_address) {
                    logger.info("新建合约:", blockInfo.contract_address)
                    //合约表
                    contractInsertAry.push({
                        contract_account: blockInfo.contract_address,
                        own_account: blockInfo.from,
                        born_unit: blockInfo.hash,
                        token_name: "",
                        token_symbol: ""
                    });

                    //合约代码
                    contractCodeInsertAry.push({
                        contract_account: blockInfo.contract_address,
                        code: blockInfo.data
                    });
                }

                //DO 解析log
                //事件日志表，部署合约时跳过，Token转账之类会有
                if (blockInfo.log && blockInfo.log.length) {
                    // logger.info('解析log信息');
                    blockInfo.is_event_log = true;
                    let tempTransTokenInsertInfo = {};
                    let tempEventLogItem = {};

                    for (let blockInfoLogIndex = 0, len = blockInfo.log.length; blockInfoLogIndex < len;) {
                        let log_item = blockInfo.log[blockInfoLogIndex];

                        // await Promise.all(blockInfo.log.map(async (log_item) => {

                        //改为 account 了
                        let contractAccount = czr.utils.encodeAccount(log_item.account);
                        let transData = parseInt(log_item.data, 16);
                        tempEventLogItem = {
                            hash: blockInfo.hash,
                            mci: blockInfo.mci,
                            mc_timestamp: blockInfo.mc_timestamp,
                            stable_index: blockInfo.stable_index,

                            contract_address: contractAccount,
                            from: log_item.topics[1] ? czr.utils.encodeAccount(log_item.topics[1]) : "",
                            to: log_item.topics[2] ? czr.utils.encodeAccount(log_item.topics[2]) : "",
                            method: blockInfo.data.toString().substring(0, 8),//A9059CBB

                            address: log_item.address,
                            data: log_item.data,
                            topics: log_item.topics.join(",")
                        }
                        eventLogInsertAry.push(tempEventLogItem);
                        //把账户对应的Hash存到索引表
                        if (tempEventLogItem.from) {
                            accountIndexTransLogAry.push({
                                account: tempEventLogItem.from,
                                hash: blockInfo.hash,
                                stable_index: blockInfo.stable_index,
                            })
                        }
                        if ((tempEventLogItem.from !== tempEventLogItem.to) && tempEventLogItem.to) {
                            accountIndexTransLogAry.push({
                                account: tempEventLogItem.to,
                                hash: blockInfo.hash,
                                stable_index: blockInfo.stable_index,
                            })
                        }

                        //是否Token转账
                        if (log_item.topics.length === 3 && (log_item.topics[0].toLowerCase() === "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")) {
                            blockInfo.is_token_trans = true;
                            //解析出对应的Token信息
                            logger.info('有Token转账', contractAccount);
                            if (!allTokenInfo.hasOwnProperty(contractAccount)) {
                                logger.info("内存中没有找到Token合约，需要搜索~~~")
                                try {
                                    tempTokenInfo = {
                                        token_name: await pageUtility.call(contractAccount, "name"),
                                        token_symbol: await pageUtility.call(contractAccount, "symbol"),
                                        token_precision: await pageUtility.call(contractAccount, "decimals"),
                                        token_total: await pageUtility.call(contractAccount, "totalSupply"),
                                        owner: await pageUtility.call(contractAccount, "owner"),
                                    };
                                } catch (error) {
                                    logger.info(`Token合约 Error`);
                                    logger.info(error);
                                    pageUtility.init();
                                    return;
                                }
                                allTokenInfo[contractAccount] = tempTokenInfo;
                            } else {
                                logger.info("内存中已经有Token合约啦，不需要搜索！！！")
                                tempTokenInfo = allTokenInfo[contractAccount];
                            }


                            //双方账户
                            let contractFromAcc = czr.utils.encodeAccount(log_item.topics[1]);
                            let contractToAcc = czr.utils.encodeAccount(log_item.topics[2]);
                            let fromAccAndcontract = contractFromAcc + contractAccount;
                            let toAccAndcontract = contractToAcc + contractAccount;

                            //设置 is_has_token_trans 和 is_has_event_logs
                            pageUtility.setAccountProps(accountsTotal, contractFromAcc);
                            pageUtility.setAccountProps(accountsTotal, contractToAcc);

                            //查是否已经插入当前变量,后面更新到 tokenInsertAry
                            //更改合约表中的Token，第一次发起Token转账,并且Token表没有数据
                            if (!tokenInsertAryHelpObj.hasOwnProperty(contractAccount)) {
                                tokenInsertAryHelpObj[contractAccount] = {
                                    contract_account: contractAccount,
                                    mc_timestamp: blockInfo.mc_timestamp,
                                    token_name: tempTokenInfo.token_name,//Cannot read property 'value' of undefined
                                    token_symbol: tempTokenInfo.token_symbol,
                                    token_precision: tempTokenInfo.token_precision,
                                    token_total: tempTokenInfo.token_total,
                                    owner: tempTokenInfo.owner,
                                    transaction_count: 0,
                                    account_count: 0
                                }


                                //更新 合约表 相关的Token信息 使用，
                                contractUpdateAryHelpObj[contractAccount] = {
                                    contract_account: contractAccount,
                                    token_name: tempTokenInfo.token_name,
                                    token_symbol: tempTokenInfo.token_symbol
                                }

                                //to账户为合约账户 is_token_account
                                if (accountsTotal.hasOwnProperty(contractAccount)) {
                                    accountsTotal[contractAccount].is_token_account = true;
                                }

                                //写初始账户金额
                                if (!tokenAccountsTotal.hasOwnProperty(tempTokenInfo.owner)) {
                                    tokenAccountsTotal[tempTokenInfo.owner + contractAccount] = {
                                        account: tempTokenInfo.owner,
                                        contract_account: contractAccount,
                                        account_contract_merger: tempTokenInfo.owner + contractAccount,
                                        name: tempTokenInfo.token_name,
                                        symbol: tempTokenInfo.token_symbol,
                                        precision: tempTokenInfo.token_precision,
                                        balance: tempTokenInfo.token_total
                                    }
                                }
                            }

                            //处理 token表 当前合约的 transaction_count 后续给 tokenUpdateAry
                            if (!tokenUpdateAryHelpObj.hasOwnProperty(contractAccount)) {
                                tokenUpdateAryHelpObj[contractAccount] = {
                                    transaction_count: 1,
                                    haveAddress: [],//这里所有的account都需要 把 对应账户表的 is_has_token_trans 为 true **************
                                    // account_count: new_account_count, //账户数量需要判断
                                }
                            } else {
                                tokenUpdateAryHelpObj[contractAccount].transaction_count++
                            }

                            //处理合约拥有的地址列表,再数据库里查询后，移除掉,后续给 tokenUpdateAry 的 account_count
                            if (tokenUpdateAryHelpObj[contractAccount].haveAddress.indexOf(contractFromAcc) === -1) {
                                tokenUpdateAryHelpObj[contractAccount].haveAddress.push(contractFromAcc);
                            }
                            if (tokenUpdateAryHelpObj[contractAccount].haveAddress.indexOf(contractToAcc) === -1) {
                                tokenUpdateAryHelpObj[contractAccount].haveAddress.push(contractToAcc);
                            }

                            //Token交易表
                            tempTransTokenInsertInfo = {
                                hash: blockInfo.hash,
                                mc_timestamp: blockInfo.mc_timestamp,
                                stable_index: blockInfo.stable_index,
                                from: contractFromAcc,
                                to: contractToAcc,
                                contract_account: contractAccount,
                                token_symbol: tempTokenInfo.token_symbol,
                                token_name: tempTokenInfo.token_name,
                                amount: transData,

                                token_precision: tempTokenInfo.token_precision,
                                gas: blockInfo.gas,
                                gas_price: blockInfo.gas_price,
                                gas_used: blockInfo.gas_used,
                                input: blockInfo.data

                            }
                            transTokenInsertAry.push(tempTransTokenInsertInfo);
                            //把账户对应的Hash存到索引表
                            accountIndexTransTokenAry.push({
                                account: contractFromAcc,
                                hash: blockInfo.hash,
                                stable_index: blockInfo.stable_index,
                            })
                            if ((contractFromAcc !== contractToAcc) && contractToAcc) {
                                accountIndexTransTokenAry.push({
                                    account: contractToAcc,
                                    hash: blockInfo.hash,
                                    stable_index: blockInfo.stable_index,
                                })
                            }

                            //更新Token资产表
                            //DO 处理账户，发款方不在当前 tokenAccountsTotal 时 （以前已经储存在数据库了）
                            if (!tokenAccountsTotal.hasOwnProperty(fromAccAndcontract)) {
                                tokenAccountsTotal[fromAccAndcontract] = {
                                    account: contractFromAcc,
                                    contract_account: contractAccount,
                                    account_contract_merger: fromAccAndcontract,
                                    name: tempTokenInfo.token_name,
                                    symbol: tempTokenInfo.token_symbol,
                                    precision: tempTokenInfo.token_precision,
                                    balance: 0
                                }
                            }
                            //有log，必定是成功的

                            //处理收款方余额
                            if (tokenAccountsTotal.hasOwnProperty(toAccAndcontract)) {
                                //有：更新数据
                                tokenAccountsTotal[toAccAndcontract].balance = BigNumber(tokenAccountsTotal[toAccAndcontract].balance).plus(transData).toString(10);
                            } else {
                                //无：写入数据
                                tokenAccountsTotal[toAccAndcontract] = {
                                    account: contractToAcc,
                                    contract_account: contractAccount,
                                    account_contract_merger: toAccAndcontract,
                                    name: tempTokenInfo.token_name,
                                    symbol: tempTokenInfo.token_symbol,
                                    precision: tempTokenInfo.token_precision,
                                    balance: transData
                                }
                            }
                            //处理发款方余额
                            tokenAccountsTotal[fromAccAndcontract].balance = BigNumber(tokenAccountsTotal[fromAccAndcontract].balance).minus(transData).toString(10);
                            // unitIsFail = pageUtility.isFail(blockInfo); //交易失败了
                            // if (!unitIsFail) {}
                        } else {
                            //如果已经设为True，则保持不变
                            if (!blockInfo.is_token_trans) {
                                blockInfo.is_token_trans = false;//无Token转账
                            }
                        }
                        // }));
                        blockInfoLogIndex++;
                    }
                } else {
                    blockInfo.is_event_log = false;//无事件日志
                    blockInfo.is_token_trans = false;//无Token转账
                }

                //内部交易表
                if ((blockInfo.data) && (blockInfo.block_traces.length > 1)) {
                    blockInfo.is_intel_trans = true;
                    let tempTracesInfo;
                    blockInfo.block_traces.forEach((traces_item, index) => {
                        if (index > 0) {
                            //共有属性
                            tempTracesInfo = {
                                hash: blockInfo.hash,
                                mci: blockInfo.mci,
                                mc_timestamp: blockInfo.mc_timestamp,
                                stable_index: blockInfo.stable_index,
                                type: traces_item.type,

                                call_type: "",
                                from: "",
                                to: "",
                                gas: 0,
                                input: "",
                                value: 0,
                                init: "",
                                contract_address_suicide: "",
                                refund_adderss: "",
                                balance: 0,

                                gas_used: 0,
                                output: "",
                                contract_address_create: "",
                                contract_address_create_code: "",

                                is_error: traces_item.error ? true : false,
                                error_msg: traces_item.error || "",

                                subtraces: traces_item.subtraces,
                                trace_address: traces_item.trace_address.join("_")
                            }
                            //call类型
                            if (tempTracesInfo.type === 0) {
                                tempTracesInfo.call_type = traces_item.action.call_type;
                                tempTracesInfo.from = traces_item.action.from;
                                tempTracesInfo.to = traces_item.action.to;
                                tempTracesInfo.gas = traces_item.action.gas;
                                //2019年10月18日上午，RPC接口的更改, 返回数据中的 action.input 改为 action.data , 与周友对接
                                tempTracesInfo.input = traces_item.action.data;
                                tempTracesInfo.value = traces_item.action.amount;
                                if (!traces_item.error) {
                                    tempTracesInfo.gas_used = traces_item.result.gas_used || 0;
                                    tempTracesInfo.output = traces_item.result.output;
                                }
                            }
                            //create
                            if (tempTracesInfo.type === 1) {
                                tempTracesInfo.from = traces_item.action.from;
                                tempTracesInfo.gas = traces_item.action.gas;
                                tempTracesInfo.init = traces_item.action.init;
                                tempTracesInfo.value = traces_item.action.amount;

                                if (!traces_item.error) {
                                    tempTracesInfo.gas_used = traces_item.result.gas_used;
                                    tempTracesInfo.contract_address_create = traces_item.result.contract_account;
                                    tempTracesInfo.contract_address_create_code = traces_item.result.code;
                                }


                                //更改To，方便查询账户查询内部交易列表
                                tempTracesInfo.to = tempTracesInfo.contract_address_create;


                                //写账户类型
                                if (!accountsTotal.hasOwnProperty(tempTracesInfo.contract_address_create)) {
                                    accountsTotal[tempTracesInfo.contract_address_create] = {
                                        account: tempTracesInfo.contract_address_create,
                                        type: 2,
                                        balance: "0",
                                        is_token_account: false,//针对合约
                                        is_has_token_assets: false,
                                        is_has_token_trans: false,
                                        is_has_intel_trans: true,
                                        is_has_event_logs: false
                                    }
                                } else {
                                    accountsTotal[tempTracesInfo.contract_address_create].type = 2;
                                    accountsTotal[tempTracesInfo.contract_address_create].is_has_intel_trans = true;
                                }

                                //contract
                                // logger.info("内部交易新建合约:", tempTracesInfo.contract_address_create)
                                if (!traces_item.error) {
                                    contractInsertAry.push({
                                        contract_account: tempTracesInfo.contract_address_create,
                                        own_account: tempTracesInfo.from,
                                        born_unit: blockInfo.hash,
                                        token_name: "",
                                        token_symbol: ""
                                    });

                                    // code
                                    contractCodeInsertAry.push({
                                        contract_account: tempTracesInfo.contract_address_create,
                                        code: tempTracesInfo.contract_address_create_code
                                    });
                                }


                            }
                            //suicide
                            if (tempTracesInfo.type === 2) {
                                tempTracesInfo.contract_address_suicide = traces_item.action.contract_account;
                                tempTracesInfo.refund_adderss = traces_item.action.refund_account;
                                tempTracesInfo.balance = traces_item.action.balance;
                                //更改From，To，方便查询账户查询内部交易列表
                                tempTracesInfo.from = tempTracesInfo.contract_address_suicide;
                                tempTracesInfo.to = tempTracesInfo.refund_account;
                            }

                            //这里交易可以转CZR/CRCToken
                            if (!tempTracesInfo.is_error) {
                                if (tempTracesInfo.type === 2) {
                                    pageUtility.handlerAccountAssets(accountsTotal, tempTracesInfo.contract_address_suicide, tempTracesInfo.refund_adderss, 2, tempTracesInfo.balance)
                                } else if (tempTracesInfo.type === 0) {
                                    // if (tempTracesInfo.call_type !== 'staticcall') {
                                    // }
                                    pageUtility.handlerAccountAssets(accountsTotal, tempTracesInfo.from, tempTracesInfo.to, 1, tempTracesInfo.value)
                                } else if (tempTracesInfo.type === 1) {
                                    pageUtility.handlerAccountAssets(accountsTotal, tempTracesInfo.from, tempTracesInfo.contract_address_create, 1, tempTracesInfo.value)
                                }
                            }
                            transInternalInsertAry.push(tempTracesInfo);
                            //把账户对应的Hash存到索引表
                            accountIndexTransInternalAry.push({
                                account: tempTracesInfo.from,
                                hash: blockInfo.hash,
                                stable_index: blockInfo.stable_index,
                            })
                            if ((tempTracesInfo.from !== tempTracesInfo.to) && tempTracesInfo.to) {
                                accountIndexTransInternalAry.push({
                                    account: tempTracesInfo.to,
                                    hash: blockInfo.hash,
                                    stable_index: blockInfo.stable_index,
                                })
                            }

                        }
                    });
                } else {
                    blockInfo.is_intel_trans = false;
                }
                //********************************** 合约相关数据组装 结束 */
                // }));
                normalIndex++;
            }
            logger.info(`普通交易 结束`);

            /*
             * 处理账户
             * 处理Parent
             * 处理Block
             * */

            logger.info(`数据分装 结束`);
            await Promise.all([
                pageUtility.searchAccountBaseDb(),
                pageUtility.searchTimestampBaseDb(),
                pageUtility.searchTimestamp10BaseDb(),
                pageUtility.searchBlockBaseDb(),
                pageUtility.searchTokenBaseDb(tokenInsertAryHelpObj),
                pageUtility.searchTokenAssetBaseDb(tokenUpdateAryHelpObj),
            ]);
            pageUtility.stableInsertControl();
        },

        async searchAccountBaseDb() {
            //处理账户
            let tempAccountAllAry = Object.keys(accountsTotal);
            let upsertSql = {
                text: `
                select 
                    account,"type",
                    "is_token_account","is_has_token_assets",
                    "is_has_token_trans","is_has_intel_trans",
                    "is_has_event_logs"
                from 
                    accounts 
                where 
                    account = ANY ($1)
                `,
                values: [tempAccountAllAry]
            };
            let accountRes = await client.query(upsertSql);
            if (!accountRes.code) {
                let tempAccInfo = {};
                accountRes.rows.forEach(item => {
                    if (accountsTotal.hasOwnProperty(item.account)) {
                        tempAccInfo = accountsTotal[item.account];
                        if (item.is_token_account) {
                            tempAccInfo.is_token_account = true;
                        }
                        if (item.is_has_token_assets) {
                            tempAccInfo.is_has_token_assets = true;
                        }
                        if (item.is_has_token_trans) {
                            tempAccInfo.is_has_token_trans = true;
                        }
                        if (item.is_has_intel_trans) {
                            tempAccInfo.is_has_intel_trans = true;
                        }
                        if (item.is_has_event_logs) {
                            tempAccInfo.is_has_event_logs = true;
                        }
                        if (item.type === 2) {
                            tempAccInfo.type = 2;
                        }
                        accountsUpdateAry.push(tempAccInfo);//更新的数据
                        delete accountsTotal[item.account];
                    }
                });
                Object.keys(accountsTotal).forEach(function (key) {
                    if (accountsTotal[key]) {
                        accountsInsertAry.push(accountsTotal[key]);//需要插入的
                    }
                });
                logger.info(`Account完成     合计:${tempAccountAllAry.length} 更新:${accountsUpdateAry.length} 插入:${accountsInsertAry.length}`);
            }
        },
        async searchTimestampBaseDb() {
            //处理Timestamp
            let tempTimesAllAry = Object.keys(timestampTotal);
            let upsertSql = {
                text: "select timestamp from timestamp where timestamp = ANY ($1)",
                values: [tempTimesAllAry]
            };
            let timestampRes = await client.query(upsertSql);
            if (!timestampRes.code) {
                timestampRes.rows.forEach(item => {
                    if (timestampTotal.hasOwnProperty(item.timestamp)) {
                        timestampUpdateAry.push(timestampTotal[item.timestamp]);
                        delete timestampTotal[item.timestamp];
                    }
                });
                Object.keys(timestampTotal).forEach(function (key) {
                    timestampInsertAry.push(timestampTotal[key]);
                });

                logger.info(`Timestamp完成   合计:${tempTimesAllAry.length} 更新:${timestampUpdateAry.length} 插入:${timestampInsertAry.length}`);
            }
        },
        async searchTimestamp10BaseDb() {
            //处理 10Timestamp 开始
            let tempTimes10AllAry = Object.keys(timestamp10Total);
            let upsert10Sql = {
                text: "select timestamp from timestamp where timestamp = ANY ($1)",
                values: [tempTimes10AllAry]
            };
            let timestampRes = await client.query(upsert10Sql);
            if (!timestampRes.code) {
                timestampRes.rows.forEach(item => {
                    if (timestamp10Total.hasOwnProperty(item.timestamp)) {
                        timestamp10UpdateAry.push(timestamp10Total[item.timestamp]);
                        delete timestamp10Total[item.timestamp];
                    }
                });
                Object.keys(timestamp10Total).forEach(function (key) {
                    timestamp10InsertAry.push(timestamp10Total[key]);
                });

                logger.info(`Timestamp10完成 合计:${tempTimes10AllAry.length} 更新:${timestamp10UpdateAry.length} 插入:${timestamp10InsertAry.length}`);
            }
        },
        async searchBlockBaseDb() {
            logger.info(`Parents需处理:${Object.keys(parentsTotalAry).length}`); //parentsTotalAry 是目标数据 
            // pageUtility.spreadParent(parentsTotalAry, pageUtility.stableInsertControl);
            pageUtility.spreadParent(parentsTotalAry);
        },
        //去除已经更新过的合约信息
        async searchTokenBaseDb(tokenInsertAryHelpObj) {
            //处理账户
            let tempContractAllAry = Object.keys(tokenInsertAryHelpObj);
            let upsertSql = {
                text: `
                select 
                    contract_account,token_total,owner
                from 
                    token
                where 
                    contract_account = ANY ($1)
                `,
                values: [tempContractAllAry]
            };
            let contractRes = await client.query(upsertSql);
            if (!contractRes.code) {
                contractRes.rows.forEach(item => {
                    //减去错误增加的账户余额
                    tokenAccountsTotal[item.owner + item.contract_account].balance = BigNumber(tokenAccountsTotal[item.owner + item.contract_account].balance).minus(item.token_total).toString(10);
                    //删除已经存在的Token
                    delete tokenInsertAryHelpObj[item.contract_account];
                });

                //tokenInsertAryHelpObj 当前内容均是Token数据库不存在的Token，需要插入
                Object.keys(tokenInsertAryHelpObj).forEach(function (key) {
                    tokenInsertAry.push(tokenInsertAryHelpObj[key]);//需要插入的[]
                    contractUpdateAry.push(contractUpdateAryHelpObj[key]);//更新的数据
                });
                logger.info(`Contract筛选完成   需要插入Token数量:${tokenInsertAry.length}   需要更新合约数量:${contractUpdateAry.length}`);
                pageUtility.searchTokenAssetBaseDbForFilter(tokenAccountsTotal);
            }
        },
        //查询Token资产表，拆分插入和更新数据
        async searchTokenAssetBaseDbForFilter(tokenAccountsTotal) {
            let tempKeys = Object.keys(tokenAccountsTotal);
            let upsertSql = {
                text: `
                    select 
                        account_contract_merger 
                    from 
                        token_asset 
                    where 
                        account_contract_merger = ANY ($1)
                `,
                values: [tempKeys]
            };

            let tokenAssetRes = await client.query(upsertSql);

            if (!tokenAssetRes.code) {
                tokenAssetRes.rows.forEach(item => {
                    if (tokenAccountsTotal.hasOwnProperty(item.account_contract_merger)) {
                        tokenAssetUpdateAry.push(tokenAccountsTotal[item.account_contract_merger]);//更新的数据
                        delete tokenAccountsTotal[item.account_contract_merger];
                    }
                });
                Object.keys(tokenAccountsTotal).forEach(function (key) {
                    tokenAssetInsertAry.push(tokenAccountsTotal[key]);//需要插入的
                });
                logger.info(`Token资产表完成   需要插入数量:${tokenAssetInsertAry.length}   需要更新数量:${tokenAssetUpdateAry.length}`);
            }


            // pageUtility.stableInsertControl();
        },

        //查询Token资产表 
        //组装需要更新Token信息表的 transaction_count  account_count
        async searchTokenAssetBaseDb(tokenUpdateAryHelpObj) {
            let tempKeys = [];
            Object.keys(tokenUpdateAryHelpObj).forEach(item => {
                tokenUpdateAryHelpObj[item].haveAddress.forEach(childrenItem => {
                    tempKeys.push(childrenItem + item);
                })
            })

            let upsertSql = {
                text: `
                    select 
                        account,contract_account,account_contract_merger
                    from 
                        token_asset 
                    where 
                        account_contract_merger = ANY ($1)
                `,
                values: [tempKeys]
            };
            let tokenAssetRes = await client.query(upsertSql);
            let currentHaveAddress;
            let tempIndex;

            if (!tokenAssetRes.code) {
                tokenAssetRes.rows.forEach(item => {
                    // if (tokenUpdateAryHelpObj.hasOwnProperty(item.contract_account)) {}
                    currentHaveAddress = tokenUpdateAryHelpObj[item.contract_account].haveAddress;
                    tempIndex = currentHaveAddress.indexOf(item.account);
                    if (tempIndex !== -1) {
                        currentHaveAddress.splice(tempIndex, 1); //删除下标为tempIndex的元素
                    }
                });
                Object.keys(tokenUpdateAryHelpObj).forEach(item => {
                    tokenUpdateAry.push(
                        {
                            contract_account: item,
                            transaction_count: tokenUpdateAryHelpObj[item].transaction_count,
                            account_count: tokenUpdateAryHelpObj[item].haveAddress.length
                        }
                    )
                })

                logger.info(`Token更新信息筛选完成   需要更新:${tokenUpdateAry.length}`);
            }

            // pageUtility.stableInsertControl();
        },

        stableInsertControl() {
            logger.info(`数据过滤分装完成，完成分类操作`);
            pageUtility.batchInsertStable();
        },
        async batchInsertStable() {
            //批量提交
            logger.info("准备批量插入 START");
            try {

                await client.query('BEGIN')
                /*
                 * 批量插入 账户       accountsInsertAry
                 * 批量插入 时间       timestampInsertAry
                 * 批量插入 时间       timestamp10InsertAry
                 * 批量插入 Parent、   parentsTotalAry:Ary
                 * 批量插入 普通交易    normalTransInsertAry
                 * 批量插入 见证交易    witnessTransInsertAry
                 * 批量插入 创世交易    genesisTransInsertAry
                 * 批量插入 交易类型    allTransTypeAry
                 * 
                 * accountIndexTransAry
                 * */
                if (accountsInsertAry.length) {
                    pageUtility.batchInsertAccount(accountsInsertAry);
                }
                if (timestampInsertAry.length) {
                    pageUtility.batchInsertTimestamp(timestampInsertAry);
                }
                if (timestamp10InsertAry.length) {
                    pageUtility.batchInsertTimestamp(timestamp10InsertAry);
                }
                if (parentsTotalAry.length) {
                    pageUtility.batchInsertParent(parentsTotalAry);
                }
                if (normalTransInsertAry.length) {
                    pageUtility.batchInsertNormalBlock(normalTransInsertAry);
                }
                if (witnessTransInsertAry.length) {
                    pageUtility.batchInsertWitnessBlock(witnessTransInsertAry);
                }
                if (genesisTransInsertAry.length) {
                    pageUtility.batchInsertGenesissBlock(genesisTransInsertAry);
                }
                if (allTransTypeAry.length) {
                    pageUtility.batchInsertTransType(allTransTypeAry);
                }

                // batchInsertAccountIndexTrans 批量处理索引表
                if (accountIndexTransAry.length) {
                    pageUtility.batchInsertAccountIndexTrans(accountIndexTransAry);
                }
                if (accountIndexTransTokenAry.length) {
                    pageUtility.batchInsertAccountIndexTransToken(accountIndexTransTokenAry);
                }
                if (accountIndexTransInternalAry.length) {
                    pageUtility.batchInsertAccountIndexTransInternal(accountIndexTransInternalAry);
                }
                if (accountIndexTransLogAry.length) {
                    pageUtility.batchInsertAccountIndexTransLog(accountIndexTransLogAry);
                }


                /* 
                批量更新账户、       accountsUpdateAry
                批量更新 timestamp
                */
                if (accountsUpdateAry.length) {
                    pageUtility.batchUpdateAccount(accountsUpdateAry)
                }
                if (timestampUpdateAry.length) {
                    pageUtility.batchUpdateTimestamp(timestampUpdateAry)
                }
                if (timestamp10UpdateAry.length) {
                    pageUtility.batchUpdateTimestamp(timestamp10UpdateAry)
                }

                //更新Mci
                pageUtility.updateGlobalMci(db_LSBI);

                // **************************** 合约相关写入 开始
                /**
                 * 批量插入 合约表          contractInsertAry
                 * 批量更新 合约表          contractUpdateAry
                 * 批量插入 合约code表      contractCodeInsertAry

                 * 批量插入 token信息表         tokenInsertAry
                 * 批量更新 token信息表         tokenUpdateAry
                 * 
                 * 批量插入 token交易表     transTokenInsertAry
                 * 批量插入 内部交易表      transInternalInsertAry
                 * 批量插入 事件日志表      eventLogInsertAry
                 * 
                 * 批量插入 token资产表     tokenAssetInsertAry
                 * 批量插入 token资产表      tokenAssetUpdateAry
                 */
                if (contractInsertAry.length) {
                    pageUtility.batchInsterContract(contractInsertAry);
                }
                if (contractUpdateAry.length) {
                    pageUtility.batchUpdataContract(contractUpdateAry);
                }
                if (contractCodeInsertAry.length) {
                    pageUtility.batchInsertContractCode(contractCodeInsertAry);
                }

                if (tokenInsertAry.length) {
                    pageUtility.batchInsertToken(tokenInsertAry);
                }
                if (tokenUpdateAry.length) {
                    pageUtility.batchUpdateToken(tokenUpdateAry);
                }

                if (transTokenInsertAry.length) {
                    pageUtility.batchInertTransToken(transTokenInsertAry);
                }
                if (transInternalInsertAry.length) {
                    pageUtility.batchInertTransInternal(transInternalInsertAry);
                }
                if (eventLogInsertAry.length) {
                    pageUtility.batchInsertEvenLog(eventLogInsertAry);
                }

                if (tokenAssetInsertAry.length) {
                    pageUtility.batchInsertTokenAsset(tokenAssetInsertAry);
                }
                if (tokenAssetUpdateAry.length) {
                    pageUtility.batchUpdateTokenAsset(tokenAssetUpdateAry);
                }

                //-----------------------------------------
                // if (Object.keys(tokenAccountsTotal).length) {
                //     let account_increase_num = insertORupdate2token_asset(tokenAccountsTotal)
                //     if (tokenInsertAry.length) {
                //         let trans_increase_num = tokenInsertAry.length
                //         pageUtility.tokenUpdateOnce(tokenInsertAry[0].contract_account, trans_increase_num, account_increase_num)
                //     }
                // }

                //批量更新 token信息表         tokenUpdateAry
                // if (Object.keys(tokenUpdateAryHelpObj).length) {
                //     //把account_count 赋值到 tokenUpdateAryHelpObj
                //     Object.keys(tokenUpdateAryHelpObj).forEach(function (item) {
                //         tokenUpdateAry.push({
                //             contract_account: item,
                //             transaction_count: tokenUpdateAryHelpObj[item].transaction_count,
                //             account_count: tokenUpdateAryHelpObj[item].account_count,
                //         });
                //     });
                //     pageUtility.batchUpdateToken(tokenUpdateAry);
                // }
                // **************************** 合约相关写入 结束

                await client.query('COMMIT')
                logger.info("准备批量插入 END");
                pageUtility.clearRetry();

            } catch (e) {
                let err = await client.query('ROLLBACK')
                throw e
            }
        },
        async clearRetry() {
            //归零数据
            normalTransInsertAry = [];
            witnessTransInsertAry = [];
            genesisTransInsertAry = [];
            allTransTypeAry = [];
            accountsTotal = {};
            parentsTotalAry = [];

            accountsUpdateAry = [];
            accountsInsertAry = [];

            timestampTotal = {};
            timestampInsertAry = [];
            timestampUpdateAry = [];

            timestamp10Total = {};
            timestamp10InsertAry = [];
            timestamp10UpdateAry = [];
            //合约相关的
            contractInsertAry = [];//插入[Db]
            contractUpdateAry = [];//更新[Db]
            contractUpdateAryHelpObj = {};
            contractCodeInsertAry = [];//插入[Db]

            tokenInsertAry = [];//插入[Db]
            tokenUpdateAry = [];//更新[Db]
            tokenUpdateAryHelpObj = {}
            tokenInsertAryHelpObj = {}

            transTokenInsertAry = [];//插入[Db]
            transInternalInsertAry = [];//插入[Db]
            eventLogInsertAry = [];//插入[Db]

            tokenAssetInsertAry = [];//插入[Db]
            tokenAssetUpdateAry = [];//更新[Db]
            tokenAccountsTotal = {};

            //归零index tabel
            accountIndexTransAry = [];
            accountIndexTransTokenAry = [];
            accountIndexTransInternalAry = [];
            accountIndexTransLogAry = [];

            //Other
            isStableDone = db_LSBI < rpc_LSBI ? false : true;
            logger.info(`本次小结：Db稳定MCI:${db_LSBI}, RPC稳定Mci:${rpc_LSBI},是否完成稳定MCI的插入:${isStableDone}`);
            if (!isStableDone) {
                db_LSBI++;
                pageUtility.getUnitByLSBI();
            } else {
                //写完了
                pageUtility.init();
            }
        },
        //插入稳定的Unit ------------------------------------------------ End

        //批量插入Parent
        async batchInsertParent(parentAry) {
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
                // tempAry.push("('" + item.item + "','" + item.parent + "','" + item.is_witness + "','')");
                tempAry.push("('" + item.item + "','" + item.parent + "')");
            })
            let batchInsertSql = {
                // text: "INSERT INTO parents (item,parent,is_witness,prototype) VALUES " + tempAry.toString()
                text: "INSERT INTO parents (item,parent) VALUES " + tempAry.toString()
            };
            await client.query(batchInsertSql);
        },

        //批量插入账户
        async batchInsertAccount(accountAry) {
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
                if (item.account) {
                    tempAry.push(`
                        (
                            '${item.account}', 
                            ${item.type},
                            ${item.balance}, 
                            0,
                            ${item.is_token_account || false},
                            ${item.is_has_token_assets || false},
                            ${item.is_has_token_trans || false},
                            ${item.is_has_intel_trans || false},
                            ${item.is_has_event_logs || false}
                        )
                    `);
                }
            });
            // let batchInsertSql = {
            //     text: "INSERT INTO accounts (account,type,balance, transaction_count) VALUES" + tempAry.toString()
            // };
            let batchInsertSql = {
                text: `
                INSERT INTO 
                    accounts (
                        "account",
                        "type",
                        "balance", 
                        "transaction_count",
                        "is_token_account",
                        "is_has_token_assets",
                        "is_has_token_trans",
                        "is_has_intel_trans",
                        "is_has_event_logs"
                    ) 
                VALUES` + tempAry.toString()
            };
            await client.query(batchInsertSql);

            //更新账户数量
            let updateAccountCount = `
                update 
                    "global"
                set 
                    "value"= "value" + ${tempAry.length} 
                where 
                    key = 'accounts_count'
            `;
            await client.query(updateAccountCount);
        },
        //批量插入 timestamp
        async batchInsertTimestamp(timestampAry) {
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
            await client.query(batchInsertSql);
        },

        //插入 trans_witness
        async batchInsertWitnessBlock(blockAry) {
            let tempAry = [],
                calcObj = {};
            blockAry.forEach((item) => {
                tempAry.push(`
                (
                    '${item.hash}',
                    ${Number(item.type)},
                    '${item.from}',
                    ${Number(item.timestamp)},
                    '${item.signature}',

                    '${item.previous || ""}',
                    '${item.links || ""}',
                    '${item.last_stable_block || ""}',
                    '${item.last_summary_block || ""}',
                    '${item.last_summary || ""}',

                    '${item.is_stable}',
                    ${Number(item.level)},
                    ${Number(item.witnessed_level)},
                    '${item.best_parent || ""}',

                    ${Number(item.status)},
                    ${Number(item.stable_index)},
                    ${Number(item.mc_timestamp)},
                    ${Number(item.stable_timestamp)},
                    ${Number(item.mci)},

                    ${Number(item.is_free)},
                    ${Number(item.is_on_mc)}
                )
                `);
                if (item.mci > 0) {
                    calcAccountTranCount(item, calcObj)
                }
            });

            let batchInsertSql = {
                text: `
                INSERT INTO 
                    trans_witness(
                        "hash","type","from","timestamp","signature",
                        "previous","links","last_stable_block","last_summary_block","last_summary",

                        "is_stable",
                        "level","witnessed_level","best_parent",
                        "status","stable_index","mc_timestamp","stable_timestamp","mci",
                        "is_free","is_on_mc"
                    ) 
                VALUES` + tempAry.toString()
            };
            try {
                await client.query(batchInsertSql);
            }
            catch (e) {
                logger.info("batchInsertWitnessBlock")
                logger.info(e)
            }

            pageUtility.updateAccountTranCount(calcObj);
            pageUtility.updateGlobalTranCount('witness_count', tempAry.length);

        },

        //插入 trans_genesis 
        async batchInsertGenesissBlock(blockAry) {
            let tempAry = [];
            blockAry.forEach((item) => {
                tempAry.push(`
                (
                    '${item.hash}',
                    ${Number(item.type)},
                    '${item.from}',
                    ${Number(item.timestamp)},
                    '${item.signature}',

                    '${item.to}',
                    ${item.amount},
                    '${item.data_hash}',
                    '${item.data}',

                    '${item.is_stable}',
                    ${Number(item.level)},
                    ${Number(item.witnessed_level)},

                    ${Number(item.status)},
                    ${Number(item.stable_index)},
                    ${Number(item.mc_timestamp)},
                    ${Number(item.stable_timestamp)},
                    ${Number(item.mci)},

                    ${Number(item.is_free)},
                    ${Number(item.is_on_mc)},
                    '${item.from_state}',
                    '${item.to_states}',
                    ${Number(item.gas_used)},
                    '${(item.log)}',
                    '${(item.log_bloom)}'
                )
                `);
            });

            let batchInsertSql = {
                text: `
                INSERT INTO 
                    trans_genesis(
                        "hash","type","from","timestamp","signature",
                        "to","amount","data_hash","data",

                        "is_stable",
                        "level","witnessed_level",
                        "status","stable_index","mc_timestamp","stable_timestamp","mci",

                        "is_free","is_on_mc","from_state","to_states",

                        "gas_used","log","log_bloom"
                    ) 
                VALUES` + tempAry.toString()
            };


            try {
                await client.query(batchInsertSql);
            }
            catch (e) {
                logger.info("batchInsertGenesissBlock")
                logger.info(batchInsertSql)
                logger.info(e)
            }

        },

        //插入 trans_normal 
        async batchInsertNormalBlock(blockAry) {
            let tempAry = [],
                calcObj = {};
            blockAry.forEach((item) => {
                tempAry.push(`
                (
                    '${item.hash}',
                    ${Number(item.type)},
                    '${item.from}',
                    '${item.signature}',

                    '${item.to}',
                    ${item.amount},
                    '${item.previous}',
                    ${Number(item.gas)},
                    ${Number(item.gas_price)},
                    '${item.data_hash}',
                    '${item.data}',

                    '${item.is_stable}',
                    ${Number(item.level)},

                    '${item.from_state}',
                    '${item.to_states}',
                    ${Number(item.gas_used || 0)},
                    '${(item.log || "")}',
                    '${(item.log_bloom || "")}',
                    '${(item.contract_address || "")}',


                    ${Number(item.status)},
                    ${Number(item.stable_index)},
                    ${Number(item.mc_timestamp)},
                    ${Number(item.stable_timestamp)},
                    ${Number(item.mci)},

                    ${item.is_event_log},
                    ${item.is_token_trans},
                    ${item.is_intel_trans}
                )
                `);
                calcAccountTranCount(item, calcObj)
            });

            let batchInsertSql = {
                text: `
                INSERT INTO 
                    trans_normal(
                        "hash","type","from","signature",
                        "to","amount","previous","gas","gas_price","data_hash","data",

                        "is_stable",
                        "level",
                        "from_state","to_states","gas_used","log","log_bloom","contract_address",
                        "status","stable_index","mc_timestamp","stable_timestamp","mci",
                        "is_event_log","is_token_trans","is_intel_trans"
                    ) 
                VALUES` + tempAry.toString()
            };
            // await client.query(batchInsertSql);

            try {
                await client.query(batchInsertSql);
            }
            catch (e) {
                logger.info("batchInsertNormalBlock")
                logger.info(e)
            }

            pageUtility.updateAccountTranCount(calcObj);
            pageUtility.updateGlobalTranCount('normal_count', tempAry.length);

        },

        //更新accounts交易数
        async updateAccountTranCount(calcObj) {
            let valueStr = Object.keys(calcObj).map(key => `('${key}',${calcObj[key]})`).join()

            let query = `
                UPDATE 
                    accounts 
                SET 
                    transaction_count = transaction_count + temp.count 
                FROM 
                    (VALUES ${valueStr}) 
                AS 
                    temp(account, count) 
                WHERE 
                    accounts.account = temp.account
            `;
            await client.query(query);
        },

        //更新global交易数
        async updateGlobalTranCount(column_name, length) {
            let columnName = "";
            switch (column_name) {
                case "normal_count":
                    columnName = 'normal_count';
                    break;
                case "witness_count":
                    columnName = 'witness_count';
                    break;
                case "token_count":
                    columnName = 'token_count';
                    break;
                case "internal_count":
                    columnName = 'internal_count';
                    break;
            }

            //更新交易计数
            let update_tran_count = `
                update 
                    "global"
                set 
                    value= global.value + ${length}
                where 
                    key = '${columnName}'
            `;
            await client.query(update_tran_count);
        },

        //批量 trans type
        async batchInsertTransType(blockAry) {
            let tempAry = [],
                calcObj = {};
            blockAry.forEach((item) => {
                tempAry.push(
                    "('" +
                    item.hash + "'," +
                    Number(item.type) +
                    ")");
                calcAccountTranCount(item, calcObj)
            });

            let batchInsertSql = {
                text: `
                INSERT INTO trans_type(hash,type) 
                VALUES` + tempAry.toString()
            };
            await client.query(batchInsertSql);
        },

        //批量更新账户
        async batchUpdateAccount(accountsUpdateAry) {
            let tempAry = [];
            accountsUpdateAry.forEach((item) => {
                tempAry.push(
                    `
                    (
                        '${item.account}',
                        ${item.balance},
                        ${item.is_token_account || false},
                        ${item.is_has_token_assets || false},
                        ${item.is_has_token_trans || false},
                        ${item.is_has_intel_trans || false},
                        ${item.is_has_event_logs || false}
                    )
                    `
                );
            });

            let batchUpdateSql = `
                update 
                    accounts 
                set 
                    balance = accounts.balance + temp.balance ,
                    is_token_account = temp.is_token_account ,
                    is_has_token_assets = temp.is_has_token_assets ,
                    is_has_token_trans = temp.is_has_token_trans ,
                    is_has_intel_trans = temp.is_has_intel_trans ,
                    is_has_event_logs = temp.is_has_event_logs
                from 
                    (values ${tempAry.toString()}) 
                    as 
                    temp (account,balance,is_token_account,is_has_token_assets,is_has_token_trans,is_has_intel_trans,is_has_event_logs) 
                where 
                    accounts.account=temp.account
            `;
            await client.query(batchUpdateSql);
        },
        async batchUpdateTimestamp(timestampAry) {
            let tempAry = [];
            timestampAry.forEach((item) => {
                tempAry.push(
                    "(" +
                    item.timestamp + "," +
                    Number(item.count) +
                    ")");
            });
            // let batchUpdateSql = 'update timestamp set count= timestamp.count + temp.count from (values ' + tempAry.toString() +
            // ') as temp (timestamp,count) where timestamp.timestamp=temp.timestamp';
            // let batchUpdateSql = 'update timestamp set count= timestamp.count + temp.count from (values ' + tempAry.toString() + ') as temp (timestamp,count) where timestamp.timestamp=temp.timestamp';
            let batchUpdateSql = `
                update 
                    timestamp 
                set 
                    count= timestamp.count + temp.count 
                from 
                    (values ${tempAry.toString()}) 
                as 
                    temp (timestamp,count) 
                where 
                    timestamp.timestamp=temp.timestamp
            `;
            await client.query(batchUpdateSql);
        },

        //展开parent
        async spreadParent(sources_ary) {
            //falg : 1=>稳定 2=>不稳定
            // flag  1
            logger.info(`展开Parent Start`)
            let tempAry = []; //辅助展开parents作用
            sources_ary.forEach(item => {
                //展开parents
                if (item.parent.length) {
                    item.parent.forEach(childrenItem => {
                        tempAry.push({
                            item: item.item,
                            parent: childrenItem, //单个parents
                        });
                    })
                }
            })
            parentsTotalAry = tempAry;
            // fn();
        },
        async updateGlobalMci(val) {
            let pdateMciSql = `
                update 
                    global 
                set 
                    value=temp.value 
                        from (values 
                                ('done_stable_index',${Number(val)})
                            ) 
                    as 
                        temp(key,value)
                where 
                    global.key = temp.key
            `

            let res = await client.query(pdateMciSql);
            if (res.code) {
                // 出错
                logger.info(`done_stable_index更新失败 ${res}`);
            }
        },
        formatTimestamp(stable_timestamp) {
            return Math.floor(stable_timestamp / 10);
        },
        // ***************************************** 合约相关插入 开始
        //TODO:后期做通用的 批量更新函数 和 批量插入函数等
        //批量插入 合约表
        async batchInsterContract(contractInsertAry) {
            let tempAry = [];
            contractInsertAry.forEach((item) => {
                tempAry.push(
                    `
                    (
                        '${item.contract_account}',
                        '${item.own_account}',
                        '${item.born_unit}',
                        '${item.token_name}',
                        '${item.token_symbol}'
                    )
                    `
                );
            });
            let batchInsertSql = {
                text: `
                    INSERT INTO 
                        contract(
                            "contract_account",
                            "own_account",
                            "born_unit",
                            "token_name",
                            "token_symbol"
                            )
                    VALUES ${tempAry.toString()}`
            };
            await client.query(batchInsertSql);
        },
        //批量更新 合约表 
        //token_name和token_simbol字段
        async batchUpdataContract(contractUpdateAry) {
            let tempAry = [];
            // console.log("contractUpdateAry", contractUpdateAry.length);
            contractUpdateAry.forEach((item) => {
                tempAry.push(
                    `
                    (
                        '${item.contract_account}',
                        '${item.token_name}',
                        '${item.token_symbol}'
                    )
                    `
                );
            });
            let sql = `
                update 
                    contract 
                set 
                    token_name= temp.token_name,
                    token_symbol= temp.token_symbol
                from 
                    (values ${tempAry.toString()}) 
                as
                    temp(contract_account,token_name,token_symbol)
                where 
                    contract.contract_account = temp.contract_account
            `
            await client.query(sql);

            // let tempName = [];
            // let tempSimpol = [];
            // let tempAry = [];
            // contractUpdateAry.forEach((item) => {
            //     tempName.push(
            //         "WHEN'" + item.contract_account + "'THEN'" + item.token_name + "'"
            //     );
            //     tempSimpol.push(
            //         "WHEN'" + item.contract_account + "'THEN'" + item.token_symbol + "'"
            //     );
            //     tempAry.push(
            //         "'" + item.contract_account + "'"
            //     );
            // });
            // // let sql = `UPDATE contract SET token_name = CASE contract_account `+tempName.toString()+'END, token_symbol = CASE contract_account'+
            // // tempSimpol.toString()+'END WHERE contract_account IN (' + tempAry.join(',') + ")";

            // let sql = `
            //         UPDATE 
            //             contract 
            //         SET 
            //             token_name = CASE contract_account 
            //                 ${tempName.toString()} END, 
            //             token_symbol = CASE contract_account 
            //                 ${tempSimpol.toString()}END 
            //         WHERE 
            //             contract_account IN (${tempAry.join(',')})`;
        },

        //批量插入 合约code表
        async batchInsertContractCode(contractCodeInsertAry) {
            let tempAry = [];
            contractCodeInsertAry.forEach((item) => {
                tempAry.push(
                    `
                    (
                        '${item.contract_account}',
                        '${item.code}'
                    )
                    `
                );
            });

            let batchInsertSql = {
                text: `
                    INSERT INTO 
                        contract_code (
                            "contract_account",
                            "code"
                        )
                    VALUES ${tempAry.toString()}`
            };
            await client.query(batchInsertSql);
        },

        //批量插入 token表
        async batchInsertToken(tokenInsertAry) {
            let tempAry = [];
            let temptest = [];
            tokenInsertAry.forEach((item) => {
                temptest.push(item.contract_account);
                tempAry.push(
                    `
                    (
                        '${item.contract_account}',
                        '${item.mc_timestamp}',
                        '${item.token_name}',
                        '${item.token_symbol}',
                        ${Number(item.token_precision)},
                        ${Number(item.token_total)},
                        '${item.owner}',
                        ${Number(item.transaction_count)},
                        ${Number(item.account_count)}
                    )
                    `
                );
            });
            let batchInsertSql = {
                text: `
                    INSERT INTO 
                        token (
                            "contract_account",
                            "mc_timestamp",
                            "token_name",
                            "token_symbol",
                            "token_precision",
                            "token_total",
                            "owner",
                            "transaction_count",
                            "account_count"
                        )
                    VALUES ${tempAry.toString()}`
            };
            await client.query(batchInsertSql);
            pageUtility.updateGlobalTranCount('token_count', tempAry.length);
        },
        //批量更新 token表
        //transaction_count 和 account_count 字段
        async batchUpdateToken(tokenUpdateAry) {
            let tempAry = [];
            tokenUpdateAry.forEach((item) => {
                tempAry.push(
                    `
                    (
                        '${item.contract_account}',
                        ${item.transaction_count},
                        ${item.account_count}
                    )
                    `
                );
            });
            //                    

            let sql = `
                update 
                    token 
                set 
                    transaction_count = token.transaction_count + temp.transaction_count,
                    account_count = token.account_count + temp.account_count
                from 
                    (values ${tempAry.toString()}) 
                as
                    temp(contract_account,transaction_count,account_count)
                where 
                    token.contract_account = temp.contract_account
            `
            await client.query(sql);
        },

        //批量插入 token交易表
        async batchInertTransToken(transTokenInsertAry) {
            let tempAry = [];
            transTokenInsertAry.forEach(item => {
                tempAry.push(
                    `
                    (
                        '${item.hash}',
                        ${Number(item.mc_timestamp)},
                        ${Number(item.stable_index)},
                        '${item.from}',
                        '${item.to}',
                        '${item.contract_account}',
                        '${item.token_symbol}',
                        '${item.token_name}',
                        ${item.amount},

                        ${item.token_precision},
                        ${item.gas},
                        ${item.gas_price},
                        ${item.gas_used},
                        '${item.input}'
                    )
                    `
                );
            });
            let batchInsertSql = {
                text: `
                    INSERT INTO 
                        trans_token (
                            "hash",
                            "mc_timestamp",
                            "stable_index",
                            "from",
                            "to",
                            "contract_account",
                            "token_symbol",
                            "token_name",
                            "amount",

                            "token_precision",
                            "gas",
                            "gas_price",
                            "gas_used",
                            "input"
                        )
                    VALUES ${tempAry.toString()}`
            };
            logger.info("batchInertTransToken")
            await client.query(batchInsertSql);
        },
        //批量插入 内部交易表
        async batchInertTransInternal(transInternalInsertAry) {
            let tempAry = [];
            transInternalInsertAry.forEach(item => {
                tempAry.push(
                    `
                    (
                        '${item.hash}',
                        ${Number(item.mci)},
                        ${Number(item.mc_timestamp)},
                        ${Number(item.stable_index)},

                        ${Number(item.type)},

                        '${item.call_type}',
                        '${item.from}',
                        '${item.to}',
                        ${Number(item.gas)},
                        '${item.input}',
                        ${Number(item.value)},

                        '${item.init}',

                        '${item.contract_address_suicide}',
                        '${item.refund_adderss}',
                        ${item.balance},

                        ${Number(item.gas_used)},
                        '${item.output}',
                        '${item.contract_address_create}',
                        '${item.contract_address_create_code}',

                        ${item.is_error},
                        '${item.error_msg}',
                        '${item.subtraces}',
                        '${item.trace_address}'
                    )
                    `
                );

            });
            let batchInsertSql = {
                text: `
                    INSERT INTO 
                        trans_internal (
                            "hash",
                            "mci",
                            "mc_timestamp",
                            "stable_index",

                            "type",

                            "call_type",
                            "from",
                            "to",
                            "gas",
                            "input",
                            "value",

                            "init",

                            "contract_address_suicide",
                            "refund_adderss",
                            "balance",

                            "gas_used",
                            "output",
                            "contract_address_create",
                            "contract_address_create_code",

                            "is_error",
                            "error_msg",
                            "subtraces",
                            "trace_address"
                        )
                    VALUES ${tempAry.toString()}`
            };
            // logger.info(batchInsertSql);
            await client.query(batchInsertSql);
            pageUtility.updateGlobalTranCount('internal_count', tempAry.length);
        },
        //批量插入 事件日志表
        async batchInsertEvenLog(eventLogInsertAry) {
            let tempAry = [];
            eventLogInsertAry.forEach(item => {
                tempAry.push(
                    `
                    (
                        '${item.hash}',
                        ${Number(item.mci)},
                        ${Number(item.mc_timestamp)},
                        ${Number(item.stable_index)},

                        '${item.contract_address}',
                        '${item.from}',
                        '${item.to}',
                        '${item.method}',


                        '${item.address}',
                        '${item.data}',
                        '${item.topics}'
                    )
                    `
                );
            });
            let batchInsertSql = {
                text: `
                    INSERT INTO 
                        event_log (
                            "hash",
                            "mci",
                            "mc_timestamp",
                            "stable_index",

                            "contract_address",
                            "from",
                            "to",
                            "method",

                            "address",
                            "data",
                            "topics"
                        )
                    VALUES ${tempAry.toString()}`
            };
            await client.query(batchInsertSql);
        },

        //批量插入 token资产表
        async batchInsertTokenAsset(tokenAssetInsertAry) {
            let tempAry = [];
            tokenAssetInsertAry.forEach(item => {
                tempAry.push(
                    `
                    (
                        '${item.account}',
                        '${item.contract_account}',
                        '${item.account_contract_merger}',
                        '${item.name}',
                        '${item.symbol}',
                        '${item.precision}',
                        ${item.balance}
                    )
                    `
                );
            });
            let batchInsertSql = {
                text: `
                    INSERT INTO 
                        token_asset (
                            "account",
                            "contract_account",
                            "account_contract_merger",
                            "name",
                            "symbol",
                            "precision",
                            "balance"
                        )
                    VALUES ${tempAry.toString()}`
            };
            await client.query(batchInsertSql);
        },
        //批量更新 token资产表
        async batchUpdateTokenAsset(tokenAssetUpdateAry) {
            let tempAry = [];
            tokenAssetUpdateAry.forEach((item) => {
                tempAry.push(
                    `
                    (
                        '${item.account_contract_merger}',
                        ${item.balance}
                    )
                    `
                );
            });
            let sql = `
                update
                    token_asset 
                set 
                    balance = token_asset.balance + temp.balance
                from 
                    (values ${tempAry.toString()}) 
                as
                    temp(account_contract_merger,balance)
                where 
                    token_asset.account_contract_merger = temp.account_contract_merger
            `
            await client.query(sql);
        },
        //------------

        //批量插入更新 Account 表
        //将tokenAccountsTotal中的所有账户分插入tokenAssetUpdateAry列表或tokenAssetInsertAry列表，
        //并返回插入tokenAssetInsertAry列表元素的数量
        // async splitTotalAccountInto2Ary(tokenAccountsTotal) {
        //     let tempAry = [];
        //     Object.keys(tokenAccountsTotal).forEach((item) => {
        //         tempAry.push(
        //             `
        //             (
        //                 account = '${item}' and 
        //                 contract_account = '${item.contract_account}'
        //             )
        //             `
        //         );
        //         // tempAry.push(
        //         //     "(account='" + item + "'and contract_account='" + item.contract_account + "')"
        //         // );
        //     });
        //     let sql = `select account from token_asset where ` + tempAry.join('or');
        //     let rlt = await client.query(sql);
        //     rlt.rows.forEach((item) => {
        //         tokenAssetUpdateAry.push(tokenAccountsTotal[item]);
        //         tokenAccountsTotal[item] = null;
        //     });
        //     Object.keys(tokenAccountsTotal).forEach((item) => {
        //         if (tokenAccountsTotal[item]) {
        //             tokenAssetInsertAry.push(tokenAccountsTotal[item]);
        //         }
        //     });
        //     return Object.keys(tokenAccountsTotal).length - rlt.rows.length;
        // },
        // async tokenUpdateOnce(contract_count, tran_icr, acct_icr) {
        //     let sql = {
        //         text: `
        //                 update 
        //                     token 
        //                 set 
        //                     transaction_count = $1,
        //                     account_count = $2
        //                 where 
        //                     contract_account = $3
        //                 `,
        //         values: [tran_icr, acct_icr, contract_count]
        //     };
        //     await client.query(sql);
        // },
        // ------------

        //查询Token资产表 并插入/更新对应资产
        async updateAndInsertTokenAssert(tokenAccountsTotal) {

        },

        async call(con_ads, con_name) {
            //name          06fdde03
            //symbol        95d89b41
            //decimals      313ce567
            //totalSupply   18160ddd
            //owner         8da5cb5b
            let opt = '';
            switch (con_name) {
                case "name":
                    opt = "06fdde03";
                    break;
                case "symbol":
                    opt = "95d89b41";
                    break;
                case "decimals":
                    opt = "313ce567";
                    break;
                case "totalSupply":
                    opt = "18160ddd";
                    break;
                case "owner":
                    opt = "8da5cb5b";
                    break;
            }
            let arg1 = {
                "from": "czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u",//后期移除
                "to": con_ads,
                "data": opt
            };

            let res;

            try {
                res = await czr.request.call(arg1);//[ { name: '', type: 'string', value: 'canonChain' } ]
            } catch (error) {
                logger.info(`call Error`);
                logger.info(error);
            }
            let resString = await czr.utils.decode[con_name](res.output);
            return resString[0].value.toString(10);
        },
        // ***************************************** 合约相关插入 结束

        // **************************** 账户相关索引表插入 开始
        async batchInsertAccountIndexTrans(ary) {
            // ary = [
            //     {
            //         account: "account",
            //         hash: "hash",
            //         stable_index: 12,
            //     }
            // ]
            // format = {
            //     account: "String",
            //     hash: "String",
            //     stable_index: "Number",
            // }
            // let tempAry = [];
            // let insertStr = ``;
            // let keyAry = Object.keys(format);
            // keyAry.forEach(item => {
            //     insertStr += item;
            // })
            let tempAry = [];
            ary.forEach((item) => {
                tempAry.push(`
                (
                    '${item.account}',
                    '${item.hash}',
                    ${Number(item.stable_index)}
                )
                `)
            })
            let batchInsertSql = {
                text: `
                INSERT INTO 
                    account_index_trans (
                        "account",
                        "hash",
                        "stable_index"
                    ) 
                VALUES` + tempAry.toString()
            };
            try {
                await client.query(batchInsertSql);
            }
            catch (e) {
                logger.info("batchInsertAccountIndexTrans")
                logger.info(e)
            }

        },
        async batchInsertAccountIndexTransToken(ary) {
            let tempAry = [];
            ary.forEach((item) => {
                tempAry.push(`
                (
                    '${item.account}',
                    '${item.hash}',
                    ${Number(item.stable_index)}
                )
                `)
            })
            let batchInsertSql = {
                text: `
                INSERT INTO 
                    account_index_transtoken (
                        "account",
                        "hash",
                        "stable_index"
                    ) 
                VALUES` + tempAry.toString()
            };
            try {
                await client.query(batchInsertSql);
            }
            catch (e) {
                logger.info("batchInsertAccountIndexTransToken")
                logger.info(e)
            }
        },
        async batchInsertAccountIndexTransInternal(ary) {
            let tempAry = [];
            ary.forEach((item) => {
                tempAry.push(`
                (
                    '${item.account}',
                    '${item.hash}',
                    ${Number(item.stable_index)}
                )
                `)
            })
            let batchInsertSql = {
                text: `
                INSERT INTO 
                    account_index_transinternal (
                        "account",
                        "hash",
                        "stable_index"
                    ) 
                VALUES` + tempAry.toString()
            };
            try {
                await client.query(batchInsertSql);
            }
            catch (e) {
                logger.info("batchInsertAccountIndexTransInternal")
                logger.info(e)
            }
        },
        async batchInsertAccountIndexTransLog(ary) {
            let tempAry = [];
            ary.forEach((item) => {
                tempAry.push(`
                (
                    '${item.account}',
                    '${item.hash}',
                    ${Number(item.stable_index)}
                )
                `)
            })
            let batchInsertSql = {
                text: `
                INSERT INTO 
                    account_index_translog (
                        "account",
                        "hash",
                        "stable_index"
                    ) 
                VALUES` + tempAry.toString()
            };
            try {
                await client.query(batchInsertSql);
            }
            catch (e) {
                logger.info("batchInsertAccountIndexTransLog")
                logger.info(e)
            }
        },
        // **************************** 账户相关索引表插入 结束
        compareSort(property) {
            return function (obj1, obj2) {
                var value1 = obj1[property];
                var value2 = obj2[property];
                return value1 - value2;// 升序
            }
        },
        handlerAccountAssets(accountsTotal, from, to, account_type, balance) {
            if (!accountsTotal.hasOwnProperty(from)) {
                accountsTotal[from] = {
                    account: from,
                    type: account_type,
                    balance: "0",
                    is_token_account: false,//针对合约
                    is_has_token_assets: false,
                    is_has_token_trans: false,
                    is_has_intel_trans: true,
                    is_has_event_logs: false
                }
            } else {
                accountsTotal[from].is_has_intel_trans = true;
            }
            //处理收款方余额
            if (accountsTotal.hasOwnProperty(to)) {
                //有,收款方地址已存在cache中：更新数据
                accountsTotal[to].balance = BigNumber(accountsTotal[to].balance).plus(balance).toString(10);
                accountsTotal[to].is_has_intel_trans = true;

            } else {
                //无，收款方地址不存在cache中：写入数据
                accountsTotal[to] = {
                    account: to,
                    type: 1,//判断类型
                    balance: balance,
                    is_token_account: false,//针对合约
                    is_has_token_assets: false,
                    is_has_token_trans: false,
                    is_has_intel_trans: true,
                    is_has_event_logs: false
                }
            }
            //处理发款方余额
            accountsTotal[from].balance = BigNumber(accountsTotal[from].balance).minus(balance).toString(10);
        },
        setAccountProps(accountsTotal, acc) {
            if (!accountsTotal.hasOwnProperty(acc)) {
                accountsTotal[acc] = {
                    account: acc,
                    type: 1,//这里的值需要判断更新
                    balance: "0",
                    is_token_account: false,
                    is_has_token_assets: true,
                    is_has_token_trans: true,
                    is_has_intel_trans: false,
                    is_has_event_logs: true
                }
            } else {
                accountsTotal[acc].is_has_token_assets = true;
                accountsTotal[acc].is_has_token_trans = true;
                accountsTotal[acc].is_has_event_logs = true;
            }
        },
        isFail(obj) {
            //true 是失败的
            return (obj.is_stable === 1) && (obj.status !== 0);
        }
    };
    pageUtility.init();
})()