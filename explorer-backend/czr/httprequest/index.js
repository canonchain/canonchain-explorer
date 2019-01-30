"use strict";
var rpc = require('../json-rpc/index');

var options = {
    // host: '192.168.10.232',
    // host: '192.168.10.153',
    host: "127.0.0.1",
    port: 8765,
};


var HttpRequest = function (host, timeout, apiVersion) {
    this.hostCon = host || options;
    // this.timeout = timeout || 0;
    // this.apiVersion = apiVersion || "v1";
};


var client = new rpc.Client(options);

function asyncfunc(opt) {
    return new Promise((resolve, reject) => {
        client.call(opt,
            function (err, res) {
                if (err) {
                    reject(err);
                } else {
                    resolve(res)
                }
            }
        );
    })
}


HttpRequest.prototype.client = client;
/* 

        return 100//没有第一个参数
        return 101 //没有第二个参数

*/


// Account Start

/* 
创建账号： account_create(password)
@parm:
    password
@return:
    {account:""}
*/
HttpRequest.prototype.accountCreate = async function (pwd) {
    if (!pwd) {
        return 100
    }
    var opt = {
        "action": "account_create",
        "password": pwd
    };
    let ret = await asyncfunc(opt);
    return ret;
};

/* 
删除账号： account_remove (password)
@parm:
    account
    password
@return:
    {success:"1"}
*/
HttpRequest.prototype.accountRemove = async function (account, pwd) {
    if (!account) {
        return 100
    }
    if (!pwd) {
        return 101
    }
    var opt = {
        "action": "account_remove",
        "account": account,
        "password": pwd
    };
    let ret = await asyncfunc(opt);
    return ret;
};


/*
导入账号： account_import()
@parm:
    json
@return:
    {success:"1"}   //如果success为0，account为空 account:""
*/
HttpRequest.prototype.accountImport = async function (jsonFile) {
    if (!jsonFile) {
        return 100
    }
    var opt = {
        "action": "account_import",
        "json": jsonFile
    };
    let ret = await asyncfunc(opt);
    return ret;
};


/* 
导出账号： account_export()
@parm:
    account
@return:
    {json:""}
*/

HttpRequest.prototype.accountExport = async function (account) {
    if (!account) {
        return 100
    }
    var opt = {
        "action": "account_export",
        "account": account
    };
    let ret = await asyncfunc(opt);
    return ret;
};

/* 
账号验证： account_validate
@parm:
    account
@return:
    {valid:"1"} 1->正确 0 不正确
*/

HttpRequest.prototype.accountValidate = async function (accountVal) {
    if (!accountVal) {
        return 0
    }
    var opt = {
        "action": "account_validate",
        "account": accountVal
    };
    let ret = await asyncfunc(opt);
    return ret;
};

/* 
账号列表： account_list()
@parm:
    
@return:
     {accounts:[]}
*/

HttpRequest.prototype.accountList = async function () {
    var opt = {
        "action": "account_list"
    };
    let ret = await asyncfunc(opt);
    return ret;
};

// Account End


//获取账号余额
HttpRequest.prototype.accountBalance = async function (account) {
    if (!account) {
        return 0//没有参数
    }
    var opt = {
        "action": "account_balance",
        "account": account
    };
    let ret = await asyncfunc(opt);
    return ret;
};

//批量获取账户余额
HttpRequest.prototype.accountsBalances = async function (accountAry) {
    if (!accountAry) {
        return 0//没有参数
    }
    if (!accountAry) {
        return 1 //格式不正确
    }
    var opt = {
        "action": "accounts_balances",
        "accounts": accountAry
    };
    let ret = await asyncfunc(opt);
    return ret;
};

/* 
发送交易： send()
@parm:
    - from
    - to
    - amount
    - password
    - data:"ssss"
    - id
@return:
     {block:""}
*/
HttpRequest.prototype.send = async function (sendObj) {
    if (!sendObj) {
        return 0//没有参数
    }
    var opt = {
        "action": "send",
        "from": sendObj.from,
        "to": sendObj.to,
        "amount": sendObj.amount,
        "password": sendObj.password,
        "data": sendObj.data,
        "id": sendObj.id
    };
    let ret = await asyncfunc(opt);
    return ret;
};

HttpRequest.prototype.getBlock = async function (blockHash) {
    if (!blockHash) {
        return 0//没有参数
    }
    var opt = {
        "action": "block",
        "hash": blockHash
    };
    let ret = await asyncfunc(opt);
    return ret;
};

HttpRequest.prototype.blockList = async function (account, limit, last_hash) {
    var opt;
    if (!account) {
        return 0//没有参数 
    }
    if (!limit) {
        return 1//没有参数 
    }
    if (!last_hash) {
        opt = {
            "action": "block_list",
            "account": account,
            "limit": limit
        };
    } else {
        opt = {
            "action": "block_list",
            "account": account,
            "limit": limit,
            "last_hash": last_hash
        };
    }
    let ret = await asyncfunc(opt);
    return ret;
};

//数据库RPC
/* 
mci_blocks ：传入的mci值,返回mci下所有block的信息
 {"action":"mci_blocks","mci":"121"} -> {blocks:[]};

unstable_blocks ：当前不稳定的所有block的信息
 {"action":"unstable_blocks"}-> {blocks:[]};

status:最后一个稳定点的mci，block信息
 {"action":"status"}->{
last_stable_mci: 100, 
last_mci:122}
 */

//传入的mci值,返回mci下所有block的信息
/* 
{
    "action"    :"mci_blocks",
    "mci"       :"121",
    "limit"     :"50",
    "next_index":'',    //第一次传空字符串，后续的值取上一次结果中 next_index
} 
-> 
{
    blocks:[],
    "next_index": "XXX" // ""或者一串字符串,如果 next_index == ""  这个mci下的block请求结束
};
*/
/**
 * @deprecated
 * */
HttpRequest.prototype.mciBlocks = async function (mci, limit, next_index) {
    if (!limit) {
        return 1//没有参数 
    }
    let opt;
    if (next_index) {
        opt = {
            "action": "mci_blocks",
            "mci": mci,
            "limit": limit,
            "next_index": next_index
        };
    } else {
        opt = {
            "action": "mci_blocks",
            "mci": mci,
            "limit": limit
        };
    }
    return await asyncfunc(opt);
};

/**
 * 获取已稳定的指定mci下的多笔交易。
 * @param {number} mci - 指定的mci
 * @param {number} limit - 返回交易上限，如果超过1000，默认1000
 * @param {string} [index] - （可选）当前查询索引，来自返回结果中next_index，默认为空。
 * @returns {Promise<{code, msg, blocks, next_index}>}
 * */
HttpRequest.prototype.stableBlocks = async function (mci, limit, index) {
    if (mci < 0) {
        return {code: 110, msg: `param not valid - mci: ${JSON.stringify(mci)}`}
    }
    if (!limit || limit > 1000) {
        limit = 1000
    }
    return await asyncfunc({
        "action": "stable_blocks",
        "mci": mci,
        "limit": limit,
        "next_index": index || ''
    });
}

/**
 * 返回未稳定交易详情。
 * @param {number} limit - 返回交易上限，如果超过1000，默认1000。
 * @param {string} [index] - （可选）当前查询索引，来自返回结果中的next_index，默认为空。
 * @returns {Promise<{code, msg, blocks, next_index}>}
 * */
HttpRequest.prototype.unstableBlocks = async function (limit, index) {
    if (!limit || limit > 1000) {
        limit = 1000
    }
    let opt = {
        "action": "unstable_blocks",
        "limit": limit,
        "index": index || ''
    };
    return await asyncfunc(opt);
};

//最后一个稳定点的mci，block信息
/* 
return
    {
        last_stable_mci: 100, 
        last_mci:122
    }

*/
HttpRequest.prototype.status = async function () {
    var opt = {
        "action": "status"
    };
    let ret = await asyncfunc(opt);
    return ret;
};

module.exports = HttpRequest;
