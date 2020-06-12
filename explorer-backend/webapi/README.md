## 标准链API

## API 列表

<details open >
<summary>账户</summary>

<!-- TOC -->
- [account_validate （验证czr账户是否正确）](./doc/Accounts.md/#验证czr账户是否正确)
- [account_balance （获取 单个账户 的余额）](./doc/Accounts.md/#获取单个账户的余额)
- [account_balance_multi （获取 多个账户 的余额）](./doc/Accounts.md/#获取多个账户的余额)
- [account_balance_token （获取 单个账户 的 C-ERC20 Token 余额）](./doc/Accounts.md/#获取单个账户的C-ERC20余额)
- [account_balance_token_multi （获取 多个账户 的 C-ERC20 Token 余额）](./doc/Accounts.md/#获取多个账户的C-ERC20余额)
- [account_txlist （获取 单个账户 的交易列表 Normal）](./doc/Accounts.md/#获取单个账户的交易列表Normal)
- [account_txlist_internal （获取 单个账户 的交易列表 Internal）](./doc/Accounts.md/#获取单个账户的交易列表Internal)
- [account_txlist_count （获取 单个账户 的交易数  Normal ）](./doc/Accounts.md/#获取单个账户的交易数量)
- [account_txlist_token （获取 单个账户 的 C-ERC20 Token 交易）](./doc/Accounts.md/#获取单个账户的C-ERC20交易)

<!-- /TOC -->
</details>

<details open >
<summary>交易</summary>

<!-- TOC -->

- [tx_offline_generation （生成离线交易）](./doc/Transaction.md/#生成离线交易)
- [tx_offline_sending （发送离线交易）](./doc/Transaction.md/#发送离线交易)
- [tx_details （通过交易Hash获取交易详情）](./doc/Transaction.md/#获取交易详情)

<!-- /TOC -->

</details>

<details open >
<summary>其它</summary>
<!-- TOC -->

- [gas_price （获取 CZR Gas）](./doc/Other.md/#获取Gas价格)
- [estimate_gas （ 获得估算Gas）](./doc/Other.md/#获得估算Gas)
- [to_hex czr地址转16进制](./doc/Other.md/#czr地址转16进制)

<!-- /TOC -->
</details>

<details >
<summary>统计（即将上线）</summary>
<!-- TOC -->

- [czr_price （获取 CZR 最新价格）](./doc/Stats.md/#获取CZR最新价格)
- [token_price （获取 C-ERC20 Token 最新价格）](./doc/Stats.md/#获取Token最新价格)

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
https://domain/apis?
    apikey=YourApiKeyToken&
    module=account&
    action=balance&
    address=czr_account&
    tag=latest
```
路径说明如下
```
https://domain/apis         请求URL             [必须，固定不变]
apikey=YourApiKeyToken      您的ApiKey          [必须，固定不变]
module=account              接口所属模块         [必须，参见不同模块的API文档]
action=balance              请求行为名           [必须，参见不同模块的API文档]
address=czr_account         请求行为名参数       [必须，参见不同模块的API文档]
tag=latest                  请求行为名参数       [必须，参见不同模块的API文档]
```

#### 接口返回结果

```
{
    "code": 100,
    "msg": "OK",
    "result": {}
}
```

- `result` 是真正需要返回的数据，并且只会在请求成功时才存在，
    - 结果中**所有 CZR交易相关的金额**，单位均是 10<sup>-18</sup> CZR
    - 结果中**所有 C-ERC20 Token相关的金额**，单位均是 10<sup>-Token精度</sup>C-ERC20 Token
- `msg` 只用在开发环境，并且只为了开发人员识别。
    - 客户端逻辑只允许识别 `code`，并且不允许直接将 `msg` 的内容展示给用户。
    - 如果某个错误很复杂，无法使用一段话描述清楚，会额外再添加一个`doc`字段，包含指向该错误的文档的链接。

#### 状态码说明( `code` 值的说明)
- 100：请求成功
- 401：节点返回错误
- 400：参数错误
- 403：禁止访问
- 404：未找到
- 500：系统错误

## 其它说明

#### 交易创建流程：
1. 使用API [tx_offline_generation](./doc/Transaction.md/#生成离线交易) 生成离线交易数据
2. 使用API [gas_price](./doc/Other.md/#获取CZRGas) 获得gas price推荐值
3. 使用API [estimate_gas](./doc/Other.md/#获得估算Gas) 获得估算的gas
4. 使用ed25519签名算法计算签名（512位）
5. 使用API [tx_offline_sending](./doc/Transaction.md/#发送离线交易) 发送交易