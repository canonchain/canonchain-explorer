
## 交易API列表
- [tx_offline_generation (生成离线交易)](#生成离线交易)
- [tx_offline_sending (发送离线交易)](#发送离线交易)
- [tx_details (通过交易Hash获取交易详情) ](#获取交易详情)

金额的单位请参考：[API结果说明](../README.md/#接口返回结果)

### 生成离线交易

生成未签名的交易，返回交易详情，开发者需要签名后通过`tx_offline_sending`发送交易

- 方式 ：GET
- 参数
    ```
    module  : transaction
    action  : tx_offline_generation
    from: "czr_account1"            源账户。
    to: "czr_account2"              目标账户。
    amount: "100000000000000"       金额，单位
    gas: "21000"                    执行交易使用的gas上限。未使用完的部分会返回源账户。
    gas_price: "1000000000000"      gas价格
    previous：""                    可选 | 源账户的上一笔交易hash。可用于替换无法被打包的交易。
    data: "496E204D617468"          可选 | 智能合约代码或数据，默认为空。
    apikey  : YourApiKeyToken
    ```
    - 参数说明
        - gas_price: gas价格 ，单位：10<sup>-18</sup>CZR/gas，手续费 = 实际使用的gas * gas_price。
- 结果
    ```
    成功：
    {
        "code": "100",
        "msg": "OK",
        "result": {
            "hash": "2CDB2DD9C1A8FC6C2EB5B9D6034E01CE9B0E4C04F8EEC7E9AB0D72DB0A111FDC",
            "previous": "A5E40538D4FA7505DDE81C538AAAB97142312E3FE3D606901E2C439967FE10F0",
            "from": "czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u",
            "to": "czr_4m7NiSx2sBG4Hmdq1Yt6EGKqFQ3rmtBXCsmJZZp4E3pm84LkG9",
            "amount":"1000000000000000000", //1CZR
            "gas": "21000",
            "gas_price": "1000000000000",
            "data": "496E204D617468205765205472757374",
    }

    失败（缺少from或to参数）：
    {
        "code":"400",
        "msg":"parameter from and to is required"
    }

    失败（from或to地址非法）：
    {
        "code":"400",
        "msg":"from or to is invalid format"
    }

    失败（amount非正整数，gas，gas_price错误也是类似报错）：
    {
        "code":"400",
        "msg":"parameter amount is required and must not Negative"
    }
    ```
- 结果说明
    ```
    hash：            string, 交易哈希。
    previous：        string, 源账户的上一笔交易。
    from：            string, 源账户。
    to：              string, 目标账户。
    amount：          string, 金额。
    gas：             string, 执行交易使用的gas上限。未使用完的部分会返回源账户。
    gas_price：       string, gas价格
    data：            string, 参见输入参数。
    ```
    - 其它说明
        - amount: 金额，单位：10<sup>-18</sup>CZR。
        - gas_price: gas价格 ，单位：10<sup>-18</sup>CZR/gas，手续费 = 实际使用的gas * gas_price。

[返回交易API列表](#交易API列表)

### 发送离线交易

请求参数来自接口 tx_offline_generation ,返回交易哈希。

- 方式 ：GET
- 参数
    ```
    module  : transaction
    action  : tx_offline_sending
    from: "czr_account1"
    to: "czr_account2"
    amount: "1000000000000000000" 金额
    gas: "21000"
    gas_price: "1000000000000"
    data: "A2A98215E8DB2953"
    signature: "4AB..."         交易签名
    previous: "A5E40538D4FA7505DDE81C538AAAB97142312E3FE3D606901E2C439967FE10F0"
    gen_next_work："1"          可选 | 是否为下一笔交易预生成work值，0：不预生成，1：预生成。默认为1。
    apikey  : YourApiKeyToken
    ```
- 参数说明
    - 其中from，to，amout，gas，data，previous来自接口 generation_offline_block 。
    - amount：金额，单位：10<sup>-18</sup>CZR。
- 结果
    ```
    成功：
    {
        "code": "100",
        "msg": "OK",
        "result": "E8441A74FD40465006CC078C860323A0DFF32F23AC7E7F81A153F8ECE304439A"
    }

    失败(缺失signature参数)：{
        "code":"400",
        "msg":"parameter signature is required"
    }

    失败（缺失previous参数）：{
        "code":"400",
        "msg":"parameter previous is required"
    }
    ```
- 结果说明
    
    - result：string , 交易hash

[返回交易API列表](#交易API列表)



### 获取交易详情

- 方式 ：GET
- 参数
    ```
    module  : transaction
    action  : tx_details
    hash    : HASH
    apikey  : YourApiKeyToken
    ```
- 结果
    ```
    成功：
    {
        "code": "100",
        "msg": "OK",
        "result": {
            "hash": "C33E2B4C1BB8E0B87EC7E4EB3DDA73376DF20CE551B09205D4C03199A11FBBCF",
            "type": "2",
            "from": "czr_3eHWaLn7FmxWEoDGxpW9mAXvDvqwaHVYxR9YQJ8wnYU8o81btP",
            "to": "czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a",
            "amount": "0",
            "gas": "3000000",
            "gas_price": "1000000000",
            "gas_used": "21272",
            "data": "1FC376F7",
            "is_stable": "1",
            "status": "0",
            "mc_timestamp": "1560946863",
            "stable_timestamp": "1560946868"
        }

    失败（缺失hash参数）：
    {
        "code": 400,
        "msg": "Parameter missing txhash"
    }

    失败（hash参数非法）：
    {
        "code":400,
        "msg": "invalid txhash"
    }
    ```
- 结果说明
    - 返回格式：Object
    - 返回值：
    ```
    "hash"              string, 交易hash
    "type"              string, 类型, 0：创世交易，1：见证交易，2：普通交易
    "from"              string, 发款方
    "to"                string, 收款方
    "amount"            string, 金额
    "gas"               string, Gas
    "gas_price"         string, gas_price
    "gas_used"          string, gas_used
    "data"              string, data
    "is_stable"         string, is_stable
    "status"            string, status
    “timestamp"         string, 只有创世交易或者见证交易才有该字段
    "mc_timestamp"      string, MC时间
    "stable_timestamp"  string, 稳定时间
    ```
    - 具体详情，请转到浏览器Hash行情页查看

[返回交易API列表](#交易API列表)
