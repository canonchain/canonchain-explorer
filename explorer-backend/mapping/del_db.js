//这个脚本一定不能放在服务器上！！！！！！！
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

    let opt3 = {
        text: `truncate table mapping_block_number`
    };
    let data3 = await pgPromise.query(opt3)
    if (data3.code) {
        console.log("删除 mapping_block_number 失败")
        console.log(data3)
    } else {
        console.log("删除 mapping_block_number 成功")
    }
    
    console.log("************* 删除数据 结束 ************* ")


})()