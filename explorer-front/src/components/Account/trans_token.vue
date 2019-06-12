<template>
    <div class="page-block">
        <header-cps></header-cps>
        <div class="block-info-wrap">
            <div class="container">
                <search></search>
                <sub-header :type="accountInfo.type" :address="accountInfo.address"></sub-header>
                <div class="account-panel" v-loading="loadingSwitch">
                    <template v-if="IS_GET_ACC">
                        <account-info
                            :type="accountInfo.type"
                            :is_token="accountInfo.is_token_account"
                            :balance="accountInfo.balance"
                            :total="accountInfo.total"
                            :own_account="accountInfo.own_account"
                            :born_unit="accountInfo.born_unit"
                            :symbol="accountInfo.symbol"
                        ></account-info>
                    </template>
                </div>
                <div class="account-main">
                    <template>
                        <el-tabs v-model="activeName" @tab-click="change_table">
                            <el-tab-pane label="交易记录" name="transaction"></el-tab-pane>
                            <template v-if="accountInfo.is_has_token_trans">
                                <el-tab-pane label="Token转账" name="trans_token">
                                    <div class="account-content">
                                        <el-row>
                                            <el-col :span="6">
                                                <h2 class="transfer-tit">Token转账</h2>
                                            </el-col>
                                            <el-col :span="18" style="text-align: right;">
                                                <template>
                                                    <el-radio
                                                        v-model="url_parm.source"
                                                        label="1"
                                                        @change="handlerChange"
                                                    >发送</el-radio>
                                                    <el-radio
                                                        v-model="url_parm.source"
                                                        label="2"
                                                        @change="handlerChange"
                                                    >接收</el-radio>
                                                </template>
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
                                                            <el-button
                                                                @click="goBlockPath(scope.row.hash)"
                                                                type="text"
                                                            >
                                                                <span
                                                                    class="table-long-item"
                                                                >{{scope.row.hash}}</span>
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
                                                                    <span
                                                                        class="table-long-item"
                                                                    >{{scope.row.from}}</span>
                                                                </el-button>
                                                            </template>
                                                            <template v-else>
                                                                <span
                                                                    class="table-long-item"
                                                                >{{scope.row.from}}</span>
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
                                                                    <i
                                                                        class="el-icon-sort trans-to-self"
                                                                    ></i>
                                                                </el-button>

                                                                <el-button
                                                                    v-else-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == true)&&(scope.row.mci <= 0)"
                                                                    type="success"
                                                                    size="mini"
                                                                >转入</el-button>

                                                                <el-button
                                                                    v-else
                                                                    type="success"
                                                                    size="mini"
                                                                >转入</el-button>
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
                                                                    <span
                                                                        class="table-long-item"
                                                                    >{{scope.row.to}}</span>
                                                                </template>
                                                            </template>
                                                            <template v-else>
                                                                <span>-</span>
                                                            </template>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column
                                                        label="代币"
                                                        width="230"
                                                        align="right"
                                                    >
                                                        <template slot-scope="scope">
                                                            <span>{{scope.row.amount | toCZRVal}} {{scope.row.token_symbol}}</span>
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
                            </template>
                            <template v-if="accountInfo.is_has_intel_trans">
                                <el-tab-pane label="合约内交易" name="trans_internal"></el-tab-pane>
                            </template>
                            <template v-if="accountInfo.is_has_event_logs">
                                <el-tab-pane label="事件日志" name="event_logs"></el-tab-pane>
                            </template>
                            <template v-if="accountInfo.type === 2">
                                <el-tab-pane label="合约创建代码" name="contract_code"></el-tab-pane>
                            </template>
                        </el-tabs>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import HeaderCps from "@/components/Header/Header";
import Search from "@/components/Search/Search";
import SubHeader from "@/components/Account/components/sub-header";
import AccountInfo from "@/components/Account/components/account-info";

let self = null;
let isDefaultPage = false;

//TODO 交易列表改为 发送 和 接收 两个List ,解决sql搜索慢的问题

export default {
    name: "Block",
    components: {
        HeaderCps,
        SubHeader,
        AccountInfo,
        Search
    },
    data() {
        return {
            loadingSwitch: true,
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            IS_GET_INFO: false,
            IS_GET_ACC: false,
            pageFirstItem: {
                trans_token_id: 0
            },
            pageLastItem: {
                trans_token_id: 0
            },
            first_trans_token_id: "",
            end_trans_token_id: "",
            url_parm: {
                account: this.$route.params.id,
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                trans_token_id: 999999999999,
                source: this.$route.query.source || "1" //1 发送方 2 接收方 3见证交易
            },
            accountInfo: {
                address: this.$route.params.id,
                total: 0,
                balance: 0,
                type: 1,
                is_witness: false,
                transaction_count: 0,
                is_token_account: false,
                is_has_token_trans: false,
                is_has_intel_trans: false,
                is_has_event_logs: false,
                own_account: "",
                born_unit: "",
                symbol: ""
            },
            // change
            activeName: "trans_token",
            // Token转账
            trans_token: []
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length > 1) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.trans_token_id = queryInfo.trans_token_id;
            self.url_parm.source = queryInfo.source;
        }
        self.initDatabase();
        self.getFlagTransactions(self.url_parm);
    },
    methods: {
        async initDatabase() {
            let opt = {
                account: self.accountInfo.address
            };
            let response = await self.$api.get("/api/get_account", opt);

            if (response.success) {
                let accInfo = response.account;
                self.accountInfo.total = Number(accInfo.transaction_count);
                self.accountInfo.balance = accInfo.balance;
                self.accountInfo.type = accInfo.type;

                //是否为Token合约
                self.accountInfo.is_token_account = accInfo.is_token_account;
                //是否有Token交易
                self.accountInfo.is_has_token_trans =
                    accInfo.is_has_token_trans;
                //是否有是否有内部交易
                self.accountInfo.is_has_intel_trans =
                    accInfo.is_has_intel_trans;
                //是否有事件日志
                self.accountInfo.is_has_event_logs = accInfo.is_has_event_logs;
            } else {
                console.error("/api/get_account Error");
            }
            //如果是合约账户，要获取对应信息
            if (self.accountInfo.type === 2) {
                let responseToken = await self.$api.get(
                    "/api/get_contract",
                    opt
                );
                if (response.success) {
                    let tokenInfo = responseToken.data; //token
                    self.accountInfo.own_account = tokenInfo.own_account;
                    self.accountInfo.born_unit = tokenInfo.born_unit;
                    self.accountInfo.symbol = tokenInfo.token_symbol;
                } else {
                    console.error("/api/get_contract Error");
                }
            }
            self.IS_GET_ACC = true;
        },
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/trans_token?trans_token_id=0&source=${
                        self.url_parm.source
                    }&position=4`
                );
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(
                    `/account/${self.url_parm.account}/trans_token?source=${
                        self.url_parm.source
                    }`
                );
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/trans_token?trans_token_id=${
                        self.pageFirstItem.trans_token_id
                    }&source=${self.url_parm.source}&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/trans_token?trans_token_id=${
                        self.pageLastItem.trans_token_id
                    }&source=${self.url_parm.source}&position=3`
                );
                return;
            }
        },
        handlerChange(val) {
            self.$router.push(
                `/account/${self.url_parm.account}/trans_token?source=${val}`
            );
        },

        async getFlagTransactions() {
            //获取交易表首位值；用来禁用首页和尾页的
            let opt = {
                source: self.url_parm.source,
                account: self.url_parm.account
            };
            let response = await self.$api.get(
                "/api/get_trans_token_flag",
                opt
            );

            if (response.success) {
                self.first_trans_token_id = response.near_item.trans_token_id;
                self.end_trans_token_id = response.end_item.trans_token_id;
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
                trans_token_id: parm.trans_token_id
            };
            let response = await self.$api.get("/api/get_trans_token", opt);

            if (response.success) {
                self.trans_token = response.data;
                if (response.data.length) {
                    self.pageFirstItem = response.data[0];
                    self.pageLastItem =
                        response.data[response.data.length - 1];
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
                    self.pageFirstItem.trans_token_id
                ) {
                    self.btnSwitch.header = true;
                    self.btnSwitch.left = true;
                }

                if (
                    self.end_trans_token_id === self.pageLastItem.trans_token_id
                ) {
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
        },
        // 合约相关的
        change_table(tab, event) {
            /**
             * 0 交易记录
             * 1 Token转账
             * 2 合约内交易
             * 3 事件日志
             * 4 合约创建代码
             */
            self.IS_GET_INFO = false;
            self.loadingSwitch = true;
            switch (tab.name) {
                case "transaction":
                    this.$router.push(`/account/${self.accountInfo.address}`);
                    break;
                case "trans_token":
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    break;
                case "trans_internal":
                    this.$router.push(
                        `/account/${self.accountInfo.address}/trans_internal`
                    );
                    break;
                case "event_logs":
                    this.$router.push(
                        `/account/${self.accountInfo.address}/event_logs`
                    );
                    break;
                case "contract_code":
                    this.$router.push(
                        `/account/${self.accountInfo.address}/contract_code`
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
