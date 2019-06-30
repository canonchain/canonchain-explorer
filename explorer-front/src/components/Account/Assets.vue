<template>
    <el-table :data="database" style="width: 100%">
        <el-table-column label="代币符号" width="200">
            <template slot-scope="scope">{{ scope.row.symbol }}（{{ scope.row.name }}）</template>
        </el-table-column>
        <el-table-column label="代币合约" min-width="200">
            <template slot-scope="scope">
                <router-link
                    class="table-long-item"
                    :to="{
                        path: '/token/' + scope.row.contract_account
                    }"
                >{{ scope.row.contract_account }}</router-link>
            </template>
        </el-table-column>
        <el-table-column label="资产" align="right" min-width="230">
            <template slot-scope="scope">
                <span>
                    {{
                    scope.row.balance | toTokenVal(Math.pow(10, scope.row.precision))
                    }}
                </span>
            </template>
        </el-table-column>
    </el-table>
</template>
<script>
let self;
export default {
    name: "TokenList",
    props: ["address", "url_parm"],
    data() {
        return {
            loadingSwitch: true,
            IS_GET_ACC: false,
            database: []
        };
    },
    created() {
        self = this;
        self.initDatabase();
    },
    methods: {
        async initDatabase() {
            let opt = {
                account: this.url_parm.account,
                position: this.url_parm.position,
                token_asset_id: this.url_parm.token_asset_id
            };
            let response = await self.$api.get(
                "/api/get_account_token_list",
                opt
            );
            if (response.success) {
                self.database = response.data;
                let account_assets_props = {
                    first_index: self.database[0].token_asset_id,
                    last_index:
                        self.database[self.database.length - 1].token_asset_id
                };
                self.$emit("account_assets_props", account_assets_props);
            } else {
                console.error("/api/get_account_token_list Error");
            }
            self.loadingSwitch = false;
            self.IS_GET_ACC = true;
        }
    }
};
</script>