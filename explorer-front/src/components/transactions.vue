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
                                    <el-button @click="goAccountPath(scope.row.to)" type="text">
                                        <span class="table-long-item">{{scope.row.to}}</span>
                                    </el-button>
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
                            type="primary"
                            size="mini"
                            @click="getTransactions(startOpt,'head')"
                            :disabled="pagin_att.head"
                        >首页</el-button>
                        <el-button
                            type="primary"
                            size="mini"
                            icon="el-icon-arrow-left"
                            @click="getTransactions(beforeOpt)"
                            :disabled="pagin_att.before"
                        >上一页</el-button>
                        <el-button
                            type="primary"
                            size="mini"
                            :disabled="pagin_att.after"
                            @click="getTransactions(afterOpt)"
                        >
                            下一页
                            <i class="el-icon-arrow-right el-icon--right"></i>
                        </el-button>
                        <el-button
                            type="primary"
                            size="mini"
                            @click="getTransactions(endOpt,'foot')"
                            :disabled="pagin_att.foot"
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
let MAX_VAL = "9999999999";
let MIN_VAL = "0";
let startItem;
let endItem;
let direction = "head";

export default {
    name: "Accounts",
    components: {
        HeaderCps,
        Search
    },
    data() {
        return {
            totalVal: 0,
            wt: window.location.hash.indexOf("?wt=") > 1 ? "all" : "",
            loadingSwitch: false,
            pagin_att: {
                head: true,
                before: true,
                after: false,
                foot: false
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
            afterOpt: {},
            beforeOpt: {},
            near_item: {},
            far_item: {},
            get_endpage_item: {},
            startOpt: {
                action: "after",
                exec_timestamp: MAX_VAL,
                level: MAX_VAL,
                pkid: MAX_VAL
            },

            endOpt: {
                action: "before",
                exec_timestamp: MIN_VAL,
                level: MIN_VAL,
                pkid: MIN_VAL
            }
        };
    },
    created() {
        self = this;
        self.getTransactionsCount();
        self.getFlagTransactions();
    },
    methods: {
        async getTransactions(parm, flag) {
            self.loadingSwitch = true;
            if (flag == "head") {
                direction = "head";
            } else if (flag == "foot") {
                direction = "foot";
            }

            let opt = {
                action: parm.action, //before 向前翻页=>大于值 | after 向后翻页=>小于值
                exec_timestamp: parm.exec_timestamp,
                wt: self.wt,
                level: parm.level,
                pkid: parm.pkid,
                direction: direction
            };
            console.log("******************************");
            console.log(opt);

            let response = await self.$api.get("/api/get_transactions2", opt);

            if (response.success) {
                startItem = response.transactions[0];
                self.beforeOpt = {
                    action: "before",
                    exec_timestamp: startItem.exec_timestamp,
                    level: startItem.level,
                    pkid: startItem.pkid
                };

                endItem =
                    response.transactions[response.transactions.length - 1];
                self.afterOpt = {
                    action: "after",
                    exec_timestamp: endItem.exec_timestamp,
                    level: endItem.level,
                    pkid: endItem.pkid
                };
                console.log(startItem.hash, "大", startItem.pkid);
                console.log(endItem.hash, "小", endItem.pkid);

                self.database = response.transactions;
            } else {
                self.database = [errorInfo];
            }

            //禁用第一页和最后一页
            if (response.transactions[0].hash == self.near_item.hash) {
                self.pagin_att.head = true;
                self.pagin_att.before = true;
                self.pagin_att.after = false;
            } else {
                self.pagin_att.head = false;
                self.pagin_att.before = false;
            }

            if (
                response.transactions[response.transactions.length - 1].hash ==
                self.far_item.hash
            ) {
                self.pagin_att.before = false;
                self.pagin_att.after = true;
                self.pagin_att.foot = true;
            } else {
                self.pagin_att.after = false;
                self.pagin_att.foot = false;
            }

            self.loadingSwitch = false;
        },

        async getTransactionsCount(action, hash) {
            let opt = {
                wt: self.wt
            };
            let response = await self.$api.get(
                "/api/get_transactions_count",
                opt
            );
            if (response.success) {
                self.totalVal = response.count;
            } else {
                self.totalVal = "-";
            }
        },

        async getFlagTransactions() {
            let opt = {
                wt: self.wt
            };
            let response = await self.$api.get(
                "/api/get_flag_transactions",
                opt
            );

            if (response.success) {
                self.near_item = response.near_item;
                self.far_item = response.far_item;
                // self.endOpt.exec_timestamp =
                //     response.end_flag_item.exec_timestamp;
                // self.endOpt.level = response.end_flag_item.level;
                // self.endOpt.pkid = response.end_flag_item.pkid;
            } else {
                //errorInfo
                self.near_item = response.errorInfo;
                self.far_item = response.errorInfo;
            }

            console.log("-------- getFlagTransactions");
            console.log(self.near_item.hash);
            console.log(self.far_item.hash);
            console.log("-------- getFlagTransactions");
            self.getTransactions(self.startOpt);
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

