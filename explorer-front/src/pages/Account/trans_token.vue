<template>
    <div class="page-account">
        <czr-header></czr-header>
        <div class="page-account-wrap">
            <div class="container">
                <div class="account-panel" v-loading="loadingSwitch">
                    <template v-if="IS_GET_ACC">
                        <account-info
                            :address="accountInfo.address"
                            :type="accountInfo.type"
                            :is_token="accountInfo.is_token_account"
                            :balance="accountInfo.balance"
                            :total="accountInfo.total"
                            :own_account="accountInfo.own_account"
                            :born_unit="accountInfo.born_unit"
                            :symbol="accountInfo.symbol"
                        ></account-info>
                    </template>
                </div>
                <div class="account-main">
                    <template>
                        <el-tabs v-model="activeName" @tab-click="change_table">
                            <el-tab-pane
                                label="交易记录"
                                name="transaction"
                            ></el-tab-pane>
                            <el-tab-pane label="Token转账" name="trans_token">
                                <div class="account-content">
                                    <el-row>
                                        <el-col :span="6">
                                            <h2 class="transfer-tit">
                                                Token转账
                                            </h2>
                                        </el-col>
                                        <el-col
                                            :span="18"
                                            style="text-align: right;"
                                        >
                                            <template>
                                                <el-radio
                                                    v-model="url_parm.source"
                                                    label="1"
                                                    @change="handlerChange"
                                                    >发送</el-radio
                                                >
                                                <el-radio
                                                    v-model="url_parm.source"
                                                    label="2"
                                                    @change="handlerChange"
                                                    >接收</el-radio
                                                >
                                            </template>
                                        </el-col>
                                    </el-row>
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
                                                    <template
                                                        slot-scope="scope"
                                                    >
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
                                                    <template
                                                        slot-scope="scope"
                                                    >
                                                        <el-button
                                                            @click="
                                                                goBlockPath(
                                                                    scope.row
                                                                        .hash
                                                                )
                                                            "
                                                            type="text"
                                                        >
                                                            <span
                                                                class="table-long-item"
                                                                >{{
                                                                    scope.row
                                                                        .hash
                                                                }}</span
                                                            >
                                                        </el-button>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column
                                                    label="发款方"
                                                    width="180"
                                                >
                                                    <template
                                                        slot-scope="scope"
                                                    >
                                                        <template
                                                            v-if="
                                                                scope.row
                                                                    .is_from_this_account ==
                                                                    false
                                                            "
                                                        >
                                                            <el-button
                                                                @click="
                                                                    goAccountPath(
                                                                        scope
                                                                            .row
                                                                            .from
                                                                    )
                                                                "
                                                                type="text"
                                                            >
                                                                <span
                                                                    class="table-long-item"
                                                                    >{{
                                                                        scope
                                                                            .row
                                                                            .from
                                                                    }}</span
                                                                >
                                                            </el-button>
                                                        </template>
                                                        <template v-else>
                                                            <span
                                                                class="table-long-item"
                                                                >{{
                                                                    scope.row
                                                                        .from
                                                                }}</span
                                                            >
                                                        </template>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column>
                                                    <template
                                                        slot-scope="scope"
                                                    >
                                                        <span>
                                                            <el-button
                                                                v-if="
                                                                    scope.row
                                                                        .is_from_this_account ==
                                                                        true &&
                                                                        scope
                                                                            .row
                                                                            .is_to_self ==
                                                                            false
                                                                "
                                                                type="warning"
                                                                size="mini"
                                                                >转出</el-button
                                                            >

                                                            <el-button
                                                                v-else-if="
                                                                    scope.row
                                                                        .is_from_this_account ==
                                                                        true &&
                                                                        scope
                                                                            .row
                                                                            .is_to_self ==
                                                                            true &&
                                                                        scope
                                                                            .row
                                                                            .mci >
                                                                            0
                                                                "
                                                                size="mini"
                                                            >
                                                                <i
                                                                    class="el-icon-sort trans-to-self"
                                                                ></i>
                                                            </el-button>

                                                            <el-button
                                                                v-else-if="
                                                                    scope.row
                                                                        .is_from_this_account ==
                                                                        true &&
                                                                        scope
                                                                            .row
                                                                            .is_to_self ==
                                                                            true &&
                                                                        scope
                                                                            .row
                                                                            .mci <=
                                                                            0
                                                                "
                                                                type="success"
                                                                size="mini"
                                                                >转入</el-button
                                                            >

                                                            <el-button
                                                                v-else
                                                                type="success"
                                                                size="mini"
                                                                >转入</el-button
                                                            >
                                                        </span>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column
                                                    label="收款方"
                                                    width="180"
                                                >
                                                    <template
                                                        slot-scope="scope"
                                                    >
                                                        <template
                                                            v-if="scope.row.to"
                                                        >
                                                            <template
                                                                v-if="
                                                                    scope.row
                                                                        .is_from_this_account ==
                                                                        true &&
                                                                        scope
                                                                            .row
                                                                            .is_to_self ==
                                                                            false
                                                                "
                                                            >
                                                                <el-button
                                                                    @click="
                                                                        goAccountPath(
                                                                            scope
                                                                                .row
                                                                                .to
                                                                        )
                                                                    "
                                                                    type="text"
                                                                >
                                                                    <span
                                                                        class="table-long-item"
                                                                        >{{
                                                                            scope
                                                                                .row
                                                                                .to
                                                                        }}</span
                                                                    >
                                                                </el-button>
                                                            </template>
                                                            <template v-else>
                                                                <span
                                                                    class="table-long-item"
                                                                    >{{
                                                                        scope
                                                                            .row
                                                                            .to
                                                                    }}</span
                                                                >
                                                            </template>
                                                        </template>
                                                        <template v-else>
                                                            <span>-</span>
                                                        </template>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column
                                                    label="代币"
                                                    width="230"
                                                    align="right"
                                                >
                                                    <template
                                                        slot-scope="scope"
                                                    >
                                                        <span
                                                            >{{
                                                                scope.row
                                                                    .amount
                                                                    | toCZRVal
                                                            }}
                                                            {{
                                                                scope.row
                                                                    .token_symbol
                                                            }}</span
                                                        >
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
                            <el-tab-pane
                                label="合约内交易"
                                name="trans_internal"
                            ></el-tab-pane>
                            <el-tab-pane
                                label="事件日志"
                                name="event_logs"
                            ></el-tab-pane>
                            <template v-if="accountInfo.type === 2">
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
import AccountInfo from "@/components/Account/account-info";

let self = null;
let isDefaultPage = false;

//TODO 交易列表改为 发送 和 接收 两个List ,解决sql搜索慢的问题

export default {
    name: "Block",
    components: {
        CzrHeader,
        CzrFooter,
        AccountInfo
    },
    data() {
        return {
            loadingSwitch: true,
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            IS_GET_INFO: false,
            IS_GET_ACC: false,
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
            accountInfo: {
                address: this.$route.params.id,
                total: 0,
                balance: 0,
                type: 1,
                is_witness: false,
                transaction_count: 0,
                is_token_account: false,
                is_has_token_trans: false,
                is_has_intel_trans: false,
                is_has_event_logs: false,
                own_account: "",
                born_unit: "",
                symbol: ""
            },
            // change
            activeName: "trans_token",
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
        self.initDatabase();
        self.getFlagTransactions(self.url_parm);
    },
    methods: {
        async initDatabase() {
            let opt = {
                account: self.accountInfo.address
            };
            let response = await self.$api.get("/api/get_account", opt);

            if (response.success) {
                let accInfo = response.account;
                self.accountInfo.total = Number(accInfo.transaction_count);
                self.accountInfo.balance = accInfo.balance;
                self.accountInfo.type = accInfo.type;

                //是否为Token合约
                self.accountInfo.is_token_account = accInfo.is_token_account;
                //是否有Token交易
                self.accountInfo.is_has_token_trans =
                    accInfo.is_has_token_trans;
                //是否有是否有内部交易
                self.accountInfo.is_has_intel_trans =
                    accInfo.is_has_intel_trans;
                //是否有事件日志
                self.accountInfo.is_has_event_logs = accInfo.is_has_event_logs;
            } else {
                console.error("/api/get_account Error");
            }
            //如果是合约账户，要获取对应信息
            if (self.accountInfo.type === 2) {
                let responseToken = await self.$api.get(
                    "/api/get_contract",
                    opt
                );
                if (response.success) {
                    let tokenInfo = responseToken.data; //token
                    self.accountInfo.own_account = tokenInfo.own_account;
                    self.accountInfo.born_unit = tokenInfo.born_unit;
                    self.accountInfo.symbol = tokenInfo.token_symbol;
                } else {
                    console.error("/api/get_contract Error");
                }
            }
            self.IS_GET_ACC = true;
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
                    this.$router.push(`/account/${self.accountInfo.address}`);
                    break;
                case "trans_token":
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    break;
                case "trans_internal":
                    this.$router.push(
                        `/account/${self.accountInfo.address}/trans_internal`
                    );
                    break;
                case "event_logs":
                    this.$router.push(
                        `/account/${self.accountInfo.address}/event_logs`
                    );
                    break;
                case "contract_code":
                    this.$router.push(
                        `/account/${self.accountInfo.address}/contract_code`
                    );
                    break;
            }
        }
    }
};
</script>