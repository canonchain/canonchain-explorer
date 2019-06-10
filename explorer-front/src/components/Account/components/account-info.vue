<template>
    <div class="bui-dlist">
        <el-row>
            <el-col :span="12">
                <div class="block-item-des">
                    <strong class="bui-dlist-tit">
                        余额
                        <span class="space-des"></span>
                    </strong>
                    <div class="bui-dlist-det">{{balance | toCZRVal}} CZR</div>
                </div>
            </el-col>
            <el-col :span="12">
                <div class="block-item-des">
                    <strong class="bui-dlist-tit">
                        交易数
                        <span class="space-des"></span>
                    </strong>
                    <div class="bui-dlist-det">{{total}} 次</div>
                </div>
            </el-col>
        </el-row>
        <template v-if="type === 2">
            <el-row>
                <el-col :span="is_token? 12: 24">
                    <div class="block-item-des">
                        <strong class="bui-dlist-tit">
                            合约创建
                            <span class="space-des"></span>
                        </strong>
                        <div class="bui-dlist-det">
                            <a href="javascript:;">{{own_account}}</a>
                            创建于
                            <a href="javascript:;">{{born_unit}}</a>
                        </div>
                    </div>
                </el-col>
                <template v-if="is_token">
                    <el-col :span="12">
                        <div class="block-item-des">
                            <strong class="bui-dlist-tit">
                                对应Token
                                <span class="space-des"></span>
                            </strong>
                            <div class="bui-dlist-det">
                                <a href="javascript:;">{{symbol}}</a>
                            </div>
                        </div>
                    </el-col>
                </template>
            </el-row>
        </template>
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
        "symbol"
    ]
};
</script>
