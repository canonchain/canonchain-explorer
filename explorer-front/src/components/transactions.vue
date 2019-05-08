<template>
    <div class="page-accounts">
        <header-cps></header-cps>
        <div class="accounts-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <strong>交易列表</strong>
                    <span class="sub_header-des">合计 {{TOTAL_VAL}} 笔交易</span>
                </div>
                <div class="accounts-list-wrap" v-loading="loadingSwitch">
                    <template>
                        <el-table :data="database" style="width: 100%">
                            <el-table-column label="时间" width="200">
                                <template slot-scope="scope">
                                    <span
                                        class="table-long-item"
                                    >{{scope.row.exec_timestamp | toDate}}</span>
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
                                        <el-button
                                            @click="goAccountPath(scope.row.from)"
                                            type="text"
                                        >
                                            <span class="table-long-item">{{scope.row.from}}</span>
                                        </el-button>
                                    </template>
                                </template>
                            </el-table-column>
                            <el-table-column label="收款方" width="200">
                                <template slot-scope="scope">
                                    <template v-if="scope.row.to">
                                        <el-button @click="goAccountPath(scope.row.to)" type="text">
                                            <span class="table-long-item">{{scope.row.to}}</span>
                                        </el-button>
                                    </template>
                                    <template v-else>
                                        <span>-</span>
                                    </template>
                                </template>
                            </el-table-column>
                            <el-table-column label="状态" min-width="80" align="center">
                                <template slot-scope="scope">
                                    <template v-if="scope.row.is_stable === false">
                                        <span class="txt-warning">等待确认</span>
                                    </template>
                                    <template v-else>
                                        <template v-if="scope.row.status == '0'">
                                            <span class="txt-success">成功</span>
                                        </template>
                                        <template v-else-if="scope.row.status ==  '1'">
                                            <span class="txt-danger">失败(1)</span>
                                        </template>
                                        <template v-else-if="scope.row.status ==  '2'">
                                            <span class="txt-danger">失败(2)</span>
                                        </template>
                                        <template v-else-if="scope.row.status ==  '3'">
                                            <span class="txt-danger">失败(3)</span>
                                        </template>
                                        <template v-else>
                                            <span class="txt-info">-</span>
                                        </template>
                                    </template>
                                </template>
                            </el-table-column>
                            <el-table-column label="金额 / CZR" align="right" min-width="230">
                                <template slot-scope="scope">
                                    <span>{{scope.row.amount | toCZRVal}}</span>
                                </template>
                            </el-table-column>
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

let errorInfo = {
    exec_timestamp: "1555895648",
    level: "-",
    pkid: "-",
    hash: "-",
    from: "-",
    to: "-",
    is_stable: false,
    status: "0",
    amount: "0"
};

let self = null;
let isDefaultPage = false;

export default {
    name: "Accounts",
    components: {
        HeaderCps,
        Search
    },
    data() {
        return {
            TOTAL_VAL: 0,
            LIMIT_VAL: 20,
            wt: window.location.hash.indexOf("wt=") > 1 ? "all" : "",
            loadingSwitch: true,
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            database: [
                {
                    exec_timestamp: "-",
                    hash: "0",
                    from: 0,
                    to: 0,
                    amount: 0
                }
            ],
            pageFirstItem: {},
            url_parm: {
                exec_timestamp: 0,
                level: 0,
                pkid: 0
            },
            // current_page: this.$route.query.page || 1,

            startOpt: {}
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length) {
            self.url_parm = {
                exec_timestamp: queryInfo.exec_timestamp,
                level: queryInfo.level,
                pkid: queryInfo.pkid
            };
        }
        self.getTransactionsCount();
        self.getFlagTransactions();
    },
    methods: {
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/transactions?exec_timestamp=0&level=0&pkid=0`
                );
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(`/transactions`);
                return;
            }
            if (
                val == "left" &&
                (self.pageFirstItem.exec_timestamp ==
                    self.startOpt.exec_timestamp &&
                    self.pageFirstItem.level == self.startOpt.level &&
                    self.pageFirstItem.pkid == self.startOpt.pkid)
            ) {
                self.$router.push(`/transactions`);
                return;
            }

            let opt = {
                exec_timestamp: self.url_parm.exec_timestamp,
                level: self.url_parm.level,
                pkid: self.url_parm.pkid,
                direction: val
                // page: self.url_parm.page, //当前页 1
                // want_page: val
            };
            let response = await self.$api.get("/api/get_want_page_flag", opt);
            // self.loadingSwitch = false;
            let responseInfo = response.data;
            self.$router.push(
                `/transactions?exec_timestamp=${
                    responseInfo.exec_timestamp
                }&level=${responseInfo.level}&pkid=${responseInfo.pkid}`
            );
        },
        async getTransactions(parm) {
            //TODO 当尾页中，点击下一页时候，数组记录
            self.loadingSwitch = true;
            let opt = {
                exec_timestamp: parm.exec_timestamp,
                wt: self.wt,
                level: parm.level,
                pkid: parm.pkid
            };
            let response = await self.$api.get("/api/get_transactions", opt);

            if (response.success) {
                self.database = response.transactions;
                self.pageFirstItem = response.transactions[0];
                if (response.transactions.length < 20) {
                    self.$router.push(`/transactions`);
                }
            } else {
                self.database = [errorInfo];
            }
            //禁止首页上一页
            if (
                parm.exec_timestamp == self.startOpt.exec_timestamp &&
                parm.level == self.startOpt.level &&
                parm.pkid == self.startOpt.pkid
            ) {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            }
            //禁止尾页下一页
            if (parm.exec_timestamp == 0 && parm.level == 0 && parm.pkid == 0) {
                self.btnSwitch.footer = true;
                self.btnSwitch.right = true;
            }

            self.loadingSwitch = false;
        },

        async getTransactionsCount() {
            let opt = {
                wt: self.wt
            };
            let response = await self.$api.get(
                "/api/get_transactions_count",
                opt
            );
            if (response.success) {
                self.TOTAL_VAL = response.count;
            } else {
                self.TOTAL_VAL = "-";
            }
        },

        async getFlagTransactions() {
            let opt = {
                wt: self.wt
            };
            let response = await self.$api.get("/api/get_first_page_flag", opt);

            if (response.success) {
                self.startOpt = response.near_item;
                if (!self.url_parm.exec_timestamp && response.near_item) {
                    isDefaultPage = true;
                    self.btnSwitch.header = true;
                    self.btnSwitch.footer = false;
                    self.url_parm.exec_timestamp =
                        response.near_item.exec_timestamp;
                    self.url_parm.level = response.near_item.level;
                    self.url_parm.pkid = response.near_item.pkid;
                }
            } else {
                console.log("error");
            }

            //如果有字段信息
            if (isDefaultPage) {
                self.startOpt && self.getTransactions(self.startOpt);
            } else {
                self.getTransactions(self.url_parm);
            }
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

