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

//@ts-check
let WITNESS_LIST = [];
let paramError = {
    data: [],
    code: 500,
    success: false,
    message: 'Wrong or missing parameter'
}

let PageUtility = {
    timeLog: function (req, symbol_str) {
        /**
         * 记录 logger.info(`/get_xxxx start: ${Date.now() - req._startTime}`)
         */
        logger.info(`${req.originalUrl} |  ${symbol_str ? symbol_str : "-"} => ${Date.now() - req._startTime}`)
    },
    isBastParent: function (parentItem, unitsAry) {
        //TODO写到数据库中，
        var isBase;
        unitsAry.forEach(item => {
            if (parentItem.item == item.hash) {
                isBase = (parentItem.parent == item.best_parent) ? true : false;
            }
        })
        return isBase;
    },
    formatUnits: function (unitsAry) {
        var nodesTempAry = [];
        var tempInfo;
        var tempStatus;
        var isMinor;
        //hash,level,stable_index,is_free,is_stable,"status",is_on_mc,"from",best_parent 
        unitsAry.forEach(function (item) {
            if (item.is_stable) {
                if (item.status == "1") {
                    tempStatus = 'temp-bad'
                } else if (item.status == "2") {
                    tempStatus = 'temp-bad'
                } else if (item.status == "3") {
                    tempStatus = 'final-bad'
                } else if (item.status == "0") {
                    tempStatus = 'good'
                }
            } else {
                tempStatus = 'good'
            }
            if ((item.from === item.to) && (item.amount === '0')) {
                isMinor = 'is-minor'
            } else {
                isMinor = '';
            }
            tempInfo = {
                "data": {
                    "unit": item.hash,
                    "unit_s": item.hash.substring(0, 7) + "..."
                },
                "is_free": item.is_free,
                "stable_index": item.stable_index,
                "level": item.level,
                "is_on_main_chain": Number(item.is_on_mc),
                "is_stable": Number(item.is_stable),
                "witness_from": item.from,
                "sequence": tempStatus
            }
            nodesTempAry.push(tempInfo);
        })
        return nodesTempAry;
    },
    getWitnessList: async () => {
        let witness_list_sql = "SELECT account FROM witness_list limit 14";
        PageUtility.timeLog(witness_list_sql, '[1] SELECT witness_list Before')
        let witness_data = await pgPromise.query(witness_list_sql);
        PageUtility.timeLog(witness_list_sql, '[1] SELECT witness_list After')
        witness_data.rows.forEach(item => {
            WITNESS_LIST.push(item.account.toUpperCase());
        })
        logger.info(WITNESS_LIST);
    },
    isHasParam: function (opt, ary) {
        let item;
        for (let i = 0; i < ary.length; i++) {
            item = ary[i];
            if (!opt[item]) {
                return false;
            }
        }
        return true;
    }
}
PageUtility.getWitnessList();

//************************** 账户列表开始
//获取账户总数量
router.get("/get_accounts_count", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let sql = "SELECT value AS count FROM global WHERE key = 'accounts_count'";

    PageUtility.timeLog(req, '[1] SELECT get_accounts_count Before')
    let count = await pgPromise.query(sql)
    PageUtility.timeLog(req, '[1] SELECT get_accounts_count After')

    if (count.code) {
        responseData = {
            count: 0,
            code: 500,
            success: false,
            message: "count count Error"
        }
        res.json(responseData);
    } else {
        responseData = {
            count: Number(count.rows[0].count || 0),//TODO 这么写有BUG  Cannot read property 'count' of undefined
            code: 200,
            success: true,
            message: "success"
        }
        res.json(responseData);
    }
})
//获取交易表中最近(LIMIT+1)项
router.get("/get_accounts_flag", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let errorInfo = {
        acc_id: "0000",
        balance: "000000",
    }
    //TODO 这么写可能会导致漏数据（因为账户的balance可能相同的）
    //可以创建唯一索引，通过唯一索引+balance搜索
    let start_sql = {
        text: `
            Select
                "acc_id","balance"
            FROM 
                accounts
            ORDER BY
                balance desc,
                acc_id desc
            LIMIT 
                1
        `
    }

    PageUtility.timeLog(req, '[1] SELECT start_sql Before')
    let transStartInfo = await pgPromise.query(start_sql)
    PageUtility.timeLog(req, '[1] SELECT start_sql After')
    if (transStartInfo.code) {
        responseData = {
            near_item: errorInfo,
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
    }

    let opt = {
        text: `
        Select
            "acc_id","balance"
        FROM 
            accounts
        ORDER BY
            balance asc,
            acc_id asc
        LIMIT 
            1
        `
    }
    PageUtility.timeLog(req, '[2] SELECT end_sql Before')
    let transEndInfo = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[2] SELECT end_sql After')

    if (transEndInfo.code) {
        responseData = {
            near_item: errorInfo,
            end_item: errorInfo,
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows[0],
            end_item: transEndInfo.rows[0],
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

//获取交易列表
//    position:1,//1 首页  2 上一页 3 下一页 4 尾页
router.get("/get_accounts", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;

    // 首页：
    /** 
     * 首页：倒序 limit 20
     * 尾页：顺序 limit 20
    */
    if (queryVal.position === "1") {
        opt = {
            text: `
               Select 
                    "account","balance","acc_id"
               FROM
                    accounts
               order by 
                   "balance" desc,
                   "acc_id" desc
               LIMIT
                   $1
           `,
            values: [LIMIT_VAL]
        }

    } else if (queryVal.position === "4") {
        // 尾页
        opt = {
            text: `
               Select 
                   "account","balance","acc_id"
               FROM
                    accounts
               order by 
                    "balance" asc,
                    "acc_id" asc
               LIMIT
                   $1
           `,
            values: [LIMIT_VAL]
        }
    } else if ((queryVal.position === "2") || (queryVal.position === "3")) {
        let direction, sortInfo;
        if (queryVal.position === "2") {
            direction = ">";
            sortInfo = "asc";
        } else {
            direction = "<";
            sortInfo = "desc";
        }
        // console.log(queryVal.position, direction, sortInfo)
        opt = {
            text: `
           (
               select
                    "account","balance","acc_id"
               FROM
                    accounts 
               WHERE 
                    (balance = $2 and acc_id ${direction} $1 )
               order by 
                    "balance" ${sortInfo} ,
                    "acc_id" ${sortInfo}
               LIMIT
                    $3
           )
           union
           (
                Select 
                    "account","balance","acc_id"
                FROM 
                    accounts 
                WHERE 
                    (balance ${direction} $2)
                order by 
                    "balance" ${sortInfo},
                    "acc_id" ${sortInfo}
                LIMIT
                    $3
            )
           order by
               "balance" ${sortInfo},
               "acc_id" ${sortInfo}
           LIMIT
               $3
           `,
            values: [Number(queryVal.acc_id), Number(queryVal.balance), LIMIT_VAL]
        }
    } else {
        res.json(paramError);
        return;
    }
    //  if ((queryVal.position === "2") || (queryVal.position === "3"))


    PageUtility.timeLog(req, '[1] SELECT transaction info Before')
    let data = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[1] SELECT transaction info After')

    if (data.code) {
        responseData = {
            accounts: [],
            code: 500,
            success: false,
            message: 'Select trans list FROM transaction Error'
        }
        // logger.info(data)
    } else {
        //查询成功
        let accounts;
        if ((queryVal.position === "4") || (queryVal.position === "2")) {
            accounts = data.rows.reverse()
        } else {
            accounts = data.rows;
        }
        // var accounts = data.rows;
        accounts.forEach((element, index) => {
            // element.true_balance = element.balance;
            //占比 element.balance / 1618033988 TODO 1132623791.6 这个值后期会修改
            element.proportion = ((element.balance / (1618033988 * 1000000000000000000)) * 100).toFixed(10) + " %";
        });

        responseData = {
            accounts: accounts,
            // page: queryVal.page,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

//************************** 账户列表结束

//************************** Token列表开始
//获取Token交易总数量
router.get("/get_token_count", async function (req, res, next) {

    PageUtility.timeLog(req, 'start')
    let sql = `SELECT value AS count FROM global WHERE key = 'token_count'`;
    PageUtility.timeLog(req, `[1] SELECT token_count Before`)
    let count = await pgPromise.query(sql)
    PageUtility.timeLog(req, `[1] SELECT token_count After`)

    if (count.code) {
        responseData = {
            count: 0,
            code: 500,
            success: false,
            message: "count token_count Error"
        }
        res.json(responseData);
    } else {
        responseData = {
            count: Number(count.rows[0].count || 0),
            code: 200,
            success: true,
            message: "success"
        }
        res.json(responseData);
    }
})
//获取交易中最新Flag
router.get("/get_token_flag", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let errorInfo = {
        "token_id": "0"
    }
    let start_sql = {
        text: `
            Select 
                "token_id"
            FROM 
                token
            order by
                "token_id" desc
            LIMIT
                1
        `
    }

    PageUtility.timeLog(req, '[1] SELECT start_sql Before')
    let transStartInfo = await pgPromise.query(start_sql)
    PageUtility.timeLog(req, '[1] SELECT start_sql After')

    if (transStartInfo.code) {
        responseData = {
            near_item: errorInfo,
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
        res.json(responseData);
        return;
    }

    let opt = {
        text: `
            Select 
                "token_id"
            FROM
                token
            order by
                "token_id" asc
            LIMIT
                1
        `
    }
    PageUtility.timeLog(req, '[2] SELECT end_sql Before')
    let transEndInfo = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[2] SELECT end_sql After')

    if (transEndInfo.code) {
        responseData = {
            near_item: errorInfo,
            end_item: errorInfo,
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows[0],
            end_item: transEndInfo.rows[0],
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//获取Token列表
router.get("/get_tokens", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;

    if (!PageUtility.isHasParam(queryVal, ["token_id"])) {
        res.json(paramError);
        return;
    }

    let columnName = '"token_id","contract_account","mc_timestamp","token_name","token_symbol","token_total","transaction_count","account_count"',
        tableName = "token";

    let opt;

    // 首页：
    /** 
     * 首页：倒序 limit 20
     * 尾页：顺序 limit 20
    */

    if (queryVal.position === "1") {
        opt = {
            text: `
                Select 
                    ${columnName}
                FROM
                    ${tableName}
                order by 
                    "token_id" desc
                LIMIT
                    $1
            `,
            values: [LIMIT_VAL]
        }

    } else if (queryVal.position === "4") {
        // 尾页
        opt = {
            text: `
                Select 
                    ${columnName}
                FROM
                    ${tableName}
                order by 
                    "token_id" asc
                LIMIT
                    $1
            `,
            values: [LIMIT_VAL]
        }
    } else if ((queryVal.position === "2") || (queryVal.position === "3")) {
        let direction, sortInfo;
        if (queryVal.position === "2") {
            direction = ">";
            sortInfo = "asc";
        } else {
            direction = "<";
            sortInfo = "desc";
        }
        opt = {
            text: `
                Select 
                    ${columnName}
                FROM 
                    ${tableName} 
                WHERE 
                    "token_id" ${direction} $1
                order by 
                    "token_id" ${sortInfo}
                LIMIT
                    $2
            `,
            values: [Number(queryVal.token_id), LIMIT_VAL]
        }
    } else {
        res.json(paramError);
        return;
    }


    PageUtility.timeLog(req, '[1] SELECT ${tableName} info Before')
    let data = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[1] SELECT ${tableName} info After')
    if (data.code) {
        responseData = {
            data: [],
            code: 500,
            success: false,
            message: `Select trans list FROM ${tableName} Error`
        }
        // logger.info(data)
    } else {
        let formatInfo;
        if ((queryVal.position === "4") || (queryVal.position === "2")) {
            formatInfo = data.rows.reverse()
        } else {
            formatInfo = data.rows;
        }
        responseData = {
            data: formatInfo,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//************************** Token列表结束

//************************** Token详情开始
//获取Token信息
router.get("/get_token_info", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;

    if (!PageUtility.isHasParam(queryVal, ["account"])) {
        res.json(paramError);
        return;
    }

    let opt = {
        text: `
        SELECT 
            "contract_account","token_name","token_symbol","token_precision",
            "token_total","transaction_count","account_count" 
        FROM 
            token
        WHERE
            contract_account = $1
            `,
        values: [queryVal.account]
    }
    PageUtility.timeLog(req, `[1] SELECT get_token_info Before`)
    let tokenInfo = await pgPromise.query(opt)
    PageUtility.timeLog(req, `[1] SELECT get_token_info After`)

    let errorInfo = {
        "contract_account": queryVal.account,
        "token_name": "",
        "token_symbol": "",
        "token_total": "",
        "transaction_count": "",
        "account_count": ""
    }
    if (tokenInfo.code) {
        responseData = {
            data: {},
            code: 500,
            success: false,
            message: "count token_count Error"
        }
        res.json(responseData);
    } else {
        responseData = {
            data: tokenInfo.rows[0] || errorInfo,
            code: 200,
            success: true,
            message: "success"
        }
        res.json(responseData);
    }
})

//获取Token交易Flag
router.get("/get_token_trans_flag", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    var queryVal = req.query;

    if (!PageUtility.isHasParam(queryVal, ["account"])) {
        res.json(paramError);
        return;
    }
    let errorInfo = {
        "stable_index": "0"
    }

    let start_sql = {
        text: `
            Select 
                "stable_index"
            FROM 
                "trans_token"
            WHERE
                "contract_account" = $1
            order by
                "stable_index" desc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }


    PageUtility.timeLog(req, '[1] SELECT start_sql Before')
    let transStartInfo = await pgPromise.query(start_sql)
    PageUtility.timeLog(req, '[1] SELECT start_sql After')

    // console.log(transStartInfo.rows);
    if (transStartInfo.code) {
        responseData = {
            near_item: errorInfo,
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
        res.json(responseData);
        return;
    }

    let opt = {
        text: `
            Select 
                "stable_index"
            FROM 
                "trans_token"
            WHERE
                "contract_account" = $1
            order by 
                "stable_index" asc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    PageUtility.timeLog(req, '[2] SELECT end_sql Before')
    let transEndInfo = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[2] SELECT end_sql After')

    if (transEndInfo.code) {
        responseData = {
            near_item: errorInfo,
            end_item: errorInfo,
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows[0] || errorInfo,
            end_item: transEndInfo.rows[0] || errorInfo,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//获取Token交易
router.get("/get_token_trans", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//account | source | stable_index

    if (!PageUtility.isHasParam(queryVal, ["account", "stable_index"])) {
        res.json(paramError);
        return;
    }

    let opt;

    //根据position查询
    if (queryVal.position === "1") {
        //首页
        opt = {
            text: `
                Select 
                    "stable_index","hash","mc_timestamp","from","to","contract_account","token_symbol","amount"
                FROM 
                    "trans_token"
                WHERE
                    "contract_account" = $1
                order by 
                    "stable_index" desc
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: [queryVal.account]
        }
    } else if (queryVal.position === "4") {
        //尾页
        opt = {
            text: `
                Select 
                    "stable_index","hash","mc_timestamp","from","to","contract_account","token_symbol","amount"
                FROM 
                    "trans_token"
                WHERE
                    "contract_account" = $1
                order by 
                    "stable_index" asc
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: [queryVal.account]
        }
    } else if ((queryVal.position === "2") || (queryVal.position === "3")) {
        let direction, sortInfo;
        if (queryVal.position === "2") {
            direction = ">";
            sortInfo = "asc";
        } else {
            direction = "<";
            sortInfo = "desc";
        }
        opt = {
            text: `
                Select 
                    "stable_index","hash","mc_timestamp","from","to","contract_account","token_symbol","amount"
                FROM 
                    "trans_token"
                WHERE 
                    ("contract_account" = $1)
                    and
                    (stable_index ${direction} $2)
                order by 
                    "stable_index" ${sortInfo}
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: [queryVal.account, queryVal.stable_index]
        };
    } else {
        res.json(paramError);
        return;
    }
    let data = await pgPromise.query(opt);
    if (data.code) {
        // 查询出错
        responseData = {
            data: [],
            code: 500,
            success: false,
            message: "Select FROM trans_token Error"
        }
    } else {
        let formatInfo;
        if ((queryVal.position === "4") || (queryVal.position === "2")) {
            formatInfo = data.rows.reverse()
        } else {
            formatInfo = data.rows;
        }
        if (data.rows.length) {
            responseData = {
                data: formatInfo,
                code: 200,
                success: true,
                message: "success"
            }
        } else {
            responseData = {
                data: [],
                code: 200,
                success: true,
                message: "success"
            }
        }
    }
    res.json(responseData);
})

//获取Token持有账户Flag
router.get("/get_token_holder_flag", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    var queryVal = req.query;

    if (!PageUtility.isHasParam(queryVal, ["account"])) {
        res.json(paramError);
        return;
    }
    let errorInfo = {}

    let start_sql = {
        text: `
            Select 
                "balance","token_asset_id"
            FROM 
                "token_asset"
            WHERE
                "contract_account" = $1
            order by
                "balance" desc,
                "token_asset_id" desc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }


    PageUtility.timeLog(req, '[1] SELECT start_sql Before')
    let transStartInfo = await pgPromise.query(start_sql)
    PageUtility.timeLog(req, '[1] SELECT start_sql After')

    // console.log(transStartInfo.rows);
    if (transStartInfo.code) {
        responseData = {
            near_item: errorInfo,
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
        res.json(responseData);
        return;
    }

    let opt = {
        text: `
            Select 
                "balance","token_asset_id"
            FROM 
                "token_asset"
            WHERE
                "contract_account" = $1
            order by 
                "balance" asc,
                "token_asset_id" asc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    PageUtility.timeLog(req, '[2] SELECT end_sql Before')
    let transEndInfo = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[2] SELECT end_sql After')

    if (transEndInfo.code) {
        responseData = {
            near_item: errorInfo,
            end_item: errorInfo,
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows[0] || errorInfo,
            end_item: transEndInfo.rows[0] || errorInfo,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//获取Token持有人
router.get("/get_token_holder", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//account | source | token_asset_id
    if (!PageUtility.isHasParam(queryVal, ["account", "balance", "token_asset_id"])) {
        res.json(paramError);
        return;
    }

    let opt;

    //根据position查询
    if (queryVal.position === "1") {
        //首页
        opt = {
            text: `
                Select 
                    "token_asset_id","account","contract_account","name","symbol","precision","balance"
                FROM 
                    "token_asset"
                WHERE
                    "contract_account" = $1
                order by 
                    "balance" desc,
                    "token_asset_id" desc
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: [queryVal.account]
        }
    } else if (queryVal.position === "4") {
        //尾页
        opt = {
            text: `
                Select 
                    "token_asset_id","account","contract_account","name","symbol","precision","balance"
                FROM
                    "token_asset"
                WHERE
                    "contract_account" = $1
                order by 
                    "balance" asc,
                    "token_asset_id" asc
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: [queryVal.account]
        }
    } else if ((queryVal.position === "2") || (queryVal.position === "3")) {
        let direction, sortInfo;
        if (queryVal.position === "2") {
            direction = ">";
            sortInfo = "asc";
        } else {
            direction = "<";
            sortInfo = "desc";
        }
        opt = {
            text: `
                Select 
                    "token_asset_id","account","contract_account","name","symbol","precision","balance"
                FROM 
                    "token_asset"
                WHERE 
                    ("contract_account" = $1)
                    and
                    ("balance" ${direction}= $2)
                    and
                    ("token_asset_id" ${direction} $3)
                order by
                    "balance" ${sortInfo},
                    "token_asset_id" ${sortInfo}
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: [queryVal.account, queryVal.balance, queryVal.token_asset_id]
        };
    }

    let data = await pgPromise.query(opt);
    if (data.code) {
        // 查询出错
        responseData = {
            data: [],
            code: 500,
            success: false,
            message: "Select FROM token_asset Error"
        }
    } else {
        let formatInfo;
        if ((queryVal.position === "4") || (queryVal.position === "2")) {
            formatInfo = data.rows.reverse()
        } else {
            formatInfo = data.rows;
        }
        if (data.rows.length) {
            responseData = {
                data: formatInfo,
                code: 200,
                success: true,
                message: "success"
            }
        } else {
            responseData = {
                data: [],
                code: 200,
                success: true,
                message: "success"
            }
        }
    }
    res.json(responseData);
})
//************************** Token详情结束

//**************************内部交易列表 开始
//获取内部交易交易总数量
router.get("/get_internal_count", async function (req, res, next) {

    PageUtility.timeLog(req, 'start')
    let sql = `SELECT value AS count FROM global WHERE key = 'internal_count'`;
    PageUtility.timeLog(req, `[1] SELECT internal_count Before`)
    let count = await pgPromise.query(sql)
    PageUtility.timeLog(req, `[1] SELECT internal_count After`)

    if (count.code) {
        responseData = {
            count: 0,
            code: 500,
            success: false,
            message: "count internal_count Error"
        }
        res.json(responseData);
    } else {
        responseData = {
            count: Number(count.rows[0].count || 0),
            code: 200,
            success: true,
            message: "success"
        }
        res.json(responseData);
    }
})
//获取内部交易的Flag
router.get("/get_internal_flag", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let errorInfo = {
        "stable_index": "0"
    }

    let start_sql = {
        text: `
            Select 
                "stable_index"
            FROM 
                "trans_internal"
            order by
                "stable_index" desc
            LIMIT
                1
        `,
        values: []
    }

    // console.log(querySour);
    PageUtility.timeLog(req, '[1] SELECT start_sql Before')
    let transStartInfo = await pgPromise.query(start_sql)
    PageUtility.timeLog(req, '[1] SELECT start_sql After')

    // console.log(transStartInfo.rows);
    if (transStartInfo.code) {
        responseData = {
            near_item: errorInfo,
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
        res.json(responseData);
        return;
    }

    let opt = {
        text: `
            Select 
                "stable_index"
            FROM 
                "trans_internal"
            order by 
                "stable_index" asc
            LIMIT
                1
        `,
        values: []
    }
    PageUtility.timeLog(req, '[2] SELECT end_sql Before')
    let transEndInfo = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[2] SELECT end_sql After')

    if (transEndInfo.code) {
        responseData = {
            near_item: errorInfo,
            end_item: errorInfo,
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows[0] || errorInfo,
            end_item: transEndInfo.rows[0] || errorInfo,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//获取内部交易
router.get("/get_internals", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//stable_index
    if (!PageUtility.isHasParam(queryVal, ["stable_index"])) {
        res.json(paramError);
        return;
    }

    let opt;

    //根据position查询
    if (queryVal.position === "1") {
        //首页
        opt = {
            text: `
                Select 
                    "hash","mc_timestamp","stable_index","from","to",
                    "value","type","contract_address_create","contract_address_suicide",
                    "refund_adderss","is_error"
                FROM 
                    "trans_internal"
                order by 
                    "stable_index" desc
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: []
        }
    } else if (queryVal.position === "4") {
        //尾页
        opt = {
            text: `
                Select 
                    "hash","mc_timestamp","stable_index","from","to",
                    "value","type","contract_address_create","contract_address_suicide",
                    "refund_adderss","is_error"
                FROM 
                    "trans_internal"
                order by 
                    "stable_index" asc
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: []
        }
    } else if ((queryVal.position === "2") || (queryVal.position === "3")) {
        let direction, sortInfo;
        if (queryVal.position === "2") {
            direction = ">";
            sortInfo = "asc";
        } else {
            direction = "<";
            sortInfo = "desc";
        }
        opt = {
            text: `
                Select 
                    "hash","mc_timestamp","stable_index","from","to",
                    "value","type","contract_address_create","contract_address_suicide",
                    "refund_adderss","is_error"
                FROM 
                    "trans_internal"
                WHERE 
                    (stable_index ${direction} $1)
                order by 
                    "stable_index" ${sortInfo}
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: [queryVal.stable_index]
        };
    } else {
        res.json(paramError);
        return;
    }
    let data = await pgPromise.query(opt);
    if (data.code) {
        // 查询出错
        responseData = {
            data: [],
            code: 500,
            success: false,
            message: "Select FROM trans_internal Error"
        }
    } else {
        let formatInfo;
        if ((queryVal.position === "4") || (queryVal.position === "2")) {
            formatInfo = data.rows.reverse()
        } else {
            formatInfo = data.rows;
        }

        if (data.rows.length) {
            responseData = {
                data: formatInfo,
                code: 200,
                success: true,
                message: "success"
            }
        } else {
            responseData = {
                data: [],
                code: 200,
                success: true,
                message: "success"
            }
        }
    }
    res.json(responseData);
})
//**************************内部交易列表 结束

//************************** 交易列表开始
//获取交易总数量
router.get("/get_trans_count", async function (req, res, next) {
    let tableName = (req.query.type === '2') ? "normal_count" : "witness_count";

    PageUtility.timeLog(req, 'start')
    let sql = `SELECT value AS count FROM global WHERE key = '${tableName}'`;
    PageUtility.timeLog(req, `[1] SELECT ${tableName} Before`)
    let count = await pgPromise.query(sql)
    PageUtility.timeLog(req, `[1] SELECT ${tableName} After`)

    if (count.code) {
        responseData = {
            count: 0,
            code: 500,
            success: false,
            message: "count transaction Error"
        }
        res.json(responseData);
    } else {
        responseData = {
            count: Number(count.rows[0].count || 0),//TODO 这么写有BUG  Cannot read property 'count' of undefined
            code: 200,
            success: true,
            message: "success"
        }
        res.json(responseData);
    }
})

//获取交易表中最近
router.get("/get_trans_flag", async function (req, res, next) {
    let tableName = (req.query.type === '2') ? "trans_normal" : "trans_witness"
    PageUtility.timeLog(req, 'start')
    let errorInfo = {
        "stable_index": "0"
    }
    let start_sql = {
        text: `
            Select 
                "stable_index"
            FROM 
                ${tableName}
            order by
                "stable_index" desc
            LIMIT
                1
        `
    }

    PageUtility.timeLog(req, '[1] SELECT start_sql Before')
    let transStartInfo = await pgPromise.query(start_sql)
    PageUtility.timeLog(req, '[1] SELECT start_sql After')

    if (transStartInfo.code) {
        responseData = {
            near_item: errorInfo,
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
        res.json(responseData);
        return;
    }

    let opt = {
        text: `
            Select 
                "stable_index"
            FROM
                ${tableName}
            order by
                "stable_index" asc
            LIMIT
                1
        `
    }
    PageUtility.timeLog(req, '[2] SELECT end_sql Before')
    let transEndInfo = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[2] SELECT end_sql After')

    if (transEndInfo.code) {
        responseData = {
            near_item: errorInfo,
            end_item: errorInfo,
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows[0],
            end_item: transEndInfo.rows[0],
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

//获取交易列表
/**
 * 参数
{ 
    position:1,//1 首页  2 上一页 3 下一页 4 尾页
    stable_index: '1555893967'
}
 */
router.get("/get_trans", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;
    let tableName, columnName;
    if (queryVal.type === '2') {
        tableName = 'trans_normal';
        columnName = '"mc_timestamp", "level", "hash", "from", "to", "is_stable", "status", "amount", "stable_index"'
    } else {
        tableName = 'trans_witness';
        columnName = '"timestamp", "stable_timestamp", "hash", "from", "is_stable", "status", "stable_index"'
    }

    let opt;

    // 首页：
    /** 
     * 首页：倒序 limit 20
     * 尾页：顺序 limit 20
    */

    if (queryVal.position === "1") {
        opt = {
            text: `
                Select 
                    ${columnName}
                FROM
                    ${tableName}
                order by 
                    stable_index desc
                LIMIT
                    $1
            `,
            values: [LIMIT_VAL]
        }

    } else if (queryVal.position === "4") {
        // 尾页
        opt = {
            text: `
                Select 
                    ${columnName}
                FROM
                    ${tableName}
                order by 
                    "stable_index" asc
                LIMIT
                    $1
            `,
            values: [LIMIT_VAL]
        }
    } else if ((queryVal.position === "2") || (queryVal.position === "3")) {
        let direction, sortInfo;
        if (queryVal.position === "2") {
            direction = ">";
            sortInfo = "asc";
        } else {
            direction = "<";
            sortInfo = "desc";
        }
        opt = {
            text: `
                Select 
                    ${columnName}
                FROM 
                    ${tableName} 
                WHERE 
                    stable_index ${direction} $1
                order by 
                    "stable_index" ${sortInfo}
                LIMIT
                    $2
            `,
            values: [Number(queryVal.stable_index), LIMIT_VAL]
        }
    } else {
        res.json(paramError);
        return;
    }


    PageUtility.timeLog(req, '[1] SELECT ${tableName} info Before')
    let data = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[1] SELECT ${tableName} info After')
    if (data.code) {
        responseData = {
            transactions: [],
            code: 500,
            success: false,
            message: `Select trans list FROM ${tableName} Error`
        }
        // logger.info(data)
    } else {
        let formatInfo;
        if ((queryVal.position === "4") || (queryVal.position === "2")) {
            formatInfo = data.rows.reverse()
        } else {
            formatInfo = data.rows;
        }
        responseData = {
            transactions: formatInfo,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//************************** 交易列表结束


//************************** 账号详情 开始
//获取账号信息
router.get("/get_account", async function (req, res, next) {
    if (!WITNESS_LIST.length) {
        PageUtility.getWitnessList();
    }
    PageUtility.timeLog(req, 'start')
    var queryAccount = req.query.account;// ?account=2
    if (!PageUtility.isHasParam(req.query, ["account"])) {
        res.json(paramError);
        return;
    }
    let opt = {
        text: `
            Select 
                "account","type","balance","transaction_count",
                "is_token_account","is_has_token_trans",
                "is_has_intel_trans","is_has_event_logs","is_has_token_assets"
            FROM 
                "accounts"
            WHERE 
                "account" = $1
        `,
        values: [queryAccount]
    };
    PageUtility.timeLog(req, 'Account Info Befor')
    let data = await pgPromise.query(opt);
    PageUtility.timeLog(req, 'Account Info After')
    if (data.code) {
        // 查询出错
        responseData = {
            account: {},
            code: 500,
            success: false,
            message: "Select account,balance,transaction_count FROM accounts Error"
        }
    } else {
        if (data.rows.length) {
            responseData = {
                account: data.rows[0],
                code: 200,
                success: true,
                message: "success"
            }
        } else {
            responseData = {
                account: {
                    "account": queryAccount,
                    "balance": 0,
                    "is_witness": false,
                    "transaction_count": 0
                },
                code: 200,
                success: true,
                message: "success"
            }
        }
    }
    responseData.account.is_witness = (WITNESS_LIST.indexOf(queryAccount.toUpperCase()) > -1) ? true : false;
    res.json(responseData);
})
//获取合约账户表
router.get("/get_contract", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    var queryAccount = req.query.account;// ?account=2
    let opt = {
        text: `
            Select 
                "contract_account","own_account","born_unit",
                "token_name","token_symbol"
            FROM 
                "contract"
            WHERE 
                "contract_account" = $1
        `,
        values: [queryAccount]
    };
    PageUtility.timeLog(req, 'Account Info Befor')
    let data = await pgPromise.query(opt);
    PageUtility.timeLog(req, 'Account Info After')
    if (data.code) {
        // 查询出错
        responseData = {
            data: {},
            code: 500,
            success: false,
            message: "Select contract Error"
        }
    } else {
        if (data.rows.length) {
            responseData = {
                data: data.rows[0],
                code: 200,
                success: true,
                message: "success"
            }
        } else {
            responseData = {
                data: {
                    "contract_account": queryAccount,
                    "own_account": "",
                    "born_unit": "",
                    "token_name": "",
                    "token_symbol": ""
                },
                code: 200,
                success: true,
                message: "success"
            }
        }
    }
    res.json(responseData);
})


//获取交易表中最近(LIMIT+1)项
//参数：account -----------------------------------------------
router.get("/get_account_trans_flag", async function (req, res, next) {
    var queryVal = req.query;
    if (!PageUtility.isHasParam(queryVal, ["account"])) {
        res.json(paramError);
        return;
    }
    let near_sql = {
        text: `
            Select 
                "stable_index","index_trans_id"
            FROM 
                account_index_trans
            WHERE
                "account" = $1
            order by
                "stable_index" desc,
                "index_trans_id" desc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let end_sql = {
        text: `
            Select 
                "stable_index","index_trans_id"
            FROM 
                account_index_trans
            WHERE
                "account" = $1
            order by
                "stable_index" asc,
                "index_trans_id" asc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let transStartInfo = await pgPromise.query(near_sql)
    if (transStartInfo.code) {
        responseData = {
            near_item: {},
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
        res.json(responseData);
        return;
    }
    let transEndInfo = await pgPromise.query(end_sql)
    if (transEndInfo.code) {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: {},
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: transEndInfo.rows.length ? transEndInfo.rows[0] : {},
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//获取交易列表
//参数:account/position/stable_index/index_trans_id/pkid
router.get("/get_account_transactions", async function (req, res, next) {
    let queryVal = req.query;//TODODODODODDO 参数校验

    //不需要这么多参数，后面需要优化掉
    if (!PageUtility.isHasParam(queryVal, ["account", "pkid", "stable_index", "index_trans_id"])) {
        res.json(paramError);
        return;
    }

    let direction, sortInfo;
    let moreSearchStrIndexTrans = "",
        moreSearchStrTransNormal = "";
    if (queryVal.position === "2") {
        direction = ">";
        sortInfo = "asc";
    } else if (queryVal.position === "3") {
        direction = "<";
        sortInfo = "desc";
    } else if (queryVal.position === "1") {
        sortInfo = "desc";
    } else if (queryVal.position === "4") {
        sortInfo = "asc";
    } else {
        res.json(paramError);
        return;
    }
    if ((queryVal.position === "2") || (queryVal.position === "3")) {
        moreSearchStrIndexTrans = `
            and
            (stable_index ${direction}= ${Number(queryVal.stable_index)})
            and
            (index_trans_id ${direction} ${Number(queryVal.index_trans_id)})
        `;
        moreSearchStrTransNormal = `
            (stable_index ${direction}= ${Number(queryVal.stable_index)})
            and
            (pkid ${direction}  ${Number(queryVal.pkid)})
            and
        `
    }

    let opt = {
        text: `
            Select 
                "account","hash","stable_index","index_trans_id"
            FROM
                account_index_trans
            WHERE
                ("account" = $1)
                ${moreSearchStrIndexTrans}
            order by 
                "stable_index" ${sortInfo},
                "index_trans_id" ${sortInfo}
            LIMIT
                ${LIMIT_VAL}
        `,
        values: [queryVal.account]
    }

    let data = await pgPromise.query(opt)
    let dataResult = data.rows;
    if (data.code) {
        responseData = {
            transactions: [],
            code: 500,
            success: false,
            message: 'Select trans list FROM acc trans_normal Error'
        }
        res.json(responseData);
        return;
    }

    //上面搜出来的Hash可能相同的
    let searchHash = [];
    data.rows.forEach(item => {
        if (searchHash.indexOf(item.hash) === -1) {
            searchHash.push(item.hash)
        }
    });
    let mainOpt = {
        text: `
            Select 
                "mc_timestamp","level","pkid","hash","from","to","is_stable","status","amount","stable_index"
            FROM
                trans_normal
            WHERE
                ${moreSearchStrTransNormal}
                ("hash" = ANY ($1))
            order by 
                "stable_index" ${sortInfo},
                "pkid" ${sortInfo}
            LIMIT
                ${LIMIT_VAL}
        `,
        values: [searchHash]
    }
    let mainData = await pgPromise.query(mainOpt)
    let mainResult = mainData.rows;
    if (mainResult.length) {
        mainResult[0].index_trans_id = dataResult[0].index_trans_id;
        mainResult[mainResult.length - 1].index_trans_id = dataResult[dataResult.length - 1].index_trans_id;

    }
    let formatInfo;
    if ((queryVal.position === "4") || (queryVal.position === "2")) {
        formatInfo = mainData.rows.reverse()
    } else {
        formatInfo = mainData.rows;
    }
    responseData = {
        transactions: formatInfo || [],
        code: 200,
        success: true,
        message: "success"
    }
    res.json(responseData);
})

// 获取Token转账的flag -----------------------------------------------
router.get("/get_trans_token_flag", async function (req, res, next) {
    var queryVal = req.query;
    if (!PageUtility.isHasParam(queryVal, ["account"])) {
        res.json(paramError);
        return;
    }
    let near_sql = {
        text: `
            Select 
                "stable_index","index_transtoken_id"
            FROM 
                account_index_transtoken
            WHERE
                "account" = $1
            order by
                "stable_index" desc,
                "index_transtoken_id" desc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let end_sql = {
        text: `
            Select 
                "stable_index","index_transtoken_id"
            FROM 
                account_index_transtoken
            WHERE
                "account" = $1
            order by
                "stable_index" asc,
                "index_transtoken_id" asc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let transStartInfo = await pgPromise.query(near_sql)
    if (transStartInfo.code) {
        responseData = {
            near_item: {},
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
        res.json(responseData);
        return;
    }
    let transEndInfo = await pgPromise.query(end_sql)
    if (transEndInfo.code) {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: {},
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: transEndInfo.rows.length ? transEndInfo.rows[0] : {},
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//获取交易列表
//参数:account/position/stable_index/index_transtoken_id/trans_token_id
router.get("/get_trans_token", async function (req, res, next) {
    let queryVal = req.query;//TODODODODODDO 参数校验
    if (!PageUtility.isHasParam(queryVal, ["account", "stable_index", "index_transtoken_id", "trans_token_id"])) {
        res.json(paramError);
        return;
    }

    let direction, sortInfo;
    let moreSearchStrIndexTrans = "",
        moreSearchStrTransNormal = "";
    if (queryVal.position === "2") {
        direction = ">";
        sortInfo = "asc";
    } else if (queryVal.position === "3") {
        direction = "<";
        sortInfo = "desc";
    } else if (queryVal.position === "1") {
        sortInfo = "desc";
    } else if (queryVal.position === "4") {
        sortInfo = "asc";
    } else {
        res.json(paramError);
        return;
    }
    if ((queryVal.position === "2") || (queryVal.position === "3")) {
        moreSearchStrIndexTrans = `
            and
            (stable_index ${direction}= ${Number(queryVal.stable_index)})
            and
            (index_transtoken_id ${direction} ${Number(queryVal.index_transtoken_id)})
            
        `;
        moreSearchStrTransNormal = `
            (stable_index ${direction}= ${Number(queryVal.stable_index)})
            and
            (trans_token_id ${direction}  ${Number(queryVal.trans_token_id)})
            and
        `
    }

    let opt = {
        text: `
            Select 
                "account","hash","stable_index","index_transtoken_id"
            FROM
                account_index_transtoken
            WHERE
                ("account" = $1)
                ${moreSearchStrIndexTrans}
                
            order by 
                "stable_index" ${sortInfo},
                "index_transtoken_id" ${sortInfo}
            LIMIT
                ${LIMIT_VAL}
        `,
        values: [queryVal.account]
    }


    let data = await pgPromise.query(opt)
    let dataResult = data.rows;
    if (data.code) {
        responseData = {
            transactions: [],
            code: 500,
            success: false,
            message: 'Select trans list FROM acc trans_token Error'
        }
        res.json(responseData);
        return;
    }

    //上面搜出来的Hash可能相同的
    let searchHash = [];
    data.rows.forEach(item => {
        if (searchHash.indexOf(item.hash) === -1) {
            searchHash.push(item.hash)
        }
    });
    let mainOpt = {
        text: `
            Select 
                "stable_index","trans_token_id","hash","mc_timestamp","from","to","contract_account","token_symbol","amount"
            FROM
                trans_token
            WHERE
                ${moreSearchStrTransNormal}
                ("hash" = ANY ($1))
            order by 
                "stable_index" ${sortInfo},
                "trans_token_id" ${sortInfo}
            LIMIT
                ${LIMIT_VAL}
        `,
        values: [searchHash]
    }
    let mainData = await pgPromise.query(mainOpt)
    let mainResult = mainData.rows;
    if (mainResult.length) {
        mainResult[0].index_transtoken_id = dataResult[0].index_transtoken_id;
        mainResult[mainResult.length - 1].index_transtoken_id = dataResult[dataResult.length - 1].index_transtoken_id;

    }
    let formatInfo;
    if ((queryVal.position === "4") || (queryVal.position === "2")) {
        formatInfo = mainData.rows.reverse()
    } else {
        formatInfo = mainData.rows;
    }
    responseData = {
        transactions: formatInfo || [],
        code: 200,
        success: true,
        message: "success"
    }
    res.json(responseData);
})

// 获取见证交易的flag -----------------------------------------------
router.get("/get_trans_witness_flag", async function (req, res, next) {
    var queryVal = req.query;
    if (!PageUtility.isHasParam(queryVal, ["account"])) {
        res.json(paramError);
        return;
    }
    let near_sql = {
        text: `
            Select 
                "stable_index"
            FROM 
                trans_witness
            WHERE
                "from" = $1
            order by
                "stable_index" desc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let end_sql = {
        text: `
            Select 
                "stable_index"
            FROM 
                trans_witness
            WHERE
                "from" = $1
            order by
                "stable_index" asc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let transStartInfo = await pgPromise.query(near_sql)
    if (transStartInfo.code) {
        responseData = {
            near_item: {},
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
        res.json(responseData);
        return;
    }
    let transEndInfo = await pgPromise.query(end_sql)
    if (transEndInfo.code) {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: {},
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: transEndInfo.rows.length ? transEndInfo.rows[0] : {},
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
// 获取见证交易列表
//参数:account/position/stable_index
router.get("/get_trans_witness", async function (req, res, next) {
    let queryVal = req.query;//TODODODODODDO 参数校验
    if (!PageUtility.isHasParam(queryVal, ["account"])) {
        res.json(paramError);
        return;
    }

    let direction, sortInfo;
    let moreSearchStrIndexTrans = "";
    if (queryVal.position === "2" || queryVal.position === "4") {
        direction = ">";
        sortInfo = "asc";
    } else if ((queryVal.position === "3") || (queryVal.position === "1")) {
        direction = "<";
        sortInfo = "desc";
    } else {
        res.json(paramError);
        return;
    }
    if ((queryVal.position === "2") || (queryVal.position === "3")) {
        moreSearchStrIndexTrans = `
            (stable_index ${direction}= ${Number(queryVal.stable_index)})
            and
        `;
    }

    let opt = {
        text: `
            Select 
                "stable_index","timestamp","hash","mci","from",
                "is_stable","status","stable_timestamp"
            FROM
                trans_witness
            WHERE
                ${moreSearchStrIndexTrans}
                ("from" = $1)
            order by 
                "stable_index" ${sortInfo}
            LIMIT
                ${LIMIT_VAL}
        `,
        values: [queryVal.account]
    }


    let data = await pgPromise.query(opt)
    if (data.code) {
        responseData = {
            transactions: [],
            code: 500,
            success: false,
            message: 'Select witness list FROM acc trans_witness Error'
        }
        res.json(responseData);
        return;
    }
    let formatInfo;
    if ((queryVal.position === "4") || (queryVal.position === "2")) {
        formatInfo = data.rows.reverse()
    } else {
        formatInfo = data.rows;
    }
    responseData = {
        transactions: formatInfo || [],
        code: 200,
        success: true,
        message: "success"
    }
    res.json(responseData);
})

//获取内部交易的Flag -----------------------------------------------
router.get("/get_trans_internal_flag", async function (req, res, next) {
    var queryVal = req.query;
    if (!PageUtility.isHasParam(queryVal, ["account"])) {
        res.json(paramError);
        return;
    }
    let near_sql = {
        text: `
            Select 
                "stable_index","index_transinternal_id"
            FROM 
                account_index_transinternal
            WHERE
                "account" = $1
            order by
                "stable_index" desc,
                "index_transinternal_id" desc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let end_sql = {
        text: `
            Select 
                "stable_index","index_transinternal_id"
            FROM 
                account_index_transinternal
            WHERE
                "account" = $1
            order by
                "stable_index" asc,
                "index_transinternal_id" asc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let transStartInfo = await pgPromise.query(near_sql)
    if (transStartInfo.code) {
        responseData = {
            near_item: {},
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
        res.json(responseData);
        return;
    }
    let transEndInfo = await pgPromise.query(end_sql)
    if (transEndInfo.code) {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: {},
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: transEndInfo.rows.length ? transEndInfo.rows[0] : {},
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//获取交易列表
//参数:account/position/stable_index/index_transinternal_id/trans_internal_id
router.get("/get_trans_internal", async function (req, res, next) {
    let queryVal = req.query;//TODODODODODDO 参数校验
    if (!PageUtility.isHasParam(queryVal, ["account", "position", "stable_index", "index_transinternal_id", "trans_internal_id"])) {
        res.json(paramError);
        return;
    }
    let direction, sortInfo;
    let moreSearchStrIndexTrans = "",
        moreSearchStrTransNormal = "";
    if (queryVal.position === "2") {
        direction = ">";
        sortInfo = "asc";
    } else if (queryVal.position === "3") {
        direction = "<";
        sortInfo = "desc";
    } else if (queryVal.position === "1") {
        sortInfo = "desc";
    } else if (queryVal.position === "4") {
        sortInfo = "asc";
    }
    if ((queryVal.position === "2") || (queryVal.position === "3")) {
        moreSearchStrIndexTrans = `
            and
            (stable_index ${direction}= ${Number(queryVal.stable_index)})
            and
            (index_transinternal_id ${direction} ${Number(queryVal.index_transinternal_id)})
            
        `;
        moreSearchStrTransNormal = `
            (stable_index ${direction}= ${Number(queryVal.stable_index)})
            and
            (trans_internal_id ${direction}  ${Number(queryVal.trans_internal_id)})
            and
        `
    }

    let opt = {
        text: `
            Select 
                "account","hash","stable_index","index_transinternal_id"
            FROM
                account_index_transinternal
            WHERE
                ("account" = $1)
                ${moreSearchStrIndexTrans}
                
            order by 
                "stable_index" ${sortInfo},
                "index_transinternal_id" ${sortInfo}
            LIMIT
                ${LIMIT_VAL}
        `,
        values: [queryVal.account]
    }


    let data = await pgPromise.query(opt)
    let dataResult = data.rows;
    if (data.code) {
        responseData = {
            transactions: [],
            code: 500,
            success: false,
            message: 'Select trans list FROM acc trans_internal Error'
        }
        res.json(responseData);
        return;
    }

    //上面搜出来的Hash可能相同的
    let searchHash = [];
    data.rows.forEach(item => {
        if (searchHash.indexOf(item.hash) === -1) {
            searchHash.push(item.hash)
        }
    });
    let mainOpt = {
        text: `
            Select 
                "stable_index","trans_internal_id",
                "hash","mc_timestamp",
                "type","contract_address_suicide","refund_adderss",
                "contract_address_create",
                "from","to","is_error","value"
            FROM
                trans_internal
            WHERE
                ${moreSearchStrTransNormal}
                ("hash" = ANY ($1))
            order by 
                "stable_index" ${sortInfo},
                "trans_internal_id" ${sortInfo}
            LIMIT
                ${LIMIT_VAL}
        `,
        values: [searchHash]
    }
    let mainData = await pgPromise.query(mainOpt)
    let mainResult = mainData.rows;
    if (mainResult.length) {
        mainResult[0].index_transinternal_id = dataResult[0].index_transinternal_id;
        mainResult[mainResult.length - 1].index_transinternal_id = dataResult[dataResult.length - 1].index_transinternal_id;

    }
    let formatInfo;
    if ((queryVal.position === "4") || (queryVal.position === "2")) {
        formatInfo = mainData.rows.reverse()
    } else {
        formatInfo = mainData.rows;
    }
    responseData = {
        transactions: formatInfo || [],
        code: 200,
        success: true,
        message: "success"
    }
    res.json(responseData);
})

//事件日志 -----------------------------------------------
router.get("/get_event_log_flag", async function (req, res, next) {
    var queryVal = req.query;
    if (!PageUtility.isHasParam(queryVal, ["account"])) {
        res.json(paramError);
        return;
    }
    let near_sql = {
        text: `
            Select 
                "stable_index","index_translog_id"
            FROM 
                account_index_translog
            WHERE
                "account" = $1
            order by
                "stable_index" desc,
                "index_translog_id" desc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let end_sql = {
        text: `
            Select 
                "stable_index","index_translog_id"
            FROM 
                account_index_translog
            WHERE
                "account" = $1
            order by
                "stable_index" asc,
                "index_translog_id" asc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let transStartInfo = await pgPromise.query(near_sql)
    if (transStartInfo.code) {
        responseData = {
            near_item: {},
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
        res.json(responseData);
        return;
    }
    let transEndInfo = await pgPromise.query(end_sql)
    if (transEndInfo.code) {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: {},
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: transEndInfo.rows.length ? transEndInfo.rows[0] : {},
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//获取交易列表
//参数:account/position/stable_index/index_translog_id/event_log_id
router.get("/get_event_log", async function (req, res, next) {
    let queryVal = req.query;//TODODODODODDO 参数校验
    if (!PageUtility.isHasParam(queryVal, ["account", "position", "stable_index", "index_translog_id", "event_log_id"])) {
        res.json(paramError);
        return;
    }
    let direction, sortInfo;
    let moreSearchStrIndexTrans = "",
        moreSearchStrTransNormal = "";
    if (queryVal.position === "2") {
        direction = ">";
        sortInfo = "asc";
    } else if (queryVal.position === "3") {
        direction = "<";
        sortInfo = "desc";
    } else if (queryVal.position === "1") {
        sortInfo = "desc";
    } else if (queryVal.position === "4") {
        sortInfo = "asc";
    }
    if ((queryVal.position === "2") || (queryVal.position === "3")) {
        moreSearchStrIndexTrans = `
            and
            (stable_index ${direction}= ${Number(queryVal.stable_index)})
            and
            (index_translog_id ${direction} ${Number(queryVal.index_translog_id)})
            
        `;
        moreSearchStrTransNormal = `
            (stable_index ${direction}= ${Number(queryVal.stable_index)})
            and
            (event_log_id ${direction}  ${Number(queryVal.event_log_id)})
            and
        `
    }

    let opt = {
        text: `
            Select 
                "account","hash","stable_index","index_translog_id"
            FROM
                account_index_translog
            WHERE
                ("account" = $1)
                ${moreSearchStrIndexTrans}
                
            order by 
                "stable_index" ${sortInfo},
                "index_translog_id" ${sortInfo}
            LIMIT
                ${LIMIT_VAL}
        `,
        values: [queryVal.account]
    }


    let data = await pgPromise.query(opt)
    let dataResult = data.rows;
    if (data.code) {
        responseData = {
            transactions: [],
            code: 500,
            success: false,
            message: 'Select trans list FROM acc event_log Error'
        }
        res.json(responseData);
        return;
    }

    //上面搜出来的Hash可能相同的
    let searchHash = [];
    data.rows.forEach(item => {
        if (searchHash.indexOf(item.hash) === -1) {
            searchHash.push(item.hash)
        }
    });
    let mainOpt = {
        text: `
            Select 
                "event_log_id","hash","mci","mc_timestamp",
                "stable_index","contract_address","from","to","method",
                "address","data","topics"
            FROM
                event_log
            WHERE
                ${moreSearchStrTransNormal}
                ("hash" = ANY ($1))
            order by 
                "stable_index" ${sortInfo},
                "event_log_id" ${sortInfo}
            LIMIT
                ${LIMIT_VAL}
        `,
        values: [searchHash]
    }
    let mainData = await pgPromise.query(mainOpt)
    let mainResult = mainData.rows;
    if (mainResult.length) {
        mainResult[0].index_translog_id = dataResult[0].index_translog_id;
        mainResult[mainResult.length - 1].index_translog_id = dataResult[dataResult.length - 1].index_translog_id;

    }
    let tempTopics;
    mainData.rows.forEach(element => {
        tempTopics = element.topics.split(",");
        element.topics = tempTopics;
    });

    let formatInfo;
    if ((queryVal.position === "4") || (queryVal.position === "2")) {
        formatInfo = mainData.rows.reverse()
    } else {
        formatInfo = mainData.rows;
    }
    responseData = {
        transactions: formatInfo || [],
        code: 200,
        success: true,
        message: "success"
    }
    res.json(responseData);
})

//获取合约代码
router.get("/get_contract_code", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//account
    if (!PageUtility.isHasParam(queryVal, ["account"])) {
        res.json(paramError);
        return;
    }
    let opt = {
        text: `
            Select 
                "contract_account","code"
            FROM 
                "contract_code"
            WHERE 
                "contract_account" = $1
        `,
        values: [queryVal.account]
    };
    let data = await pgPromise.query(opt);
    if (data.code) {
        // 查询出错
        responseData = {
            data: '',
            code: 500,
            success: false,
            message: "Select FROM contract_code Error"
        }
    } else {
        if (data.rows.length) {
            responseData = {
                data: data.rows[0],
                code: 200,
                success: true,
                message: "success"
            }
        } else {
            responseData = {
                data: {
                    "contract_account": queryVal.account,
                    "code": ''
                },
                code: 200,
                success: true,
                message: "success"
            }
        }
    }
    res.json(responseData);
})

//获取代币列表 -----------------------------------------------
router.get("/get_account_token_list_flag", async function (req, res, next) {
    var queryVal = req.query;
    if (!PageUtility.isHasParam(queryVal, ["account"])) {
        res.json(paramError);
        return;
    }
    let near_sql = {
        text: `
            Select 
                "token_asset_id"
            FROM 
                token_asset
            WHERE
                "account" = $1
            order by
                "token_asset_id" desc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let end_sql = {
        text: `
            Select 
                "token_asset_id"
            FROM 
                token_asset
            WHERE
                "account" = $1
            order by
                "token_asset_id" asc
            LIMIT
                1
        `,
        values: [queryVal.account]
    }
    let transStartInfo = await pgPromise.query(near_sql)
    if (transStartInfo.code) {
        responseData = {
            near_item: {},
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
        res.json(responseData);
        return;
    }
    let transEndInfo = await pgPromise.query(end_sql)
    if (transEndInfo.code) {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: {},
            code: 500,
            success: false,
            message: "select end_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows.length ? transStartInfo.rows[0] : {},
            end_item: transEndInfo.rows.length ? transEndInfo.rows[0] : {},
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//获取交易列表
//参数:account/position/token_asset_id
router.get("/get_account_token_list", async function (req, res, next) {
    let queryVal = req.query;//TODODODODODDO 参数校验
    if (!PageUtility.isHasParam(queryVal, ["account", "position", "token_asset_id"])) {
        res.json(paramError);
        return;
    }
    let direction, sortInfo;
    let moreSearchStrIndexTrans = "";
    if (queryVal.position === "2") {
        direction = ">";
        sortInfo = "asc";
    } else if (queryVal.position === "3") {
        direction = "<";
        sortInfo = "desc";
    } else if (queryVal.position === "1") {
        sortInfo = "desc";
    } else if (queryVal.position === "4") {
        sortInfo = "asc";
    }
    if ((queryVal.position === "2") || (queryVal.position === "3")) {
        moreSearchStrIndexTrans = `
            and
            (token_asset_id ${direction} ${Number(queryVal.token_asset_id)})
        `;
    }

    let opt = {
        text: `
            Select 
                "token_asset_id","contract_account",
                "name","symbol",
                "precision","balance"
            FROM
                token_asset
            WHERE
                ("account" = $1)
                ${moreSearchStrIndexTrans}
                
            order by 
                "token_asset_id" ${sortInfo}
            LIMIT
                ${LIMIT_VAL}
        `,
        values: [queryVal.account]
    }


    let data = await pgPromise.query(opt)
    if (data.code) {
        responseData = {
            data: [],
            code: 500,
            success: false,
            message: 'Select trans list FROM acc trans_normal Error'
        }
        res.json(responseData);
        return;
    }

    let formatInfo;
    if ((queryVal.position === "4") || (queryVal.position === "2")) {
        formatInfo = data.rows.reverse()
    } else {
        formatInfo = data.rows;
    }
    responseData = {
        data: formatInfo || [],
        code: 200,
        success: true,
        message: "success"
    }
    res.json(responseData);
})

//************************** 账号详情 结束

//************************** 交易详情页 开始
//获取交易HAX对应的信息 简单信息
router.get("/get_transaction_short", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryTransaction = req.query.transaction;// TODO 验证格式

    if (!PageUtility.isHasParam(req.query, ["transaction"])) {
        res.json(paramError);
        return;
    }

    let tableName = '';
    let tableCol = ''
    let typeValue = 0;
    //DO 选择HASH类型
    let type_sql = {
        text: `
            Select 
                "type"
            FROM 
                trans_type  
            WHERE 
                hash = $1
        `,
        values: [queryTransaction]
    }
    let type = await pgPromise.query(type_sql);
    if (!type.rows.length) {
        //不存在的Hash
        responseData = {
            transaction: {},
            code: 404,
            success: true,
            message: "hash node found"
        }
        res.json(responseData);
        return;
    }
    // console.log(type.rows);
    typeValue = type.rows[0].type;

    if (typeValue === '0') {
        tableName = 'trans_genesis';
        tableCol = `
        "hash","type","from","timestamp","signature",
        "to","amount","data_hash","data",

        "is_stable",
        "level","witnessed_level"
        "status","stable_index","mc_timestamp","stable_timestamp","mci",
        "is_free","is_on_mc","from_state","to_states","gas_used","log","log_bloom"
        `;
    } else if (typeValue === '1') {
        tableName = 'trans_witness';
        tableCol = `
        "hash","type","from","timestamp","signature",
        "previous","links","last_stable_block","last_summary_block","last_summary",

        "is_stable",
        "level","witnessed_level","best_parent",
        "status","stable_index","mc_timestamp","stable_timestamp","mci",
        "is_free","is_on_mc"
        `;
    } else {
        tableName = 'trans_normal'
        tableCol = `
        "hash","type","from","mc_timestamp","signature",
        "to","amount","previous","gas","gas_price","data_hash","data",

        "is_stable",
        "level",
        "from_state","to_states","gas_used","log","log_bloom","contract_address",
        "status","stable_index","mc_timestamp","stable_timestamp","mci",
        "is_event_log","is_token_trans","is_intel_trans"
        `;
    }

    //TODO 少选点信息
    let opt = {
        text: `
            Select 
                ${tableCol}
            FROM 
                ${tableName}  
            WHERE 
                hash = $1
        `,
        values: [queryTransaction]
    }

    PageUtility.timeLog(req, '[1] SELECT transaction info Before')
    let data = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[1] SELECT transaction info After')
    let transaction;
    let errorInfo = {
        "hash": queryTransaction,
        "from": "",
        "to": "",
        "amount": "0",
        "data": "",
        "status": "0",
        "is_stable": "0"
    }

    if (data.code) {
        responseData = {
            transaction: errorInfo,
            code: 500,
            success: false,
            message: "select items from transaction error"
        }
    } else {
        transaction = data.rows.length ? data.rows[0] : errorInfo;
        responseData = {
            transaction: transaction,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

// 获取Token转账
router.get("/get_transaction_trans_token", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//hash
    if (!PageUtility.isHasParam(queryVal, ["hash"])) {
        res.json(paramError);
        return;
    }
    let opt = {
        text: `
            Select 
                "trans_token_id","hash","mc_timestamp","from","to","contract_account","token_symbol","amount"
            FROM 
                "trans_token"
            WHERE
                "hash" = $1
            order by
                trans_token_id asc
        `,
        values: [queryVal.hash]
    }
    let data = await pgPromise.query(opt);
    if (data.code) {
        // 查询出错
        responseData = {
            data: [],
            code: 500,
            success: false,
            message: "Select FROM trans_token Error"
        }
    } else {
        responseData = {
            data: data.rows,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

// 内部交易
router.get("/get_transaction_trans_internal", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//hash
    if (!PageUtility.isHasParam(queryVal, ["hash"])) {
        res.json(paramError);
        return;
    }
    let opt = {
        text: `
            Select 
                "hash",
                "mci",
                "mc_timestamp",
                "stable_index",

                "type",

                "call_type",
                "from",
                "to",
                "gas",
                "input",
                "value",

                "init",

                "contract_address_suicide",
                "refund_adderss",
                "balance",

                "gas_used",
                "output",
                "contract_address_create",
                "contract_address_create_code",

                "is_error",
                "error_msg",
                "subtraces",
                "trace_address"
            FROM 
                "trans_internal"
            WHERE
                "hash" = $1
            order by
                trans_internal_id asc
        `,
        values: [queryVal.hash]
    }

    let data = await pgPromise.query(opt);
    if (data.code) {
        // 查询出错
        responseData = {
            data: [],
            code: 500,
            success: false,
            message: "Select FROM trans_internal Error"
        }
    } else {
        responseData = {
            data: data.rows,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

// 事件日志
router.get("/get_transaction_event_log", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//hash
    if (!PageUtility.isHasParam(queryVal, ["hash"])) {
        res.json(paramError);
        return;
    }
    let opt = {
        text: `
            Select 
                "hash","mc_timestamp","contract_address","address","data","method","topics"
            FROM 
                "event_log"
            WHERE
                "hash" = $1
            order by
                event_log_id asc
        `,
        values: [queryVal.hash]
    };
    let data = await pgPromise.query(opt);
    if (data.code) {
        // 查询出错
        responseData = {
            data: [],
            code: 500,
            success: false,
            message: "Select FROM contract_code Error"
        }
    } else {
        let tempTopics;
        data.rows.forEach(element => {
            tempTopics = element.topics.split(",");
            element.topics = tempTopics;
        });
        responseData = {
            data: data.rows,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

//获取交易props
router.get("/get_transaction_props", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//hash
    if (!PageUtility.isHasParam(queryVal, ["hash"])) {
        res.json(paramError);
        return;
    }
    let tableName = '';
    let tableCol = ''
    let typeValue = 0;
    let type_sql = {
        text: `
            Select 
                "type"
            FROM 
                trans_type  
            WHERE 
                hash = $1
        `,
        values: [queryVal.hash]
    }
    let type = await pgPromise.query(type_sql);
    if (!type.rows.length) {
        responseData = {
            data: {},
            code: 200,
            success: true,
            message: "hash node found"
        }
        res.json(responseData);
        return;
    }
    // console.log(type.rows);
    typeValue = type.rows[0].type;
    let errorInfo = {
        "hash": queryVal.hash,
        "type": typeValue,
        is_event_log: true,
        is_intel_trans: true,
        is_token_trans: true,
    }

    if (typeValue === '2') {
        //普通交易
        tableName = 'trans_normal'
        tableCol = `
            "hash","type",
            "is_event_log","is_token_trans","is_intel_trans"
        `;
    } else {
        responseData = {
            data: errorInfo,
            code: 200,
            success: true,
            message: "success"
        }
        res.json(responseData);
        return;
    }

    //TODO 少选点信息
    let opt = {
        text: `
            Select 
                ${tableCol}
            FROM 
                ${tableName}  
            WHERE 
                hash = $1
        `,
        values: [queryVal.hash]
    }

    PageUtility.timeLog(req, '[1] SELECT transaction info Before')
    let data = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[1] SELECT transaction info After')
    let transaction;


    if (data.code) {
        responseData = {
            data: errorInfo,
            code: 500,
            success: false,
            message: "select items from transaction error"
        }
    } else {
        transaction = data.rows.length ? data.rows[0] : errorInfo;
        responseData = {
            data: transaction,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

//************************** 交易详情页 结束


//************************** DAG 开始
//获取交易HAX对应的信息  全属性
router.get("/get_transaction", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryTransaction = req.query.transaction;// ?account=2
    let transaction;

    if (!PageUtility.isHasParam(req.query, ["transaction"])) {
        res.json(paramError);
        return;
    }

    //TODO 少选点信息
    let opt = {
        text: `
            Select 
                "hash","type","from","previous","timestamp","signature","level","is_stable",
                "stable_index","status","mci","mc_timestamp","stable_timestamp",
                "last_stable_block","last_summary_block",
                "last_summary","is_free","witnessed_level","best_parent","is_on_mc"
            FROM 
                trans_witness
            WHERE 
                hash = $1
        `,
        values: [queryTransaction]
    }

    PageUtility.timeLog(req, '[1] SELECT trans_witness info Before')
    let data = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[1] SELECT trans_witness info After')

    if (data.code) {
        responseData = {
            transaction: {
                "pkid": "",
                "hash": "",
                "type": "",
                "from": "",
                "to": "",
                "amount": "0",
                "previous": "",
                "last_summary": "",
                "last_summary_block": "",
                "data": "",
                "timestamp": "",
                "signature": "",
                "is_free": false,
                "level": "0",
                "witnessed_level": "0",
                "best_parent": "",
                "is_stable": false,
                "status": "0",
                "is_on_mc": false,
                "mci": "0",
                "latest_included_mci": "0",
                "mc_timestamp": "0",
                "stable_timestamp": "0",
                "parents": []
            },
            code: 500,
            success: false,
            message: "select items from trans_witness error"
        }
        res.json(responseData);
        return;
    } else {
        transaction = data.rows[0];
    }


    let optParents = {
        text: `
            Select 
                item,parent 
            FROM 
                parents 
            WHERE 
                item = $1 
            ORDER BY 
                parents_id DESC
        `,
        values: [queryTransaction]
    }

    PageUtility.timeLog(req, '[2] SELECT parents info Before')
    let result = await pgPromise.query(optParents);
    PageUtility.timeLog(req, '[2] SELECT parents info After')

    if (result.code) {
        responseData = {
            transaction: transaction,
            code: 500,
            success: false,
            message: "select items from parents error"
        }
        res.json(responseData);
        return;
    } else {
        transaction.parents = result.rows;
    }
    responseData = {
        transaction: transaction,
        code: 200,
        success: true,
        message: "success"
    }
    res.json(responseData);
})
//获取以前的unit
router.get("/get_previous_units", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')

    var queryVal = req.query;
    var sqlOptions;
    if (!PageUtility.isHasParam(queryVal, ["direction"])) {
        res.json(paramError);
        return;
    }
    // console.log(queryVal);
    if (queryVal.direction === 'down') {
        sqlOptions = {
            text: `
                Select 
                    hash,level,stable_index,is_free,is_stable,"status",is_on_mc,"from",best_parent 
                FROM 
                    trans_witness 
                WHERE 
                    stable_index < $1
                order by
                    stable_index desc
                limit 
                    100`,
            values: [queryVal.stable_index]
        }
    } else if (queryVal.direction === 'up') {

        sqlOptions = {
            text: `
                Select 
                    hash,level,stable_index,is_free,is_stable,"status",is_on_mc,"from",best_parent  
                FROM 
                    trans_witness 
                WHERE 
                    stable_index > $1
                order by 
                    stable_index asc
                limit 
                    100
            `,
            values: [queryVal.stable_index]
        }

    } else if ((queryVal.direction === 'center') && queryVal.active_unit) {
        let sql = {
            text: `
                select 
                    stable_index
                from 
                    trans_witness 
                where
                    hash = $1
                limit 
                    1
            `,
            values: [queryVal.active_unit]
        };
        PageUtility.timeLog(req, '[0] SELECT center stable_index Before')
        let hashData = await pgPromise.query(sql)
        // logger.info(`hashData.rows:`)
        // logger.info(hashData.rows)
        // 如果数据库不存在，则返回空
        if (hashData.rows.length === 0) {
            responseData = {
                units: {
                    nodes: [],
                    edges: {}
                },
                code: 200,
                message: "success"
            };
            res.json(responseData);
        }
        let centerHashInfo = hashData.rows[0]
        PageUtility.timeLog(req, '[0] SELECT center stable_index Afer')
        sqlOptions = {
            text: `
            (
                Select 
                    hash,level,stable_index,is_free,is_stable,"status",is_on_mc,"from",best_parent 
                FROM 
                    trans_witness 
                WHERE 
                    stable_index > $2
                order by 
                    stable_index asc
                limit 
                    49
            )
            UNION
            (
                select 
                    hash,level,stable_index,is_free,is_stable,"status",is_on_mc,"from",best_parent 
                from 
                    trans_witness 
                where 
                    hash = $1 
                limit 
                    1
            )
            UNION 
            (
                Select 
                    hash,level,stable_index,is_free,is_stable,"status",is_on_mc,"from",best_parent 
                FROM 
                    trans_witness
                WHERE 
                    stable_index < $2
                order by 
                    stable_index desc
                limit
                    50
            )
            order by 
                stable_index desc
            `,
            values: [queryVal.active_unit, centerHashInfo.stable_index]
        }
    } else {
        sqlOptions = `
            Select
                hash,level,stable_index,is_free,is_stable,"status",is_on_mc,"from",best_parent 
            FROM 
                trans_witness
            order by
                stable_index desc
            limit
                100
        `;
    }


    PageUtility.timeLog(req, '[1] SELECT trans_witness list Before')
    let data = await pgPromise.query(sqlOptions)
    PageUtility.timeLog(req, '[1] SELECT trans_witness list Afer')

    if (data.code) {
        responseData = {
            units: {
                nodes: [],
                edges: {}
            },
            code: 500,
            success: false,
            message: "select xxx,xxx from trans_witness error"
        }
        res.json(responseData);
        return;
    }
    if (data.rows.length === 0) {
        responseData = {
            units: {
                nodes: [],
                edges: {}
            },
            code: 200,
            success: true,
            message: "null"
        }
        res.json(responseData);
        return;
    }
    let dataAry = [];
    data.rows.forEach(item => {
        dataAry.push("'" + item.hash + "'");
    })
    var dataAryStr = dataAry.join(",");

    //查 parent ***************************
    // let parentSql = {
    //     text: `
    //         select 
    //             item,parent 
    //         FROM 
    //             parents 
    //         WHERE 
    //             item in ${dataAryStr}
    //     `
    // }

    PageUtility.timeLog(req, '[2] SELECT item,parent Before')
    let result = await pgPromise.query("Select item,parent FROM parents WHERE item in (" + dataAryStr + ")")
    PageUtility.timeLog(req, '[2] SELECT item,parent Afer')

    if (result.code) {
        responseData = {
            units: {
                nodes: [],
                edges: {}
            },
            code: 500,
            success: false,
            message: "select xxx,xxx from parents error"
        }
        res.json(responseData);
    }
    //筛选parent数据，把不是 dataAryDiff 里的parent都移除

    var tempEdges = {};
    result.rows.forEach(resItem => {
        tempEdges[resItem.item + '_' + resItem["parent"]] = {
            "data": {
                "source": resItem.item,
                "target": resItem["parent"]
            },
            "best_parent_unit": PageUtility.isBastParent(resItem, data.rows)
        }
    })

    responseData = {
        units: {
            nodes: PageUtility.formatUnits(data.rows),
            edges: tempEdges
        },
        code: 200,
        message: "success"
    };
    res.json(responseData);

});
//************************** DAG 结束


//************************** 首页接口 开始
//获取最新的交易
router.get("/get_latest_transactions", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    // TODO optimize
    let sql = {
        text: `
            Select 
                "mc_timestamp",hash,"from","to",is_stable,"status",amount 
            FROM 
                trans_normal
            order by 
                stable_index desc 
            LIMIT 10
        `
    };
    PageUtility.timeLog(req, '[1] SELECT latest transactions Before')
    let data = await pgPromise.query(sql)
    PageUtility.timeLog(req, '[1] SELECT latest transactions Afer')

    if (data.code) {
        responseData = {
            transactions: [],
            code: 500,
            success: false,
            message: 'select level,hash,"from","to",is_stable,"status",amount from trans_normal error'
        }
    } else {
        responseData = {
            transactions: data.rows,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//获取MCI 首页：mci、交易数量、TPS 
router.get("/get_mci", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')

    let sql = {
        text: `
            select 
                key,value from global
            where 
                key='last_mci'
                or
                key ='last_stable_mci'
                or
                key = 'last_stable_block_index'
        `
    };
    PageUtility.timeLog(req, '[1] SELECT last_mci last_stable_mci Before')
    let data = await pgPromise.query(sql)
    PageUtility.timeLog(req, '[1] SELECT last_mci last_stable_mci After')

    //获取峰值MCI
    let tpsSql = {
        text: `
        select 
            "count"
        from 
            timestamp
        where 
            type=1
        order by
            "count" desc
        limit
            1
        `
    };
    PageUtility.timeLog(req, '[1] SELECT tpsSql Before')
    let tpsData = await pgPromise.query(tpsSql)
    PageUtility.timeLog(req, '[1] SELECT tpsSql After')

    if (data.code) {
        responseData = {
            mci: {},
            code: 500,
            success: false,
            message: "get_mci FROM global Error"
        }
    } else {
        let mciObj = {};
        mciObj.top_tps = tpsData.rows.length ? tpsData.rows[0].count : 0;//TPS
        data.rows.forEach(item => {
            mciObj[item.key] = item.value;
        })
        responseData = {
            mci: mciObj,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//获取TPS
router.get("/get_timestamp", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    var srvObj = {};
    var cltObj = {};
    var queryType = req.query.type
    if (queryType !== '1' && queryType !== '10' && queryType !== '30' && queryType !== '60' && queryType !== '300') {
        queryType = '1'
    }
    var queryStart = req.query.start;//end
    var multiple = queryType === '1' ? 1 : Number(queryType) / 10;
    var limit = 300 * multiple;
    let sql = {};
    queryType = queryType === '1' ? '1' : '10';
    // queryStart = "1561731341";
    if (queryStart) {
        var restleTimestamp = queryType === '1' ? queryStart : Math.floor(Number(queryStart) / 10);
        sql.text = `
            Select 
                timestamp,count
            FROM 
                timestamp 
            WHERE 
                type = $1 and 
                timestamp <= $2 and
                timestamp >= $3
            ORDER BY 
                timestamp DESC 
        `;
        sql.values = [queryType, restleTimestamp, restleTimestamp - limit];
    } else {
        let nowstamp = Date.parse(new Date()) / 1000;
        var restleTimestamp = queryType === '1' ? nowstamp : Math.floor(nowstamp / 10);
        sql.text = `
            Select 
                timestamp,count 
            FROM
                timestamp 
            WHERE
                type = $1 and
                timestamp >= $2
            ORDER BY
                timestamp DESC 
        `;
        sql.values = [queryType, restleTimestamp - limit];
    }

    PageUtility.timeLog(req, '[1] SELECT last_mci last_stable_mc Before')
    let data = await pgPromise.query(sql)
    PageUtility.timeLog(req, '[1] SELECT last_mci last_stable_mc After')

    if (data.code) {
        responseData = {
            timestamp: [],
            count: [],
            code: 500,
            success: false,
            message: "Select timestamp FROM timestamp Error"
        }
    } else {
        let timestamp = [];
        let count = [];
        data.rows.forEach(item => {
            srvObj[item.timestamp] = Number(item.count)
        });

        for (let i = 0; i < 300 * multiple; i += multiple) {
            cltObj[restleTimestamp - i] = 0;
        }
        Object.keys(cltObj).forEach((item) => {
            for (let i = 0; i < multiple; i++) {
                cltObj[item] += (srvObj[(item - i).toString()] || 0);
            }
        });
        Object.keys(cltObj).forEach((items, index) => {
            timestamp[index] = items;
            if (queryType === '1') {
                count[index] = cltObj[items]
            } else {
                count[index] = (cltObj[items] / multiple / 10).toFixed(3)
            }
        });
        responseData = {
            timestamp: timestamp,
            count: count,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})
//************************** 首页接口 结束

module.exports = router;