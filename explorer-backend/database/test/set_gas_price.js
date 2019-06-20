(async () => {
    let pgPromise = require("../PG-promise");

    let cheapest_gas_price = 10000,
        median_gas_price = 15000,
        highest_gas_price = 20000;
    let timestamp = Date.parse(new Date());//毫秒时间
    console.log("************* 修改Gas数据 开始 ************* ")
    let tempAry = [
        `(  
            ${timestamp},
            ${cheapest_gas_price},
            ${median_gas_price},
            ${highest_gas_price}
        )`
    ];
    let insertSql = {
        text: `
        INSERT INTO 
            gas_price
        (
            "timestamp",
            "cheapest_gas_price",
            "median_gas_price",
            "highest_gas_price"
        )
        VALUES ${tempAry.toString()}`
    };
    let insertRes = await pgPromise.query(insertSql);
    console.log(`插入新Gas价格完成，插入数量：${insertRes.rowCount}`)


    let querySql = {
        text: `
        SELECT 
            "timestamp",
            "cheapest_gas_price",
            "median_gas_price",
            "highest_gas_price"
        FROM 
            gas_price 
        order by
            "timestamp" desc
        limit
            20
        `
    };
    let res = await pgPromise.query(querySql)
    console.log(res.rows);


    console.log("************* 修改Gas数据 结束 ************* ")

})()