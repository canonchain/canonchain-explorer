<template>
    <div class="com-account-wrap">
        <div class="acc-address">
            <!-- -->
            <strong class="acc-address-tit">代币</strong>
            <span class="acc-address-des">{{ name }}（{{ symbol }}）</span>
        </div>
        <div class="bui-dlist">
            <el-row>
                <el-col :span="12">
                    <div class="block-item-des">
                        <strong class="bui-dlist-tit">
                            总供应量
                        </strong>
                        <div class="bui-dlist-det">
                            {{ total | toTokenVal(Math.pow(10, precision)) }}
                            {{ symbol }}
                        </div>
                    </div>
                </el-col>
                <el-col :span="12">
                    <div class="block-item-des">
                        <strong class="bui-dlist-tit">
                            位数
                        </strong>
                        <div class="bui-dlist-det">{{ precision }}</div>
                    </div>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <div class="block-item-des">
                        <strong class="bui-dlist-tit">
                            持有者
                        </strong>
                        <div class="bui-dlist-det">
                            {{ account_count }}
                        </div>
                    </div>
                </el-col>
                <el-col :span="12">
                    <div class="block-item-des">
                        <strong class="bui-dlist-tit">
                            交易数
                        </strong>
                        <div class="bui-dlist-det">
                            {{ transaction_count }} 次
                        </div>
                    </div>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <div class="block-item-des">
                        <strong class="bui-dlist-tit">
                            对应合约
                        </strong>
                        <div class="bui-dlist-det">
                            <router-link
                                class="table-long-item"
                                :to="'/account/' + contract_account"
                                >{{ contract_account }}</router-link
                            >
                        </div>
                    </div>
                </el-col>
            </el-row>
        </div>
    </div>
</template>
<script>
export default {
    name: "TokenInfo",
    props: [
        "name",
        "symbol",
        "total",
        "precision",
        "account_count",
        "transaction_count",
        "contract_account"
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
