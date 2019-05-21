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
                <div class="bui-dlist">
                    <!-- <div class="block-item-des">
                        <strong class="bui-dlist-tit">交易号
                            <span class="space-des"></span>
                        </strong>
                        <div class="bui-dlist-det">{{blockHash}}</div>
                    </div>-->
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
                                    <router-link :to="'/account/'+blockInfo.to">{{blockInfo.to}}</router-link>
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
                            数据
                            <span class="space-des"></span>
                        </strong>
                        <div class="bui-dlist-det">{{blockInfo.data || '-'}}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import HeaderCps from "@/components/Header/Header";
import Search from "@/components/Search/Search";
import transactionsVue from "./transactions.vue";

let self = null;

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
            blockInfo: {
                from: "",
                to: "",
                amount: "0",
                data: "",
                exec_timestamp: "0",
                status: "99",
                is_stable: "0"
            }
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
                if (response.transaction) {
                    self.blockInfo.from = response.transaction.from;
                    self.blockInfo.to = response.transaction.to;
                    self.blockInfo.amount = response.transaction.amount;
                    self.blockInfo.data = response.transaction.data;
                    self.blockInfo.exec_timestamp =
                        response.transaction.exec_timestamp;
                    self.blockInfo.status = response.transaction.status;
                    self.blockInfo.is_stable = response.transaction.is_stable;
                }
            } else {
                console.error("/api/get_transaction_short Error");
            }
            self.loadingSwitch = false;
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
</style>