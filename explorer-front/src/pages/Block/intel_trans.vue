<template>
    <div class="page-block">
        <czr-header></czr-header>
        <div class="block-wrap" v-loading="loadingSwitch">
            <div class="container">
                <el-tabs v-model="activeName" @tab-click="change_table">
                    <el-tab-pane
                        :label="$t('block.trans_detail')"
                        name="trans_info"
                    ></el-tab-pane>
                    <el-tab-pane
                        :label="$t('block.advanced_info')"
                        name="advanced_info"
                    ></el-tab-pane>

                    <el-tab-pane
                        :label="$t('block.contract_transactions')"
                        name="intel_trans"
                    >
                        <template v-if="IS_GET_INFO">
                            <el-table :data="intel_trans" style="width: 100%">
                                <el-table-column :label="$t('block.trans_type')" width="220">
                                    <template slot-scope="scope">
                                        <template v-if="scope.row.type === '0'">
                                            <span class="beautify-color">
                                                {{ scope.row.type_before }}
                                            </span>
                                            {{ scope.row.type_str }}
                                        </template>
                                        <template
                                            v-else-if="scope.row.type === '1'"
                                            >create</template
                                        >
                                        <template
                                            v-else-if="scope.row.type === '2'"
                                            >suicide</template
                                        >
                                    </template>
                                </el-table-column>
                                <el-table-column :label="$t('block.sender')" width="220">
                                    <template slot-scope="scope">
                                        <template v-if="scope.row.type === '2'">
                                            <router-link
                                                class="table-long-item"
                                                :to="{
                                                    path:
                                                        '/account/' +
                                                        scope.row
                                                            .contract_address_suicide
                                                }"
                                            >
                                                {{
                                                    scope.row
                                                        .contract_address_suicide
                                                }}
                                            </router-link>
                                        </template>
                                        <template v-else>
                                            <router-link
                                                class="table-long-item"
                                                :to="{
                                                    path:
                                                        '/account/' +
                                                        scope.row.from
                                                }"
                                            >
                                                {{ scope.row.from }}
                                            </router-link>
                                        </template>
                                    </template>
                                </el-table-column>
                                <el-table-column :label="$t('block.receiver')" width="220">
                                    <template slot-scope="scope">
                                        <template v-if="scope.row.type === '2'">
                                            <router-link
                                                class="table-long-item"
                                                :to="{
                                                    path:
                                                        '/account/' +
                                                        scope.row.refund_adderss
                                                }"
                                            >
                                                {{ scope.row.refund_adderss }}
                                            </router-link>
                                        </template>
                                        <template
                                            v-else-if="scope.row.type === '1'"
                                        >
                                            <router-link
                                                class="table-long-item"
                                                :to="{
                                                    path:
                                                        '/account/' +
                                                        scope.row
                                                            .contract_address_create
                                                }"
                                            >
                                                {{
                                                    scope.row
                                                        .contract_address_create
                                                }}
                                            </router-link>
                                        </template>
                                        <template v-else>
                                            <template v-if="scope.row.to">
                                                <template>
                                                    <router-link
                                                        class="table-long-item"
                                                        :to="{
                                                            path:
                                                                '/account/' +
                                                                scope.row.to
                                                        }"
                                                    >
                                                        {{ scope.row.to }}
                                                    </router-link>
                                                </template>
                                            </template>
                                            <template v-else>
                                                <span>-</span>
                                            </template>
                                        </template>
                                    </template>
                                </el-table-column>
                                <el-table-column :label="$t('block.status')" width="60">
                                    <template slot-scope="scope">
                                        <template v-if="scope.row.is_error">
                                            <span class="txt-danger">{{$t('block.fail')}}</span>
                                        </template>
                                        <template v-else>
                                            <span class="txt-success"
                                                >{{$t('block.success')}}</span
                                            >
                                        </template>
                                    </template>
                                </el-table-column>
                                <el-table-column :label="$t('block.amount')" width="180">
                                    <template slot-scope="scope">
                                        <template
                                            v-if="scope.row.type === '2'"
                                            >{{
                                                scope.row.balance | toCZRVal
                                            }}</template
                                        >
                                        <template v-else>
                                            {{
                                                scope.row.value | toCZRVal
                                            }} </template
                                        >CZR
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    label="Gas Limit"
                                    align="right"
                                >
                                    <template slot-scope="scope">
                                        <span>
                                            {{ scope.row.gas || 0 }}
                                        </span>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </template>
                    </el-tab-pane>
                    <template v-if="hash_props.is_event_log">
                        <el-tab-pane
                            :label="$t('block.event_log')"
                            name="event_log"
                        ></el-tab-pane>
                    </template>
                </el-tabs>
            </div>
        </div>
        <czr-footer></czr-footer>
    </div>
</template>

<script>
import CzrHeader from "@/components/Header/Header";
import CzrFooter from "@/components/Footer/Footer";

let self = null;
let trsns_info;

export default {
    name: "Block",
    components: {
        CzrHeader,
        CzrFooter
    },
    data() {
        return {
            blockHash: this.$route.params.id,
            isSuccess: false,
            loadingSwitch: true,
            IS_GET_INFO: false,
            intel_trans: [],
            hash_props: {
                type: "2",
                is_event_log: false,
                is_token_trans: false,
                is_intel_trans: false
            },
            // change
            activeName: "intel_trans"
        };
    },
    created() {
        self = this;
        this.getTransactions();
        this.getTransactionsProps();
    },
    methods: {
        async getTransactionsProps() {
            //TODO 没有搜见证交易
            self.loadingSwitch = true;
            let opt = {
                hash: self.blockHash
            };
            let response = await self.$api.get(
                "/api/get_transaction_props",
                opt
            );
            if (response.success) {
                self.hash_props = response.data;
            } else {
                self.hash_props = [];
            }
        },
        async getTransactions() {
            //TODO 没有搜见证交易
            self.loadingSwitch = true;
            let opt = {
                hash: self.blockHash
            };
            let response = await self.$api.get(
                "/api/get_transaction_trans_internal",
                opt
            );

            if (response.success) {
                let typeStr = "";
                let beautify = "";
                response.data.forEach(element => {
                    if (element.type === "0") {
                        typeStr = element.call_type;
                        element.type_before = self.format(
                            element.trace_address
                        );
                        element.type_str = `${typeStr}_${element.trace_address}`;
                    } else if (element.type === "1") {
                        typeStr = "create";
                        element.type_str = typeStr;
                    } else if (element.type === "2") {
                        typeStr = "suicide";
                        element.type_str = typeStr;
                    }
                });
                self.intel_trans = response.data;
            } else {
                self.intel_trans = [];
            }

            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        change_table(tab, event) {
            switch (tab.name) {
                case "trans_info":
                    this.$router.push(`/block/${self.blockHash}`);
                    break;
                case "intel_trans":
                    break;
                case "event_log":
                    this.$router.push(`/block/${self.blockHash}/event_log`);
                    break;
                case "advanced_info":
                    this.$router.push(`/block/${self.blockHash}/advanced_info`);
                    break;
            }
        },
        format(trace_address) {
            let traceAddressAry = trace_address.split("_");

            let result = {
                before: "|-"
            };
            for (let i = 1; i < traceAddressAry.length; i++) {
                result.before += "---";
            }
            return `${result.before}`;
        }
    }
};
</script>