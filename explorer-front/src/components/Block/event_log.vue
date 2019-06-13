<template>
    <div class="page-block">
        <header-cps></header-cps>
        <div class="block-info-wrap">
            <div class="container">
                <div class="search-wrap">
                    <search></search>
                </div>
                <div class="sub-header">
                    <strong class="sub_header-tit">交易号</strong>
                    <span class="sub_header-des">{{blockHash}}</span>
                </div>
                <template v-loading="loadingSwitch">
                    <template v-if="IS_GET_INFO">
                        <div class="bui-dlist">
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    发送时间
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">{{blockInfo.exec_timestamp|toDate}}</div>
                            </div>
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    状态
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">
                                    <template v-if="isSuccess === false">
                                        <span class="txt-info">暂无信息</span>
                                    </template>
                                    <template v-else>
                                        <template v-if="blockInfo.is_stable === false">
                                            <span class="txt-warning">等待确认</span>
                                        </template>
                                        <template v-else>
                                            <template v-if="blockInfo.status == '0'">
                                                <span class="txt-success">成功</span>
                                            </template>
                                            <template v-else-if="blockInfo.status == '1'">
                                                <span class="txt-danger">失败(1)</span>
                                            </template>
                                            <template v-else-if="blockInfo.status == '2'">
                                                <span class="txt-danger">失败(2)</span>
                                            </template>
                                            <template v-else-if="blockInfo.status == '3'">
                                                <span class="txt-danger">失败(3)</span>
                                            </template>
                                            <template v-else-if="blockInfo.status == '99'">
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
                                <strong class="bui-dlist-tit">
                                    交易类型
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">
                                    <template v-if="blockInfo.type === '0'">
                                        <span class="txt-info">创世交易</span>
                                    </template>
                                    <template v-else-if="blockInfo.type === '1'">
                                        <span class="txt-success">见证交易</span>
                                    </template>
                                    <template v-else-if="blockInfo.type === '2'">
                                        <span class="txt-info">普通交易</span>
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
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">
                                        <span v-if="isSuccess === false">-</span>
                                        <router-link
                                            v-else
                                            :to="'/account/'+blockInfo.from"
                                        >{{blockInfo.from || '-'}}</router-link>
                                    </div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        是否在主链
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">
                                        <template v-if="blockInfo.is_on_mc == '0'">
                                            <span class="txt-danger">False</span>
                                        </template>
                                        <template v-else-if="blockInfo.is_on_mc == '1'">
                                            <span class="txt-success">True</span>
                                        </template>
                                    </div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Free
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">
                                        <template v-if="blockInfo.is_free == '0'">
                                            <span class="txt-danger">False</span>
                                        </template>
                                        <template v-else-if="blockInfo.is_free == '1'">
                                            <span class="txt-success">True</span>
                                        </template>
                                    </div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        last_stable_block
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.last_stable_block || ''}}</div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Last Summary Block
                                        <span class="space-des"></span>
                                    </strong>
                                    <div
                                        class="bui-dlist-det"
                                    >{{blockInfo.last_summary_block || ''}}</div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Last Summary
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.last_summary || ''}}</div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        见证级别
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.witnessed_level || ''}}</div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Best Parent
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.best_parent || ''}}</div>
                                </div>
                            </template>
                            <template v-else>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        发款方
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">
                                        <span v-if="isSuccess === false">-</span>
                                        <router-link
                                            v-else
                                            :to="'/account/'+blockInfo.from"
                                        >{{blockInfo.from || '-'}}</router-link>
                                    </div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        收款方
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">
                                        <span v-if="isSuccess === false">-</span>
                                        <template v-else>
                                            <template v-if="blockInfo.to">
                                                <router-link
                                                    :to="'/account/'+blockInfo.to"
                                                >{{blockInfo.to}}</router-link>
                                            </template>
                                            <template v-else>
                                                <span>-</span>
                                            </template>
                                        </template>
                                    </div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        金额
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.amount | toCZRVal}} CZR</div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Data
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.data || '-'}}</div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Data Hash
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.data_hash || '-'}}</div>
                                </div>
                            </template>
                            <template v-if="blockInfo.type === '2'">
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Gas
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.gas || '-'}}</div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Gas Used
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.gas_used || '-'}}</div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Gas Price
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.gas_price || '-'}}</div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Contract Address
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.contract_address || '-'}}</div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Log
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.log || '-'}}</div>
                                </div>
                                <div class="block-item-des">
                                    <strong class="bui-dlist-tit">
                                        Log Bloom
                                        <span class="space-des"></span>
                                    </strong>
                                    <div class="bui-dlist-det">{{blockInfo.log_bloom || '-'}}</div>
                                </div>
                            </template>
                            <!-- 公共的 -->
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    Previous
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">{{blockInfo.previous || '-'}}</div>
                            </div>
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    Work
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">{{blockInfo.work || '-'}}</div>
                            </div>
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    Signature
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">{{blockInfo.signature || '-'}}</div>
                            </div>
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    Level
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">{{blockInfo.level || '-'}}</div>
                            </div>
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    Stable Index
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">{{blockInfo.stable_index || '-'}}</div>
                            </div>
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    Mci
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">{{blockInfo.mci || '-'}}</div>
                            </div>

                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    Mc Timestamp
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">{{blockInfo.mc_timestamp |toDate}}</div>
                            </div>

                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    Stable Timestamp
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">{{blockInfo.stable_timestamp |toDate}}</div>
                            </div>
                        </div>
                    </template>
                    <div class="block-table">
                        <template>
                            <el-tabs v-model="activeName" @tab-click="change_table">
                                <template v-if="blockInfo.is_token_trans">
                                    <el-tab-pane label="代币转账" name="token_trans"></el-tab-pane>
                                </template>
                                <template v-if="blockInfo.is_intel_trans">
                                    <el-tab-pane label="内部交易" name="intel_trans"></el-tab-pane>
                                </template>
                                <template v-if="blockInfo.is_event_log">
                                    <el-tab-pane label="事件日志" name="event_log">
                                        <div class="block-content" v-loading="loadingSwitch">
                                            <template v-if="IS_GET_INFO">
                                                <el-table :data="event_log" style="width: 100%">
                                                    <el-table-column label="时间" width="180">
                                                        <template slot-scope="scope">
                                                            <span
                                                                class="table-long-item"
                                                            >{{scope.row.mc_timestamp | toDate}}</span>
                                                        </template>
                                                    </el-table-column>
                                                    <!-- <el-table-column label="交易号" width="180">
                                                    <template slot-scope="scope"></template>
                                                    </el-table-column>-->
                                                    <el-table-column label="交易号/模式" width="200">
                                                        <template slot-scope="scope">
                                                            <el-button
                                                                @click="goBlockPath(scope.row.hash)"
                                                                type="text"
                                                            >
                                                                <span
                                                                    class="table-long-item"
                                                                >{{scope.row.hash}}</span>
                                                            </el-button>
                                                            <br>
                                                            <strong>{{scope.row.method}}</strong>
                                                            <p>{{scope.row.method_function}}</p>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column label="事件日志">
                                                        <template slot-scope="scope">
                                                            <template
                                                                v-for="(item,index) in scope.row.topics"
                                                            >
                                                                <p
                                                                    v-bind:key="item"
                                                                >[topic{{index}}] {{ item }}</p>
                                                            </template>
                                                            <p>
                                                                <span>Data {{scope.row.data}}</span>
                                                            </p>
                                                        </template>
                                                    </el-table-column>
                                                </el-table>
                                            </template>
                                        </div>
                                    </el-tab-pane>
                                </template>
                            </el-tabs>
                        </template>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import HeaderCps from "@/components/Header/Header";
import Search from "@/components/Search/Search";

let self = null;
let trsns_info;

export default {
    name: "Block",
    components: {
        HeaderCps,
        Search
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
            activeName: "event_log",
            event_log: []
        };
    },
    created() {
        self = this;
        this.initDatabase();
        this.getTransactions();
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

        async getTransactions() {
            //TODO 没有搜见证交易
            self.loadingSwitch = true;
            let opt = {
                hash: self.blockHash
            };
            let response = await self.$api.get(
                "/api/get_transaction_event_log",
                opt
            );
            let tempTopics;

            if (response.success) {
                self.event_log = response.data;
            } else {
                self.event_log = [];
            }

            // self.IS_GET_INFO = true;
            // self.loadingSwitch = false;
        },
        change_table(tab, event) {
            switch (tab.name) {
                case "token_trans":
                    this.$router.push(`/block/${self.blockHash}`);
                    break;
                case "intel_trans":
                    this.$router.push(`/block/${self.blockHash}/intel_trans`);
                    break;
                case "event_log":
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
#header {
    color: #fff;
    background: #5a59a0;
}

.block-info-wrap {
    position: relative;
    width: 100%;
    margin: 0 auto;
    color: black;
    text-align: left;
    padding-top: 20px;
    padding-bottom: 80px;
}
.block-item-des {
    padding: 10px 0;
    border-bottom: 1px dashed #f6f6f6;
}
@media (max-width: 1199px) {
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
        text-align: left;
    }
    .bui-dlist-det {
        display: block;
        color: #5f5f5f;
        text-align: left;
        margin: 0;
        table-layout: fixed;
        word-break: break-all;
        overflow: hidden;
    }
}

@media (min-width: 1200px) {
    .bui-dlist {
        color: #3f3f3f;
        font-size: 16px;
        line-height: 2.4;
        margin-top: 20px;
        border-top: 1px dashed #f6f6f6;
    }
    .block-item-des {
        display: -webkit-box;
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
    }
    .bui-dlist-tit {
        float: left;
        width: 45%; /* 默认值, 具体根据视觉可改 */
        text-align: right;
        margin: 0;
    }
    .bui-dlist-det {
        float: left;
        color: #5f5f5f;
        width: 80%; /* 默认值，具体根据视觉可改 */
        text-align: left;
        margin: 0;
        table-layout: fixed;
        word-break: break-all;
        overflow: hidden;
    }
}

.bui-dlist-tit .space-des {
    display: inline-block;
    width: 10px;
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

.block-table {
    padding: 30px 0;
}
</style>