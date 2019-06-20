(async() => {
    let pgPromise = require("../PG-promise");

    console.log("************* 删除数据 开始 ************* ")
    let opt1 = {
        text: `truncate table gas_price`
    };
    let data1 = await pgPromise.query(opt1)
    if (data1.code) {
        console.log("删除 gas_price 失败")
        console.log(data1)
    } else {
        console.log("删除 gas_price 成功")
    }
    console.log("************* 删除数据 结束 ************* ")

})()