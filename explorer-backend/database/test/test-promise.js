

(async () => {
    let pgPromise = require("../PG-promise");

    console.log(" ************* 增加 test1 ************* ")
    let opt1 = {
        text: `
            INSERT INTO 
                global 
                (key,value) 
            VALUES 
                ($1, $2)
        `,
        values: ["test1", "14"]
    };
    let data1 = await pgPromise.query(opt1)
    if (data1.code) {
        console.log("增加失败")
        console.log(data1.code)
        console.log(data1)
    } else {
        console.log("增加成功")
        console.log(data1.rowCount);
    }

    console.log(" ************* 查询")

    let opt2 = {
        text: `
            select 
                value
            from 
                global 
            where
                "key" = $1
        `,
        values: ["test1"]
    };
    let data2 = await pgPromise.query(opt2)
    if (data2.code) {
        console.log("查询失败")
        console.log(data2.code)
        console.log(data2)
    } else {
        console.log("查询成功")
        console.log(data2.rows);
    }

    console.log("\n\n ************* 修改 test1 ************* ")

    let opt3 = {
        text: `
            update 
                global
            set
                value = value+3
            where 
                "key" = $1
        `,
        values: ["test1"]
    };
    let data3 = await pgPromise.query(opt3)
    if (data3.code) {
        console.log("修改失败")
        console.log(data3.code)
        console.log(data3)
    } else {
        console.log("修改成功")
        console.log(data3.rowCount);
    }

    console.log(" ************* 查询")

    let opt4 = {
        text: `
            select 
                value
            from 
                global 
            where 
                "key" = $1
        `,
        values: ["test1"]
    };
    let data4 = await pgPromise.query(opt4)
    if (data4.code) {
        console.log("查询失败")
        console.log(data4.code)
        console.log(data4)
    } else {
        console.log("查询成功")
        console.log(data4.rows);
    }

    console.log("\n\n ************* 删除 test1 ************* ")

    let opt5 = {
        text: `
        delete
        from
            global
        where
            "key" = $1
        `,
        values: ["test1"]
    };
    let data5 = await pgPromise.query(opt5)
    if (data5.code) {
        console.log("删除失败")
        console.log(data5.code)
        console.log(data5)
    } else {
        console.log("删除成功")
        console.log(data5.rowCount);
    }

    console.log(" ************* 查询")

    let opt6 = {
        text: `
            select 
                value
            from 
                global 
            where 
                "key" = $1
        `,
        values: ["test1"]
    };
    let data6 = await pgPromise.query(opt6)
    if (data6.code) {
        console.log("查询失败")
        console.log(data6.code)
        console.log(data6)
    } else {
        console.log("查询成功")
        console.log(data6.rows);
    }

    console.log("\n\n\n")
    console.log(" ************* 出错的情况 ************* ")
    console.log(" ------------- 查询出错 ------------- ")

    let opt50 = {
        text: `
            select 
                value2
            from 
                global 
            where 
                "key" = $1
        `,
        values: ["mci"]
    };
    let data50 = await pgPromise.query(opt50)
    if (data50.code) {
        console.log("失败")
        console.log(data50.code)
        console.log(data50)
    } else {
        console.log("成功")
        console.log(data50.rows);
    }

    console.log(" ------------- 增加出错 ------------- ")
    let opt51 = {
        text: `
            INSERT INTO 
                global1
                (key,value) 
            VALUES 
                ($1, $2)
        `,
        values: ["test1", "14"]
    };
    let data51 = await pgPromise.query(opt51)
    if (data51.code) {
        console.log("增加失败")
        console.log(data51.code)
        console.log(data51)
    } else {
        console.log("增加成功")
        console.log(data51.rowCount);
    }

    console.log(" ------------- 更新出错 ------------- ")
    let opt52 = {
        text: `
            update 
                global22
            set
                value = value+3
            where 
                "key" = $1
        `,
        values: ["test1"]
    };
    let data52 = await pgPromise.query(opt52)
    if (data52.code) {
        console.log("修改失败")
        console.log(data52.code)
        console.log(data52)
    } else {
        console.log("修改成功")
        console.log(data52.rowCount);
    }

})()
