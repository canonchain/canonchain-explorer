<template>
    <div class="page-block">
        <czr-header></czr-header>
        <div class="block-wrap">
            <div class="container">
                <el-tabs v-model="activeName" @tab-click="change_table">
                    <el-tab-pane label="交易详情" name="trans_info">
                        <template v-loading="loadingSwitch">
                            <template v-if="IS_GET_INFO">
                                <div class="bui-dlist">
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            交易号
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{ blockHash }}
                                            <template
                                                v-if="blockInfo.type === '1'"
                                            >
                                                <router-link
                                                    :to="'/dag/' + blockHash"
                                                    >DAG中查看</router-link
                                                >
                                            </template>
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            状态
                                        </strong>
                                        <div class="bui-dlist-det">
                                            <template
                                                v-if="isSuccess === false"
                                            >
                                                <span class="txt-info"
                                                    >暂无信息</span
                                                >
                                            </template>
                                            <template v-else>
                                                <template
                                                    v-if="
                                                        blockInfo.is_stable ===
                                                            false
                                                    "
                                                >
                                                    <span class="txt-warning"
                                                        >等待确认</span
                                                    >
                                                </template>
                                                <template v-else>
                                                    <template
                                                        v-if="
                                                            blockInfo.status ==
                                                                '0'
                                                        "
                                                    >
                                                        <span
                                                            class="txt-success"
                                                            >成功</span
                                                        >
                                                    </template>
                                                    <template
                                                        v-else-if="
                                                            blockInfo.status ==
                                                                '1'
                                                        "
                                                    >
                                                        <span class="txt-danger"
                                                            >失败(1)</span
                                                        >
                                                    </template>
                                                    <template
                                                        v-else-if="
                                                            blockInfo.status ==
                                                                '2'
                                                        "
                                                    >
                                                        <span class="txt-danger"
                                                            >失败(2)</span
                                                        >
                                                    </template>
                                                    <template
                                                        v-else-if="
                                                            blockInfo.status ==
                                                                '3'
                                                        "
                                                    >
                                                        <span class="txt-danger"
                                                            >失败(3)</span
                                                        >
                                                    </template>
                                                    <template
                                                        v-else-if="
                                                            blockInfo.status ==
                                                                '99'
                                                        "
                                                    >
                                                        <span class="txt-danger"
                                                            >不存在</span
                                                        >
                                                    </template>
                                                    <template v-else>
                                                        <span class="txt-info"
                                                            >-</span
                                                        >
                                                    </template>
                                                </template>
                                            </template>
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            交易类型
                                        </strong>
                                        <div class="bui-dlist-det">
                                            <template
                                                v-if="blockInfo.type === '0'"
                                            >
                                                <span class="txt-info"
                                                    >创世交易</span
                                                >
                                            </template>
                                            <template
                                                v-else-if="
                                                    blockInfo.type === '1'
                                                "
                                            >
                                                <span class="txt-info"
                                                    >见证交易</span
                                                >
                                            </template>
                                            <template
                                                v-else-if="
                                                    blockInfo.type === '2'
                                                "
                                            >
                                                <span class="txt-info"
                                                    >普通交易</span
                                                >
                                            </template>
                                            <template v-else>
                                                <span class="txt-info">-</span>
                                            </template>
                                        </div>
                                    </div>
                                    <template v-if="blockInfo.type === '1'">
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                账户
                                            </strong>
                                            <div class="bui-dlist-det">
                                                <span v-if="isSuccess === false"
                                                    >-</span
                                                >
                                                <router-link
                                                    v-else
                                                    :to="
                                                        '/account/' +
                                                            blockInfo.from
                                                    "
                                                    >{{
                                                        blockInfo.from || "-"
                                                    }}</router-link
                                                >
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                是否在主链
                                            </strong>
                                            <div class="bui-dlist-det">
                                                <template
                                                    v-if="
                                                        blockInfo.is_on_mc ==
                                                            '0'
                                                    "
                                                >
                                                    <span class="txt-danger"
                                                        >False</span
                                                    >
                                                </template>
                                                <template
                                                    v-else-if="
                                                        blockInfo.is_on_mc ==
                                                            '1'
                                                    "
                                                >
                                                    <span class="txt-success"
                                                        >True</span
                                                    >
                                                </template>
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                Free
                                            </strong>
                                            <div class="bui-dlist-det">
                                                <template
                                                    v-if="
                                                        blockInfo.is_free == '0'
                                                    "
                                                >
                                                    <span class="txt-danger"
                                                        >False</span
                                                    >
                                                </template>
                                                <template
                                                    v-else-if="
                                                        blockInfo.is_free == '1'
                                                    "
                                                >
                                                    <span class="txt-success"
                                                        >True</span
                                                    >
                                                </template>
                                            </div>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                发款方
                                            </strong>
                                            <div class="bui-dlist-det">
                                                <span v-if="isSuccess === false"
                                                    >-</span
                                                >
                                                <router-link
                                                    v-else
                                                    :to="
                                                        '/account/' +
                                                            blockInfo.from
                                                    "
                                                    >{{
                                                        blockInfo.from || "-"
                                                    }}</router-link
                                                >
                                            </div>
                                        </div>
                                        <template
                                            v-if="blockInfo.contract_address"
                                        >
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">
                                                    收款方
                                                </strong>
                                                <div class="bui-dlist-det">
                                                    [合约
                                                    <router-link
                                                        :to="
                                                            '/account/' +
                                                                blockInfo.contract_address
                                                        "
                                                        >{{
                                                            blockInfo.contract_address
                                                        }}</router-link
                                                    >
                                                    创建]
                                                </div>
                                            </div>
                                        </template>
                                        <template v-else>
                                            <div class="block-item-des">
                                                <strong class="bui-dlist-tit">
                                                    收款方
                                                </strong>
                                                <div class="bui-dlist-det">
                                                    <span
                                                        v-if="
                                                            isSuccess === false
                                                        "
                                                        >-</span
                                                    >
                                                    <template v-else>
                                                        <template
                                                            v-if="blockInfo.to"
                                                        >
                                                            <router-link
                                                                :to="
                                                                    '/account/' +
                                                                        blockInfo.to
                                                                "
                                                                >{{
                                                                    blockInfo.to
                                                                }}</router-link
                                                            >
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
                                                <strong class="bui-dlist-tit">
                                                    代币转账
                                                </strong>
                                                <div class="bui-dlist-det">
                                                    <div
                                                        v-for="item in trans_token"
                                                    >
                                                        从
                                                        <router-link
                                                            class="table-long-item"
                                                            :to="{
                                                                path:
                                                                    '/account/' +
                                                                    item.from
                                                            }"
                                                            >{{
                                                                item.from
                                                            }}</router-link
                                                        >
                                                        转
                                                        <span
                                                            class="amount-val"
                                                        >
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
                                                            >{{
                                                                item.to
                                                            }}</router-link
                                                        >
                                                    </div>
                                                </div>
                                            </div>
                                        </template>

                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                金额
                                            </strong>
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
                                            <strong class="bui-dlist-tit">
                                                手续费
                                            </strong>
                                            <div class="bui-dlist-det">
                                                {{
                                                    blockInfo.handling_fee
                                                        | toCZRVal
                                                }}
                                                CZR
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                Gas
                                            </strong>
                                            <div class="bui-dlist-det">
                                                {{ blockInfo.gas }}
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                Gas Used
                                            </strong>
                                            <div class="bui-dlist-det">
                                                {{ blockInfo.gas_used }}
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                Gas Price
                                            </strong>
                                            <div class="bui-dlist-det">
                                                {{ blockInfo.gas_price }}
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                Data
                                            </strong>
                                            <div class="bui-dlist-det">
                                                <pre class="contract-code">{{
                                                    blockInfo.data
                                                }}</pre>
                                            </div>
                                        </div>
                                    </template>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            确认时间
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{
                                                blockInfo.stable_timestamp
                                                    | toDate
                                            }}
                                        </div>
                                    </div>
                                    <template v-if="blockInfo.type === '1'">
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                Best Parent
                                            </strong>
                                            <div class="bui-dlist-det">
                                                <router-link
                                                    :to="
                                                        '/block/' +
                                                            blockInfo.best_parent
                                                    "
                                                    >{{
                                                        blockInfo.best_parent
                                                    }}</router-link
                                                >
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                Last Stable Block
                                            </strong>
                                            <div class="bui-dlist-det">
                                                <router-link
                                                    :to="
                                                        '/block/' +
                                                            blockInfo.last_stable_block
                                                    "
                                                    >{{
                                                        blockInfo.last_stable_block
                                                    }}</router-link
                                                >
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                Last Summary Block
                                            </strong>
                                            <div class="bui-dlist-det">
                                                <router-link
                                                    :to="
                                                        '/block/' +
                                                            blockInfo.last_summary_block
                                                    "
                                                    >{{
                                                        blockInfo.last_summary_block
                                                    }}</router-link
                                                >
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                Last Summary
                                            </strong>
                                            <div class="bui-dlist-det">
                                                {{ blockInfo.last_summary }}
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </template>
                        </template>
                    </el-tab-pane>
                    <el-tab-pane
                        label="内部交易"
                        name="intel_trans"
                    ></el-tab-pane>
                    <el-tab-pane
                        label="事件日志"
                        name="event_log"
                    ></el-tab-pane>
                    <el-tab-pane
                        label="高级信息"
                        name="advanced_info"
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
                exec_timestamp: "",
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
                is_event_log: "",
                is_token_trans: "",
                is_intel_trans: ""
            },
            // change
            activeName: "trans_info",
            trans_token: []
        };
    },
    created() {
        self = this;
        this.initDatabase();
        this.getTransToken();
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
                self.isSuccess = true;
                trsns_info = response.transaction;
                if (trsns_info) {
                    //所有类型共有的
                    self.blockInfo = trsns_info;
                    self.blockInfo.handling_fee = self.handlingFee(
                        self.blockInfo.gas_used,
                        self.blockInfo.gas_price
                    );
                    // self.blockInfo.contract_address = self.blockInfo.from;
                }
            } else {
                console.error("/api/get_transaction_short Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },

        async getTransToken() {
            self.loadingSwitch = true;
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

            // self.IS_GET_INFO = true;
            // self.loadingSwitch = false;
        },
        handlingFee(gas_use, gas_price) {
            return gas_use * gas_price;
        },
        change_table(tab, event) {
            switch (tab.name) {
                case "token_trans":
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

<style   scoped>
.page-block {
    width: 100%;
    position: relative;
}
.page-block .table-long-item {
    line-height: 10px;
}
.block-wrap {
    position: relative;
    min-height: 650px;
    background-color: #fff;
    width: 100%;
    margin: 20px auto 20px;
    color: black;
    text-align: left;
    padding-top: 5px;
    padding-bottom: 20px;
}
.bui-dlist {
    color: #3f3f3f;
    font-size: 16px;
    line-height: 2.4;
}
.block-item-des {
    display: -webkit-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: block;
}
.bui-dlist-tit {
    display: block;
    width: 100%; /* 默认值, 具体根据视觉可改 */
    margin: 0;
    font-size: 12px;
    height: 32px;
    line-height: 32px;
    color: #333333;
    text-align: left;
}
.bui-dlist-det {
    display: block;
    font-size: 13px;
    color: #999999;
    text-align: left;
    margin: 0;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
}

@media (min-width: 1200px) {
    .bui-dlist {
        margin-top: 20px;
        /* border-top: 1px dashed #f6f6f6; */
    }
    .block-item-des {
        display: -webkit-box;
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
    }
    .bui-dlist-tit {
        float: left;
        width: 25%; /* 默认值, 具体根据视觉可改 */
        text-align: right;
        padding-right: 10px;
        margin: 0;
    }
    .bui-dlist-det {
        float: left;
        width: 65%; /* 默认值，具体根据视觉可改 */
    }
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

/* Hash Info */
.hash-wrap {
    border: 1px solid #e3e7ec;
    min-height: 500px;
    border-radius: 5px;
}
.amount-val {
    font-size: 15px;
    color: #333;
    line-height: 31px;
}
</style>