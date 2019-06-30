<template>
    <div class="com-account-wrap">
        <div class="acc-address">
            <!-- -->
            <strong class="acc-address-tit">账户地址</strong>
            <span class="acc-address-des">{{ address }}</span>
        </div>
        <div class="bui-dlist" v-loading="loadingSwitch">
            <template v-if="IS_GET_ACC">
                <el-row>
                    <el-col :span="12">
                        <div class="block-item-des">
                            <strong class="bui-dlist-tit">交易类型</strong>
                            <div class="bui-dlist-det">
                                <template v-if="account_info.type == 2">合约账户</template>
                                <template v-else>普通账户</template>
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="12">
                        <div class="block-item-des">
                            <strong class="bui-dlist-tit">交易数</strong>
                            <div class="bui-dlist-det">{{ account_info.total }} 次</div>
                        </div>
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="12">
                        <div class="block-item-des">
                            <strong class="bui-dlist-tit">余额</strong>
                            <div class="bui-dlist-det">{{ account_info.balance | toCZRVal }} CZR</div>
                        </div>
                    </el-col>
                    <template v-if="account_info.type == 2">
                        <el-col :span="12">
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">合约创建</strong>
                                <div class="bui-dlist-det">
                                    <router-link
                                        class="table-long-item"
                                        :to="
                                            '/account/' +
                                                account_info.own_account
                                        "
                                    >
                                        {{
                                        account_info.own_account
                                        }}
                                    </router-link>创建于
                                    <router-link
                                        class="table-long-item"
                                        :to="'/block/' + account_info.born_unit"
                                    >
                                        {{
                                        account_info.born_unit
                                        }}
                                    </router-link>
                                </div>
                            </div>
                        </el-col>
                    </template>
                </el-row>
                <template v-if="account_info.type == 2">
                    <template v-if="account_info.is_token_account">
                        <el-row>
                            <el-col :span="12">
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">对应代币</strong>
                                    <div class="bui-dlist-det">
                                        <router-link
                                            class="table-long-item"
                                            :to="'/token/' + address"
                                        >
                                            {{
                                            account_info.symbol
                                            }}
                                        </router-link>
                                    </div>
                                </div>
                            </el-col>
                        </el-row>
                    </template>
                </template>
            </template>
        </div>
    </div>
</template>
<script>
let self;
export default {
    name: "AccountInfo",
    props: ["address"],
    data() {
        return {
            loadingSwitch: true,
            IS_GET_ACC: false,
            account_info: {
                total: 0,
                balance: 0,
                type: 1,
                is_token_account: false,
                own_account: "",
                born_unit: "",
                symbol: ""
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
            let response = await self.$api.get("/api/get_account", opt);
            if (response.success) {
                let accInfo = response.account;
                self.account_info.total = Number(accInfo.transaction_count);
                self.account_info.balance = accInfo.balance;
                self.account_info.type = accInfo.type;
                self.account_info.is_token_account = accInfo.is_token_account;

                let addrsss_props = {
                    account_type: accInfo.type,
                    is_token_account: accInfo.is_token_account,
                    is_has_token_assets: accInfo.is_has_token_assets,
                    is_has_token_trans: accInfo.is_has_token_trans,
                    is_has_intel_trans: accInfo.is_has_intel_trans,
                    is_has_event_logs: accInfo.is_has_event_logs,
                    is_witness: accInfo.is_witness
                };
                self.$emit("address_props", addrsss_props);
            } else {
                console.error("/api/get_account Error");
            }
            //如果是合约账户，要获取对应信息
            if (self.account_info.type === 2) {
                let responseToken = await self.$api.get(
                    "/api/get_contract",
                    opt
                );
                if (response.success) {
                    let tokenInfo = responseToken.data; //token
                    self.account_info.own_account = tokenInfo.own_account;
                    self.account_info.born_unit = tokenInfo.born_unit;
                    self.account_info.symbol = tokenInfo.token_symbol;
                } else {
                    console.error("/api/get_contract Error");
                }
            }
            self.loadingSwitch = false;
            self.IS_GET_ACC = true;
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
