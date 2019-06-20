
## 统计API列表
- [获取CZR最新价格](#获取CZR最新价格)
- [获取CZR Gas](#获取CZRGas)

### 获取CZR最新价格


- 方式 ：GET
- URL : `http://localhost:3000/apis`
- 参数
    ```
    module      : stats ,
    action      : czr_price ,
    tag         : latest,
    apikey      : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": "100",
        "msg": "OK",
        "result": {
            czr_btc:"0.00078",
            czr_eth:"0.000030"
        }
    }
    ```

### 获取CZRGas

- 方式 ：GET
- URL : `http://localhost:3000/apis`
- 参数
    ```
    module      : stats ,
    action      : transaction_gas ,
    tag         : latest,
    apikey      : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": "100",
        "msg": "OK",
        "result": {
            czr_btc:"0.00078",
            czr_eth:"0.000030"
        }
    }
    ```