<template>
    <el-table :data="database" style="width: 100%">
        <el-table-column :label="$t('home.time')" width="160">
            <template slot-scope="scope">
                <span class="table-long-item">
                    {{
                    scope.row.mc_timestamp | toDate
                    }}
                </span>
            </template>
        </el-table-column>
        <el-table-column :label="$t('home.transaction_hash')" width="180">
            <template slot-scope="scope">
                <router-link
                    class="table-long-item"
                    :to="{ path: '/block/' + scope.row.hash }"
                >{{ scope.row.hash }}</router-link>
            </template>
        </el-table-column>
        <el-table-column :label="$t('home.sender')" width="180">
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
        <el-table-column width="40">
            <i class="el-icon-right"></i>
        </el-table-column>
        <el-table-column :label="$t('home.receiver')" width="180">
            <template slot-scope="scope">
                <template v-if="scope.row.to===address">
                    <span class="table-long-item">{{ scope.row.to }}</span>
                </template>
                <template v-else-if="scope.row.to">
                    <router-link
                        class="table-long-item"
                        :to="{ path: '/account/' + scope.row.to }"
                    >{{ scope.row.to }}</router-link>
                </template>
                <template v-else>-</template>
            </template>
        </el-table-column>
        <el-table-column :label="$t('home.status')" min-width="60" align="center">
            <template slot-scope="scope">
                <template v-if="scope.row.is_stable === false">
                    <span class="txt-warning">{{$t('home.waiting')}}</span>
                </template>
                <template v-else>
                    <template v-if="scope.row.status == '0'">
                        <span class="txt-success">{{$t('home.success')}}</span>
                    </template>
                    <template v-else-if="scope.row.status == '1'">
                        <span class="txt-danger">{{$t('home.fail')}}(1)</span>
                    </template>
                    <template v-else-if="scope.row.status == '2'">
                        <span class="txt-danger">{{$t('home.fail')}}(2)</span>
                    </template>
                    <template v-else-if="scope.row.status == '3'">
                        <span class="txt-danger">{{$t('home.fail')}}(3)</span>
                    </template>
                    <template v-else>
                        <span class="txt-info">-</span>
                    </template>
                </template>
            </template>
        </el-table-column>
        <el-table-column :label="$t('home.czr_blan')" align="right" min-width="205">
            <template slot-scope="scope">
                <span>{{ scope.row.amount | toCZRVal }}</span>
            </template>
        </el-table-column>
    </el-table>
</template>
<script>
export default {
    name: "NomalList",
    props: ["database", "address"]
};
</script>