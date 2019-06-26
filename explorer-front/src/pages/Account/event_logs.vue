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
                            <!-- <template v-if="accountInfo.is_has_token_trans"></template> -->
                            <!-- <template v-if="accountInfo.is_has_intel_trans"></template> -->
                            <el-tab-pane
                                label="Token转账"
                                name="trans_token"
                            ></el-tab-pane>
                            <el-tab-pane
                                label="合约内交易"
                                name="trans_internal"
                            ></el-tab-pane>
                            <el-tab-pane label="事件日志" name="event_logs">
                                <div class="account-content">
                                    <!-- <el-row>
                                        <el-col :span="6">
                                            <h2 class="transfer-tit">
                                                事件日志（最新10条）
                                            </h2>
                                        </el-col>
                                    </el-row> -->
                                    <div
                                        class="accounts-list-wrap"
                                        v-loading="loadingSwitch"
                                    >
                                        <template v-if="IS_GET_INFO">
                                            <el-table
                                                :data="event_logs"
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
                                                <!-- <el-table-column label="交易号" width="180">
                                                    <template slot-scope="scope"></template>
                                                </el-table-column>-->
                                                <el-table-column
                                                    label="交易号/模式"
                                                    width="200"
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
                                                        <br />
                                                        <strong>{{
                                                            scope.row.method
                                                        }}</strong>
                                                        <p>
                                                            {{
                                                                scope.row
                                                                    .method_function
                                                            }}
                                                        </p>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column
                                                    label="事件日志"
                                                >
                                                    <template
                                                        slot-scope="scope"
                                                    >
                                                        <template
                                                            v-for="(item,
                                                            index) in scope.row
                                                                .topics"
                                                        >
                                                            <p
                                                                v-bind:key="
                                                                    item
                                                                "
                                                            >
                                                                [topic{{
                                                                    index
                                                                }}] {{ item }}
                                                            </p>
                                                        </template>
                                                        <p>
                                                            <span
                                                                >Data
                                                                {{
                                                                    scope.row
                                                                        .data
                                                                }}</span
                                                            >
                                                        </p>
                                                    </template>
                                                </el-table-column>
                                            </el-table>
                                        </template>
                                    </div>
                                </div>
                            </el-tab-pane>
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
            IS_GET_ACC: false,
            IS_GET_INFO: false,

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
            activeName: "event_logs",
            // 合约代码
            event_logs: []
        };
    },
    created() {
        self = this;
        self.initDatabase();
        self.getEventLog();
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
                    this.$router.push(
                        `/account/${self.accountInfo.address}/trans_token`
                    );
                    break;
                case "trans_internal":
                    this.$router.push(
                        `/account/${self.accountInfo.address}/trans_internal`
                    );
                    break;
                case "event_logs":
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    break;
                case "contract_code":
                    this.$router.push(
                        `/account/${self.accountInfo.address}/contract_code`
                    );
                    break;
            }
        },
        async getEventLog() {
            let opt = {
                account: self.accountInfo.address
            };
            let response = await self.$api.get("/api/get_event_log", opt);

            if (response.success) {
                self.event_logs = response.data;
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        }
    }
};
</script>