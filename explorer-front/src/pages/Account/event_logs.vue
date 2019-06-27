<template>
    <div class="page-account">
        <czr-header></czr-header>
        <div class="page-account-wrap">
            <div class="container">
                <div class="account-panel">
                    <account-info
                        :address="address"
                        v-on:address_props="handlerAddressProps"
                    ></account-info>
                </div>
                <div class="account-main">
                    <template>
                        <el-tabs v-model="activeName" @tab-click="change_table">
                            <el-tab-pane
                                label="交易记录"
                                name="transaction"
                            ></el-tab-pane>

                            <template v-if="account_props.is_token_account">
                                <!-- is_token_account 应该为 is_has_token -->
                                <el-tab-pane
                                    label="代币余额"
                                    name="token_balances"
                                >
                                </el-tab-pane>
                            </template>
                            <template v-if="account_props.is_has_token_trans">
                                <el-tab-pane
                                    label="代币转账"
                                    name="trans_token"
                                ></el-tab-pane
                            ></template>
                            <template v-if="account_props.is_has_intel_trans">
                                <el-tab-pane
                                    label="合约内交易"
                                    name="trans_internal"
                                ></el-tab-pane>
                            </template>
                            <el-tab-pane label="事件日志" name="event_logs">
                                <div
                                    class="accounts-main-wrap"
                                    v-loading="loadingSwitch"
                                >
                                    <template v-if="IS_GET_INFO">
                                        <event-logs
                                            :database="event_logs"
                                        ></event-logs>
                                    </template>
                                </div>
                            </el-tab-pane>
                            <template v-if="account_props.account_type === 2">
                                <el-tab-pane
                                    label="合约创建代码"
                                    name="contract_code"
                                ></el-tab-pane>
                            </template>
                        </el-tabs>
                    </template>
                </div>
            </div>
        </div>
        <czr-footer></czr-footer>
    </div>
</template>

<script>
import CzrHeader from "@/components/Header/Header";
import CzrFooter from "@/components/Footer/Footer";
import AccountInfo from "@/components/Account/Info";
import EventLogs from "@/components/List/EventLogs";

let self = null;

export default {
    name: "ContractCode",
    components: {
        CzrHeader,
        CzrFooter,
        AccountInfo,
        EventLogs
    },
    data() {
        return {
            loadingSwitch: true,
            address: this.$route.params.id,
            activeName: "event_logs",
            account_props: {
                account_type: 1,
                is_witness: false,
                is_token_account: false,
                is_has_token_trans: false,
                is_has_intel_trans: false,
                is_has_event_logs: false
            },

            IS_GET_ACC: false,
            IS_GET_INFO: false,

            accountInfo: {
                address: this.$route.params.id,
                total: 0,
                balance: 0,
                type: 1,
                is_witness: false,
                transaction_count: 0,
                is_token_account: false,
                is_has_token_trans: false,
                is_has_intel_trans: false,
                is_has_event_logs: false,
                own_account: "",
                born_unit: "",
                symbol: ""
            },

            // 合约代码
            event_logs: []
        };
    },
    created() {
        self = this;

        self.getEventLog();
    },
    methods: {
        handlerAddressProps: function(props) {
            self.account_props.account_type = props.account_type;
            self.account_props.is_witness = props.is_witness;
            self.account_props.is_token_account = props.is_token_account;
            self.account_props.is_has_token_trans = props.is_has_token_trans;
            self.account_props.is_has_intel_trans = props.is_has_intel_trans;
            self.account_props.is_has_event_logs = props.is_has_event_logs;
        },
        // 合约相关的
        change_table(tab, event) {
            /**
             * 0 交易记录
             * 1 Token转账
             * 2 合约内交易
             * 3 事件日志
             * 4 合约创建代码
             */
            self.IS_GET_INFO = false;
            self.loadingSwitch = true;
            switch (tab.name) {
                case "transaction":
                    this.$router.push(`/account/${self.address}`);
                    break;
                case "token_balances":
                    this.$router.push(`/account/${self.address}/token_balances`);
                    break;
                case "trans_token":
                    this.$router.push(`/account/${self.address}/trans_token`);
                    break;
                case "trans_internal":
                    this.$router.push(
                        `/account/${self.address}/trans_internal`
                    );
                    break;
                case "event_logs":
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    break;
                case "contract_code":
                    this.$router.push(`/account/${self.address}/contract_code`);
                    break;
            }
        },
        async getEventLog() {
            let opt = {
                account: self.address
            };
            let response = await self.$api.get("/api/get_event_log", opt);

            response = {"data":[{"hash":"B6A6021799701EDC1683D1410A6AED69A5920F6D019AD2BAC142B03ACF4930D4","mc_timestamp":"1560932344","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","data":"00000000000000000000000000000000000000000000000000000000000003E8","method":"A9059CBB","method_function":"A9059CBB4ADBF09F33E110FE93603685ED03A99D5573FFDA78EB9B48A10978AF8009A14600000000000000000000000000000000000000000000000000000000000003E8","topics":["ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef","0c7a566ba8029df417592d6946540a7aefa54ab03827fd98bde3ec120cb1ad4f","4adbf09f33e110fe93603685ed03a99d5573ffda78eb9b48a10978af8009a146"]},{"hash":"0E4BF26F2C41B5B9D35E09F238A1FDEFAFCF2F7823CC7FCDA21DFF280842D51E","mc_timestamp":"1560932358","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","data":"000000000000000000000000000000000000000000000000000000000000000A","method":"A6F2AE3A","method_function":"A6F2AE3A","topics":["ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef","4adbf09f33e110fe93603685ed03a99d5573ffda78eb9b48a10978af8009a146","e9d74b62acef095f83387354901717b3eb221f1b9b8d3dee981cb48976a71074"]},{"hash":"CBD12A0CE7E1A847D0BABC0BCF4CB089179C379623FFA3401935117640C84900","mc_timestamp":"1560932368","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","data":"000000000000000000000000000000000000000000000000000000000000000A","method":"E4849B32","method_function":"E4849B32000000000000000000000000000000000000000000000000000000000000000A","topics":["ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef","e9d74b62acef095f83387354901717b3eb221f1b9b8d3dee981cb48976a71074","4adbf09f33e110fe93603685ed03a99d5573ffda78eb9b48a10978af8009a146"]},{"hash":"E4F258576F3B5021DAED839F78321EC44CDAEFD729E2480B024400C411E2414F","mc_timestamp":"1560932374","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","data":"00000000000000000000000000000000000000000000000000000000000003E8","method":"095EA7B3","method_function":"095EA7B3E9D74B62ACEF095F83387354901717B3EB221F1B9B8D3DEE981CB48976A7107400000000000000000000000000000000000000000000000000000000000003E8","topics":["8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925","0c7a566ba8029df417592d6946540a7aefa54ab03827fd98bde3ec120cb1ad4f","e9d74b62acef095f83387354901717b3eb221f1b9b8d3dee981cb48976a71074"]},{"hash":"AC0ACE75A42E86FFE6904F3A177228820ADB914C9114F522B347FBC9927EB219","mc_timestamp":"1560932383","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","data":"00000000000000000000000000000000000000000000000000000000000003E8","method":"23B872DD","method_function":"23B872DD0C7A566BA8029DF417592D6946540A7AEFA54AB03827FD98BDE3EC120CB1AD4FE9D74B62ACEF095F83387354901717B3EB221F1B9B8D3DEE981CB48976A7107400000000000000000000000000000000000000000000000000000000000003E8","topics":["ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef","0c7a566ba8029df417592d6946540a7aefa54ab03827fd98bde3ec120cb1ad4f","e9d74b62acef095f83387354901717b3eb221f1b9b8d3dee981cb48976a71074"]},{"hash":"3873CE62FAB2EFF9199B9C4303E540908874EE05083BACEED1846F53755DEC8A","mc_timestamp":"1560932393","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","data":"00000000000000000000000000000000000000000000000000000000000003E8","method":"42966C68","method_function":"42966C6800000000000000000000000000000000000000000000000000000000000003E8","topics":["cc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca5","e9d74b62acef095f83387354901717b3eb221f1b9b8d3dee981cb48976a71074"]},{"hash":"469C35408259458A7C41DE3A8155202DAE2ECF9FC9AC287254EEE7BEB6BC2377","mc_timestamp":"1560932399","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","data":"00000000000000000000000000000000000000000000000000000000000003E8","method":"095EA7B3","method_function":"095EA7B3E9D74B62ACEF095F83387354901717B3EB221F1B9B8D3DEE981CB48976A7107400000000000000000000000000000000000000000000000000000000000003E8","topics":["8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925","0c7a566ba8029df417592d6946540a7aefa54ab03827fd98bde3ec120cb1ad4f","e9d74b62acef095f83387354901717b3eb221f1b9b8d3dee981cb48976a71074"]},{"hash":"B3FE6A103252FC76D8E5591275C22B86F65B8FD0149A560AC61933ED080954CC","mc_timestamp":"1560932406","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","data":"00000000000000000000000000000000000000000000000000000000000003E8","method":"79CC6790","method_function":"79CC67900C7A566BA8029DF417592D6946540A7AEFA54AB03827FD98BDE3EC120CB1AD4F00000000000000000000000000000000000000000000000000000000000003E8","topics":["cc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca5","0c7a566ba8029df417592d6946540a7aefa54ab03827fd98bde3ec120cb1ad4f"]},{"hash":"63BDAF255DBFCFB87DB6B7280F75FD4565A92C9FD46B1B5C2CAFE30DAE26A1FE","mc_timestamp":"1560932428","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","data":"E9D74B62ACEF095F83387354901717B3EB221F1B9B8D3DEE981CB48976A710740000000000000000000000000000000000000000000000000000000000000001","method":"E724529C","method_function":"E724529CE9D74B62ACEF095F83387354901717B3EB221F1B9B8D3DEE981CB48976A710740000000000000000000000000000000000000000000000000000000000000001","topics":["48335238b4855f35377ed80f164e8c6f3c366e54ac00b96a6402d4a9814a03a5"]},{"hash":"CDFF985BF2D88881EC389D342FC748F33B1EFB12EFE2D0183EBC2D05BA0C5F37","mc_timestamp":"1560932434","contract_account":"czr_3WiMTR9tzsA6kQSvddRWcH86fbVt5qaG64JMVLKB1jjq6eVmUK","data":"E9D74B62ACEF095F83387354901717B3EB221F1B9B8D3DEE981CB48976A710740000000000000000000000000000000000000000000000000000000000000000","method":"E724529C","method_function":"E724529CE9D74B62ACEF095F83387354901717B3EB221F1B9B8D3DEE981CB48976A710740000000000000000000000000000000000000000000000000000000000000000","topics":["48335238b4855f35377ed80f164e8c6f3c366e54ac00b96a6402d4a9814a03a5"]}],"code":200,"success":true,"message":"success"};

            if (response.success) {
                self.event_logs = response.data;
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        }
    }
};
</script>