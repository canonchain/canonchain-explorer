(async () => {
    let pgPromise = require("../../database/PG-promise");
    // logger
    let log4js = require('../../database/log_config');
    let logger = log4js.getLogger();
    let fs = require('fs');

    logger.info(" ************************** 获取开始 **************************");

    let pageUtility = {
        init() {
            pageUtility.getStatus();
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
            let data = await pgPromise.query(SearchOptions);
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
                        "signature"
                    from 
                        mapping_offline_block 
                    where 
                        eth_tx = ANY ($1)
                `,
                values: [tempHashAllAry]
            };
            let data = await pgPromise.query(SearchOptions);
            let targetMapAry = []
            data.rows.forEach((item, index) => {
                if (!item.signature) {
                    targetMapAry.push(item)
                }
            })
            logger.info(`需要映射的数量:${data.rows.length}，未签名的数量:${targetMapAry.length}`);
            logger.info({ data: targetMapAry });
            let str = JSON.stringify({ data: targetMapAry });
            fs.writeFile('./sign-data.json', str, function (err) {
                if (err) {
                    logger.info(err);
                    return;
                }
                logger.info("json文件写入成功");
            })
        }
    }
    pageUtility.init();
})()