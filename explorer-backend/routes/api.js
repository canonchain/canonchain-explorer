var express = require("express");
var router = express.Router();
var responseTime = require("./response-time");

var pgclient = require('../database/PG-pool').default;// 引用上述文件
pgclient.getConnection();

//写日志
let log4js = require('../database/log_config');
let logger = log4js.getLogger('read_db');//此处使用category的值

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

var formatUnits = function (unitsAry) {
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
};

var isBastParent = function (parentItem, unitsAry) {
    var isBase;
    unitsAry.forEach(item => {
        if (parentItem.item == item.hash) {
            isBase = (parentItem.parent == item.best_parent) ? true : false;
        }
    })
    return isBase;
}

// http://localhost:3000/api/get_accounts
// 获取账号列表
router.get("/get_accounts", function (req, res, next) {
    logger.info(`/get_accounts start: ${Date.now() - req._startTime}`)
    var queryPage = req.query.page;// ?page=2
    var page, //当前页数
        pages, // 合计总页数
        count; //总条数

    var OFFSETVAL;//前面忽略的条数
    var LIMITVAL = 20;//每页显示条数
    if (typeof Number(queryPage) !== "number") {
        page = 1;
    } else {
        page = Number(queryPage) || 1;
    }
    logger.info(`/get_accounts before SQL-1 COUNT(1) accounts: ${Date.now() - req._startTime}`)
    // pgclient.query("Select COUNT(1) FROM accounts", (count) => {
    pgclient.query("SELECT value AS count FROM global WHERE key = 'accounts_count'", (count) => {
        logger.info(`/get_accounts after SQL-1 COUNT(1) accounts: ${Date.now() - req._startTime}`)
        let typeCountVal = Object.prototype.toString.call(count);
        if (typeCountVal === '[object Error]') {
            responseData = {
                accounts: [],
                page: 1,
                count: 0,
                code: 500,
                success: false,
                message: "count accounts Error"
            }
            res.json(responseData);
        } else {
            count = Number(count[0].count);//TODO 这么写有BUG  Cannot read property 'count' of undefined
            pages = Math.ceil(count / LIMITVAL);
            //paga 不大于 pages
            page = Math.min(pages, page);
            //page 不小于 1
            page = Math.max(page, 1);
            OFFSETVAL = (page - 1) * LIMITVAL;
            // *,balance/sum(balance)
            logger.info(`/get_accounts before SQL-2: ${Date.now() - req._startTime}`)
            pgclient.query("Select account,balance FROM accounts ORDER BY balance DESC LIMIT $1 OFFSET $2", [LIMITVAL, OFFSETVAL], (data) => {
                logger.info(`/get_accounts after SQL-2: ${Date.now() - req._startTime}`)
                //改造数据 排名 , 金额，占比
                let typeVal = Object.prototype.toString.call(data);
                if (typeVal === '[object Error]') {
                    responseData = {
                        accounts: [],
                        page: 1,
                        count: 0,
                        code: 404,
                        success: false,
                        message: "no account found"
                    }
                } else {
                    var basePage = Number(queryPage) - 1; // 1 2
                    var accounts = data;
                    accounts.forEach((element, index) => {
                        //占比 element.balance / 1618033988 TODO 1132623791.6 这个值后期会修改
                        element.proportion = ((element.balance / (1132623791.6 * 1000000000000000000)) * 100).toFixed(10) + " %";
                        //并保留6位精度
                        let tempVal = element.balance
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
                        element.rank = LIMITVAL * basePage + (index + 1);
                    });
                    responseData = {
                        accounts: accounts,
                        page: Number(queryPage),
                        count: Number(count),
                        code: 200,
                        success: true,
                        message: "success"
                    }
                }
                res.json(responseData);
            });
        }
    });
})

//获取账号信息
router.get("/get_account", function (req, res, next) {
    logger.info(`/get_account start: ${Date.now() - req._startTime}`)
    var queryAccount = req.query.account;// ?account=2
    logger.info(`/get_account before SQL-1: ${Date.now() - req._startTime}`)
    pgclient.query("Select account,balance FROM accounts  WHERE account = $1", [queryAccount], (data) => {
        logger.info(`/get_account after SQL-1: ${Date.now() - req._startTime}`)
        let typeVal = Object.prototype.toString.call(data);
        if (typeVal === '[object Error]') {
            responseData = {
                account: {},
                code: 500,
                success: false,
                message: "Select account,balance FROM accounts Error"
            }
        } else {
            if (data.length === 1) {
                responseData = {
                    account: data[0],
                    code: 200,
                    success: true,
                    message: "success"
                }
            } else {
                responseData = {
                    account: {},
                    code: 404,
                    success: false,
                    message: "no account found"
                }
            }
        }
        res.json(responseData);
    });
})
// Select COUNT(1) FROM transaction WHERE "from" = $1 OR "to"=$1 ORDER BY xxxx  , 

//获取账号的交易列表
router.get("/get_account_list", function (req, res, next) {
    logger.info(`/get_account_list start: ${Date.now() - req._startTime}`)
    var queryAccount = req.query.account;// ?account=2
    var queryPage = req.query.page;// ?page=2
    var page, //当前页数
        pages, // 合计总页数
        count; //总条数

    var OFFSETVAL;//前面忽略的条数
    var LIMITVAL = 20;//每页显示条数
    if (typeof Number(queryPage) !== "number") {
        page = 1;
    } else {
        page = Number(queryPage) || 1;
    }
    logger.info(`/get_account_list before SQL-1: ${Date.now() - req._startTime}`)
    // pgclient.query('Select COUNT(1) FROM transaction WHERE "from" = $1 OR "to"=$1', [queryAccount], (count) => {
    pgclient.query('SELECT transaction_count AS count FROM accounts WHERE account = $1', [queryAccount], (count) => {
        logger.info(`/get_account_list after SQL-1: ${Date.now() - req._startTime}`)
        let typeCountVal = Object.prototype.toString.call(count);
        if (typeCountVal === '[object Error]') {
            responseData = {
                count: 0,
                tx_list: [],
                code: 500,
                success: false,
                message: "count account Error"
            }
            res.json(responseData);
        } else {
            count = Number(count[0].count);
            if (count === 0) {
                responseData = {
                    count: 0,
                    tx_list: [],
                    code: 404,
                    success: false,
                    message: "account no found"
                }
                res.json(responseData);
            } else {
                pages = Math.ceil(count / LIMITVAL);
                //paga 不大于 pages
                page = Math.min(pages, page);
                //page 不小于 1
                page = Math.max(page, 1);
                OFFSETVAL = (page - 1) * LIMITVAL;
                // *,balance/sum(balance)
                logger.info(`/get_account_list before SQL-2: ${Date.now() - req._startTime}`)
                pgclient.query('Select exec_timestamp,level,hash,"from","to",is_stable,"status",amount,mci FROM transaction WHERE "from" = $1 OR "to"=$1 order by exec_timestamp desc, level desc,pkid desc LIMIT $2 OFFSET $3', [queryAccount, LIMITVAL, OFFSETVAL], (data) => {
                    logger.info(`/get_account_list after SQL-2: ${Date.now() - req._startTime}`)
                    let typeVal = Object.prototype.toString.call(data);
                    if (typeVal === '[object Error]') {
                        responseData = {
                            tx_list: [],
                            page: 1,
                            count: 0,
                            code: 500,
                            success: false,
                            message: 'Select exec_timestamp,level,hash,from,to,is_stable,"status",amount,mci FROM transaction Error'
                        }
                        res.json(responseData);
                    } else {
                        responseData = {
                            tx_list: data,
                            page: Number(queryPage),
                            count: Number(count),
                            code: 0,
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
                    }
                });
            }
        }
    });
})

//获取交易列表 TODO 切换查询，避免攻击
router.get("/get_transactions", function (req, res, next) {
    logger.info(`/get_transactions start: ${Date.now() - req._startTime}`)
    var queryPage = req.query.page;// ?page=2
    var wt = req.query.wt;// ?page=2
    var filterVal = '';
    let sql;
    if (!wt) {
        // filterVal = ' WHERE "from" != "to" or is_stable = true or amount != 0 '
        // sql = 'Select COUNT(1) FROM transaction WHERE "from" != "to" or is_stable = true or amount != 0'
        sql = "SELECT value AS count FROM global WHERE key = 'transaction_shown_count'"
    }else{
        sql = "SELECT value AS count FROM global WHERE key = 'transaction_count'"
    }
    var page, //当前页数
        pages, // 合计总页数
        count; //总条数

    var OFFSETVAL;//前面忽略的条数
    var LIMITVAL = 20;//每页显示条数
    if (typeof Number(queryPage) !== "number") {
        page = 1;
    } else {
        page = Number(queryPage) || 1;
    }

    logger.info(`/get_transactions before SQL-1 COUNT(1) transaction: ${Date.now() - req._startTime}`)
    pgclient.query(sql, (count) => {
        logger.info(`/get_transactions after SQL-1 COUNT(1) transaction: ${Date.now() - req._startTime}`)
        let typeCountVal = Object.prototype.toString.call(count);
        if (typeCountVal === '[object Error]') {
            responseData = {
                count: 0,
                page: 1,
                transactions: [],
                code: 500,
                success: false,
                message: "count transaction Error"
            }
            res.json(responseData);
        } else {
            count = Number(count[0].count);//TODO 这么写有BUG  Cannot read property 'count' of undefined
            if (count === 0) {
                responseData = {
                    count: 0,
                    page: 1,
                    transactions: [],
                    code: 404,
                    success: false,
                    message: "transaction no found"
                }
                res.json(responseData);
            } else {
                pages = Math.ceil(count / LIMITVAL);
                //paga 不大于 pages
                page = Math.min(pages, page);
                //page 不小于 1
                page = Math.max(page, 1);
                OFFSETVAL = (page - 1) * LIMITVAL;
                // *,balance/sum(balance)
                logger.info(`/get_transactions before SQL-2: ${Date.now() - req._startTime}`)
                pgclient.query('Select exec_timestamp,mc_timestamp,stable_timestamp,level,hash,"type","from","to",is_stable,"status",amount FROM transaction ' + filterVal + ' order by exec_timestamp desc, level desc,pkid desc LIMIT $1  OFFSET $2', [LIMITVAL, OFFSETVAL], (data) => {
                    logger.info(`/get_transactions after SQL-2: ${Date.now() - req._startTime}`)
                    let typeVal = Object.prototype.toString.call(data);
                    if (typeVal === '[object Error]') {
                        responseData = {
                            count: 0,
                            page: 1,
                            transactions: [],
                            code: 500,
                            success: false,
                            message: 'Select exec_timestamp,level,hash,"from","to",is_stable,"status",amount FROM transaction Error'
                        }
                    } else {
                        responseData = {
                            count: Number(count),
                            page: Number(queryPage),
                            transactions: data,
                            code: 200,
                            success: true,
                            message: "success"
                        }
                    }

                    res.json(responseData);
                });
            }
        }
    });
})

//获取最新的交易
router.get("/get_latest_transactions", function (req, res, next) {
    logger.info(`/get_latest_transactions start: ${Date.now() - req._startTime}`)
    // TODO optimize
    // pgclient.query('Select exec_timestamp,level,hash,"from","to",is_stable,"status",amount FROM transaction where "from" != "to" or is_stable = true or amount != 0 order by exec_timestamp desc, level desc,pkid desc LIMIT 10', (data) => {
    pgclient.query('Select exec_timestamp,level,hash,"from","to",is_stable,"status",amount FROM transaction where is_shown = true order by exec_timestamp desc, level desc,pkid desc LIMIT 10', (data) => {
        logger.info(`/get_latest_transactions after SQL-1: ${Date.now() - req._startTime}`)
        let typeVal = Object.prototype.toString.call(data);
        if (typeVal === '[object Error]') {
            responseData = {
                transactions: [],
                code: 500,
                success: false,
                message: 'select exec_timestamp,level,hash,"from","to",is_stable,"status",amount from transaction error'
            }
        } else {
            responseData = {
                transactions: data,
                code: 200,
                success: true,
                message: "success"
            }
        }
        res.json(responseData);
    });
})

//获取交易号信息
router.get("/get_transaction", function (req, res, next) {
    logger.info(`/get_transaction before SQL-1: ${Date.now() - req._startTime}`)
    var queryTransaction = req.query.transaction;// ?account=2
    pgclient.query('Select pkid,hash,"type","from","to",amount,previous,witness_list_block,last_summary,last_summary_block,data,exec_timestamp,signature,is_free,level,witnessed_level,best_parent,is_stable,"status",is_on_mc,mci,latest_included_mci,mc_timestamp,stable_timestamp FROM transaction  WHERE hash = $1', [queryTransaction], (data) => {
        logger.info(`/get_transaction after SQL-1: ${Date.now() - req._startTime}`)
        let typeVal = Object.prototype.toString.call(data);
        if (typeVal === '[object Error]') {
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
            if (data.length === 0) {
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
                        "exec_timestamp": "0",
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
                    code: 404,
                    success: false,
                    message: "select items from transaction no found"
                }
                res.json(responseData);
            } else {
                let currentHash = data[0].hash;
                logger.info(`/get_transaction before SQL-2: ${Date.now() - req._startTime}`)
                pgclient.query("Select item,parent FROM parents WHERE item = $1 ORDER BY parents_id DESC", [currentHash], function (result) {
                    logger.info(`/get_transaction after SQL-2: ${Date.now() - req._startTime}`)
                    let resultTypeVal = Object.prototype.toString.call(result);
                    if (resultTypeVal === '[object Error]') {
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
                                "exec_timestamp": "0",
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
                            message: "select items from parents error"
                        }
                        res.json(responseData);
                    } else {
                        let transaction = data[0];
                        transaction.parents = result;
                        transaction.witness_list = [];

                        //witness_list_block
                        if (transaction.witness_list_block !== '0000000000000000000000000000000000000000000000000000000000000000') {
                            responseData = {
                                transaction: transaction,
                                code: 200,
                                success: true,
                                message: "success"
                            }
                            res.json(responseData);
                        } else {
                            logger.info(`/get_transaction before SQL-3: ${Date.now() - req._startTime}`)
                            pgclient.query("Select item,account FROM witness WHERE item = $1 ORDER BY witness_id DESC", [currentHash], function (witnessResult) {
                                logger.info(`/get_transaction after SQL-3: ${Date.now() - req._startTime}`)
                                let witnessAry = [];
                                witnessResult.forEach(currentItem => {
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
                            });
                        }
                    }
                });
            }
        }
    });
})

//获取以前的unit
router.get("/get_previous_units", function (req, res, next) {
    logger.info(`/get_previous_units start: ${Date.now() - req._startTime}`)
    var sqlOptions;
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
    var searchParameter = req.query;

    let filterFirstUnitSql = ' WHERE type = 1 ';
    let filterOtherUnitSql = ' and (type = 1 ) ';
    let searchParentsSql = ' item,parent ';
    let searchItem = 'parent';

    // logger.info(searchParameter,filterFirstUnitSql,filterOtherUnitSql,searchParentsSql,searchItem);
    if (searchParameter.direction === 'down') {
        //下一个
        //PKID find row (isFREE / / / )  select * from transaction where hash = $1
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
        // TODO
        sqlOptions = {
            text: 'Select hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent FROM transaction WHERE ((is_free < $1) or (is_free = $1 and exec_timestamp < $2) or (is_free = $1 and exec_timestamp = $2 and level < $3) or (is_free = $1 and exec_timestamp = $2 and level = $3 and pkid < $4))' + filterOtherUnitSql + ' order by is_free desc , exec_timestamp desc, level desc,pkid desc limit 100',
            values: [searchParameter.is_free, searchParameter.exec_timestamp, searchParameter.level, searchParameter.pkid]
        }
    } else if (searchParameter.direction === 'up') {
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
        sqlOptions = {
            text: 'Select hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent FROM transaction WHERE ((is_free > $1) or (is_free = $1 and exec_timestamp > $2) or (is_free = $1 and exec_timestamp = $2 and level > $3) or (is_free = $1 and exec_timestamp = $2 and level = $3 and pkid > $4))' + filterOtherUnitSql + ' order by is_free desc , exec_timestamp desc, level desc,pkid desc limit 100',
            values: [searchParameter.is_free, searchParameter.exec_timestamp, searchParameter.level, searchParameter.pkid]
        }

    } else if ((searchParameter.direction === 'center') && searchParameter.active_unit) {
        sqlOptions = {
            text: '(Select hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent FROM transaction WHERE ((is_free >(select is_free from transaction where hash = $1 limit 1 )) or (is_free  = (select is_free from transaction where hash = $1 limit 1 ) and exec_timestamp > (select exec_timestamp from transaction where hash = $1 limit 1 )) or (is_free  = (select is_free from transaction where hash = $1 limit 1 ) and exec_timestamp = (select exec_timestamp from transaction where hash = $1 limit 1 ) and level > (select level from transaction where hash = $1 limit 1 )) or (is_free  = (select is_free from transaction where hash = $1 limit 1 ) and exec_timestamp = (select exec_timestamp from transaction where hash = $1 limit 1 ) and level = (select level from transaction where hash = $1 limit 1 ) and pkid > (select pkid from transaction where hash = $1 limit 1 )))' + filterOtherUnitSql + ' order by is_free desc, exec_timestamp desc, level desc,pkid desc limit 49) UNION (select hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent from transaction where hash = $1 limit 1) UNION (Select hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent FROM transaction WHERE ((is_free <(select is_free from transaction where hash = $1 limit 1 )) or (is_free  = (select is_free from transaction where hash = $1 limit 1 ) and exec_timestamp < (select exec_timestamp from transaction where hash = $1 limit 1 ) ) or (is_free  = (select is_free from transaction where hash = $1 limit 1 ) and exec_timestamp = (select exec_timestamp from transaction where hash = $1 limit 1 ) and level < (select level from transaction where hash = $1 limit 1 )) or (is_free  = (select is_free from transaction where hash = $1 limit 1 ) and exec_timestamp = (select exec_timestamp from transaction where hash = $1 limit 1 ) and level = (select level from transaction where hash = $1 limit 1 ) and pkid < (select pkid from transaction where hash = $1 limit 1 ))) ' + filterOtherUnitSql + ' order by is_free desc, exec_timestamp desc, level desc,pkid desc  limit 50) order by is_free desc , exec_timestamp desc, level desc,pkid desc',
            values: [searchParameter.active_unit]
        }
    } else {
        // sqlOptions = 'Select hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent FROM transaction ' + filterFirstUnitSql + ' order by is_free desc , exec_timestamp desc, level desc,pkid desc limit 100';
        sqlOptions = `
            Select 
                hash,pkid,level,exec_timestamp,is_free,is_stable,"status",is_on_mc,"from","to",amount ,best_parent 
            FROM transaction 
                ${filterFirstUnitSql}
            order by 
                is_free desc , 
                exec_timestamp desc, 
                level desc,
                pkid desc 
            limit 
                100
        `;
    }

    logger.info("搜索语句:",sqlOptions)
    logger.info(`/get_previous_units before SQL-1: ${Date.now() - req._startTime}`)
    pgclient.query(sqlOptions, (data) => {
        logger.info(`/get_previous_units after SQL-1: ${Date.now() - req._startTime}`)
        var tempEdges = {};
        //TODO catch
        let typeVal = Object.prototype.toString.call(data);
        if (typeVal === '[object Error]') {
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
        } else {

            if (data.length === 0) {
                responseData = {
                    units: {
                        nodes: [],
                        edges: {}
                    },
                    code: 200,
                    success: false,
                    message: "blocks is null"
                }
                res.json(responseData);
            } else {
                let dataAry = [];
                // let dataAryDiff = [];
                data.forEach(item => {
                    dataAry.push("'" + item.hash + "'");
                    // dataAryDiff.push(item.hash);
                })
                var dataAryStr = dataAry.join(",");

                // logger.info("Select "+searchParentsSql+" FROM parents WHERE item in (" + dataAryStr + ")");
                //"Select item,parent FROM parents WHERE item in (" + dataAryStr + ")" + " or parent in(" + dataAryStr + ")"
                logger.info(`/get_previous_units before SQL-2: ${Date.now() - req._startTime}`)
                pgclient.query("Select " + searchParentsSql + " FROM parents WHERE item in (" + dataAryStr + ")", (result) => {
                    logger.info(`/get_previous_units after SQL-2: ${Date.now() - req._startTime}`)
                    let resultTypeVal = Object.prototype.toString.call(result);
                    if (resultTypeVal === '[object Error]') {
                        responseData = {
                            units: {
                                nodes: [],
                                edges: {}
                            },
                            code: 500,
                            success: false,
                            message: "Select item,parent FROM parents error"
                        }
                        res.json(responseData);
                    } else {
                        //筛选parent数据，把不是 dataAryDiff 里的parent都移除
                        if (searchItem === 'prototype') {
                            result.forEach(resItem => {
                                let protyAry = resItem[searchItem].split(',');
                                protyAry.forEach(proItem => {
                                    tempEdges[resItem.item + '_' + proItem] = {
                                        "data": {
                                            "source": resItem.item,
                                            "target": proItem
                                        },
                                        "best_parent_unit": ''
                                    }
                                })
                            })
                        } else {
                            result.forEach(resItem => {
                                tempEdges[resItem.item + '_' + resItem[searchItem]] = {
                                    "data": {
                                        "source": resItem.item,
                                        "target": resItem[searchItem]
                                    },
                                    "best_parent_unit": isBastParent(resItem, data)
                                }
                            })
                        }
                        responseData = {
                            units: {
                                nodes: formatUnits(data),
                                edges: tempEdges
                            },
                            code: 200,
                            message: "success"
                        };
                        res.json(responseData);
                    }
                })
            }
        }
    });
});

/*
首页：mci、交易数量、TPS 
*/
//获取MCI
router.get("/get_mci", function (req, res, next) {
    logger.info(`/get_mci before SQL-1: ${Date.now() - req._startTime}`)
    pgclient.query("select key,value from global where key='last_mci' or key ='last_stable_mci'", (data) => {
        logger.info(`/get_mci after SQL-1: ${Date.now() - req._startTime}`)
        let typeVal = Object.prototype.toString.call(data);
        if (typeVal === '[object Error]') {
            responseData = {
                mci: {},
                code: 500,
                success: false,
                message: "get_mci FROM global Error"
            }
        } else {
            if (data.length === 2) {
                let mciObj = {};
                data.forEach(item => {
                    mciObj[item.key] = item.value;
                })
                responseData = {
                    mci: mciObj,
                    code: 200,
                    success: true,
                    message: "success"
                }
            } else {
                responseData = {
                    mci: {},
                    code: 404,
                    success: false,
                    message: "no global found"
                }
            }
        }
        res.json(responseData);
    });
})

//获取TPS
//获取账号信息
router.get("/get_timestamp", function (req, res, next) {
    logger.info(`/get_timestamp start: ${Date.now() - req._startTime}`)
    var queryType = req.query.type;// ?type=1
    var queryStart = req.query.start;//end
    var sqlStr;
    var sqlOpt = [];
    if (!!queryStart) {
        var restleTimestamp = queryType === '10' ? Math.ceil(Number(queryStart) / 10) : queryStart;
        sqlStr = "Select timestamp,count FROM timestamp WHERE type = $1 and timestamp <= $2 ORDER BY timestamp DESC limit 600";
        sqlOpt = [queryType, restleTimestamp];
    } else {
        sqlStr = "Select timestamp,count FROM timestamp WHERE type = $1 ORDER BY timestamp DESC limit 600";
        sqlOpt = [queryType];
    }
    pgclient.query(sqlStr, sqlOpt, (data) => {
        logger.info(`/get_timestamp after SQL-1: ${Date.now() - req._startTime}`)
        let typeVal = Object.prototype.toString.call(data);
        if (typeVal === '[object Error]') {
            responseData = {
                timestamp: [],
                count: [],
                code: 500,
                success: false,
                message: "Select timestamp FROM timestamp Error"
            }
        } else {
            if (data.length <= 600) {
                let timestamp = [];
                let count = [];
                data.forEach(item => {
                    timestamp.unshift(item.timestamp)
                    count.unshift(item.count / Number(queryType))
                })
                responseData = {
                    timestamp: timestamp,
                    count: count,
                    code: 200,
                    success: true,
                    message: "success"
                }
            } else {
                responseData = {
                    timestamp: [],
                    count: [],
                    code: 404,
                    success: false,
                    message: "no timestamp found"
                }
            }
        }
        res.json(responseData);
    });
})
module.exports = router;