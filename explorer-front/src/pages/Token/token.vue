<template>
    <div class="page-account">
        <czr-header></czr-header>
        <div class="page-account-wrap">
            <div class="container">
                <div class="account-panel" v-loading="loadingSwitch">
                    <template v-if="IS_GET_INFO">
                        <token-info
                            :name="accountInfo.token_name"
                            :symbol="accountInfo.token_symbol"
                            :total="accountInfo.token_total"
                            :precision="accountInfo.token_precision"
                            :account_count="accountInfo.account_count"
                            :transaction_count="accountInfo.transaction_count"
                            :contract_account="accountInfo.contract_account"
                        ></token-info>
                    </template>
                </div>
                <div class="account-main">
                    <el-tabs v-model="activeName" @tab-click="change_table">
                        <el-tab-pane label="代币转账" name="transaction">
                            <div class="account-content">
                                <div
                                    class="accounts-list-wrap"
                                    v-loading="loadingSwitch"
                                >
                                    <template v-if="IS_GET_INFO">
                                        <el-table
                                            :data="trans_token"
                                            style="width: 100%"
                                        >
                                            <el-table-column
                                                label="时间"
                                                width="180"
                                            >
                                                <template slot-scope="scope">
                                                    <span
                                                        class="table-long-item"
                                                        >{{
                                                            scope.row
                                                                .mc_timestamp
                                                                | toDate
                                                        }}</span
                                                    >
                                                </template>
                                            </el-table-column>
                                            <el-table-column
                                                label="交易号"
                                                width="180"
                                            >
                                                <template slot-scope="scope">
                                                    <router-link
                                                        class="table-long-item"
                                                        :to="{
                                                            path:
                                                                '/block/' +
                                                                scope.row.hash
                                                        }"
                                                        >{{
                                                            scope.row.hash
                                                        }}</router-link
                                                    >
                                                </template>
                                            </el-table-column>
                                            <el-table-column
                                                label="发款方"
                                                width="180"
                                            >
                                                <template slot-scope="scope">
                                                    <router-link
                                                        class="table-long-item"
                                                        :to="{
                                                            path:
                                                                '/account/' +
                                                                scope.row.from
                                                        }"
                                                        >{{
                                                            scope.row.from
                                                        }}</router-link
                                                    >
                                                </template>
                                            </el-table-column>
                                            <el-table-column
                                                label="收款方"
                                                width="180"
                                            >
                                                <template slot-scope="scope">
                                                    <router-link
                                                        class="table-long-item"
                                                        :to="{
                                                            path:
                                                                '/account/' +
                                                                scope.row.to
                                                        }"
                                                        >{{
                                                            scope.row.to
                                                        }}</router-link
                                                    >
                                                </template>
                                            </el-table-column>
                                            <el-table-column
                                                label="数量"
                                                align="right"
                                            >
                                                <template slot-scope="scope">
                                                    <span>{{
                                                        scope.row.amount
                                                            | toCZRVal
                                                    }}</span>
                                                </template>
                                            </el-table-column>
                                        </el-table>

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
                            </div>
                        </el-tab-pane>
                        <el-tab-pane label="持有者" name="holder"></el-tab-pane>
                    </el-tabs>
                </div>
            </div>
        </div>
        <czr-footer></czr-footer>
    </div>
</template>

<script>
import CzrHeader from "@/components/Header/Header";
import CzrFooter from "@/components/Footer/Footer";
import TokenInfo from "@/components/Token/TokenInfo";

let self = null;

export default {
    name: "Token",
    components: {
        CzrHeader,
        CzrFooter,
        TokenInfo
    },
    data() {
        return {
            loadingSwitch: true,
            IS_GET_TOKEN: false,
            IS_GET_INFO: false,
            accountInfo: {
                contract_account: this.$route.params.id,
                token_name: "",
                token_symbol: "",
                token_precision: "",
                token_total: "",
                transaction_count: "",
                account_count: ""
            },
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
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
                stable_index: 999999999999
            },

            // change
            activeName: "transaction",
            trans_token: []
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length > 1) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.stable_index = queryInfo.stable_index;
        }
        self.getTokenInfo();
        self.getFlagTransactions();
    },
    methods: {
        async getTokenInfo() {
            let opt = {
                account: self.accountInfo.contract_account
            };
            let response = await self.$api.get("/api/get_token_info", opt);

            if (response.success) {
                let tokenInfo = response.data;
                self.accountInfo.token_name = tokenInfo.token_name;
                self.accountInfo.token_symbol = tokenInfo.token_symbol;
                self.accountInfo.token_precision = tokenInfo.token_precision;
                self.accountInfo.token_total = tokenInfo.token_total;

                self.accountInfo.transaction_count =
                    tokenInfo.transaction_count;
                self.accountInfo.account_count = tokenInfo.account_count;
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/token/${self.url_parm.account}?stable_index=0&position=4`
                );
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(`/token/${self.url_parm.account}`);
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/token/${self.url_parm.account}?stable_index=${
                        self.pageFirstItem.stable_index
                    }&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/token/${self.url_parm.account}?stable_index=${
                        self.pageLastItem.stable_index
                    }&position=3`
                );
                return;
            }
        },

        async getFlagTransactions() {
            //获取交易表首位值；用来禁用首页和尾页的
            let opt = {
                account: self.url_parm.account
            };
            let response = await self.$api.get(
                "/api/get_token_trans_flag",
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
                account: parm.account,
                stable_index: parm.stable_index
            };
            let response = await self.$api.get("/api/get_token_trans", opt);

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

        // 合约相关的
        change_table(tab, event) {
            switch (tab.name) {
                case "transaction":
                    break;
                case "holder":
                    this.$router.push(
                        `/token/${self.accountInfo.contract_account}/holder`
                    );
                    break;
            }
        }
    }
};
</script>