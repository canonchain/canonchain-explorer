

(async () => {
    let pgPromise = require("./PG-promise");
    let opt = {
        text: `
            select 
                value
            from 
                global 
            where 
                "key" = $1
        `,
        values: ["mci"]
    };
    let data = await pgPromise.query(opt)

    console.log(" ************* DEMO  Start************* ")
    if (data.code) {

        console.log("失败")
        console.log(data.code)
        console.log(data)
    } else {
        console.log("成功")
        console.log(data.rows);
    }
    console.log(" ************* DEMO  End************* ")
})()
