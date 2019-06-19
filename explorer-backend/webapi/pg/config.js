
let config = {
    host: '127.0.0.1',
    port: 5432,
    user: "postgres",
    password: "super",
    database: "canonchain_explorer",
    // 扩展属性
    max: 20, // 连接池最大连接数
    idleTimeoutMillis: 3000, // 连接最大空闲时间 3s
}
module.exports = config;
