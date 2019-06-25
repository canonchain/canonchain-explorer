<template>
    <el-table :data="database" style="width: 100%">
        <el-table-column label="时间" width="180">
            <template slot-scope="scope">
                <span class="table-long-item">{{
                    scope.row.mc_timestamp | toDate
                }}</span>
            </template>
        </el-table-column>
        <el-table-column label="父区块交易号" width="180">
            <template slot-scope="scope">
                <template>
                    <router-link
                        class="table-long-item"
                        :to="{
                            path: '/block/' + scope.row.hash
                        }"
                        >{{ scope.row.hash }}</router-link
                    >
                </template>
            </template>
        </el-table-column>

        <el-table-column label="Type" width="80">
            <template slot-scope="scope">
                <template v-if="scope.row.type === '0'"
                    >call</template
                >
                <template v-else-if="scope.row.type === '1'"
                    >create</template
                >
                <template v-else-if="scope.row.type === '2'"
                    >suicide</template
                >
            </template>
        </el-table-column>
        <el-table-column label="发送方" width="180">
            <template slot-scope="scope">
                <template v-if="scope.row.type === '2'">
                    <router-link
                        class="table-long-item"
                        :to="{
                            path:
                                '/account/' + scope.row.contract_address_suicide
                        }"
                        >{{ scope.row.contract_address_suicide }}</router-link
                    >
                </template>
                <template v-else>
                    <router-link
                        class="table-long-item"
                        :to="{
                            path: '/account/' + scope.row.from
                        }"
                        >{{ scope.row.from }}</router-link
                    >
                </template>
            </template>
        </el-table-column>
        <el-table-column label="接收方" width="180">
            <template slot-scope="scope">
                <template v-if="scope.row.type === '2'">
                    <router-link
                        class="table-long-item"
                        :to="{
                            path: '/account/' + scope.row.refund_adderss
                        }"
                        >{{ scope.row.refund_adderss }}</router-link
                    >
                </template>
                <template v-else-if="scope.row.type === '1'">
                    <router-link
                        class="table-long-item"
                        :to="{
                            path:
                                '/account/' + scope.row.contract_address_create
                        }"
                        >{{ scope.row.contract_address_create }}</router-link
                    >
                </template>
                <template v-else>
                    <template v-if="scope.row.to">
                        <template>
                            <router-link
                                class="table-long-item"
                                :to="{
                                    path: '/account/' + scope.row.to
                                }"
                                >{{ scope.row.to }}</router-link
                            >
                        </template>
                    </template>
                    <template v-else>
                        <span>-</span>
                    </template>
                </template>
            </template>
        </el-table-column>
        <el-table-column label="状态" width="70">
            <template slot-scope="scope">
                无数据
            </template>
        </el-table-column>
        <el-table-column label="数额" align="right">
            <template slot-scope="scope">
                <span>{{ scope.row.value | toCZRVal }}</span>
            </template>
        </el-table-column>
    </el-table>
</template>
<script>
export default {
    name: "InternalList",
    props: ["database"]
};
</script>