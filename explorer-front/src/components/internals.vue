<template>
    <div class="page-accounts">
        <header-cps></header-cps>
        <div class="accounts-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <strong>内部交易列表</strong>
                    <span class="sub_header-des">合计 {{TOTAL_VAL}} 个</span>
                </div>
                <div class="accounts-list-wrap" v-loading="loadingSwitch">
                    <template v-if="IS_GET_INFO">
                        <el-table :data="trans_internal" style="width: 100%">
                            <el-table-column label="时间" width="180">
                                <template slot-scope="scope">
                                    <span
                                        class="table-long-item"
                                    >{{scope.row.mc_timestamp | toDate}}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="父区块交易号" width="180">
                                <template slot-scope="scope">
                                    <template>
                                        <router-link
                                            class="table-long-item"
                                            :to="{path: '/block/' + scope.row.hash}"
                                        >{{scope.row.hash}}</router-link>
                                    </template>
                                </template>
                            </el-table-column>

                            <el-table-column label="Type" width="80">
                                <template slot-scope="scope">
                                    <template v-if="scope.row.type === '0'">call</template>
                                    <template v-else-if="scope.row.type === '1'">create</template>
                                    <template v-else-if="scope.row.type === '2'">suicide</template>
                                </template>
                            </el-table-column>
                            <el-table-column label="发送方" width="180">
                                <template slot-scope="scope">
                                    <template v-if="scope.row.type === '2'">
                                        <router-link
                                            class="table-long-item"
                                            :to="{path: '/account/' + scope.row.contract_address_suicide}"
                                        >{{scope.row.contract_address_suicide}}</router-link>
                                    </template>
                                    <template v-else>
                                        <router-link
                                            class="table-long-item"
                                            :to="{path: '/account/' + scope.row.from}"
                                        >{{scope.row.from}}</router-link>
                                    </template>
                                </template>
                            </el-table-column>
                            <el-table-column label="接收方" width="180">
                                <template slot-scope="scope">
                                    <template v-if="scope.row.type === '2'">
                                        <router-link
                                            class="table-long-item"
                                            :to="{path: '/account/' + scope.row.refund_adderss}"
                                        >{{scope.row.refund_adderss}}</router-link>
                                    </template>
                                    <template v-else-if="scope.row.type === '1'">
                                        <router-link
                                            class="table-long-item"
                                            :to="{path: '/account/' + scope.row.contract_address_create}"
                                        >{{scope.row.contract_address_create}}</router-link>
                                    </template>
                                    <template v-else>
                                        <template v-if="scope.row.to">
                                            <template>
                                                <router-link
                                                    class="table-long-item"
                                                    :to="{path: '/account/' + scope.row.to}"
                                                >{{scope.row.to}}</router-link>
                                            </template>
                                        </template>
                                        <template v-else>
                                            <span>-</span>
                                        </template>
                                    </template>
                                </template>
                            </el-table-column>
                            <el-table-column label="数额" align="right">
                                <template slot-scope="scope">
                                    <span>{{scope.row.value | toCZRVal}}</span>
                                </template>
                            </el-table-column>
                        </el-table>
                    </template>
                </div>

                <template v-if="trans_internal.length">
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
                </template>
            </div>
        </div>
    </div>
</template>
<script>
import HeaderCps from "@/components/Header/Header";
import Search from "@/components/Search/Search";

let errorInfo = {
    stable_index: "",
    contract_account: "",
    token_name: "",
    token_symbol: "",
    token_precision: "",
    token_total: "",
    transaction_count: "",
    account_count: ""
};

let self = null;
let isDefaultPage = false;

export default {
    name: "Tokens",
    components: {
        HeaderCps,
        Search
    },
    data() {
        return {
            TOTAL_VAL: 0,
            LIMIT_VAL: 20,
            loadingSwitch: true,
            IS_GET_INFO: false,
            TRANS_TYPE: 2,
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            trans_internal: [],
            pageFirstItem: {
                stable_index: 0
            },
            pageLastItem: {
                stable_index: 0
            },
            url_parm: {
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                stable_index: 999999999999999999
            }
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
                self.$router.push(`/internals?stable_index=0&position=4`);
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(`/internals`);
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/internals?stable_index=${
                        self.pageFirstItem.stable_index
                    }&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/internals?stable_index=${
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
                stable_index: parm.stable_index
            };
            let response = await self.$api.get("/api/get_internals", opt);
            if (response.success) {
                self.trans_internal = response.data;
                if (response.data.length) {
                    self.pageFirstItem = response.data[0];
                    self.pageLastItem = response.data[response.data.length - 1];
                    if (response.data.length < 20) {
                        self.$router.push(`/internals`);
                    }
                } else {
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    return;
                }
            } else {
                self.trans_internal = [errorInfo];
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
            let response = await self.$api.get("/api/get_internal_count");
            if (response.success) {
                self.TOTAL_VAL = response.count;
            } else {
                self.TOTAL_VAL = 0;
            }
        },

        async getFlagTransactions() {
            //获取交易表首位值；用来禁用首页和尾页的
            let response = await self.$api.get("/api/get_internal_flag");
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
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        goAccountPath(account) {
            this.$router.push("/token/" + account);
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

