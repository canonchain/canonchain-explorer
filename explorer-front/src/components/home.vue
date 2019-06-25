<template>
    <div class="page-home">
        <czr-header></czr-header>
        <placard></placard>
        <div class="container">
            <div class="card-wrap">
                <card :mci="mci"></card>
            </div>
            <div class="charts-wrap">
                <echarts></echarts>
            </div>
            <div class="trans-wrap" v-loading="loadingSwitch">
                <h2 class="trans-tit">最新交易</h2>
                <nomal-list :database="database"></nomal-list>
            </div>
        </div>
        <czr-footer></czr-footer>
    </div>
</template>

<script>
import CzrHeader from "@/components/Header/Header";
import CzrFooter from "@/components/Footer/Footer";
import NomalList from "@/components/Transaction/nomal";
import Placard from "@/components/Home/Placard";
import Echarts from "@/components/Home/Echarts";
import Card from "@/components/Home/Card";

let self;
export default {
    name: "Home",
    components: {
        CzrHeader,
        CzrFooter,
        NomalList,
        Echarts,
        Placard,
        Card
    },
    data() {
        return {
            loadingSwitch: true,
            mci: {
                last_stable_mci: "-",
                last_mci: "-",
                last_stable_block_index: "-"
            },
            database: []
        };
    },
    created() {
        self = this;
        self.getTransactions();
        self.getMci();
    },

    methods: {
        async getTransactions() {
            let lastTranResponse = await self.$api.get(
                "/api/get_latest_transactions"
            );
            if (lastTranResponse.success) {
                self.database = lastTranResponse.transactions;
                self.loadingSwitch = false;
            } else {
                self.database = [
                    {
                        mc_timestamp: "-",
                        hash: "-",
                        from: "-",
                        to: "-",
                        is_stable: 0,
                        status: 0,
                        amount: 0
                    }
                ];
                self.loadingSwitch = false;
            }
        },
        //mci
        async getMci() {
            let response = await self.$api.get("/api/get_mci");
            if (response.success) {
                self.mci.last_stable_mci = response.mci.last_stable_mci;
                self.mci.last_stable_block_index =
                    response.mci.last_stable_block_index;
                self.mci.last_mci = response.mci.last_mci;
            } else {
                console.error("/api/get_mci Error");
            }
        }
    }
};
</script>

<style scoped>
.container {
    margin-top: 20px;
    padding-bottom: 20px;
}
.trans-wrap {
    margin-top: 10px;
    padding: 20px 10px;
    background-color: #fff;
}
.trans-tit {
    font-size: 18px;
    padding-left: 10px;
    color: #4a4a4a;
}

.card-wrap {
    background-color: #fff;
    color: #28388c;
    padding: 18px 10px 0 10px;
}
.charts-wrap {
    margin-top: 10px;
    padding: 10px;
    background-color: #fff;
}
</style>
