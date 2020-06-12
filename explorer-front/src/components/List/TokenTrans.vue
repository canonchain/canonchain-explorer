<template>
    <el-table :data="database" style="width: 100%">
        <el-table-column :label="$t('list.time')" width="180">
            <template slot-scope="scope">
                <span class="table-long-item">
                    {{ scope.row.mc_timestamp | toDate }}
                </span>
            </template>
        </el-table-column>
        <el-table-column :label="$t('list.transaction_hash')" width="180">
            <template slot-scope="scope">
                <router-link
                    class="table-long-item"
                    :to="{ path: '/block/' + scope.row.hash }"
                    >{{ scope.row.hash }}</router-link
                >
            </template>
        </el-table-column>
        <el-table-column :label="$t('list.sender')" width="180">
            <template slot-scope="scope">
                <template v-if="scope.row.from !== address">
                    <router-link
                        class="table-long-item"
                        :to="{ path: '/account/' + scope.row.from }"
                        >{{ scope.row.from }}</router-link
                    >
                </template>
                <template v-else>
                    <span class="table-long-item">{{ scope.row.from }}</span>
                </template>
            </template>
        </el-table-column>
        <el-table-column width="40">
            <i class="el-icon-right"></i>
        </el-table-column>
        <el-table-column :label="$t('list.receiver')" width="180">
            <template slot-scope="scope">
                <template v-if="scope.row.to">
                    <template v-if="scope.row.to !== address">
                        <router-link
                            class="table-long-item"
                            :to="{ path: '/account/' + scope.row.to }"
                            >{{ scope.row.to }}</router-link
                        >
                    </template>
                    <template v-else>
                        <span class="table-long-item">{{ scope.row.to }}</span>
                    </template>
                </template>
                <template v-else>
                    <span>-</span>
                </template>
            </template>
        </el-table-column>
        <el-table-column
            :label="$t('list.token')"
            min-width="230"
            align="right"
        >
            <template slot-scope="scope">
                <span>
                    {{
                        scope.row.amount
                            | toTokenVal(
                                Math.pow(10, scope.row.token_precision || 18)
                            )
                    }}
                    {{ scope.row.token_symbol }}
                </span>
            </template>
        </el-table-column>
    </el-table>
</template>
<script>
export default {
    name: "TokenTransList",
    props: ["database", "address"]
};
</script>