<template>
    <div class="page-block">
        <header-cps></header-cps>
        <div class="block-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <strong class="sub_header-tit">账户信息</strong>
                    <span class="sub_header-des">{{accountInfo.account}}</span>
                </div>
                <div class="bui-dlist">
                    <div class="block-item-des">
                        <strong class="bui-dlist-tit">
                            余额
                            <span class="space-des"></span>
                        </strong>
                        <div class="bui-dlist-det">{{accountInfo.balance | toCZRVal}} CZR</div>
                    </div>
                    <div class="block-item-des">
                        <strong class="bui-dlist-tit">
                            稳定交易数
                            <span class="space-des"></span>
                        </strong>
                        <div class="bui-dlist-det">{{TOTAL_VAL}} 次</div>
                    </div>
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
                            </template>
                        </el-col>
                    </el-row>

                    <div class="accounts-list-wrap" v-loading="loadingSwitch">
                        <template>
                            <el-table :data="database" style="width: 100%">
                                <el-table-column label="时间" width="180">
                                    <template slot-scope="scope">
                                        <span
                                            class="table-long-item"
                                        >{{scope.row.exec_timestamp | toDate}}</span>
                                    </template>
                                </el-table-column>
                                <el-table-column label="交易号" width="180">
                                    <template slot-scope="scope">
                                        <el-button @click="goBlockPath(scope.row.hash)" type="text">
                                            <span class="table-long-item">{{scope.row.hash}}</span>
                                        </el-button>
                                    </template>
                                </el-table-column>
                                <el-table-column label="发款方" width="180">
                                    <template slot-scope="scope">
                                        <template v-if="scope.row.is_from_this_account == false">
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
                                                    <span class="table-long-item">{{scope.row.to}}</span>
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
                                            <template v-if="scope.row.status == '9'">
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
            pageFirstItem: {},
            url_parm: {
                account: this.$route.params.id,
                exec_timestamp: 0,
                level: 0,
                pkid: 0,
                source: this.$route.query.source || "1" //1 发送方 2 接收方
            },
            startOpt: {
                account: this.$route.params.id,
                exec_timestamp: 0,
                level: 0,
                pkid: 0,
                source: this.$route.query.source || "1" //1 发送方 2 接收方
            },

            accountInfo: {
                address: this.$route.params.id,
                balance: 0
            },

            tx_list: [],
            currentPage: 1
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length > 1) {
            self.url_parm.exec_timestamp = queryInfo.exec_timestamp;
            self.url_parm.level = queryInfo.level;
            self.url_parm.pkid = queryInfo.pkid;
            self.url_parm.source = queryInfo.source;
        }

        self.initDatabase();
        self.getFlagTransactions();
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
                self.accountInfo.balance = accInfo.balance;
                self.TOTAL_VAL = Number(accInfo.transaction_count);
            } else {
                console.error("/api/get_account Error");
            }
        },
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }?exec_timestamp=0&level=0&pkid=0&source=${
                        self.url_parm.source
                    }`
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
            if (
                val == "left" &&
                (self.pageFirstItem.exec_timestamp ==
                    self.startOpt.exec_timestamp &&
                    self.pageFirstItem.level == self.startOpt.level &&
                    self.pageFirstItem.pkid == self.startOpt.pkid)
            ) {
                self.$router.push(
                    `/account/${self.url_parm.account}?source=${
                        self.url_parm.source
                    }`
                );
                return;
            }

            let opt = {
                account: self.url_parm.account,
                exec_timestamp: self.url_parm.exec_timestamp,
                level: self.url_parm.level,
                pkid: self.url_parm.pkid,
                source: self.url_parm.source,
                direction: val
                // page: self.url_parm.page, //当前页 1
                // want_page: val
            };
            let response = await self.$api.get(
                "/api/get_account_want_flag",
                opt
            );
            // self.loadingSwitch = false;
            let responseInfo = response.data;
            self.$router.push(
                `/account/${self.url_parm.account}?exec_timestamp=${
                    responseInfo.exec_timestamp
                }&level=${responseInfo.level}&pkid=${
                    responseInfo.pkid
                }&source=${self.url_parm.source}`
            );
        },
        // async getAccountLists() {
        //     //TODO 优化分页性能
        //     let opt = {
        //         account: self.accountInfo.address,
        //         page: self.currentPage
        //     };
        //     let response = await self.$api.get("/api/get_account_list", opt);
        //     if (response.success) {
        //         if (self.TOTAL_VAL < response.tx_list.length) {
        //             self.TOTAL_VAL = response.tx_list.length;
        //         }
        //         self.tx_list = response.tx_list;
        //     } else {
        //         console.error("/api/get_account_list Error");
        //     }

        //     self.loadingSwitch = false;
        // },
        handlerChange(val) {
            self.$router.push(
                `/account/${self.url_parm.account}?source=${val}`
            );
        },

        async getFlagTransactions() {
            let opt = {
                source: self.url_parm.source,
                account: self.url_parm.account
            };
            let response = await self.$api.get(
                "/api/get_account_first_flag",
                opt
            );

            if (response.success) {
                self.startOpt.exec_timestamp =
                    response.near_item.exec_timestamp;
                self.startOpt.level = response.near_item.level;
                self.startOpt.pkid = response.near_item.pkid;

                //如果URL没有参数
                if (!self.url_parm.exec_timestamp) {
                    isDefaultPage = true;
                    self.btnSwitch.header = true;
                    self.btnSwitch.footer = false;
                    self.url_parm.exec_timestamp =
                        response.near_item.exec_timestamp;
                    self.url_parm.level = response.near_item.level;
                    self.url_parm.pkid = response.near_item.pkid;
                }
                // if (response.near_item.length) {

                // }
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
        async getTransactions(parm) {
            //TODO 当尾页中，点击下一页时候，数组记录
            self.loadingSwitch = true;
            let opt = {
                exec_timestamp: parm.exec_timestamp,
                source: parm.source,
                account: parm.account,
                level: parm.level,
                pkid: parm.pkid
            };
            let response = await self.$api.get(
                "/api/get_account_transactions",
                opt
            );

            if (response.success) {
                self.database = response.transactions;
                self.pageFirstItem = response.transactions[0];
                // if (response.transactions.length < 20) {
                //     self.$router.push(`/transactions`);
                // }
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
        width: 45%; /* 默认值, 具体根据视觉可改 */
        text-align: right;
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
