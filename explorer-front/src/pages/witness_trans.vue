<template>
    <div class="page-list">
        <czr-header></czr-header>
        <div class="page-container">
            <div class="container">
                <div class="list-wrap" v-loading="loadingSwitch">
                    <strong class="list-title">{{
                        $t("witness_trans.witness_trans_list")
                    }}</strong>
                    <span class="sub_header-des"
                        >{{ $t("normal_trans.total") }} {{ TOTAL_VAL }}
                        {{ $t("normal_trans.trans") }}</span
                    >
                    <template v-if="IS_GET_INFO">
                        <witness-list :database="database"></witness-list>
                    </template>
                </div>
                <template v-if="database.length">
                    <div class="pagin-block">
                        <el-button-group>
                            <el-button
                                size="mini"
                                :disabled="btnSwitch.header"
                                @click="getPaginationFlag('header')"
                                >{{ $t("accoount.first") }}</el-button
                            >
                            <el-button
                                size="mini"
                                icon="el-icon-arrow-left"
                                :disabled="btnSwitch.left"
                                @click="getPaginationFlag('left')"
                                >{{ $t("accoount.prev") }}</el-button
                            >
                            <el-button
                                size="mini"
                                :disabled="btnSwitch.right"
                                @click="getPaginationFlag('right')"
                            >
                                {{ $t("accoount.next") }}
                                <i
                                    class="el-icon-arrow-right el-icon--right"
                                ></i>
                            </el-button>
                            <el-button
                                size="mini"
                                :disabled="btnSwitch.footer"
                                @click="getPaginationFlag('footer')"
                                >{{ $t("accoount.last") }}</el-button
                            >
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
import WitnessList from "@/components/List/Witness";

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
let isDefaultPage = false;

export default {
    name: "Accounts",
    components: {
        CzrHeader,
        CzrFooter,
        WitnessList
    },
    data() {
        return {
            TOTAL_VAL: 0,
            loadingSwitch: true,
            IS_GET_INFO: false,
            TRANS_TYPE: 1,
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            database: [
                // {
                //     exec_timestamp: "-",
                //     hash: "0",
                //     from: 0,
                //     to: 0,
                //     amount: 0
                // }
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
                self.$router.push(`/witness_trans?stable_index=0&position=4`);
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(`/witness_trans`);
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/witness_trans?stable_index=${self.pageFirstItem.stable_index}&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/witness_trans?stable_index=${self.pageLastItem.stable_index}&position=3`
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
            let response = await self.$api.get("/api/get_trans", opt);
            if (response.success) {
                self.database = response.transactions;
                if (response.transactions.length) {
                    self.pageFirstItem = response.transactions[0];
                    self.pageLastItem =
                        response.transactions[response.transactions.length - 1];
                    if (
                        response.transactions.length < 20 &&
                        parm.position === "2"
                    ) {
                        self.$router.push(`/witness_trans`);
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

