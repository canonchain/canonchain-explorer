<template>
    <el-table :data="database" style="width: 100%">
        <el-table-column :label="$t('token.time')" width="180">
            <template slot-scope="scope">
                <span class="table-long-item">{{
                    scope.row.mc_timestamp | toDate
                }}</span>
            </template>
        </el-table-column>
        <el-table-column :label="$t('token.trans_number')" width="180">
            <template slot-scope="scope">
                <router-link
                    class="table-long-item"
                    :to="{
                        path: '/block/' + scope.row.hash
                    }"
                    >{{ scope.row.hash }}</router-link
                >
            </template>
        </el-table-column>
        <el-table-column :label="$t('trans_in_contracts.sender')" width="180">
            <template slot-scope="scope">
                <router-link
                    class="table-long-item"
                    :to="{
                        path: '/account/' + scope.row.from
                    }"
                    >{{ scope.row.from }}</router-link
                >
            </template>
        </el-table-column>
        <el-table-column :label="$t('trans_in_contracts.receiver')" width="180">
            <template slot-scope="scope">
                <router-link
                    class="table-long-item"
                    :to="{
                        path: '/account/' + scope.row.to
                    }"
                    >{{ scope.row.to }}</router-link
                >
            </template>
        </el-table-column>
        <el-table-column :label="$t('token.quantity')" align="right">
            <template slot-scope="scope">
                <span>{{
                    scope.row.amount
                        | toTokenVal(Math.pow(10, scope.row.token_precision || 18))
                }}</span>
            </template>
        </el-table-column>
    </el-table>
</template>
<script>
export default {
    name: "TokenTransList",
    props: ["database"]
};
</script>
