<template>
    <div class="page-mapping">
        <czr-header></czr-header>
        <div class="page-container">
            <div class="container">
                <el-tabs v-model="activeName" @tab-click="handleClick">
                    <el-tab-pane
                        :label="$t('mainnet_mapping.finished')"
                        name="mapping_log"
                        class="list-wrap"
                    >
                        <template>
                            <el-table
                                :data="database"
                                style="width: 100%"
                                v-loading="loadingSwitch"
                            >
                                <el-table-column
                                    prop="timestamp"
                                    label="时间"
                                    width="160"
                                >
                                    <template slot-scope="scope">{{
                                        scope.row.timestamp | toDate
                                    }}</template>
                                </el-table-column>
                                <el-table-column
                                    prop="eth_address"
                                    :label="$t('mainnet_mapping.eth_account')"
                                    width="150"
                                >
                                    <template slot-scope="scope">
                                        <a
                                            :href="
                                                'https://etherscan.io/address/' +
                                                    scope.row.eth_address +
                                                    '#tokentxns'
                                            "
                                            target="_blank"
                                            class="table-long-item"
                                            >{{ scope.row.eth_address }}</a
                                        >
                                    </template>
                                </el-table-column>
                                <el-table-column width="35">
                                    <i class="el-icon-right"></i>
                                </el-table-column>
                                <el-table-column
                                    prop="czr_account"
                                    :label="$t('mainnet_mapping.czr_account')"
                                    width="150"
                                >
                                    <template slot-scope="scope">
                                        <router-link
                                            class="table-long-item"
                                            :to="
                                                '/account/' +
                                                    scope.row.czr_account
                                            "
                                        >
                                            {{ scope.row.czr_account }}
                                        </router-link>
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="value"
                                    :label="$t('mainnet_mapping.amount')"
                                    min-width="150"
                                    align="right"
                                >
                                    <template slot-scope="scope">
                                        <span>{{
                                            scope.row.value | toCZRVal
                                        }}</span>
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="value"
                                    :label="$t('mainnet_mapping.status')"
                                    width="65"
                                >
                                    <template slot-scope="scope">
                                        <template v-if="scope.row.status === 3">
                                            <span class="txt-success">{{
                                                $t("mainnet_mapping.success")
                                            }}</span>
                                        </template>
                                        <template v-else>
                                            <span class="txt-danger">-</span>
                                        </template>
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="eth_hash"
                                    :label="$t('mainnet_mapping.eth_txn_hash')"
                                    width="150"
                                >
                                    <template slot-scope="scope">
                                        <a
                                            :href="
                                                'https://etherscan.io/tx/' +
                                                    scope.row.eth_hash
                                            "
                                            target="_blank"
                                            class="table-long-item"
                                            >{{ scope.row.eth_hash }}</a
                                        >
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="czr_hash"
                                    :label="$t('mainnet_mapping.czr_txn_hash')"
                                    width="150"
                                >
                                    <template slot-scope="scope">
                                        <router-link
                                            class="table-long-item"
                                            :to="'/block/' + scope.row.czr_hash"
                                        >
                                            {{ scope.row.czr_hash }}
                                        </router-link>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </template>
                        <div class="pagination-wrap" v-if="database.length">
                            <el-pagination
                                @current-change="handleCurrentChange"
                                :current-page.sync="pagination.current_page"
                                :page-size="pagination.limit"
                                layout="total, prev, pager, next"
                                :total="pagination.total"
                            ></el-pagination>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane
                        :label="$t('mainnet_mapping.tobe_processed')"
                        name="mapping_wait"
                    ></el-tab-pane>
                </el-tabs>
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
            activeName: "mapping_log",
            loadingSwitch: true,
            pagination: {
                current_page: 1,
                limit: 20,
                total: 0
            },
            total: 0,
            database: []
        };
    },
    created() {
        self = this;
        self.getCount();
        self.getList(this.pagination.current_page);
    },
    methods: {
        //获取数量
        async getCount() {
            let lastTranResponse = await self.$api.get(
                "/mapping/get_status_multi_count",
                {
                    status: 3
                }
            );
            if (lastTranResponse.success) {
                self.pagination.total = Number(lastTranResponse.data);
            }
        },
        //获取列表
        async getList(current_page) {
            let response = await self.$api.get("/mapping/get_status_multi", {
                page: current_page,
                status: 3
            });
            if (response.success) {
                self.database = response.data;
            }
            self.loadingSwitch = false;
        },
        async handleCurrentChange(val) {
            self.getList(this.pagination.current_page);
        },
        handleClick(tab, event) {
            switch (tab.name) {
                case "mapping_log":
                    this.$router.push(`/mapping_log`);
                    break;
                case "mapping_wait":
                    this.$router.push(`/mapping_wait`);
                    break;
            }
        }
    }
};
</script>

