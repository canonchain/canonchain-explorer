
## 统计API列表
- [获取 CZR 最新价格](#获取CZR最新价格) 
- [获取 CRC Token 最新价格](#获取Token最新价格)

### 获取CZR最新价格


- 方式 ：GET
- 参数
    ```
    module      : stats
    action      : czr_price
    tag         : latest
    apikey      : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": "100",
        "msg": "OK",
        "result": {
            usd:"0.08246"
        }
    }
    ```
- 结果说明
    - 返回格式：Object
    - 返回值：
    ```
    usd       string, 美元为单位的单价
    ```

### 获取Token最新价格

获取CRCToken最新价格

- 方式 ：GET
- 参数
    ```
    module          : stats
    action          : token_price
    contract_account:"czr_account,czr_account"
    tag             : latest
    apikey          : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": "100",
        "msg": "OK",
        "result": [
            {
                contract_account:"czr_account",
                usd:"0.08246"
            }
        ]
    }
    ```
- 结果说明
    - 返回格式：Array
    - 返回值：
    ```
    contract_account        string, 合约账户
    usd                     string, 美元为单位的单价
    ```

