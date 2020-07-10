<template>
    <div class="page-not-found">
        <div class="icon-wrap">
            <i class="el-icon-warning icon-no-found"></i>
        </div>
        <div class="no-found-des">
            {{ $t("undefined.undefined") }}
            <div class="go-home">
                <router-link
                    to="/"
                    tag="li"
                    class="wui-button wui-button-purple-nobg"
                    >{{ $t("undefined.go_home") }}</router-link
                >
            </div>
        </div>
    </div>
</template>
<style scoped>
.page-not-found {
    text-align: center;
    color: #fff;
    background: #5a59a0;
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    text-align: center;
    height: 100%;
    background-image: radial-gradient(
        50% 158%,
        #57509e 29%,
        #353469 93%,
        #333366 100%
    );
}
.page-not-found .icon-wrap {
    padding-top: 110px;
}
.no-found-des {
    padding-top: 20px;
}
.icon-no-found {
    font-size: 64px;
}
.no-found-des {
    font-size: 24px;
}
.go-home {
    display: block;
    padding-top: 10px;
}

/* diy bun */
.wui-button {
    height: 28px;
    line-height: 28px;
    padding-left: 18px;
    padding-right: 18px;
    font-size: 14px;
    border-radius: 3px;
}
.wui-button-purple-nobg {
    color: #9c80c9;
    border: 1px solid #8244ae;
    background-color: #fff;
}
.wui-button {
    display: inline-block;
    text-align: center;
    text-decoration: none;
    vertical-align: middle;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    font-weight: bold;
    background-image: none;
    border: 1px solid transparent;
}
</style>

