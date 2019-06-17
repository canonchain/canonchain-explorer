- eth_sendRawTransaction 
    - 发送等待签名的原始交易
- eth_getTransactionByHash 
    - 通过交易HAsh获取交易信息


## eth_sendRawTransaction 发送等待签名的原始交易

https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex=0xf904808000831cfde080&apikey=YourApiKeyToken


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
 http://localhost:3000/apis?module=proxy&action=get_transaction_by_hash&txhash=BC689317F9948D4F2F9F7B9B13B61ED543F83A4823DAEBCDA75BFD4656743450&apikey=YourApiKeyToken


 https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=0x1e2910a262b1008d0616a0beb24c1a491d78771baa54a33e66065e03b1f46bc1&apikey=YourApiKeyToken
```

[返回账户API列表](#账户API列表)