<template>
    <div class="com-account-wrap">
        <div class="acc-address">
            <!-- -->
            <strong class="acc-address-tit">代币</strong>
            <span class="acc-address-des"
                >{{ account_info.name }}（{{ account_info.symbol }}）</span
            >
        </div>
        <div class="bui-dlist" v-loading="loadingSwitch">
            <template v-if="IS_GET_INFO">
                <el-row>
                    <el-col :span="12">
                        <div class="block-item-des">
                            <strong class="bui-dlist-tit">
                                总供应量
                            </strong>
                            <div class="bui-dlist-det">
                                {{
                                    account_info.total
                                        | toTokenVal(
                                            Math.pow(10, account_info.precision)
                                        )
                                }}
                                {{ account_info.symbol }}
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="12">
                        <div class="block-item-des">
                            <strong class="bui-dlist-tit">
                                位数
                            </strong>
                            <div class="bui-dlist-det">
                                {{ account_info.precision }}
                            </div>
                        </div>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="12">
                        <div class="block-item-des">
                            <strong class="bui-dlist-tit">
                                持有者
                            </strong>
                            <div class="bui-dlist-det">
                                {{ account_info.account_count }}
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="12">
                        <div class="block-item-des">
                            <strong class="bui-dlist-tit">
                                交易数
                            </strong>
                            <div class="bui-dlist-det">
                                {{ account_info.transaction_count }} 次
                            </div>
                        </div>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="12">
                        <div class="block-item-des">
                            <strong class="bui-dlist-tit">
                                对应合约
                            </strong>
                            <div class="bui-dlist-det">
                                <router-link
                                    class="table-long-item"
                                    :to="'/account/' + address"
                                    >{{ address }}</router-link
                                >
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </template>
        </div>
    </div>
</template>
<script>
let self;
export default {
    name: "TokenInfo2",
    props: ["address"],
    data() {
        return {
            loadingSwitch: true,
            IS_GET_INFO: false,
            account_info: {
                name: "CRC Token",
                symbol: "Token",
                precision: 0,
                total: 0,
                transaction_count: "0",
                account_count: "0"
            }
        };
    },
    created() {
        self = this;
        self.initDatabase();
    },
    methods: {
        async initDatabase() {
            let opt = {
                account: this.address
            };
            let response = await self.$api.get("/api/get_token_info", opt);
            if (response.success) {
                let tokenInfo = response.data;
                self.account_info.name = tokenInfo.token_name || "CRC Token";
                self.account_info.symbol = tokenInfo.token_symbol || "Token";
                self.account_info.precision = tokenInfo.token_precision || 0;
                self.account_info.total = tokenInfo.token_total || 0;
                self.account_info.transaction_count =
                    tokenInfo.transaction_count || 0;
                self.account_info.account_count = tokenInfo.account_count || 0;
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        }
    }
};
</script>
<style scoped>
.com-account-wrap {
    border-top: 2px solid #28388c;
    padding: 13px 15px;
}
.acc-address-tit {
    margin-right: 10px;
}
.bui-dlist {
    margin: 40px 0;
}
.acc-address-des {
    color: #999;
    word-break: break-all;
}
</style>
