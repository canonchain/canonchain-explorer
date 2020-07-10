<template>
    <div class="placard-wrap">
        <div class="container">
            <el-row :gutter="24">
                <el-col :span="2" class="placard-icon">公告：</el-col>
                <el-col :span="10">
                    <a href="http://www.canonchain.com/news" target="_blank"
                        >CZR于2020年8月18日上线全球最大的交易所...</a
                    >
                </el-col>
                <el-col :span="10">
                    <a href="http://www.canonchain.com/news" target="_blank"
                        >CZR突破1元/枚，单日涨幅突破5%</a
                    ></el-col
                >
                <el-col :span="2" class="placard-more"
                    ><a href="http://www.canonchain.com/news" target="_blank"
                        >更多 ></a
                    ></el-col
                >
            </el-row>
        </div>
    </div>
</template>
<script>
export default {
    name: "Placard"
};
</script>

<style scoped>
.placard-wrap {
    background-color: #fff;
    padding: 7px 0;
    font-size: 12px;
}
.placard-more {
    text-align: right;
}
a {
    color: #333333;
}
@media (max-width: 999px) {
    .placard-icon,
    .placard-more {
        display: none;
    }
}
</style>


