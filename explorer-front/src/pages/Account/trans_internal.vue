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

                            <el-tab-pane
                                label="合约内交易"
                                name="trans_internal"
                            >
                                <div
                                    class="accounts-main-wrap"
                                    v-loading="loadingSwitch"
                                >
                                    <template v-if="IS_GET_INFO">
                                        <internal-list
                                            :database="trans_internal"
                                        ></internal-list>
                                        <!-- page -->
                                        <template v-if="trans_internal.length">
                                            <div class="pagin-block">
                                                <el-button-group>
                                                    <el-button
                                                        size="mini"
                                                        :disabled="
                                                            btnSwitch.header
                                                        "
                                                        @click="
                                                            getPaginationFlag(
                                                                'header'
                                                            )
                                                        "
                                                        >首页</el-button
                                                    >
                                                    <el-button
                                                        size="mini"
                                                        icon="el-icon-arrow-left"
                                                        :disabled="
                                                            btnSwitch.left
                                                        "
                                                        @click="
                                                            getPaginationFlag(
                                                                'left'
                                                            )
                                                        "
                                                        >上一页</el-button
                                                    >
                                                    <el-button
                                                        size="mini"
                                                        :disabled="
                                                            btnSwitch.right
                                                        "
                                                        @click="
                                                            getPaginationFlag(
                                                                'right'
                                                            )
                                                        "
                                                    >
                                                        下一页
                                                        <i
                                                            class="el-icon-arrow-right el-icon--right"
                                                        ></i>
                                                    </el-button>
                                                    <el-button
                                                        size="mini"
                                                        :disabled="
                                                            btnSwitch.footer
                                                        "
                                                        @click="
                                                            getPaginationFlag(
                                                                'footer'
                                                            )
                                                        "
                                                        >尾页</el-button
                                                    >
                                                </el-button-group>
                                            </div>
                                        </template>
                                    </template>
                                </div>
                            </el-tab-pane>
                            <template v-if="account_props.is_has_event_logs">
                                <el-tab-pane
                                    label="事件日志"
                                    name="event_logs"
                                ></el-tab-pane>
                            </template>
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
import InternalList from "@/components/List/Internal";

let self = null;
let isDefaultPage = false;

//TODO 交易列表改为 发送 和 接收 两个List ,解决sql搜索慢的问题

export default {
    name: "Block",
    components: {
        CzrHeader,
        CzrFooter,
        InternalList,
        AccountInfo
    },
    data() {
        return {
            loadingSwitch: true,
            address: this.$route.params.id,
            activeName: "trans_internal",
            account_props: {
                account_type: 1,
                is_witness: false,
                is_token_account: false,
                is_has_token_trans: false,
                is_has_intel_trans: false,
                is_has_event_logs: false
            },

            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            IS_GET_INFO: false,
            IS_GET_ACC: false,
            IS_WITNESS: false,
            pageFirstItem: {
                exec_timestamp: 0,
                level: 0,
                pkid: 0
            },
            pageLastItem: {
                exec_timestamp: 0,
                level: 0,
                pkid: 0
            },
            first_stable_index: "",
            end_stable_index: "",
            url_parm: {
                account: this.$route.params.id,
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                stable_index: 999999999999,
                source: this.$route.query.source || "1" //1 发送方 2 接收方 3见证交易
            },
            currentPage: 1,

            // Token转账
            trans_token: [],
            // 合约内交易
            trans_internal: [],
            // 事件日志
            event_logs: [],
            // 合约代码
            contract_code: ""
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length > 1) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.stable_index = queryInfo.stable_index;
            self.url_parm.source = queryInfo.source;
        }
        self.getFlagTransactions(self.url_parm);
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
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/trans_internal?stable_index=0&source=${
                        self.url_parm.source
                    }&position=4`
                );
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(
                    `/account/${self.url_parm.account}/trans_internal?source=${
                        self.url_parm.source
                    }`
                );
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/trans_internal?stable_index=${
                        self.pageFirstItem.stable_index
                    }&source=${self.url_parm.source}&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/account/${
                        self.url_parm.account
                    }/trans_internal?stable_index=${
                        self.pageLastItem.stable_index
                    }&source=${self.url_parm.source}&position=3`
                );
                return;
            }
        },

        handlerChange(val) {
            self.$router.push(
                `/account/${self.url_parm.account}/trans_internal?source=${val}`
            );
        },
        async getFlagTransactions() {
            //获取交易表首位值；用来禁用首页和尾页的
            let opt = {
                source: self.url_parm.source,
                account: self.url_parm.account
            };
            let response = await self.$api.get(
                "/api/get_account_trans_flag",
                opt
            );

            if (response.success) {
                self.first_stable_index = response.near_item.stable_index;
                self.end_stable_index = response.end_item.stable_index;
                self.getTransactions(self.url_parm);
            } else {
                console.log("error");
            }
        },
        async getTransactions(parm) {
            //TODO 没有搜见证交易
            self.loadingSwitch = true;
            let opt = {
                position: parm.position,
                source: parm.source,
                account: parm.account,
                stable_index: parm.stable_index
            };
            let response = await self.$api.get("/api/get_trans_internal", opt);

            response = {"data":[{"hash":"ACD7451D91355AEF3187BA645A06C598CE6BB2576B8CA33B19CA22FBF46D174B","mci":"6423","mc_timestamp":"1560946840","stable_index":"6558","type":"0","call_type":"call","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a","gas":"2874288","input":"0B6F48A5","value":"0","init":"","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"133609","output":"","contract_address_create":"","contract_address_create_code":"","is_error":false,"error_msg":"","subtraces":"1","trace_address":"1"},{"hash":"ACD7451D91355AEF3187BA645A06C598CE6BB2576B8CA33B19CA22FBF46D174B","mci":"6423","mc_timestamp":"1560946840","stable_index":"6558","type":"0","call_type":"call","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a","gas":"2930293","input":"AC461DBD","value":"0","init":"","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"124809","output":"","contract_address_create":"","contract_address_create_code":"","is_error":false,"error_msg":"","subtraces":"3","trace_address":"0"},{"hash":"6AE62C9E12AE0FF318DF381818C421BA3B8599A3CA6CFC7BB671A66AA6F9BF98","mci":"6419","mc_timestamp":"1560946831","stable_index":"6553","type":"0","call_type":"call","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a","gas":"2896004","input":"0B6F48A5","value":"0","init":"","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"111893","output":"","contract_address_create":"","contract_address_create_code":"","is_error":false,"error_msg":"","subtraces":"1","trace_address":"2"},{"hash":"6AE62C9E12AE0FF318DF381818C421BA3B8599A3CA6CFC7BB671A66AA6F9BF98","mci":"6419","mc_timestamp":"1560946831","stable_index":"6553","type":"0","call_type":"call","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a","gas":"2905542","input":"0B6F48A5","value":"0","init":"","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"102355","output":"","contract_address_create":"","contract_address_create_code":"","is_error":false,"error_msg":"","subtraces":"1","trace_address":"1"},{"hash":"6AE62C9E12AE0FF318DF381818C421BA3B8599A3CA6CFC7BB671A66AA6F9BF98","mci":"6419","mc_timestamp":"1560946831","stable_index":"6553","type":"0","call_type":"call","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a","gas":"2930206","input":"3E424FD7","value":"0","init":"","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"93058","output":"","contract_address_create":"","contract_address_create_code":"","is_error":false,"error_msg":"","subtraces":"3","trace_address":"0"},{"hash":"AFF7ABCF545C3209780BE60B15AAE23AAD2D18175D8C8055332F2C057BEE67DD","mci":"6416","mc_timestamp":"1560946823","stable_index":"6549","type":"0","call_type":"call","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a","gas":"2920754","input":"0B6F48A5","value":"0","init":"","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"87143","output":"","contract_address_create":"","contract_address_create_code":"","is_error":false,"error_msg":"","subtraces":"1","trace_address":"1"},{"hash":"AFF7ABCF545C3209780BE60B15AAE23AAD2D18175D8C8055332F2C057BEE67DD","mci":"6416","mc_timestamp":"1560946823","stable_index":"6549","type":"0","call_type":"call","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a","gas":"2930292","input":"0B6F48A5","value":"0","init":"","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"77605","output":"","contract_address_create":"","contract_address_create_code":"","is_error":false,"error_msg":"","subtraces":"1","trace_address":"0"},{"hash":"FFEEB0B780F3634A03D90B38C0AD40CFD23E64ABAC9AF72845742D3DBA45A2A0","mci":"6413","mc_timestamp":"1560946817","stable_index":"6545","type":"0","call_type":"call","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a","gas":"2300","input":"","value":"1200000000000000000","init":"","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"2997740","output":"","contract_address_create":"","contract_address_create_code":"","is_error":false,"error_msg":"","subtraces":"0","trace_address":"2"},{"hash":"FFEEB0B780F3634A03D90B38C0AD40CFD23E64ABAC9AF72845742D3DBA45A2A0","mci":"6413","mc_timestamp":"1560946817","stable_index":"6545","type":"1","call_type":"","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"","gas":"2898792","input":"","value":"0","init":"60806040818152806103938339810180604052604081101561002057600080FD5B508051602090910151600091909155600155610352806100416000396000F3FE60806040526004361061008A5760003560E060020A900480633E424FD71161005D5780633E424FD7146100F257806341C0E1B5146101075780635DAB24201461011C578063AC461DBD14610131578063FF2D6C52146101465761008A565B80630B6F48A51461008C5780630DBE671F146100A157806312065FE0146100C85780631FC376F7146100DD575B005B34801561009857600080FD5B5061008A61015B565B3480156100AD57600080FD5B506100B6610190565B60408051918252519081900360200190F35B3480156100D457600080FD5B506100B6610196565B3480156100E957600080FD5B5061008A61019B565B3480156100FE57600080FD5B5061008A6101A6565B34801561011357600080FD5B5061008A61023E565B34801561012857600080FD5B506100B6610241565B34801561013D57600080FD5B5061008A610247565B34801561015257600080FD5B506100B6610320565B6000805460405190919067016345785D8A00009082818181858883F1935050505015801561018D573D6000803E3D6000FD5B50565B60025481565B303190565B600280546001019055565B6000805460405190919067016345785D8A00009082818181858883F193505050501580156101D8573D6000803E3D6000FD5B506000805460405190919067016345785D8A00009082818181858883F1935050505015801561020B573D6000803E3D6000FD5B506000805460405190919067016345785D8A00009082818181858883F1935050505015801561018D573D6000803E3D6000FD5B33FF5B60005481565B6001546003556000805460405190919067016345785D8A00009082818181858883F1935050505015801561027F573D6000803E3D6000FD5B50600354630B6F48A56040518163FFFFFFFF1660E060020A028152600401600060405180830381600087803B1580156102B757600080FD5B505AF11580156102CB573D6000803E3D6000FD5B50505050600354633E424FD76040518163FFFFFFFF1660E060020A028152600401600060405180830381600087803B15801561030657600080FD5B505AF115801561031A573D6000803E3D6000FD5B50505050565B6001548156FEA165627A7A72305820725E4BE5F857802E4B2E3AE196321E09A774C83F7062F292657CF8C3C041BFDD00295C0D32E578B5599831899C0321ACB2EE8D2737D5CA10D8B219BEE365F5BF949288572AAD8BF167AAE062372940E6C0B55284CA5E771299771B4434D29BB80492","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"311501","output":"","contract_address_create":"czr_4SfUV4Aysc6YCWLEJL8sCDRAaHPndXjVFE1r2mEc7TFcqEUR6a","contract_address_create_code":"60806040526004361061008A5760003560E060020A900480633E424FD71161005D5780633E424FD7146100F257806341C0E1B5146101075780635DAB24201461011C578063AC461DBD14610131578063FF2D6C52146101465761008A565B80630B6F48A51461008C5780630DBE671F146100A157806312065FE0146100C85780631FC376F7146100DD575B005B34801561009857600080FD5B5061008A61015B565B3480156100AD57600080FD5B506100B6610190565B60408051918252519081900360200190F35B3480156100D457600080FD5B506100B6610196565B3480156100E957600080FD5B5061008A61019B565B3480156100FE57600080FD5B5061008A6101A6565B34801561011357600080FD5B5061008A61023E565B34801561012857600080FD5B506100B6610241565B34801561013D57600080FD5B5061008A610247565B34801561015257600080FD5B506100B6610320565B6000805460405190919067016345785D8A00009082818181858883F1935050505015801561018D573D6000803E3D6000FD5B50565B60025481565B303190565B600280546001019055565B6000805460405190919067016345785D8A00009082818181858883F193505050501580156101D8573D6000803E3D6000FD5B506000805460405190919067016345785D8A00009082818181858883F1935050505015801561020B573D6000803E3D6000FD5B506000805460405190919067016345785D8A00009082818181858883F1935050505015801561018D573D6000803E3D6000FD5B33FF5B60005481565B6001546003556000805460405190919067016345785D8A00009082818181858883F1935050505015801561027F573D6000803E3D6000FD5B50600354630B6F48A56040518163FFFFFFFF1660E060020A028152600401600060405180830381600087803B1580156102B757600080FD5B505AF11580156102CB573D6000803E3D6000FD5B50505050600354633E424FD76040518163FFFFFFFF1660E060020A028152600401600060405180830381600087803B15801561030657600080FD5B505AF115801561031A573D6000803E3D6000FD5B50505050565B6001548156FEA165627A7A72305820725E4BE5F857802E4B2E3AE196321E09A774C83F7062F292657CF8C3C041BFDD0029","is_error":false,"error_msg":"","subtraces":"0","trace_address":"1"},{"hash":"FFEEB0B780F3634A03D90B38C0AD40CFD23E64ABAC9AF72845742D3DBA45A2A0","mci":"6413","mc_timestamp":"1560946817","stable_index":"6545","type":"0","call_type":"call","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"czr_3eHWaLn7FmxWEoDGxpW9mAXvDvqwaHVYxR9YQJ8wnYU8o81btP","gas":"2300","input":"","value":"0","init":"","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"2997700","output":"","contract_address_create":"","contract_address_create_code":"","is_error":false,"error_msg":"","subtraces":"0","trace_address":"0"},{"hash":"6821054879E5EC4519914EEEEA43319CC5012A80837C90863656A5373C3A0855","mci":"6410","mc_timestamp":"1560946809","stable_index":"6541","type":"0","call_type":"call","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"czr_3ynp4SUgi4wo6Yz8zBFmvEqyA1cz3ksyMLa8jAawzvkTatcquU","gas":"2300","input":"","value":"300000000000000000","init":"","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"2997740","output":"","contract_address_create":"","contract_address_create_code":"","is_error":false,"error_msg":"","subtraces":"0","trace_address":"1"},{"hash":"6821054879E5EC4519914EEEEA43319CC5012A80837C90863656A5373C3A0855","mci":"6410","mc_timestamp":"1560946809","stable_index":"6541","type":"1","call_type":"","from":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","to":"","gas":"2900034","input":"","value":"0","init":"60806040526040516020806101CB8339810180604052602081101561002357600080FD5B5051600055610194806100376000396000F3FE60806040526004361061005B577C010000000000000000000000000000000000000000000000000000000060003504630B6F48A5811461005D57806312065FE0146100725780633E424FD7146100995780635DAB2420146100AE575B005B34801561006957600080FD5B5061005B6100C3565B34801561007E57600080FD5B5061008761012B565B60408051918252519081900360200190F35B3480156100A557600080FD5B5061005B610130565B3480156100BA57600080FD5B50610087610162565B6000805460405190919067016345785D8A00009082818181858883F193505050501580156100F5573D6000803E3D6000FD5B506000805460405190919067016345785D8A00009082818181858883F19350505050158015610128573D6000803E3D6000FD5B50565B303190565B6000805460405190919067016345785D8A00009082818181858883F19350505050158015610128573D6000803E3D6000FD5B6000548156FEA165627A7A72305820624F9D2E0AD8999D3A31AF501A4A882E0BF342B771F0BCA0A1DD8ACFED4A8CF400295C0D32E578B5599831899C0321ACB2EE8D2737D5CA10D8B219BEE365F5BF9492","contract_address_suicide":"","refund_adderss":"","balance":"0","gas_used":"200944","output":"","contract_address_create":"czr_3ynp4SUgi4wo6Yz8zBFmvEqyA1cz3ksyMLa8jAawzvkTatcquU","contract_address_create_code":"60806040526004361061005B577C010000000000000000000000000000000000000000000000000000000060003504630B6F48A5811461005D57806312065FE0146100725780633E424FD7146100995780635DAB2420146100AE575B005B34801561006957600080FD5B5061005B6100C3565B34801561007E57600080FD5B5061008761012B565B60408051918252519081900360200190F35B3480156100A557600080FD5B5061005B610130565B3480156100BA57600080FD5B50610087610162565B6000805460405190919067016345785D8A00009082818181858883F193505050501580156100F5573D6000803E3D6000FD5B506000805460405190919067016345785D8A00009082818181858883F19350505050158015610128573D6000803E3D6000FD5B50565B303190565B6000805460405190919067016345785D8A00009082818181858883F19350505050158015610128573D6000803E3D6000FD5B6000548156FEA165627A7A72305820624F9D2E0AD8999D3A31AF501A4A882E0BF342B771F0BCA0A1DD8ACFED4A8CF40029","is_error":false,"error_msg":"","subtraces":"0","trace_address":"0"}],"code":200,"success":true,"message":"success"};

            if (response.success) {
                self.trans_internal = response.data;
                if (response.data.length) {
                    self.pageFirstItem = response.data[0];
                    self.pageLastItem = response.data[response.data.length - 1];
                } else {
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    return;
                }
            } else {
                self.trans_internal = [];
            }
            //禁止首页上一页
            if (parm.position === "1") {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            } else if (parm.position === "4") {
                self.btnSwitch.right = true;
                self.btnSwitch.footer = true;
            }
            if (self.trans_internal.length > 0) {
                if (
                    self.first_stable_index === self.pageFirstItem.stable_index
                ) {
                    self.btnSwitch.header = true;
                    self.btnSwitch.left = true;
                }

                if (self.end_stable_index === self.pageLastItem.stable_index) {
                    self.btnSwitch.right = true;
                    self.btnSwitch.footer = true;
                }
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        goBlockPath(block) {
            this.$router.push("/block/" + block);
        },
        goAccountPath(account) {
            this.$router.push("/account/" + account);
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
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    break;
                case "event_logs":
                    this.$router.push(`/account/${self.address}/event_logs`);
                    break;
                case "contract_code":
                    this.$router.push(`/account/${self.address}/contract_code`);
                    break;
            }
        }
    }
};
</script>