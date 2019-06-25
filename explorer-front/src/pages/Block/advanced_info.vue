<template>
    <div class="page-block">
        <czr-header></czr-header>
        <div class="block-wrap">
            <div class="container">
                <el-tabs v-model="activeName" @tab-click="change_table">
                    <el-tab-pane
                        label="交易详情"
                        name="trans_info"
                    ></el-tab-pane>
                    <el-tab-pane
                        label="内部交易"
                        name="intel_trans"
                    ></el-tab-pane>
                    <el-tab-pane
                        label="事件日志"
                        name="event_log"
                    ></el-tab-pane>
                    <el-tab-pane label="高级信息" name="advanced_info">
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
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            发送时间
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{
                                                blockInfo.exec_timestamp
                                                    | toDate
                                            }}
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            主链时间
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{
                                                blockInfo.mc_timestamp | toDate
                                            }}
                                        </div>
                                    </div>
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
                                                Is Free
                                            </strong>
                                            <div class="bui-dlist-det">
                                                {{ blockInfo.is_free }}
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                Is On Mc
                                            </strong>
                                            <div class="bui-dlist-det">
                                                {{ blockInfo.is_on_mc }}
                                            </div>
                                        </div>
                                        <div class="block-item-des">
                                            <strong class="bui-dlist-tit">
                                                Witnessed Level
                                            </strong>
                                            <div class="bui-dlist-det">
                                                {{ blockInfo.witnessed_level }}
                                            </div>
                                        </div>
                                    </template>

                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            Level
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{ blockInfo.level }}
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            Mci
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{ blockInfo.mci }}
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            Is Stable
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{ blockInfo.is_stable }}
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            Stable Index
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{ blockInfo.stable_index }}
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            From State
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{ blockInfo.stable_timestamp }}
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            To States
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{ blockInfo.stable_timestamp }}
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            Data Hash
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{ blockInfo.data_hash }}
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            Previous
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{ blockInfo.previous }}
                                        </div>
                                    </div>
                                    <div class="block-item-des">
                                        <strong class="bui-dlist-tit">
                                            Signature
                                        </strong>
                                        <div class="bui-dlist-det">
                                            {{ blockInfo.signature }}
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </template>
                    </el-tab-pane>
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
                self.isSuccess = true;
                trsns_info = response.transaction;
                if (trsns_info) {
                    //所有类型共有的
                    self.blockInfo = trsns_info;
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