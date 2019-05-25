<template>
    <div id="header">
        <div class="container ">
            <nav class="navbar navbar-expand-md navbar-dark  justify-content-between">

                <router-link class="navbar-brand" to="/">
                    <img src="@/assets/logo.png" alt="Logo" class="czr-logo" height="50px;">
                </router-link>
                <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#collapsibleNavbar">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <!-- <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar-collapse" aria-expanded="false">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button> -->

                <!-- 这个 div 加上 justify-content-end -->
                <div class="collapse navbar-collapse justify-content-end" id="collapsibleNavbar">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <router-link class="nav-link" to="/">首页</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/accounts">账户</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/normal_trans">普通交易</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/witness_trans">见证交易</router-link>
                        </li>
                        <li class="nav-item" v-if="is_mobile == false">
                            <router-link class="nav-link" to="/dag">DAG</router-link>
                        </li>
                    </ul>
                </div>

            </nav>
        </div>

    </div>

</template>

<script>
export default {
    data() {
        return {
            dialogVisible: false,
            is_mobile:true,
            tableData: []
        };
    },
    mounted() {
        if (this._isMobile()) {
            this.is_mobile = true;
        } else {
            this.is_mobile = false;
        }
    },
    methods: {
        _isMobile() {
            let flag = navigator.userAgent.match(
                /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
            );
            return flag;
        }
    }
};
</script>

<style scoped>
#header .czr-logo {
    height: 50px;
}
/* 出现X号 */
#header .navbar-toggle .icon-bar {
    background-color: #fff;
}
.navbar-toggle .icon-bar:nth-child(3) {
    position: relative;
}

.navbar-toggle .icon-bar:nth-child(3):before {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    position: absolute;
    content: "";
    background-color: inherit;
}

.navbar-toggle[aria-expanded="true"] .icon-bar:nth-child(2),
.navbar-toggle[aria-expanded="true"] .icon-bar:nth-child(4) {
    opacity: 0;
}
.navbar-toggle[aria-expanded="true"] .icon-bar:nth-child(3) {
    -webkit-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    -o-transform: rotate(45deg);
    transform: rotate(45deg);
}
.navbar-toggle[aria-expanded="true"] .icon-bar:nth-child(3):before {
    -webkit-transform: rotate(90deg);
    -ms-transform: rotate(90deg);
    -o-transform: rotate(90deg);
    transform: rotate(90deg);
}
.navbar{
    padding: 0;
}

@media (min-width: 768px) {
    .navbar-toggle {
        height: 100px;
    }
}

/* X号结束 */
.navbar-nav {
    text-align: left;
}
@media (min-width: 1000px) {
    .nav-item {
        margin-left: 10px;
    }
    .nav-link {
        padding: 3px 15px;
    }
    .navbar-nav .router-link-exact-active {
        background: #403f75;
        border-radius: 3px;
    }
}
@media (max-width: 999) {
    #header .container {
        background: #5a59a0;
    }
}
</style>
