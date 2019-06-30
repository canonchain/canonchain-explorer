<template>
    <div class="page-list">
        <czr-header></czr-header>
        <div class="page-container">
            <div class="container">
                <div class="list-wrap" v-loading="loadingSwitch">
                    <strong class="list-title">内部交易列表</strong>
                    <span class="sub_header-des">合计 {{ TOTAL_VAL }} 笔交易</span>
                    <template v-if="IS_GET_INFO">
                        <internal-list :database="database"></internal-list>
                    </template>
                </div>
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
                    </div>
                </template>
            </div>
        </div>
        <czr-footer></czr-footer>
    </div>
</template>
<script>
import CzrHeader from "@/components/Header/Header";
import CzrFooter from "@/components/Footer/Footer";
import InternalList from "@/components/List/Internal";

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
        CzrHeader,
        CzrFooter,
        InternalList
    },
    data() {
        return {
            TOTAL_VAL: 0,
            loadingSwitch: true,
            IS_GET_INFO: false,
            TRANS_TYPE: 2,
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            database: [],
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
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.stable_index = queryInfo.stable_index;
        }
        self.getTransactions(self.url_parm);
        self.getTransactionsCount();
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
                    `/internals?stable_index=${self.pageFirstItem.stable_index}&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/internals?stable_index=${self.pageLastItem.stable_index}&position=3`
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
                self.database = response.data;
                if (response.data.length) {
                    self.pageFirstItem = response.data[0];
                    self.pageLastItem = response.data[response.data.length - 1];
                    if (response.data.length < 20 && parm.position === "2") {
                        self.$router.push(`/internals`);
                    }
                } else {
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    return;
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
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
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
        },
        goAccountPath(account) {
            this.$router.push("/token/" + account);
        }
    }
};
</script>

