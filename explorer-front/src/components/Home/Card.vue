<template>
    <el-row>
        <el-col :span="6">
            <div class="text-content">
                <h4 class="mci-number">
                    {{ mci.last_mci }}
                </h4>
                <p class="mci-tit">最新MCI</p>
            </div>
        </el-col>
        <el-col :span="6">
            <div class="text-content">
                <h4 class="mci-number">
                    {{ mci.last_stable_mci }}
                </h4>
                <p class="mci-tit">最新稳定MCI</p>
            </div>
        </el-col>
        <el-col :span="6">
            <div class="text-content">
                <h4 class="mci-number">
                    {{ mci.last_stable_block_index }}
                </h4>
                <p class="mci-tit">最新稳定INDEX</p>
            </div>
        </el-col>
        <el-col :span="6">
            <div class="text-content">
                <h4 class="mci-number">
                    {{ mci.last_stable_block_index }}
                </h4>
                <p class="mci-tit">峰值TPS</p>
            </div>
        </el-col>
    </el-row>
</template>
<script>
export default {
    name: "NomalList",
    props: ["mci"]
};
</script>
<style>
.mci-tit {
    color: #646464;
    font-size: 14px;
    font-weight: 400;
}
.mci-number {
    font-size: 22px;
    line-height: 20px;
}
@media (max-width: 999px) {
    .mci-number {
        font-size: 20px;
    }
}
</style>
