## 账户API列表
- [获取 单个账户 的余额](#获取单个账户的余额)
- [获取 多个账户 的余额](#获取多个账户的余额)
- [获取 单个账户 的交易列表[Normal]](#获取单个账户的交易列表Normal)
- [获取 单个账户 的交易列表[Internal]](#获取单个账户的交易列表Internal)
- [获取 单个账户 的交易数[Normal]](#获取单个账户的交易数量)
- [获取 单个账户 的 CRC20 余额](#获取单个账户的CRC20余额)
- [获取 单个账户 的 CRC20 交易](#获取单个账户的CRC20交易)

金额的单位请参考：[API结果说明](../doc/README.md/#接口返回结果)


### 获取单个账户的余额

- 方式 ：GET
- 参数
    ```
    module  : account
    action  : balance
    account : czr_account
    tag     : latest
    apikey  : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code"  : "100",
        "msg"   : "OK",
        "result": "649492854246559898951364"
    }
    ```
- 结果说明
    - 返回格式：String
        * result       string, CZR余额，单位：10<sup>-18</sup> CZR

[返回账户API列表](#账户API列表)

### 获取多个账户的余额

用逗号分隔账户，一次最多可以包含20个帐户

- 方式 ：GET
- 参数
    ```
    module  : account
    action  : balance_multi
    account : czr_account1,czr_account2
    tag     : latest
    apikey  : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": 100,
        "msg": "OK",
        "result": [
            {
                "account": "czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u",
                "balance": "1132623786600000000000000000"
            },
            {
                "account": "czr_3GmJUvqMF5XTxVXFvkLwNdKhj6LkixkqhmXgNgezuqUFg4QzKQ",
                "balance": "999999990904001198"
            }
        ]
    }
    ```
- 结果说明
    - 返回格式: Array
    - 返回值: 不同账户对应的CZR余额
        * account         string, 账户
        * balance         string, CZR余额，单位：10<sup>-18</sup> CZR

[返回账户API列表](#账户API列表)

### 获取单个账户的交易列表Normal

**分页**

要获取分页结果，请使用
- page = < 页码>
- limit = < 每页显示数量 >
- 方式 ：GET
- 参数
    ```
    module      : account
    action      : txlist
    account     : czr_account
    page        : 1
    limit       : 10
    sort        : desc  // desc | asc
    apikey      : YourApiKeyToken
    ```
- 结果
   ```
    {
        "code": 100,
        "msg": "OK",
        "result": [
            {
                hash: "C33E2B4C1BB8E0B87EC7E4EB3DDA73376DF20CE551B09205D4C03199A11FBBCF"
                from: "czr_3eHWaLn7FmxWEoDGxpW9mAXvDvqwaHVYxR9YQJ8wnYU8o81btP"
                to: "czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a"
                amount: "0"
                is_stable: "1"
                mc_timestamp: "1560946863"
                stable_index: "6572"
                status: "0"
            }
        ]
    }
    ```
- 结果说明
    - 返回格式: Array
    - 返回值: 获取到的交易
        - hash  : string，交易Hash
        - from  : string，发送方 账户
        - to    : string，接受放 账户 
        - amount        : string，交易金额 ，单位：10<sup>-18</sup> CZR
        - is_stable     : string，是否稳定（是否稳定, 0：不稳定，1：稳定）
        - mc_timestamp  : string，存在于主链的时间
        - stable_index  : string，用于排序索引
        - status        : string，判断交易状态的值（确认状态，0：成功，1：双花，2：无效，3：智能合约执行失败。）


[返回账户API列表](#账户API列表)

### 获取单个账户的交易列表Internal

**分页**

要获取分页结果，请使用
- page = < 页码>
- limit = < 每页显示数量>

- 方式 ：GET
- 参数
    ```
    module      : account
    action      : txlist_internal
    account     : czr_xx
    page        : 1
    limit       : 10
    sort        : desc      // desc | asc
    apikey      : YourApiKeyToken
    ```
- 结果
   ```
    {
        "code": 100,
        "msg": "OK",
        "result": [
            {
                "type": 0,  //call
                "action": {
                    "call_type": "call",
                    "from": "czr_4iig3fTcXQmz7bT2ztJPrpH8usrqGTN5zmygFqsCJQ4HgiuNvP",
                    "to": "czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u",
                    "gas": "25000",
                    "input": "",
                    "value": "120000000000000000000"
                },
                "result": {
                    "gas_used": "21000",
                    "output": "",
                },  
                "subtraces":0,
                "trace_address": []
            }
        ]
    }
    ```
- 结果说明
    - 返回格式: Array
    - 返回值: 获取到的合约内部交易
        - [结果参考block_traces](https://github.com/canonchain/canonchain/wiki/JOSN-RPC#block_traces)


[返回账户API列表](#账户API列表)

### 获取单个账户的交易数量

返回从地址发送的交易数

- 方式 ：GET
- 参数
    ```
    module      : account
    action      : txlist_count
    account     : czr_xx
    apikey      : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": 100,
        "msg": "OK",
        "result": 2
    }
    ```
- 结果说明
    - 返回格式: String
    - 返回值: 获取到的交易数量

[返回账户API列表](#账户API列表)

### 获取单个账户的CRC20余额

返回从地址发送的Token

- 方式 ：GET
- 参数
    ```
    module              : account
    action              : balance_crc
    account             : czr_xx
    apikey              : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": 100,
        "msg": "OK",
        "result": [
            {
                account :"czr_account",
                contract_account :"czr_account",
                name :"Token Name",
                symbol :"Token Symbol",
                precision:18, 
                balance :"1580000000"
            }
        ]
    }
    ```
- 结果说明
    - 返回格式: Array
    - 返回值: 获取到的账户Token以及对应信息
        - account           账户
        - contract_account  合约账户
        - name              Token全称
        - symbol            Token简称
        - precision         精度
        - balance           余额,单位：10<sup>-精度</sup> Token


[返回账户API列表](#账户API列表)

### 获取单个账户的CRC20交易

**分页**

要获取分页结果，请使用
- page = < 页码>
- limit = < 每页显示数量 >
- 方式 ：GET
- 参数
    ```
    module          : account
    action          : txlist_crc
    account         : czr_xx
    contractaddress : czr_xx
    page            : 1
    limit           : 10
    sort            : desc, // desc | asc
    apikey          : YourApiKeyToken
    ```
- 结果
   ```
    {
        "code": 100,
        "msg": "OK",
        "result": [
            {
                "stable_index": "4572",
                "hash": "D440EC61C72FA4B6CE761F485A5E8282DE1D5CA93327E71DC1444D366E5511A8",
                "mc_timestamp": "1560942394",
                "from": "czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u",
                "to": "czr_3juP4ekGuk66hA78XJb9XcJxCAaPff5a1K5W2eiehvmucjwotk",
                "contract_account": "czr_3juP4ekGuk66hA78XJb9XcJxCAaPff5a1K5W2eiehvmucjwotk",
                "token_symbol": "CCC",
                "amount": "1000"
            }
        ]
    }
    ```
- 结果说明
    - 返回格式: Array
    - 返回值: 获取到的账户Token以及对应信息
        - stable_index      排序索引
        - hash              交易hash
        - mc_timestamp      主链时间
        - from              发送方账户
        - to                收款方账户
        - contract_account  Token 合约地址
        - token_symbol      Token 简称
        - amount            转账金额,单位：10<sup>-精度</sup> Token（精度用已有精度即可）

[返回账户API列表](#账户API列表)