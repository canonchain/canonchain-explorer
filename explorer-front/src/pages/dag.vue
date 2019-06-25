<template>
    <div id="page-index">
        <!-- Header Start -->
        <div id="menu" class="rowFull">
            <div id="menuSocial">
                <router-link class="dag-link" to="/">首页</router-link>
                <router-link class="dag-link" to="/accounts">账户</router-link>
                <router-link class="dag-link" to="/normal_trans"
                    >普通交易</router-link
                >
                <router-link class="dag-link" to="/witness_trans"
                    >见证交易</router-link
                >
                <router-link class="dag-link" to="/tokens">代币</router-link>
                <router-link class="dag-link" to="/internals"
                    >内部交易</router-link
                >
                <router-link class="dag-link" to="/dag">DAG</router-link>
            </div>
            <div id="menuLeft">
                <router-link to="/" id="menuLeftImg">
                    <img src="@/assets/logo.png" />
                </router-link>
                <div id="menuInput">
                    <div class="input-wrap">
                        <el-form class="demo-form-inline" id="search-form">
                            <el-input
                                v-model="searchVal"
                                placeholder="请输入DAG上的查询内容"
                                id="inputSearch"
                                size="small"
                            >
                                <el-button
                                    slot="append"
                                    size="mini"
                                    icon="el-icon-search"
                                    @click="searchForm"
                                ></el-button>
                            </el-input>
                        </el-form>
                    </div>
                </div>
            </div>
        </div>
        <!-- Header End -->

        <!-- <div id="infoMessage" onclick="hideInfoMessage()">InfoMessage</div> -->
        <div id="cy" v-loading="loadingSwitch"></div>
        <div id="goToTop">
            <div id="titleGoToTop">
                <i class="el-icon-arrow-up"></i>
            </div>
        </div>
        <div id="scroll">
            <div id="scrollBody">&nbsp;</div>
        </div>
        <div id="info" class="hideInfoBlock" v-loading="loadingInfoSwitch">
            <div id="defaultInfo">点击左侧单元可查看详情</div>
            <div id="listInfo">
                <div class="info-item-dev">
                    <strong>Hash</strong>:
                    <span class="info-item-val">{{ activeUnitInfo.hash }}</span>
                </div>
                <div class="info-item-dev">
                    <span class="level-wrap">
                        <strong>Level</strong>:
                        <span class="info-item-val">{{
                            activeUnitInfo.level
                        }}</span>
                    </span>
                    <span class="level-wrap">
                        <strong>Witnessed Level</strong>:
                        <span class="info-item-val">{{
                            activeUnitInfo.witnessed_level
                        }}</span>
                    </span>
                    <span class="level-wrap">
                        <strong>Stable Index</strong>:
                        <span class="info-item-val">{{
                            activeUnitInfo.stable_index
                        }}</span>
                    </span>
                    <span class="level-wrap">
                        <strong>类型</strong>:
                        <template v-if="activeUnitInfo.type === '0'">
                            <span class="txt-success">创世交易</span>
                        </template>
                        <template v-else-if="activeUnitInfo.type === '1'">
                            <span class="txt-info">见证交易</span>
                        </template>
                    </span>
                </div>
                <div class="info-item-dev">
                    <strong>Previous</strong>:
                    <span class="info-item-val">
                        <template
                            v-if="
                                activeUnitInfo.previous ===
                                    '0000000000000000000000000000000000000000000000000000000000000000'
                            "
                        >
                            <span>-</span>
                        </template>
                        <template v-else>
                            <a
                                href="javascript:;"
                                @click="goBlockHash(activeUnitInfo.previous)"
                                >{{ activeUnitInfo.previous }}</a
                            >
                        </template>
                    </span>
                </div>
                <div class="info-item-dev">
                    <strong>Best Parent</strong>:
                    <span class="info-item-val">
                        <template
                            v-if="
                                activeUnitInfo.best_parent ===
                                    '0000000000000000000000000000000000000000000000000000000000000000'
                            "
                        >
                            <span>-</span>
                        </template>
                        <template v-else>
                            <a
                                href="javascript:;"
                                @click="goBlockHash(activeUnitInfo.best_parent)"
                                >{{ activeUnitInfo.best_parent }}</a
                            >
                        </template>
                    </span>
                </div>
                <div class="info-item-dev">
                    <template v-if="activeUnitInfo.parents.length == 0">
                        <strong>Parents : -</strong>
                    </template>
                    <template v-else>
                        <strong
                            :class="[
                                'switch',
                                { 'switch-show': showParentsLink }
                            ]"
                            @click="toggleParents('parent')"
                            >Parents</strong
                        >
                    </template>
                    <div
                        v-for="item in activeUnitInfo.parents"
                        v-show="showParentsLink == true"
                        :key="item.parent"
                    >
                        <a
                            href="javascript:;"
                            @click="goBlockHash(item.parent)"
                            >{{ item.parent }}</a
                        >
                    </div>
                </div>
                <div class="dashed-line"></div>
                <div class="info-item-dev">
                    <span class="level-wrap">
                        <strong>Is Stable</strong>:
                        <span class="info-item-val">{{
                            activeUnitInfo.is_stable
                        }}</span>
                    </span>
                    <span class="level-wrap">
                        <strong>Is On Mc</strong>:
                        <span class="info-item-val">{{
                            activeUnitInfo.is_on_mc
                        }}</span>
                    </span>
                    <span class="level-wrap">
                        <strong>Mci</strong>:
                        <span class="info-item-val">{{
                            activeUnitInfo.mci
                        }}</span>
                    </span>
                    <span class="level-wrap">
                        <strong>Status</strong>:
                        <template v-if="activeUnitInfo.is_stable === false">
                            <span class="txt-warning">等待确认</span>
                        </template>
                        <template v-else>
                            <template v-if="activeUnitInfo.status == '0'">
                                <span class="txt-success">成功</span>
                            </template>
                            <template v-else-if="activeUnitInfo.status == '1'">
                                <span class="txt-danger">失败(1)</span>
                            </template>
                            <template v-else-if="activeUnitInfo.status == '2'">
                                <span class="txt-danger">失败(2)</span>
                            </template>
                            <template v-else-if="activeUnitInfo.status == '3'">
                                <span class="txt-danger">失败(3)</span>
                            </template>
                        </template>
                    </span>
                </div>
                <div class="info-item-dev">
                    <span class="level-wrap">
                        <strong>Exec Time</strong>:
                        <span class="info-item-val">{{
                            activeUnitInfo.exec_timestamp | toDate
                        }}</span>
                    </span>
                    <span class="level-wrap">
                        <strong>Mc Time</strong>:
                        <span class="info-item-val">{{
                            activeUnitInfo.mc_timestamp | toDate
                        }}</span>
                    </span>
                </div>
                <div class="info-item-dev">
                    <span class="level-wrap">
                        <strong>Stable Time</strong>:
                        <span class="info-item-val">{{
                            activeUnitInfo.stable_timestamp | toDate
                        }}</span>
                    </span>
                </div>
                <div class="dashed-line"></div>
                <div class="info-item-dev">
                    <strong>Last Summary Block</strong>:
                    <span class="info-item-val">
                        <template
                            v-if="
                                activeUnitInfo.last_summary_block ===
                                    '0000000000000000000000000000000000000000000000000000000000000000'
                            "
                        >
                            <span>-</span>
                        </template>
                        <template v-else>
                            <a
                                href="javascript:;"
                                @click="
                                    goBlockHash(
                                        activeUnitInfo.last_summary_block
                                    )
                                "
                                >{{ activeUnitInfo.last_summary_block }}</a
                            >
                        </template>
                    </span>
                </div>
                <div class="info-item-dev">
                    <strong>Last Summary</strong>:
                    <span class="info-item-val">
                        <template
                            v-if="
                                activeUnitInfo.last_summary ===
                                    '0000000000000000000000000000000000000000000000000000000000000000'
                            "
                        >
                            <span>-</span>
                        </template>
                        <template v-else>{{
                            activeUnitInfo.last_summary
                        }}</template>
                    </span>
                </div>
                <div class="info-item-dev">
                    <strong>Last Stable Block</strong>:
                    <a
                        href="javascript:;"
                        @click="goBlockHash(activeUnitInfo.last_stable_block)"
                        >{{ activeUnitInfo.last_stable_block }}</a
                    >
                </div>
                <div class="info-item-dev">
                    <strong>Is Free</strong>:
                    <span class="info-item-val">{{
                        activeUnitInfo.is_free
                    }}</span>
                </div>
                <div class="dashed-line"></div>
                <div class="info-item-dev">
                    <strong>From</strong>:
                    <span class="info-item-val">
                        <router-link
                            tag="a"
                            :to="'/account/' + activeUnitInfo.from"
                            target="_blank"
                            >{{ activeUnitInfo.from }}</router-link
                        >
                    </span>
                </div>
                <div class="dashed-line"></div>
                <div class="info-item-dev">
                    <strong>Signature</strong>:
                    <span class="info-item-val">
                        <template
                            v-if="
                                activeUnitInfo.signature ===
                                    '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
                            "
                        >
                            <span>-</span>
                        </template>
                        <template v-else>
                            <span>{{ activeUnitInfo.signature }}</span>
                        </template>
                    </span>
                </div>
                <div class="info-item-dev">
                    <strong>Work</strong>:
                    <span class="info-item-val">
                        <template
                            v-if="activeUnitInfo.work === '0000000000000000'"
                        >
                            <span>-</span>
                        </template>
                        <template v-else>
                            <span>{{ activeUnitInfo.work }}</span>
                        </template>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import $ from "jquery";

import("@/assets/js/cytoscape.min.js");
import("@/assets/js/dagre.min.js");

var $page;
var $inputSearch;
var $cy;
var DOMCY;
var $scroll, $scrollBody;
var $info, $defaultInfo, $listInfo;
var $addressInfo;

var scrollTopPos = 0,
    scrollLowPos;

var _cy; //cyto scape
var nodes, edges;
var firstPkid,
    lastPkid,
    // firstUnit, //第一单元
    // lastUnit, //最后单元
    phantoms = {},
    phantomsTop = {},
    notStable = []; //不稳定Unit的列表

var firstParameters = {
    direction: "up",
    stable_index: ""
};
var lastParameters = {
    direction: "down",
    stable_index: ""
};

var nextPositionUpdates; //下一个位置更新
var generateOffset = 0, //生成偏移量
    newOffset = -116, //新的偏移量
    oldOffset; //老的偏移量

var activeNode, //活动节点
    waitGo; //输入hash时，如果当前没有，作为等待获取的节点去获取

var notLastUnitUp = false, //不是最后单位 上升
    notLastUnitDown = true; //不是最后单位 下降
var lastActiveUnit; //最后的活动单位
var page,
    isInit = false;
var queueAnimationPanUp = [], //队列动画
    animationPlaysPanUp = false; //动画执行

//websocket
var bWaitingForNext = false,
    bWaitingForNew = false,
    bHaveDelayedNewRequests = false,
    bWaitingForPrev = false,
    bWaitingForHighlightNode = false; //等待高亮节点

// var bWaitingForNextPageTransactions = false;
// var nextPageTransactionsEnd = false,
//     lastInputsROWID = 0,
//     lastOutputsROWID = 0;
//websocket

//timer
var timerInfoMessage;
var self;

//优化unit渲染
var storageUnitAry = [];
var storageParents = {};

export default {
    name: "Dag",
    components: {},
    data() {
        return {
            searchVal: "",
            loadingSwitch: true,
            loadingInfoSwitch: false,
            activeUnit: "",
            showParentsLink: true,
            showWitnessLink: true,
            activeUnitInfo: {
                hash: "-",
                from: "-",
                previous: "-",
                last_summary: "-",
                last_summary_block: "-",
                data: "",
                exec_timestamp: "0",
                signature: "-",
                is_free: false,
                level: "1",
                witnessed_level: "1",
                best_parent: "-",
                is_stable: true,
                status: "0",
                is_on_mc: true,
                mci: "-",
                latest_included_mci: "-",
                mc_timestamp: "0",
                parents: []
            },
            database: {
                nodes: [],
                edges: {}
            }
        };
    },
    created() {
        self = this;
    },
    mounted() {
        self.initVar();
        this.start();
    },
    methods: {
        initVar() {
            $page = $("#page-index");
            $inputSearch = $("#inputSearch");
            $cy = $page.find("#cy");
            DOMCY = document.getElementById("cy");
            $scroll = $("#scroll");
            $scrollBody = $("#scrollBody");
            $info = $page.find("#info");
            $defaultInfo = $("#defaultInfo");
            $listInfo = $("#listInfo");
            $addressInfo = $("#addressInfo");
        },

        init(nodes, edges) {
            self.initDate(nodes, edges);
            notLastUnitDown = true;
            if (bWaitingForHighlightNode) {
                bWaitingForHighlightNode = false;
            }
            self.bind();
        },
        initDate(_nodes, _edges) {
            nodes = _nodes;
            edges = _edges;

            var firstItem = nodes[0];
            var lastItem = nodes[nodes.length - 1];
            firstParameters = {
                direction: "up",
                stable_index: firstItem.stable_index
            };

            phantoms = {};
            phantomsTop = {};
            notStable = [];

            nextPositionUpdates = null;
            generateOffset = 0;
            newOffset = -116;
            notLastUnitUp = false;
            notLastUnitDown = true;
            activeNode = null;
            waitGo = null;

            // console.log("createCy start ================ ")
            self.createCy();
            // console.log("createCy end")

            self.generate(_nodes, _edges);

            oldOffset =
                _cy.getElementById(nodes[0].data.unit).position().y + 66;
            _cy.viewport({ zoom: 1.01 });
            _cy.center(_cy.nodes()[0]);
            page = "dag";

            self.activeUnit = location.hash.substr(6, 64);
            self.activeUnit =
                self.activeUnit.length === 64 &&
                self.activeUnit.indexOf("wt=") === -1
                    ? self.activeUnit
                    : "";
            if (self.activeUnit) {
                notLastUnitUp = true;
                self.highlightNode(self.activeUnit);
            }
            isInit = true;
        },

        bind: function() {
            //hash改变时触发
            window.addEventListener("hashchange", function() {
                self.activeUnit = location.hash.substr(6, 64);
                self.activeUnit =
                    self.activeUnit.length === 64 &&
                    self.activeUnit.indexOf("wt=") === -1
                        ? self.activeUnit
                        : "";
                if (self.activeUnit.length == 64) {
                    self.highlightNode(self.activeUnit);
                    //隐藏显示的面板
                    if ($addressInfo.css("display") == "block") {
                        $addressInfo.hide();
                    }
                }
            });

            //上下键滚动
            window.addEventListener(
                "keydown",
                function(e) {
                    if (page == "dag") {
                        if (e.keyCode == 38) {
                            e.preventDefault();
                            self.scrollUp();
                        } else if (e.keyCode == 40) {
                            e.preventDefault();
                            _cy.panBy({ x: 0, y: -25 });
                        }
                    }
                },
                true
            );

            //返回顶部
            $page.on("click", "#goToTop", function(e) {
                e.preventDefault();
                self.goToTop();
            });

            //滚动条滚动
            $scroll.scroll(function(e) {
                e.preventDefault();
                _cy.pan("y", self.convertPosScrollToPosPan());
            });

            //浏览器窗口重置
            $(window).resize(function() {
                if (_cy) {
                    $scroll.scrollTop(self.convertPosPanToPosScroll());
                }
            });

            // search form
            $page.on("submit", "#search-form", function(e) {
                e.preventDefault();
                self.searchForm();
            });
        },

        start() {
            if (
                location.hash.indexOf("#/dag") > -1 &&
                location.hash.length < 70
            ) {
                self.getStar();
            } else {
                notLastUnitUp = true;
                self.getStar(location.hash.substr(6, 64));
            }
        },
        getStar(searchUnit) {
            if (searchUnit && searchUnit.length !== 64) {
                searchUnit = "";
            }
            self.loadingSwitch = true;
            self.$axios
                .get("/api/get_previous_units", {
                    params: {
                        direction: "center",
                        active_unit: searchUnit
                    }
                })
                .then(function(response) {
                    response = self.filterParent(response);
                    if (response.data.units.nodes.length === 0) {
                        //TODO 回调
                        self.$message.error(
                            "没有找到数据 : " + (searchUnit || "数据组暂无数据")
                        );
                        self.loadingSwitch = false;
                        window.location.href = "/#/dag/";
                        return;
                    }

                    nodes = response.data.units.nodes;
                    edges = response.data.units.edges;

                    lastParameters = {
                        direction: "down",
                        stable_index: nodes[nodes.length - 1].stable_index
                    };
                    firstParameters = {
                        direction: "up",
                        stable_index: nodes[0].stable_index
                    };
                    console.log(firstParameters, nodes[0]);
                    console.log(lastParameters, nodes[nodes.length - 1]);

                    self.loadingSwitch = false;
                    self.init(nodes, edges);
                    notLastUnitDown = true;
                    if (bWaitingForHighlightNode) {
                        bWaitingForHighlightNode = false;
                    }
                })
                .catch(function(error) {
                    self.loadingSwitch = false;
                });
        },

        createCy: function() {
            // console.log('createCy 1',DOMCY)
            // console.log('_cy',_cy)
            _cy = cytoscape({
                container: DOMCY,
                boxSelectionEnabled: false,
                autounselectify: true,
                hideEdgesOnViewport: false,
                layout: {
                    name: "preset"
                },
                style: [
                    {
                        selector: "node",
                        style: {
                            content: "data(unit_s)",
                            "text-opacity": 1,
                            "min-zoomed-font-size": 13,
                            "text-valign": "bottom",
                            "text-halign": "center",
                            "font-size": "13px",
                            "text-margin-y": "5px",
                            "background-color": "#fff",
                            "border-width": 1,
                            "border-color": "#5a59a0",
                            width: 25,
                            height: 25
                        }
                    },
                    {
                        selector: "node.hover",
                        style: {
                            content: "data(id)",
                            "text-opacity": 1,
                            "font-weight": "bold",
                            "font-size": "14px",
                            "text-background-color": "#fff",
                            "text-background-opacity": 1,
                            "text-background-shape": "rectangle",
                            "text-border-opacity": 1,
                            "text-border-width": 4,
                            "text-border-color": "#fff",
                            "z-index": 9999
                        }
                    },
                    {
                        selector: "edge",
                        style: {
                            width: 1,
                            "target-arrow-shape": "triangle",
                            "line-color": "#5a59a0",
                            "target-arrow-color": "#5a59a0",
                            "curve-style": "bezier"
                        }
                    },
                    {
                        selector: ".best_parent_unit",
                        style: {
                            width: 3,
                            "target-arrow-shape": "triangle",
                            "line-color": "#5a59a0",
                            "target-arrow-color": "#5a59a0",
                            "curve-style": "bezier"
                        }
                    },
                    {
                        selector: ".is_on_main_chain",
                        style: {
                            "background-color": "#9c9bef"
                        }
                    },
                    {
                        selector: ".is_minor",
                        style: {
                            "border-width": 2,
                            "border-color": "#D7D7D7"
                        }
                    },
                    {
                        selector: ".is_stable",
                        style: {
                            "border-width": 4,
                            "border-style": "solid",
                            "border-color": "#5a59a0"
                        }
                    },
                    // 12个见证人
                    {
                        selector:
                            ".czr_321JDA7Brgbnm64iY2Xh8yHMEqEgBDutnoTKVLcxW2DJvJLUsS",
                        style: {
                            "border-color": "#ff0000"
                        }
                    },
                    {
                        selector:
                            ".czr_32RmC9FsxjgLkgRQ58j3CdLg79cQE3KaY2wAT1QthBTU25vpd3",
                        style: {
                            "border-color": "#00ff78"
                        }
                    },
                    {
                        selector:
                            ".czr_3MnXfV9hbmxVPdgfrPqgUiH6N7VbkSEhn5VqBCzBcxzTzkEUxU",
                        style: {
                            "border-color": "#00626b"
                        }
                    },
                    {
                        selector:
                            ".czr_3SrfL6LnPbtyf6sanrgtKs1BTYDN8taacGBVG37LfZVqXvRHbf",
                        style: {
                            "border-color": "#ff0089"
                        }
                    },

                    {
                        selector:
                            ".czr_3igvJpdDiV4v5HxEzCifFcUpKvWsk3qWYNrTrbEVQztKbpyW1z",
                        style: {
                            "border-color": "#a6ff0a"
                        }
                    },
                    {
                        selector:
                            ".czr_3tiy2jgoUENkszPjrHjQGfmopqwV5m9BcEh2Grb1zDYgSGnBF7",
                        style: {
                            "border-color": "#130162"
                        }
                    },
                    {
                        selector:
                            ".czr_47E2jJ9rXVk5GRBcTLQMLQHXqsrnVcV5Kv2CWQJ6dnUaugnvii",
                        style: {
                            "border-color": "#e9aee0"
                        }
                    },
                    {
                        selector:
                            ".czr_49BvoaSgGnyfPdaHfrSdac74fcxV4cUdysskHSQPQ8XisShN3P",
                        style: {
                            "border-color": "#ab420c"
                        }
                    },

                    {
                        selector:
                            ".czr_4HhYojuHanxQ57thkSxwy5necRtDFwiQP7zqngBDZHMjqdPiMS",
                        style: {
                            "border-color": "#631083"
                        }
                    },
                    {
                        selector:
                            ".czr_4MYTD6Xctkb6fEL8xUZxUwY6eqYB7ReEfB61YFrMHaZxsqLCKd",
                        style: {
                            "border-color": "#00b6eb"
                        }
                    },
                    {
                        selector:
                            ".czr_4URkteqck9rM8Vo6VzWmvKtMWoSH8vo4A1rADNAFrQHxAR23Tb",
                        style: {
                            "border-color": "#959595"
                        }
                    },
                    {
                        selector:
                            ".czr_4ZJ8hBdR6dLv4hb1RPCmajdZf7ozkH1sHU18kT7xnXj4mjxxKE",
                        style: {
                            "border-color": "#fff300"
                        }
                    },
                    {
                        selector:
                            ".czr_4aBXjWXyN7WVGqMKH7FgnSoN9oePeEPiZsrtc2AMYyuTRJoNpb",
                        style: {
                            "border-color": "#286901"
                        }
                    },
                    {
                        selector:
                            ".czr_4iig3fTcXQmz7bT2ztJPrpH8usrqGTN5zmygFqsCJQ4HgiuNvP",
                        style: {
                            "border-color": "#136a77"
                        }
                    },

                    {
                        selector: ".active",
                        style: {
                            "border-color": "#020086",
                            "border-width": "4"
                        }
                    },
                    {
                        selector: ".finalBad",
                        style: {
                            "background-color": "red"
                        }
                    },
                    {
                        selector: ".tempBad",
                        style: {
                            "background-color": "red"
                        }
                    }
                ],
                elements: {
                    nodes: [],
                    edges: []
                }
            });
            // console.log('createCy 2')

            //鼠标移入移除
            _cy.on("mouseover", "node", function() {
                this.addClass("hover");
            });
            _cy.on("mouseout", "node", function() {
                this.removeClass("hover");
            });

            //鼠标点击
            _cy.on("click", "node", function(evt) {
                window.location.href = "/#/dag/" + evt.cyTarget.id();
            });

            _cy.on("tap", "node", function(evt) {
                window.location.href = "/#/dag/" + evt.cyTarget.id();
            });

            //拖动事件
            _cy.on("pan", function(e) {
                var ext = _cy.extent();
                if (nextPositionUpdates < ext.y2) {
                    self.getNext();
                } else if (
                    notLastUnitUp === true &&
                    ext.y2 - ext.h <
                        _cy.getElementById(nodes[0].data.unit).position().y
                ) {
                    self.loadingSwitch = true;
                    self.getPrev();
                }
                $scroll.scrollTop(self.convertPosPanToPosScroll());
            });

            //鼠标滚轮滚动
            $(_cy.container()).on("wheel mousewheel", function(e) {
                var deltaY =
                    e.originalEvent.wheelDeltaY || -e.originalEvent.deltaY;
                if (page == "dag") {
                    e.preventDefault();
                    if (deltaY > 0) {
                        self.scrollUp();
                    } else if (deltaY < 0) {
                        _cy.panBy({ x: 0, y: -25 });
                    }
                    $scroll.scrollTop(self.convertPosPanToPosScroll());
                }
            });
        },
        generate: function(_nodes, _edges) {
            var newOffset_x,
                newOffset_y,
                left = Infinity,
                right = -Infinity,
                first = false,
                generateAdd = [],
                _node,
                classes = "",
                pos_iomc;
            var graph = self.createGraph(_nodes, _edges);
            graph.nodes().forEach(function(unit) {
                _node = graph.node(unit);
                if (_node) {
                    if (_node.x < left) {
                        left = _node.x;
                    }
                    if (_node.x > right) {
                        right = _node.x;
                    }
                }
            });
            graph.nodes().forEach(function(unit) {
                _node = graph.node(unit);
                if (_node) {
                    classes = "";
                    if (_node.is_on_main_chain) {
                        classes += "is_on_main_chain ";
                    }
                    if (_node.is_minor) {
                        classes += "is_minor ";
                    }
                    // if (isWt) {
                    classes += _node.witness_from + " ";
                    // }
                    if (_node.is_stable) {
                        classes += "is_stable ";
                    }
                    if (_node.sequence === "final-bad") {
                        classes += "finalBad";
                    }
                    if (_node.sequence === "temp-bad") {
                        classes += "tempBad";
                    }
                    if (!first) {
                        newOffset_x = -_node.x - (right - left) / 2;
                        newOffset_y = generateOffset - _node.y + 66;
                        first = true;
                    }
                    if (phantoms[unit] !== undefined) {
                        _cy.remove(_cy.getElementById(unit));
                        generateAdd.push({
                            group: "nodes",
                            data: { id: unit, unit_s: _node.label },
                            position: {
                                x: phantoms[unit],
                                y: _node.y + newOffset_y
                            },
                            classes: classes
                        });
                        delete phantoms[unit];
                    } else {
                        pos_iomc = self.setMaxWidthNodes(_node.x + newOffset_x);
                        if (pos_iomc == 0 && _node.is_on_main_chain == 0) {
                            pos_iomc += 40;
                        }
                        generateAdd.push({
                            group: "nodes",
                            data: { id: unit, unit_s: _node.label },
                            position: { x: pos_iomc, y: _node.y + newOffset_y },
                            classes: classes
                        });
                    }
                }
            });
            generateAdd = self.fixConflicts(generateAdd);
            _cy.add(generateAdd);
            generateOffset = _cy.nodes()[_cy.nodes().length - 1].position().y;
            nextPositionUpdates = generateOffset;
            _cy.add(self.createEdges());
            self.updListNotStableUnit();
            self.updateScrollHeigth();
        },

        //高亮节点 【OK】
        highlightNode: function(unit) {
            self.loadingInfoSwitch = true;
            // console.log("unit",unit)
            //没有cytoscape 则创建
            if (!_cy) {
                createCy();
            }

            //如果有老的高亮节点，取消
            if (activeNode) {
                _cy.getElementById(activeNode).removeClass("active");
            }

            var el = _cy.getElementById(unit); //获取将要高亮的DOM

            //   console.log("highlightNode   _cy",el.length ,phantoms[unit] === undefined ,phantomsTop[unit] === undefined);
            if (
                el.length &&
                phantoms[unit] === undefined &&
                phantomsTop[unit] === undefined
            ) {
                var extent = _cy.extent(); //
                var elPositionY = el.position().y;
                lastActiveUnit = location.hash.substr(6, 64); //hash置为 last ActiveUnit
                el.addClass("active");
                activeNode = el.id();

                // 获取高亮节点的详细信息
                self.getAjaxUnitInfo(activeNode);

                if (elPositionY < extent.y1 || elPositionY > extent.y2) {
                    bWaitingForPrev = true;
                    _cy.stop();
                    _cy.animate(
                        {
                            pan: { x: _cy.pan("x"), y: _cy.getCenterPan(el).y },
                            complete: function() {
                                bWaitingForPrev = false;
                            }
                        },
                        {
                            duration: 250
                        }
                    );
                }
                page = "dag";
            } else {
                waitGo = unit;
                self.getHighlightNode(waitGo);
                // console.log("再去高亮，因为当前没有这个节点啊")
            }
            return false;
        },
        getAjaxUnitInfo(activeNode) {
            self.$axios
                .get("/api/get_transaction", {
                    params: {
                        transaction: activeNode
                    }
                })
                .then(function(response) {
                    if (bWaitingForHighlightNode) {
                        bWaitingForHighlightNode = false;
                    }
                    //开始写数据
                    self.loadingInfoSwitch = false;
                    self.activeUnitInfo = response.data.transaction;
                    $defaultInfo.hide();
                    $listInfo.show();
                })
                .catch(function(error) {
                    self.loadingSwitch = false;
                });
        },
        //从服务器获取高亮节点【OK】
        getHighlightNode: function(unit) {
            if (!bWaitingForHighlightNode) {
                // 高亮当前元素
                self.getStar(unit);
                // console.log("高亮当前元素");
                bWaitingForHighlightNode = true;
            }
        },

        //设置最新的Unit
        setNew: function(_nodes, _edges, newUnits) {
            var newOffset_x,
                newOffset_y,
                min = Infinity,
                max = -Infinity,
                left = Infinity,
                right = -Infinity,
                first = false,
                x,
                y,
                generateAdd = [],
                _node,
                classes = "",
                pos_iomc;
            var graph = self.createGraph(_nodes, _edges);
            graph.nodes().forEach(function(unit) {
                _node = graph.node(unit);
                if (_node) {
                    y = _node.y;
                    if (y < min) min = y;
                    if (y > max) max = y;
                    if (_node.x < left) left = _node.x;
                    if (_node.x > right) right = _node.x;
                }
            });
            graph.nodes().forEach(function(unit) {
                _node = graph.node(unit);
                if (_node) {
                    classes = "";
                    if (_node.is_on_main_chain) classes += "is_on_main_chain ";
                    if (_node.is_minor) classes += "is_minor ";
                    // if (isWt) {
                    classes += _node.witness_from + " ";
                    // }
                    if (_node.is_stable) classes += "is_stable ";
                    if (_node.sequence === "final-bad") classes += "finalBad";
                    if (_node.sequence === "temp-bad") classes += "tempBad";
                    if (!first) {
                        newOffset_x = -_node.x - (right - left) / 2;
                        newOffset_y = newOffset - (max - min) + 66;
                        newOffset -= max - min + 66;
                        first = true;
                        if (newUnits && _cy.extent().y1 < oldOffset) {
                            self.animationPanUp(max + 54);
                        }
                    }
                    if (phantomsTop[unit] !== undefined) {
                        _cy.remove(_cy.getElementById(unit));
                        generateAdd.push({
                            group: "nodes",
                            data: { id: unit, unit_s: _node.label },
                            position: {
                                x: phantomsTop[unit],
                                y: _node.y + newOffset_y
                            },
                            classes: classes
                        });
                        delete phantomsTop[unit];
                    } else {
                        pos_iomc = self.setMaxWidthNodes(_node.x + newOffset_x);
                        if (pos_iomc == 0 && _node.is_on_main_chain == 0) {
                            pos_iomc += 40;
                        }
                        generateAdd.push({
                            group: "nodes",
                            data: { id: unit, unit_s: _node.label },
                            position: { x: pos_iomc, y: _node.y + newOffset_y },
                            classes: classes
                        });
                    }
                }
            });
            generateAdd = self.fixConflicts(generateAdd);
            _cy.add(generateAdd);
            _cy.add(self.createEdges());
            self.updListNotStableUnit();
            self.updateScrollHeigth();
        },
        animationPanUp: function(distance) {
            if (animationPlaysPanUp) {
                queueAnimationPanUp.push(distance);
            } else {
                if (queueAnimationPanUp.length > 1) {
                    distance = queueAnimationPanUp.reduce(function(
                        prev,
                        current
                    ) {
                        return prev + current;
                    });
                    queueAnimationPanUp = [];
                }
                _cy.stop();
                animationPlaysPanUp = true;
                _cy.animate(
                    {
                        pan: {
                            x: _cy.pan("x"),
                            y: _cy.pan("y") + distance
                        }
                    },
                    {
                        duration: 250,
                        complete: function() {
                            oldOffset =
                                _cy
                                    .getElementById(nodes[0].data.unit)
                                    .position().y + 66;
                            animationPlaysPanUp = false;
                            if (queueAnimationPanUp.length) {
                                self.animationPanUp(queueAnimationPanUp[0]);
                                queueAnimationPanUp.splice(0, 1);
                            }
                        }
                    }
                );
            }
        },

        // getNew: function() {
        //     if (notLastUnitUp) {
        //         return;
        //     }
        //     if (!bWaitingForNew) {
        //         bWaitingForNew = true;
        //         self.$axios
        //             .get("/api/get_previous_units", {
        //                 params: firstParameters
        //             })
        //             .then(function(response) {
        //                 response = self.filterParent(response);
        //                 self.loadingSwitch = false;
        //                 var responseData = response.data.units;

        //                 if (responseData.nodes.length) {
        //                     nodes = [].concat(responseData.nodes, nodes);
        //                     for (var k in responseData.edges) {
        //                         if (responseData.edges.hasOwnProperty(k)) {
        //                             edges[k] = responseData.edges[k];
        //                         }
        //                     }
        //                     // firstPkid = nodes[0].pkid;
        //                     var firstItem = nodes[0];
        //                     firstParameters = {
        //                         direction: "up",
        //                         exec_timestamp: firstItem.exec_timestamp,
        //                         level: firstItem.level,
        //                         pkid: firstItem.pkid
        //                     };

        //                     self.setNew(
        //                         responseData.nodes,
        //                         responseData.edges,
        //                         true
        //                     );
        //                     if (bHaveDelayedNewRequests) {
        //                         bHaveDelayedNewRequests = false;
        //                         self.getNew();
        //                     }
        //                     if (responseData.nodes.length >= 100) {
        //                         notLastUnitUp = true;
        //                     }
        //                 }
        //                 bWaitingForNew = false;
        //                 //把不稳定的设置为稳定的
        //                 // setChangesStableUnits(response.data.arrStableUnits);
        //             });
        //     } else {
        //         bHaveDelayedNewRequests = true;
        //     }
        // },
        getNext: function() {
            if (!bWaitingForNext && isInit) {
                self.loadingSwitch = true;
                bWaitingForNext = true;
                self.$axios
                    .get("/api/get_previous_units", {
                        params: lastParameters
                    })
                    .then(function(response) {
                        response = self.filterParent(response, "down");
                        self.loadingSwitch = false;
                        var responseData = response.data.units;

                        if (notLastUnitDown) {
                            if (bWaitingForHighlightNode)
                                bWaitingForHighlightNode = false;
                            nodes = nodes.concat(responseData.nodes);
                            for (var k in responseData.edges) {
                                if (responseData.edges.hasOwnProperty(k)) {
                                    edges[k] = responseData.edges[k];
                                }
                            }
                            // lastPkid = nodes[nodes.length - 1].pkid;
                            var lastItem = nodes[nodes.length - 1];
                            lastParameters = {
                                direction: "down",
                                stable_index: lastItem.stable_index
                            };

                            self.generate(
                                responseData.nodes,
                                responseData.edges
                            );
                            bWaitingForNext = false;
                            if (waitGo) {
                                self.highlightNode(waitGo);
                                waitGo = false;
                            }
                            if (responseData.nodes.length === 0) {
                                notLastUnitDown = false;
                            }
                            //把不稳定的设置为稳定的
                            // setChangesStableUnits(response.data.arrStableUnits);
                        }
                    });
            }
        },
        getPrev: function() {
            if (!bWaitingForPrev && isInit) {
                // 获取上一个
                bWaitingForPrev = true;

                self.$axios
                    .get("/api/get_previous_units", {
                        params: firstParameters
                    })
                    .then(function(response) {
                        response = self.filterParent(response, "up");
                        self.loadingSwitch = false;
                        var responseData = response.data.units;

                        if (bWaitingForHighlightNode) {
                            bWaitingForHighlightNode = false;
                        }

                        if (responseData.nodes.length) {
                            responseData.nodes = responseData.nodes.reverse();
                            nodes = [].concat(responseData.nodes, nodes);
                            for (var k in responseData.edges) {
                                if (responseData.edges.hasOwnProperty(k)) {
                                    edges[k] = responseData.edges[k];
                                }
                            }
                            // firstPkid = nodes[0].pkid;
                            var firstItem = nodes[0];
                            firstParameters = {
                                direction: "up",
                                stable_index: firstItem.stable_index
                            };

                            self.setNew(responseData.nodes, responseData.edges);
                        }
                        bWaitingForPrev = false;
                        //如果没了
                        if (responseData.nodes.length < 100) {
                            notLastUnitUp = false;
                        }
                        if (waitGo) {
                            self.highlightNode(waitGo);
                            waitGo = false;
                        }
                        //把不稳定的设置为稳定的
                        // setChangesStableUnits(response.data.arrStableUnits);
                    });
            }
        },
        /* 
        units": {
            "nodes":[
                {
                    "data": {
                        "unit": "FEA84D27D4755C776EEC2071ED29B6B4C3185B4B92B720D9E4D574A99E08D2E3",
                        "unit_s": "FEA84D2..."
                    },
                    "is_free": true,
                    "exec_timestamp": "1541692859",
                    "level": "141216",
                    "pkid": 238688,
                    "is_on_main_chain": 1,
                    "is_stable": 0,
                    "is_minor": "is-minor",
                    "witness_from": "czr_3XcnHaweAPubE4a5V3J2oFEZZCytYaJ6sKgLaAa6ddXBFu86R8",
                    "sequence": "good"
                },
            ],
            "edges":{
                "FEA84D27D4755C776EEC2071ED29B6B4C3185B4B92B720D9E4D574A99E08D2E3_7AAA3BD5AC5E3E616933DE0DC1898E318D26C85459C103A3778712B272F62601": {
                    "data": {
                    "source": "FEA84D27D4755C776EEC2071ED29B6B4C3185B4B92B720D9E4D574A99E08D2E3",
                    "target": "7AAA3BD5AC5E3E616933DE0DC1898E318D26C85459C103A3778712B272F62601"
                    },
                    "best_parent_unit": true
                },
            },
        }
        */
        filterParent: function(response, direction) {
            /* 
            1.选出接口中存在的unit，存在storageUnitAry;
            2.把缓存storageParents中的parent遍历，如果有接口unit相关的，拿出来存在target里
            3.把不存在uint中的target过滤；
                存在的：存target里；
                不存在，存在缓存里；
            */
            //1-
            var units = response.data.units;
            var tempUnitAry = [];
            units.nodes.forEach(item => {
                storageUnitAry.push(item.data.unit);
                tempUnitAry.push(item.data.unit);
            });
            //筛选
            var propsVar = direction == "up" ? "source" : "target";
            var currentUnitCont =
                direction == "up" ? tempUnitAry : storageUnitAry;

            let targetParent = {},
                _edges = units.edges;
            //2-
            for (var itemProp in storageParents) {
                if (
                    currentUnitCont.indexOf(
                        storageParents[itemProp].data[propsVar]
                    ) > -1
                ) {
                    //存在的
                    targetParent[itemProp] = storageParents[itemProp];
                    delete storageParents[prop];
                }
            }

            //3-
            for (var prop in _edges) {
                if (storageUnitAry.indexOf(_edges[prop].data.target) > -1) {
                    //存在的
                    targetParent[prop] = _edges[prop];
                } else {
                    storageParents[prop] = _edges[prop];
                    delete _edges[prop];
                }
            }
            units.edges = targetParent;
            return response;
        },

        //把不稳定变为稳定
        scrollUp: function() {
            var ext = _cy.extent();
            if (
                (notLastUnitUp === false &&
                    ext.y2 - ext.h / 2 >
                        _cy.getElementById(nodes[0].data.unit).position().y +
                            20) ||
                (notLastUnitUp === true &&
                    ext.y2 - ext.h >
                        _cy.getElementById(nodes[0].data.unit).position().y)
            ) {
                _cy.panBy({ x: 0, y: 25 });
            } else if (notLastUnitUp === true) {
                self.loadingSwitch = true;
                self.getPrev();
            }
        },

        setMaxWidthNodes: function(x) {
            if (x > 500) {
                return x / (x / 500);
            } else if (x < -500) {
                return -(x / (x / 500));
            } else {
                return x;
            }
        },

        //返回顶部  【OK】
        goToTop: function() {
            if (notLastUnitUp) {
                self.getStar();
                //   console.log("返回顶部")
            } else {
                var el = _cy.getElementById(nodes[0].data.unit);
                _cy.stop();
                _cy.animate(
                    {
                        pan: { x: _cy.pan("x"), y: _cy.getCenterPan(el).y }
                    },
                    {
                        duration: 400
                    }
                );
            }
            location.hash = "#/dag";
            if (activeNode) {
                _cy.getElementById(activeNode).removeClass("active");
            }
            if (!$info.hasClass("hideInfoBlock")) {
                $info.addClass("hideInfoBlock");
            }
            if ($cy.hasClass("showInfoBlock")) {
                $cy.removeClass("showInfoBlock");
                $scroll.removeClass("showInfoBlock");
            }

            $defaultInfo.show();
            $listInfo.hide();
        },

        //更新不稳定 列表
        setChangesStableUnits: function(arrStableUnits) {
            if (!arrStableUnits) return;
            var node;
            arrStableUnits.forEach(function(objUnit) {
                node = _cy.getElementById(objUnit.unit);
                if (node) {
                    if (!node.hasClass("is_stable")) {
                        node.addClass("is_stable");
                    }
                    if (
                        objUnit.is_on_main_chain === 1 &&
                        !node.hasClass("is_on_main_chain")
                    ) {
                        node.addClass("is_on_main_chain");
                    } else if (
                        objUnit.is_on_main_chain === 0 &&
                        node.hasClass("is_on_main_chain")
                    ) {
                        node.removeClass("is_on_main_chain");
                    }
                }
                notStable.splice(notStable.indexOf(objUnit.unit), 1);
            });
            self.updListNotStableUnit();
        },
        updListNotStableUnit: function() {
            if (!_cy) return;
            notStable = [];
            _cy.nodes().forEach(function(node) {
                if (!node.hasClass("is_stable")) {
                    notStable.push(node.id());
                }
            });
        },

        //更新Scroll Heigth
        updateScrollHeigth: function() {
            var unitTopPos = _cy.getCenterPan(
                _cy.getElementById(nodes[0].data.unit)
            ).y;
            var unitLowPos = _cy.getCenterPan(
                _cy.getElementById(nodes[nodes.length - 1].data.unit)
            ).y;

            scrollTopPos = self.convertPosPanToPosScroll(unitTopPos, 0);
            scrollLowPos =
                self.convertPosPanToPosScroll(unitLowPos) +
                $scroll.height() +
                116;
            $scrollBody.height(
                self.convertPosPanToPosScroll(unitLowPos - unitTopPos, 0) +
                    $scroll.height() / 2
            );

            setTimeout(function() {
                $scroll.scrollTop(self.convertPosPanToPosScroll());
            }, 1);
        },

        //PosPan => PosScroll
        convertPosPanToPosScroll: function(posY, topPos) {
            if (!posY) {
                posY = _cy.pan("y");
            }
            if (topPos === undefined) {
                topPos = scrollTopPos;
            }
            return $scroll.height() / 2 - topPos - posY;
        },
        //PosScroll => PosPan
        convertPosScrollToPosPan: function(posTop) {
            if (!posTop) {
                posTop = $scroll.scrollTop();
            }
            return $scroll.height() / 2 - scrollTopPos - posTop;
        },

        //创建圆形
        createGraph: function(_nodes, _edges) {
            //参考：https://github.com/dagrejs/dagre/wiki
            //创建一个新的有向图
            var graph = new dagre.graphlib.Graph({
                multigraph: true,
                compound: true
            });
            //设置图标签的对象
            graph.setGraph({});
            //设置默认边缘标签
            graph.setDefaultEdgeLabel(function() {
                return {};
            });
            /* 
            将节点添加到图表中。
            第一个参数是节点ID。
            第二个是关于节点的元数据。
            在这种情况下，我们将为每个节点添加标签。
            */
            _nodes.forEach(function(node) {
                graph.setNode(node.data.unit, {
                    label: node.data.unit_s,
                    width: 32,
                    height: 32,
                    is_on_main_chain: node.is_on_main_chain,
                    is_minor: node.is_minor,
                    witness_from: node.witness_from,
                    is_stable: node.is_stable,
                    sequence: node.sequence
                });
            });
            for (var k in _edges) {
                if (_edges.hasOwnProperty(k)) {
                    graph.setEdge(_edges[k].data.source, _edges[k].data.target);
                }
            }
            dagre.layout(graph);
            return graph;
        },

        //修复冲突
        fixConflicts: function(arr) {
            var conflicts = {},
                a,
                b,
                l,
                l2;
            for (a = 0, l = arr.length; a < l; a++) {
                for (b = 0; b < l; b++) {
                    if (
                        a != b &&
                        (arr[a].position.x < arr[b].position.x + 10 &&
                            arr[a].position.x > arr[b].position.x - 10 &&
                            arr[a].position.y == arr[b].position.y)
                    ) {
                        if (!conflicts[arr[a].position.y]) {
                            conflicts[arr[a].position.y] = [];
                        }
                        conflicts[arr[a].position.y].push(arr[a]);
                    }
                }
            }
            for (var k in conflicts) {
                var offset = 0,
                    units = [];
                for (b = 0, l2 = conflicts[k].length; b < l2; b++) {
                    for (a = 0; a < l; a++) {
                        if (
                            arr[a].data.id == conflicts[k][b].data.id &&
                            units.indexOf(arr[a].data.id) == -1
                        ) {
                            units.push(arr[a].data.id);
                            if (arr[a].position.x < 0) {
                                offset -= 60;
                            } else {
                                offset += 60;
                            }
                            arr[a].position.x += offset;
                        }
                    }
                }
            }
            return arr;
        },

        //创建边缘
        createEdges: function() {
            var _edges = self.cloneObj(edges),
                cyEdges = _cy.edges(),
                cyEdgesLength = cyEdges.length,
                k,
                out = [],
                position,
                offset = 0,
                offsetTop = 0,
                classes = "";

            for (var a = 0, l = cyEdgesLength; a < l; a++) {
                k = cyEdges[a].source() + "_" + cyEdges[a].target();
                if (_edges[k]) {
                    delete _edges[k];
                }
            }

            for (k in phantoms) {
                _cy.getElementById(k).position("y", generateOffset + 166);
            }
            for (k in phantomsTop) {
                _cy.getElementById(k).position("y", newOffset - 166);
            }
            for (k in _edges) {
                if (_edges.hasOwnProperty(k)) {
                    classes = "";
                    classes += _edges[k].best_parent_unit
                        ? "best_parent_unit"
                        : "";
                    if (_cy.getElementById(_edges[k].data.target).length) {
                        out.push({
                            group: "edges",
                            data: _edges[k].data,
                            classes: classes
                        });
                    } else {
                        position = _cy
                            .getElementById(_edges[k].data.source)
                            .position();
                        phantoms[_edges[k].data.target] = position.x + offset;
                        out.push({
                            group: "nodes",
                            data: {
                                id: _edges[k].data.target,
                                unit_s:
                                    _edges[k].data.target.substr(0, 7) + "..."
                            },
                            position: {
                                x: position.x + offset,
                                y: generateOffset + 166
                            }
                        });
                        offset += 60;
                        out.push({
                            group: "edges",
                            data: _edges[k].data,
                            classes: classes
                        });
                    }
                    if (!_cy.getElementById(_edges[k].data.source).length) {
                        position = _cy
                            .getElementById(_edges[k].data.target)
                            .position();
                        phantomsTop[_edges[k].data.source] =
                            position.x + offsetTop;
                        out.push({
                            group: "nodes",
                            data: {
                                id: _edges[k].data.source,
                                unit_s:
                                    _edges[k].data.source.substr(0, 7) + "..."
                            },
                            position: {
                                x: position.x + offsetTop,
                                y: newOffset - 166
                            }
                        });
                        offsetTop += 60;
                        out.push({
                            group: "edges",
                            data: _edges[k].data,
                            classes: classes
                        });
                    }
                }
            }
            return out;
        },
        //克隆对象、自身属性的 【OK】
        cloneObj: function(obj) {
            var out = {};
            for (var k in obj) {
                if (obj.hasOwnProperty(k)) {
                    out[k] = obj[k];
                }
            }
            return out;
        },

        //搜索地址/unit 【OK】
        searchForm: function() {
            var text = $inputSearch.val();
            text = text.replace(/\s+/g, "");
            if (text.length == 64) {
                location.hash = "#/dag/" + text;
            } else if (text.length === 0) {
                return;
            } else {
                this.$message.error("请输入正确格式的Block");
            }
            $inputSearch.val("");
        },
        toggleParents: function(showLink) {
            if (showLink == "parent") {
                self.showParentsLink = !self.showParentsLink;
            } else if (showLink == "witness") {
                self.showWitnessLink = !self.showWitnessLink;
            }
        },

        //format
        // formatUnit(nodes){
        //     let tempAry=[].concat(nodes);
        //     tempAry.sort(function(a,b){
        //         return a.pkid-b.pkid;
        //     })
        //     console.log(tempAry);

        // },

        //
        goBlockHash(hash) {
            self.loadingInfoSwitch = true;
            location.hash = "#/dag/" + hash;
        }
    }
};
</script>

<style scoped>
body {
    font-family: "Open Sans", sans-serif;
    font-size: 14px;
    margin: 0;
    padding: 0;
}

#menu {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    z-index: 1000;
    height: 45px;
    background-color: #28388c;
    border-bottom: 1px solid #ccc;
}
.input-wrap {
    min-width: 580px;
    margin: 0 auto;
}
#menuInput {
    float: left;
    margin-left: 15px;
    margin-top: -1px;
}

#menu input[type="text"] {
    width: 630px;
    height: 30px;
    border: 1px solid #ccc;
    outline: none;
    padding: 0 35px 0 5px;
}

#submitSearch {
    border: 1px solid #6463a5;
    border-radius: 4px;
    padding: 0 10px;
    background-size: 20px;
    cursor: pointer;
    outline: none;
    position: relative;
    left: -62px;
    top: -2px;
    vertical-align: middle;
}

#menuLeft {
    padding: 7px;
}

#menuLeft .input-search {
    border-radius: 3px;
}

#menuLeftImg {
    float: left;
    margin-left: 5px;
}

#menuLeftImg > img {
    height: 32px;
}

#menuSocial {
    float: right;
    padding: 5px;
}

#menuSocial img {
    width: 32px;
}

#menuSocialSlack {
    margin-right: 10px;
}
#menuSocial .dag-link {
    display: inline-block;
    padding: 3px 15px;
    color: #e0e0e0;
}
#menuSocial .router-link-exact-active {
    border-bottom: 2px solid #e0e0e0;
}

#cy {
    position: absolute;
    left: 0;
    right: 650px;
    top: 45px;
    bottom: 0;
    z-index: 999;
}

#info {
    position: absolute;
    right: 0;
    top: 45px;
    bottom: 0;
    width: 650px;
    border-left: 1px solid #ccc;
    overflow: auto;
}
#unitParent {
    padding-left: 5px;
}

#unit {
    color: #808080;
}

#addressClose {
    text-align: right;
    font-size: 18px;
    margin: 10px;
    display: none;
}

#addressClose {
    display: block;
    margin: 10px auto;
}

#defaultInfo {
    text-align: center;
    margin-top: 20px;
    font-size: 18px;
}

#listInfo {
    display: none;
    padding-left: 3px;
}

.infoTitle {
    font-weight: bold;
    padding: 5px 0px;
    cursor: pointer;
    color: #1d1d1d;
    border-bottom: 1px dashed #d6d6d6;
}

.infoTitle.hideTitle {
    color: #868686;
}

.infoTitle > .infoTitleImg {
    display: inline-block;
    /* background-image: url(../img/arrow_down.png); */
    background-size: cover;
    width: 12px;
    height: 12px;
    margin-bottom: -2px;
}
.info-item-dev {
    padding: 7px 5px;
    word-wrap: break-word;
}
.info-item-dev a {
    font-size: 14px;
}
.info-item-dev .level-wrap {
    display: inline-block;
    color: #1d1d1d;
    margin-right: 20px;
}
.info-item-dev strong {
    font-size: 15px;
}
.info-item-dev .info-item-val {
    color: #808080;
    font-size: 14px;
}
.dashed-line {
    border-bottom: 1px dashed #d6d6d6;
}

.infoTitle.hideTitle > .infoTitleImg {
    /* background-image: url(../img/gray_right.png); */
}

.infoTitle.hideTitle:hover {
    color: #333333;
}

.infoTitleChild {
    font-weight: bold;
    padding: 5px;
    margin-bottom: 7px;
    cursor: pointer;
    background-color: #f1f1f1;
    color: #333333;
}

.childNotSpoiler {
    font-weight: bold;
    padding: 5px;
    margin-bottom: 7px;
    background-color: #f3f3f3;
    color: #333333;
}

.messagesInfo {
    padding-left: 5px;
    margin-bottom: 10px;
}

.infoTitleInputs,
.infoTitleInput {
    font-weight: bold;
    margin-bottom: 7px;
    cursor: pointer;
    color: #333333;
}

.inputsInfo,
.inputInfo,
.inputsInf {
    margin-bottom: 10px;
}

.messagesInfo > div {
    margin-bottom: 5px;
}

.inputsInfo > div,
.inputInfo > div {
    margin-bottom: 5px;
}

a {
    color: #2980b9;
    text-decoration: none;
}

#info #authors > div,
#info #children > div,
#info #parents > div,
#info #witnesses > div {
    display: block;
    padding: 5px;
}
#listInfo {
    padding-left: 10px;
}
pre {
    margin: 0;
}

.outputs_div {
    margin-bottom: 5px;
}

.outputs_div > div {
    margin-bottom: 10px;
}

.message a {
    display: inline !important;
    padding: 0 !important;
}

.asset {
    margin-left: 10px;
}

#witnessesTitle {
    font-weight: bold;
    padding: 5px;
}

#witnessesTitle > a {
    display: inline;
    font-weight: 300;
    color: #2980b9 !important;
}

.row {
    max-width: 1200px;
    margin: auto;
    padding: 0 0.5rem;
}

.row::before,
.row::after,
.rowFull::before,
.rowFull::after {
    content: " ";
    display: table;
}

.row::after,
.rowFull::after {
    clear: both;
}

#infoAndBalanceAddress {
    margin-top: 20px;
}

#addressInfo {
    position: absolute;
    top: 46px;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
    background-color: #fff;
    font-size: 16px;
    display: none;
}

.transactionUnit {
    background-color: #f1f1f1;
    padding: 7px 0;
    margin: 15px 0 5px;
}

.transactionUnitListAddress {
    margin: 0 5px 5px 0;
}

.thisAddress {
    color: #808080;
}

#listUnspent > div {
    margin: 10px 0;
}

#blockListUnspent {
    display: none;
    margin-top: 50px;
}

#listUnits > tr > td:first-child {
    width: 45%;
}

#listUnits > tr > td:nth-child(2) {
    width: 5%;
    text-align: center;
}

#scroll {
    position: absolute;
    right: 651px;
    top: 45px;
    bottom: 0;
    width: 50px;
    overflow: auto;
    z-index: 999;
}

#scrollBody {
    width: 1px;
}

#goToTop {
    width: 48px;
    height: 48px;
    position: absolute;
    z-index: 999;
    cursor: pointer;
    background-size: 28px;
    top: 68px;
    right: 690px;
    border: 1px solid #5a59a0;
    border-radius: 100%;
}

#goToTop:hover {
    background-size: 28px;
    background-color: #dadafd;
}

#goToTop > #titleGoToTop {
    display: block;
}

#titleGoToTop {
    position: absolute;
    top: 0px;
    font-size: 28px;
    color: #5a59a0;
    text-align: center;
    width: 68px;
    left: -10px;
    display: none;
}

.numberFormat {
    /*cursor: pointer;*/
}

#tableListTransactions {
    width: 100%;
    border-collapse: collapse;
}

@media (max-width: 1499px) {
    #cy {
        right: 450px;
    }
    #info {
        width: 450px;
    }
    #scroll {
        right: 451px;
    }
    #goToTop {
        right: 490px;
    }
}
@media (min-width: 1500px) {
    #cy {
        right: 650px;
    }
    #info {
        width: 650px;
    }
}

/* #menuInput  */
@media all and (max-width: 1000px) {
    #menuInput {
        display: none;
    }
}

/* adaptive */
@media all and (max-width: 1200px) {
    #cy,
    #scroll {
        right: 0;
    }

    #goToTop {
        right: 39px;
    }

    #cy.showInfoBlock,
    #scroll.showInfoBlock,
    #goToTop.showInfoBlock {
        display: none;
    }

    #info {
        width: 100%;
        left: 0;
        border: 0;
    }

    #info.hideInfoBlock {
        display: none;
    }

    #listUnits td {
        display: block;
        width: 100%;
    }

    #listUnits > tr > td:nth-child(2) {
        padding: 5px 7px 8px;
    }
}

@media all and (max-width: 580px) {
    #menu {
        height: 85px;
    }

    #cy,
    #scroll,
    #info {
        top: 85px;
    }

    #goToTop {
        top: 109px;
        right: 22px;
    }

    #addressInfo {
        top: 86px;
    }

    #menuInput,
    #menuInput > form {
        width: 98%;
    }

    #menuInput input[type="text"] {
        width: 81%;
    }
}

.switch {
    cursor: pointer;
    padding: 10px 10px 10px 0;
    -webkit-user-select: none;
    position: relative;
}
.switch:after {
    position: absolute;
    content: "";
    top: 14px;
    right: -30px;
    border-top: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 6px solid #868686;
}
.switch-show:after {
    top: 16px;
    border-top: 6px solid #363636;
    border-right: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 6px solid transparent;
}
</style>
