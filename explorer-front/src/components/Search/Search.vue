<template>
    <div class="input-wrap">
        <el-form class="demo-form-inline" @submit.native.prevent="onSubmit">
            <el-input
                v-model="form.searchVal"
                size="mini"
                :placeholder="form.placeholder"
                @keydown.enter="onSubmit($event)"
            >
                <el-button
                    slot="append"
                    size="mini"
                    icon="el-icon-search"
                    @click="onSubmit()"
                ></el-button>
            </el-input>
        </el-form>
    </div>
</template>
<script>
export default {
    name: "Search",
    data() {
        return {
            form: {
                searchVal: "",
                placeholder: "请输入CZR交易号或账户进行查询"
            }
        };
    },
    watch: {
        $route(to, from) {
            this.$router.go(0);
        }
    },
    methods: {
        onSubmit() {
            var currentVal = this.form.searchVal;
            currentVal = currentVal.replace(/\s+/g, "");
            var blockReg = /^[A-Z0-9a-z]{64}$/;
            // 92CFDBBDA091FE3D12DFCEFB28AAC648277F85278A22253F11A68325314BEAEB

            var accountReg = /^(?:(?:c|C)(?:z|Z)(?:r|R))_([a-zA-Z0-9]{50}$)/;
            // czr_1wyras8kej7hxua9uirsdhet7tuaghn9nbfwsxdru8w34gk8st5yikstoku3
            // czr_3NABwspcEqCzmUYvoMYa9YGmsrjy4ecZWSniVFcwrDNoUZ89RH

            if (blockReg.test(currentVal)) {
                //block
                this.$router.push("/block/" + currentVal);
            } else if (accountReg.test(currentVal)) {
                //account
                this.$router.push("/account/" + currentVal);
            } else if (!currentVal) {
                this.$message.error("输入要查询的账号或交易号");
            } else {
                this.$message.error("不是合法的账号或交易号，请仔细核对");
            }
        }
    }
};
</script>
<style scoped>
.input-wrap {
    max-width: 680px;
    min-width: 380px;
    padding: 0;
}
</style>

