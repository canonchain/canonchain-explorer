let { Pool } = require('pg');
let config = require('./config-pool');
let pool = new Pool(config);

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

//写日志
let log4js = require('./log_config');
let pglogger = log4js.getLogger('pg_sql');//此处使用category的值

// 监听错误
pool.on('error', (err, client) => {
    pglogger.error('未知错误')
    pglogger.error(err)
    pglogger.error(client)
    process.exit(-1)
})

const pgPromise = {
    async query(opt_obj) {
        const client = await pool.connect();
        try {
            const res = await client.query(opt_obj)
            // console.log("**** res ****")
            // console.log(res)
            return new Promise((resolve) => {
                resolve(res)
            })
        } catch (err) {
            return err
        }
        finally {
            client.release()
        }
    }
}

module.exports = pgPromise;