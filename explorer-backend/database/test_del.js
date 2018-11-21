let pgclient = require('./PG');// 引用上述文件
pgclient.getConnection();

//删除 client.query("DELETE FROM test WHERE name=$1", ["xiaoming"])})
pgclient.query("DELETE FROM accounts ", (res) => {
    console.log("accounts result", res)
});
pgclient.query("DELETE FROM mci ", (res) => {
    console.log("mci result", res)
});
pgclient.query("DELETE FROM parents ", (res) => {
    console.log("parents result", res)
});
pgclient.query("DELETE FROM timestamp ", (res) => {
    console.log("timestamp result", res)
});
pgclient.query("DELETE FROM transaction ", (res) => {
    console.log("transaction result", res)
});
pgclient.query("DELETE FROM witness ", (res) => {
    console.log("witness result", res)
});