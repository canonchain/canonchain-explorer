<template>
    <div class="page-block">
        <czr-header></czr-header>
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
                            <!-- <template v-if="accountInfo.is_has_token_trans"></template> -->
                            <!-- <template v-if="accountInfo.is_has_intel_trans"></template> -->
                            <el-tab-pane label="Token转账" name="trans_token"></el-tab-pane>
                            <el-tab-pane label="合约内交易" name="trans_internal"></el-tab-pane>
                            <el-tab-pane label="事件日志" name="event_logs">
                                <div class="account-content">
                                    <el-row>
                                        <el-col :span="6">
                                            <h2 class="transfer-tit">事件日志（最新10条）</h2>
                                        </el-col>
                                    </el-row>
                                    <div class="accounts-list-wrap" v-loading="loadingSwitch">
                                        <template v-if="IS_GET_INFO">
                                            <el-table :data="event_logs" style="width: 100%">
                                                <el-table-column label="时间" width="180">
                                                    <template slot-scope="scope">
                                                        <span
                                                            class="table-long-item"
                                                        >{{scope.row.mc_timestamp | toDate}}</span>
                                                    </template>
                                                </el-table-column>
                                                <!-- <el-table-column label="交易号" width="180">
                                                    <template slot-scope="scope"></template>
                                                </el-table-column>-->
                                                <el-table-column label="交易号/模式" width="200">
                                                    <template slot-scope="scope">
                                                        <el-button
                                                            @click="goBlockPath(scope.row.hash)"
                                                            type="text"
                                                        >
                                                            <span
                                                                class="table-long-item"
                                                            >{{scope.row.hash}}</span>
                                                        </el-button>
                                                        <br>
                                                        <strong>{{scope.row.method}}</strong>
                                                        <p>{{scope.row.method_function}}</p>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="事件日志">
                                                    <template slot-scope="scope">
                                                        <template
                                                            v-for="(item,index) in scope.row.topics"
                                                        >
                                                            <p
                                                                v-bind:key="item"
                                                            >[topic{{index}}] {{ item }}</p>
                                                        </template>
                                                        <p>
                                                            <span>Data {{scope.row.data}}</span>
                                                        </p>
                                                    </template>
                                                </el-table-column>
                                            </el-table>
                                        </template>
                                    </div>
                                </div>
                            </el-tab-pane>
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
import CzrHeader from "@/components/Header/Header";
import Search from "@/components/Search/Search";
import SubHeader from "@/components/Account/components/sub-header";
import AccountInfo from "@/components/Account/components/account-info";

let self = null;

export default {
    name: "ContractCode",
    components: {
        CzrHeader,
        SubHeader,
        AccountInfo,
        Search
    },
    data() {
        return {
            loadingSwitch: true,
            IS_GET_ACC: false,
            IS_GET_INFO: false,

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
            activeName: "event_logs",
            // 合约代码
            event_logs: []
        };
    },
    created() {
        self = this;
        self.initDatabase();
        self.getEventLog();
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
                    this.$router.push(
                        `/account/${self.accountInfo.address}/trans_token`
                    );
                    break;
                case "trans_internal":
                    this.$router.push(
                        `/account/${self.accountInfo.address}/trans_internal`
                    );
                    break;
                case "event_logs":
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    break;
                case "contract_code":
                    this.$router.push(
                        `/account/${self.accountInfo.address}/contract_code`
                    );
                    break;
            }
        },
        async getEventLog() {
            let opt = {
                account: self.accountInfo.address
            };
            let response = await self.$api.get("/api/get_event_log", opt);

            if (response.success) {
                self.event_logs = response.data;
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
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
</style>
