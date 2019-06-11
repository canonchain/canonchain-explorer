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
    } else {
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
    }

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
            element.proportion = ((element.balance / (1132623791.6 * 1000000000000000000)) * 100).toFixed(10) + " %";
            //并保留6位精度
            // let tempVal = element.balance
            // if (tempVal == 0) {
            //     element.balance = 0; //TODO Keep 6 decimal places
            // } else {
            //     var reg = /(\d+(?:\.)?)(\d{0,6})/;
            //     var regAry = reg.exec(tempVal);
            //     var integer = regAry[1];
            //     var decimal = regAry[2];
            //     if (decimal) {
            //         while (decimal.length < 6) {
            //             decimal += "0";
            //         }
            //     } else {
            //         decimal = ".000000"
            //     }
            //     element.balance = integer + decimal; //TODO Keep 6 decimal places
            // }
            // element.rank = LIMIT_VAL * basePage + (index + 1);
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

//获取交易表中最近(LIMIT+1)项
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
        columnName = '"exec_timestamp", "stable_timestamp", "hash", "from", "is_stable", "status", "stable_index"'
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
    } else {
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

    let opt = {
        text: `
            Select 
                "account","type","balance","transaction_count",
                "is_token_account","is_has_token_trans",
                "is_has_intel_trans","is_has_event_logs"
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
//参数： 
//account
//source 1:from     2:to
router.get("/get_account_trans_flag", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    var queryInfo = req.query;
    var queryAccount = queryInfo.account;// ?account=2
    var querySour = "";
    var TABLE_NAME = "trans_normal";

    if (queryInfo.source === '1') {
        querySour = "from";
    } else if (queryInfo.source === '2') {
        querySour = "to";
    } else if (queryInfo.source === '3') {
        querySour = "from";
        TABLE_NAME = "trans_witness";
    }

    let errorInfo = {
        "exec_timestamp": "0",
        "level": "0",
        "pkid": "0"
    }

    let start_sql = {
        text: `
            Select 
                "stable_index"
            FROM 
                ${TABLE_NAME}
            WHERE
                ("${querySour}" = $1)
            order by
                "stable_index" desc
            LIMIT
                1
        `,
        values: [queryAccount]
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
                ${TABLE_NAME} 
            WHERE
                ("${querySour}" = $1)
            order by 
                "stable_index" asc
            LIMIT
                1
        `,
        values: [queryAccount]
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

//获取交易列表
/**
 * 参数
{
    stable_index: '1',
    account: '12',
}
 */
router.get("/get_account_transactions", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;
    var queryAccount = queryVal.account;// ?account=2
    var querySour = "";
    var IS_WITNESS = false;

    if (queryVal.source === '1') {
        querySour = "from";
    } else if (queryVal.source === '2') {
        querySour = "to";
    } else if (queryVal.source === '3') {
        //见证交易
        IS_WITNESS = true;
    }

    if (queryVal.position === "1") {
        if (IS_WITNESS) {
            //见证交易
            opt = {
                text: `
                    Select 
                        "exec_timestamp","hash","from","is_stable","status","stable_index"
                    FROM
                        trans_witness
                    WHERE
                        "from" = $1
                    order by 
                        "stable_index" desc
                    LIMIT
                        ${LIMIT_VAL}
                `,
                values: [queryAccount]
            }
        } else {
            //首页
            opt = {
                text: `
                    Select 
                        "mc_timestamp","level","pkid","hash","from","to","is_stable","status","amount","stable_index"
                    FROM
                        trans_normal
                    WHERE
                        "${querySour}" = $1
                    order by 
                        "stable_index" desc
                    LIMIT
                        ${LIMIT_VAL}
                `,
                values: [queryAccount]
            }
        }
    } else if (queryVal.position === "4") {
        if (IS_WITNESS) {
            //见证交易
            opt = {
                text: `
                    Select 
                        "exec_timestamp","hash","from","is_stable","status","stable_index"
                    FROM
                        trans_witness
                    WHERE
                        "from" = $1
                    order by 
                        "stable_index" asc
                    LIMIT
                        ${LIMIT_VAL}
                `,
                values: [queryAccount]
            }
        } else {
            // 尾页
            opt = {
                text: `
                    Select 
                        "exec_timestamp","level","pkid","hash","from","to","is_stable","status","amount","stable_index"
                    FROM
                        trans_normal
                    WHERE
                        "${querySour}" = $1
                    order by 
                        "stable_index" asc
                    LIMIT
                        ${LIMIT_VAL}
                `,
                values: [queryAccount]
            }
        }
    } else {
        let direction, sortInfo;
        if (queryVal.position === "2") {
            direction = ">";
            sortInfo = "asc";
        } else {
            direction = "<";
            sortInfo = "desc";
        }


        if (IS_WITNESS) {
            //见证交易
            opt = {
                text: `
                    Select 
                        "exec_timestamp","hash","from","is_stable","status","stable_index"
                    FROM
                        trans_witness
                    WHERE
                        (stable_index ${direction} $1)
                        and
                        ("from" = $2)
                    order by 
                        "stable_index" ${sortInfo}
                    LIMIT
                        ${LIMIT_VAL}
                `,
                values: [Number(queryVal.stable_index), queryAccount]
            }
        } else {
            opt = {
                text: `
                    Select 
                        "exec_timestamp","level","pkid","hash","from","to","is_stable","status","amount","stable_index"
                    FROM 
                        trans_normal 
                    WHERE 
                        (stable_index ${direction} $1)
                        and
                        ("${querySour}" = $2)
                    order by 
                        "stable_index" ${sortInfo}
                    LIMIT
                        ${LIMIT_VAL}
                `,
                values: [Number(queryVal.stable_index), queryAccount]
            }
        }

    }

    PageUtility.timeLog(req, '[1] SELECT acc trans_normal info Before')
    let data = await pgPromise.query(opt)
    PageUtility.timeLog(req, '[1] SELECT acc trans_normal info After')
    if (data.code) {
        responseData = {
            transactions: [],
            code: 500,
            success: false,
            message: 'Select trans list FROM acc trans_normal Error'
        }
        // logger.info(data)
    } else {
        let formatInfo;
        // console.log(data.rows);
        // console.log(queryVal.position);
        // console.log((queryVal.position === "4") || (queryVal.position === "2"));
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
    }
    //是否从此帐号发出
    if (!IS_WITNESS) {
        responseData.transactions.forEach(item => {
            if (item.from == queryAccount) {
                item.is_from_this_account = true;
            } else {
                item.is_from_this_account = false;
            }
            //是否转给自己
            if (item.from == item.to) {
                item.is_to_self = true;
            } else {
                item.is_to_self = false;
            }
        })
    }

    res.json(responseData);
})

//获取Token转账
router.get("/get_trans_token", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//account | source | trans_token_id
    var querySour = "";

    if (queryVal.source === '1') {
        querySour = "from";
    } else if (queryVal.source === '2') {
        querySour = "to";
    }
    let opt;

    //根据position查询
    if (queryVal.position === "1") {
        //首页
        opt = {
            text: `
                Select 
                    "trans_token_id","hash","mc_timestamp","from","to","contract_account","token_symbol","amount"
                FROM 
                    "trans_token"
                WHERE
                    "${querySour}" = $1
                order by 
                    "trans_token_id" desc
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
                    "trans_token_id","hash","mc_timestamp","from","to","contract_account","token_symbol","amount"
                FROM 
                    "trans_token"
                WHERE
                    "${querySour}" = $1
                order by 
                    "trans_token_id" asc
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: [queryVal.account]
        }
    } else {
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
                    "trans_token_id","hash","mc_timestamp","from","to","contract_account","token_symbol","amount"
                FROM 
                    "trans_token"
                WHERE 
                    (trans_token_id ${direction} $2)
                    and
                    ("${querySour}" = $1)
                order by 
                    "trans_token_id" ${sortInfo}
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: [queryVal.account, queryVal.trans_token_id]
        };
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

        formatInfo.forEach(item => {
            if (item.from == queryVal.account) {
                item.is_from_this_account = true;
            } else {
                item.is_from_this_account = false;
            }
            //是否转给自己
            if (item.from == item.to) {
                item.is_to_self = true;
            } else {
                item.is_to_self = false;
            }
        })

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
//TODO 获取交易内转账 [未完成]
router.get("/trans_internal", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//account | source | trans_token_id
    var querySour = "";

    if (queryVal.source === '1') {
        querySour = "from";
    } else if (queryVal.source === '2') {
        querySour = "to";
    }
    let opt;

    //根据position查询
    if (queryVal.position === "1") {
        //首页
        opt = {
            text: `
                Select 
                    *
                FROM 
                    "trans_internal"
                WHERE
                    "${querySour}" = $1
                order by 
                    "trans_token_id" desc
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
                    *
                FROM 
                    "trans_internal"
                WHERE
                    "${querySour}" = $1
                order by 
                    "trans_token_id" asc
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: [queryVal.account]
        }
    } else {
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
                    *
                FROM 
                    "trans_token"
                WHERE 
                    (trans_token_id ${direction} $2)
                    and
                    ("${querySour}" = $1)
                order by 
                    "trans_token_id" ${sortInfo}
                LIMIT
                    ${LIMIT_VAL}
            `,
            values: [queryVal.account, queryVal.trans_token_id]
        };
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
//事件日志
router.get("/get_event_log", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//account

    let opt = {
        text: `
            Select 
                "hash","mc_timestamp","contract_account","data","method","method_function","topics"
            FROM 
                "event_log"
            WHERE 
                "contract_account" = $1
            LIMIT
                10
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
                data: data.rows,
                code: 200,
                success: true,
                message: "success"
            }
        } else {
            responseData = {
                data: {
                    "contract_account": queryVal.account,
                    "hash": "",
                    "mc_timestamp": "",
                    "amount": "",
                    "method": "",
                    "method_function": "",
                    "topics": ""
                },
                code: 200,
                success: true,
                message: "success"
            }
        }
    }
    res.json(responseData);
})
//获取合约代码
router.get("/get_contract_code", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//account

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
//************************** 账号详情 结束

//************************** 交易详情页 开始
//获取交易HAX对应的信息 简单信息
router.get("/get_transaction_short", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryTransaction = req.query.transaction;// TODO 验证格式
    let tableName = '';
    let tableCol = ''
    let typeValue = 0;
    if (queryTransaction.length !== 64) {
        responseData = {
            transaction: {
                "hash": queryTransaction,
                "from": "",
                "to": "",
                "amount": "0",
                "data": "",
                "exec_timestamp": "1534146836",
                "status": "0",
                "is_stable": "0"
            },
            code: 500,
            success: false,
            message: "hash is not validated"
        }
        res.json(responseData);
    }
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
    typeValue = type.rows[0].type;

    if (typeValue === '0') {
        tableName = 'trans_genesis';
        tableCol = '"hash","type","from","previous","exec_timestamp","work","signature","level","is_stable","stable_index","status","mci","mc_timestamp","stable_timestamp","to","amount","data","data_hash"';
    } else if (typeValue === '1') {
        tableName = 'trans_witness';
        tableCol = '"hash","type","from","previous","exec_timestamp","work","signature","level","is_stable","stable_index","status","mci","mc_timestamp","stable_timestamp","last_stable_block","last_summary_block","last_summary","is_free","witnessed_level","best_parent","is_on_mc"';
    } else {
        tableName = 'trans_normal'
        tableCol = '"hash","type","from","previous","exec_timestamp","work","signature","level","is_stable","stable_index","status","mci","mc_timestamp","stable_timestamp","to","amount","data","data_hash","gas","gas_used","gas_price","contract_address","log","log_bloom"';
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

    if (data.code) {
        responseData = {
            transaction: {
                "hash": queryTransaction,
                "from": "",
                "to": "",
                "amount": "0",
                "data": "",
                "exec_timestamp": "1534146836",
                "status": "0",
                "is_stable": "0"
            },
            code: 500,
            success: false,
            message: "select items from transaction error"
        }
    } else {
        transaction = data.rows[0];
        responseData = {
            transaction: transaction,
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

    //TODO 少选点信息
    let opt = {
        text: `
            Select 
                "hash","type","from","previous","exec_timestamp","work","signature","level","is_stable",
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
                "exec_timestamp": "1534146836",
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

    var searchParameter = req.query;
    /*
        parameters={
            direction:"",
            is_free:"",
            exec_timestamp:"",
            level:"",
            pkid:"",
            is_prototype:""
        }
    */
    var sqlOptions;

    // console.log(searchParameter);
    if (searchParameter.direction === 'down') {
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
            values: [searchParameter.stable_index]
        }
    } else if (searchParameter.direction === 'up') {

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
            values: [searchParameter.stable_index]
        }

    } else if ((searchParameter.direction === 'center') && searchParameter.active_unit) {
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
            values: [searchParameter.active_unit]
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
            values: [searchParameter.active_unit, centerHashInfo.stable_index]
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

    // console.log("\n\n\n\n\n")
    // console.log("data.rows")
    // console.log(data.rows)
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
                exec_timestamp,hash,"from","to",is_stable,"status",amount 
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
            message: 'select exec_timestamp,level,hash,"from","to",is_stable,"status",amount from trans_normal error'
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

    if (data.code) {
        responseData = {
            mci: {},
            code: 500,
            success: false,
            message: "get_mci FROM global Error"
        }
    } else {
        let mciObj = {};
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
    var queryType = req.query.type || '1';// ?type=1
    var queryStart = req.query.start;//end
    var multiple = queryType === '1' ? 1 : Number(queryType) / 10;
    if (multiple != 3 && multiple != 6 && multiple != 30) {
        multiple = 1
    }
    var limit = 300 * multiple;
    let sql = {};
    queryType = queryType === '1' ? '1' : '10';
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
        // let nowstamp = 1558414662;
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
            srvObj[item.timestamp] = Math.ceil(item.count / Number(queryType));
        });

        for (let i = 0; i < 300 * multiple; i += multiple) {
            cltObj[restleTimestamp - i] = 0;
        }
        timestamp.forEach((item, index) => {
            srvObj[item] = count[index];

        });
        Object.keys(cltObj).forEach((item) => {
            for (let i = 0; i < multiple; i++) {
                cltObj[item] += (srvObj[(item - i).toString()] || 0);
            }
        });
        Object.keys(cltObj).forEach((items, index) => {
            timestamp[index] = items;
            count[index] = cltObj[items];
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