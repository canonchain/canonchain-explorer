

(async () => {
    //引入
    let pgPromise = require("../PG-promise");
    //获取连接
    let client = await pgPromise.pool.connect();

    console.log(" ----------------- queryBatch ----------")

    //操作
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
    let data1 = await client.query(opt1)
    if (data1.code) {
        console.log("增加失败")
        console.log(data1.code)
        console.log(data1)
    } else {
        console.log("增加成功")
        console.log(data1.rowCount);
    }

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
    const data2 = await client.query(opt2)
    if (data2.code) {
        console.log("查询失败")
        console.log(data2.code)
        console.log(data2)
    } else {
        console.log("查询成功")
        console.log(data2.rows);
    }
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
    let data5 = await client.query(opt5)
    if (data5.code) {
        console.log("删除失败")
        console.log(data5.code)
        console.log(data5)
    } else {
        console.log("删除成功")
        console.log(data5.rowCount);
    }

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
    let data6 = await client.query(opt6)
    if (data6.code) {
        console.log("查询失败")
        console.log(data6.code)
        console.log(data6)
    } else {
        console.log("查询成功")
        console.log(data6.rows);
    }

    //释放连接
    client.release()

})()
