<template>
    <div class="page-account">
        <czr-header></czr-header>
        <div class="page-account-wrap">
            <div class="container">
                <div class="account-panel">
                    <account-info :address="address" v-on:address_props="handlerAddressProps"></account-info>
                </div>
                <div class="account-main">
                    <template>
                        <el-tabs v-model="activeName" @tab-click="change_table">
                            <el-tab-pane label="交易记录" name="transaction"></el-tab-pane>
                            <el-tab-pane label="代币余额" name="token_balances">
                                <account-assets
                                    :address="address"
                                    :url_parm="url_parm"
                                    v-on:account_assets_props="handlerAccountAssetsProps"
                                ></account-assets>
                                <!-- page -->
                                <template v-if="2">
                                    <div class="pagin-block">
                                        <el-button-group>
                                            <el-button
                                                size="mini"
                                                :disabled="
                                                            btnSwitch.header
                                                        "
                                                @click="
                                                            getPaginationFlag(
                                                                'header'
                                                            )
                                                        "
                                            >首页</el-button>
                                            <el-button
                                                size="mini"
                                                icon="el-icon-arrow-left"
                                                :disabled="
                                                            btnSwitch.left
                                                        "
                                                @click="
                                                            getPaginationFlag(
                                                                'left'
                                                            )
                                                        "
                                            >上一页</el-button>
                                            <el-button
                                                size="mini"
                                                :disabled="
                                                            btnSwitch.right
                                                        "
                                                @click="
                                                            getPaginationFlag(
                                                                'right'
                                                            )
                                                        "
                                            >
                                                下一页
                                                <i class="el-icon-arrow-right el-icon--right"></i>
                                            </el-button>
                                            <el-button
                                                size="mini"
                                                :disabled="
                                                            btnSwitch.footer
                                                        "
                                                @click="
                                                            getPaginationFlag(
                                                                'footer'
                                                            )
                                                        "
                                            >尾页</el-button>
                                        </el-button-group>
                                    </div>
                                </template>
                            </el-tab-pane>
                            <template v-if="account_props.is_has_token_trans">
                                <el-tab-pane label="代币转账" name="trans_token"></el-tab-pane>
                            </template>
                            <template v-if="account_props.is_has_intel_trans">
                                <el-tab-pane label="合约内交易" name="trans_internal"></el-tab-pane>
                            </template>
                            <template v-if="account_props.is_witness">
                                <el-tab-pane label="见证交易" name="trans_witness"></el-tab-pane>
                            </template>
                            <template v-if="account_props.is_has_event_logs">
                                <el-tab-pane label="事件日志" name="event_logs"></el-tab-pane>
                            </template>
                            <template v-if="account_props.account_type === 2">
                                <el-tab-pane label="合约创建代码" name="contract_code"></el-tab-pane>
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
import AccountAssets from "@/components/Account/Assets";

let self = null;

export default {
    name: "ContractCode",
    components: {
        CzrHeader,
        CzrFooter,
        AccountInfo,
        AccountAssets
    },
    data() {
        return {
            loadingSwitch: true,
            address: this.$route.params.id,
            activeName: "token_balances",
            account_props: {
                account_type: 1,
                is_witness: false,
                is_has_token_assets: false,
                is_has_token_trans: false,
                is_has_intel_trans: false,
                is_has_event_logs: false
            },
            account_assets_props: {
                first_index: 0,
                last_index: 0
            },
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            IS_GET_ACC: false,
            IS_GET_INFO: false,
            url_parm: {
                account: this.$route.params.id,
                position: this.$route.query.position || 1, //1 首页  2 上一页 3 下一页 4 尾页
                token_asset_id:
                    this.$route.query.token_asset_id || 9999999999999
            }
        };
    },
    created() {
        self = this;
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
        handlerAccountAssetsProps: function(props) {
            self.account_assets_props.first_index = props.first_index;
            self.account_assets_props.last_index = props.last_index;
            // console.log(props);
            self.getFlagTransactions();
        },

        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/account/${self.url_parm.account}/token_balances?token_asset_id=0&position=4`
                );
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(
                    `/account/${self.url_parm.account}/token_balances`
                );
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/account/${self.url_parm.account}/token_balances?token_asset_id=${self.account_assets_props.first_index}&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/account/${self.url_parm.account}/token_balances?token_asset_id=${self.account_assets_props.last_index}&position=3`
                );
                return;
            }
        },

        async getFlagTransactions() {
            let opt = {
                account: self.url_parm.account
            };
            let response = await self.$api.get(
                "/api/get_account_token_list_flag",
                opt
            );
            // console.log(response);
            if (response.success) {
                if (
                    response.near_item.token_asset_id ===
                    self.account_assets_props.first_index
                ) {
                    self.btnSwitch.header = true;
                    self.btnSwitch.left = true;
                }
                if (
                    response.end_item.token_asset_id ===
                    self.account_assets_props.last_index
                ) {
                    self.btnSwitch.right = true;
                    self.btnSwitch.footer = true;
                }
            }
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
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    break;
                case "trans_token":
                    this.$router.push(`/account/${self.address}/trans_token`);
                    break;
                case "trans_internal":
                    this.$router.push(
                        `/account/${self.address}/trans_internal`
                    );
                    break;
                case "trans_witness":
                    this.$router.push(`/account/${self.address}/trans_witness`);
                    break;
                case "event_logs":
                    this.$router.push(`/account/${self.address}/event_logs`);
                    break;
                case "contract_code":
                    this.$router.push(`/account/${self.address}/contract_code`);
                    break;
            }
        }
    }
};
</script>