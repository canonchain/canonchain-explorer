<template>
    <div class="page-block">
        <czr-header></czr-header>
        <div class="block-wrap" v-loading="loadingSwitch">
            <div class="container">
                <el-tabs v-model="activeName" @tab-click="change_table">
                    <el-tab-pane label="交易详情" name="trans_info">
                        <template>
                            <template v-if="IS_GET_INFO">
                                <template v-if="isSuccess === false">
                                    <div class="info-null">
                                        <i class="info-null-icon el-icon-chat-line-round"></i>
                                        <br />暂无信息
                                    </div>
                                </template>
                                <template v-else>
                                    <div class="bui-dlist">
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">交易号</strong>
                                            <div class="bui-dlist-det">
                                                {{ blockHash }}
                                                <template
                                                    v-if="blockInfo.type === '1'"
                                                >
                                                    <router-link :to="'/dag/' + blockHash">DAG中查看</router-link>
                                                </template>
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">状态</strong>
                                            <div class="bui-dlist-det">
                                                <template v-if="isSuccess === false">
                                                    <span class="txt-info">暂无信息</span>
                                                </template>
                                                <template v-else>
                                                    <template
                                                        v-if="
                                                        blockInfo.is_stable ===
                                                            false
                                                    "
                                                    >
                                                        <span class="txt-warning">等待确认</span>
                                                    </template>
                                                    <template v-else>
                                                        <template
                                                            v-if="
                                                            blockInfo.status ==
                                                                '0'
                                                        "
                                                        >
                                                            <span class="txt-success">成功</span>
                                                        </template>
                                                        <template
                                                            v-else-if="
                                                            blockInfo.status ==
                                                                '1'
                                                        "
                                                        >
                                                            <span class="txt-danger">失败(1)</span>
                                                        </template>
                                                        <template
                                                            v-else-if="
                                                            blockInfo.status ==
                                                                '2'
                                                        "
                                                        >
                                                            <span class="txt-danger">失败(2)</span>
                                                        </template>
                                                        <template
                                                            v-else-if="
                                                            blockInfo.status ==
                                                                '3'
                                                        "
                                                        >
                                                            <span class="txt-danger">失败(3)</span>
                                                        </template>
                                                        <template
                                                            v-else-if="
                                                            blockInfo.status ==
                                                                '99'
                                                        "
                                                        >
                                                            <span class="txt-danger">不存在</span>
                                                        </template>
                                                        <template v-else>
                                                            <span class="txt-info">-</span>
                                                        </template>
                                                    </template>
                                                </template>
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
                                        <template v-if="blockInfo.type === '1'">
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">账户</strong>
                                                <div class="bui-dlist-det">
                                                    <span v-if="isSuccess === false">-</span>
                                                    <router-link
                                                        v-else
                                                        :to="
                                                        '/account/' +
                                                            blockInfo.from
                                                    "
                                                    >
                                                        {{
                                                        blockInfo.from || "-"
                                                        }}
                                                    </router-link>
                                                </div>
                                            </div>
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">是否在主链</strong>
                                                <div class="bui-dlist-det">
                                                    <template
                                                        v-if="
                                                        blockInfo.is_on_mc ==
                                                            '0'
                                                    "
                                                    >
                                                        <span class="txt-danger">False</span>
                                                    </template>
                                                    <template
                                                        v-else-if="
                                                        blockInfo.is_on_mc ==
                                                            '1'
                                                    "
                                                    >
                                                        <span class="txt-success">True</span>
                                                    </template>
                                                </div>
                                            </div>
                                        </template>
                                        <template v-else>
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">发款方</strong>
                                                <div class="bui-dlist-det">
                                                    <span v-if="isSuccess === false">-</span>
                                                    <router-link
                                                        v-else
                                                        :to="
                                                        '/account/' +
                                                            blockInfo.from
                                                    "
                                                    >
                                                        {{
                                                        blockInfo.from || "-"
                                                        }}
                                                    </router-link>
                                                </div>
                                            </div>
                                            <template v-if="blockInfo.contract_address">
                                                <div class="block-item-des">
                                                    <strong class="bui-dlist-tit">收款方</strong>
                                                    <div class="bui-dlist-det">
                                                        [合约
                                                        <router-link
                                                            :to="
                                                            '/account/' +
                                                                blockInfo.contract_address
                                                        "
                                                        >
                                                            {{
                                                            blockInfo.contract_address
                                                            }}
                                                        </router-link>创建]
                                                    </div>
                                                </div>
                                            </template>
                                            <template v-else>
                                                <div class="block-item-des">
                                                    <strong class="bui-dlist-tit">收款方</strong>
                                                    <div class="bui-dlist-det">
                                                        <span
                                                            v-if="
                                                            isSuccess === false
                                                        "
                                                        >-</span>
                                                        <template v-else>
                                                            <template v-if="blockInfo.to">
                                                                <router-link
                                                                    :to="
                                                                    '/account/' +
                                                                        blockInfo.to
                                                                "
                                                                >
                                                                    {{
                                                                    blockInfo.to
                                                                    }}
                                                                </router-link>
                                                            </template>
                                                            <template v-else>
                                                                <span>-</span>
                                                            </template>
                                                        </template>
                                                    </div>
                                                </div>
                                            </template>

                                            <template v-if="trans_token.length">
                                                <div class="block-item-des">
                                                    <strong class="bui-dlist-tit">代币转账</strong>
                                                    <div class="bui-dlist-det">
                                                        <div
                                                            v-for="(item,index) in trans_token"
                                                            :key="index"
                                                        >
                                                            从
                                                            <router-link
                                                                class="table-long-item"
                                                                :to="{
                                                                path:
                                                                    '/account/' +
                                                                    item.from
                                                            }"
                                                            >
                                                                {{
                                                                item.from
                                                                }}
                                                            </router-link>转
                                                            <span class="amount-val">
                                                                {{
                                                                item.amount
                                                                | toTokenVal(
                                                                Math.pow(
                                                                10,
                                                                18
                                                                )
                                                                )
                                                                }}
                                                            </span>
                                                            {{ item.token_symbol }}
                                                            至
                                                            <router-link
                                                                class="table-long-item"
                                                                :to="{
                                                                path:
                                                                    '/account/' +
                                                                    item.to
                                                            }"
                                                            >
                                                                {{
                                                                item.to
                                                                }}
                                                            </router-link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>

                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">金额</strong>
                                                <div class="bui-dlist-det">
                                                    <span class="amount-val">
                                                        {{
                                                        blockInfo.amount
                                                        | toCZRVal
                                                        }}
                                                    </span>
                                                    CZR
                                                </div>
                                            </div>
                                        </template>
                                        <template v-if="blockInfo.type !== '1'">
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">手续费</strong>
                                                <div class="bui-dlist-det">
                                                    {{
                                                    blockInfo.handling_fee
                                                    | toCZRVal
                                                    }}
                                                    CZR
                                                </div>
                                            </div>
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">Gas</strong>
                                                <div class="bui-dlist-det">{{ blockInfo.gas }}</div>
                                            </div>
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">Gas Used</strong>
                                                <div class="bui-dlist-det">{{ blockInfo.gas_used }}</div>
                                            </div>
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">Gas Price</strong>
                                                <div class="bui-dlist-det">
                                                    {{
                                                    blockInfo.gas_price
                                                    | toTokenVal(
                                                    Math.pow(
                                                    10,
                                                    9
                                                    )
                                                    )
                                                    }} (1*10
                                                    <sup>-9</sup> CZR/gas)
                                                </div>
                                            </div>
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">Data</strong>
                                                <div class="bui-dlist-det">
                                                    <pre class="contract-code">{{
                                                    blockInfo.data
                                                }}</pre>
                                                </div>
                                            </div>
                                        </template>
                                        <template v-if="blockInfo.type === '1'">
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">Best Parent</strong>
                                                <div class="bui-dlist-det">
                                                    <router-link
                                                        :to="
                                                        '/block/' +
                                                            blockInfo.best_parent
                                                    "
                                                    >
                                                        {{
                                                        blockInfo.best_parent
                                                        }}
                                                    </router-link>
                                                </div>
                                            </div>
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">Last Stable Block</strong>
                                                <div class="bui-dlist-det">
                                                    <router-link
                                                        :to="
                                                        '/block/' +
                                                            blockInfo.last_stable_block
                                                    "
                                                    >
                                                        {{
                                                        blockInfo.last_stable_block
                                                        }}
                                                    </router-link>
                                                </div>
                                            </div>
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">Last Summary Block</strong>
                                                <div class="bui-dlist-det">
                                                    <router-link
                                                        :to="
                                                        '/block/' +
                                                            blockInfo.last_summary_block
                                                    "
                                                    >
                                                        {{
                                                        blockInfo.last_summary_block
                                                        }}
                                                    </router-link>
                                                </div>
                                            </div>
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">Last Summary</strong>
                                                <div
                                                    class="bui-dlist-det"
                                                >{{ blockInfo.last_summary }}</div>
                                            </div>
                                        </template>
                                    </div>
                                </template>
                            </template>
                        </template>
                    </el-tab-pane>
                    <template v-if="isSuccess">
                        <el-tab-pane label="高级信息" name="advanced_info"></el-tab-pane>
                    </template>
                    <template v-if="blockInfo.is_intel_trans">
                        <el-tab-pane label="合约内交易" name="intel_trans"></el-tab-pane>
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
            isSuccess: false,
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
            activeName: "trans_info",
            trans_token: []
        };
    },
    async created() {
        self = this;
        await this.initDatabase();
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
                if (response.code == 200) {
                    self.isSuccess = true;
                    trsns_info = response.transaction;
                    if (trsns_info) {
                        //所有类型共有的
                        self.blockInfo = trsns_info;
                        self.blockInfo.handling_fee = self.handlingFee(
                            self.blockInfo.gas_used,
                            self.blockInfo.gas_price
                        );
                        //如果有Token交易，获取详情
                        if (self.blockInfo.is_token_trans) {
                            self.getTransToken();
                        }
                    }
                } else {
                    self.isSuccess = false;
                }
            } else {
                console.error("/api/get_transaction_short Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },

        async getTransToken() {
            let opt = {
                hash: self.blockHash
            };
            let response = await self.$api.get(
                "/api/get_transaction_trans_token",
                opt
            );
            if (response.success) {
                self.trans_token = response.data;
            } else {
                self.trans_token = [];
            }

            // let temp = [
            //     {
            //         trans_token_id: "",
            //         hash: "",
            //         mc_timestamp: "",
            //         from: "AAAA",
            //         to: "BBB",
            //         contract_account: "",
            //         token_symbol: "RMB",
            //         token_precision: "18",
            //         amount: "1818181888"
            //     },
            //     {
            //         trans_token_id: "",
            //         hash: "",
            //         mc_timestamp: "",
            //         from: "AAAA",
            //         to: "CCCCCC",
            //         contract_account: "",
            //         token_symbol: "RMB",
            //         token_precision: "18",
            //         amount: "18481818"
            //     }
            // ];
            // self.trans_token = temp;
        },
        handlingFee(gas_use, gas_price) {
            return gas_use * gas_price;
        },
        change_table(tab, event) {
            switch (tab.name) {
                case "trans_info":
                    break;
                case "intel_trans":
                    this.$router.push(`/block/${self.blockHash}/intel_trans`);
                    break;
                case "event_log":
                    this.$router.push(`/block/${self.blockHash}/event_log`);
                    break;
                case "advanced_info":
                    this.$router.push(`/block/${self.blockHash}/advanced_info`);
                    break;
            }
        }
    }
};
</script>