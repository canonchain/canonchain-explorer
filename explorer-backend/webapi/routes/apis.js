const router = require('koa-router')()
// db start
const { Client } = require('pg');
const config = require('../pg/config');
let client = new Client(config);

//czr start 
let Czr = require("czr");
let czr = new Czr();

async function connect() {
  await client.connect()
}
connect();
// db end
router.prefix('/apis')

// ******************************** 账户模块 开始

/** 
 * 接口：获取 单个账户 余额     
 * 参数:
     {
        module  : account ,
        action  : balance ,
        account : 0xddXXX ,
        tag     : latest,
        apikey  : YourApiKeyToken
      }
  * 返回
      {
        "code": "100",
        "msg": "OK",
        "result": "649492854246559898951364"
    }
*/
async function getBalance(query) {
  //校验
  if (!query.account) {
    return {
      "code": 9001,
      "msg": "Parameter missing account",
      "result": query
    }
  }
  //TODO 验证 account 格式

  let listOptions = {
    text: "select balance from accounts where account = $1",
    values: [query.account]
  };
  const resList = await client.query(listOptions);
  return {
    "code": 100,
    "msg": "OK",
    "result": resList.rows[0].balance || ""
  }
}


/** 
 * 接口：获取 多个账户 余额     
 * 参数:
     {
        module  : account ,
        action  : balancemulti ,
        account : 0xddXXX,0xddXXX ,
        tag     : latest,
        apikey  : YourApiKeyToken
      }
  * 返回
      {
        "code": "100",
        "msg": "OK",
        "result": [
            {
                "account": "0xddbd2b932c763ba5b1b7ae3b362eac3e8d40121a",
                "balance": "40807178566070000000000"
            },
            {
                "account": "0x63a9975ba31b0b9626b34300f7f627147df1f526",
                "balance": "332567136222827062478"
            },
            {
                "account": "0x198ef1ec325a96cc354c7266a038be8b5c558f67",
                "balance": "0"
            }
        ]
      }
*/
async function getBalanceMulti(query) {
  //校验
  let addressAry = query.account.split(",");
  if (!query.account) {
    return {
      "code": 9001,
      "msg": "Parameter missing account",
      "result": query
    }
  }
  //TODO 验证 account 格式

  let listOptions = {
    text: "select account,balance from accounts where account = ANY ($1)",
    values: [addressAry]
  };
  const resList = await client.query(listOptions);
  return {
    "code": 100,
    "msg": "OK",
    "result": resList.rows || []
  }
}

/** 
 * 接口：获取 单个账户 的交易列表
* 参数:
      {
          module      : account ,
          action      : txlist ,
          account     : 0xddXXX,
          page        : 1,
          limit       : 10,
          sort        : asc, // desc | ASC
          apikey      : YourApiKeyToken
      }
  * 返回
      {
        "code": "100",
        "msg": "OK",
        "result": [
          {

          }
        ]
    }
*/
async function txList(query) {
  //校验
  var SORTVAL = (query.sort.toLowerCase() === "desc") ? "DESC" : "ASC";
  if (!query.account) {
    return {
      "code": 9001,
      "msg": "Parameter missing account",
      "result": query
    }
  }
  //TODO 验证 格式

  var page; //当前页数
  var LIMITVAL = query.limit;//每页显示条数
  if (typeof Number(query.page) !== "number") {
    page = 1;
  } else {
    page = Number(query.page) || 1;
  }
  var OFFSETVAL = (page - 1) * LIMITVAL;

  let listOptions = {
    text: `
      Select 
        hash,"from","to",is_stable,"status",amount,mci,exec_timestamp,level
      FROM 
        transaction 
      WHERE 
        "from" = $1 
        OR 
        "to"=$1 
      order by 
        exec_timestamp ${SORTVAL}
      LIMIT 
        $2 
      OFFSET 
        $3
    `,
    values: [query.account, LIMITVAL, OFFSETVAL]
  };
  // return;

  const resList = await client.query(listOptions);
  return {
    "code": 100,
    "msg": "OK",
    "result": resList.rows || []
  }
}

async function txListAccount(query) {
  //校验
  if (!query.account) {
    return {
      "code": 9001,
      "msg": "Parameter missing account",
      "result": query
    }
  }
  //TODO 验证 格式


  let listOptions = {
    text: `
      Select 
        count(1)
      FROM 
        transaction 
      WHERE 
        "from" = $1 
        OR
        "to"=$1
    `,
    values: [query.account]
  };

  const resList = await client.query(listOptions);
  return {
    "code": 100,
    "msg": "OK",
    "result": Number(resList.rows[0].count)
  }
}
// ******************************** 账户模块 结束


// ******************************** 交易模块 开始
async function getTransactionByHash(query) {
  //校验
  if (!query.txhash) {
    return {
      "code": 9001,
      "msg": "Parameter missing txhash",
      "result": query
    }
  }
  //TODO 验证 格式


  let listOptions = {
    text: `
        Select 
          hash,"from","to",amount,previous,witness_list_block,last_summary,last_summary_block,data,exec_timestamp,signature,is_free,level,witnessed_level,best_parent,is_stable,
          "status",is_on_mc,mci,latest_included_mci,mc_timestamp,
          is_witness,stable_timestamp
        FROM
          transaction 
        WHERE 
          hash = $1
      `,
    values: [query.txhash]
  };

  const resList = await client.query(listOptions);
  return {
    "code": 100,
    "msg": "OK",
    "result": (resList.rows.length > 0) ? resList.rows[0] : {}
  }
}
// ******************************** 交易模块 结束


async function sendOfflineBlock(query) {
  //   {
  //     "action": "send_offline_block",
  //     "hash": "2CDB2DD9C1A8FC6C2EB5B9D6034E01CE9B0E4C04F8EEC7E9AB0D72DB0A111FDC",    
  //     "from": "czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u",
  //     "to": "czr_4k1FXs5xvfYcKiikFeV3GtyMRqYMwbjatL5YVURqYf1KBgC8Mq",
  //     "amount": "1000000000000000000", //1CZR
  //     "gas": 1000,
  //     "data": "A2A98215E8DB2953",
  //     "previous": "0826EC6DDA9F818044BF66256D475DDC27C6862CDD80BB178380E80BE8C2314C",
  //     "exec_timestamp": 1547709428,
  //     "work": "8B82FE2B4DAB7807",
  //     "signature": "4ABC0440DEC29AA49B6C1EEAE1D5C263B9856C218ACA4E9EDA0292FF3CBB6E85404F5266CD0B58CEF825E24EDF9C7F9A5B6FDCE415EF384C5AAF403D187ABF03",
  //     "id":"",//可选 外部交易id，防止交易重复发送，同一个id交易只会发送一次。默认为空
  //     "gen_next_work":""//可选,是否为下一笔交易预生成work值，0：不预生成，1：预生成。默认为1。
  // }
  let options = {
    "hash": query.hash,
    "from": query.from,
    "to": query.to,
    "amount": query.amount,
    "gas": parseInt(query.gas),
    "data": query.data || '',
    "previous": query.previous,
    "exec_timestamp": query.exec_timestamp,
    "work": query.work,
    "signature": query.signature,
    "id": query.id,
    "gen_next_work": query.gen_next_work || 1,
  }
  let res = await czr.request.sendOfflineBlock(options);
  return res;
}


/**
 * 
 * this.$web3.eth.sendSignedTransaction
 */
router.get('/', async function (ctx, next) {
  let query = ctx.query;
  console.log(ctx);
  //验证 apikey 类型，以及是否合法 
  if (!query.apikey) {
    ctx.body = {
      "code": 9001,
      "msg": "apikey is not found",
      "request_parameter": query
    }
    return;
  }

  //验证 action
  if (!query.action) {
    ctx.body = {
      "code": 9101,
      "msg": "action is not found",
      "request_parameter": query
    }
    return;
  }

  //根据 action 做相应处理
  switch (query.action) {
    //账户部分
    case 'balance':
      ctx.body = await getBalance(query);
      break;
    case 'balancemulti':
      ctx.body = await getBalanceMulti(query);
      break;
    case 'txlist':
      ctx.body = await txList(query);
      break;
    case 'txlistaccount':
      ctx.body = await txListAccount(query);
      break;
    case 'get_transaction_by_hash':
      ctx.body = await getTransactionByHash(query);
      break;

    case 'send_offline_block':
      ctx.body = await sendOfflineBlock(query);
      break;
    case 'block':
      ctx.body = await getBlock(query);
      break;
    case 'blocks':
      ctx.body = await getBlocks(query);
      break;
  }
})
module.exports = router