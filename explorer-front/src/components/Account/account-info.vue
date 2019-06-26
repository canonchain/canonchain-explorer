<template>
    <div class="com-account-wrap">
        <div class="acc-address">
            <!-- -->
            <strong class="acc-address-tit">账户地址</strong>
            <span class="acc-address-des">{{ address }}</span>
        </div>
        <div class="bui-dlist">
            <el-row>
                <el-col :span="12">
                    <div class="block-item-des">
                        <strong class="bui-dlist-tit">
                            交易类型
                        </strong>
                        <div class="bui-dlist-det">
                            <template v-if="type == 2">
                                合约账户
                            </template>
                            <template v-else>
                                普通账户
                            </template>
                        </div>
                    </div>
                </el-col>
                <el-col :span="12">
                    <div class="block-item-des">
                        <strong class="bui-dlist-tit">
                            交易数
                        </strong>
                        <div class="bui-dlist-det">{{ total }} 次</div>
                    </div>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <div class="block-item-des">
                        <strong class="bui-dlist-tit">
                            余额
                        </strong>
                        <div class="bui-dlist-det">
                            {{ balance | toCZRVal }} CZR
                        </div>
                    </div>
                </el-col>
                <template v-if="type == 2">
                    <el-col :span="12">
                        <div class="block-item-des">
                            <strong class="bui-dlist-tit">
                                合约创建
                            </strong>
                            <div class="bui-dlist-det">
                                <router-link
                                    class="table-long-item"
                                    :to="'/account/' + own_account"
                                    >{{ own_account }}</router-link
                                >
                                创建于
                                <router-link
                                    class="table-long-item"
                                    :to="'/block/' + born_unit"
                                    >{{ born_unit }}</router-link
                                >
                            </div>
                        </div>
                    </el-col>
                </template>
            </el-row>
            <template v-if="type == 2">
                <el-row>
                    <template v-if="is_token">
                        <el-col :span="12">
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    对应代币
                                </strong>
                                <div class="bui-dlist-det">
                                    <router-link
                                        class="table-long-item"
                                        :to="'/token/' + address"
                                        >{{ symbol }}</router-link
                                    >
                                </div>
                            </div>
                        </el-col>
                    </template>
                </el-row>
            </template>
        </div>
    </div>
</template>
<script>
export default {
    name: "AccountInfo",
    props: [
        "type",
        "is_token",
        "balance",
        "total",
        "own_account",
        "born_unit",
        "symbol",
        "address"
    ]
};
</script>
<style scoped>
.com-account-wrap {
    border-top: 2px solid #28388c;
    padding: 13px 15px;
}
.acc-address-tit {
    margin-right: 10px;
}
.bui-dlist {
    margin: 40px 0;
}
.acc-address-des {
    color: #999;
    word-break: break-all;
}
</style>
