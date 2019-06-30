<template>
    <div class="page-account">
        <czr-header></czr-header>
        <div class="page-account-wrap">
            <div class="container">
                <div class="account-panel">
                    <token-info :address="address"></token-info>
                </div>
                <div class="account-main">
                    <el-tabs v-model="activeName" @tab-click="change_table">
                        <el-tab-pane label="代币转账" name="transaction"></el-tab-pane>
                        <el-tab-pane label="持有者" name="holder">
                            <div class="account-content">
                                <div class="accounts-main-wrap" v-loading="loadingSwitch">
                                    <template v-if="IS_GET_TOKEN">
                                        <token-holder-list :database="trans_token"></token-holder-list>
                                        <!-- page -->
                                        <template v-if="trans_token.length">
                                            <div class="pagin-block">
                                                <el-button-group>
                                                    <el-button
                                                        size="mini"
                                                        :disabled="
                                                            btnSwitch.header
                                                        "
                                                        @click="
                                                            getPaginationFlag(
                                                                'header'
                                                            )
                                                        "
                                                    >首页</el-button>
                                                    <el-button
                                                        size="mini"
                                                        icon="el-icon-arrow-left"
                                                        :disabled="
                                                            btnSwitch.left
                                                        "
                                                        @click="
                                                            getPaginationFlag(
                                                                'left'
                                                            )
                                                        "
                                                    >上一页</el-button>
                                                    <el-button
                                                        size="mini"
                                                        :disabled="
                                                            btnSwitch.right
                                                        "
                                                        @click="
                                                            getPaginationFlag(
                                                                'right'
                                                            )
                                                        "
                                                    >
                                                        下一页
                                                        <i
                                                            class="el-icon-arrow-right el-icon--right"
                                                        ></i>
                                                    </el-button>
                                                    <el-button
                                                        size="mini"
                                                        :disabled="
                                                            btnSwitch.footer
                                                        "
                                                        @click="
                                                            getPaginationFlag(
                                                                'footer'
                                                            )
                                                        "
                                                    >尾页</el-button>
                                                </el-button-group>
                                            </div>
                                        </template>
                                    </template>
                                </div>
                            </div>
                        </el-tab-pane>
                    </el-tabs>
                </div>
            </div>
        </div>
        <czr-footer></czr-footer>
    </div>
</template>

<script>
import CzrHeader from "@/components/Header/Header";
import CzrFooter from "@/components/Footer/Footer";
import TokenInfo from "@/components/Token/TokenInfo";
import TokenHolderList from "@/components/Token/TokenHolderList";

let self = null;

export default {
    name: "TokenHolder",
    components: {
        CzrHeader,
        CzrFooter,
        TokenInfo,
        TokenHolderList
    },
    data() {
        return {
            loadingSwitch: true,
            address: this.$route.params.id,
            activeName: "holder",
            IS_GET_TOKEN: false,

            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            pageFirstItem: {
                balance: 0,
                token_asset_id: ""
            },
            pageLastItem: {
                balance: 0,
                token_asset_id: ""
            },
            url_parm: {
                account: this.$route.params.id,
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                balance: 99999999999999,
                token_asset_id: 99999999999999
            },
            trans_token: []
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length > 1) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.balance = queryInfo.balance;
            self.url_parm.token_asset_id = queryInfo.token_asset_id;
        }
        self.getTransactions(self.url_parm);
    },
    methods: {
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/token/${self.url_parm.account}?balance=0&token_asset_id=0&position=4`
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
                    `/token/${self.url_parm.account}?balance=${self.pageFirstItem.balance}&token_asset_id=${self.pageFirstItem.token_asset_id}&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/token/${self.url_parm.account}?balance=${self.pageLastItem.balance}&token_asset_id=${self.pageLastItem.token_asset_id}&position=3`
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
                "/api/get_token_holder_flag",
                opt
            );

            if (response.success) {
                if (
                    response.near_item.token_asset_id ===
                    self.pageFirstItem.token_asset_id
                ) {
                    self.btnSwitch.header = true;
                    self.btnSwitch.left = true;
                }
                if (
                    response.end_item.token_asset_id ===
                    self.pageLastItem.token_asset_id
                ) {
                    self.btnSwitch.right = true;
                    self.btnSwitch.footer = true;
                }
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
                balance: parm.balance,
                token_asset_id: parm.token_asset_id
            };
            let response = await self.$api.get("/api/get_token_holder", opt);
            if (response.success) {
                self.trans_token = response.data;
                if (response.data.length) {
                    self.pageFirstItem = response.data[0];
                    self.pageLastItem = response.data[response.data.length - 1];
                } else {
                    self.IS_GET_TOKEN = true;
                    self.loadingSwitch = false;
                    return;
                }
            } else {
                self.trans_token = [];
            }

            //禁止首页上一页
            if (self.url_parm.position === "1") {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            } else if (self.url_parm.position === "4") {
                self.btnSwitch.right = true;
                self.btnSwitch.footer = true;
            }

            self.IS_GET_TOKEN = true;
            self.loadingSwitch = false;
            self.getFlagTransactions();
        },
        // 合约相关的
        change_table(tab, event) {
            switch (tab.name) {
                case "transaction":
                    this.$router.push(`/token/${self.address}`);
                    break;
                case "holder":
                    break;
            }
        }
    }
};
</script>