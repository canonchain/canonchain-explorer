(async () => {
    let pgPromise = require("../../database/PG-promise");
    // logger
    let log4js = require('../../database/log_config');
    let logger = log4js.getLogger();
    let fs = require('fs');

    logger.info(" ************************** 设置开始 **************************");

    let targetAry = [];
    let pageUtility = {
        init() {
            pageUtility.getJson();
        },
        async getJson() {
            fs.readFile('./done.json', function (err, data) {
                if (err) {
                    return console.error(err);
                }
                // var person = data.toString();//将二进制的数据转换为字符串
                let person = JSON.parse(data);//将字符串转换为json对象
                person.data.forEach(element => {
                    if (element.signature) {
                        targetAry.push(element)
                    }
                });
                logger.info(targetAry);
                if (targetAry.length) {
                    pageUtility.updateSign(targetAry);
                }
            })
        },
        async updateSign(targetAry) {
            //更新eth_log表
            let tempUpdateAry = [];
            targetAry.forEach(element => {
                tempUpdateAry.push(
                    `
                    (
                        '${element.hash}',
                        '${element.signature}'
                    )
                    `
                )
            })


            let updateSignSql = `
                update 
                    mapping_offline_block 
                set 
                    signature = temp.signature
                from 
                    (values ${tempUpdateAry.toString()}) 
                    as 
                    temp (hash,signature) 
                where 
                    mapping_offline_block.hash=temp.hash
                `
            logger.info("准备更新")
            try {
                let res = await pgPromise.query(updateSignSql);
                logger.info(`更新成功了:${res.rowCount}条`)
            } catch (e) {
                logger.info("失败")
                logger.info(e)
            }
        }
    }
    pageUtility.init();
})()