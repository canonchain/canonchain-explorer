
## 其它API列表
- [gas_price （获取 CZR Gas）](#获取CZRGas)
- [estimate_gas （ 获得估算Gas）](#获得估算Gas)
- [to_hex （字符串转16进制）](#字符串转16进制)


金额的单位请参考：[API结果说明](../doc/README.md/#接口返回结果)


### 获取CZRGas

- 方式 ：GET
- 参数
    ```
    module      : other
    action      : gas_price
    tag         : latest
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

## 获得估算Gas


- 方式 ：GET
- 参数
    ```
    module      : other
    action      : estimate_gas
    tag         : latest
    apikey      : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": "100",
        "msg": "OK",
        "result": "21272"
    }
    ```
- 结果说明
    - 返回格式：string
    - 返回值：预估所需消耗的Gas

### 字符串转16进制

- 方式 ：GET
- 参数
    ```
    module      : other
    action      : to_hex
    source      : czr_account
    apikey      : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": "100",
        "msg": "OK",
        "result": "637a725f6163636f756e74"
    }
    ```
- 结果说明
    - 传入文本对应的十六进制数据