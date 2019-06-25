<template>
    <el-table :data="database" style="width: 100%">
        <!-- <el-table-column prop="rank" label="排行榜" width="70"></el-table-column> -->
        <el-table-column label="账户" width="500">
            <template slot-scope="scope">
                <router-link :to="{ path: '/account/' + scope.row.account }">{{
                    scope.row.account
                }}</router-link>
            </template>
        </el-table-column>
        <el-table-column label="余额(CZR)" align="right">
            <template slot-scope="scope">{{
                scope.row.balance | toCZRVal
            }}</template>
        </el-table-column>
        <el-table-column
            prop="proportion"
            label="占比"
            align="right"
            min-width="60"
        ></el-table-column>
    </el-table>
</template>
<script>
export default {
    name: "AccountList",
    props: ["database"]
};
</script>