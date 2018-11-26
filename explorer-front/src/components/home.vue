<template>
    <div class="page-home">
        <div class="home-top">
            <header-cps></header-cps>
            <dashboard></dashboard>
        </div>
        <div class="home-content">
            <div class="container">
                <div class="home-dashboard">
                    <div class="dashboard-left">
                        <el-row>
                            <el-col :span="12">
                                <div class="grid-content bg-purple">
                                    <h4 class="mci-tit">最新MCI</h4>
                                    <p class="mci-number">{{mci.last_mci}}</p>
                                </div>
                            </el-col>
                            <el-col :span="12">
                                <div class="grid-content bg-purple">
                                    <h4 class="mci-tit">最新稳定MCI</h4>
                                    <p class="mci-number">{{mci.last_stable_mci}}</p>
                                </div>
                            </el-col>
                        </el-row>
                    </div>
                    <div class="dashboard-right">
                        <div id='czr-charts'>
                            --
                        </div>
                    </div>
                    <div class="dashboard-select">
                        <el-row>
                            <el-col :span="12">
                                <div class="grid-content bg-purple">
                                    <el-radio v-model="radio" label="1" @change="initEcharts">秒</el-radio>
                                </div>
                            </el-col>
                            <el-col :span="12">
                                <div class="grid-content bg-purple">
                                    <el-radio v-model="radio" label="10" @change="initEcharts">10秒</el-radio>
                                </div>
                            </el-col>
                        </el-row>
                    </div>
                </div>
                <h2 class="home-content-tit">最新交易</h2>
                <template>
                    <el-table :data="database" style="width: 100%" v-loading="loadingSwitch">
                        <el-table-column label="时间" width="200">
                            <template slot-scope="scope">
                                <span class="table-long-item">{{scope.row.exec_timestamp | toDate}}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="交易号" width="200">
                            <template slot-scope="scope">
                                <el-button @click="goBlockPath(scope.row.hash)" type="text">
                                    <span class="table-long-item">{{scope.row.hash}}</span>
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column label="发款方" width="200">
                            <template slot-scope="scope">
                                <template v-if="scope.row.mci <= 0">
                                    <span class="table-long-item">Gene</span>
                                </template>
                                <template v-else>
                                    <el-button @click="goAccountPath(scope.row.from)" type="text">
                                        <span class="table-long-item">{{scope.row.from}}</span>
                                    </el-button>
                                </template>

                            </template>
                        </el-table-column>
                        <el-table-column label="收款方" width="200">
                            <template slot-scope="scope">
                                <el-button @click="goAccountPath(scope.row.to)" type="text">
                                    <span class="table-long-item">{{scope.row.to}}</span>
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column label="状态" min-width="80" align="center">
                            <template slot-scope="scope">
                                <template v-if="scope.row.is_stable === false">
                                    <span class="txt-warning">
                                        等待确认
                                    </span>
                                </template>
                                <template v-else>
                                    <template v-if='scope.row.status == "0"'>
                                        <span class="txt-success"> 成功 </span>
                                    </template>
                                    <template v-else-if='scope.row.status == "1"'>
                                        <span class="txt-danger"> 失败(1) </span>
                                    </template>
                                    <template v-else-if='scope.row.status == "2"'>
                                        <span class="txt-danger"> 失败(2) </span>
                                    </template>
                                    <template v-else-if='scope.row.status == "3"'>
                                        <span class="txt-danger"> 失败(3) </span>
                                    </template>
                                </template>

                                <span v-else class="xt-info">
                                    -
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column label="金额 / CZR" align="right" width="240">
                            <template slot-scope="scope">
                                <span>{{scope.row.amount | toCZRVal}}</span>
                            </template>
                        </el-table-column>
                    </el-table>
                </template>
            </div>

        </div>

    </div>
</template>

<script>
import HeaderCps from "@/components/Header/Header";
import Dashboard from "@/components/Dashboard/Dashboard";

// 加载echarts，注意引入文件的路径
import echarts from 'echarts/lib/echarts'
// 再引入需要使用的图表类型，标题，提示信息等
import 'echarts/lib/chart/bar'
import 'echarts/lib/component/tooltip'
import 'echarts/lib/component/title'

let myChart; 
export default {
    name: "Home",
    components: {
        HeaderCps,
        Dashboard
    },
    data() {
        return {
            loadingSwitch: true,
            mci:{
                last_stable_mci:"-",
                last_mci:"-"
            },
            radio: '1',
            database: []
        };
    },
    created() {
        self = this;
        self.getTransactions();
        self.getMci();
    },
    mounted() {
        // 基于准备好的dom，初始化echarts实例
        myChart = echarts.init(document.getElementById('czr-charts'));
        self.initEcharts(self.radio);
    },
    methods: {
        getTransactions() {
            self.loadingSwitch = true;
            self.$axios
                .get("/api/get_latest_transactions")
                .then(function(response) {
                    self.database = response.data.transactions;
                    self.loadingSwitch = false;
                })
                .catch(function(error) {
                    self.database = {
                        mc_timestamp: "-",
                        hash: "-",
                        from: "-",
                        to: "-",
                        amount: 0
                    };
                    self.loadingSwitch = false;
                });
        },
        goBlockPath(block) {
            this.$router.push("/block/" + block);
        },
        goAccountPath(account) {
            this.$router.push("/account/" + account);
        },
        //mci
        getMci(){
            self.mci.last_stable_mci = "22222";
            self.mci.last_mci = "22333";
            self.$axios
                .get("/api/get_mci")
                .then(function(response) {
                    let _data = response.data;
                    self.mci.last_stable_mci = _data.mci.last_stable_mci;
                    self.mci.last_mci = _data.mci.last_mci;
                })
                .catch(function(error) {
                    console.error("/api/get_mci Error")
                });
        },
        //echarts
        initEcharts(vaule){
            let data={
                    timestamp:['1542805423', '1542805422', '1542805421'],
                    count:[184, 1338, 154]
            };
            self.$axios
                .get("/api/get_timestamp", {
                    params: {
                        type: vaule
                    }
                })
                .then(function(response) {
                    data.timestamp = response.data.timestamp;
                    data.count = response.data.count;
                    data.timestamp.forEach((item,index)=>{
                        data.timestamp[index]=self.toTime(item);
                    })
                    // 绘制图表
                    myChart.setOption({
                        title: {
                            text: 'CZR TPS'
                        },
                        tooltip: {},
                        xAxis: {
                            data: data.timestamp
                        },
                        yAxis: {},
                        series: [{
                            name: 'TPS',
                            type: 'bar',
                            data: data.count
                        }]
                    });
                })
                .catch(function(error) {
                    //渲染
                });
        },
        toTime(timestamp){
           // 简单的一句代码
            let date = new Date(Number(timestamp)*1000); //获取一个时间对象
            let addZero = function(val) {
                return val < 10 ? "0" + val : val;
            };
            return (
                date.getFullYear() +
                "-" +
                addZero(date.getMonth() + 1) +
                "-" +
                addZero(date.getDate()) +
                " " +
                addZero(date.getHours()) +
                ":" +
                addZero(date.getMinutes()) +
                ":" +
                addZero(date.getSeconds())
            );
        }
    },
    filters: {
        toCZRVal: function(val) {
            let tempVal = self.$czr.utils.fromWei(val, "czr");
            return tempVal; //TODO Keep 4 decimal places
        },
        toDate: function(val) {
            if (val == "0" || !val) {
                return "-";
            }
            let newDate = new Date();
            newDate.setTime(val * 1000);
            let addZero = function(val) {
                return val < 10 ? "0" + val : val;
            };
            return (
                newDate.getFullYear() +
                " / " +
                addZero(newDate.getMonth() + 1) +
                " / " +
                addZero(newDate.getDate()) +
                " " +
                addZero(newDate.getHours()) +
                ":" +
                addZero(newDate.getMinutes()) +
                ":" +
                addZero(newDate.getSeconds())
            );
        }
    }
};
</script>

<style scoped>
.home-top {
    background: #5a59a0;
    text-align: center;
    width: 100%;
    height: 430px;
    color: #fff;
    background-image: radial-gradient(
        50% 158%,
        #57509e 29%,
        #353469 93%,
        #333366 100%
    );
}
.home-content .container {
    padding-bottom: 70px;
}
.home-content-tit {
    padding: 20px 10px 10px 0;
    font-size: 18px;
    color: #838383;
}
.table-long-item {
    max-width: 150px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.home-dashboard {
    margin-top: 20px;
}
.grid-content{text-align: center;}
.home-dashboard .dashboard-left {
    background-color: #f7f7f7;
    color: #5a59a0;
    padding: 18px 10px 0 10px;
}
.home-dashboard .dashboard-right {
    padding: 10px;
    border: 1px solid #f7f7f7;
    border-bottom: 1px transparent;
    /* background-color: #f7f7f7; */
}
.home-dashboard .dashboard-select{
    padding: 10px;
    border: 1px solid #f7f7f7;
    border-top: 1px transparent;
}
.dashboard-left .mci-tit{
    color: #646464;
    font-size: 14px;
    font-weight: 400;
}
.dashboard-left .mci-number{
    font-size: 22px;
    line-height: 20px;
}
#czr-charts{height: 350px;}
</style>
