<template>
    <el-table :data="database" style="width: 100%">
        <el-table-column label="时间" width="200">
            <template slot-scope="scope">
                <span class="table-long-item">
                    {{
                    scope.row.timestamp | toDate
                    }}
                </span>
            </template>
        </el-table-column>
        <el-table-column label="交易号" width="200">
            <template slot-scope="scope">
                <router-link
                    class="table-long-item"
                    :to="{ path: '/block/' + scope.row.hash }"
                >{{ scope.row.hash }}</router-link>
            </template>
        </el-table-column>
        <el-table-column label="账户" width="200">
            <template slot-scope="scope">
                <template v-if="scope.row.mci <= 0">
                    <span class="table-long-item">GENESIS</span>
                </template>
                <template v-else-if="scope.row.from===address">
                    <span class="table-long-item">{{ scope.row.from }}</span>
                </template>
                <template v-else>
                    <router-link
                        class="table-long-item"
                        :to="{ path: '/account/' + scope.row.from }"
                    >{{ scope.row.from }}</router-link>
                </template>
            </template>
        </el-table-column>
        <el-table-column label="状态" min-width="80" align="center">
            <template slot-scope="scope">
                <template v-if="scope.row.is_stable === false">
                    <span class="txt-warning">等待确认</span>
                </template>
                <template v-else>
                    <template v-if="scope.row.status == '0'">
                        <span class="txt-success">成功</span>
                    </template>
                    <template v-else-if="scope.row.status == '1'">
                        <span class="txt-danger">失败(1)</span>
                    </template>
                    <template v-else-if="scope.row.status == '2'">
                        <span class="txt-danger">失败(2)</span>
                    </template>
                    <template v-else-if="scope.row.status == '3'">
                        <span class="txt-danger">失败(3)</span>
                    </template>
                    <template v-else>
                        <span class="txt-info">-</span>
                    </template>
                </template>
            </template>
        </el-table-column>
        <el-table-column label="稳定时间" width="200">
            <template slot-scope="scope">
                <span class="table-long-item">
                    {{
                    scope.row.stable_timestamp | toDate
                    }}
                </span>
            </template>
        </el-table-column>
    </el-table>
</template>
<script>
export default {
    name: "WitnessList",
    props: ["database", "address"]
};
</script>