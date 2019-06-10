<template>
    <div class="sub-header">
        <template v-if="type === 2">
            <strong class="sub_header-tit">合约账户</strong>
        </template>
        <template v-else>
            <strong class="sub_header-tit">账户</strong>
        </template>
        <span class="sub_header-des">{{address}}</span>
    </div>
</template>
<script>
export default {
    name: "SubHeader",
    props: ["type", "address"]
};
</script>
