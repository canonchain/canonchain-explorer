

(async () => {
    const Web3 = require("web3")
    const key = require("./infura_key")
    const web3 = new Web3('https://rinkeby.infura.io/' + key);
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
    let contractOpt = {}
    let getSqlTimer = null;
    let nextFromBlock;
    let fromBlockNum;
    //需要改为正式的
    let MAPP_INFO = {
        INIT_BLOCK_NUM: 4639323,
        CONTRACT_ADDRESS: "0xA766d355Ef29502Ca68637F0BCb9Ff7284D1ace2"
    }
    /**
     * 1.从sql表找FromBlock
     *      找到用找到的
     *      找不到用初始的值
     * 2.web3获取web信息
     * 3.解析获取的合约信息并组装好
     * 4.插入db
     * 5.从1开始
     */
    logger.info(" ************************** 开始 **************************");

    let pageUtility = {
        async init() {
            fromBlockNum = nextFromBlock ? (Number(nextFromBlock) + 1) : (await pageUtility.searchMaxBlcok());
            contractOpt = {
                address: MAPP_INFO.CONTRACT_ADDRESS,
                "fromBlock": pageUtility.tohex(fromBlockNum),
                "toBlock": "latest",
                topics: ["0x94fcee0b7b95ac21ec59ec2c5b2e99e75c909351baf99e93cd97e713d820627b"]
            };
            getSqlTimer = setTimeout(function () {
                pageUtility.getContractInfo()
            }, 10000);
        },
        async getContractInfo() {
            try {
                let resuleInfo = await web3.eth.getPastLogs(contractOpt);
                logger.info(`从WEB3拿到数据数量:${resuleInfo.length} ，参数fromBlock：${fromBlockNum} - ${contractOpt.fromBlock}`)
                if (resuleInfo.length) {
                    pageUtility.parseContractInfo(resuleInfo);
                } else {
                    pageUtility.init();
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
                    nextFromBlock = item.blockNumber;
                    logAry.push(insertLog);
                } else {
                    logger.info("为True，不处理")
                }
            }))
            if (logAry.length) {
                logger.info("插入数据库的数量:", logAry.length)
                pageUtility.insertSql(logAry);
            } else {
                logger.info("没有需要插入数据库的信息:", logAry.length);
                pageUtility.init();
            }
        },
        async insertSql(array) {
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
                pageUtility.init();
            } catch (e) {
                logger.info("插入失败")
                logger.info(e)
            }
        },
        async searchMaxBlcok() {
            let sql = {
                text: `
                    Select 
                        "block_number"
                    FROM 
                        mapping_eth_log
                    order by
                        "block_number" desc
                    LIMIT
                        1
                `,
                values: []
            }
            let blockInfo = await pgPromise.query(sql);
            return blockInfo.rows.length ? (Number(blockInfo.rows[0].block_number) + 1) : MAPP_INFO.INIT_BLOCK_NUM;

        },
        tohex(num) {
            return ("0x" + num.toString(16));
        }
    }
    pageUtility.init();
})()