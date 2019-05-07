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
                            <el-table-column prop="rank" label="排行榜" width="70"></el-table-column>
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
                    <el-pagination
                        small
                        background
                        layout="total,prev, pager, next"
                        @current-change="getPaginationFlag"
                        :current-page.sync="current_page"
                        :page-size="LIMIT_VAL"
                        :total="TOTAL_VAL"
                        :pager-count="5"
                    ></el-pagination>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import HeaderCps from "@/components/Header/Header";
import Search from "@/components/Search/Search";

let self = null;
let MAX_PAGE;

let errorInfo = {
    account: "czr-xxx",
    balance: "-",
    proportion: "0.0 %",
    rank: 1
};

export default {
    name: "Accounts",
    components: {
        HeaderCps,
        Search
    },
    data() {
        return {
            current_page: 1,
            LIMIT_VAL: 20,
            TOTAL_VAL: 0,
            loadingSwitch: false,
            database: [
                {
                    account: "-",
                    balance: "0",
                    tran_count: 0,
                    type: 0
                }
            ],
            url_parm: {},
            startOpt: {}
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        self.url_parm = {
            balance: queryInfo.balance,
            page: queryInfo.page || 1
        };
        self.current_page = Number(queryInfo.page || 1);

        self.getAccountsCount();
        self.getFlagAccounts();
    },
    methods: {
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // if want_page == MAX_PAGE 说明是取最后一页
            if (val == MAX_PAGE) {
                self.$router.push(`/accounts?balance=-1&page=${MAX_PAGE}`);
                return;
            }
            // if want_page == 1 说明是取第一页
            if (val == 1) {
                self.$router.push(`/accounts`);
                return;
            }

            let opt = {
                balance: self.url_parm.balance,
                page: self.url_parm.page, //当前页 1
                want_page: val
            };
            let response = await self.$api.get(
                "/api/get_want_balance_flag",
                opt
            );
            self.loadingSwitch = false;
            let responseInfo = response.data;
            self.$router.push(
                `/accounts?balance=${responseInfo.balance}&page=${
                    response.page
                }`
            );
        },

        async getAccountsCount() {
            let response = await self.$api.get("/api/get_transactions_count");
            if (response.success) {
                self.TOTAL_VAL = response.count;
                MAX_PAGE = Math.ceil(response.count / self.LIMIT_VAL);
            } else {
                self.TOTAL_VAL = "-";
            }
        },

        async getFlagAccounts() {
            let response = await self.$api.get("/api/get_first_balance_flag");

            if (response.success && response.item) {
                self.startOpt.balance = response.item.balance || "0";
                self.startOpt.page = 1;
                if (!self.url_parm.balance) {
                    self.url_parm.balance = response.item.balance;
                    self.url_parm.page = 1;
                }
            } else if(response.success){
                console.log("data is null");
            } else {
                console.log("error");
            }

            //如果有字段信息
            if (self.url_parm.page > 1) {
                self.getAccounts1(self.url_parm);
            } else {
                self.getAccounts1(self.startOpt);
            }
        },

        async getAccounts1(parm) {
            //TODO 当尾页中，点击下一页时候，数组记录
            self.loadingSwitch = true;
            let opt = {
                balance: parm.balance,
                page: parm.page
            };

            let response = await self.$api.get("/api/get_accounts1", opt);

            if (response.success) {
                self.database = response.accounts;
            } else {
                self.database = [errorInfo];
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

