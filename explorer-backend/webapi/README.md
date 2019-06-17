## blockchain-apis
区块链浏览器-APIs


## TODO 

**还需要做的API**

WebAPI: 

```
Get a list of 'Internal' Transactions by Address

Get "Internal Transactions" by Transaction Hash

Get a list of "ERC20 - Token Transfer Events" by Address
```


## Api 列表

<details>
<summary>账户</summary>

<!-- TOC -->

- [获取 单个账户 的余额](./doc/Accounts.md/#account)
- [获取 多个账户 的余额](./doc/Accounts.md/#account)
- [获取 单个账户 的交易列表 [Normal]](./doc/Accounts.md/#account)
- [获取 单个账户 的交易列表 [Internal]](./doc/Accounts.md/#account)
- [获取 内部交易 (Internal Transactions)](./doc/Accounts.md/#account)
- [获取 单个账户 的ERC20 Token交易事件](./doc/Accounts.md/#account)
- [获取 单个账户 的挖矿收益列表](./doc/Accounts.md/#account)

<!-- /TOC -->

</details>

<details>
<summary>合约</summary>

<!-- TOC -->

- [获取 合约ABI (已验证合约)](#account)
- [获取 合约源代码 (已验证合约)](#account)

<!-- /TOC -->

</details>

<details>
<summary>交易</summary>

<!-- TOC -->

- [检查合约执行状态 (如果合约执行期间出现错误)](#account)
- [检查交易收据状态 (仅适用于Post Byzantium fork事务)](#account)

<!-- /TOC -->

</details>

<details>
<summary>区块</summary>

<!-- TOC -->

- [获取 出块奖励](#account)

<!-- /TOC -->

</details>

<details>
<summary>事件日志</summary>

<!-- TOC -->

- [获取 事件日志](#account)

<!-- /TOC -->
</details>

<details>
<summary>GETH/Parity Proxy</summary>

<!-- TOC -->

- [eth_blockNumber](#account)
- [eth_getBlockByNumber](#account)
- [eth_getUncleByBlockNumberAndIndex](#account)
- [eth_getBlockTransactionCountByNumber](#account)
- [eth_getTransactionByHash](#account)
- [eth_getTransactionByBlockNumberAndIndex](#account)
- [eth_getTransactionCount](#account)
- [eth_sendRawTransaction](#account)
- [eth_getTransactionReceipt](#account)
- [eth_call](#account)
- [eth_getCode](#account)
- [eth_getStorageAt](#account)
- [eth_gasPrice](#account)
- [eth_estimateGas](#account)

<!-- /TOC -->
</details>
<details>
<summary>代币</summary>

<!-- TOC -->

- [获取 代币总量](#account)
- [获取 账户的ERC20余额](#account)

<!-- /TOC -->
</details>
<details>
<summary>统计</summary>

<!-- TOC -->

- [获取 以太的 总供应量](#account)
- [获取 以太的 最新价格](#account)

<!-- /TOC -->
</details>

## 接口说明

> 使用本接口的前，需要申请Api-key

#### 接口路径

DEMO路径

```
https://api.canonchain.com/api?
    module=account&
    action=balance&
    address=0xddbd2b932c763ba5b1b7ae3b362eac3e8d40121a&
    tag=latest&
    apikey=YourApiKeyToken
```
路径说明如下
```
https://api.canonchain.com/api            请求URL         [必须，固定不变]
apikey=YourApiKeyToken                  您的ApiKey      [必须，固定不变]

module=account                          接口所属模块     [必须，参见不同模块的API文档]
action=balance                          请求行为名       [必须，参见不同模块的API文档]

address=0xddbd2                         请求行为名参数    [必须，参见不同模块的API文档]
tag=latest                              请求行为名参数    [必须，参见不同模块的API文档]
```

#### 接口返回结果

```
{
    "status": 100,
    "message": "OK",
    "result": {}
}
```

- `result` 是真正需要返回的数据，并且只会在请求成功时才存在，
- `message` 只用在开发环境，并且只为了开发人员识别。
- 客户端逻辑只允许识别 `status`，并且不允许直接将 `message` 的内容展示给用户。
- 如果某个错误很复杂，无法使用一段话描述清楚，会额外再添加一个`doc`字段，包含指向该错误的文档的链接。

#### 状态码说明( `status` 值的说明)
- 100：请求成功
- 400：参数错误
- 403：禁止访问
- 404：未找到
- 500：系统错误



## Api-Key类型

- 免费Api-Key
    - 较低的请求频率
    - 部分API不可使用
- 付费Api-Key
    - 更高的请求频率
    - 更多的API接口使用权


> 不同Key的限制

GET/POST请求和
- 免费Key：5个请求/秒的速率
- 付费Key：XX个请求/秒的速率
