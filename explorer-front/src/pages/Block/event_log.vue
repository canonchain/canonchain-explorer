<template>
    <div class="page-block">
        <czr-header></czr-header>
        <div class="block-wrap">
            <div class="container">
                <el-tabs v-model="activeName" @tab-click="change_table">
                    <el-tab-pane label="交易详情" name="trans_info"></el-tab-pane>
                    <el-tab-pane label="内部交易" name="intel_trans"></el-tab-pane>
                    <el-tab-pane label="事件日志" name="event_log">
                        <template v-loading="loadingSwitch">
                            <template v-if="IS_GET_INFO">
                                <event-logs :database="event_log"></event-logs>
                            </template>
                        </template>
                    </el-tab-pane>
                    <el-tab-pane label="高级信息" name="advanced_info"></el-tab-pane>
                </el-tabs>
            </div>
        </div>
        <czr-footer></czr-footer>
    </div>
</template>

<script>
import CzrHeader from "@/components/Header/Header";
import CzrFooter from "@/components/Footer/Footer";
import EventLogs from "@/components/List/EventLogs";

let self = null;
let trsns_info;

export default {
    name: "Block",
    components: {
        CzrHeader,
        CzrFooter,
        EventLogs
    },
    data() {
        return {
            blockHash: this.$route.params.id,
            isSuccess: false,
            loadingSwitch: true,
            IS_GET_INFO: false,
            // change
            activeName: "event_log"
        };
    },
    created() {
        self = this;
        this.getTransactions();
    },
    methods: {
        async getTransactions() {
            //TODO 没有搜见证交易
            self.loadingSwitch = true;
            let opt = {
                hash: self.blockHash
            };
            let response = await self.$api.get(
                "/api/get_transaction_event_log",
                opt
            );
            let tempTopics;

console.log(response);
            if (response.success) {
                self.event_log = response.data;
            } else {
                self.event_log = [];
            }

            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        change_table(tab, event) {
            switch (tab.name) {
                case "trans_info":
                    this.$router.push(`/block/${self.blockHash}`);
                    break;
                case "intel_trans":
                    this.$router.push(`/block/${self.blockHash}/intel_trans`);
                    break;
                case "event_log":
                    break;
                case "advanced_info":
                    this.$router.push(`/block/${self.blockHash}/advanced_info`);
                    break;
            }
        }
    }
};
</script>