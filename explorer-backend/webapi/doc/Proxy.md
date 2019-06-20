- sendRawTransaction 
    - 发送等待签名的原始交易
- getTransactionByHash 
    - 通过交易HAsh获取交易信息


## sendRawTransaction 发送等待签名的原始交易


### 通过交易HAsh获取交易信息

返回从地址发送的交易数

- 方式 ：GET
- URL : `http://localhost:3000/apis`
- 参数
    ```
    {
        module      : proxy ,
        action      : get_transaction_by_hash ,
        txhash      : XXX ,
        apikey      : YourApiKeyToken
    }
    ```
- 结果
    ```
    {
        code        : 100,
        msg         : "OK",
        result      : 0
    }
    ```

```