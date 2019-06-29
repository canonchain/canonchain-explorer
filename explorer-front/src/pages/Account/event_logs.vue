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

                            <template v-if="account_props.is_has_token_assets">
                                <!-- is_has_token_assets 应该为 is_has_token -->
                                <el-tab-pane label="代币余额" name="token_balances"></el-tab-pane>
                            </template>
                            <template v-if="account_props.is_has_token_trans">
                                <el-tab-pane label="代币转账" name="trans_token"></el-tab-pane>
                            </template>
                            <template v-if="account_props.is_has_intel_trans">
                                <el-tab-pane label="合约内交易" name="trans_internal"></el-tab-pane>
                            </template>
                            <el-tab-pane label="事件日志" name="event_logs">
                                <div class="accounts-main-wrap" v-loading="loadingSwitch">
                                    <template v-if="IS_GET_INFO">
                                        <event-logs :database="event_logs"></event-logs>

                                        <!-- page -->
                                        <template v-if="event_logs.length">
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
                                                    >尾页</el-button>
                                                </el-button-group>
                                            </div>
                                        </template>
                                    </template>
                                </div>
                            </el-tab-pane>
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
import EventLogs from "@/components/List/EventLogs";

let self = null;

export default {
    name: "ContractCode",
    components: {
        CzrHeader,
        CzrFooter,
        AccountInfo,
        EventLogs
    },
    data() {
        return {
            loadingSwitch: true,
            address: this.$route.params.id,
            activeName: "event_logs",
            account_props: {
                account_type: 1,
                is_witness: false,
                is_has_token_assets: false,
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
                stable_index: 9999999999999,
                index_translog_id: 9999999999999,
                event_log_id: 9999999999999
            },
            pageLastItem: {
                stable_index: 0,
                index_translog_id: 0,
                event_log_id: 0
            },
            first_stable_index: "",
            end_stable_index: "",
            url_parm: {
                account: this.$route.params.id,
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                stable_index: 9999999999999,
                index_translog_id: 9999999999999,
                event_log_id: 9999999999999
            },

            // 合约代码
            event_logs: []
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length > 1) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.stable_index = queryInfo.stable_index;
            self.url_parm.index_translog_id = queryInfo.index_translog_id;
            self.url_parm.event_log_id = queryInfo.event_log_id;
        }
        self.getFlagEventLog(self.url_parm);
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
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/event_logs?stable_index=0&index_translog_id=0&event_log_id=0&position=4`
                );
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(
                    `/account/${self.url_parm.account}/event_logs`
                );
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/event_logs?stable_index=${
                        self.pageFirstItem.stable_index
                    }&index_translog_id=${
                        self.pageFirstItem.index_translog_id
                    }&event_log_id=${
                        self.pageFirstItem.event_log_id
                    }&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/event_logs?stable_index=${
                        self.pageLastItem.stable_index
                    }&index_translog_id=${
                        self.pageLastItem.index_translog_id
                    }&event_log_id=${self.pageLastItem.event_log_id}&position=3`
                );

                return;
            }
        },

        async getFlagEventLog() {
            //获取交易表首位值；用来禁用首页和尾页的
            let opt = {
                account: self.url_parm.account
            };
            let response = await self.$api.get("/api/get_event_log_flag", opt);
            if (response.success) {
                self.first_stable_index = response.near_item.stable_index;
                self.end_stable_index = response.end_item.stable_index;
                self.getEventLog(self.url_parm);
            } else {
                // console.log("error");
            }
        },
        async getEventLog(parm) {
            //TODO 没有搜见证交易
            self.loadingSwitch = true;
            let opt = {
                account: parm.account,
                position: parm.position,
                stable_index: parm.stable_index,
                index_translog_id: parm.index_translog_id,
                event_log_id: parm.event_log_id
            };
            let response = await self.$api.get("/api/get_event_log", opt);

            if (response.success) {
                self.event_logs = response.transactions;

                if (response.transactions.length) {
                    let firstTrans = response.transactions[0];
                    let lastTrans =
                        response.transactions[response.transactions.length - 1];
                    self.pageFirstItem.stable_index = firstTrans.stable_index;
                    self.pageFirstItem.index_translog_id =
                        firstTrans.index_translog_id;
                    self.pageFirstItem.event_log_id = firstTrans.event_log_id;

                    self.pageLastItem.stable_index = lastTrans.stable_index;
                    self.pageLastItem.index_translog_id =
                        lastTrans.index_translog_id;
                    self.pageLastItem.event_log_id = lastTrans.event_log_id;
                } else {
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    return;
                }
            } else {
                self.event_logs = [];
            }
            //禁止首页上一页
            if (parm.position === "1") {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            } else if (parm.position === "4") {
                self.btnSwitch.right = true;
                self.btnSwitch.footer = true;
            }

            if (self.event_logs.length > 0) {
                if (
                    self.first_stable_index === self.pageFirstItem.stable_index
                ) {
                    self.btnSwitch.header = true;
                    self.btnSwitch.left = true;
                }

                if (self.end_stable_index === self.pageLastItem.stable_index) {
                    self.btnSwitch.right = true;
                    self.btnSwitch.footer = true;
                }
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
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
                    this.$router.push(
                        `/account/${self.address}/token_balances`
                    );
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
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    break;
                case "contract_code":
                    this.$router.push(`/account/${self.address}/contract_code`);
                    break;
            }
        }
    }
};
</script>