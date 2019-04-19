<template>
    <div class="page-accounts">
        <header-cps></header-cps>
        <div class="accounts-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <strong>账户列表</strong>
                    <span class="sub_header-des">合计 {{totalVal}} 个账户</span>
                </div>
                <div class="accounts-list-wrap" v-loading="loadingSwitch">
                    <template>
                        <el-table :data="database" style="width: 100%">
                            <el-table-column prop="rank" label="排行榜" width="70">
                            </el-table-column>
                            <el-table-column label="账户" width="580">
                                <template slot-scope="scope">
                                    <el-button @click="handleClick(scope.row.account)" type="text">{{scope.row.account}}</el-button>
                                </template>
                            </el-table-column>
                            <el-table-column label="余额(CZR)" align="right" width="180">
                                <template slot-scope="scope">
                                    {{scope.row.balance | toCZRVal}}
                                </template>
                            </el-table-column>
                            <el-table-column prop="proportion" label="占比" align="right" min-width="150">
                            </el-table-column>
                        </el-table>
                    </template>
                </div>
                <div class="pagin-block">
                    <el-pagination   small background layout="total,prev, pager, next" @current-change="handleCurrentChange" :current-page.sync="currentPage" :page-size="limitVal" :total="totalVal" :pager-count="5">
                    </el-pagination>
                </div>
            </div>
        </div>

    </div>
</template>
<script>
import HeaderCps from "@/components/Header/Header";
import Search from "@/components/Search/Search";

let self = null;

export default {
    name: "Accounts",
    components: {
        HeaderCps,
        Search
    },
    data() {
        return {
            currentPage: 1,
            limitVal: 20,
            totalVal: 0,
            loadingSwitch: false,
            database: [
                {
                    account: "-",
                    balance: "0",
                    tran_count: 0,
                    type: 0
                }
            ]
        };
    },
    created() {
        self = this;
        self.getAccounts();
    },
    methods: {
        getAccounts() {
            (self.loadingSwitch = true),
                self.$axios
                    .get("/api/get_accounts", {
                        params: {
                            page: self.currentPage
                        }
                    })
                    .then(function(response) {
                        self.database = response.data.accounts;
                        self.totalVal = response.data.count;
                        self.loadingSwitch = false;
                    })
                    .catch(function(error) {
                        self.database = {
                            account: "",
                            balance: "",
                            tran_count: 0,
                            type: 0
                        };
                        self.loadingSwitch = false;
                    });
        },
        handleCurrentChange(val) {
            self.getAccounts();
            // this.$router.push("/accounts?page=" + val);
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

