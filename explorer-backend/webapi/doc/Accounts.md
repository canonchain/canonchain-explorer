

## 账户API列表
- [获取 单个账户 的余额](#获取单个账户的余额)
- [获取 多个账户 的余额](#获取多个账户的余额)
- [获取 单个账户 的交易列表[Normal]](#获取单个账户的交易列表[Normal])
- [获取 单个账户 的交易列表[Internal]](#获取单个账户的交易列表[Internal])
- [获取 单个账户 的普通交易数](#获取单个账户的交易数量)
- [获取 单个账户 的CRC20余额](#获取单个账户的CRC20余额)
- [获取 单个账户 的CRC20 Token交易](#获取单个账户的CRC20交易)



### 获取单个账户的余额

- 方式 ：GET
- URL : `http://localhost:3000/apis`
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
        "code": "100",
        "msg": "OK",
        "result": "649492854246559898951364"
    }
    ```

[返回账户API列表](#账户API列表)

### 获取多个账户的余额

用逗号分隔账户，一次最多可以包含20个帐户

- 方式 ：GET
- URL : `http://localhost:3000/apis`
- 参数
    ```
    module  : account ,
    action  : balance_multi ,
    account : czr_ddXXX,czr_ddXXX ,
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

[返回账户API列表](#账户API列表)

### 获取单个账户的交易列表[Normal]

**分页**

要获取分页结果，请使用
- page = < 页码>
- limit = < 每页显示数量 >
- 方式 ：GET
- URL : `http://localhost:3000/apis`
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
        "result": []
    }
    ```

[返回账户API列表](#账户API列表)

### 获取单个账户的交易列表[Internal]

**分页**

要获取分页结果，请使用
- page = < 页码>
- limit = < 每页显示数量>

- 方式 ：GET
- URL : `http://localhost:3000/apis`
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
        "result": []
    }
    ```

[返回账户API列表](#账户API列表)

### 获取单个账户的交易数量

返回从地址发送的交易数

- 方式 ：GET
- URL : `http://localhost:3000/apis`
- 参数
    ```
    {
        module      : account ,
        action      : txlist_count ,
        account     : czr_xx,
        apikey      : YourApiKeyToken
    }
    ```
- 结果
    ```
    {
        "code": 100,
        "msg": "OK",
        "result": 2
    }
    ```
[返回账户API列表](#账户API列表)

### 获取单个账户的CRC20余额

返回从地址发送的交易数

- 方式 ：GET
- URL : `http://localhost:3000/apis`
- 参数
    ```
    module              : account ,
    action              : balance_crc,
    account             : czr_xx,
    contractaddress     : czr_xx,
    apikey              : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": 100,
        "msg": "OK",
        "result": "18000000"
    }
    ```
[返回账户API列表](#账户API列表)

### 获取单个账户的CRC20交易

**分页**

要获取分页结果，请使用
- page = < 页码>
- limit = < 每页显示数量 ）

- 方式 ：GET
- URL : `http://localhost:3000/apis`
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
        "result": []
    }
    ```

[返回账户API列表](#账户API列表)