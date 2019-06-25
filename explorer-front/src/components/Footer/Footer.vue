<template>
    <div class="footer">
        <div class="container">
            <div class="footer-main b-flex ">
                <div class="b-flex-item">
                    <h4 class="tit">关注我们</h4>
                    <div class="group">
                        <a href="" class="item">Telegram</a>
                        <a href="" class="item">Twitter</a>
                        <a href="" class="item">微博</a>
                        <a href="" class="item">微信</a>
                    </div>
                </div>
                <div class="b-flex-item">
                    <h4 class="tit">开发者</h4>
                    <div class="group">
                        <a href="" class="item">Github</a>
                        <a href="" class="item">RPC 文档</a>
                        <a href="" class="item">节点文件</a>
                    </div>
                </div>
                <div class="b-flex-item">
                    <h4 class="tit">CZR生态</h4>
                    <div class="group">
                        <a href="" class="item">CZR官网</a>
                        <a href="" class="item">交易所</a>
                        <a href="" class="item">钱包</a>
                    </div>
                </div>
                <div class="b-flex-item">
                    <h4 class="tit">关于我们</h4>
                    <div class="group">
                        <a href="" class="item">CZR团队</a>
                        <a href="" class="item">新闻中心</a>
                        <a href="" class="item">项目周报</a>
                    </div>
                </div>
            </div>
            <p class="copyright">Copyright© 2017-2019 CZR</p>
        </div>
    </div>
</template>

<script>
export default {
    name: "CzrFooter"
};
</script>

<style scoped>
.footer {
    width: 100%;
    background: #1f1f21;
    color: #999999;
}

.footer .container {
    padding: 40px 0;
}
.footer-main {
    width: 100%;
}
.tit {
    font-size: 16px;
    font-weight: 600;
    padding-left: 40px;
}
.group {
    margin-top: 10px;
}
.item {
    display: block;
    /* padding-left: 40px; */
    font-size: 13px;
    padding: 2px 0 2px 40px;
    color: #999999;
}
.copyright {
    margin: 20px 0 0;
    text-align: center;
    font-size: 14px;
}
@media (max-width: 999px) {
    .b-flex {
        display: block;
    }
    .b-flex-item {
        display: inline-block;
        margin-bottom: 20px;
        width: 49%;
        vertical-align: top;
    }
}
</style>


