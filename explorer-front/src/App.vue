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
html,
body {
    background: #f3f3f3;
}
a {
    color: #28388c;
}
.txt-warning {
  color: #e6a23c;
}
.txt-info {
  color: #909399;
}
.txt-success {
  color: #67c23a;
}
.txt-danger {
  color: #f56c6c;
}
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
.accounts-main-wrap {
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
    width: 80%;
    height: 100px;
    max-height: 100px;
    margin-top: 5px;
    word-break: break-all;
    white-space: pre-wrap;
    white-space: -moz-pre-wrap;
    white-space: -o-pre-wrap;
    word-wrap: break-word;
    border: 1px solid #e7eaf3;
    padding: 12px;
}
.page-account .contract-code {
    width: 100%;
}
@media (max-width: 900px) {
    .contract-code {
        width: 100%;
    }
}
.beautify-color {
    color: #c0c0c0;
}
.text-content {
    text-align: center;
}

/* List页面 开始 */
.page-list {
    width: 100%;
    position: relative;
}
.page-container {
    position: relative;
    width: 100%;
    margin: 0 auto;
    color: black;
    text-align: left;
    padding-top: 20px;
    padding-bottom: 20px;
}
.page-container .container {
    background: #fff;
    padding-bottom: 10px;
}
.list-title {
    font-size: 18px;
    padding-left: 10px;
    padding-right: 10px;
    color: #4a4a4a;
}
.sub_header-des {
    color: #999;
}
.list-wrap {
    min-height: 550px;
    padding: 20px 0;
    background-color: #fff;
}
.pagin-block {
    display: block;
    margin: 10px 0;
    text-align: right;
}
/* List页面 结束 */

/* 分页开始 */
.pagin-block {
    display: block;
    margin: 20px 0;
    text-align: right;
}

/* 分页结束 */

/* Hash Info Start */
.page-block {
    width: 100%;
    position: relative;
}
.page-block .table-long-item {
    line-height: 12px;
    position: relative;
    top: 2px;
}
.block-wrap {
    position: relative;
    min-height: 650px;
    background-color: #fff;
    width: 100%;
    margin: 20px auto 20px;
    color: black;
    text-align: left;
    padding-top: 5px;
    padding-bottom: 20px;
}
.bui-dlist {
    color: #3f3f3f;

    font-size: 16px;
    line-height: 2.4;
}
.block-item-des {
    display: -webkit-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display: block;
}
.bui-dlist-tit {
    display: block;
    width: 100%; /* 默认值, 具体根据视觉可改 */
    margin: 0;
    font-size: 12px;
    height: 32px;
    line-height: 32px;
    color: #333333;
    text-align: left;
}
.bui-dlist-det {
    display: block;
    font-size: 13px;
    color: #999999;
    text-align: left;
    margin: 0;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
}

@media (min-width: 1200px) {
    .bui-dlist {
        margin-top: 20px;
        /* border-top: 1px dashed #f6f6f6; */
    }
    .block-item-des {
        display: -webkit-box;
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
    }
    .bui-dlist-tit {
        float: left;
        width: 25%; /* 默认值, 具体根据视觉可改 */
        min-width: 110px;
        text-align: right;
        padding-right: 10px;
        margin: 0;
    }
    .bui-dlist-det {
        float: left;
        width: 65%; /* 默认值，具体根据视觉可改 */
    }
}

.amount-val {
    font-size: 15px;
    color: #333;
    line-height: 31px;
}
.token-item {
    padding: 30px 0;
    margin-top: 0;
    border-top: 1px solid #e4e7ed;
}
.data-null {
    height: 300px;
    line-height: 300px;
    color: #999999;
    text-align: center;
}
/* Hash Info End */

/* 账户详情 开始 */
.page-account .table-long-item {
    line-height: 12px;
    position: relative;
    top: 2px;
}
@media (max-width: 900px) {
    /* .page-account .table-long-item {
        max-width: 60px;
    } */
}

.page-account {
    width: 100%;
    position: relative;
}
.page-account .container {
    padding: 0;
}
.page-account-wrap {
    position: relative;
    width: 100%;
    margin: 0 auto;
    color: black;
    text-align: left;
    padding: 20px 0;
}

.account-panel {
    min-height: 150px;
    background-color: #fff;
}

/*  记录 */
.account-main {
    min-height: 500px;
    margin-top: 10px;
    padding: 5px 15px;
    background-color: #fff;
}
.trans-to-self {
    transform: rotate(90deg);
    -ms-transform: rotate(90deg); /* IE 9 */
    -moz-transform: rotate(90deg); /* Firefox */
    -webkit-transform: rotate(90deg); /* Safari 和 Chrome */
    -o-transform: rotate(90deg); /* Opera */
    padding: 0 6px;
}
/* 账户详情 开始 */
</style>
