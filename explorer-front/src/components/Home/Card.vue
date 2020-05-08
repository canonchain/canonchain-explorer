<template>
    <el-row>
        <el-col :span="6">
            <div class="text-content">
                <h4 class="mci-number">{{ mci.last_mci }}</h4>
                <p class="mci-tit">{{ $t('home.latest_mci') }}</p>
            </div>
        </el-col>
        <el-col :span="6">
            <div class="text-content">
                <h4 class="mci-number">{{ mci.last_stable_mci }}</h4>
                <p class="mci-tit">{{ $t('home.latest_stable_mci') }}</p>
            </div>
        </el-col>
        <el-col :span="6">
            <div class="text-content">
                <h4 class="mci-number">{{ mci.last_stable_block_index }}</h4>
                <p class="mci-tit">{{ $t('home.latest_stable_index') }}</p>
            </div>
        </el-col>
        <el-col :span="6">
            <div class="text-content">
                <h4 class="mci-number">{{ mci.top_tps }}</h4>
                <p class="mci-tit">{{ $t('home.peak_tps') }}</p>
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
    color: #28388c;
}
@media (max-width: 999px) {
    .mci-number {
        font-size: 20px;
    }
}
</style>
