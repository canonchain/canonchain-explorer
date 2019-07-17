/**
 * 把ETH上映射事件写入到sql表，等待签名
 * 需要一定要用 pm2 启动，否则容易被infura屏蔽
 */
(async () => {
    const Web3 = require("web3")
    const config = require("./config/to_sql_config")
    const web3 = new Web3('https://rinkeby.infura.io/' + config.INFURA_KEY);
    let Czr = require("czr");
    let czr = new Czr();
    // logger
    let log4js = require('../database/log_config');
    let logger = log4js.getLogger('mapping_write_sql');
    let pgPromise = require("../database/PG-promise");

    const ABI = [
        {
            type: 'bytes',
            name: 'czrAccount'
        },
        {
            type: 'address',
            name: 'ethAddress'
        },
        {
            type: 'uint256',
            name: 'timestamp'
        },
        {
            type: 'uint256',
            name: 'value',
            indexed: true
        }
    ];

    /**
     * 0、查询 mapping_block_number 表，没有字段则创建"key"/"value"
     * 1、获取ETH网络最新 eth_block_number，
     *    获取数据库最新的 db_block_number （从数据库获取，单独一张表存储）
     *    如果 eth_block_number 大于当前处理的 db_block_number , 则循环递增 db_block_number ，并逐个块获取log(直到 db_block_number 等于 eth_block_number ，则退出循环)
     * 2、block_number 存入数据库
     *    
     * 
     */
    logger.info(" ************************** 开始 **************************");
    let db_block_number,
        eth_block_number;
    let timer = null;
    let contractOpt = {}

    let pageUtility = {
        async startTimer(duration) {
            timer = setTimeout(function () {
                pageUtility.start()
            }, Number(duration) * 1000);
        },
        async start() {
            try {
                db_block_number = await pageUtility.getDbBlockNum();
                //-12 
                eth_block_number = await web3.eth.getBlockNumber();
                eth_block_number = Number(eth_block_number) - 12;

                logger.info(`db_block_number:${db_block_number}  eth_block_number:${eth_block_number}`)

                while (eth_block_number > db_block_number) {
                    db_block_number++;
                    contractOpt = {
                        address: config.CONTRACT_ADDRESS,
                        "fromBlock": pageUtility.tohex(db_block_number),
                        "toBlock": pageUtility.tohex(db_block_number),
                        topics: ["0x94fcee0b7b95ac21ec59ec2c5b2e99e75c909351baf99e93cd97e713d820627b"]
                    };
                    await pageUtility.getContractInfo()
                    // db_block_number 存入数据库
                    logger.info("数据库 更新 db_block_number ")
                    pageUtility.updateDbBlockNum(db_block_number, eth_block_number);
                }
                pageUtility.startTimer(10)
            } catch (e) {
                logger.info(`start catch 错误`)
                logger.info(e)
                pageUtility.startTimer(1)
            }
        },
        async getContractInfo() {
            try {
                let resuleInfo = await web3.eth.getPastLogs(contractOpt);
                logger.info(`从WEB3拿到数据数量:${resuleInfo.length} ，参数db_block_number：${db_block_number} - ${contractOpt.fromBlock}`)
                if (resuleInfo.length) {
                    pageUtility.parseContractInfo(resuleInfo);
                }
            } catch (error) {
                logger.info("web3.eth.getPastLogs 出错了")
                logger.info(error)
            }
        },
        async parseContractInfo(resuleInfo) {
            let logAry = []
            await Promise.all(resuleInfo.map(async (item) => {
                if (!item.removed) {
                    let decodeLogInfo = await web3.eth.abi.decodeLog(
                        ABI,
                        item.data,
                        [item.topics[1]]
                    );
                    let insertLog = {
                        timestamp: decodeLogInfo.timestamp.toString(10),
                        tx: item.transactionHash,
                        eth_address: decodeLogInfo.ethAddress,
                        czr_account: czr.utils.encode_account(decodeLogInfo.czrAccount.substring(2)),
                        block_number: item.blockNumber,
                        value: decodeLogInfo.value.toString(10),
                        status: 1
                    }
                    // console.log(parseInt(item.blockNumber, 16), item.blockNumber)
                    logAry.push(insertLog);
                } else {
                    logger.info("item.removed为True，交易失败的情况，不做处理")
                    logger.info(item)
                }
            }))
            if (logAry.length) {
                logger.info("先查询数据库是否存在")
                pageUtility.searchLogSql(logAry);
            }
        },
        async searchLogSql(array) {
            let temp = [];
            array.forEach(element => {
                temp.push(element.tx)
            })
            let searchSql = {
                text: `
                    select
                        "tx",
                    from 
                        mapping_eth_log 
                    where 
                        tx = ANY ($1)
        
                `,
                values: [temp]
            };

            let searchData = await pgPromise.query(searchSql);
            if (!searchData.code) {
                if (searchData.rows.length) {
                    let txIndex;
                    searchData.rows.forEach(element => {
                        txIndex = array.indexOf(element.tx);
                        if (txIndex > -1) {
                            array.splice(txIndex, 1);
                        }
                    });
                }
            } else {
                logger.info("searchLogSql 失败了:", searchData)
                throw searchData;
            }

            if (array.length) {
                logger.info("插入数据库的数量:", array.length)
                pageUtility.insertLogSql(array);
            }

        },
        async insertLogSql(array) {
            let tempAry = [];
            array.forEach(element => {
                tempAry.push(`
                    (
                        ${Number(element.timestamp)},
                        '${element.tx}',
                        '${element.eth_address}',
                        '${element.czr_account}',
                        '${element.block_number}',
                        ${Number(element.value)},
                        ${Number(element.status)}
                    )
                `)
            });
            let batchInsertSql = {
                text: `
                INSERT INTO 
                    mapping_eth_log (
                        "timestamp",
                        "tx",
                        "eth_address",
                        "czr_account",
                        "block_number",
                        "value",
                        "status"
                    ) 
                VALUES` + tempAry.toString()
            };
            logger.info("准备插入到数据库")
            try {
                await pgPromise.query(batchInsertSql);
                logger.info("插入成功")
            } catch (e) {
                logger.info("插入失败")
                logger.info(e)
                throw e;
            }
        },
        async getDbBlockNum() {
            let sql = {
                text: `
                    Select 
                        "key","value"
                    FROM 
                        mapping_block_number
                    where
                        "key" ='db_block_number'
                `,
                values: []
            }
            let blockInfo = await pgPromise.query(sql);
            if (blockInfo.rowCount === 0) {
                //需要插入 db_block_number
                logger.info(`写入 mapping_block_number Key`)
                const insertVal = `
                    ('latest_hash','' ),
                    ('db_block_number','${config.INIT_BLOCK_NUM}' ),
                    ('eth_block_number','${config.INIT_BLOCK_NUM}' )
                `;

                let firstInsert = "INSERT INTO mapping_block_number (key,value) VALUES " + insertVal;
                let res = await pgPromise.query(firstInsert);
                if (res.code) {
                    // 出错
                    logger.info(`写入 mapping_block_number 失败`);
                    logger.info(res);
                    throw res;
                }
                return config.INIT_BLOCK_NUM;
            } else {
                // logger.info(Number(blockInfo.rows[0].value))
                if (!blockInfo.rows.length) {
                    throw 'blockInfo.rows.length 不存在';
                }
                return Number(blockInfo.rows[0].value);
            }
        },
        async updateDbBlockNum(db_block_number, eth_block_number) {
            let batchUpdateSql = `
                update 
                    mapping_block_number
                set
                    value=temp.value 
                        from (values 
                                ('db_block_number','${db_block_number}'),
                                ('eth_block_number','${eth_block_number}')
                            ) 
                    as 
                        temp(key,value)
                where 
                    mapping_block_number.key = temp.key
            `;
            await pgPromise.query(batchUpdateSql);
        },
        tohex(num) {
            return ("0x" + num.toString(16));
        }
    }
    pageUtility.start();
})()