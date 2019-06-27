<template>
    <el-table :data="database" style="width: 100%">
        <el-table-column label="时间" width="180">
            <template slot-scope="scope">
                <span class="table-long-item">{{
                    scope.row.mc_timestamp | toDate
                }}</span>
            </template>
        </el-table-column>
        <el-table-column label="交易号" width="180">
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
        <el-table-column label="发款方" width="180">
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
        <el-table-column label="收款方" width="180">
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
        <el-table-column label="数量" align="right">
            <template slot-scope="scope">
                <span>{{ scope.row.amount | toCZRVal }}</span>
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
