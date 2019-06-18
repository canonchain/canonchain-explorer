<template>
    <div class="page-block">
        <header-cps></header-cps>
        <div class="block-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <span class="sub_header-tit">代币</span>
                    <strong
                        class="sub_header-des"
                    >{{accountInfo.token_symbol}} ( {{accountInfo.token_name}} )</strong>
                </div>
                <div class="bui-dlist">
                    <div class="account-panel" v-loading="loadingSwitch">
                        <template v-if="IS_GET_INFO">
                            <el-row>
                                <el-col :span="12">
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            总供应量
                                            <span class="space-des"></span>
                                        </strong>
                                        <div
                                            class="bui-dlist-det"
                                        >{{accountInfo.token_total | toCZRVal}} {{accountInfo.token_symbol}}</div>
                                    </div>
                                </el-col>
                                <el-col :span="12">
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            小数点
                                            <span class="space-des"></span>
                                        </strong>
                                        <div class="bui-dlist-det">{{accountInfo.token_precision}} 次</div>
                                    </div>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="12">
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            持有者
                                            <span class="space-des"></span>
                                        </strong>
                                        <div class="bui-dlist-det">{{accountInfo.account_count}}</div>
                                    </div>
                                </el-col>
                                <el-col :span="12">
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            交易数
                                            <span class="space-des"></span>
                                        </strong>
                                        <div class="bui-dlist-det">{{accountInfo.transaction_count}}</div>
                                    </div>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="24">
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            合约
                                            <span class="space-des"></span>
                                        </strong>
                                        <div class="bui-dlist-det">
                                            <router-link
                                                :to="{path: '/account/' + accountInfo.contract_account}"
                                            >{{accountInfo.contract_account}}</router-link>
                                        </div>
                                    </div>
                                </el-col>
                            </el-row>
                        </template>
                    </div>
                </div>

                <div class="account-main">
                    <el-tabs v-model="activeName" @tab-click="change_table">
                        <el-tab-pane label="交易" name="transaction">
                            <div class="account-content">
                                <el-row>
                                    <el-col :span="24">
                                        <h2 class="transfer-tit">{{accountInfo.token_symbol}} 相关的交易</h2>
                                    </el-col>
                                </el-row>
                                <div class="accounts-list-wrap" v-loading="loadingSwitch">
                                    <template v-if="IS_GET_INFO">
                                        <el-table :data="trans_token" style="width: 100%">
                                            <el-table-column label="时间" width="180">
                                                <template slot-scope="scope">
                                                    <span
                                                        class="table-long-item"
                                                    >{{scope.row.mc_timestamp | toDate}}</span>
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="交易号" width="180">
                                                <template slot-scope="scope">
                                                    <router-link
                                                        class="table-long-item"
                                                        :to="{path: '/block/' + scope.row.hash}"
                                                    >{{scope.row.hash}}</router-link>
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="发款方" width="180">
                                                <template slot-scope="scope">
                                                    <router-link
                                                        class="table-long-item"
                                                        :to="{path: '/account/' + scope.row.from}"
                                                    >{{scope.row.from}}</router-link>
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="收款方" width="180">
                                                <template slot-scope="scope">
                                                    <router-link
                                                        class="table-long-item"
                                                        :to="{path: '/account/' + scope.row.to}"
                                                    >{{scope.row.to}}</router-link>
                                                </template>
                                            </el-table-column>
                                            <el-table-column label="数量" align="right">
                                                <template slot-scope="scope">
                                                    <span>{{scope.row.amount | toCZRVal}}</span>
                                                </template>
                                            </el-table-column>
                                        </el-table>

                                        <!-- page -->
                                        <template v-if="trans_token.length">
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
                                                        <i
                                                            class="el-icon-arrow-right el-icon--right"
                                                        ></i>
                                                    </el-button>
                                                    <el-button
                                                        size="mini"
                                                        :disabled="btnSwitch.footer"
                                                        @click="getPaginationFlag('footer')"
                                                    >尾页</el-button>
                                                </el-button-group>
                                            </div>
                                        </template>
                                    </template>
                                </div>
                            </div>
                        </el-tab-pane>
                        <el-tab-pane label="持有者" name="holder"></el-tab-pane>
                    </el-tabs>
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
    name: "Token",
    components: {
        HeaderCps,
        Search
    },
    data() {
        return {
            loadingSwitch: true,
            IS_GET_TOKEN: false,
            IS_GET_INFO: false,
            accountInfo: {
                contract_account: this.$route.params.id,
                token_name: "",
                token_symbol: "",
                token_precision: "",
                token_total: "",
                transaction_count: "",
                account_count: ""
            },
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            pageFirstItem: {
                stable_index: 0
            },
            pageLastItem: {
                stable_index: 0
            },
            first_trans_token_id: "",
            end_trans_token_id: "",
            url_parm: {
                account: this.$route.params.id,
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                stable_index: 999999999999
            },

            // change
            activeName: "transaction",
            trans_token: []
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length > 1) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.stable_index = queryInfo.stable_index;
        }
        self.getTokenInfo();
        self.getFlagTransactions();
    },
    methods: {
        async getTokenInfo() {
            let opt = {
                account: self.accountInfo.contract_account
            };
            let response = await self.$api.get("/api/get_token_info", opt);

            if (response.success) {
                let tokenInfo = response.data;
                self.accountInfo.token_name = tokenInfo.token_name;
                self.accountInfo.token_symbol = tokenInfo.token_symbol;
                self.accountInfo.token_precision = tokenInfo.token_precision;
                self.accountInfo.token_total = tokenInfo.token_total;

                self.accountInfo.transaction_count =
                    tokenInfo.transaction_count;
                self.accountInfo.account_count = tokenInfo.account_count;
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/token/${
                        self.url_parm.account
                    }?stable_index=0&position=4`
                );
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(`/token/${self.url_parm.account}`);
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/token/${self.url_parm.account}?stable_index=${
                        self.pageFirstItem.stable_index
                    }&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/token/${self.url_parm.account}?stable_index=${
                        self.pageLastItem.stable_index
                    }&position=3`
                );
                return;
            }
        },

        async getFlagTransactions() {
            //获取交易表首位值；用来禁用首页和尾页的
            let opt = {
                account: self.url_parm.account
            };
            let response = await self.$api.get(
                "/api/get_token_trans_flag",
                opt
            );

            if (response.success) {
                self.first_trans_token_id = response.near_item.stable_index;
                self.end_trans_token_id = response.end_item.stable_index;
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
                account: parm.account,
                stable_index: parm.stable_index
            };
            let response = await self.$api.get("/api/get_token_trans", opt);

            if (response.success) {
                self.trans_token = response.data;
                if (response.data.length) {
                    self.pageFirstItem = response.data[0];
                    self.pageLastItem = response.data[response.data.length - 1];
                } else {
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    return;
                }
            } else {
                self.trans_token = [];
            }
            //禁止首页上一页
            if (parm.position === "1") {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            } else if (parm.position === "4") {
                self.btnSwitch.right = true;
                self.btnSwitch.footer = true;
            }
            if (self.trans_token.length > 0) {
                if (
                    self.first_trans_token_id ===
                    self.pageFirstItem.stable_index
                ) {
                    self.btnSwitch.header = true;
                    self.btnSwitch.left = true;
                }

                if (
                    self.end_trans_token_id === self.pageLastItem.stable_index
                ) {
                    self.btnSwitch.right = true;
                    self.btnSwitch.footer = true;
                }
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },

        // 合约相关的
        change_table(tab, event) {
            switch (tab.name) {
                case "transaction":
                    break;
                case "holder":
                    this.$router.push(
                        `/token/${self.accountInfo.contract_account}/holder`
                    );
                    break;
            }
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
.account-panel {
    min-height: 150px;
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
.account-main {
    padding: 30px 0;
}
.account-content {
    min-height: 300px;
    text-align: left;
    margin-top: 10px;
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
.contract-code {
    display: block;
    height: 300px;
    max-height: 300px;
    margin-top: 5px;
    word-break: break-all;
    white-space: pre-wrap;
    white-space: -moz-pre-wrap;
    white-space: -o-pre-wrap;
    word-wrap: break-word;
    border: 1px solid #e7eaf3;
    padding: 12px;
}
</style>
