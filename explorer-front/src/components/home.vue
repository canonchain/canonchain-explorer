<template>
    <div class="page-home">
        <div class="home-top">
            <header-cps></header-cps>
            <dashboard></dashboard>
        </div>
        <div class="home-content">
            <div class="container">
                <h2 class="home-content-tit">最新交易</h2>
                <template>
                    <el-table :data="database" style="width: 100%" v-loading="loadingSwitch">
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
                                    <span class="table-long-item">Gene</span>
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
                                </template>

                                <span v-else class="xt-info">
                                    -
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column label="金额 / CZR" align="right" width="240">
                            <template slot-scope="scope">
                                <span >{{scope.row.amount | toCZRVal}}</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </template>
            </div>

        </div>

    </div>
</template>

<script>
import HeaderCps from "@/components/Header/Header";
import Dashboard from "@/components/Dashboard/Dashboard";
export default {
    name: "Home",
    components: {
        HeaderCps,
        Dashboard
    },
    data() {
        return {
            loadingSwitch: true,
            database: []
        };
    },
    created() {
        self = this;
        self.getTransactions();
    },
    methods: {
        getTransactions() {
            self.loadingSwitch = true;
            self.$axios
                .get("/api/get_latest_transactions")
                .then(function(response) {
                    self.database = response.data.transactions;
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
        goBlockPath(block) {
            this.$router.push("/block/" + block);
        },
        goAccountPath(account) {
            this.$router.push("/account/" + account);
        }
    },
    filters: {
        toCZRVal: function(val) {
            let tempVal = self.$czr.utils.fromWei(val, "czr");
            return tempVal; //TODO Keep 4 decimal places
        },
        toDate: function(val) {
            if (val == "0" || !val) {
                return "-";
            }
            let newDate = new Date();
            newDate.setTime(val * 1000);
            let addZero = function(val) {
                return val < 10 ? "0" + val : val;
            };
            return (
                newDate.getFullYear() +
                " / " +
                addZero(newDate.getMonth() + 1) +
                " / " +
                addZero(newDate.getDate()) +
                " " +
                addZero(newDate.getHours()) +
                ":" +
                addZero(newDate.getMinutes()) +
                ":" +
                addZero(newDate.getSeconds())
            );
        }
    }
};
</script>

<style scoped>
.page-home {
}

.home-top {
    background: #5a59a0;
    text-align: center;
    width: 100%;
    height: 430px;
    color: #fff;
    background-image: radial-gradient(
        50% 158%,
        #57509e 29%,
        #353469 93%,
        #333366 100%
    );
}
.home-content .container {
    padding-bottom: 70px;
}
.home-content-tit {
    padding: 20px 10px 10px 0;
    font-size: 18px;
    color: #838383;
}
.table-long-item {
    max-width: 150px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
