
## 其它API列表
- [gas_price （获取 CZR Gas）](#获取Gas价格)
- [estimate_gas （ 获得估算Gas）](#获得估算Gas)
- [to_hex （czr地址转16进制）](#czr地址转16进制)


金额的单位请参考：[API结果说明](../README.md/#接口返回结果)


### 获取Gas价格

- 方式 ：GET
- 参数
    ```
    module      : other
    action      : gas_price
    apikey      : YourApiKeyToken
    ```
- 结果
    ```
    {
        "code": 100,
        "msg": "OK",
        "result": {
            cheapest_gas_price:"10000000",
            median_gas_price:"15000000",
            highest_gas_price:"20000000"
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
[返回其他API列表](#其它API列表)

### 获得估算Gas


- 方式 ：GET
- 参数
    ```
    module      : other
    action      : estimate_gas
    apikey      : YourApiKeyToken
    from        :（可选）源账户
    to          :（可选）目标账户
    amount      :（可选）string, 金额，单位：10-18CZR
    gas         :（可选）string, 执行交易使用的gas上限
    gas_price   :（可选）string, gas价格，单位：10-18CZR/gas，手续费 = 实际使用的gas * gas_price
    data        :（可选）智能合约代码或数据。默认为空
    mci         :（可选）string, mci，接受的值："latest", "earliest" 或数字（如:"1352"）, 默认为"latest"
    ```
- 结果
    ```
    {
        "code": 100,
        "msg": "OK",
        "result": "21272"
    }
    ```
- 结果说明
    - 返回格式：string
    - 返回值：预估所需消耗的Gas

[返回其他API列表](#其它API列表)

### 获得授权金额


    // token_account CUSDT合约
    // user_account 用户账户
    // action_account 映射合约

- 方式 ：GET
- 参数
    ```
    module      : other
    action      : allowance
    apikey      : YourApiKeyToken
    token_account   :想要查询的Token地址(CUSDT)
    user_account    :目标账户(用户的账号)
    action_account  :想要授权给谁的地址（Mapping地址）
    ```
- 结果
    ```
    {
        "code": 100,
        "msg": "OK",
        "result": "0"
    }
    ```
- 结果说明
    - 返回格式：string
    - 返回值：目前授权的值

[返回其他API列表](#其它API列表)


### czr地址转16进制

- 方式 ：GET
- 参数
    ```
    module      : other
    action      : to_hex
    source      : czr_4KsqkcZCs6i9VU2WUsiqTU8M6i3WYpVPFMcMXSkKmB92GJvYt1
    apikey      : YourApiKeyToken
    ```
- 结果
    ```
    成功：
    {
        "code": 100,
        "msg": "OK",
        "result": "b5f327e3f07f2c94dadcdb6d122addafd3aa3ac9507e8f8368f9ad3e6a378798"
    }

    失败（缺少source参数）
    {
        "code": 400,
        "msg": "parameter missing source"
    }

    失败（source参数不是czr地址）
    {
        "code": 400,
        "msg": "parameter source is not a czr address"
    }
    ```
- 结果说明
    - 地址对应的十六进制数据

[返回其他API列表](#其它API列表)