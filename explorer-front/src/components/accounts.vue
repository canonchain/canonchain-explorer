<template>
    <div class="page-accounts">
        <header-cps></header-cps>
        <div class="accounts-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <strong>账户列表</strong>
                    <span class="sub_header-des">合计 {{TOTAL_VAL}} 个账户</span>
                </div>
                <div class="accounts-list-wrap" v-loading="loadingSwitch">
                    <template>
                        <el-table :data="database" style="width: 100%">
                            <!-- <el-table-column prop="rank" label="排行榜" width="70"></el-table-column> -->
                            <el-table-column label="账户" width="580">
                                <template slot-scope="scope">
                                    <el-button
                                        @click="handleClick(scope.row.account)"
                                        type="text"
                                    >{{scope.row.account}}</el-button>
                                </template>
                            </el-table-column>
                            <el-table-column label="余额(CZR)" align="right" width="180">
                                <template slot-scope="scope">{{scope.row.balance | toCZRVal}}</template>
                            </el-table-column>
                            <el-table-column
                                prop="proportion"
                                label="占比"
                                align="right"
                                min-width="150"
                            ></el-table-column>
                        </el-table>
                    </template>
                </div>
                <div class="pagin-block">
                    <el-button-group>
                        <el-button
                            size="mini"
                            :disabled="btnSwitch.header"
                            @click="getPaginationFlag('header')"
                        >首页</el-button>
                        <el-button
                            size="mini"
                            icon="el-icon-arrow-left"
                            :disabled="btnSwitch.left"
                            @click="getPaginationFlag('left')"
                        >上一页</el-button>
                        <el-button
                            size="mini"
                            :disabled="btnSwitch.right"
                            @click="getPaginationFlag('right')"
                        >
                            下一页
                            <i class="el-icon-arrow-right el-icon--right"></i>
                        </el-button>
                        <el-button
                            size="mini"
                            :disabled="btnSwitch.footer"
                            @click="getPaginationFlag('footer')"
                        >尾页</el-button>
                    </el-button-group>

                    <!-- <el-pagination
                        small
                        background
                        layout="total,prev, pager, next"
                        @current-change="getPaginationFlag"
                        :page-size="LIMIT_VAL"
                        :total="TOTAL_VAL"
                        :pager-count="5"
                    ></el-pagination>-->
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import HeaderCps from "@/components/Header/Header";
import Search from "@/components/Search/Search";

let self = null;
let isDefaultPage = false;

let errorInfo = {
    account: "czr-xxx",
    balance: "-",
    proportion: "0.0 %",
    // rank: 1
};

export default {
    name: "Accounts",
    components: {
        HeaderCps,
        Search
    },
    data() {
        return {
            LIMIT_VAL: 20,
            TOTAL_VAL: 0,
            loadingSwitch: true,
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            database: [
                {
                    account: "-",
                    balance: "0",
                    tran_count: 0,
                    type: 0
                }
            ],
            pageFirstItem: {},
            url_parm: {
                balance: 0,
                acc_id: 0
            },
            startOpt: {}
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;

        if (Object.keys(queryInfo).length) {
            self.url_parm = {
                balance: queryInfo.balance,
                acc_id: queryInfo.acc_id
            };
        }
        self.getAccountsCount();
        self.getFlagAccounts();
    },
    methods: {
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(`/accounts?balance=-1&acc_id=-1`);
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(`/accounts`);
                return;
            }
            if (
                val == "left" &&
                (self.pageFirstItem.balance == self.startOpt.balance &&
                    self.pageFirstItem.acc_id == self.startOpt.acc_id)
            ) {
                self.$router.push(`/accounts`);
                return;
            }

            let opt = {
                balance: self.url_parm.balance,
                acc_id: self.url_parm.acc_id,
                direction: val
            };
            let response = await self.$api.get(
                "/api/get_want_balance_flag",
                opt
            );
            let responseInfo = response.data;

            self.$router.push(
                `/accounts?balance=${responseInfo.balance}&acc_id=${
                    responseInfo.acc_id
                }`
            );
        },

        async getAccountsCount() {
            let response = await self.$api.get("/api/get_transactions_count");
            if (response.success) {
                self.TOTAL_VAL = response.count;
            } else {
                self.TOTAL_VAL = "-";
            }
        },

        async getFlagAccounts() {
            let response = await self.$api.get("/api/get_first_balance_flag");

            if (response.success && response.item) {
                self.startOpt.balance = response.item.balance || "0";
                self.startOpt.acc_id = response.item.acc_id;

                if (!self.url_parm.balance) {
                    isDefaultPage = true;
                    self.btnSwitch.header = true;
                    self.btnSwitch.footer = false;
                    self.url_parm.balance = response.item.balance;
                    self.url_parm.acc_id = response.item.acc_id;
                }
            } else if (response.success) {
                console.log("data is null");
            } else {
                console.log("error");
            }

            //如果有字段信息
            if (isDefaultPage) {
                self.startOpt && self.getAccounts(self.startOpt);
            } else {
                self.getAccounts(self.url_parm);
            }
        },

        async getAccounts(parm) {
            //TODO 当尾页中，点击下一页时候，数组记录
            self.loadingSwitch = true;
            let opt = {
                acc_id: parm.acc_id,
                balance: parm.balance
            };

            let response = await self.$api.get("/api/get_accounts", opt);

            if (response.success) {
                self.database = response.accounts;
                self.pageFirstItem = response.accounts[0];
                if (response.accounts.length < 20) {
                    self.$router.push(`/accounts`);
                }
            } else {
                self.database = [errorInfo];
            }

            //禁止首页上一页
            if (
                parm.acc_id == self.startOpt.acc_id &&
                parm.balance == self.startOpt.balance
            ) {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            }
            //禁止尾页下一页
            if (parm.acc_id == -1 && parm.balance == -1) {
                self.btnSwitch.footer = true;
                self.btnSwitch.right = true;
            }

            self.loadingSwitch = false;
        },
        handleClick(account) {
            this.$router.push("/account/" + account);
        }
    }
};
</script>
<style scoped>
.page-accounts {
    width: 100%;
    position: relative;
}
#header {
    color: #fff;
    background: #5a59a0;
}

.sub-header {
    border-top: 1px solid #bdbdbd;
    border-bottom: 1px solid #bdbdbd;
    color: #585858;
    margin: 28px 0;
    padding: 16px 10px;
}
.sub_header-des {
    display: inline-block;
    padding-left: 10px;
}
.accounts-info-wrap {
    position: relative;
    width: 100%;
    margin: 0 auto;
    color: black;
    text-align: left;
    padding-top: 20px;
    padding-bottom: 80px;
}
.pagin-block {
    display: block;
    margin: 20px 0;
    text-align: right;
}
</style>

