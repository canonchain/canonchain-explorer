// let pgclient = require('./PG').default;// 引用上述文件
// pgclient.getConnection();

// //删除 client.query("truncate table test WHERE name=$1", ["xiaoming"])})
// pgclient.query("truncate table accounts ", (res) => {
//     console.log("accounts result", res)
// });
// pgclient.query("truncate table global ", (res) => {
//     console.log("global result", res)
// });
// pgclient.query("truncate table parents ", (res) => {
//     console.log("parents result", res)
// });
// pgclient.query("truncate table timestamp ", (res) => {
//     console.log("timestamp result", res)
// });
// pgclient.query("truncate table transaction ", (res) => {
//     console.log("transaction result", res)
// });
// pgclient.query("truncate table witness ", (res) => {
//     console.log("witness result", res)
// });

(async() => {
    let pgPromise = require("./PG-promise");

    console.log("************* 删除数据 开始 ************* ")
    let opt1 = {
        text: `truncate table accounts`
    };
    let data1 = await pgPromise.query(opt1)
    if (data1.code) {
        console.log("删除 accounts 失败")
        console.log(data1)
    } else {
        console.log("删除 accounts 成功")
    }

    let opt2 = {
        text: `
        update 
            global 
        set 
            value=temp.value 
                from (values 
                        ('witness_count',0),
                        ('accounts_count',0),
                        ('normal_count',0),
                        ('done_stable_index',-1),
                        ('last_mci',0),
                        ('last_stable_mci',0),
                        ('last_stable_block_index',0 )
                    ) 
            as 
                temp(key,value)
        where 
            global.key = temp.key
        `
    }
    let data2 = await pgPromise.query(opt2)
    if (data2.code) {
        console.log("删除 global 失败")
        console.log(data2)
    } else {
        console.log("删除 global 成功")
    }

    let opt3 = {
        text: `truncate table parents`
    };
    let data3 = await pgPromise.query(opt3)
    if (data3.code) {
        console.log("删除 parents 失败")
        console.log(data3)
    } else {
        console.log("删除 parents 成功")
    }

    let opt4 = {
        text: `truncate table timestamp`
    };
    let data4 = await pgPromise.query(opt4)
    if (data4.code) {
        console.log("删除 timestamp 失败")
        console.log(data4)
    } else {
        console.log("删除 timestamp 成功")
    }

    let opt5 = {
        text: `truncate table trans_normal`
    };
    let data5 = await pgPromise.query(opt5)
    if (data5.code) {
        console.log("删除 trans_normal 失败")
        console.log(data5)
    } else {
        console.log("删除 trans_normal 成功")
    }

    let opt6 = {
        text: `truncate table trans_witness`
    };
    let data6 = await pgPromise.query(opt6)
    if (data6.code) {
        console.log("删除 trans_witness 失败")
        console.log(data6)
    } else {
        console.log("删除 trans_witness 成功")
    }

    let opt7 = {
        text: `truncate table trans_genesis`
    };
    let data7 = await pgPromise.query(opt7)
    if (data7.code) {
        console.log("删除 trans_genesis 失败")
        console.log(data7)
    } else {
        console.log("删除 trans_genesis 成功")
    }

    let opt8 = {
        text: `truncate table trans_type`
    };
    let data8 = await pgPromise.query(opt8)
    if (data8.code) {
        console.log("删除 trans_type 失败")
        console.log(data8)
    } else {
        console.log("删除 trans_type 成功")
    }

    let opt9 = {
        text: `truncate table witness_list`
    };
    let data9 = await pgPromise.query(opt9)
    if (data9.code) {
        console.log("删除 witness_list 失败")
        console.log(data9)
    } else {
        console.log("删除 witness_list 成功")
    }

    console.log("************* 删除数据 结束 ************* ")

})()