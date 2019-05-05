<template>
    <div class="page-block">
        <header-cps></header-cps>
        <div class="block-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <strong class="sub_header-tit">账户信息</strong>
                    <span class="sub_header-des">{{account}}</span>
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
                            交易数
                            <span class="space-des"></span>
                        </strong>
                        <div class="bui-dlist-det">{{totalVal}} 次</div>
                    </div>
                </div>
                <div class="account-content">
                    <h2 class="transfer-tit">交易记录</h2>
                    <div class="accounts-list-wrap" v-loading="loadingSwitch">
                        <template>
                            <el-table :data="tx_list" style="width: 100%">
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
                                <el-pagination
                                    small
                                    background
                                    layout="total,prev, pager, next"
                                    @current-change="handleCurrentChange"
                                    :current-page.sync="currentPage"
                                    :page-size="limitVal"
                                    :total="totalVal"
                                    :pager-count="5"
                                ></el-pagination>
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

export default {
    name: "Block",
    components: {
        HeaderCps,
        Search
    },
    data() {
        return {
            account: this.$route.params.id,
            balance: 0,
            pagingSwitch: {
                limit: 2,
                beforeDisabled: true,
                nextDisabled: false
            },
            accountInfo: {
                address: this.$route.params.id,
                balance: 0,
                tran_count: 0
            },
            tx_list: [],
            loadingSwitch: true,

            currentPage: 1,
            limitVal: 20,
            totalVal: 0
        };
    },
    created() {
        self = this;
        this.initDatabase();
        self.getAccountLists();
        this.initTransactionInfo();
    },
    methods: {
        initTransactionInfo() {},
        async initDatabase() {
            let opt ={
                account: self.accountInfo.address
            }
            let response = await self.$api.get("/api/get_account", opt);
            if ({}.toString.call(response) === "[object Object]") {
                    self.accountInfo.balance = response.account.balance;
                    self.accountInfo.tran_count =
                        response.account.tran_count;
            } else {
                console.error("/api/get_account Error");
            }
        },
        async getAccountLists() {
            //TODO 优化分页性能
            let opt ={
                account: self.accountInfo.address,
                page: self.currentPage
            }
            let response = await self.$api.get("/api/get_account_list", opt);
            if ({}.toString.call(response) === "[object Object]") {
                self.totalVal = response.count;
                self.tx_list = response.tx_list;
            } else {
                self.tx_list = [];
                console.error("/api/get_account_list Error");
            }
            self.loadingSwitch = false;
        },
        handleCurrentChange(val) {
            self.getAccountLists();
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
