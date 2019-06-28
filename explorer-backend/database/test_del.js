(async () => {
    let pgPromise = require("./PG-promise");

    console.log("************* 删除数据 开始 ************* ")
    let opt1 = {
        text: `truncate table contract`
    };
    let data1 = await pgPromise.query(opt1)
    if (data1.code) {
        console.log("删除 contract 失败")
        console.log(data1)
    } else {
        console.log("删除 contract 成功")
    }

    let opt3 = {
        text: `truncate table contract_code`
    };
    let data3 = await pgPromise.query(opt3)
    if (data3.code) {
        console.log("删除 contract_code 失败")
        console.log(data3)
    } else {
        console.log("删除 contract_code 成功")
    }

    let opt4 = {
        text: `truncate table token`
    };
    let data4 = await pgPromise.query(opt4)
    if (data4.code) {
        console.log("删除 token 失败")
        console.log(data4)
    } else {
        console.log("删除 token 成功")
    }

    let opt5 = {
        text: `truncate table token_asset`
    };
    let data5 = await pgPromise.query(opt5)
    if (data5.code) {
        console.log("删除 token_asset 失败")
        console.log(data5)
    } else {
        console.log("删除 token_asset 成功")
    }

    let opt6 = {
        text: `truncate table trans_token`
    };
    let data6 = await pgPromise.query(opt6)
    if (data6.code) {
        console.log("删除 trans_token 失败")
        console.log(data6)
    } else {
        console.log("删除 trans_token 成功")
    }

    let opt7 = {
        text: `truncate table trans_internal`
    };
    let data7 = await pgPromise.query(opt7)
    if (data7.code) {
        console.log("删除 trans_internal 失败")
        console.log(data7)
    } else {
        console.log("删除 trans_internal 成功")
    }

    let opt8 = {
        text: `truncate table event_log`
    };
    let data8 = await pgPromise.query(opt8)
    if (data8.code) {
        console.log("删除 event_log 失败")
        console.log(data8)
    } else {
        console.log("删除 event_log 成功")
    }
    
    let dell_opt1 = {
        text: `truncate table accounts`
    };
    let dell_data1 = await pgPromise.query(dell_opt1)
    if (dell_data1.code) {
        console.log("删除 accounts 失败")
        console.log(dell_data1)
    } else {
        console.log("删除 accounts 成功")
    }

    let dell_opt2 = {
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
                        ('token_count',0),
                        ('internal_count',0),
                        ('last_stable_mci',0),
                        ('last_stable_block_index',0 )
                    ) 
            as 
                temp(key,value)
        where 
            global.key = temp.key
        `
    }
    let dell_data2 = await pgPromise.query(dell_opt2)
    if (dell_data2.code) {
        console.log("删除 global 失败")
        console.log(dell_data2)
    } else {
        console.log("删除 global 成功")
    }

    let dell_opt3 = {
        text: `truncate table parents`
    };
    let dell_data3 = await pgPromise.query(dell_opt3)
    if (dell_data3.code) {
        console.log("删除 parents 失败")
        console.log(dell_data3)
    } else {
        console.log("删除 parents 成功")
    }

    let dell_opt4 = {
        text: `truncate table timestamp`
    };
    let dell_data4 = await pgPromise.query(dell_opt4)
    if (dell_data4.code) {
        console.log("删除 timestamp 失败")
        console.log(dell_data4)
    } else {
        console.log("删除 timestamp 成功")
    }

    let dell_opt5 = {
        text: `truncate table trans_normal`
    };
    let dell_data5 = await pgPromise.query(dell_opt5)
    if (dell_data5.code) {
        console.log("删除 trans_normal 失败")
        console.log(dell_data5)
    } else {
        console.log("删除 trans_normal 成功")
    }

    let dell_opt6 = {
        text: `truncate table trans_witness`
    };
    let dell_data6 = await pgPromise.query(dell_opt6)
    if (dell_data6.code) {
        console.log("删除 trans_witness 失败")
        console.log(dell_data6)
    } else {
        console.log("删除 trans_witness 成功")
    }

    let dell_opt7 = {
        text: `truncate table trans_genesis`
    };
    let dell_data7 = await pgPromise.query(dell_opt7)
    if (dell_data7.code) {
        console.log("删除 trans_genesis 失败")
        console.log(dell_data7)
    } else {
        console.log("删除 trans_genesis 成功")
    }

    let dell_opt8 = {
        text: `truncate table trans_type`
    };
    let dell_data8 = await pgPromise.query(dell_opt8)
    if (dell_data8.code) {
        console.log("删除 trans_type 失败")
        console.log(dell_data8)
    } else {
        console.log("删除 trans_type 成功")
    }

    let dell_opt9 = {
        text: `truncate table witness_list`
    };
    let dell_data9 = await pgPromise.query(dell_opt9)
    if (dell_data9.code) {
        console.log("删除 witness_list 失败")
        console.log(dell_data9)
    } else {
        console.log("删除 witness_list 成功")
    }

    console.log("************* 删除数据 结束 ************* ")


})()