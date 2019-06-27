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
                                >
                                    <div class="accounts-main-wrap">
                                        <div v-loading="loadingSwitch">
                                            <template v-if="IS_GET_INFO">
                                                <pre class="contract-code">{{
                                                    contract_code
                                                }}</pre>
                                            </template>
                                        </div>
                                    </div>
                                </el-tab-pane>
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

let self = null;

export default {
    name: "ContractCode",
    components: {
        CzrHeader,
        CzrFooter,
        AccountInfo
    },
    data() {
        return {
            loadingSwitch: true,
            address: this.$route.params.id,
            activeName: "contract_code",
            account_props: {
                account_type: 2,
                is_witness: false,
                is_token_account: false,
                is_has_token_trans: false,
                is_has_intel_trans: false,
                is_has_event_logs: false
            },

            IS_GET_ACC: false,
            IS_GET_INFO: false,

            // 合约代码
            contract_code: ""
        };
    },
    created() {
        self = this;
        self.getContractCode();
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
                    this.$router.push(`/account/${self.address}/event_logs`);
                    break;
                case "contract_code":
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    break;
            }
        },
        async getContractCode() {
            let opt = {
                account: self.address
            };
            let response = await self.$api.get("/api/get_contract_code", opt);

            response = {"data":{"contract_account":"czr_48EWGWUwG8mD5GbNevPbAKHbiAVT1NBsmv9k8FJqSDhnDuV1No","code":"608060405233600055610966806100176000396000F3FE608060405234801561001057600080FD5B50600436106100975760003560E060020A900480634BE775451161006A5780634BE77545146100D05780635DAB2420146100D8578063A6A2D286146100E0578063CE518F0A146100E8578063D78CA67F146100F057610097565B8063059422361461009C57806312065FE0146100A657806319A278B9146100C05780633284F168146100C8575B600080FD5B6100A46100F8565B005B6100AE6101B4565B60408051918252519081900360200190F35B6100AE6101B9565B6100A46101BF565B6100A4610228565B6100AE61027B565B6100A4610281565B6100AE61031A565B6100A4610320565B600154604080517F0B6F48A50000000000000000000000000000000000000000000000000000000081529051630B6F48A59160048082019260009290919082900301818387803B15801561014B57600080FD5B505AF115801561015F573D6000803E3D6000FD5B50505050600154630B6F48A56040518163FFFFFFFF1660E060020A028152600401600060405180830381600087803B15801561019A57600080FD5B505AF11580156101AE573D6000803E3D6000FD5B50505050565B303190565B60015490565B6000546040516101CE906103C2565B90815260405190819003602001906000F0801580156101F1573D6000803E3D6000FD5B506002819055604051600090670429D069189E00009082818181858883F19350505050158015610225573D6000803E3D6000FD5B50565B600154604080517FAC461DBD000000000000000000000000000000000000000000000000000000008152905163AC461DBD9160048082019260009290919082900301818387803B15801561014B57600080FD5B60005481565B6000805460405190916108FC9181818181818888F193505050501580156102AC573D6000803E3D6000FD5B506000546002546040516102BF906103CF565B9182526020820152604080519182900301906000F0801580156102E6573D6000803E3D6000FD5B5060018190556040516000906710A741A4627800009082818181858883F19350505050158015610225573D6000803E3D6000FD5B60025490565B600154604080517F3E424FD70000000000000000000000000000000000000000000000000000000081529051633E424FD79160048082019260009290919082900301818387803B15801561037357600080FD5B505AF1158015610387573D6000803E3D6000FD5B50505050600154630B6F48A56040518163FFFFFFFF1660E060020A028152600401600060405180830381600087803B15801561014B57600080FD5B6101CB806103DD83390190565B610393806105A88339019056FE60806040526040516020806101CB8339810180604052602081101561002357600080FD5B5051600055610194806100376000396000F3FE60806040526004361061005B577C010000000000000000000000000000000000000000000000000000000060003504630B6F48A5811461005D57806312065FE0146100725780633E424FD7146100995780635DAB2420146100AE575B005B34801561006957600080FD5B5061005B6100C3565B34801561007E57600080FD5B5061008761012B565B60408051918252519081900360200190F35B3480156100A557600080FD5B5061005B610130565B3480156100BA57600080FD5B50610087610162565B6000805460405190919067016345785D8A00009082818181858883F193505050501580156100F5573D6000803E3D6000FD5B506000805460405190919067016345785D8A00009082818181858883F19350505050158015610128573D6000803E3D6000FD5B50565B303190565B6000805460405190919067016345785D8A00009082818181858883F19350505050158015610128573D6000803E3D6000FD5B6000548156FEA165627A7A72305820624F9D2E0AD8999D3A31AF501A4A882E0BF342B771F0BCA0A1DD8ACFED4A8CF4002960806040818152806103938339810180604052604081101561002057600080FD5B508051602090910151600091909155600155610352806100416000396000F3FE60806040526004361061008A5760003560E060020A900480633E424FD71161005D5780633E424FD7146100F257806341C0E1B5146101075780635DAB24201461011C578063AC461DBD14610131578063FF2D6C52146101465761008A565B80630B6F48A51461008C5780630DBE671F146100A157806312065FE0146100C85780631FC376F7146100DD575B005B34801561009857600080FD5B5061008A61015B565B3480156100AD57600080FD5B506100B6610190565B60408051918252519081900360200190F35B3480156100D457600080FD5B506100B6610196565B3480156100E957600080FD5B5061008A61019B565B3480156100FE57600080FD5B5061008A6101A6565B34801561011357600080FD5B5061008A61023E565B34801561012857600080FD5B506100B6610241565B34801561013D57600080FD5B5061008A610247565B34801561015257600080FD5B506100B6610320565B6000805460405190919067016345785D8A00009082818181858883F1935050505015801561018D573D6000803E3D6000FD5B50565B60025481565B303190565B600280546001019055565B6000805460405190919067016345785D8A00009082818181858883F193505050501580156101D8573D6000803E3D6000FD5B506000805460405190919067016345785D8A00009082818181858883F1935050505015801561020B573D6000803E3D6000FD5B506000805460405190919067016345785D8A00009082818181858883F1935050505015801561018D573D6000803E3D6000FD5B33FF5B60005481565B6001546003556000805460405190919067016345785D8A00009082818181858883F1935050505015801561027F573D6000803E3D6000FD5B50600354630B6F48A56040518163FFFFFFFF1660E060020A028152600401600060405180830381600087803B1580156102B757600080FD5B505AF11580156102CB573D6000803E3D6000FD5B50505050600354633E424FD76040518163FFFFFFFF1660E060020A028152600401600060405180830381600087803B15801561030657600080FD5B505AF115801561031A573D6000803E3D6000FD5B50505050565B6001548156FEA165627A7A72305820725E4BE5F857802E4B2E3AE196321E09A774C83F7062F292657CF8C3C041BFDD0029A165627A7A7230582085E854D18DCC005D156683C1DDC4FD7DE880E92E7ED7B0861212C717ECD98DF40029"},"code":200,"success":true,"message":"success"}

            if (response.success) {
                self.contract_code = response.data.code;
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        }
    }
};
</script>