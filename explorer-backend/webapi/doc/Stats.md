
## 统计API列表
- [获取CZR最新价格](#获取CZR最新价格)
- [获取CRC Token最新价格](#获取Token最新价格)
- [获取CZR Gas](#获取CZRGas)

### 获取CZR最新价格


- 方式 ：GET
- URL : `https://api.canonchain.com/apis`
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
- URL : `https://api.canonchain.com/apis`
- 参数
    ```
    module          : stats ,
    action          : token_price ,
    contract_account:"czr_XXX,czr_XXX",
    tag             : latest,
    apikey          : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": "100",
        "msg": "OK",
        "result": [
            {
                contract_account:"czr_XXX",
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

### 获取CZRGas

- 方式 ：GET
- URL : `https://api.canonchain.com/apis`
- 参数
    ```
    module      : stats ,
    action      : gas_price ,
    tag         : latest ,
    apikey      : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": "100",
        "msg": "OK",
        "result": {
            cheapest_gas_price:"10000",
            median_gas_price:"15000",
            highest_gas_price:"20000"
        }
    }
    ```
- 结果说明
    - 返回格式：Object
    - 返回值：CZR余额，单位：10<sup>-18</sup> CZR
        
    ```
    cheapest_gas_price  string, 最低的Gas   确认速度比较慢（可能比较慢，但保证一定会被打包确认）
    median_gas_price    string, 推荐的Gas   确认速度很快
    highest_gas_price   string, 最高的Gas   最快的确认速度
    ```