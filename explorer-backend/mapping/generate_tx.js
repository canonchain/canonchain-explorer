(async () => {
    let Czr = require("czr");
    let czr = new Czr();
    let pgPromise = require("../database/PG-promise");
    let client = await pgPromise.pool.connect(); //获取连接

    // logger
    let log4js = require('../database/log_config');
    let logger = log4js.getLogger('mapping_generate_sql');

    //需要改为正式的 ****************************************************
    let generateOpt = require("./config/generate_opt")
    // let generate_opt = {
    //     "from": "czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u",
    //     "to": "",
    //     "amount": "",
    //     "previous": "",
    //     "gas": "21000",
    //     "gas_price": "50000000000000"
    // }
    let getSqlTimer = null;
    let tempPrevious = '';

    /**
     * 1.从数据库取status=1的值
     * 2.用获取到的值生成离线交易账单
     * 3.储存生成的账单，并且更改status=2
     * 4.循环第一步
     */
    logger.info(" ************************** 开始 **************************");

    let pageUtility = {
        init() {
            getSqlTimer = setTimeout(function () {
                pageUtility.getAccInfo();
            }, 5000);
        },
        async getAccInfo() {
            let SearchOptions = {
                text: `
                select 
                    "tx","czr_account","value"
                from 
                    mapping_eth_log 
                where 
                    "status" = $1
                order by
                    timestamp asc
            `,
                values: [1]
            };
            let data = await client.query(SearchOptions);
            pageUtility.generateBlock(data.rows)
        },
        async generateBlock(txAry) {
            let temItem;
            let insertAry = [];
            if (!txAry.length) {
                logger.info("暂无需要处理的交易")
                pageUtility.init();
                return;
            }

            for (let i = 0, len = txAry.length; i < len;) {
                temItem = txAry[i];
                generateOpt.to = temItem.czr_account;
                generateOpt.amount = temItem.value;
                generateOpt.previous = tempPrevious ? tempPrevious : '';
                logger.info("generateOpt\n", generateOpt)
                let result = await czr.request.generateOfflineBlock(generateOpt);
                result.eth_tx = temItem.tx
                logger.info("result\n", result)
                logger.info("------------------------------------")
                if (result.code === 0) {
                    tempPrevious = result.hash;
                    insertAry.push(result);
                } else {
                    logger.info("generateOfflineBlock失败，可能是余额不足")
                    break;
                }
                i++;
            }
            logger.info(`需处理的交易数量 ${insertAry.length}`);
            if (insertAry.length) {
                pageUtility.insertSql(insertAry);
            } else {
                pageUtility.init();
            }

        },
        // async filterStatusOneData(insertAry) {
        //     //搜索筛选只为1的数据
        //     pageUtility.insertSql(insertAry);
        // },
        async insertSql(array) {
            let tempAry = [];
            let tempUpdateAry = [];
            array.forEach(element => {
                tempAry.push(`
                    (
                        '${element.hash}',
                        '${element.eth_tx}',
                        '${element.previous}',
                        '${element.from}',
                        '${element.to}',
                        ${element.amount},
                        ${element.gas},
                        ${element.gas_price}
                    )
                `)
                tempUpdateAry.push(
                    `
                    (
                        '${element.eth_tx}'
                    )
                    `
                )
            });
            let batchInsertSql = {
                text: `
                INSERT INTO 
                mapping_offline_block (
                    "hash",
                    "eth_tx",
                    "previous",
                    "from",
                    "to",
                    "amount",
                    "gas",
                    "gas_price"
                ) 
            VALUES` + tempAry.toString()
            };

            //更新eth_log表
            let updateStatus = `
                update 
                    mapping_eth_log 
                set 
                    status = 2
                from 
                    (values ${tempUpdateAry.toString()}) 
                    as 
                    temp (tx) 
                where 
                    mapping_eth_log.tx=temp.tx
            `
            logger.info("准备插入")
            try {
                await client.query('BEGIN')
                await client.query(batchInsertSql);
                let res = await client.query(updateStatus);
                await client.query('COMMIT')
                logger.info("插入成功\n")
            } catch (e) {
                logger.info("插入失败")
                logger.info(batchInsertSql)
                logger.info(updateStatus)
                logger.info(e)
            }
            pageUtility.init();
        }
    }
    pageUtility.init();
})()