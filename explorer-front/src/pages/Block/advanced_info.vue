<template>
    <div class="page-block">
        <czr-header></czr-header>
        <div class="block-wrap" v-loading="loadingSwitch">
            <div class="container">
                <el-tabs v-model="activeName" @tab-click="change_table">
                    <el-tab-pane label="交易详情" name="trans_info"></el-tab-pane>
                    <el-tab-pane label="高级信息" name="advanced_info">
                        <template>
                            <template v-if="IS_GET_INFO">
                                <div class="bui-dlist">
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">交易号</strong>
                                        <div class="bui-dlist-det">
                                            {{ blockHash }}
                                            <template v-if="blockInfo.type === '1'">
                                                <router-link :to="'/dag/' + blockHash">DAG中查看</router-link>
                                            </template>
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">交易类型</strong>
                                        <div class="bui-dlist-det">
                                            <template v-if="blockInfo.type === '0'">
                                                <span class="txt-info">创世交易</span>
                                            </template>
                                            <template
                                                v-else-if="
                                                    blockInfo.type === '1'
                                                "
                                            >
                                                <span class="txt-info">见证交易</span>
                                            </template>
                                            <template
                                                v-else-if="
                                                    blockInfo.type === '2'
                                                "
                                            >
                                                <span class="txt-info">普通交易</span>
                                            </template>
                                            <template v-else>
                                                <span class="txt-info">-</span>
                                            </template>
                                        </div>
                                    </div>
                                    <template v-if="blockInfo.type === '1' ">
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">发送时间</strong>
                                            <div class="bui-dlist-det">
                                                {{
                                                blockInfo.timestamp
                                                | toDate
                                                }}
                                            </div>
                                        </div>
                                    </template>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">主链时间</strong>
                                        <div class="bui-dlist-det">
                                            {{
                                            blockInfo.mc_timestamp | toDate
                                            }}
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">确认时间</strong>
                                        <div class="bui-dlist-det">
                                            {{
                                            blockInfo.stable_timestamp
                                            | toDate
                                            }}
                                        </div>
                                    </div>
                                    <template v-if="blockInfo.type === '1'">
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">Is Free</strong>
                                            <div class="bui-dlist-det">{{ blockInfo.is_free }}</div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">Is On Mc</strong>
                                            <div class="bui-dlist-det">{{ blockInfo.is_on_mc }}</div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">Witnessed Level</strong>
                                            <div
                                                class="bui-dlist-det"
                                            >{{ blockInfo.witnessed_level }}</div>
                                        </div>
                                    </template>

                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">Level</strong>
                                        <div class="bui-dlist-det">{{ blockInfo.level }}</div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">Mci</strong>
                                        <div class="bui-dlist-det">{{ blockInfo.mci }}</div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">Is Stable</strong>
                                        <div class="bui-dlist-det">{{ blockInfo.is_stable }}</div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">Stable Index</strong>
                                        <div class="bui-dlist-det">{{ blockInfo.stable_index }}</div>
                                    </div>
                                    <template v-if="blockInfo.type !== '1'">
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">From State</strong>
                                            <div class="bui-dlist-det">{{ blockInfo.from_state }}</div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">To States</strong>
                                            <div class="bui-dlist-det">
                                                <template v-if="blockInfo.to_states.length">
                                                    <div
                                                        v-for="(item,index) in blockInfo.to_states"
                                                        :key="index"
                                                    >{{item}}</div>
                                                </template>
                                                <template v-else>-</template>
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">Data Hash</strong>
                                            <div class="bui-dlist-det">{{ blockInfo.data_hash }}</div>
                                        </div>
                                    </template>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">Previous</strong>
                                        <div class="bui-dlist-det">{{ blockInfo.previous }}</div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">Signature</strong>
                                        <div class="bui-dlist-det">{{ blockInfo.signature }}</div>
                                    </div>
                                </div>
                            </template>
                        </template>
                    </el-tab-pane>
                    <template v-if="blockInfo.is_intel_trans">
                        <el-tab-pane label="内部交易" name="intel_trans"></el-tab-pane>
                    </template>
                    <template v-if="blockInfo.is_event_log">
                        <el-tab-pane label="事件日志" name="event_log"></el-tab-pane>
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
            loadingSwitch: true,
            IS_GET_INFO: false,
            blockInfo: {
                //所有类型共有的
                hash: "",
                type: 0,
                from: "",
                handling_fee: 0,
                previous: "",
                timestamp: "",
                work: "",
                signature: "",
                level: "",
                is_stable: "",
                stable_index: "",
                status: "",
                mci: "",
                mc_timestamp: "",
                stable_timestamp: "",
                //普通交易和创始交易私有的
                to: "",
                amount: "",
                data: "",
                data_hash: "",
                // 普通交易私有的
                gas: "",
                gas_used: "",
                gas_price: "",
                contract_address: "",
                log: "",
                log_bloom: "",
                // 见证交易
                last_stable_block: "",
                last_summary_block: "",
                last_summary: "",
                witnessed_level: "",
                best_parent: "",
                is_free: "",
                is_on_mc: "",
                is_event_log: false,
                is_token_trans: false,
                is_intel_trans: false
            },
            // change
            activeName: "advanced_info"
        };
    },
    created() {
        self = this;
        this.initDatabase();
    },
    methods: {
        async initDatabase() {
            let opt = {
                transaction: self.blockHash
            };
            let response = await self.$api.get(
                "/api/get_transaction_short",
                opt
            );
            if (response.success) {
                trsns_info = response.transaction;
                if (trsns_info) {
                    //所有类型共有的
                    self.blockInfo = trsns_info;
                    self.blockInfo.to_states = self.blockInfo.to_states
                        ? self.blockInfo.to_states.split(",")
                        : [];
                }
            } else {
                console.error("/api/get_transaction_short Error");
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
                    this.$router.push(`/block/${self.blockHash}/intel_trans`);
                    break;
                case "event_log":
                    this.$router.push(`/block/${self.blockHash}/event_log`);
                    break;
                case "advanced_info":
                    break;
            }
        }
    }
};
</script>