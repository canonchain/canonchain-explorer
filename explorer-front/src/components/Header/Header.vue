<template>
    <div id="header">
        <div class="container header-wrap">
            <nav
                class="navbar navbar-expand-md navbar-dark justify-content-between"
            >
                <router-link to="/">
                    <img :src="logo" alt="Logo" class="czr-logo" />
                </router-link>
                <button
                    class="navbar-toggler"
                    type="button"
                    data-toggle="collapse"
                    data-target="#collapsibleNavbar"
                >
                    <span class="navbar-toggler-icon"></span>
                </button>
            </nav>

            <nav
                class="header-navs navbar navbar-expand-md navbar-dark justify-content-between"
            >
                <div class="collapse navbar-collapse" id="collapsibleNavbar">
                    <ul class="navbar-nav">
                        <li class="nav-item">
                            <router-link class="nav-link" to="/">{{
                                $t("header.main")
                            }}</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/accounts">{{
                                $t("header.account")
                            }}</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/normal_trans">{{
                                $t("header.normal_trans")
                            }}</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/witness_trans">{{
                                $t("header.witness_trans")
                            }}</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/tokens">{{
                                $t("header.token")
                            }}</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/internals">{{
                                $t("header.trans_in_contracts")
                            }}</router-link>
                        </li>
                        <li class="nav-item">
                            <router-link class="nav-link" to="/mapping_log">{{
                                $t("header.mainnet_mapping")
                            }}</router-link>
                        </li>
                        <li class="nav-item" v-if="is_mobile == false">
                            <router-link class="nav-link" to="/dag">{{
                                $t("header.dag")
                            }}</router-link>
                        </li>
                    </ul>
                </div>
                <search></search>
            </nav>
        </div>
    </div>
</template>

<script>
import Search from "@/components/Search/Search";
import cnLogo from "@/assets/logo.png";
import enLogo from "@/assets/logo-en.png";

export default {
    name: "CzrHeader",
    components: {
        Search
    },
    data() {
        return {
            is_mobile: true,
            logo: localStorage.getItem("locale") === "zh-CN" ? cnLogo : enLogo,
            tableData: []
        };
    },
    mounted() {
        this.is_mobile = this._isMobile() ? true : false;
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
#header {
    background-color: #28388c;
}
#header .header-wrap {
    padding: 12px 0;
}
#header .czr-logo {
    height: 43px;
}
#header .header-navs {
    padding-top: 8px;
}
.navbar-dark .navbar-nav .nav-link {
    color: #fff;
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
.navbar {
    padding: 0;
    flex-flow: row wrap;
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
        margin-right: 10px;
    }
    .nav-link {
        padding: 3px 15px;
    }
    .navbar-nav .router-link-exact-active {
        border-bottom: 2px solid #e0e0e0;
    }
}
@media (max-width: 999px) {
    #header .header-wrap {
        padding: 6px 10px 0;
    }
    #header .input-wrap {
        margin-bottom: 8px;
        min-width: 100%;
    }
}
</style>
