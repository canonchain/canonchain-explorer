<template>
    <div class="page-list">
        <czr-header></czr-header>
        <div class="page-container">
            <div class="container">
                <div class="list-wrap" v-loading="loadingSwitch">
                    <strong class="list-title">{{ $t('accoount.account_list') }}</strong>
                    <span class="sub_header-des">{{ $t('accoount.total') }} {{ TOTAL_VAL }} {{ $t('accoount.accounts') }}</span>
                    <template v-if="IS_GET_INFO">
                        <account-list :database="database"></account-list>
                    </template>
                </div>
                <template v-if="database.length">
                    <div class="pagin-block">
                        <el-button-group>
                            <el-button
                                size="mini"
                                :disabled="btnSwitch.header"
                                @click="getPaginationFlag('header')"
                            >{{ $t('accoount.first') }}</el-button>
                            <el-button
                                size="mini"
                                icon="el-icon-arrow-left"
                                :disabled="btnSwitch.left"
                                @click="getPaginationFlag('left')"
                            >{{ $t('accoount.prev') }}</el-button>
                            <el-button
                                size="mini"
                                :disabled="btnSwitch.right"
                                @click="getPaginationFlag('right')"
                            >
                                {{ $t('accoount.next') }}
                                <i class="el-icon-arrow-right el-icon--right"></i>
                            </el-button>
                            <el-button
                                size="mini"
                                :disabled="btnSwitch.footer"
                                @click="getPaginationFlag('footer')"
                            >{{ $t('accoount.last') }}</el-button>
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
import AccountList from "@/components/List/Account";

let self = null;
let isDefaultPage = false;

let errorInfo = {
    account: "czr-xxx",
    balance: "-",
    proportion: "0.0 %"
    // rank: 1
};

export default {
    name: "Accounts",
    components: {
        CzrHeader,
        CzrFooter,
        AccountList
    },
    data() {
        return {
            TOTAL_VAL: 0,
            loadingSwitch: true,
            IS_GET_INFO: false,
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            database: [
                // {
                //     account: "-",
                //     balance: "0",
                //     tran_count: 0,
                //     type: 0
                // }
            ],
            pageFirstItem: {
                account: "",
                balance: 0
            },
            pageLastItem: {
                account: "",
                balance: 0
            },
            url_parm: {
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                balance: 0,
                acc_id: 0
            }
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.balance = queryInfo.balance;
            self.url_parm.acc_id = queryInfo.acc_id;
        }
        self.getAccounts(self.url_parm);
        self.getAccountsCount();
    },
    methods: {
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            switch (val) {
                case "footer":
                    self.$router.push(
                        `/accounts?balance=-1&acc_id=-1&position=4`
                    );
                    break;
                case "header":
                    self.$router.push(`/accounts`);
                    break;
                case "left":
                    //取前
                    self.$router.push(
                        `/accounts?balance=${self.pageFirstItem.balance}&acc_id=${self.pageFirstItem.acc_id}&position=2`
                    );
                    break;
                case "right":
                    //取后
                    self.$router.push(
                        `/accounts?balance=${self.pageLastItem.balance}&acc_id=${self.pageLastItem.acc_id}&position=3`
                    );
                    break;
            }
        },

        async getAccountsCount() {
            let response = await self.$api.get("/api/get_accounts_count");
            if (response.success) {
                self.TOTAL_VAL = response.count;
            } else {
                self.TOTAL_VAL = 0;
            }
        },

        async getAccounts(parm) {
            //TODO 当尾页中，点击下一页时候，数组记录
            self.loadingSwitch = true;
            let opt = {
                position: parm.position,
                acc_id: parm.acc_id,
                balance: parm.balance
            };

            let response = await self.$api.get("/api/get_accounts", opt);

            if (response.success) {
                self.database = response.accounts;
                if (response.accounts.length) {
                    self.pageFirstItem = response.accounts[0];
                    self.pageLastItem =
                        response.accounts[response.accounts.length - 1];
                    if (
                        response.accounts.length < 20 &&
                        parm.position === "2"
                    ) {
                        self.$router.push(`/accounts`);
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
            self.getFlagAccounts();
        },
        async getFlagAccounts() {
            //获取交易表首位值；用来禁用首页和尾页的
            let response = await self.$api.get("/api/get_accounts_flag");
            if (response.success) {
                if (response.near_item.acc_id == self.pageFirstItem.acc_id) {
                    self.btnSwitch.header = true;
                    self.btnSwitch.left = true;
                }
                if (response.end_item.acc_id == self.pageLastItem.acc_id) {
                    self.btnSwitch.right = true;
                    self.btnSwitch.footer = true;
                }
            } else {
                console.log("error");
            }
        }
    }
};
</script>