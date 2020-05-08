<template>
    <div class="com-event-log">
        <!-- start -->
        <div v-for="(item,index) in database" :key="index">
            <div class="bui-dlist token-item">
                <!-- <div class="block-item-des">
                    <strong class="bui-dlist-tit">Address</strong>
                    <div class="bui-dlist-det">{{ item.address }}</div>
                </div> -->
                <div class="block-item-des">
                    <strong class="bui-dlist-tit">Topic</strong>
                    <div class="bui-dlist-det">
                        <template v-for="(child_item, index) in item.topics">
                            [{{ index }}]
                            {{ child_item.toUpperCase() }}
                            <br>
                        </template>
                    </div>
                </div>
                <div class="block-item-des">
                    <strong class="bui-dlist-tit">Data</strong>
                    <div class="bui-dlist-det">{{ item.data || "-" }}</div>
                </div>
            </div>
        </div>
        <!-- End -->
        <template v-if="database.length === 0">
            <div class="data-null">--- {{ $t('list.no_data') }} ---</div>
        </template>
    </div>
</template>
<script>
export default {
    name: "EventLogsList",
    props: ["database"]
};
</script>
<style scoped>
.com-event-log {
    position: relative;
    overflow: hidden;
    margin-top: -1px;
}
</style>
