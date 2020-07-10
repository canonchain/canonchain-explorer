<template>
    <div class="footer">
        <div class="container">
            <div class="footer-main b-flex">
                <div class="b-flex-item">
                    <h4 class="tit">{{ $t('footer.join_us') }}</h4>
                    <div class="group">
                        <!-- <a
                            href="https://t.me/canonchain"
                            target="_blank"
                            class="item"
                            >Telegram</a
                        >-->
                        <a
                            href="https://twitter.com/canonchain"
                            target="_blank"
                            class="item"
                        >Twitter</a>
                        <a href="https://weibo.com/u/6441087725" target="_blank" class="item">{{ $t('footer.weibo') }}</a>
                    </div>
                </div>
                <div class="b-flex-item">
                    <h4 class="tit">{{ $t('footer.developer') }}</h4>
                    <div class="group">
                        <a href="https://github.com/canonchain" target="_blank" class="item">Github</a>
                        <a
                            href="https://github.com/canonchain/canonchain/wiki/JOSN-RPC"
                            target="_blank"
                            class="item"
                        >{{ $t('footer.rpc_documents') }}</a>
                    </div>
                </div>
                <div class="b-flex-item">
                    <h4 class="tit">{{ $t('footer.czr_ecosystem') }}</h4>
                    <div class="group">
                        <a href="http://www.canonchain.com/zh-CN" target="_blank" class="item">{{ $t('footer.website') }}</a>
                        <a
                            href=" https://www.ceobi.com/exchange?id=czr_qc"
                            target="_blank"
                            class="item"
                        >{{ $t('footer.exchange') }}</a>
                    </div>
                </div>
                <div class="b-flex-item">
                    <h4 class="tit">{{ $t('footer.about') }}</h4>
                    <div class="group">
                        <a
                            href="http://www.canonchain.com/zh-CN#team"
                            target="_blank"
                            class="item"
                        >{{ $t('footer.team') }}</a>
                        <a href="http://www.canonchain.com/news" target="_blank" class="item">{{ $t('footer.news') }}</a>
                        <a
                            href="https://mp.weixin.qq.com/mp/homepage?__biz=MzU0MDY0MDk2MQ==&hid=1&sn=1564de5de7148310591deec0a233d859&scene=1&devicetype=iOS11.2.1&version=16060323&lang=zh_CN&nettype=WIFI&ascene=7&session_us=gh_83113c843061&fontScale=100&wx_header=1&from=singlemessage&isappinstalled=0"
                            target="_blank"
                            class="item"
                        >{{ $t('footer.reports') }}</a>
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


