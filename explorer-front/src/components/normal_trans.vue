<template>
    <div class="page-accounts">
        <header-cps></header-cps>
        <div class="accounts-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <strong>普通交易列表</strong>
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
            loadingSwitch: true,
            TRANS_TYPE: 2,
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
            pageFirstItem: {
                stable_index: 0
            },
            pageLastItem: {
                stable_index: 0
            },
            url_parm: {
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                stable_index: 999999999999999999
            },
            // current_page: this.$route.query.page || 1,
            startOpt: {}
        };
    },
    created() {
        self = this;
        self.getTransactionsCount();
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.stable_index = queryInfo.stable_index;
        }
        self.getTransactions(self.url_parm);
    },
    methods: {
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(`/normal_trans?stable_index=0&position=4`);
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
                    `/normal_trans?stable_index=${
                        self.pageFirstItem.stable_index
                    }&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/normal_trans?stable_index=${
                        self.pageLastItem.stable_index
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
                type: self.TRANS_TYPE,
                stable_index: parm.stable_index
            };
            let response = await self.$api.get("/api/get_trans", opt);
            if (response.success) {
                self.database = response.transactions;
                self.pageFirstItem = response.transactions[0];
                self.pageLastItem =
                    response.transactions[response.transactions.length - 1];
                if (response.transactions.length < 20) {
                    self.$router.push(`/normal_trans`);
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
            let response = await self.$api.get("/api/get_trans_count", {
                type: self.TRANS_TYPE
            });
            if (response.success) {
                self.TOTAL_VAL = response.count;
            } else {
                self.TOTAL_VAL = "-";
            }
        },

        async getFlagTransactions() {
            //获取交易表首位值；用来禁用首页和尾页的
            let response = await self.$api.get("/api/get_trans_flag", {
                type: self.TRANS_TYPE
            });
            if (
                response.near_item.stable_index ==
                self.pageFirstItem.stable_index
            ) {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            }
            if (
                response.end_item.stable_index == self.pageLastItem.stable_index
            ) {
                self.btnSwitch.right = true;
                self.btnSwitch.footer = true;
            }
            self.loadingSwitch = false;
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

