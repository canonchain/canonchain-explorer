



api.etherscan.io

## ethprice 获取最新的价格

https://api.etherscan.io/api?module=stats&action=ethprice&apikey=YourApiKeyToken


-----

## balance 获取某个账号的余额

https://api.etherscan.io/api?module=account&action=balance&address=0xddbd2b932c763ba5b1b7ae3b362eac3e8d40121a&tag=latest&apikey=YourApiKeyToken


## balancemulti 批量获取余额

https://api.etherscan.io/api?module=account&action=balancemulti&address=0xddbd2b932c763ba5b1b7ae3b362eac3e8d40121a,0x63a9975ba31b0b9626b34300f7f627147df1f526,0x198ef1ec325a96cc354c7266a038be8b5c558f67&tag=latest&apikey=YourApiKeyToken

## tokenbalance


## txlist 获取“正常”按地址交易的列表

https://api.etherscan.io/api?module=account&action=txlist&address=0xddbd2b932c763ba5b1b7ae3b362eac3e8d40121a&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=YourApiKeyToken

(To get paginated results use page=<page number> and offset=<max records to return>)

## tokentx 按地址获取“ERC20  - Token转移事件”列表

Get a list of "ERC20 - Token Transfer Events" by Address

https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2&page=1&offset=100&sort=asc&apikey=YourApiKeyToken
(To get paginated results use page=<page number> and offset=<max records to return>)

---

## eth_gasPrice 返回当前的Gas单价 / wei单位

https://api.etherscan.io/api?module=proxy&action=eth_gasPrice&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R

## eth_getTransactionCount 返回从地址发送的交易数

https://api.etherscan.io/api?module=proxy&action=eth_getTransactionCount&address=0x2910543af39aba0cd09dbb2d50200b3e800a63d2&tag=latest&apikey=YourApiKeyToken


## eth_sendRawTransaction 发送等待签名的原始交易

https://api.etherscan.io/api?module=proxy&action=eth_sendRawTransaction&hex=0xf904808000831cfde080&apikey=YourApiKeyToken


## eth_getTransactionByHash 通过交易HAsh获取交易信息

https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=0x1e2910a262b1008d0616a0beb24c1a491d78771baa54a33e66065e03b1f46bc1&apikey=YourApiKeyToken



# sources

//服务端根路径
```
    public static String baseUrl = "https://api.etherscan.io/";
    public static String trustUrl = "https://public.trustwalletapp.com/";
```


```
public interface GetTransferInfoApiService {
    @GET("api?module=proxy&action=eth_gasPrice&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<String>> getEthGasPrice();

    @GET("api?module=proxy&action=eth_getTransactionCount&tag=latest&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<String>> getNonce(@Query("address")String address);

    @GET("api?module=account&action=balance&tag=latest&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<String>> getBalance(@Query("address")String address);

    @POST("api?module=proxy&action=eth_sendRawTransaction&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<String>> sendRawTransaction(@Query("hex") String hex);

    @GET("api?module=account&action=balancemulti&tag=latest&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<List<BalanceBean>>> getEthBalances(@Query("address") String address);

    @GET("api?module=stats&action=ethprice&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<PriceBean>> getEthPrice();

    @GET("api?module=account&action=tokenbalance&tag=latest&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<String>> getErcBalance(@Query("contractaddress")String contractAddress,@Query("address")String address);

    @GET("api?module=account&action=txlist&startblock=0&endblock=99999999&sort=desc&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<List<TransferInfoBean>>> getEthTranInfo(@Query("address")String address,@Query("page")int page,@Query("offset")int offset);

    @GET("api?module=account&action=tokentx&sort=desc&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<List<TransferInfoBean>>> getErcTranInfo(@Query("contractaddress")String contractAddress,@Query("address")String address,@Query("page")int page,@Query("offset")int offset);

    @GET("api?module=proxy&action=eth_getTransactionByHash&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<TradingBean>> getTranByHash(@Query("txhash")String txhash);

}
```

## public.trustwalletapp.com

```
public interface GetTokensApiService {
    @POST("tokens")
    Observable<BaseResponse<List<TokenCoinBean>>> getToken(@Body RequestBody body);

    @GET("tokens/list?networks=60")
    Observable<BaseResponse<List<TokenListBean>>> getTokenList(@Query("query") String query);

    @GET("ethereum/transactions")
    Observable<BaseResponse<List<TransferInfoBean>>> getTransferInfo(@Query("address") String address);

    @POST("prices")
    Observable<BaseResponse<List<PriceInfoBean>>> getPrice(@Body RequestBody body);
}
```

https://github.com/consenlabs



--------------


- 服务端根路径
```
    public static String baseUrl = "https://api.etherscan.io/";
    public static String trustUrl = "https://public.trustwalletapp.com/";
```

etherscan的接口
```
public interface GetTransferInfoApiService {
    @GET("api?module=proxy&action=eth_gasPrice&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<String>> getEthGasPrice();

    @GET("api?module=proxy&action=eth_getTransactionCount&tag=latest&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<String>> getNonce(@Query("address")String address);

    @GET("api?module=account&action=balance&tag=latest&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<String>> getBalance(@Query("address")String address);

    @POST("api?module=proxy&action=eth_sendRawTransaction&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<String>> sendRawTransaction(@Query("hex") String hex);

    @GET("api?module=account&action=balancemulti&tag=latest&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<List<BalanceBean>>> getEthBalances(@Query("address") String address);

    @GET("api?module=stats&action=ethprice&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<PriceBean>> getEthPrice();

    @GET("api?module=account&action=tokenbalance&tag=latest&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<String>> getErcBalance(@Query("contractaddress")String contractAddress,@Query("address")String address);

    @GET("api?module=account&action=txlist&startblock=0&endblock=99999999&sort=desc&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<List<TransferInfoBean>>> getEthTranInfo(@Query("address")String address,@Query("page")int page,@Query("offset")int offset);

    @GET("api?module=account&action=tokentx&sort=desc&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<List<TransferInfoBean>>> getErcTranInfo(@Query("contractaddress")String contractAddress,@Query("address")String address,@Query("page")int page,@Query("offset")int offset);

    @GET("api?module=proxy&action=eth_getTransactionByHash&apikey=B9JK9VADN4Z16YCZEB5NZQBGXTZSZZGC7R")
    Observable<BaseResponse<TradingBean>> getTranByHash(@Query("txhash")String txhash);
}
```

trustwalletapp的接口
```
public interface GetTokensApiService {
    @POST("tokens")
    Observable<BaseResponse<List<TokenCoinBean>>> getToken(@Body RequestBody body);

    @GET("tokens/list?networks=60")
    Observable<BaseResponse<List<TokenListBean>>> getTokenList(@Query("query") String query);

    @GET("ethereum/transactions")
    Observable<BaseResponse<List<TransferInfoBean>>> getTransferInfo(@Query("address") String address);

    @POST("prices")
    Observable<BaseResponse<List<PriceInfoBean>>> getPrice(@Body RequestBody body);
}
```