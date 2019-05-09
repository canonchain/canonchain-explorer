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
                "exec_timestamp": item.exec_timestamp,
                "level": item.level,
                "pkid": Number(item.pkid),
                "is_on_main_chain": Number(item.is_on_mc),
                "is_stable": Number(item.is_stable),
                "is_minor": isMinor,
                "witness_from": item.from,
                "sequence": tempStatus
            }
            nodesTempAry.push(tempInfo);
        })
        return nodesTempAry;
    }
}

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
            count: Number(count.rows[0].count),//TODO 这么写有BUG  Cannot read property 'count' of undefined
            code: 200,
            success: true,
            message: "success"
        }
        res.json(responseData);
    }
})
//获取交易表中最近(LIMIT+1)项
router.get("/get_first_balance_flag", async function (req, res, next) {
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
            WHERE (
                (balance < 1732623775600000000000000000 ) or 
                ( balance < 1732623775600000000000000000 and acc_id < 1732623775600000000000000000)
            )
            ORDER BY
                balance desc,
                acc_id desc
            OFFSET 
                ${LIMIT_VAL}
            LIMIT 
                1
        `
    }

    PageUtility.timeLog(req, '[1] SELECT start_sql Before')
    let transStartInfo = await pgPromise.query(start_sql)
    PageUtility.timeLog(req, '[1] SELECT start_sql After')
    if (transStartInfo.code) {
        responseData = {
            item: errorInfo,
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
    } else {
        responseData = {
            item: transStartInfo.rows[0],
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

//获取想要获取分页的 balance 等信息
/**
 * 需要参数：
 * {
        "balance": "0",
        "acc_id": "0",
        "page": "1",//当前页 1
        "want_page":"3"//想要跳转的页面
    }
 * 
 */
router.get("/get_want_balance_flag", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;
    let errorInfo = {
        acc_id: "0000",
        balance: "000000",
    }

    let ascVal;
    let symbol_str;
    if (queryVal.direction === 'left') {
        symbol_str = ">";
        ascVal = "asc";
    } else {
        symbol_str = "<";
        ascVal = "desc";
    }
    let offsetNum = 20;

    let start_sql = {
        text: `
            Select 
                acc_id,balance
            FROM 
                accounts
            WHERE (
                (balance ${symbol_str} $1 ) or 
                ( balance = $1 and acc_id ${symbol_str} $2)
            )
            ORDER BY 
                balance ${ascVal},
                acc_id ${ascVal}
            offset
                ${offsetNum - 1}
            LIMIT
                1
        `,
        values: [Number(queryVal.balance), Number(queryVal.acc_id)]
    }

    PageUtility.timeLog(req, '[1] SELECT start_sql Before')
    let transStartInfo = await pgPromise.query(start_sql)
    PageUtility.timeLog(req, '[1] SELECT start_sql After')
    if (transStartInfo.code) {
        responseData = {
            data: errorInfo,
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
    } else {
        if (transStartInfo.rows.length) {
            responseData = {
                data: transStartInfo.rows[0],
                code: 200,
                success: true,
                message: "success"
            }
        } else {
            responseData = {
                data: {
                    acc_id: "-1",
                    balance: "-1",
                },
                code: 200,
                success: true,
                message: "success"
            }
        }

    }
    res.json(responseData);
})

//获取交易列表
router.get("/get_accounts", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//  wt=all 代表查找含有见证节点的交易列表

    let sql = {
        text: `
            Select 
                account,balance 
            FROM 
                accounts 
            WHERE (
                (balance > $1 ) or 
                (balance = $1 and acc_id > $2)
            )
            ORDER BY
                balance asc,
                acc_id asc
            LIMIT
                ${LIMIT_VAL}
        `,
        values: [queryVal.balance, queryVal.acc_id]
    };

    PageUtility.timeLog(req, '[1] SELECT transaction info Before')
    let data = await pgPromise.query(sql)
    PageUtility.timeLog(req, '[1] SELECT transaction info After')

    if (data.code) {
        responseData = {
            accounts: [],
            code: 500,
            success: false,
            message: 'Select trans list FROM transaction Error'
        }
        logger.info(data)
    } else {

        //查询成功
        // var basePage = Number(queryVal.page) - 1; // 1 2
        var accounts = data.rows.reverse();
        // var accounts = data.rows;
        accounts.forEach((element, index) => {
            //占比 element.balance / 1618033988 TODO 1132623791.6 这个值后期会修改
            element.proportion = ((element.balance / (1132623791.6 * 1000000000000000000)) * 100).toFixed(10) + " %";
            //并保留6位精度
            let tempVal = element.balance
            if (tempVal == 0) {
                element.balance = 0; //TODO Keep 6 decimal places
            } else {
                var reg = /(\d+(?:\.)?)(\d{0,6})/;
                var regAry = reg.exec(tempVal);
                var integer = regAry[1];
                var decimal = regAry[2];
                if (decimal) {
                    while (decimal.length < 6) {
                        decimal += "0";
                    }
                } else {
                    decimal = ".000000"
                }
                element.balance = integer + decimal; //TODO Keep 6 decimal places
            }
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
//参数：wt
router.get("/get_transactions_count", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    var wt = req.query.wt;// ?wt=all 代表查找含有见证节点的交易列表
    let sql = (wt == true) ?
        "SELECT value AS count FROM global WHERE key = 'transaction_count'" :
        "SELECT value AS count FROM global WHERE key = 'transaction_shown_count'";

    PageUtility.timeLog(req, '[1] SELECT transaction_count Before')
    let count = await pgPromise.query(sql)
    PageUtility.timeLog(req, '[1] SELECT transaction_count After')

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
            count: Number(count.rows[0].count),//TODO 这么写有BUG  Cannot read property 'count' of undefined
            code: 200,
            success: true,
            message: "success"
        }
        res.json(responseData);
    }
})

//获取交易表中最近(LIMIT+1)项
//参数：wt
router.get("/get_first_page_flag", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    var wt = req.query.wt;// ?wt=all 代表查找含有见证节点的交易列表
    let errorInfo = {
        "exec_timestamp": "0",
        "level": "0",
        "pkid": "0"
    }

    let shown = (wt == true) ? '' : ' and is_shown = true ';

    let start_sql = {
        text: `
            Select 
                "exec_timestamp","level","pkid"
            FROM 
                transaction 
            WHERE 
                (
                    (exec_timestamp < 9999999999 ) or 
                    (exec_timestamp = 9999999999 and level < 9999999999) or 
                    (exec_timestamp = 9999999999 and level = 9999999999 and pkid < 9999999999)
                ) ${shown} 
            order by 
                "exec_timestamp" desc, 
                "level" desc,
                "pkid" desc 
            offset 
                ${LIMIT_VAL}
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
    } else {
        responseData = {
            near_item: transStartInfo.rows[0],
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

//获取想要获取分页的pkid等信息
/**
 * 需要参数：
 * {
        "exec_timestamp": "0",
        "level": "0",
        "pkid": "0",
        "page": "1",//当前页 1
        "want_page":"3"//想要跳转的页面
    }
 * 
 */
router.get("/get_want_page_flag", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;
    var wt = queryVal.wt;// ?wt=all 代表查找含有见证节点的交易列表
    // var offsetPage = Number(queryVal.page) - Number(queryVal.want_page);
    let errorInfo = {
        "exec_timestamp": "0",
        "level": "0",
        "pkid": "0",
    }
    let shown = (wt == true) ? '' : ' and is_shown = true ';
    let ascVal;
    let symbol_str;
    if (queryVal.direction === 'left') {
        symbol_str = ">";
        ascVal = "asc";
    } else {
        symbol_str = "<";
        ascVal = "desc";
    }
    let offsetNum = 20;

    let start_sql;

    //union用来解决大数据时候，搜索慢的场景（desc < 查询的情况）

    if (symbol_str == "<") {
        //向右 点下一页
        start_sql = {
            text: `
            (
                Select 
                    "exec_timestamp","level","pkid"
                FROM 
                    transaction 
                WHERE 
                    (
                        (exec_timestamp = $1 and level < $2) or 
                        (exec_timestamp = $1 and level = $2 and pkid < $3)
                    ) ${shown} 
                order by 
                    "exec_timestamp" desc,
                    "level" desc,
                    "pkid" desc
                LIMIT
                    ${offsetNum}
            )
            union
            (
                Select 
                    "exec_timestamp","level","pkid"
                FROM 
                    transaction 
                WHERE 
                    (
                        (exec_timestamp < $1)
                    ) ${shown} 
                order by 
                    "exec_timestamp" desc,
                    "level" desc,
                    "pkid" desc
                LIMIT
                    ${offsetNum}
            )
            order by
                "exec_timestamp" desc,
                "level" desc,
                "pkid" desc
            offset
                ${offsetNum - 1}
            LIMIT
                1
            `,
            values: [Number(queryVal.exec_timestamp), Number(queryVal.level), Number(queryVal.pkid)]
        }


    } else {
        start_sql = {
            text: `
                Select 
                    "exec_timestamp","level","pkid"
                FROM 
                    transaction 
                WHERE 
                    (
                        (exec_timestamp ${symbol_str} $1) or 
                        (exec_timestamp = $1 and level ${symbol_str} $2) or 
                        (exec_timestamp = $1 and level = $2 and pkid ${symbol_str} $3)
                    ) ${shown} 
                order by 
                    "exec_timestamp" ${ascVal},
                    "level"  ${ascVal},
                    "pkid"  ${ascVal}
                offset
                    ${offsetNum - 1}
                LIMIT
                    1
            `,
            values: [Number(queryVal.exec_timestamp), Number(queryVal.level), Number(queryVal.pkid)]
        }
    }

    PageUtility.timeLog(req, '[1] SELECT start_sql Before')
    let transStartInfo = await pgPromise.query(start_sql)
    PageUtility.timeLog(req, '[1] SELECT start_sql After')

    if (transStartInfo.code) {
        responseData = {
            data: errorInfo,
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
    } else {
        if (transStartInfo.rows.length) {
            responseData = {
                data: transStartInfo.rows[0],
                code: 200,
                success: true,
                message: "success"
            }
        } else {
            responseData = {
                data: {
                    "exec_timestamp": 0,
                    "level": 0,
                    "pkid": 0
                },
                code: 200,
                success: true,
                message: "success"
            }
        }

    }

    res.json(responseData);
})

//获取交易列表
/**
 * 参数
{ 
    exec_timestamp: '1555893967',
    wt: '12',
    level: '232877',
    pkid: '822014828' ,
}
 */
router.get("/get_transactions", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//  wt=all 代表查找含有见证节点的交易列表

    //如果有wt，则查询含见证节点的交易
    let shown = (queryVal.wt == true) ? '' : ' and is_shown = true ';

    let opt2 = {
        text: `
            Select 
                "exec_timestamp","level","pkid","hash","from","to","is_stable","status","amount"
            FROM 
                transaction 
            WHERE 
                (
                    (exec_timestamp > $1) or 
                    (exec_timestamp = $1 and level > $2) or 
                    (exec_timestamp = $1 and level = $2 and pkid > $3)
                ) ${shown} 
            order by 
                "exec_timestamp" asc, 
                "level" asc,
                "pkid" asc 
            LIMIT
                $4
        `,
        values: [Number(queryVal.exec_timestamp), Number(queryVal.level), Number(queryVal.pkid), LIMIT_VAL]
    };

    PageUtility.timeLog(req, '[1] SELECT transaction info Before')
    let data = await pgPromise.query(opt2)
    PageUtility.timeLog(req, '[1] SELECT transaction info After')
    if (data.code) {
        responseData = {
            transactions: [],
            code: 500,
            success: false,
            message: 'Select trans list FROM transaction Error'
        }
        logger.info(data)
    } else {
        responseData = {
            transactions: data.rows.reverse(),
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
    PageUtility.timeLog(req, 'start')
    var queryAccount = req.query.account;// ?account=2

    let opt = {
        text: `
            Select 
                "account","balance","transaction_count"
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
                    "transaction_count": 0
                },
                code: 200,
                success: true,
                message: "success"
            }
        }
    }
    res.json(responseData);
})
//获取账号的交易列表
router.get("/get_account_list", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    var queryInfo = req.query;
    var queryAccount = queryInfo.account;// ?account=2
    var queryPage = queryInfo.page;// ?page=2

    var OFFSETVAL;//前面忽略的条数
    OFFSETVAL = (queryPage - 1) * LIMIT_VAL || 0;

    //TODO 这里需要优化，太慢了
    // console.log(queryAccount, LIMIT_VAL, OFFSETVAL);
    let opt2 = {
        text: `
            Select 
                exec_timestamp,level,hash,"from","to",is_stable,"status",amount,mci 
            FROM
                transaction 
            WHERE 
                "from" = $1 OR "to"=$1
            order by 
                exec_timestamp desc, 
                level desc,
                pkid desc 
            LIMIT 
                $2 
            OFFSET 
                $3
        `,
        values: [queryAccount, LIMIT_VAL, OFFSETVAL]
    }

    PageUtility.timeLog(req, '[1] SELECT transaction info Before')
    let data = await pgPromise.query(opt2)
    PageUtility.timeLog(req, '[1] SELECT transaction info After')

    responseData = {
        tx_list: data.rows,
        page: Number(queryPage),
        code: 200,
        success: true,
        message: "success"
    }
    //是否从此帐号发出
    responseData.tx_list.forEach(item => {
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
    res.json(responseData);
})
// --------------------- 测试

//获取交易表中最近(LIMIT+1)项
//参数： account
router.get("/get_account_first_flag", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    var queryInfo = req.query;
    var queryAccount = queryInfo.account;// ?account=2
    var querySour = "";
    if (queryInfo.source === '1') {
        querySour = "from";
    } else if (queryInfo.source === '2') {
        querySour = "to";
    } else {
        querySour = "from";
    }

    let errorInfo = {
        "exec_timestamp": "0",
        "level": "0",
        "pkid": "0"
    }

    let start_sql = {
        text: `
            Select 
                "exec_timestamp","level","pkid"
            FROM 
                transaction 
            WHERE 
                (
                    (exec_timestamp < 9999999999 ) or 
                    (exec_timestamp = 9999999999 and level < 9999999999) or 
                    (exec_timestamp = 9999999999 and level = 9999999999 and pkid < 9999999999)
                ) 
                and 
                ("${querySour}" = $1)
            order by 
                "exec_timestamp" desc, 
                "level" desc,
                "pkid" desc 
            offset 
                ${LIMIT_VAL}
            LIMIT
                1
        `,
        values: [queryAccount]
    }

    console.log(start_sql);
    PageUtility.timeLog(req, '[1] SELECT start_sql Before')
    let transStartInfo = await pgPromise.query(start_sql)
    PageUtility.timeLog(req, '[1] SELECT start_sql After')

    console.log(transStartInfo.rows);
    if (transStartInfo.code) {
        responseData = {
            near_item: errorInfo,
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
    } else {
        responseData = {
            near_item: transStartInfo.rows[0] || errorInfo,
            code: 200,
            success: true,
            message: "success"
        }
    }
    res.json(responseData);
})

//获取想要获取分页的pkid等信息
/**
 * 需要参数：
 * {
        "exec_timestamp": "0",
        "level": "0",
        "pkid": "0",
        "account": "1"
    }
 *
 */
router.get("/get_account_want_flag", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;
    var queryAccount = queryVal.account;// ?account=2
    var querySour = "";
    if (queryVal.source === '1') {
        querySour = "from";
    } else if (queryVal.source === '2') {
        querySour = "to";
    } else {
        querySour = "from";
    }

    let errorInfo = {
        "exec_timestamp": "0",
        "level": "0",
        "pkid": "0",
    }

    let ascVal;
    let symbol_str;
    if (queryVal.direction === 'left') {
        symbol_str = ">";
        ascVal = "asc";
    } else {
        symbol_str = "<";
        ascVal = "desc";
    }
    let offsetNum = 20;

    let start_sql;

    //union用来解决大数据时候，搜索慢的场景（desc < 查询的情况）

    if (symbol_str == "<") {
        //向右 点下一页
        start_sql = {
            text: `
            (
                Select 
                    "exec_timestamp","level","pkid"
                FROM 
                    transaction 
                WHERE 
                    (
                        (exec_timestamp = $1 and level < $2) or 
                        (exec_timestamp = $1 and level = $2 and pkid < $3)
                    ) 
                    and 
                    ("${querySour}" = $4)
                order by 
                    "exec_timestamp" desc,
                    "level" desc,
                    "pkid" desc
                LIMIT
                    ${offsetNum}
            )
            union
            (
                Select 
                    "exec_timestamp","level","pkid"
                FROM 
                    transaction 
                WHERE 
                    (
                        (exec_timestamp < $1)
                    ) 
                    and 
                    ("from" = $4)
                order by 
                    "exec_timestamp" desc,
                    "level" desc,
                    "pkid" desc
                LIMIT
                    ${offsetNum}
            )
            order by
                "exec_timestamp" desc,
                "level" desc,
                "pkid" desc
            offset
                ${offsetNum - 1}
            LIMIT
                1
            `,
            values: [Number(queryVal.exec_timestamp), Number(queryVal.level), Number(queryVal.pkid), queryAccount]
        }


    } else {
        start_sql = {
            text: `
                Select 
                    "exec_timestamp","level","pkid"
                FROM 
                    transaction 
                WHERE 
                    (
                        (exec_timestamp ${symbol_str} $1) or 
                        (exec_timestamp = $1 and level ${symbol_str} $2) or 
                        (exec_timestamp = $1 and level = $2 and pkid ${symbol_str} $3)
                    ) 
                    and 
                    ("${querySour}" = $4)
                order by 
                    "exec_timestamp" ${ascVal},
                    "level"  ${ascVal},
                    "pkid"  ${ascVal}
                offset
                    ${offsetNum - 1}
                LIMIT
                    1
            `,
            values: [Number(queryVal.exec_timestamp), Number(queryVal.level), Number(queryVal.pkid), queryAccount]
        }
    }

    PageUtility.timeLog(req, '[1] SELECT start_sql Before')
    let transStartInfo = await pgPromise.query(start_sql)
    PageUtility.timeLog(req, '[1] SELECT start_sql After')

    if (transStartInfo.code) {
        responseData = {
            data: errorInfo,
            code: 500,
            success: false,
            message: "select start_sql Error"
        }
    } else {
        if (transStartInfo.rows.length) {
            responseData = {
                data: transStartInfo.rows[0],
                code: 200,
                success: true,
                message: "success"
            }
        } else {
            responseData = {
                data: {
                    "exec_timestamp": 0,
                    "level": 0,
                    "pkid": 0
                },
                code: 200,
                success: true,
                message: "success"
            }
        }

    }

    res.json(responseData);
})

//获取交易列表
/**
 * 参数
{
    exec_timestamp: '1555893967',
    level: '232877',
    pkid: '822014828' ,
    account: '12',
}
 */
router.get("/get_account_transactions", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')
    let queryVal = req.query;//  wt=all 代表查找含有见证节点的交易列表
    var queryAccount = queryVal.account;// ?account=2
    var querySour = "";
    if (queryVal.source === '1') {
        querySour = "from";
    } else if (queryVal.source === '2') {
        querySour = "to";
    } else {
        querySour = "from";
    }


    let opt2 = {
        text: `
            Select 
                "exec_timestamp","level","pkid","hash","from","to","is_stable","status","amount"
            FROM 
                transaction 
            WHERE 
                (
                    (exec_timestamp > $1) or 
                    (exec_timestamp = $1 and level > $2) or 
                    (exec_timestamp = $1 and level = $2 and pkid > $3)
                )  
                and 
                ("${querySour}" = $5)
            order by 
                "exec_timestamp" asc, 
                "level" asc,
                "pkid" asc 
            LIMIT
                $4
        `,
        values: [Number(queryVal.exec_timestamp), Number(queryVal.level), Number(queryVal.pkid), LIMIT_VAL, queryAccount]
    };

    console.log(queryVal)
    console.log(opt2)
    PageUtility.timeLog(req, '[1] SELECT transaction info Before')
    let data = await pgPromise.query(opt2)
    PageUtility.timeLog(req, '[1] SELECT transaction info After')
    if (data.code) {
        responseData = {
            transactions: [],
            code: 500,
            success: false,
            message: 'Select trans list FROM transaction Error'
        }
        logger.info(data)
    } else {
        responseData = {
            transactions: data.rows.reverse(),
            code: 200,
            success: true,
            message: "success"
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
    if (queryTransaction.length !== 64) {
        responseData = {
            transaction: {
                "hash": queryTransaction,
                "from": "-",
                "to": "-",
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

    //TODO 少选点信息
    let opt = {
        text: `
            Select 
                "hash","from","to","amount","data","exec_timestamp","status","is_stable"
            FROM 
                transaction  
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
                "from": "-",
                "to": "-",
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
                pkid,hash,"type","from","to",amount,previous,witness_list_block,last_summary,last_summary_block,data,exec_timestamp,
                signature,is_free,level,witnessed_level,best_parent,is_stable,"status",is_on_mc,mci,latest_included_mci,mc_timestamp,stable_timestamp 
            FROM 
                transaction  
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
                "pkid": "-",
                "hash": "-",
                "type": "-",
                "from": "-",
                "to": "-",
                "amount": "0",
                "previous": "-",
                "witness_list_block": "-",
                "last_summary": "-",
                "last_summary_block": "-",
                "data": "",
                "exec_timestamp": "1534146836",
                "signature": "-",
                "is_free": false,
                "level": "0",
                "witnessed_level": "0",
                "best_parent": "-",
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
            message: "select items from transaction error"
        }
        res.json(responseData);
    } else {
        transaction = data.rows[0];
        // let currentHash = data.rows[0].hash;
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
    } else {
        transaction.parents = result.rows;
        transaction.witness_list = [];
    }


    //witness_list_block
    if (transaction.witness_list_block !== '0000000000000000000000000000000000000000000000000000000000000000') {
        responseData = {
            transaction: transaction,
            code: 200,
            success: true,
            message: "success"
        }
        res.json(responseData);
    }

    let optWitness = {
        text: `
            Select 
                item,account 
            FROM 
                witness 
            WHERE 
                item = $1 
            ORDER BY 
                witness_id DESC
        `,
        values: [queryTransaction]
    }

    PageUtility.timeLog(req, '[3] SELECT witness info Before')
    let witnessResult = await pgPromise.query(optWitness);
    PageUtility.timeLog(req, '[3] SELECT witness info After')

    if (result.code) {
        responseData = {
            transaction: transaction,
            code: 500,
            success: false,
            message: "select items from witness error"
        }
        res.json(responseData);
    } else {
        let witnessAry = [];
        witnessResult.rows.forEach(currentItem => {
            witnessAry.push(currentItem.account);
        })
        transaction.witness_list = witnessAry;
        responseData = {
            transaction: transaction,
            code: 200,
            success: true,
            message: "success"
        }
        res.json(responseData);
    }


})
//获取以前的unit
router.get("/get_previous_units", async function (req, res, next) {
    PageUtility.timeLog(req, 'start')

    //下一个
    //is_free exec_timestamp
    //is_free exec_timestamp level    
    //is_free exec_timestamp level    pkid
    /* 

        (is_free < 1) 
        or 
        (is_free = 1 and exec_timestamp < xxx)    
        or 
        (is_free = 1 and exec_timestamp = xxx and level < yyy)
        or 
        (is_free = 1 and exec_timestamp = xxx and level = yyy and pkid < zzz)
    */

    //上一个
    /* 
        (is_free > 1) 
    or 
       (is_free = 1 and exec_timestamp > xxx)    
    or 
       (is_free = 1 and exec_timestamp = xxx and level > yyy)
    or 
       (is_free = 1 and exec_timestamp = xxx and level = yyy and pkid > zzz)
    */

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


    let filterFirstUnitSql = ' WHERE type = 1 ';
    let filterOtherUnitSql = ' and (type = 1 ) ';

    if (searchParameter.direction === 'down') {
        sqlOptions = {
            text: `
                Select 
                    hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent 
                FROM 
                    transaction 
                WHERE 
                    (
                        (exec_timestamp < $1) or 
                        (exec_timestamp = $1 and level < $2) or 
                        (exec_timestamp = $1 and level = $2 and pkid < $3)
                    ) ${filterOtherUnitSql} 
                order by 
                    exec_timestamp desc, level desc, pkid desc 
                limit 
                    100`,
            values: [searchParameter.exec_timestamp, searchParameter.level, searchParameter.pkid]
        }
    } else if (searchParameter.direction === 'up') {

        sqlOptions = {
            text: `
                Select 
                    hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent 
                FROM 
                    transaction 
                WHERE 
                    (
                        (exec_timestamp > $1) or 
                        (exec_timestamp = $1 and level > $2) or 
                        (exec_timestamp = $1 and level = $2 and pkid > $3)
                    ) ${filterOtherUnitSql} 
                order by 
                    exec_timestamp desc, level desc, pkid desc 
                limit 
                    100
            `,
            values: [searchParameter.exec_timestamp, searchParameter.level, searchParameter.pkid]
        }

    } else if ((searchParameter.direction === 'center') && searchParameter.active_unit) {
        let sql = {
            text: `
                select 
                    exec_timestamp , level ,pkid
                from 
                    transaction 
                where
                    hash = $1
                limit 
                    1
            `,
            values: [searchParameter.active_unit]
        };
        PageUtility.timeLog(req, '[0] SELECT center exec_timestamp Before')
        let hashData = await pgPromise.query(sql)
        logger.info(`hashData.rows:`)
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
        PageUtility.timeLog(req, '[0] SELECT center exec_timestamp Afer')
        sqlOptions = {
            text: `
            (
                Select 
                    hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent
                FROM 
                    transaction 
                WHERE 
                    (
                        (exec_timestamp > $2) or 
                        (exec_timestamp = $2 and level > $3) or 
                        (exec_timestamp = $2 and level = $3 and pkid > $4 )
                    ) ${filterOtherUnitSql}
                order by 
                    exec_timestamp desc, level desc,pkid desc 
                limit 
                    49
            )
            UNION
            (
                select 
                    hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent
                from 
                    transaction 
                where 
                    hash = $1 
                limit 
                    1
            )
            UNION 
            (
                Select 
                    hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent
                FROM 
                    transaction 
                WHERE 
                    (
                        (exec_timestamp < $2) or
                        (exec_timestamp = $2 and level < $3) or 
                        (exec_timestamp = $2 and level = $3 and pkid < $4)
                    ) ${filterOtherUnitSql} 
                order by 
                    exec_timestamp desc, level desc, pkid desc
                limit
                    50
            )
            order by 
                exec_timestamp desc, level desc, pkid desc
            `,
            values: [searchParameter.active_unit, centerHashInfo.exec_timestamp, centerHashInfo.level, centerHashInfo.pkid]
        }
    } else {
        sqlOptions = `
            Select
                hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent
            FROM transaction
                ${filterFirstUnitSql}
            order by
                exec_timestamp desc,
                level desc,
                pkid desc
            limit
                100
        `;
    }


    PageUtility.timeLog(req, '[1] SELECT transaction list Before')
    let data = await pgPromise.query(sqlOptions)
    PageUtility.timeLog(req, '[1] SELECT transaction list Afer')

    if (data.code) {
        responseData = {
            units: {
                nodes: [],
                edges: {}
            },
            code: 500,
            success: false,
            message: "select xxx,xxx from transaction error"
        }
        res.json(responseData);
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
                exec_timestamp,level,hash,"from","to",is_stable,"status",amount 
            FROM 
                transaction 
            where 
                is_shown = true 
            order by 
                exec_timestamp desc, 
                level desc,
                pkid desc 
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
            message: 'select exec_timestamp,level,hash,"from","to",is_stable,"status",amount from transaction error'
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

    var queryType = req.query.type;// ?type=1
    var queryStart = req.query.start;//end

    let sql = {};
    if (queryStart) {
        var restleTimestamp = queryType === '10' ? Math.ceil(Number(queryStart) / 10) : queryStart;
        sql.text = `
            Select 
                timestamp,count
            FROM 
                timestamp 
            WHERE 
                type = $1 and 
                timestamp <= $2 
            ORDER BY 
                timestamp DESC 
            limit 
                600
        `;
        sql.values = [queryType, restleTimestamp];
    } else {
        sql.text = `
            Select 
                timestamp,count 
            FROM
                timestamp 
            WHERE
                type = $1 
            ORDER BY
                timestamp DESC 
            limit
                600
        `;
        sql.values = [queryType];
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
            timestamp.unshift(item.timestamp)
            count.unshift(Math.ceil(item.count / Number(queryType)));
        })
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