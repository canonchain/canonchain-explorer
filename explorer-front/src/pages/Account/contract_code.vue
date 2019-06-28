<template>
    <div class="page-account">
        <czr-header></czr-header>
        <div class="page-account-wrap">
            <div class="container">
                <div class="account-panel">
                    <account-info
                        :address="address"
                        v-on:address_props="handlerAddressProps"
                    ></account-info>
                </div>
                <div class="account-main">
                    <template>
                        <el-tabs v-model="activeName" @tab-click="change_table">
                            <el-tab-pane
                                label="交易记录"
                                name="transaction"
                            ></el-tab-pane>

                            <template v-if="account_props.is_has_token_assets">
                                <!-- is_has_token_assets 应该为 is_has_token -->
                                <el-tab-pane
                                    label="代币余额"
                                    name="token_balances"
                                >
                                </el-tab-pane>
                            </template>
                            <template v-if="account_props.is_has_token_trans">
                                <el-tab-pane
                                    label="代币转账"
                                    name="trans_token"
                                ></el-tab-pane
                            ></template>
                            <template v-if="account_props.is_has_intel_trans">
                                <el-tab-pane
                                    label="合约内交易"
                                    name="trans_internal"
                                ></el-tab-pane>
                            </template>
                            <template v-if="account_props.is_has_event_logs">
                                <el-tab-pane
                                    label="事件日志"
                                    name="event_logs"
                                ></el-tab-pane>
                            </template>
                            <template v-if="account_props.account_type === 2">
                                <el-tab-pane
                                    label="合约创建代码"
                                    name="contract_code"
                                >
                                    <div class="accounts-main-wrap">
                                        <div v-loading="loadingSwitch">
                                            <template v-if="IS_GET_INFO">
                                                <pre class="contract-code">{{
                                                    contract_code
                                                }}</pre>
                                            </template>
                                        </div>
                                    </div>
                                </el-tab-pane>
                            </template>
                        </el-tabs>
                    </template>
                </div>
            </div>
        </div>
        <czr-footer></czr-footer>
    </div>
</template>

<script>
import CzrHeader from "@/components/Header/Header";
import CzrFooter from "@/components/Footer/Footer";
import AccountInfo from "@/components/Account/Info";

let self = null;

export default {
    name: "ContractCode",
    components: {
        CzrHeader,
        CzrFooter,
        AccountInfo
    },
    data() {
        return {
            loadingSwitch: true,
            address: this.$route.params.id,
            activeName: "contract_code",
            account_props: {
                account_type: 2,
                is_witness: false,
                is_has_token_assets: false,
                is_has_token_trans: false,
                is_has_intel_trans: false,
                is_has_event_logs: false
            },

            IS_GET_ACC: false,
            IS_GET_INFO: false,

            // 合约代码
            contract_code: ""
        };
    },
    created() {
        self = this;
        self.getContractCode();
    },
    methods: {
        handlerAddressProps: function(props) {
            self.account_props.account_type = props.account_type;
            self.account_props.is_witness = props.is_witness;
            self.account_props.is_has_token_assets = props.is_has_token_assets;
            self.account_props.is_has_token_trans = props.is_has_token_trans;
            self.account_props.is_has_intel_trans = props.is_has_intel_trans;
            self.account_props.is_has_event_logs = props.is_has_event_logs;
        },

        // 合约相关的
        change_table(tab, event) {
            /**
             * 0 交易记录
             * 1 Token转账
             * 2 合约内交易
             * 3 事件日志
             * 4 合约创建代码
             */
            self.IS_GET_INFO = false;
            self.loadingSwitch = true;
            switch (tab.name) {
                case "transaction":
                    this.$router.push(`/account/${self.address}`);
                    break;
                case "token_balances":
                    this.$router.push(`/account/${self.address}/token_balances`);
                    break;
                case "trans_token":
                    this.$router.push(`/account/${self.address}/trans_token`);
                    break;
                case "trans_internal":
                    this.$router.push(
                        `/account/${self.address}/trans_internal`
                    );
                    break;
                case "event_logs":
                    this.$router.push(`/account/${self.address}/event_logs`);
                    break;
                case "contract_code":
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    break;
            }
        },
        async getContractCode() {
            let opt = {
                account: self.address
            };
            let response = await self.$api.get("/api/get_contract_code", opt);

            if (response.success) {
                self.contract_code = response.data.code;
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        }
    }
};
</script>