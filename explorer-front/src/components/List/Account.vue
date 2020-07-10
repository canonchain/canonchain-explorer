<template>
    <el-table :data="database" style="width: 100%">
        <!-- <el-table-column prop="rank" label="排行榜" width="70"></el-table-column> -->
        <el-table-column :label="$t('list.accounts')" width="550">
            <template slot-scope="scope">
                <router-link :to="{ path: '/account/' + scope.row.account }">{{
                    scope.row.account
                }}</router-link>
            </template>
        </el-table-column>
        <el-table-column :label="$t('list.amount')+'(CZR)'" width="200">
            <template slot-scope="scope">{{
                scope.row.balance | toCZRShort
            }}</template>
        </el-table-column>
        <el-table-column
            prop="proportion"
            :label="$t('accoount.proportion')"
            align="right"
            min-width="160"
        ></el-table-column>
    </el-table>
</template>
<script>
export default {
    name: "AccountList",
    props: ["database"]
};
</script>