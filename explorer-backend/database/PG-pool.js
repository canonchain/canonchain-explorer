const { Client, Pool } = require('pg');
const config = require('./config');

//写日志
let log4js = require('./log_config');
let pglogger = log4js.getLogger('pg_sql');//此处使用category的值

/* 
let config = {
    host: '192.168.11.111',
    port: 5432,
    user: "canonchain"",
    password: "czr123",
    database: "canonchain_explorer",
    // 扩展属性
    max: 20, // 连接池最大连接数
    idleTimeoutMillis: 3000, // 连接最大空闲时间 3s
}
module.exports = config;
*/

let client = new Pool(config);

let PG = function () {
    pglogger.info("准备数据库连接...");
};
PG.prototype.getConnection = function () {
    client.connect(function (err) {
        if (err) {
            return pglogger.error('数据库链接失败:', err);
        }
        client.query('SELECT NOW() AS "theTime"', function (err, result) {
            if (err) {
                return pglogger.error('error running query', err);
            }
            pglogger.info("数据库连接成功...");
        });
    });
};
PG.prototype.query = function (sqlStr, values, cb) {
    let typeVal = Object.prototype.toString.call(values);
    if (typeVal === "[object Function]") {
        //查
        cb = values;
        client.query(sqlStr,function (err, result) {
            if (err) {
                cb(err);
            } else {
                if (result.rows !== undefined) {
                    cb(result.rows);
                } else {
                    cb();
                }
            }
        });
    } else {
        //插入
        client.query(sqlStr,values, function (err, result) {
            if (err) {
                cb(err);
            } else {
                if (result.rows != undefined) {
                    cb(result.rows);
                } else {
                    cb();
                }
            }
        });
    }

};
module.exports.default = new PG();
module.exports.client = client
