(async () => {
    let pgPromise = require("../database/PG-promise");

    console.log("************* 删除数据 开始 ************* ")
    let opt1 = {
        text: `truncate table mapping_eth_log`
    };
    let data1 = await pgPromise.query(opt1)
    if (data1.code) {
        console.log("删除 mapping_eth_log 失败")
        console.log(data1)
    } else {
        console.log("删除 mapping_eth_log 成功")
    }

    let opt2 = {
        text: `truncate table mapping_offline_block`
    };
    let data2 = await pgPromise.query(opt2)
    if (data2.code) {
        console.log("删除 mapping_offline_block 失败")
        console.log(data2)
    } else {
        console.log("删除 mapping_offline_block 成功")
    }
    console.log("************* 删除数据 结束 ************* ")


})()