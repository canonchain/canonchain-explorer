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

                            <template v-if="account_props.is_token_account">
                                <!-- is_token_account 应该为 is_has_token -->
                                <el-tab-pane
                                    label="代币余额"
                                    name="token_balances"
                                >
                                </el-tab-pane>
                            </template>
                            <el-tab-pane label="代币转账" name="trans_token">
                                <div
                                    class="accounts-main-wrap"
                                    v-loading="loadingSwitch"
                                >
                                    <template v-if="IS_GET_INFO">
                                        <token-trans
                                            :database="trans_token"
                                        ></token-trans>
                                        <!-- page -->
                                        <template v-if="trans_token.length">
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
                                                        >首页</el-button
                                                    >
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
                                                        >上一页</el-button
                                                    >
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
                                                        <i
                                                            class="el-icon-arrow-right el-icon--right"
                                                        ></i>
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
                                                        >尾页</el-button
                                                    >
                                                </el-button-group>
                                            </div>
                                        </template>
                                    </template>
                                </div>
                            </el-tab-pane>
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
                                ></el-tab-pane>
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
import TokenTrans from "@/components/List/TokenTrans";

let self = null;

//TODO 交易列表改为 发送 和 接收 两个List ,解决sql搜索慢的问题

export default {
    name: "TransToken",
    components: {
        CzrHeader,
        CzrFooter,
        AccountInfo,
        TokenTrans
    },
    data() {
        return {
            loadingSwitch: true,
            address: this.$route.params.id,
            activeName: "trans_token",
            account_props: {
                account_type: 1,
                is_witness: false,
                is_token_account: false,
                is_has_token_trans: false,
                is_has_intel_trans: false,
                is_has_event_logs: false
            },

            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            IS_GET_INFO: false,

            pageFirstItem: {
                stable_index: 0
            },
            pageLastItem: {
                stable_index: 0
            },
            first_trans_token_id: "",
            end_trans_token_id: "",
            url_parm: {
                account: this.$route.params.id,
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                stable_index: 999999999999,
                source: this.$route.query.source || "1" //1 发送方 2 接收方 3见证交易
            },

            // Token转账
            trans_token: []
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length > 1) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.stable_index = queryInfo.stable_index;
            self.url_parm.source = queryInfo.source;
        }
        self.getFlagTransactions(self.url_parm);
    },
    methods: {
        handlerAddressProps: function(props) {
            self.account_props.account_type = props.account_type;
            self.account_props.is_witness = props.is_witness;
            self.account_props.is_token_account = props.is_token_account;
            self.account_props.is_has_token_trans = props.is_has_token_trans;
            self.account_props.is_has_intel_trans = props.is_has_intel_trans;
            self.account_props.is_has_event_logs = props.is_has_event_logs;
        },

        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/trans_token?stable_index=0&source=${
                        self.url_parm.source
                    }&position=4`
                );
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(
                    `/account/${self.url_parm.account}/trans_token?source=${
                        self.url_parm.source
                    }`
                );
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/trans_token?stable_index=${
                        self.pageFirstItem.stable_index
                    }&source=${self.url_parm.source}&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/trans_token?stable_index=${
                        self.pageLastItem.stable_index
                    }&source=${self.url_parm.source}&position=3`
                );
                return;
            }
        },
        handlerChange(val) {
            self.$router.push(
                `/account/${self.url_parm.account}/trans_token?source=${val}`
            );
        },

        async getFlagTransactions() {
            //获取交易表首位值；用来禁用首页和尾页的
            let opt = {
                source: self.url_parm.source,
                account: self.url_parm.account
            };
            let response = await self.$api.get(
                "/api/get_trans_token_flag",
                opt
            );

            if (response.success) {
                self.first_trans_token_id = response.near_item.stable_index;
                self.end_trans_token_id = response.end_item.stable_index;
                self.getTransactions(self.url_parm);
            } else {
                console.log("error");
            }
        },
        async getTransactions(parm) {
            //TODO 没有搜见证交易
            self.loadingSwitch = true;
            let opt = {
                position: parm.position,
                source: parm.source,
                account: parm.account,
                stable_index: parm.stable_index
            };
            let response = await self.$api.get("/api/get_trans_token", opt);

            response ={"data":[{"stable_index":"4572","hash":"D440EC61C72FA4B6CE761F485A5E8282DE1D5CA93327E71DC1444D366E5511A8","mc_timestamp":"1560942394","from":"czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u","to":"czr_3juP4ekGuk66hA78XJb9XcJxCAaPff5a1K5W2eiehvmucjwotk","contract_account":"czr_3juP4ekGuk66hA78XJb9XcJxCAaPff5a1K5W2eiehvmucjwotk","token_symbol":"CZR","amount":"1000","is_from_this_account":true,"is_to_self":false},{"stable_index":"1550","hash":"D754E6877A0690485E9CA88FDB8C69E2B3A979387E77EF7B55E407427555D993","mc_timestamp":"1560935736","from":"czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u","to":"czr_4TNETbF8uHhc9EUeVgmYZ2hK2anMeR97fDqktcKrqw2pTCc3mh","contract_account":"czr_39MpJnk99DGQ1CBbykBsLrTM3gFvhecPnddTSRS9UPvZW2sGex","token_symbol":"CZR","amount":"1000","is_from_this_account":true,"is_to_self":false},{"stable_index":"1528","hash":"04963AF05A93DC30B2B452E454904DEDEBDE2B87EE189DF57D9A472A6A97B0D4","mc_timestamp":"1560935698","from":"czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u","to":"czr_39MpJnk99DGQ1CBbykBsLrTM3gFvhecPnddTSRS9UPvZW2sGex","contract_account":"czr_39MpJnk99DGQ1CBbykBsLrTM3gFvhecPnddTSRS9UPvZW2sGex","token_symbol":"CZR","amount":"1000","is_from_this_account":true,"is_to_self":false},{"stable_index":"1463","hash":"17C9362DA0AFAED22E5058E3B133E0FE8EB70438F308EAC0E34E7B59DD68F631","mc_timestamp":"1560935572","from":"czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u","to":"czr_3VkT7AyHU1aSGrobJwrehtYBPy2WLXf4iWLvYzPVrThiy5XukM","contract_account":"czr_4iZgmaLrAzN6j6LY7AeTwGMmNXSU1v9KCrxiRTpQvagn4Bw8yT","token_symbol":"CZR","amount":"1000","is_from_this_account":true,"is_to_self":false},{"stable_index":"1440","hash":"EA2441B58472D966F4FB616BAA1B1FF17E218D3305E1E44665C5AE032F1FD3DF","mc_timestamp":"1560935531","from":"czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u","to":"czr_4iZgmaLrAzN6j6LY7AeTwGMmNXSU1v9KCrxiRTpQvagn4Bw8yT","contract_account":"czr_4iZgmaLrAzN6j6LY7AeTwGMmNXSU1v9KCrxiRTpQvagn4Bw8yT","token_symbol":"CZR","amount":"1000","is_from_this_account":true,"is_to_self":false},{"stable_index":"81","hash":"AC0ACE75A42E86FFE6904F3A177228820ADB914C9114F522B347FBC9927EB219","mc_timestamp":"1560932383","from":"czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u","to":"czr_4ijLBfazi1biZoZ6grfkXyoF4hjUHVXcDGQ2MXPgcWNDAs4Z38","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","token_symbol":"CZR","amount":"1000","is_from_this_account":true,"is_to_self":false},{"stable_index":"56","hash":"B6A6021799701EDC1683D1410A6AED69A5920F6D019AD2BAC142B03ACF4930D4","mc_timestamp":"1560932344","from":"czr_33EuccjKjcZgwbHYp8eLhoFiaKGARVigZojeHzySD9fQ1ysd7u","to":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","token_symbol":"CZR","amount":"1000","is_from_this_account":true,"is_to_self":false}],"code":200,"success":true,"message":"success"}

            if (response.success) {
                self.trans_token = response.data;
                if (response.data.length) {
                    self.pageFirstItem = response.data[0];
                    self.pageLastItem = response.data[response.data.length - 1];
                } else {
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    return;
                }
            } else {
                self.trans_token = [];
            }
            //禁止首页上一页
            if (parm.position === "1") {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            } else if (parm.position === "4") {
                self.btnSwitch.right = true;
                self.btnSwitch.footer = true;
            }
            if (self.trans_token.length > 0) {
                if (
                    self.first_trans_token_id ===
                    self.pageFirstItem.stable_index
                ) {
                    self.btnSwitch.header = true;
                    self.btnSwitch.left = true;
                }

                if (
                    self.end_trans_token_id === self.pageLastItem.stable_index
                ) {
                    self.btnSwitch.right = true;
                    self.btnSwitch.footer = true;
                }
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        goBlockPath(block) {
            this.$router.push("/block/" + block);
        },
        goAccountPath(account) {
            this.$router.push("/account/" + account);
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
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
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
                    this.$router.push(`/account/${self.address}/contract_code`);
                    break;
            }
        }
    }
};
</script>