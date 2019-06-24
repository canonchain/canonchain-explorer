<template>
    <div>
        <div id="czr-charts"></div>
        <div class="dashboard-select">
            <el-row>
                <el-col :span="5">
                    <div class="text-content">
                        <el-radio
                            v-model="radio"
                            label="1"
                            @change="initEcharts"
                            >秒</el-radio
                        >
                    </div>
                </el-col>
                <el-col :span="5">
                    <div class="text-content ">
                        <el-radio
                            v-model="radio"
                            label="10"
                            @change="initEcharts"
                            >10秒</el-radio
                        >
                    </div>
                </el-col>
                <el-col :span="5">
                    <div class="text-content ">
                        <el-radio
                            v-model="radio"
                            label="30"
                            @change="initEcharts"
                            >30秒</el-radio
                        >
                    </div>
                </el-col>
                <el-col :span="5">
                    <div class="text-content ">
                        <el-radio
                            v-model="radio"
                            label="60"
                            @change="initEcharts"
                            >1分钟</el-radio
                        >
                    </div>
                </el-col>
                <el-col :span="4">
                    <div class="text-content ">
                        <el-radio
                            v-model="radio"
                            label="300"
                            @change="initEcharts"
                            >5分钟</el-radio
                        >
                    </div>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script>
// 加载echarts，注意引入文件的路径
import echarts from "echarts/lib/echarts";
// 再引入需要使用的图表类型，标题，提示信息等
import "echarts/lib/chart/bar";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";

let myChart;
let stampNow;
let get_timestamp_opt;
let clientObj;
let serverObj;
let data;
let self;

export default {
    name: "Echarts",
    data() {
        return {
            radio: "1",
            start_data: 0
        };
    },
    created() {
        self = this;
        self.data = [5];
        for (let i = 0; i < 5; i++) {
            self.data[i] = {
                timestamp: [],
                count: []
            };
        }
        let reg = /^#\/+\?+\w+=(\d{14})$/;
        let restlt = reg.exec(window.location.hash);
        if (restlt) {
            this.start_data = this.toTimestamp(restlt[1]);
        }
    },
    mounted() {
        // 基于准备好的dom，初始化echarts实例
        myChart = echarts.init(document.getElementById("czr-charts"));
        self.initEcharts(self.radio);
    },
    methods: {
        //echarts
        async initEcharts(value) {
            if (value == "300") {
                var index_f = 4;
            } else if (value == "60") {
                var index_f = 3;
            } else if (value == "30") {
                var index_f = 2;
            } else if (value == "10") {
                var index_f = 1;
            } else {
                var index_f = 0;
            }
            if (self.data[index_f].timestamp.length != 0) {
                // drawChart(index_f);
                myChart.setOption({
                    title: {
                        text: "CZR TPS"
                    },
                    tooltip: {},
                    xAxis: {
                        data: this.data[index_f].timestamp
                    },
                    yAxis: {},
                    series: [
                        {
                            name: "TPS",
                            type: "bar",
                            data: this.data[index_f].count
                        }
                    ]
                });
                return;
            }
            get_timestamp_opt = {
                type: value
            };

            if (self.start_data > 0) {
                get_timestamp_opt.start = self.start_data;
            }

            let response = await self.$api.get(
                "/api/get_timestamp",
                get_timestamp_opt
            );
            if (response.success) {
                this.data[index_f].timestamp = response.timestamp;
                this.data[index_f].count = response.count;

                self.data[index_f].timestamp.forEach((item, index) => {
                    self.data[index_f].timestamp[index] = self.toTime(item);
                });

                // 绘制图表

                // drawChart(index_f);
                myChart.setOption({
                    title: {
                        text: "CZR TPS"
                    },
                    tooltip: {},
                    xAxis: {
                        data: this.data[index_f].timestamp
                    },
                    yAxis: {},
                    series: [
                        {
                            name: "TPS",
                            type: "bar",
                            data: this.data[index_f].count
                        }
                    ]
                });
            } else {
                console.error("/api/get_timestamp Error");
            }
        },
        timeFormat(type, date) {
            return type === "1" ? date : Math.floor(date / 10);
        },
        toTime(timestamp) {
            // 简单的一句代码
            // 154330965
            // 1543309450 Number(timestamp)<999999999
            let date; //
            if (Number(timestamp) < 999999999) {
                date = new Date(Number(timestamp) * 1000 * 10); //获取一个时间对象
            } else {
                date = new Date(Number(timestamp) * 1000); //获取一个时间对象
            }
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
        },
        //timestamp
        toTimestamp(time) {
            function format(opt) {
                opt = opt.split("");
                let target =
                    opt[0] +
                    opt[1] +
                    opt[2] +
                    opt[3] +
                    "/" +
                    opt[4] +
                    opt[5] +
                    "/" +
                    opt[6] +
                    opt[7] +
                    " " +
                    opt[8] +
                    opt[9] +
                    ":" +
                    opt[10] +
                    opt[11] +
                    ":" +
                    opt[12] +
                    opt[13];
                return target;
            }
            return new Date(format(time)).getTime() / 1000;
        }
    }
};
</script>

<style scoped>
#czr-charts {
    height: 350px;
}
.dashboard-select {
    padding: 10px;
}
</style>
