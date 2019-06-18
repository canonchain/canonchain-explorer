<template>
    <div id="app">
        <router-view/>
    </div>
</template>

<script>
export default {
    name: "App",
    data() {
        return {};
    }
};
</script>

<style>
/* @import './assets/css/reset.css'; */
#app {
    font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
        "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    width: 100%;
    height: auto;
}

.container {
    padding-right: 10px;
    padding-left: 10px;
    margin-right: auto;
    margin-left: auto;
}

@media (min-width: 768px) {
    .container {
        width: 750px;
    }
}

@media (min-width: 992px) {
    .container {
        width: 970px;
    }
}

@media (min-width: 1200px) {
    .container {
        width: 1170px;
    }
}

/* flex Start */
.b-flex {
    display: -webkit-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: flex;
}

.b-flex .b-flex-item {
    -webkit-box-flex: 1;
    -ms-flex: 1;
    -webkit-flex: 1;
    flex: 1;
}

.b-flex.b-flex-vertical {
    flex-direction: column;
}

.b-flex.b-flex-justify {
    -webkit-box-pack: justify;
    -ms-flex-pack: justify;
    -webkit-justify-content: space-between;
    justify-content: space-between;
}

.b-flex.b-flex-right {
    justify-content: flex-end;
}

.b-flex.b-flex-stretch {
    align-items: stretch;
}

.b-flex.b-flex-hcenter {
    align-items: center;
}

.b-flex.b-flex-vcenter {
    justify-content: center;
}

.b-flex.b-flex-center {
    align-items: center;
    flex-direction: column;
}

/* flex End */
.accounts-list-wrap {
    min-height: 300px;
}
.table-long-item {
    max-width: 150px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.contract-code {
    display: block;
    height: 200px;
    max-height: 200px;
    margin-top: 5px;
    word-break: break-all;
    white-space: pre-wrap;
    white-space: -moz-pre-wrap;
    white-space: -o-pre-wrap;
    word-wrap: break-word;
    border: 1px solid #e7eaf3;
    padding: 12px;
}
</style>
