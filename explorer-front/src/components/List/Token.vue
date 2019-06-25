<template>
    <el-table :data="database" style="width: 100%">
        <el-table-column label="代币符号" width="180">
            <template slot-scope="scope">
                <router-link
                    class="table-long-item"
                    :to="{
                        path: '/token/' + scope.row.contract_account
                    }"
                    >{{ scope.row.token_symbol }} ({{
                        scope.row.token_name
                    }})</router-link
                >
            </template>
        </el-table-column>
        <el-table-column label="对应合约" min-width="180">
            <template slot-scope="scope">
                <router-link
                    class="table-long-item"
                    :to="{
                        path: '/token/' + scope.row.contract_account
                    }"
                    >{{ scope.row.contract_account }}</router-link
                >
            </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="110">
            <template slot-scope="scope">
                <span>{{ scope.row.mc_timestamp | toDate }}</span>
            </template>
        </el-table-column>
        <el-table-column label="总量" align="right" min-width="230">
            <template slot-scope="scope">
                <span>{{
                    scope.row.token_total | toTokenVal(Math.pow(10, 18))
                }}</span>
            </template>
        </el-table-column>
        <el-table-column label="持有人/交易数" align="right" min-width="100">
            <template slot-scope="scope">
                <span
                    >{{ scope.row.account_count }} /
                    {{ scope.row.transaction_count }}</span
                >
            </template>
        </el-table-column>
    </el-table>
</template>
<script>
export default {
    name: "TokenList",
    props: ["database"]
};
</script>