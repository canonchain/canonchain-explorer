## blockchain-apis

区块链浏览器-APIs

## Api 列表

<details>
<summary>账户</summary>

<!-- TOC -->

- [获取 单个账户 的余额](./doc/Accounts.md/#获取单个账户的余额)
- [获取 多个账户 的余额](./doc/Accounts.md/#获取多个账户的余额)
- [获取 单个账户 的交易列表 [Normal]](./doc/Accounts.md/#获取单个账户的交易列表Normal)
- [获取 单个账户 的交易列表 [Internal]](./doc/Accounts.md/#获取单个账户的交易列表Internal)
- [获取 单个账户 的交易数 [Normal]](./doc/Accounts.md/#获取单个账户的CRC20余额)
- [获取 单个账户 的CRC20余额](./doc/Accounts.md/#获取单个账户的CRC20交易)
- [获取 单个账户 的CRC20 Token交易](./doc/Accounts.md/#获取单个账户的交易数量)

<!-- /TOC -->
</details>

<details>
<summary>交易</summary>

<!-- TOC -->

- [获取未签名的交易](./doc/Transaction.md/#获取未签名的交易)
- [发送已签名交易](./doc/Transaction.md/#发送已签名交易)
- [通过交易Hash获取交易详情](./doc/Transaction.md/#获取交易详情)

<!-- /TOC -->

</details>

<details>
<summary>统计</summary>
<!-- TOC -->

- [获取 czr 最新价格](./doc/Stats.md/#获取CZR最新价格)
- [获取CRC Token最新价格](./doc/Stats.md/#获取Token最新价格)
- [获取 czr Gas](./doc/Stats.md/#获取CZRGas)

<!-- /TOC -->
</details>

## 接口说明

> 使用本接口的前，需要申请Api-key

需要提供以下信息

- 邮箱地址
- 应用名称

#### 接口路径

DEMO路径

```
https://api.canonchain.com/apis?
    apikey=YourApiKeyToken&
    module=account&
    action=balance&
    address=czr_xxx&
    tag=latest
```
路径说明如下
```
https://api.canonchain.com/apis         请求URL             [必须，固定不变]
apikey=YourApiKeyToken                  您的ApiKey          [必须，固定不变]
module=account                          接口所属模块         [必须，参见不同模块的API文档]
action=balance                          请求行为名           [必须，参见不同模块的API文档]
address=czr_xxx                         请求行为名参数       [必须，参见不同模块的API文档]
tag=latest                              请求行为名参数       [必须，参见不同模块的API文档]
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