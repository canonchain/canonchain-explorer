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
    let db_LSBI, //本地数据库的最高稳定 last stable block index
        rpc_LSBI; //RPC接口请求到的最高稳定 last stable block index
    let isStableDone = false; //稳定的MCI是否插入完成
    //辅助数据 End

    // 操作稳定Unit相关变量 Start
    let unitIsFail;
    let MCI_LIMIT = 500;
    let stableCount = 0; //异步控制

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
    // 操作稳定Unit相关变量 End

    const getCount = require('./helper/count').getCount;
    const calcAccountTranCount = require('./account/transaction-count').calcCount; //更新账户交易计数

    //合约相关的
    // 账户表 accountsInsertAry accountsUpdateAry
    // 普通交易表 normalTransInsertAry

    let contractInsertAry = [];//插入[Db]     /done
    let contractUpdateAry = [];//更新[Db]       /done

    let contractCodeInsertAry = [];//插入[Db]       /done

    let tokenInsertAry = [];//插入[Db]      /done
    let tokenUpdateAry = [];//更新[Db]         /done

    let tokenAccountsTotal = {};
    let tokenAssetInsertAry = [];//插入[Db]   /done
    let tokenAssetUpdateAry = [];//更新[Db]    /done

    let transTokenInsertAry = [];//插入[Db]       /done
    let transInternalInsertAry = [];//插入[Db]
    let eventLogInsertAry = [];//插入[Db]     /done

    let pageUtility = {
        async init() {
            console.log("init begin");
            self = this;
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
            console.log("init done");
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
                // pageUtility.readyGetData();
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
            console.log('witness_list begin')
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
            console.log(witData.rows[0].count)
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
            }).then(async function (wit_list) {
                let witnessInfo = "('";
                witnessInfo += wit_list.witness_list.join("'),('");
                witnessInfo += "')";
                let witnessInsertSql = "INSERT INTO witness_list (account) VALUES " + witnessInfo;
                let res = await client.query(witnessInsertSql);
                pageUtility.readyGetData();
            })
        },
        readyGetData() {
            console.log('readyGetData begin')
            getRpcTimer = setTimeout(function () {
                pageUtility.getRPC()
            }, 5000);
            //TODO 时间抽出,定时器主要是为了unstable时候，避免无效读取 但 stable时候需要加快读取
        },
        getRPC() {
            console.log('getRPC begin')
            //获取网络中最新稳定的MCI
            logger.info(`获取网络中最新稳定的 LSBI-Start`);
            czr.request.status().then(function (status) {
                logger.info(`获取网络中最新稳定的 LSBI-Success `);
                logger.info(status);
                return status
            }).catch((err) => {
                console.log(err)
                logger.info(`获取网络中最新稳定的 LSBI-Error : ${err}`);
            })
                .then(function (status) {
                    console.log('db_LSBI:'+db_LSBI)
                    rpc_LSBI = Number(status.last_stable_block_index);
                    console.log("rpc_LSBI:"+rpc_LSBI)
                    if ((db_LSBI <= rpc_LSBI) || (db_LSBI === 0)) {
                        pageUtility.searchMci(status);
                    } else {
                        getUnstableTimer = setTimeout(function () {
                            // TODO 已经写完了，需要重新获取
                            pageUtility.readyGetData();
                            // console.log("last_stable_block_index 已经最新，6秒后重新获取")
                        }, 1000)
                    }
                })
        },

        //插入Mci信息
        async searchMci(status) {
            console.log('searchMci begin')
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
            console.log("getUnitByLSBI  begin");
            logger.info(`开始通过 ${MCI_LIMIT} ${db_LSBI} 向节点获取blocks ---------------------`);
            czr.request.stableBlocks(MCI_LIMIT, db_LSBI).then(async function (data) {
                //block信息一次拿不完，需要拿2次；
                BLOCKS_LENGTH = data.blocks.length;
                if (BLOCKS_LENGTH) {
                    //拿hash对应状态
                    data.blocks.forEach((item) => {
                        hashGroupAry.push(item.hash);
                    });
                    let hashStatesGroup = await czr.request.getBlockStates(hashGroupAry);
                    let blockStatesAry = hashStatesGroup.block_states;
                    // logger.info(blockStatesAry);
                    db_LSBI = blockStatesAry[blockStatesAry.length - 1].stable_content.stable_index;
                    logger.info(`拿到了结果, 最新LSBI: ${db_LSBI}`);
                    //写一级数据（TODO：目前继续使用以前一级数据模式，后期需要做调整）
                    data.blocks.forEach((item, index) => {
                        if (item.type === 0) {
                            //创世交易
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
                            data.blocks[index].previous = item.content.previous;
                            data.blocks[index].parents = item.content.parents || [];
                            data.blocks[index].links = item.content.links || [];//++新增属性
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
                            //status
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
                            data.blocks[index].gas_used = blockStatesAry[index].stable_content.gas_used;
                            data.blocks[index].log = blockStatesAry[index].stable_content.log;
                            data.blocks[index].log_bloom = blockStatesAry[index].stable_content.log_bloom;
                            data.blocks[index].contract_address = blockStatesAry[index].stable_content.contract_address;
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
            })
        },
        async filterData() {
            //2、根据稳定Units数据，筛选Account Parent Witness Timestamp，方便后续储存
            logger.info(`数据分装 开始`);
            //创世交易 写入表: account / trans_genesis
            if (genesisTransInsertAry.length) {
                genesisTransInsertAry.forEach(blockInfo => {
                    //DO 写创世块的金额
                    accountsTotal[blockInfo.from] = {
                        account: blockInfo.from,
                        type: 1,
                        balance: "0"
                    };
                    accountsTotal[blockInfo.to] = {
                        account: blockInfo.to,
                        type: 1,
                        balance: blockInfo.amount
                    };
                });
            }

            //普通交易 操作表: account / timestamp / trans_nomaol
            normalTransInsertAry.forEach(blockInfo => {
                //DO 处理账户，发款方不在当前 accountsTotal 时 （以前已经储存在数据库了）
                if (!accountsTotal.hasOwnProperty(blockInfo.from)) {
                    accountsTotal[blockInfo.from] = {
                        account: blockInfo.from,
                        type: 1,
                        balance: "0",
                        is_token_account: false,
                        is_has_token_trans: false,
                        is_has_intel_trans: false
                    }
                }
                //账户余额 只有是成功的交易才操作账户余额
                unitIsFail = pageUtility.isFail(blockInfo); //交易失败了
                if (!unitIsFail) {
                    //处理收款方余额
                    if (accountsTotal.hasOwnProperty(blockInfo.to)) {
                        //有,收款方地址已存在cache中：更新数据
                        accountsTotal[blockInfo.to].balance = BigNumber(accountsTotal[blockInfo.to].balance).plus(blockInfo.amount).toString(10);
                    } else {
                        //无，收款方地址不存在cache中：写入数据
                        if (blockInfo.to) {
                            accountsTotal[blockInfo.to] = {
                                account: blockInfo.to,
                                type: 1,
                                balance: blockInfo.amount
                            }
                        } else {
                            //合约账户
                            accountsTotal[blockInfo.contract_address] = {
                                account: blockInfo.contract_address,
                                type: 2,
                                balance: "0",
                                is_token_account: false,
                                is_has_token_trans: false,
                                is_has_intel_trans: false
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
                if (!blockInfo.to && blockInfo.contract_address) {
                    console.log("创建了合约", blockInfo.contract_address)
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
                if (blockInfo.log.length) {
                    console.log('get log');
                    blockInfo.is_event_log = true;
                    blockInfo.log.forEach(async (log_item) => {
                        eventLogInsertAry.push(
                            {
                                hash: blockInfo.hash,
                                mc_timestamp: blockInfo.mc_timestamp,
                                contract_account: log_item.address,
                                amount: parseInt(log_item.data, 16),
                                method: blockInfo.data,//ABI解析 封装方法解析
                                topics: log_item.topics.join(",")
                            }
                        );
                        //是否Token转账
                        if (log_item.topics.length && true) {
                            blockInfo.is_token_trans = true;
                            //解析出对应的Token信息

                            //查询合约有没有存在于Token表
                            let contractAccount = czr.utils.encode_account(log_item.address);
                            let contract_account_sql = {
                                text: "select contract_account from token where contract_account = $1",
                                values: [contractAccount]
                            };
                            let hasAccount = await client.query(contract_account_sql); 

                            if (!hasAccount.rows.length) {
                                //DO 更改合约表中的Token
                                //第一次发起Token转账,；检测是Token转账，并且Token表没有数据
                                let search_contract_sql = {
                                    text: "select contract_account from contract where contract_account = $1",
                                    values: [contractAccount]
                                };
                                let hasTokenSymbol = await client.query(search_contract_sql);

                                //插入Token信息
                                let TokenInfo = {
                                    token_name: pageUtility.call(contractAccount, "name"),
                                    token_symbol: pageUtility.call(contractAccount, "symbol"),
                                    token_precision: pageUtility.call(contractAccount, "decimals"),
                                    token_total: pageUtility.call(contractAccount, "totalSupply"),
                                };

                                if (hasTokenSymbol.rows.length && (!hasTokenSymbol.rows[0].token_symbol)) {
                                    contractUpdateAry.push({
                                        contract_account: contractAccount,
                                        token_name: TokenInfo.token_name,
                                        token_symbol: TokenInfo.token_symbol
                                    });
                                }

                                tokenInsertAry.push(
                                    {
                                        contract_account: contractAccount,
                                        token_name: TokenInfo.token_name[0].value,
                                        token_symbol: TokenInfo.token_symbol[0].value,
                                        token_precision: TokenInfo.token_precision[0].value,
                                        token_total: TokenInfo.token_total[0].value,
                                        transaction_count: 1,
                                        account_count: 1
                                    }
                                );
                            } else {   //token表里已经有了改token的记录
                                //更新Token表的交易数量和账户数量
                                // let new_account_count = 0;
                                // if( !tokenAccountsTotal.hasOwnProperty(log_item.topics[1]) ) new_account_count++;
                                // if( !tokenAccountsTotal.hasOwnProperty(log_item.topics[2]) ) new_account_count++;
                                tokenUpdateAry.push(
                                    {
                                        contract_account: log_item.address,
                                        transaction_count: 1,
                                        // account_count: new_account_count //cjd  账户数量需要判断
                                    }
                                );

                            }


                            let thisSimbol = pageUtility.call(contractAccount, "symbol");

                            //Token交易表
                            transTokenInsertAry.push(
                                {
                                    hash: blockInfo.hash,
                                    mc_timestamp: blockInfo.mc_timestamp,
                                    from: blockInfo.from,
                                    to: czr.utils.encode_account(log_item.topics[1]),
                                    contract_account: blockInfo.to,
                                    token_symbol: thisSimbol,
                                    amount: parseInt(log_item.data, 16) //cjd 需要思考token amount
                                }
                            );

                            //更新Token资产表
                            //DO 处理账户，发款方不在当前 tokenAccountsTotal 时 （以前已经储存在数据库了）

                            if (!tokenAccountsTotal.hasOwnProperty(blockInfo.from)) {
                                tokenAccountsTotal[blockInfo.from] = {
                                    account: blockInfo.from,
                                    contract_account: blockInfo.to,
                                    symbol: thisSimbol,
                                    balance: 0
                                }
                            }
                            //成功的合约
                            unitIsFail = pageUtility.isFail(blockInfo); //交易失败了
                            if (!unitIsFail) {
                                //处理收款方余额
                                if (tokenAccountsTotal.hasOwnProperty(blockInfo.to)) {
                                    //有：更新数据
                                    tokenAccountsTotal[blockInfo.to].balance = BigNumber(tokenAccountsTotal[blockInfo.to].balance).plus(parseInt(log_item.data, 16).toString()).toString(10);
                                } else {
                                    //无：写入数据
                                    if (blockInfo.to) {
                                        tokenAccountsTotal[blockInfo.to] = {
                                            account: blockInfo.to,
                                            contract_account: log_item.address,
                                            symbol: thisSimbol,
                                            balance: 0
                                        }
                                    }
                                }
                                //处理发款方余额
                                tokenAccountsTotal[blockInfo.from].balance = BigNumber(tokenAccountsTotal[blockInfo.from].balance).minus(parseInt(log_item.data, 16).toString()).toString(10);//改

                                //需要更改这些tokenAccountsTotal 对应账户表的 is_has_token_trans 为 true
                            }
                        } else {
                            blockInfo.is_token_trans = false;//无Token转账
                        }
                    })
                } else {
                    blockInfo.is_event_log = false;//无事件日志
                    blockInfo.is_token_trans = false;//无Token转账
                }

                //内部交易表
                if (false) {
                    blockInfo.is_intel_trans = true;
                    transInternalInsertAry.push(
                        {
                            hash: "",
                            mc_timestamp: "",
                            from: "",
                            to: "",
                            amount: "",
                            gas_limit: ""
                        }
                    );
                } else {
                    blockInfo.is_intel_trans = false;
                }
                //********************************** 合约相关数据组装 结束 */
            })

            //见证交易 操作表：trans_witness / parents
            witnessTransInsertAry.forEach(blockInfo => {
                //DO 处理 parents 数据
                parentsTotalAry.push({
                    item: blockInfo.hash,
                    parent: blockInfo.parents
                });
            });
            /*
             * 处理账户
             * 处理Parent
             * 处理Block
             * */

            logger.info(`数据分装 结束`);
            pageUtility.searchAccountBaseDb();
            pageUtility.searchTimestampBaseDb();
            pageUtility.searchTimestamp10BaseDb();
            pageUtility.searchBlockBaseDb();
        },

        async searchAccountBaseDb() {
            //处理账户
            let tempAccountAllAry = Object.keys(accountsTotal);
            let upsertSql = {
                text: "select account from accounts where account = ANY ($1)",
                values: [tempAccountAllAry]
            };
            client.query(upsertSql, (err, accountRes) => {
                if (err) {
                    logger.info(`searchAccountBaseDb Error`)
                    logger.info(err.stack)
                } else {
                    accountRes.rows.forEach(item => {
                        if (accountsTotal.hasOwnProperty(item.account)) {
                            accountsUpdateAry.push(accountsTotal[item.account]);//更新的数据
                            delete accountsTotal[item.account];
                        }
                    });
                    Object.keys(accountsTotal).forEach(function (key) {
                        accountsInsertAry.push(accountsTotal[key]);//需要插入的
                    });

                    logger.info(`Account完成     合计:${tempAccountAllAry.length} 更新:${accountsUpdateAry.length} 插入:${accountsInsertAry.length}`);
                    pageUtility.stableInsertControl();
                }
            })
        },
        async searchTimestampBaseDb() {
            //处理Timestamp
            let tempTimesAllAry = Object.keys(timestampTotal);
            let upsertSql = {
                text: "select timestamp from timestamp where timestamp = ANY ($1)",
                values: [tempTimesAllAry]
            };
            client.query(upsertSql, (err, timestampRes) => {
                if (err) {
                    logger.info(`searchTimestampBaseDb Error`)
                    logger.info(err.stack)
                } else {
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
                    //处理Timestamp 结束
                    pageUtility.stableInsertControl();
                }
            })
        },
        async searchTimestamp10BaseDb() {
            //处理 10Timestamp 开始
            let tempTimes10AllAry = Object.keys(timestamp10Total);
            let upsert10Sql = {
                text: "select timestamp from timestamp where timestamp = ANY ($1)",
                values: [tempTimes10AllAry]
            };

            client.query(upsert10Sql, (err, timestampRes) => {
                if (err) {
                    logger.info(`searchTimestampBaseDb Error`)
                    logger.info(err.stack)
                } else {
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
                    //处理 10Timestamp 结束
                    pageUtility.stableInsertControl();
                }
            })
        },
        async searchBlockBaseDb() {
            logger.info(`Parents需处理:${Object.keys(parentsTotalAry).length}`); //parentsTotalAry 是目标数据 
            pageUtility.spreadParent(parentsTotalAry, pageUtility.stableInsertControl);
        },
        stableInsertControl() {
            stableCount++;
            if (stableCount === 4) {
                logger.info(`数据过滤分装完成，完成分类操作`);
                stableCount = 0;
                pageUtility.batchInsertStable();
            }
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
                if (transTokenInsertAry.length) {
                    pageUtility.batchInertTrans_token(transTokenInsertAry);
                }
                if (contractInsertAry.length) {
                    pageUtility.batchInsterContract(contractInsertAry);
                }
                if (contractCodeInsertAry.length) {
                    pageUtility.batchInsertContract_code(contractCodeInsertAry);
                }
                if (tokenInsertAry.length) {
                    pageUtility.batchInsertToken(tokenInsertAry);
                }
                if (tokenInsertAry.length) {
                    pageUtility.batchUpdataContract(tokenInsertAry);
                }
                if (eventLogInsertAry.length) {
                    pageUtility.batchInsertEven_log(eventLogInsertAry);
                }

                if (Object.keys(tokenAccountsTotal).length) {
                    let account_increase_num = insertORupdate2token_asset(tokenAccountsTotal)
                    if (tokenInsertAry.length) {
                        let trans_increase_num = tokenInsertAry.length
                        pageUtility.tokenUpdateOnce(tokenInsertAry[0].contract_account, trans_increase_num, account_increase_num)
                    }
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

                await client.query('COMMIT')
                logger.info("准备批量插入 END");
                pageUtility.clearRetry();

            } catch (e) {
                await client.query('ROLLBACK')
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
            contractCodeInsertAry = [];//插入[Db]
            tokenInsertAry = [];//插入[Db]
            tokenUpdateAry = [];//更新[Db]
            tokenAssetInsertAry = [];//插入[Db]
            tokenAssetUpdateAry = [];//更新[Db]
            transTokenInsertAry = [];//插入[Db]
            transInternalInsertAry = [];//插入[Db]
            eventLogInsertAry = [];//插入[Db]

            //Other
            isStableDone = db_LSBI < rpc_LSBI ? false : true;
            logger.info(`本次小结：Db稳定MCI:${db_LSBI}, RPC稳定Mci:${rpc_LSBI},是否完成稳定MCI的插入:${isStableDone}`);
            if (!isStableDone) {
                db_LSBI++;
                pageUtility.getUnitByLSBI();
                // console.log("OKle")
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
                    tempAry.push(`('${item.account}', ${item.type}, ${item.balance}, 0)`);
                }
            });
            let batchInsertSql = {
                text: "INSERT INTO accounts (account,type,balance, transaction_count) VALUES" + tempAry.toString()
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
                tempAry.push(
                    "('" +
                    item.hash + "'," +
                    Number(item.type) + ",'" +
                    item.from + "','" +
                    item.previous + "'," +
                    Number(item.exec_timestamp) + ",'" +
                    item.work + "','" +
                    item.signature + "'," +
                    Number(item.level) + "," +
                    item.is_stable + "," +
                    Number(item.stable_index) + "," +
                    Number(item.status) + "," +
                    Number(item.mci) + "," +
                    Number(item.mc_timestamp) + "," +
                    Number(item.stable_timestamp) + ",'" +

                    item.last_stable_block + "','" +
                    item.last_summary_block + "','" +
                    item.last_summary + "'," +
                    item.is_free + "," +
                    item.witnessed_level + ",'" +
                    item.best_parent + "'," +
                    item.is_on_mc +
                    ")");
                calcAccountTranCount(item, calcObj)
            });

            let batchInsertSql = {
                text: `
                INSERT INTO 
                    trans_witness(
                        "hash","type","from","previous","exec_timestamp","work","signature",
                        "level","is_stable","stable_index","status","mci","mc_timestamp","stable_timestamp",
                        "last_stable_block","last_summary_block","last_summary","is_free",
                        "witnessed_level","best_parent","is_on_mc"
                    ) 
                VALUES` + tempAry.toString()
            };
            await client.query(batchInsertSql);

            pageUtility.updateAccountTranCount(calcObj);
            pageUtility.updateGlobalTranCount(1, tempAry.length);

        },

        //插入 trans_genesis 
        async batchInsertGenesissBlock(blockAry) {
            let tempAry = [],
                calcObj = {};
            blockAry.forEach((item) => {
                tempAry.push(
                    "('" +
                    item.hash + "'," +
                    Number(item.type) + ",'" +
                    item.from + "','" +
                    item.previous + "'," +
                    Number(item.exec_timestamp) + ",'" +
                    item.work + "','" +
                    item.signature + "'," +
                    Number(item.level) + "," +
                    item.is_stable + "," +
                    Number(item.stable_index) + "," +
                    Number(item.status) + "," +
                    Number(item.mci) + "," +
                    Number(item.mc_timestamp) + "," +
                    Number(item.stable_timestamp) + ",'" +

                    item.to + "'," +
                    Number(item.amount) + ",'" +
                    item.data + "','" +
                    item.data_hash + "'" +
                    ")");
                calcAccountTranCount(item, calcObj)
            });

            let batchInsertSql = {
                text: `
                INSERT INTO 
                    trans_genesis(
                        "hash","type","from","previous","exec_timestamp","work","signature",
                        "level","is_stable","stable_index","status","mci","mc_timestamp","stable_timestamp",
                        "to","amount","data","data_hash"
                    ) 
                VALUES` + tempAry.toString()
            };
            await client.query(batchInsertSql);

            pageUtility.updateAccountTranCount(calcObj);
            pageUtility.updateGlobalTranCount(0, tempAry.length);

        },

        //插入 trans_normal 
        async batchInsertNormalBlock(blockAry) {
            let tempAry = [],
                calcObj = {};
            blockAry.forEach((item) => {
                tempAry.push(
                    "('" +
                    item.hash + "'," +
                    Number(item.type) + ",'" +
                    item.from + "','" +
                    item.previous + "'," +
                    Number(item.exec_timestamp) + ",'" +
                    item.work + "','" +
                    item.signature + "'," +
                    Number(item.level) + "," +
                    item.is_stable + "," +
                    Number(item.stable_index) + "," +
                    Number(item.status) + "," +
                    Number(item.mci) + "," +
                    Number(item.mc_timestamp) + "," +
                    Number(item.stable_timestamp) + "," +

                    Number(item.gas) + "," +
                    Number(item.gas_used || 2) + "," +
                    Number(item.gas_price) + ",'" +
                    (item.contract_address || "") + "','" +
                    (item.log || "") + "','" +
                    (item.log_bloom || "") + "','" +


                    item.to + "'," +
                    Number(item.amount) + ",'" +
                    item.data + "','" +
                    item.data_hash + "'" +
                    ")");
                calcAccountTranCount(item, calcObj)
            });

            let batchInsertSql = {
                text: `
                INSERT INTO 
                    trans_normal(
                        "hash","type","from","previous","exec_timestamp","work","signature",
                        "level","is_stable","stable_index","status","mci","mc_timestamp","stable_timestamp",
                        "gas","gas_used","gas_price","contract_address","log","log_bloom",
                        "to","amount","data","data_hash"
                    ) 
                VALUES` + tempAry.toString()
            };
            await client.query(batchInsertSql);

            pageUtility.updateAccountTranCount(calcObj);
            pageUtility.updateGlobalTranCount(2, tempAry.length);

        },

        //更新accounts交易数
        async updateAccountTranCount(calcObj) {
            let valueStr = Object.keys(calcObj).map(key => `('${key}',${calcObj[key]})`).join()
            let query = `
                UPDATE 
                    accounts 
                SET 
                    transaction_count = transaction_count + tmp.count 
                FROM 
                    (VALUES ${valueStr}) 
                AS 
                    tmp(account, count) 
                WHERE 
                    accounts.account = tmp.account
            `;
            await client.query(query);
        },

        //更新global交易数
        async updateGlobalTranCount(type, length) {
            //0:创世  1:见证  2:普通
            let columnName = "";
            if (type === 2) {
                columnName = 'normal_count';
            } else {
                columnName = 'witness_count';
            }
            //更新交易计数
            let update_tran_count = `
                update 
                    "global"
                set 
                    "value"= "value" + ${length} 
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

        //批量插入新构建合约的code
        async batchInsertContract_code(contract_codeAry) {
            let tempAry = [];
            contract_codeAry.forEach((item) => {
                tempAry.push(
                    "('" +
                    item.contract_account + "'," +
                    "'" + item.code + "')"
                )
            });

            let batchInsertSql = {
                text: `INSERT INTO contract_code VALUES ` + tempAry.toString()
            };
            await client.query(batchInsertSql);
        },

        //批量更新合约的token_name和token_simbol字段
        async batchUpdataContract(contractUpdateAry) {
            let tempName = [];
            let tempSimpol = [];
            let tempAry = [];
            contractUpdateAry.forEach((item) => {
                tempName.push(
                    "WHEN'"+item.contract_account+"'THEN'"+item.token_name+"'"
                );
                tempSimpol.push(
                    "WHEN'"+item.contract_account+"'THEN'"+item.token_symbol+"'"
                );
                tempAry.push(
                    "'"+item.contract_account+"'"
                );
            });
            let sql = `UPDATE contract SET token_name = CASE contract_account `+tempName.toString()+'END, token_symbol = CASE contract_account'+
            tempSimpol.toString()+'END WHERE contract_account IN (' + tempAry.join(',') + ")";
            await client.query(sql);
        },

        //将tokenAccountsTotal中的所有账户分插入tokenAssetUpdateAry列表或tokenAssetInsertAry列表，并返回插入tokenAssetInsertAry列表元素的数量
        async splitTotalAccountInto2Ary(tokenAccountsTotal) {
            let tempAry = [];
            Object.keys(tokenAccountsTotal).forEach((item) => {
                tempAry.push(
                    "(account='" + item + "'and contract_account='"+item.contract_account + "')"
                );
            });
            let sql = `select account from token_asset where ` + tempAry.join('or');
            rlt  =  await client.query(sql);
            rlt.rows.forEach((item) => {
                tokenAssetUpdateAry.push(tokenAccountsTotal[item]);
                tokenAccountsTotal[item] = null;
            });
            Object.keys(tokenAccountsTotal).forEach((item) => {
                if(tokenAccountsTotal[item]){
                    tokenAssetInsertAry.push(tokenAccountsTotal[item]);
                }
            });
            return Object.keys(tokenAccountsTotal).length - rlt.rows.length;
        },

        async tokenUpdateOnce(contract_count, tran_icr, acct_icr) {
            let sql = {
                text: `update 
                    token 
                set 
                    transaction_count = $1,
                    account_count = $2
                where 
                    contract_account = $3
                `,
                values :[tran_icr, acct_icr, contract_count]
            };
            await client.query(sql);
        },

        //批量插入新构建合约
        async batchInsterContract(contractAry) {
            let tempAry = [];
            contractAry.forEach((item) => {
                tempAry.push(
                    "('" +
                    item.contract_account + "'," +
                    "'" + item.own_account + "'," +
                    "'" + item.born_unit + "'," +
                    "'" + item.token_name + "'," +
                    "'" + item.token_symbol + "')"
                );
            });
            let batchInsertSql = {
                text: `
                INSERT INTO contract VALUES` + tempAry.toString()
            };
            await client.query(batchInsertSql);

        },

        //批量插入token表
        async batchInsertToken(tokenAry) {
            let tempAry = [];
            tokenAry.forEach((item) => {
                tempAry.push(
                    "('" +
                    item.contract_account + "'," +
                    "'" + item.token_name + "'," +
                    "'" + item.token_symbol + "'," +
                    "'" + Number(item.token_precision) + "'," +
                    "'" + Number(item.token_total) + "'," +
                    "'" + Number(item.transaction_count) + "'," +
                    "'" + Number(item.account_count) + "')"
                );
            });
            let batchInsertSql = {
                text: `
                INSERT INTO token VALUES` + tempAry.toString()
            };
            await client.query(batchInsertSql);
        },


        //批量插入token交易表
        async batchInertTrans_token(transTokenInsertAry) {
            let tempAry = [];
            transTokenInsertAry.forEach(item => {
                tempAry.push(
                    "('" +
                    item.hash + "'," +
                    "'" + Number(item.mc_timestamp) + "'," +
                    "'" + item.token_symbol + "'," +
                    "'" + item.from + "'," +
                    "'" + item.to + "'," +
                    "'" + item.contract_account + "'," +
                    "'" + item.token_symbol + "'," +
                    "'" + Number(item.account_count) + "')"
                );
            });
            let batchInsertSql = {
                text: `
                    INSET INTO trans_token VALUES ` + tempAry.toString()
            };
            await client.query(batchInsertSql);
        },

        //批量插入事件日志表
        async batchInsertEven_log(eventLogInsertAry) {
            let tempAry = [];
            eventLogInsertAry.forEach(item => {
                tempAry.push(
                    "('" + item.hash + "'," +
                    "'" + Number(item.mc_timestamp) + "'," +
                    "'" + item.contract_account + "'," +
                    "'" + item.amount + "'," +
                    "'" + item.method + "'," +
                    "'" + item.topics + "')"
                );
            });
            let batchInsertSql = {
                text : `INSERT INTO event_log VALUES ` + tempAry.toString()
            };
            await client.query(batchInsertSql);
        },

        //批量插入token_asset表
        async batchInsertToken_asset(contractInsertAry) {
            let tempAry = [];
            contractInsertAry.forEach((item) => {
                tempAry.push(
                    "('" + item.account + "'," +
                    "'" + item.contract_account + "'," +
                    "'" + item.symbol + "'," +
                    "'" + item.balance + "')" 
                );
            });
            let sql = {
                text : `INSERT INTO token_asset  VALUES ` + tempAry.toString()
            };
            await client.query(sql);
        },

        //批量更新token_asset表
        async batchUpdateToken_asset(tokenAssetUpdateAry) {
            let tempAry = [];
            tokenAssetUpdateAry.forEach((item) =>{
                tempAry.push(
                    "update token_asset set balance ='"+item.balance+"' where account='"+item.account+"' and contract_account='"+item.contract_account+"'"
                );
            });
            let sql = {
                text:tempAry.join(';')
            };
            await client.query(sql);
        },

        //批量更新账户
        async batchUpdateAccount(accountAry) {
            let tempAry = [];
            accountAry.forEach((item) => {
                tempAry.push(
                    "('" +
                    item.account + "'," +
                    Number(item.balance) +
                    ")");
            });
            // let batchUpdateSql = 'update accounts set balance = accounts.balance + tmp.balance from (values ' + tempAry.toString() +
            // ') as tmp (account,balance) where accounts.account=tmp.account';

            // let batchUpdateSql = 'update accounts set balance = accounts.balance + tmp.balance from (values ' + tempAry.toString() + ') as tmp (account,balance) where accounts.account=tmp.account';
            let batchUpdateSql = `
                update 
                    accounts 
                set 
                    balance = accounts.balance + tmp.balance 
                from 
                    (values ${tempAry.toString()}) 
                    as 
                    tmp (account,balance) 
                where 
                    accounts.account=tmp.account
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
            // let batchUpdateSql = 'update timestamp set count= timestamp.count + tmp.count from (values ' + tempAry.toString() +
            // ') as tmp (timestamp,count) where timestamp.timestamp=tmp.timestamp';
            // let batchUpdateSql = 'update timestamp set count= timestamp.count + tmp.count from (values ' + tempAry.toString() + ') as tmp (timestamp,count) where timestamp.timestamp=tmp.timestamp';
            let batchUpdateSql = `
                update 
                    timestamp 
                set 
                    count= timestamp.count + tmp.count 
                from 
                    (values ${tempAry.toString()}) 
                    as 
                        tmp (timestamp,count) 
                where 
                    timestamp.timestamp=tmp.timestamp
            `;
            await client.query(batchUpdateSql);
        },

        //展开parent
        async spreadParent(sources_ary, fn) {
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
            fn();
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
        async call(con_ads, con_name) {
            //name          06fdde03
            //symbol        95d89b41
            //decimals      313ce567
            //totalSupply   18160ddd
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
            }
            let arg1 = {
                "from": "czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u",//后期移除
                "to": con_ads,
                "data": opt
            };
            let res = await czr.request.call(arg1);

            //[ { name: '', type: 'string', value: 'canonChain' } ]
            return czr.utils.decode[opt](res.output)

        },
        isFail(obj) {
            //true 是失败的
            return (obj.is_stable === 1) && (obj.status !== 0);
        }
    };
    pageUtility.init();
})()