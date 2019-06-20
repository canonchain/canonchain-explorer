新验证的合同将在5分钟或更短的时间内同步到API服务器

Get Contract ABI for Verified Contract Source Codes

 ***todo 获取合约的ABI***

`
https://domain/api?module=contract&action=getabi&address=0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413&apikey=YourApiKeyToken
`

- 方式 ：GET
- URL : - 
- 参数 : 
        ```
        {
            address:
        }

        ```
- 结果

    ```
    {
        result: 
    }

    ```


Get Contract Source Code for Verified Contract Source Codes


 ***todo 获取合约的代码***

https://domain/api?module=contract&action=getsourcecode&address=0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413&apikey=YourApiKeyToken


 ***todo 源代码提交gist***

- 方式 ：POST
- URL : - 
- 参数
    ```
    {
        data: {}
    }
    ```
- 结果

    ```
    {
        status: 0 or 1
    }

    ```

Check Source code verification submission status:

***检查源代码验证提交状态***

- 方式 ：GET
- URL : - 
- 参数
    ```
    {
        guid: 'ezq878u486pzijkvvmerl6a9mzwhv6sefgvqi5tkwceejc7tvn', //Replace with your Source Code GUID receipt above
        module: "contract",
        action: "checkverifystatus"
    }
    ```
- 结果

    ```
    {
        status: 
        message: 
        result: 
    }

    {
        error: 
    }
    ```
