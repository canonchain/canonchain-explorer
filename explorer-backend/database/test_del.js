let pgclient = require('./PG');// 引用上述文件
pgclient.getConnection();

//删除 client.query("truncate table test WHERE name=$1", ["xiaoming"])})
pgclient.query("truncate table accounts ", (res) => {
    console.log("accounts result", res)
});
pgclient.query("truncate table global ", (res) => {
    console.log("mci result", res)
});
pgclient.query("truncate table parents ", (res) => {
    console.log("parents result", res)
});
pgclient.query("truncate table timestamp ", (res) => {
    console.log("timestamp result", res)
});
pgclient.query("truncate table transaction ", (res) => {
    console.log("transaction result", res)
});
pgclient.query("truncate table witness ", (res) => {
    console.log("witness result", res)
});