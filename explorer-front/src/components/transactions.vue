<template>
    <div class="page-accounts">
        <header-cps></header-cps>
        <div class="accounts-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <strong>交易列表</strong>
                    <span class="sub_header-des">合计 {{totalVal}} 笔交易</span>
                </div>
                <div class="accounts-list-wrap" v-loading="loadingSwitch">
                    <template>
                        <el-table :data="database" style="width: 100%">
                            <el-table-column label="时间" width="200">
                                <template slot-scope="scope">
                                    <span class="table-long-item">{{scope.row.exec_timestamp | toDate}}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="交易号" width="200">
                                <template slot-scope="scope">
                                    <el-button @click="goBlockPath(scope.row.hash)" type="text">
                                        <span class="table-long-item">{{scope.row.hash}}</span>
                                    </el-button>
                                </template>
                            </el-table-column>
                            <el-table-column label="发款方" width="200">
                                <template slot-scope="scope">
                                    <template v-if="scope.row.mci <= 0">
                                        <span class="table-long-item">GENESIS</span>
                                    </template>
                                    <template v-else>
                                        <el-button @click="goAccountPath(scope.row.from)" type="text">
                                            <span class="table-long-item">{{scope.row.from}}</span>
                                        </el-button>
                                    </template>

                                </template>
                            </el-table-column>
                            <el-table-column label="收款方" width="200">
                                <template slot-scope="scope">
                                    <el-button @click="goAccountPath(scope.row.to)" type="text">
                                        <span class="table-long-item">{{scope.row.to}}</span>
                                    </el-button>
                                </template>
                            </el-table-column>
                            <el-table-column label="状态" min-width="80" align="center">
                                <template slot-scope="scope">
                                    <template v-if="scope.row.is_stable === false">
                                        <span class="txt-warning">
                                            等待确认
                                        </span>
                                    </template>
                                    <template v-else>
                                        <template v-if='scope.row.status == "0"'>
                                            <span class="txt-success"> 成功 </span>
                                        </template>
                                        <template v-else-if='scope.row.status == "1"'>
                                            <span class="txt-danger"> 失败(1) </span>
                                        </template>
                                        <template v-else-if='scope.row.status == "2"'>
                                            <span class="txt-danger"> 失败(2) </span>
                                        </template>
                                        <template v-else-if='scope.row.status == "3"'>
                                            <span class="txt-danger"> 失败(3) </span>
                                        </template>                                        
                                        <template v-else>
                                            <span class="txt-info">-</span>
                                        </template>
                                    </template>
                                </template>
                            </el-table-column>
                            <el-table-column label="金额 / CZR" align="right" min-width="230">
                                <template slot-scope="scope">
                                    <span >{{scope.row.amount | toCZRVal}}</span>
                                </template>
                            </el-table-column>

                        </el-table>
                    </template>
                </div>
                <div class="pagin-block">
                    <el-pagination small background layout="total,prev, pager, next" @current-change="handleCurrentChange" :current-page.sync="currentPage" :page-size="limitVal" :total="totalVal" :pager-count="5">
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
                    mc_timestamp: "-",
                    hash: "0",
                    from: 0,
                    to: 0,
                    amount: 0
                }
            ]
        };
    },
    created() {
        self = this;
        self.getTransactions();
    },
    methods: {
        getTransactions() {
            var wtVal='';
            if(window.location.hash.indexOf('?wt=')>1){
                wtVal='all'
            }
            (self.loadingSwitch = true),
                self.$axios
                    .get("/api/get_transactions", {
                        params: {
                            page: self.currentPage,
                            wt: wtVal,
                        }
                    })
                    .then(function(response) {
                        self.database = response.data.transactions;
                        self.totalVal = response.data.count;
                        self.loadingSwitch = false;
                    })
                    .catch(function(error) {
                        self.database = {
                            mc_timestamp: "-",
                            hash: "-",
                            from: "-",
                            to: "-",
                            amount: 0
                        };
                        self.loadingSwitch = false;
                    });
        },
        handleCurrentChange(val) {
            self.getTransactions();
        },
        goBlockPath(block) {
            this.$router.push("/block/" + block);
        },
        goAccountPath(account) {
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
.table-long-item {
    max-width: 150px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>

