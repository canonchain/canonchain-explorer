(async () => {
    let Czr = require("./node_modules/czr");
    let czr = new Czr();
    let pgPromise = require("../database/PG-promise");
    let client = await pgPromise.pool.connect(); //获取连接

    // logger
    let log4js = require('../database/log_config');
    let logger = log4js.getLogger('mapping_send_sql');

    let getSqlTimer = null;
    /**
     * 1.从数据库取status=2的值
     * 2.用获取到的Hash获取离线交易账单
     * 3.发送生成的账单，并且更改status=3
     * 4.循环第一步
     */
    logger.info(" ************************** 开始 **************************");

    let pageUtility = {
        init() {
            getSqlTimer = setTimeout(function () {
                pageUtility.getStatus();
            }, 5000);
        },
        async getStatus() {
            let SearchOptions = {
                text: `
                    select 
                        "tx"
                    from 
                        mapping_eth_log 
                    where 
                        "status" = $1
                `,
                values: [2]
            };
            let data = await client.query(SearchOptions);
            pageUtility.getOfflineBlock(data.rows)
        },
        async getOfflineBlock(hashAry) {
            let tempHashAllAry = [];

            if (!hashAry.length) {
                logger.info("暂无需要处理的交易")
                pageUtility.init();
                return;
            }
            hashAry.forEach(item => {
                tempHashAllAry.push(item.tx)
            })
            let SearchOptions = {
                text: `
                    select 
                        "hash",
                        "eth_tx",
                        "previous",
                        "from",
                        "to",
                        "signature",
                        "amount",
                        "gas",
                        "gas_price"
                    from 
                        mapping_offline_block 
                    where 
                        eth_tx = ANY ($1)
                `,
                values: [tempHashAllAry]
            };
            let data = await client.query(SearchOptions);
            let targetMapAry = []
            data.rows.forEach((item, index) => {
                if (item.signature) {
                    targetMapAry.push(item)
                }
            })
            logger.info(`需要映射的数量:${data.rows.length}，已签名的数量:${targetMapAry.length}`);
            logger.info(targetMapAry);
            if (targetMapAry.length) {
                pageUtility.sendBlock(targetMapAry);
            } else {
                pageUtility.init();
            }
        },


        async sendBlock(txAry) {
            let temItem;
            let successEthTxAry = [];
            if (!txAry.length) {
                logger.info("暂无需要发送的交易")
                pageUtility.init();
                return;
            }

            for (let i = 0, len = txAry.length; i < len;) {
                temItem = txAry[i];
                let result = await czr.request.sendOfflineBlock(temItem);
                if (result.code === 0) {
                    successEthTxAry.push(temItem.eth_tx);
                } else {
                    logger.info(`交易发送失败了${temItem.eth_tx}`)
                    logger.info(result);
                }
                i++;
            }
            if (successEthTxAry.length) {
                pageUtility.updateHashInfo(successEthTxAry);
            } else {
                pageUtility.init();
            }
        },
        async updateHashInfo(array) {
            let tempUpdateAry = [];
            // let SearchOptions = {
            //     text: `
            //         select 
            //             "hash",
            //             "eth_tx"
            //         from 
            //             mapping_offline_block 
            //         where 
            //             hash = ANY ($1)
            //     `,
            //     values: [array]
            // };
            // let data = await client.query(SearchOptions);


            array.forEach(element => {
                tempUpdateAry.push(`(${element})`);
            });
            //更新eth_log表
            let updateStatus = `
                update 
                    mapping_eth_log 
                set 
                    status = 3
                from 
                    (values ${tempUpdateAry.toString()}) 
                    as 
                    temp (tx) 
                where 
                    mapping_eth_log.tx=temp.tx
            `
            logger.info("准备更新")
            try {
                await client.query('BEGIN')
                let res = await client.query(updateStatus);
                await client.query('COMMIT')
                logger.info("更新成功")
            } catch (e) {
                logger.info("更新失败")
                logger.info(e)
            }
            pageUtility.init();
        },
    }
    pageUtility.init();
})()