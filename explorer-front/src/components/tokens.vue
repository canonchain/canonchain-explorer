<template>
    <div class="page-accounts">
        <header-cps></header-cps>
        <div class="accounts-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <strong>代币列表</strong>
                    <span class="sub_header-des">合计 {{TOTAL_VAL}} 个</span>
                </div>
                <div class="accounts-list-wrap" v-loading="loadingSwitch">
                    <template v-if="IS_GET_INFO">
                        <el-table :data="database" style="width: 100%">
                            <el-table-column label="代币符号" width="180">
                                <template slot-scope="scope">
                                    <router-link
                                        class="table-long-item"
                                        :to="{path: '/account/' + scope.row.contract_account}"
                                    >{{scope.row.token_symbol}} ({{scope.row.token_name}})</router-link>
                                </template>
                            </el-table-column>
                            <el-table-column label="对应合约" min-width="180">
                                <template slot-scope="scope">
                                    <router-link
                                        class="table-long-item"
                                        :to="{path: '/account/' + scope.row.contract_account}"
                                    >{{scope.row.contract_account}}</router-link>
                                </template>
                            </el-table-column>
                            <el-table-column label="创建时间" min-width="110">
                                <template slot-scope="scope">
                                    <span>{{scope.row.mc_timestamp | toDate}}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="总量" align="right" min-width="230">
                                <template slot-scope="scope">
                                    <span>{{scope.row.token_total | toTokenVal(Math.pow(10,18))}}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="持有人/交易数" align="right" min-width="100">
                                <template slot-scope="scope">
                                    <span>{{scope.row.account_count}} / {{scope.row.transaction_count}}</span>
                                </template>
                            </el-table-column>
                        </el-table>
                    </template>
                </div>

                <template v-if="database.length">
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
                </template>
            </div>
        </div>
    </div>
</template>
<script>
import HeaderCps from "@/components/Header/Header";
import Search from "@/components/Search/Search";

let errorInfo = {
    token_id: "",
    contract_account: "",
    token_name: "",
    token_symbol: "",
    token_precision: "",
    token_total: "",
    transaction_count: "",
    account_count: ""
};

let self = null;
let isDefaultPage = false;

export default {
    name: "Tokens",
    components: {
        HeaderCps,
        Search
    },
    data() {
        return {
            TOTAL_VAL: 0,
            LIMIT_VAL: 20,
            loadingSwitch: true,
            IS_GET_INFO: false,
            TRANS_TYPE: 2,
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            database: [],
            pageFirstItem: {
                token_id: 0
            },
            pageLastItem: {
                token_id: 0
            },
            url_parm: {
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                token_id: 999999999999999999
            }
        };
    },
    created() {
        self = this;
        self.getTransactionsCount();
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.token_id = queryInfo.token_id;
        }
        self.getTransactions(self.url_parm);
    },
    methods: {
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(`/normal_trans?token_id=0&position=4`);
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(`/normal_trans`);
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/normal_trans?token_id=${
                        self.pageFirstItem.token_id
                    }&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/normal_trans?token_id=${
                        self.pageLastItem.token_id
                    }&position=3`
                );
                return;
            }
        },

        async getTransactions(parm) {
            //TODO 当尾页中，点击下一页时候，数组记录
            self.loadingSwitch = true;
            let opt = {
                position: parm.position,
                token_id: parm.token_id
            };
            let response = await self.$api.get("/api/get_tokens", opt);
            if (response.success) {
                self.database = response.data;
                if (response.data.length) {
                    self.pageFirstItem = response.data[0];
                    self.pageLastItem = response.data[response.data.length - 1];
                    if (response.data.length < 20) {
                        self.$router.push(`/tokens`);
                    }
                } else {
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    return;
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
            self.getFlagTransactions();
        },

        async getTransactionsCount() {
            let response = await self.$api.get("/api/get_token_count");
            if (response.success) {
                self.TOTAL_VAL = response.count;
            } else {
                self.TOTAL_VAL = 0;
            }
        },

        async getFlagTransactions() {
            //获取交易表首位值；用来禁用首页和尾页的
            let response = await self.$api.get("/api/get_token_flag");
            if (response.near_item.token_id == self.pageFirstItem.token_id) {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            }
            if (response.end_item.token_id == self.pageLastItem.token_id) {
                self.btnSwitch.right = true;
                self.btnSwitch.footer = true;
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        goAccountPath(account) {
            this.$router.push("/token/" + account);
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
.table-long-item {
    max-width: 150px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>

