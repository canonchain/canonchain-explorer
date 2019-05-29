<template>
    <div class="page-block">
        <header-cps></header-cps>
        <div class="block-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <strong class="sub_header-tit">账户信息</strong>
                    <span class="sub_header-des">{{accountInfo.address}}</span>
                </div>
                <div class="bui-dlist">
                    <el-row>
                        <el-col :span="12">
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    余额
                                    <span class="space-des"></span>
                                </strong>
                                <template v-if="IS_GET_ACC">
                                    <div
                                        class="bui-dlist-det"
                                    >{{accountInfo.balance | toCZRVal}} CZR</div>
                                </template>
                            </div>
                        </el-col>
                        <el-col :span="12">
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    交易数
                                    <span class="space-des"></span>
                                </strong>
                                <template v-if="IS_GET_ACC">
                                    <div class="bui-dlist-det">{{TOTAL_VAL}} 次</div>
                                </template>
                            </div>
                        </el-col>
                    </el-row>
                </div>
                <div class="account-content">
                    <el-row>
                        <el-col :span="6">
                            <h2 class="transfer-tit">交易记录</h2>
                        </el-col>
                        <el-col :span="18" style="text-align: right;">
                            <template>
                                <el-radio
                                    v-model="url_parm.source"
                                    label="1"
                                    @change="handlerChange"
                                >发送记录</el-radio>
                                <el-radio
                                    v-model="url_parm.source"
                                    label="2"
                                    @change="handlerChange"
                                >接收记录</el-radio>
                                <template v-if="IS_WITNESS">
                                    <el-radio
                                        v-model="url_parm.source"
                                        label="3"
                                        @change="handlerChange"
                                    >见证交易</el-radio>
                                </template>
                            </template>
                        </el-col>
                    </el-row>
                    <div class="accounts-list-wrap" v-loading="loadingSwitch">
                        <template v-if="IS_GET_INFO">
                            <template v-if="url_parm.source==='3'">
                                <el-table :data="database" style="width: 100%">
                                    <el-table-column label="时间" width="280">
                                        <template slot-scope="scope">
                                            <span
                                                class="table-long-item"
                                            >{{scope.row.exec_timestamp | toDate}}</span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="交易号" width="280">
                                        <template slot-scope="scope">
                                            <el-button
                                                @click="goBlockPath(scope.row.hash)"
                                                type="text"
                                            >
                                                <span class="table-long-item">{{scope.row.hash}}</span>
                                            </el-button>
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="账户" width="280">
                                        <template slot-scope="scope">
                                            <span class="table-long-item">{{scope.row.from}}</span>
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
                                                <template v-else-if="scope.row.status == '1'">
                                                    <span class="txt-danger">失败(1)</span>
                                                </template>
                                                <template v-else-if="scope.row.status == '2'">
                                                    <span class="txt-danger">失败(2)</span>
                                                </template>
                                                <template v-else-if="scope.row.status == '3'">
                                                    <span class="txt-danger">失败(3)</span>
                                                </template>
                                                <template v-else>
                                                    <span class="txt-info">-</span>
                                                </template>
                                            </template>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <!--  -->
                            </template>
                            <template v-else>
                                <el-table :data="database" style="width: 100%">
                                    <el-table-column label="时间" width="180">
                                        <template slot-scope="scope">
                                            <span
                                                class="table-long-item"
                                            >{{scope.row.mc_timestamp | toDate}}</span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="交易号" width="180">
                                        <template slot-scope="scope">
                                            <el-button
                                                @click="goBlockPath(scope.row.hash)"
                                                type="text"
                                            >
                                                <span class="table-long-item">{{scope.row.hash}}</span>
                                            </el-button>
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="发款方" width="180">
                                        <template slot-scope="scope">
                                            <template
                                                v-if="scope.row.is_from_this_account == false"
                                            >
                                                <el-button
                                                    @click="goAccountPath(scope.row.from)"
                                                    type="text"
                                                >
                                                    <span class="table-long-item">{{scope.row.from}}</span>
                                                </el-button>
                                            </template>
                                            <template v-else>
                                                <template v-if="Number(scope.row.level) <= 0">
                                                    <span class="table-long-item">GENESIS</span>
                                                </template>
                                                <template v-else>
                                                    <span class="table-long-item">{{scope.row.from}}</span>
                                                </template>
                                            </template>
                                        </template>
                                    </el-table-column>
                                    <el-table-column>
                                        <template slot-scope="scope">
                                            <span>
                                                <el-button
                                                    v-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == false)"
                                                    type="warning"
                                                    size="mini"
                                                >转出</el-button>

                                                <el-button
                                                    v-else-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == true)&&(scope.row.mci > 0)"
                                                    size="mini"
                                                >
                                                    <i class="el-icon-sort trans-to-self"></i>
                                                </el-button>

                                                <el-button
                                                    v-else-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == true)&&(scope.row.mci <= 0)"
                                                    type="success"
                                                    size="mini"
                                                >转入</el-button>

                                                <el-button v-else type="success" size="mini">转入</el-button>
                                            </span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="收款方" width="180">
                                        <template slot-scope="scope">
                                            <template v-if="scope.row.to">
                                                <template
                                                    v-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == false)"
                                                >
                                                    <el-button
                                                        @click="goAccountPath(scope.row.to)"
                                                        type="text"
                                                    >
                                                        <span
                                                            class="table-long-item"
                                                        >{{scope.row.to}}</span>
                                                    </el-button>
                                                </template>
                                                <template v-else>
                                                    <span class="table-long-item">{{scope.row.to}}</span>
                                                </template>
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
                                                <template v-else-if="scope.row.status == '1'">
                                                    <span class="txt-danger">失败(1)</span>
                                                </template>
                                                <template v-else-if="scope.row.status == '2'">
                                                    <span class="txt-danger">失败(2)</span>
                                                </template>
                                                <template v-else-if="scope.row.status == '3'">
                                                    <span class="txt-danger">失败(3)</span>
                                                </template>
                                                <template v-else>
                                                    <span class="txt-info">-</span>
                                                </template>
                                            </template>
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="金额 / CZR" width="230" align="right">
                                        <template slot-scope="scope">
                                            <span>{{scope.row.amount | toCZRVal}}</span>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </template>

                            <!-- page -->
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
                                    <!-- <el-pagination
                                    small
                                    background
                                    layout="total,prev, pager, next"
                                    @current-change="handleCurrentChange"
                                    :current-page.sync="currentPage"
                                    :page-size="LIMIT_VAL"
                                    :total="TOTAL_VAL"
                                    :pager-count="5"
                                    ></el-pagination>-->
                                </div>
                            </template>
                        </template>
                    </div>
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

//TODO 交易列表改为 发送 和 接收 两个List ,解决sql搜索慢的问题

export default {
    name: "Block",
    components: {
        HeaderCps,
        Search
    },
    data() {
        return {
            TOTAL_VAL: 0,
            LIMIT_VAL: 20,
            loadingSwitch: true,
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            database: [],
            IS_GET_INFO: false,
            IS_GET_ACC: false,
            IS_WITNESS: false,
            pageFirstItem: {
                exec_timestamp: 0,
                level: 0,
                pkid: 0
            },
            pageLastItem: {
                exec_timestamp: 0,
                level: 0,
                pkid: 0
            },
            first_stable_index: "",
            end_stable_index: "",
            url_parm: {
                account: this.$route.params.id,
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                stable_index: 999999999999,
                source: this.$route.query.source || "1" //1 发送方 2 接收方 3见证交易
            },

            accountInfo: {
                address: this.$route.params.id,
                balance: 0
            },
            currentPage: 1
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length > 1) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.stable_index = queryInfo.stable_index;
            self.url_parm.source = queryInfo.source;
        }
        self.initDatabase();
        self.getFlagTransactions(self.url_parm);
    },
    methods: {
        initTransactionInfo() {},
        async initDatabase() {
            let opt = {
                account: self.accountInfo.address
            };
            let response = await self.$api.get("/api/get_account", opt);

            if (response.success) {
                let accInfo = response.account;
                self.accountInfo.balance =
                    accInfo.balance < 0 ? 0 : accInfo.balance;
                self.TOTAL_VAL = Number(accInfo.transaction_count);
                self.IS_WITNESS = accInfo.is_witness;
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_ACC = true;
        },
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/account/${self.url_parm.account}?stable_index=0&source=${
                        self.url_parm.source
                    }&position=4`
                );
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(
                    `/account/${self.url_parm.account}?source=${
                        self.url_parm.source
                    }`
                );
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/account/${self.url_parm.account}?stable_index=${
                        self.pageFirstItem.stable_index
                    }&source=${self.url_parm.source}&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/account/${self.url_parm.account}?stable_index=${
                        self.pageLastItem.stable_index
                    }&source=${self.url_parm.source}&position=3`
                );
                return;
            }
        },
        handlerChange(val) {
            self.$router.push(
                `/account/${self.url_parm.account}?source=${val}`
            );
        },

        async getFlagTransactions() {
            //获取交易表首位值；用来禁用首页和尾页的
            let opt = {
                source: self.url_parm.source,
                account: self.url_parm.account
            };
            let response = await self.$api.get(
                "/api/get_account_trans_flag",
                opt
            );

            if (response.success) {
                self.first_stable_index = response.near_item.stable_index;
                self.end_stable_index = response.end_item.stable_index;
                self.getTransactions(self.url_parm);
            } else {
                console.log("error");
            }
        },
        async getTransactions(parm) {
            //TODO 没有搜见证交易
            self.loadingSwitch = true;
            let opt = {
                position: parm.position,
                source: parm.source,
                account: parm.account,
                stable_index: parm.stable_index
            };
            let response = await self.$api.get(
                "/api/get_account_transactions",
                opt
            );

            if (response.success) {
                self.database = response.transactions;
                if (response.transactions.length) {
                    self.pageFirstItem = response.transactions[0];
                    self.pageLastItem =
                        response.transactions[response.transactions.length - 1];
                } else {
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    return;
                }
            } else {
                self.database = [];
            }
            //禁止首页上一页
            if (parm.position === "1") {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            } else if (parm.position === "4") {
                self.btnSwitch.right = true;
                self.btnSwitch.footer = true;
            }
            if (self.database.length > 0) {
                if (
                    self.first_stable_index === self.pageFirstItem.stable_index
                ) {
                    self.btnSwitch.header = true;
                    self.btnSwitch.left = true;
                }

                if (self.end_stable_index === self.pageLastItem.stable_index) {
                    self.btnSwitch.right = true;
                    self.btnSwitch.footer = true;
                }
            }
            self.IS_GET_INFO = true;
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

<style   scoped>
.page-block {
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
.sub_header-tit {
    display: inline-block;
    padding-right: 10px;
    margin: 0;
}
.sub_header-des {
    text-align: left;
    margin: 0;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
}
.block-info-wrap {
    position: relative;
    width: 100%;
    margin: 0 auto;
    color: black;
    text-align: left;
    padding-top: 20px;
    padding-bottom: 80px;
}
.block-item-des {
    padding: 10px 0;
    border-bottom: 1px dashed #f6f6f6;
}
@media (max-width: 1199px) {
    .bui-dlist {
        color: #3f3f3f;
        font-size: 16px;
        line-height: 2.4;
    }
    .block-item-des {
        display: block;
    }
    .bui-dlist-tit {
        display: block;
        width: 100%; /* 默认值, 具体根据视觉可改 */
        margin: 0;
        text-align: left;
    }
    .bui-dlist-det {
        display: block;
        color: #5f5f5f;
        text-align: left;
        margin: 0;
        table-layout: fixed;
        word-break: break-all;
        overflow: hidden;
    }
}

@media (min-width: 1200px) {
    .bui-dlist {
        color: #3f3f3f;
        font-size: 16px;
        line-height: 2.4;
        margin-top: 20px;
        border-top: 1px dashed #f6f6f6;
    }
    .block-item-des {
        display: -webkit-box;
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
    }
    .bui-dlist-tit {
        float: left;
        width: 15%; /* 默认值, 具体根据视觉可改 */
        text-align: left;
        margin: 0;
    }
    .bui-dlist-det {
        float: left;
        color: #5f5f5f;
        width: 80%; /* 默认值，具体根据视觉可改 */
        text-align: left;
        margin: 0;
        table-layout: fixed;
        word-break: break-all;
        overflow: hidden;
    }
}

.txt-warning {
    color: #e6a23c;
}
.txt-info {
    color: #909399;
}
.txt-success {
    color: #67c23a;
}
.txt-danger {
    color: #f56c6c;
}

.bui-dlist-tit .space-des {
    display: inline-block;
    width: 10px;
}

/*  记录 */

.account-content {
    text-align: left;
    margin-top: 40px;
}
.account-content .transfer-tit {
    font-size: 18px;
    font-weight: 400;
}

/* Transaction Record */
.account-content .no-transfer-log {
    text-align: center;
    color: #9b9b9b;
}
.account-content .no-transfer-log .iconfont {
    font-size: 128px;
}
.account-content .transfer-log {
    padding: 22px 0;
}

.transfer-log .transfer-item {
    background-color: #fff;
    padding: 10px 0;
    cursor: pointer;
    border-bottom: 1px dashed #f0f0f0;
    -webkit-user-select: none;
}
.transfer-log .transfer-item:hover {
    text-decoration: none;
    background-color: #f5f5f5;
}

@media (max-width: 1199px) {
    .transfer-log .transfer-item {
        display: block;
    }
    .transfer-time {
        padding: 10px 0;
    }
}

@media (min-width: 1200px) {
    .transfer-log .transfer-item {
        display: -webkit-box;
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
    }
    .account-content .transfer-log .transfer-info {
        width: 800px;
        padding-left: 10px;
        text-align: left;
    }
    .transfer-log .transfer-assets .assets {
        font-size: 18px;
        height: 42px;
        line-height: 42px;
        width: 300px;
        text-align: right;
    }
}

.transfer-log .icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 50%;
}
.transfer-log .icon-wrap .icon-transfer {
    color: #fff;
    position: relative;
    left: 11px;
    top: 4px;
    font-size: 20px;
}
.transfer-log .plus-assets .icon-wrap {
    background-color: rgba(0, 128, 0, 0.555);
}
.transfer-log .less-assets .icon-wrap {
    background-color: rgba(255, 153, 0, 0.555);
}
.transfer-log .by-address {
    width: 100%;
    color: #9a9c9d;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
    color: rgb(54, 54, 54);
}
.transfer-log .transfer-time {
    color: rgb(161, 161, 161);
}

.plus-assets .assets {
    color: green;
}
.less-assets .assets {
    color: rgb(255, 51, 0);
}
.iconfont {
    font-size: 18px;
    color: #bfbef8;
}
.no-list {
    padding-top: 20px;
}
.pagin-wrap {
    padding: 15px 0;
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
.trans-to-self {
    transform: rotate(90deg);
    -ms-transform: rotate(90deg); /* IE 9 */
    -moz-transform: rotate(90deg); /* Firefox */
    -webkit-transform: rotate(90deg); /* Safari 和 Chrome */
    -o-transform: rotate(90deg); /* Opera */
    padding: 0 6px;
}
</style>
