//写日志
let log4js = require('../database/log_config');
let logger = log4js.getLogger('read_db');//此处使用category的值
module.exports = function () {
    return function (req, res, next) {
        req._startTime = new Date() // 获取时间 t1

        let calResponseTime = function () {
            let now = new Date(); //获取时间 t2
            let deltaTime = now - req._startTime;
            if (deltaTime > 1000) {
                logger.info(`Request URL:' ${req.originalUrl} => res:${deltaTime}`);
            }
        }

        res.once('finish', calResponseTime);
        res.once('close', calResponseTime);
        next();
    }
}