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
    proportion: "0.0 %"
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
            pageFirstItem: {
                account: "",
                balance: 0
            },
            pageLastItem: {
                account: "",
                balance: 0
            },
            url_parm: {
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                balance: 0,
                acc_id: 0
            },
            startOpt: {}
        };
    },
    created() {
        self = this;
        self.getAccountsCount();
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.balance = queryInfo.balance;
            self.url_parm.acc_id = queryInfo.acc_id;
        }
        self.getAccounts(self.url_parm);
    },
    methods: {
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(`/accounts?balance=-1&acc_id=-1&position=4`);
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(`/accounts`);
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/accounts?balance=${self.pageFirstItem.balance}&acc_id=${
                        self.pageFirstItem.acc_id
                    }&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/accounts?balance=${self.pageLastItem.balance}&acc_id=${
                        self.pageLastItem.acc_id
                    }&position=3`
                );
                return;
            }
        },

        async getAccountsCount() {
            let response = await self.$api.get("/api/get_accounts_count");
            if (response.success) {
                self.TOTAL_VAL = response.count;
            } else {
                self.TOTAL_VAL = "-";
            }
        },

        async getFlagAccounts() {
            //获取交易表首位值；用来禁用首页和尾页的
            let response = await self.$api.get("/api/get_accounts_flag");

            if (response.success) {
                if (response.near_item.acc_id == self.pageFirstItem.acc_id) {
                    self.btnSwitch.header = true;
                    self.btnSwitch.left = true;
                }

                if (response.end_item.acc_id == self.pageLastItem.acc_id) {
                    self.btnSwitch.right = true;
                    self.btnSwitch.footer = true;
                }
                self.loadingSwitch = false;
            } else {
                console.log("error");
            }
        },
        async getAccounts(parm) {
            //TODO 当尾页中，点击下一页时候，数组记录
            self.loadingSwitch = true;
            let opt = {
                position: parm.position,
                acc_id: parm.acc_id,
                balance: parm.balance
            };

            let response = await self.$api.get("/api/get_accounts", opt);

            if (response.success) {
                self.database = response.accounts;
                self.pageFirstItem = response.accounts[0];
                self.pageLastItem =
                    response.accounts[response.accounts.length - 1];
                if (response.accounts.length < 20) {
                    self.$router.push(`/accounts`);
                }
            } else {
                self.database = [errorInfo];
            }

            if (parm.position === "1") {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            } else if (parm.position === "4") {
                self.btnSwitch.right = true;
                self.btnSwitch.footer = true;
            }

            self.getFlagAccounts();
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

