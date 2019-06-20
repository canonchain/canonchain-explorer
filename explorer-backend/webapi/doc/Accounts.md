## 账户API列表
- [获取 单个账户 的余额](#获取单个账户的余额)
- [获取 多个账户 的余额](#获取多个账户的余额)
- [获取 单个账户 的交易列表[Normal]](#获取单个账户的交易列表Normal)
- [获取 单个账户 的交易列表[Internal]](#获取单个账户的交易列表Internal)
- [获取 单个账户 的交易数[Normal]](#获取单个账户的交易数量)
- [获取 单个账户 的CRC20余额](#获取单个账户的CRC20余额)
- [获取 单个账户 的CRC20 Token交易](#获取单个账户的CRC20交易)

### 获取单个账户的余额

- 方式 ：GET
- URL : `https://api.canonchain.com/apis`
- 参数
    ```
    module  : account ,
    action  : balance ,
    account : czr_xx ,
    tag     : latest,
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
    ```
    result       string, CZR余额，单位：10<sup>-18</sup> CZR
    ```

[返回账户API列表](#账户API列表)

### 获取多个账户的余额

用逗号分隔账户，一次最多可以包含20个帐户

- 方式 ：GET
- URL : `https://api.canonchain.com/apis`
- 参数
    ```
    module  : account ,
    action  : balance_multi ,
    account : czr_aaa,czr_bbb ,
    tag     : latest,
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
    ```
    account         string, 账户
    balance         string, CZR余额，单位：10<sup>-18</sup> CZR
    ```

[返回账户API列表](#账户API列表)

### 获取单个账户的交易列表Normal

**分页**

要获取分页结果，请使用
- page = < 页码>
- limit = < 每页显示数量 >
- 方式 ：GET
- URL : `https://api.canonchain.com/apis`
- 参数
    ```
    module      : account ,
    action      : txlist ,
    account     : czr_xx,
    page        : 1,
    limit       : 10,
    sort        : desc, // desc | asc
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
        - hash  : 交易Hash
        - from  : 发送方 账户
        - to    : 接受放 账户 
        - amount        : 交易金额 ，单位：10<sup>-18</sup> CZR
        - is_stable     : 是否稳定（是否稳定, 0：不稳定，1：稳定）
        - mc_timestamp  : 存在于主链的时间
        - stable_index  : 用于排序索引
        - status        : 判断交易状态的值（确认状态，0：成功，1：双花，2：无效，3：智能合约执行失败。）


[返回账户API列表](#账户API列表)

### 获取单个账户的交易列表Internal

**分页**

要获取分页结果，请使用
- page = < 页码>
- limit = < 每页显示数量>

- 方式 ：GET
- URL : `https://api.canonchain.com/apis`
- 参数
    ```
    module      : account ,
    action      : txlist_internal ,
    account     : czr_xx,
    page        : 1,
    limit       : 10,
    sort        : desc, // desc | asc
    apikey      : YourApiKeyToken
    ```
- 结果
   ```
    {
        "code": 100,
        "msg": "OK",
        "result": [
            {
                balance: "0"
                call_type: "call"
                contract_address_create: ""
                contract_address_create_code: ""
                contract_address_suicide: ""
                error_msg: ""
                from: "czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a"
                gas: "2855049"
                gas_used: "160443"
                hash: "ACD7451D91355AEF3187BA645A06C598CE6BB2576B8CA33B19CA22FBF46D174B"
                init: ""
                input: "0B6F48A5"
                is_error: false
                mc_timestamp: "1560946840"
                mci: "6423"
                output: ""
                refund_adderss: ""
                stable_index: "6558"
                subtraces: "2"
                to: "czr_3ynp4SUgi4wo6Yz8zBFmvEqyA1cz3ksyMLa8jAawzvkTatcquU"
                trace_address: [0,1]
                type: "0"
                value: "0"
            }
        ]
    }
    ```
- 结果说明
    - 返回格式: Array
    - 返回值: 获取到的合约内部交易
        - [结果参考block_traces](https://github.com/canonchain/canonchain/wiki/JOSN-RPC#%E8%BF%94%E5%9B%9E%E7%BB%93%E6%9E%9C-22)


[返回账户API列表](#账户API列表)

### 获取单个账户的交易数量

返回从地址发送的交易数

- 方式 ：GET
- URL : `https://api.canonchain.com/apis`
- 参数
    ```
    module      : account ,
    action      : txlist_count ,
    account     : czr_xx,
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
- URL : `https://api.canonchain.com/apis`
- 参数
    ```
    module              : account ,
    action              : balance_crc,
    account             : czr_xx,
    apikey              : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": 100,
        "msg": "OK",
        "result": [
            {
                account :"czr_aaa",
                contract_account :"czr_XXX",
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
- limit = < 每页显示数量 ）

- 方式 ：GET
- URL : `https://api.canonchain.com/apis`
- 参数
    ```
    module          : account ,
    action          : txlist_crc ,
    account         : czr_xx,
    contractaddress : czr_xx,
    page            : 1,
    limit           : 10,
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