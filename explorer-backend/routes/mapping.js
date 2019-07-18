var express = require("express");
var router = express.Router();
var responseTime = require("./response-time");

var PgPromise = require('../database/PG-promise');// 引用上述文件
var pgPromise = PgPromise.pool;
//写日志
let log4js = require('../database/log_config');
let logger = log4js.getLogger('read_db');//此处使用category的值

// 返回值
var responseData = null;
router.use(responseTime())
router.use(function (req, res, next) {
    responseData = {
        code: 200,
        success: true,
        message: "success"
    }
    next();
})

//分页limit
let LIMIT_VAL = 20;

//************************** 接口 开始
//已映射|待处理
router.get("/get_status_one", async function (req, res, next) {
    let queryVal = req.query;
    if (!queryVal.page) {
        queryVal.page = 1;
    }
    let offsetVal = (queryVal.page - 1) * LIMIT_VAL
    let sql = {
        text: `
            Select 
                "mapping_log_id","timestamp","eth_hash","eth_address",czr_account,"value","status","block_number"
            FROM 
                mapping_eth_log
            where
                "status" = $1
            order by 
                timestamp desc
            LIMIT 
                ${LIMIT_VAL}
            offset
                ${offsetVal}
        `,
        values: [1]
    };
    let data = await pgPromise.query(sql)

    if (data.code) {
        responseData = {
            data: [],
            code: 500,
            success: false,
            message: 'select 1 from mapping_eth_log error'
        }
    } else {
        responseData = {
            data: data.rows || [],
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
router.get("/get_status_one_count", async function (req, res, next) {

    let sql = {
        text: `
            Select 
                count(1)
            FROM 
                mapping_eth_log
            where
                "status" = $1
        `,
        values: [1]
    };
    let data = await pgPromise.query(sql)
    if (data.code) {
        responseData = {
            data: "0",
            code: 500,
            success: false,
            message: 'select 1 from mapping_eth_log count error'
        }
    } else {
        responseData = {
            data: data.rows ? data.rows[0].count : "0",
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

//多参数
router.get("/get_status_multi", async function (req, res, next) {
    let queryVal = req.query;
    if (!queryVal.page) {
        queryVal.page = 1;
    }
    if (!queryVal.status) {
        queryVal.status = 2;
    }
    let offsetVal = (queryVal.page - 1) * LIMIT_VAL
    let sql = {
        text: `
            Select 
                "mapping_log_id","timestamp","eth_hash","eth_address",czr_account,"value","status","block_number",
                "czr_hash","patrol_time","send_error"
            FROM 
                mapping_eth_log
            where
                "status" = $1
            order by 
                timestamp desc
            LIMIT 
                ${LIMIT_VAL}
            offset
                ${offsetVal}
        `,
        values: [queryVal.status]
    };
    let data = await pgPromise.query(sql)

    if (data.code) {
        responseData = {
            data: [],
            code: 500,
            success: false,
            message: 'select from mapping_eth_log error'
        }
    } else {
        responseData = {
            data: data.rows || [],
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
router.get("/get_status_multi_count", async function (req, res, next) {
    let queryVal = req.query;
    if (!queryVal.status) {
        queryVal.status = 2;
    }
    let sql = {
        text: `
            Select 
                count(1)
            FROM 
                mapping_eth_log
            where
                "status" = $1
        `,
        values: [queryVal.status]
    };
    let data = await pgPromise.query(sql)
    if (data.code) {
        responseData = {
            data: "0",
            code: 500,
            success: false,
            message: 'select 2 from mapping_eth_log count error'
        }
    } else {
        responseData = {
            data: data.rows ? data.rows[0].count : "0",
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
router.get("/get_status_multi_sum", async function (req, res, next) {
    let queryVal = req.query;
    if (!queryVal.status) {
        queryVal.status = 2;
    }
    let sql = {
        text: `
            Select 
                sum (value)
            FROM 
                mapping_eth_log
            where
                "status" = $1
        `,
        values: [queryVal.status]
    };
    let data = await pgPromise.query(sql)
    if (data.code) {
        responseData = {
            data: "0",
            code: 500,
            success: false,
            message: 'select 2 from mapping_eth_log count error'
        }
    } else {
        responseData = {
            data: data.rows[0].sum ? data.rows[0].sum : "0",
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//************************** 接口 结束

module.exports = router;