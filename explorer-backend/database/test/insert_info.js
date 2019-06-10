(async () => {
    let pgPromise = require("../PG-promise"); //引入
    let client = await pgPromise.pool.connect(); //获取连接

    //插入账户表
    const global = `
        ('account',"czr_47E2jJ9rXVk5GRBcTLQMLQHXqsrnVcV5Kv2CWQJ6dnUaugnvii" ),
        ('type',1),
        ('balance',"11111"),
        ('is_token_account',true),
        ('is_has_token_trans',true),
        ('is_has_intel_trans',true),
        ('transaction_count', ${Number(status.last_stable_block_index)} )
    `;
    let globalInsert = "INSERT INTO global (key,value) VALUES " + global;
    let res = await client.query(globalInsert);

});