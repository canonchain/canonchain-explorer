<template>
    <div class="dash-board-wrap">
        <div class="slogan-wrap">
            <h1 class="slogan">{{ slogan }}</h1>
            <p class="slogan-des">{{ sloganDes }}</p>
        </div>
        <search></search>
    </div>
</template>
<script>
import Search from "@/components/Search/Search";

export default {
    name: "Dashboard",
    components: {
        Search
    },
    data() {
        return {
            slogan: "标准链 区块浏览器",
            sloganDes: "提供交易号和账户的相关查询",
            form: {
                searchVal: "",
                placeholder: "请输入CZR交易号或账户进行查询"
            }
        };
    }
};
</script>
<style>
.dash-board-wrap .slogan-wrap {
    margin-top: 60px;
}
.dash-board-wrap .slogan {
    text-shadow: -5px 5px 0 rgba(0, 0, 0, 0.1);
}
@media (max-width: 1199px) {
    .dash-board-wrap .slogan {
        font-size: 34px;
    }
}

@media (min-width: 1200px) {
    .dash-board-wrap .slogan {
        font-size: 56px;
    }
}

.dash-board-wrap .slogan-des {
    font-size: 20px;
    margin-top: 10px;
    margin-bottom: 60px;
}
</style>
