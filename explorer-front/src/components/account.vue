<template>
    <div class="page-block">
        <czr-header></czr-header>
        <div class="block-info-wrap">
            <div class="container">
                <search></search>
                <div class="sub-header">
                    <template v-if="accountInfo.acc_type === 2">
                        <strong class="sub_header-tit">合约账户</strong>
                    </template>
                    <template v-else>
                        <strong class="sub_header-tit">账户</strong>
                    </template>
                    <span class="sub_header-des">{{accountInfo.address}}</span>
                </div>
                <div class="bui-dlist">
                    <el-row>
                        <el-col :span="12">
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    余额
                                    <span class="space-des"></span>
                                </strong>
                                <template v-if="IS_GET_ACC">
                                    <div
                                        class="bui-dlist-det"
                                    >{{accountInfo.balance | toCZRVal}} CZR</div>
                                </template>
                            </div>
                        </el-col>
                        <el-col :span="12">
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    交易数
                                    <span class="space-des"></span>
                                </strong>
                                <template v-if="IS_GET_ACC">
                                    <div class="bui-dlist-det">{{TOTAL_VAL}} 次</div>
                                </template>
                            </div>
                        </el-col>
                    </el-row>
                    <el-row>
                        <el-col :span="12">
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    合约创建
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">
                                    <a href="javascript:;">0x00c5e0417</a>
                                    <br>创建于
                                    <br>
                                    <a href="javascript:;">0x436fc7d21</a>
                                </div>
                            </div>
                        </el-col>
                        <el-col :span="12">
                            <div class="block-item-des">
                                <strong class="bui-dlist-tit">
                                    对应Token
                                    <span class="space-des"></span>
                                </strong>
                                <div class="bui-dlist-det">
                                    <a href="javascript:;">CZR</a>
                                </div>
                            </div>
                        </el-col>
                    </el-row>
                </div>
                <div class="account-main">
                    <template>
                        <el-tabs v-model="activeName" @tab-click="change_table">
                            <el-tab-pane label="交易记录" name="transaction">
                                <div class="account-content">
                                    <el-row>
                                        <el-col :span="6">
                                            <h2 class="transfer-tit">交易记录</h2>
                                        </el-col>
                                        <el-col :span="18" style="text-align: right;">
                                            <template>
                                                <el-radio
                                                    v-model="url_parm.source"
                                                    label="1"
                                                    @change="handlerChange"
                                                >发送记录</el-radio>
                                                <el-radio
                                                    v-model="url_parm.source"
                                                    label="2"
                                                    @change="handlerChange"
                                                >接收记录</el-radio>
                                                <template v-if="IS_WITNESS">
                                                    <el-radio
                                                        v-model="url_parm.source"
                                                        label="3"
                                                        @change="handlerChange"
                                                    >见证交易</el-radio>
                                                </template>
                                            </template>
                                        </el-col>
                                    </el-row>
                                    <div class="accounts-list-wrap" v-loading="loadingSwitch">
                                        <template v-if="IS_GET_INFO">
                                            <template v-if="url_parm.source==='3'">
                                                <el-table :data="database" style="width: 100%">
                                                    <el-table-column label="时间" width="280">
                                                        <template slot-scope="scope">
                                                            <span
                                                                class="table-long-item"
                                                            >{{scope.row.exec_timestamp | toDate}}</span>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column label="交易号" width="280">
                                                        <template slot-scope="scope">
                                                            <el-button
                                                                @click="goBlockPath(scope.row.hash)"
                                                                type="text"
                                                            >
                                                                <span
                                                                    class="table-long-item"
                                                                >{{scope.row.hash}}</span>
                                                            </el-button>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column label="账户" width="280">
                                                        <template slot-scope="scope">
                                                            <span
                                                                class="table-long-item"
                                                            >{{scope.row.from}}</span>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column
                                                        label="状态"
                                                        min-width="80"
                                                        align="center"
                                                    >
                                                        <template slot-scope="scope">
                                                            <template
                                                                v-if="scope.row.is_stable === false"
                                                            >
                                                                <span class="txt-warning">等待确认</span>
                                                            </template>
                                                            <template v-else>
                                                                <template
                                                                    v-if="scope.row.status == '0'"
                                                                >
                                                                    <span class="txt-success">成功</span>
                                                                </template>
                                                                <template
                                                                    v-else-if="scope.row.status == '1'"
                                                                >
                                                                    <span class="txt-danger">失败(1)</span>
                                                                </template>
                                                                <template
                                                                    v-else-if="scope.row.status == '2'"
                                                                >
                                                                    <span class="txt-danger">失败(2)</span>
                                                                </template>
                                                                <template
                                                                    v-else-if="scope.row.status == '3'"
                                                                >
                                                                    <span class="txt-danger">失败(3)</span>
                                                                </template>
                                                                <template v-else>
                                                                    <span class="txt-info">-</span>
                                                                </template>
                                                            </template>
                                                        </template>
                                                    </el-table-column>
                                                </el-table>
                                                <!--  -->
                                            </template>
                                            <template v-else>
                                                <el-table :data="database" style="width: 100%">
                                                    <el-table-column label="时间" width="180">
                                                        <template slot-scope="scope">
                                                            <span
                                                                class="table-long-item"
                                                            >{{scope.row.mc_timestamp | toDate}}</span>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column label="交易号" width="180">
                                                        <template slot-scope="scope">
                                                            <el-button
                                                                @click="goBlockPath(scope.row.hash)"
                                                                type="text"
                                                            >
                                                                <span
                                                                    class="table-long-item"
                                                                >{{scope.row.hash}}</span>
                                                            </el-button>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column label="发款方" width="180">
                                                        <template slot-scope="scope">
                                                            <template
                                                                v-if="scope.row.is_from_this_account == false"
                                                            >
                                                                <el-button
                                                                    @click="goAccountPath(scope.row.from)"
                                                                    type="text"
                                                                >
                                                                    <span
                                                                        class="table-long-item"
                                                                    >{{scope.row.from}}</span>
                                                                </el-button>
                                                            </template>
                                                            <template v-else>
                                                                <template
                                                                    v-if="Number(scope.row.level) <= 0"
                                                                >
                                                                    <span
                                                                        class="table-long-item"
                                                                    >GENESIS</span>
                                                                </template>
                                                                <template v-else>
                                                                    <span
                                                                        class="table-long-item"
                                                                    >{{scope.row.from}}</span>
                                                                </template>
                                                            </template>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column>
                                                        <template slot-scope="scope">
                                                            <span>
                                                                <el-button
                                                                    v-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == false)"
                                                                    type="warning"
                                                                    size="mini"
                                                                >转出</el-button>

                                                                <el-button
                                                                    v-else-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == true)&&(scope.row.mci > 0)"
                                                                    size="mini"
                                                                >
                                                                    <i
                                                                        class="el-icon-sort trans-to-self"
                                                                    ></i>
                                                                </el-button>

                                                                <el-button
                                                                    v-else-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == true)&&(scope.row.mci <= 0)"
                                                                    type="success"
                                                                    size="mini"
                                                                >转入</el-button>

                                                                <el-button
                                                                    v-else
                                                                    type="success"
                                                                    size="mini"
                                                                >转入</el-button>
                                                            </span>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column label="收款方" width="180">
                                                        <template slot-scope="scope">
                                                            <template v-if="scope.row.to">
                                                                <template
                                                                    v-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == false)"
                                                                >
                                                                    <el-button
                                                                        @click="goAccountPath(scope.row.to)"
                                                                        type="text"
                                                                    >
                                                                        <span
                                                                            class="table-long-item"
                                                                        >{{scope.row.to}}</span>
                                                                    </el-button>
                                                                </template>
                                                                <template v-else>
                                                                    <span
                                                                        class="table-long-item"
                                                                    >{{scope.row.to}}</span>
                                                                </template>
                                                            </template>
                                                            <template v-else>
                                                                <span>-</span>
                                                            </template>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column
                                                        label="状态"
                                                        min-width="80"
                                                        align="center"
                                                    >
                                                        <template slot-scope="scope">
                                                            <template
                                                                v-if="scope.row.is_stable === false"
                                                            >
                                                                <span class="txt-warning">等待确认</span>
                                                            </template>
                                                            <template v-else>
                                                                <template
                                                                    v-if="scope.row.status == '0'"
                                                                >
                                                                    <span class="txt-success">成功</span>
                                                                </template>
                                                                <template
                                                                    v-else-if="scope.row.status == '1'"
                                                                >
                                                                    <span class="txt-danger">失败(1)</span>
                                                                </template>
                                                                <template
                                                                    v-else-if="scope.row.status == '2'"
                                                                >
                                                                    <span class="txt-danger">失败(2)</span>
                                                                </template>
                                                                <template
                                                                    v-else-if="scope.row.status == '3'"
                                                                >
                                                                    <span class="txt-danger">失败(3)</span>
                                                                </template>
                                                                <template v-else>
                                                                    <span class="txt-info">-</span>
                                                                </template>
                                                            </template>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column
                                                        label="金额 / CZR"
                                                        width="230"
                                                        align="right"
                                                    >
                                                        <template slot-scope="scope">
                                                            <span>{{scope.row.amount | toCZRVal}}</span>
                                                        </template>
                                                    </el-table-column>
                                                </el-table>
                                            </template>

                                            <!-- page -->
                                            <template v-if="database.length">
                                                <div class="pagin-block">
                                                    <el-button-group>
                                                        <el-button
                                                            size="mini"
                                                            :disabled="btnSwitch.header"
                                                            @click="getPaginationFlag('header')"
                                                        >首页</el-button>
                                                        <el-button
                                                            size="mini"
                                                            icon="el-icon-arrow-left"
                                                            :disabled="btnSwitch.left"
                                                            @click="getPaginationFlag('left')"
                                                        >上一页</el-button>
                                                        <el-button
                                                            size="mini"
                                                            :disabled="btnSwitch.right"
                                                            @click="getPaginationFlag('right')"
                                                        >
                                                            下一页
                                                            <i
                                                                class="el-icon-arrow-right el-icon--right"
                                                            ></i>
                                                        </el-button>
                                                        <el-button
                                                            size="mini"
                                                            :disabled="btnSwitch.footer"
                                                            @click="getPaginationFlag('footer')"
                                                        >尾页</el-button>
                                                    </el-button-group>
                                                    <!-- <el-pagination
                                    small
                                    background
                                    layout="total,prev, pager, next"
                                    @current-change="handleCurrentChange"
                                    :current-page.sync="currentPage"
                                    :page-size="LIMIT_VAL"
                                    :total="TOTAL_VAL"
                                    :pager-count="5"
                                                    ></el-pagination>-->
                                                </div>
                                            </template>
                                        </template>
                                    </div>
                                </div>
                            </el-tab-pane>
                            <el-tab-pane label="Token转账" name="trans_token">
                                <div class="account-content">
                                    <el-row>
                                        <el-col :span="6">
                                            <h2 class="transfer-tit">Token转账</h2>
                                        </el-col>
                                        <el-col :span="18" style="text-align: right;">
                                            <template>
                                                <el-radio
                                                    v-model="url_parm.source"
                                                    label="1"
                                                    @change="handlerChange"
                                                >发送</el-radio>
                                                <el-radio
                                                    v-model="url_parm.source"
                                                    label="2"
                                                    @change="handlerChange"
                                                >接收</el-radio>
                                            </template>
                                        </el-col>
                                    </el-row>
                                    <div class="accounts-list-wrap" v-loading="loadingSwitch">
                                        <template v-if="IS_GET_INFO">
                                            <el-table :data="trans_token" style="width: 100%">
                                                <el-table-column label="时间" width="180">
                                                    <template slot-scope="scope">
                                                        <span
                                                            class="table-long-item"
                                                        >{{scope.row.mc_timestamp | toDate}}</span>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="交易号" width="180">
                                                    <template slot-scope="scope">
                                                        <el-button
                                                            @click="goBlockPath(scope.row.hash)"
                                                            type="text"
                                                        >
                                                            <span
                                                                class="table-long-item"
                                                            >{{scope.row.hash}}</span>
                                                        </el-button>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="发款方" width="180">
                                                    <template slot-scope="scope">
                                                        <template
                                                            v-if="scope.row.is_from_this_account == false"
                                                        >
                                                            <el-button
                                                                @click="goAccountPath(scope.row.from)"
                                                                type="text"
                                                            >
                                                                <span
                                                                    class="table-long-item"
                                                                >{{scope.row.from}}</span>
                                                            </el-button>
                                                        </template>
                                                        <template v-else>
                                                            <span
                                                                class="table-long-item"
                                                            >{{scope.row.from}}</span>
                                                        </template>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column>
                                                    <template slot-scope="scope">
                                                        <span>
                                                            <el-button
                                                                v-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == false)"
                                                                type="warning"
                                                                size="mini"
                                                            >转出</el-button>

                                                            <el-button
                                                                v-else-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == true)&&(scope.row.mci > 0)"
                                                                size="mini"
                                                            >
                                                                <i
                                                                    class="el-icon-sort trans-to-self"
                                                                ></i>
                                                            </el-button>

                                                            <el-button
                                                                v-else-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == true)&&(scope.row.mci <= 0)"
                                                                type="success"
                                                                size="mini"
                                                            >转入</el-button>

                                                            <el-button
                                                                v-else
                                                                type="success"
                                                                size="mini"
                                                            >转入</el-button>
                                                        </span>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="收款方" width="180">
                                                    <template slot-scope="scope">
                                                        <template v-if="scope.row.to">
                                                            <template
                                                                v-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == false)"
                                                            >
                                                                <el-button
                                                                    @click="goAccountPath(scope.row.to)"
                                                                    type="text"
                                                                >
                                                                    <span
                                                                        class="table-long-item"
                                                                    >{{scope.row.to}}</span>
                                                                </el-button>
                                                            </template>
                                                            <template v-else>
                                                                <span
                                                                    class="table-long-item"
                                                                >{{scope.row.to}}</span>
                                                            </template>
                                                        </template>
                                                        <template v-else>
                                                            <span>-</span>
                                                        </template>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column
                                                    label="代币"
                                                    width="230"
                                                    align="right"
                                                >
                                                    <template slot-scope="scope">
                                                        <span>{{scope.row.amount | toCZRVal}} {{scope.row.token_symbol}}</span>
                                                    </template>
                                                </el-table-column>
                                            </el-table>

                                            <!-- page -->
                                            <template v-if="database.length">
                                                <div class="pagin-block">
                                                    <el-button-group>
                                                        <el-button
                                                            size="mini"
                                                            :disabled="btnSwitch.header"
                                                            @click="getPaginationFlag('header')"
                                                        >首页</el-button>
                                                        <el-button
                                                            size="mini"
                                                            icon="el-icon-arrow-left"
                                                            :disabled="btnSwitch.left"
                                                            @click="getPaginationFlag('left')"
                                                        >上一页</el-button>
                                                        <el-button
                                                            size="mini"
                                                            :disabled="btnSwitch.right"
                                                            @click="getPaginationFlag('right')"
                                                        >
                                                            下一页
                                                            <i
                                                                class="el-icon-arrow-right el-icon--right"
                                                            ></i>
                                                        </el-button>
                                                        <el-button
                                                            size="mini"
                                                            :disabled="btnSwitch.footer"
                                                            @click="getPaginationFlag('footer')"
                                                        >尾页</el-button>
                                                    </el-button-group>
                                                </div>
                                            </template>
                                        </template>
                                    </div>
                                </div>
                            </el-tab-pane>
                            <el-tab-pane label="合约内交易" name="trans_internal">
                                <div class="account-content">
                                    <el-row>
                                        <el-col :span="6">
                                            <h2 class="transfer-tit">合约内交易</h2>
                                        </el-col>
                                    </el-row>
                                    <div class="accounts-list-wrap" v-loading="loadingSwitch">
                                        <template v-if="IS_GET_INFO">
                                            <el-table :data="trans_internal" style="width: 100%">
                                                <el-table-column label="时间" width="180">
                                                    <template slot-scope="scope">
                                                        <span
                                                            class="table-long-item"
                                                        >{{scope.row.mc_timestamp | toDate}}</span>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="父区块交易号" width="180">
                                                    <template slot-scope="scope">
                                                        <el-button
                                                            @click="goBlockPath(scope.row.hash)"
                                                            type="text"
                                                        >
                                                            <span
                                                                class="table-long-item"
                                                            >{{scope.row.hash}}</span>
                                                        </el-button>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="发送方" width="180">
                                                    <template slot-scope="scope">
                                                        <template
                                                            v-if="scope.row.is_from_this_account == false"
                                                        >
                                                            <el-button
                                                                @click="goAccountPath(scope.row.from)"
                                                                type="text"
                                                            >
                                                                <span
                                                                    class="table-long-item"
                                                                >{{scope.row.from}}</span>
                                                            </el-button>
                                                        </template>
                                                        <template v-else>
                                                            <span
                                                                class="table-long-item"
                                                            >{{scope.row.from}}</span>
                                                        </template>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column>
                                                    <el-button type="success" size="mini">→</el-button>
                                                </el-table-column>
                                                <el-table-column label="接收方" width="180">
                                                    <template slot-scope="scope">
                                                        <template v-if="scope.row.to">
                                                            <template
                                                                v-if="(scope.row.is_from_this_account == true)&&(scope.row.is_to_self == false)"
                                                            >
                                                                <el-button
                                                                    @click="goAccountPath(scope.row.to)"
                                                                    type="text"
                                                                >
                                                                    <span
                                                                        class="table-long-item"
                                                                    >{{scope.row.to}}</span>
                                                                </el-button>
                                                            </template>
                                                            <template v-else>
                                                                <span
                                                                    class="table-long-item"
                                                                >{{scope.row.to}}</span>
                                                            </template>
                                                        </template>
                                                        <template v-else>
                                                            <span>-</span>
                                                        </template>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column
                                                    label="数额"
                                                    width="230"
                                                    align="right"
                                                >
                                                    <template slot-scope="scope">
                                                        <span>{{scope.row.amount | toCZRVal}}</span>
                                                    </template>
                                                </el-table-column>
                                            </el-table>

                                            <!-- page -->
                                            <template v-if="database.length">
                                                <div class="pagin-block">
                                                    <el-button-group>
                                                        <el-button
                                                            size="mini"
                                                            :disabled="btnSwitch.header"
                                                            @click="getPaginationFlag('header')"
                                                        >首页</el-button>
                                                        <el-button
                                                            size="mini"
                                                            icon="el-icon-arrow-left"
                                                            :disabled="btnSwitch.left"
                                                            @click="getPaginationFlag('left')"
                                                        >上一页</el-button>
                                                        <el-button
                                                            size="mini"
                                                            :disabled="btnSwitch.right"
                                                            @click="getPaginationFlag('right')"
                                                        >
                                                            下一页
                                                            <i
                                                                class="el-icon-arrow-right el-icon--right"
                                                            ></i>
                                                        </el-button>
                                                        <el-button
                                                            size="mini"
                                                            :disabled="btnSwitch.footer"
                                                            @click="getPaginationFlag('footer')"
                                                        >尾页</el-button>
                                                    </el-button-group>
                                                </div>
                                            </template>
                                        </template>
                                    </div>
                                </div>
                            </el-tab-pane>
                            <el-tab-pane label="事件日志" name="event_logs">
                                <div class="account-content">
                                    <el-row>
                                        <el-col :span="6">
                                            <h2 class="transfer-tit">事件日志（最新10条）</h2>
                                        </el-col>
                                    </el-row>
                                    <div class="accounts-list-wrap" v-loading="loadingSwitch">
                                        <template v-if="IS_GET_INFO">
                                            <el-table :data="event_logs" style="width: 100%">
                                                <el-table-column label="时间" width="180">
                                                    <template slot-scope="scope">
                                                        <span
                                                            class="table-long-item"
                                                        >{{scope.row.mc_timestamp | toDate}}</span>
                                                    </template>
                                                </el-table-column>
                                                <!-- <el-table-column label="交易号" width="180">
                                                    <template slot-scope="scope"></template>
                                                </el-table-column>-->
                                                <el-table-column label="交易号/模式" width="200">
                                                    <template slot-scope="scope">
                                                        <el-button
                                                            @click="goBlockPath(scope.row.hash)"
                                                            type="text"
                                                        >
                                                            <span
                                                                class="table-long-item"
                                                            >{{scope.row.hash}}</span>
                                                        </el-button>
                                                        <br>
                                                        <strong>{{scope.row.method}}</strong>
                                                        <p>{{scope.row.method_function}}</p>
                                                    </template>
                                                </el-table-column>
                                                <el-table-column label="事件日志">
                                                    <template slot-scope="scope">
                                                        <template
                                                            v-for="(item,index) in scope.row.topics"
                                                        >
                                                            <p
                                                                v-bind:key="item"
                                                            >[topic{{index}}] {{ item }}</p>
                                                        </template>
                                                        <p>
                                                            <span>Data {{scope.row.data}}</span>
                                                        </p>
                                                    </template>
                                                </el-table-column>
                                            </el-table>
                                        </template>
                                    </div>
                                </div>
                            </el-tab-pane>
                            <el-tab-pane label="合约创建代码" name="contract_code">
                                <div class="account-content" v-loading="loadingSwitch">
                                    <template v-if="IS_GET_INFO">
                                        <el-row>
                                            <el-col :span="24">
                                                <h2 class="transfer-tit">合约创建的代码</h2>
                                            </el-col>
                                        </el-row>
                                        <div class="accounts-list-wrap" v-loading="loadingSwitch">
                                            <pre class="contract-code">{{contract_code}}</pre>
                                        </div>
                                    </template>
                                </div>
                            </el-tab-pane>
                        </el-tabs>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import CzrHeader from "@/components/Header/Header";
import Search from "@/components/Search/Search";

let self = null;
let isDefaultPage = false;

//TODO 交易列表改为 发送 和 接收 两个List ,解决sql搜索慢的问题

export default {
    name: "Block",
    components: {
        CzrHeader,
        Search
    },
    data() {
        return {
            TOTAL_VAL: 0,
            LIMIT_VAL: 20,
            loadingSwitch: true,
            btnSwitch: {
                header: false,
                left: false,
                right: false,
                footer: false
            },
            database: [],
            IS_GET_INFO: false,
            IS_GET_ACC: false,
            IS_WITNESS: false,
            pageFirstItem: {
                exec_timestamp: 0,
                level: 0,
                pkid: 0
            },
            pageLastItem: {
                exec_timestamp: 0,
                level: 0,
                pkid: 0
            },
            first_stable_index: "",
            end_stable_index: "",
            url_parm: {
                account: this.$route.params.id,
                position: "1", //1 首页  2 上一页 3 下一页 4 尾页
                stable_index: 999999999999,
                source: this.$route.query.source || "1" //1 发送方 2 接收方 3见证交易
            },
            accountInfo: {
                address: this.$route.params.id,
                acc_type: 2,
                balance: 0
            },
            currentPage: 1,
            // change
            activeName: "transaction",
            // Token转账
            trans_token: [],
            // 合约内交易
            trans_internal: [],
            // 事件日志
            event_logs: [],
            // 合约代码
            contract_code: ""
        };
    },
    created() {
        self = this;
        let queryInfo = this.$route.query;
        if (Object.keys(queryInfo).length > 1) {
            self.url_parm.position = queryInfo.position;
            self.url_parm.stable_index = queryInfo.stable_index;
            self.url_parm.source = queryInfo.source;
        }
        self.initDatabase();
        self.getFlagTransactions(self.url_parm);
    },
    methods: {
        initTransactionInfo() {},

        async initDatabase() {
            let opt = {
                account: self.accountInfo.address
            };
            let response = await self.$api.get("/api/get_account", opt);

            if (response.success) {
                let accInfo = response.account;
                self.accountInfo.balance =
                    accInfo.balance < 0 ? 0 : accInfo.balance;
                self.TOTAL_VAL = Number(accInfo.transaction_count);
                self.IS_WITNESS = accInfo.is_witness;
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_ACC = true;
        },
        async getPaginationFlag(val) {
            self.loadingSwitch = true;
            // 想取最后一页
            if (val === "footer") {
                self.$router.push(
                    `/account/${self.url_parm.account}?stable_index=0&source=${
                        self.url_parm.source
                    }&position=4`
                );
                return;
            }
            // 想取第一页
            if (val === "header") {
                self.$router.push(
                    `/account/${self.url_parm.account}?source=${
                        self.url_parm.source
                    }`
                );
                return;
            }

            if (val == "left") {
                //取第一个item
                self.$router.push(
                    `/account/${self.url_parm.account}?stable_index=${
                        self.pageFirstItem.stable_index
                    }&source=${self.url_parm.source}&position=2`
                );
                return;
            }

            if (val == "right") {
                //取最后一个item
                self.$router.push(
                    `/account/${self.url_parm.account}?stable_index=${
                        self.pageLastItem.stable_index
                    }&source=${self.url_parm.source}&position=3`
                );
                return;
            }
        },
        handlerChange(val) {
            self.$router.push(
                `/account/${self.url_parm.account}?source=${val}`
            );
        },

        async getFlagTransactions() {
            //获取交易表首位值；用来禁用首页和尾页的
            let opt = {
                source: self.url_parm.source,
                account: self.url_parm.account
            };
            let response = await self.$api.get(
                "/api/get_account_trans_flag",
                opt
            );

            if (response.success) {
                self.first_stable_index = response.near_item.stable_index;
                self.end_stable_index = response.end_item.stable_index;
                self.getTransactions(self.url_parm);
            } else {
                console.log("error");
            }
        },
        async getTransactions(parm) {
            //TODO 没有搜见证交易
            self.loadingSwitch = true;
            let opt = {
                position: parm.position,
                source: parm.source,
                account: parm.account,
                stable_index: parm.stable_index
            };
            let response = await self.$api.get(
                "/api/get_account_transactions",
                opt
            );

            if (response.success) {
                self.database = response.transactions;
                if (response.transactions.length) {
                    self.pageFirstItem = response.transactions[0];
                    self.pageLastItem =
                        response.transactions[response.transactions.length - 1];
                } else {
                    self.IS_GET_INFO = true;
                    self.loadingSwitch = false;
                    return;
                }
            } else {
                self.database = [];
            }
            //禁止首页上一页
            if (parm.position === "1") {
                self.btnSwitch.header = true;
                self.btnSwitch.left = true;
            } else if (parm.position === "4") {
                self.btnSwitch.right = true;
                self.btnSwitch.footer = true;
            }
            if (self.database.length > 0) {
                if (
                    self.first_stable_index === self.pageFirstItem.stable_index
                ) {
                    self.btnSwitch.header = true;
                    self.btnSwitch.left = true;
                }

                if (self.end_stable_index === self.pageLastItem.stable_index) {
                    self.btnSwitch.right = true;
                    self.btnSwitch.footer = true;
                }
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        goBlockPath(block) {
            this.$router.push("/block/" + block);
        },
        goAccountPath(account) {
            this.$router.push("/account/" + account);
        },
        // 合约相关的
        change_table(tab, event) {
            /**
             * 0 交易记录
             * 1 Token转账
             * 2 合约内交易
             * 3 事件日志
             * 4 合约创建代码
             */
            self.IS_GET_INFO = false;
            self.loadingSwitch = true;
            switch (tab.index) {
                case "0":
                    self.getTransaction();
                    break;
                case "1":
                    self.getTransToken();
                    break;
                case "2":
                    self.getTransInternal();
                    break;
                case "3":
                    self.getEventLogs();
                    break;
                case "4":
                    self.getContractCode();
                    break;
            }
            console.log(tab.index, typeof tab.index);
            // this.$router.push(`/account/${self.accountInfo.address}/code`);
        },
        async getTransaction() {
            let opt = {
                account: self.accountInfo.address
            };
            let response = await self.$api.get("/api/get_account", opt);

            if (response.success) {
                self.contract_code =
                    "60606040526003805460ff19166012179055341561001c57600080fd5b604051610dfc380380610dfc833981016040528080519190602001805182019190602001805160008054600160a060020a03191633600160a060020a031617905560035460ff16600a0a850260045591909101905082828260018280516100879291602001906100c4565b50600281805161009b9291602001906100c4565b5050600454600160a060020a0333166000908152600560205260409020555061015f9350505050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061010557805160ff1916838001178555610132565b82800160010185558215610132579182015b82811115610132578251825591602001919060010190610117565b5061013e929150610142565b5090565b61015c91905b8082111561013e5760008155600101610148565b90565b610c8e8061016e6000396000f3006060604052600436106100f05763ffffffff7c010000000000000000000000000000000000000000000000000000000060003504166306fdde0381146100f5578063095ea7b31461017f57806318160ddd146101b557806323b872dd146101da578063313ce56714610202578063371aa1581461022b57806342966c68146102bc57806370a08231146102d257806379cc6790146102f15780638da5cb5b1461031357806395d89b4114610342578063a9059cbb14610355578063b414d4b614610377578063cae9ca5114610396578063dd62ed3e146103fb578063e724529c14610420578063f2fde38b14610444575b600080fd5b341561010057600080fd5b610108610463565b60405160208082528190810183818151815260200191508051906020019080838360005b8381101561014457808201518382015260200161012c565b50505050905090810190601f1680156101715780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561018a57600080fd5b6101a1600160a060020a0360043516602435610501565b604051901515815260200160405180910390f35b34156101c057600080fd5b6101c8610531565b60405190815260200160405180910390f35b34156101e557600080fd5b6101a1600160a060020a0360043581169060243516604435610537565b341561020d57600080fd5b6102156105ae565b60405160ff909116815260200160405180910390f35b341561023657600080fd5b6102ba6004602481358181019083013580602081810201604051908101604052809392919081815260200183836020028082843782019150505050505091908035906020019082018035906020019080806020026020016040519081016040528093929190818152602001838360200280828437509496506105b795505050505050565b005b34156102c757600080fd5b6101a160043561070f565b34156102dd57600080fd5b6101c8600160a060020a036004351661079a565b34156102fc57600080fd5b6101a1600160a060020a03600435166024356107ac565b341561031e57600080fd5b610326610888565b604051600160a060020a03909116815260200160405180910390f35b341561034d57600080fd5b610108610897565b341561036057600080fd5b6102ba600160a060020a0360043516602435610902565b341561038257600080fd5b6101a1600160a060020a0360043516610911565b34156103a157600080fd5b6101a160048035600160a060020a03169060248035919060649060443590810190830135806020601f8201819004810201604051908101604052818152929190602084018383808284375094965061092695505050505050565b341561040657600080fd5b6101c8600160a060020a0360043581169060243516610a58565b341561042b57600080fd5b6102ba600160a060020a03600435166024351515610a75565b341561044f57600080fd5b6102ba600160a060020a0360043516610b01565b60018054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156104f95780601f106104ce576101008083540402835291602001916104f9565b820191906000526020600020905b8154815290600101906020018083116104dc57829003601f168201915b505050505081565b600160a060020a033381166000908152600660209081526040808320938616835292905220819055600192915050565b60045481565b600160a060020a0380841660009081526006602090815260408083203390941683529290529081205482111561056c57600080fd5b600160a060020a03808516600090815260066020908152604080832033909416835292905220805483900390556105a4848484610b4b565b5060019392505050565b60035460ff1681565b600080548190819033600160a060020a039081169116146105d757600080fd5b83518551146105e557600080fd5b600091505b84518210156106e9576005600086848151811061060357fe5b90602001906020020151600160a060020a0316815260208101919091526040016000205415156106de5783828151811061063957fe5b906020019060200201519050806005600087858151811061065657fe5b90602001906020020151600160a060020a0316815260208101919091526040016000208054909101905584828151811061068c57fe5b90602001906020020151600054600160a060020a0391821691167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405190815260200160405180910390a3918201915b6001909101906105ea565b505060008054600160a060020a0316815260056020526040902080549190910390555050565b600160a060020a0333166000908152600560205260408120548290101561073557600080fd5b600160a060020a03331660008181526005602052604090819020805485900390556004805485900390557fcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca59084905190815260200160405180910390a2506001919050565b60056020526000908152604090205481565b600160a060020a038216600090815260056020526040812054829010156107d257600080fd5b600160a060020a038084166000908152600660209081526040808320339094168352929052205482111561080557600080fd5b600160a060020a038084166000818152600560209081526040808320805488900390556006825280832033909516835293905282902080548590039055600480548590039055907fcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca59084905190815260200160405180910390a250600192915050565b600054600160a060020a031681565b60028054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156104f95780601f106104ce576101008083540402835291602001916104f9565b61090d338383610b4b565b5050565b60076020526000908152604090205460ff1681565b6000836109338185610501565b15610a505780600160a060020a0316638f4ffcb1338630876040518563ffffffff167c01000000000000000000000000000000000000000000000000000000000281526004018085600160a060020a0316600160a060020a0316815260200184815260200183600160a060020a0316600160a060020a0316815260200180602001828103825283818151815260200191508051906020019080838360005b838110156109e95780820151838201526020016109d1565b50505050905090810190601f168015610a165780820380516001836020036101000a031916815260200191505b5095505050505050600060405180830381600087803b1515610a3757600080fd5b6102c65a03f11515610a4857600080fd5b505050600191505b509392505050565b600660209081526000928352604080842090915290825290205481565b60005433600160a060020a03908116911614610a9057600080fd5b600160a060020a03821660009081526007602052604090819020805460ff19168315151790557f48335238b4855f35377ed80f164e8c6f3c366e54ac00b96a6402d4a9814a03a5908390839051600160a060020a039092168252151560208201526040908101905180910390a15050565b60005433600160a060020a03908116911614610b1c57600080fd5b6000805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0392909216919091179055565b600160a060020a0382161515610b6057600080fd5b600160a060020a03831660009081526005602052604090205481901015610b8657600080fd5b600160a060020a03821660009081526005602052604090205481810111610bac57600080fd5b600160a060020a03831660009081526007602052604090205460ff1615610bd257600080fd5b600160a060020a03821660009081526007602052604090205460ff1615610bf857600080fd5b600160a060020a038084166000818152600560205260408082208054869003905592851680825290839020805485019055917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9084905190815260200160405180910390a35050505600a165627a7a723058200361db4bcb745b27b3b20937accdbbe976d809756045483bcd87b0ba784403f200290000000000000000000000000000000000000000000000000000000060713d44000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000003435a5200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002d084000000000000000000000000000000000000000000000000000000000000";
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        async getTransToken() {
            let opt = {
                account: self.accountInfo.address
            };
            let response = await self.$api.get("/api/get_account", opt);

            if (response.success) {
                self.trans_token = [
                    {
                        mc_timestamp: "1559654426",
                        hash:
                            "FFB6F0F8997C36E5B91AE069059B2DAB06A6858DC9230380D377B93A7C8BDBF0",
                        from:
                            "czr_3idJGdJRzWEu8qmVfGZsu7Etj7NFZELXyWcCdgNqdPLXTKu1Bp",
                        to:
                            "czr_33drCfJJPwQYekgqy3EJ6YnnMkc2Zii3kxWaovFoUoaKRp97nG",
                        contract_account:
                            "czr_33drCfJJPwQYekgqy3EJ6YnnMkc2Zii3kxWaovFoUoaKRp97nG",
                        is_from_this_account: true,
                        is_to_self: false,
                        token_symbol: "CZR",
                        amount: "77979798123123123"
                    }
                ];
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        async getTransInternal() {
            let opt = {
                account: self.accountInfo.address
            };
            let response = await self.$api.get("/api/get_account", opt);

            if (response.success) {
                self.trans_internal = [
                    {
                        mc_timestamp: "1559654426",
                        hash:
                            "FFB6F0F8997C36E5B91AE069059B2DAB06A6858DC9230380D377B93A7C8BDBF0",
                        from:
                            "czr_3idJGdJRzWEu8qmVfGZsu7Etj7NFZELXyWcCdgNqdPLXTKu1Bp",
                        to:
                            "czr_33drCfJJPwQYekgqy3EJ6YnnMkc2Zii3kxWaovFoUoaKRp97nG",
                        amount: "464",
                        is_from_this_account: true,
                        is_to_self: false
                    },
                    {
                        mc_timestamp: "1559654426",
                        hash:
                            "FFB6F0F8997C36E5B91AE069059B2DAB06A6858DC9230380D377B93A7C8BDBF0",
                        from:
                            "czr_3idJGdJRzWEu8qmVfGZsu7Etj7NFZELXyWcCdgNqdPLXTKu1Bp",
                        to:
                            "czr_33drCfJJPwQYekgqy3EJ6YnnMkc2Zii3kxWaovFoUoaKRp97nG",
                        amount: "464",
                        is_from_this_account: false,
                        is_to_self: false
                    }
                ];
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        async getEventLogs() {
            let opt = {
                account: self.accountInfo.address
            };
            let response = await self.$api.get("/api/get_account", opt);

            if (response.success) {
                self.event_logs = [
                    {
                        hash:
                            "0x20d4c8a702971a1fdd0b749f224c5c5a101d834265d772d4430af01b6793af17",
                        mc_timestamp: "1560157620",
                        contract_account:
                            "0x0223fc70574214F65813fE336D870Ac47E147fAe",
                        data:
                            "0000000000000000000000000000000000000000000001161796b75a82948000",
                        method: "0xa9059cbb",
                        method_function: "transfer(address,uint256)",
                        topics: [
                            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                            "0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2",
                            "0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888"
                        ]
                    },
                    {
                        hash:
                            "0x20d4c8a702971a1fdd0b749f224c5c5a101d834265d772d4430af01b6793af17",
                        mc_timestamp: "1560157620",
                        contract_account:
                            "0x0223fc70574214F65813fE336D870Ac47E147fAe",
                        data:
                            "0000000000000000000000000000000000000000000001161796b75a82948000",
                        method: "0xa9059cbb",
                        method_function: "transfer(address,uint256)",
                        topics: [
                            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                            "0x0000000000000000000000004beff723725187eedf76256bee1d4144a67249a2",
                            "0x00000000000000000000000099fe5d6383289cdd56e54fc0baf7f67c957a8888"
                        ]
                    }
                ];
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        },
        async getContractCode() {
            let opt = {
                account: self.accountInfo.address
            };
            let response = await self.$api.get("/api/get_account", opt);

            if (response.success) {
                self.contract_code =
                    "60606040526003805460ff19166012179055341561001c57600080fd5b604051610dfc380380610dfc833981016040528080519190602001805182019190602001805160008054600160a060020a03191633600160a060020a031617905560035460ff16600a0a850260045591909101905082828260018280516100879291602001906100c4565b50600281805161009b9291602001906100c4565b5050600454600160a060020a0333166000908152600560205260409020555061015f9350505050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061010557805160ff1916838001178555610132565b82800160010185558215610132579182015b82811115610132578251825591602001919060010190610117565b5061013e929150610142565b5090565b61015c91905b8082111561013e5760008155600101610148565b90565b610c8e8061016e6000396000f3006060604052600436106100f05763ffffffff7c010000000000000000000000000000000000000000000000000000000060003504166306fdde0381146100f5578063095ea7b31461017f57806318160ddd146101b557806323b872dd146101da578063313ce56714610202578063371aa1581461022b57806342966c68146102bc57806370a08231146102d257806379cc6790146102f15780638da5cb5b1461031357806395d89b4114610342578063a9059cbb14610355578063b414d4b614610377578063cae9ca5114610396578063dd62ed3e146103fb578063e724529c14610420578063f2fde38b14610444575b600080fd5b341561010057600080fd5b610108610463565b60405160208082528190810183818151815260200191508051906020019080838360005b8381101561014457808201518382015260200161012c565b50505050905090810190601f1680156101715780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b341561018a57600080fd5b6101a1600160a060020a0360043516602435610501565b604051901515815260200160405180910390f35b34156101c057600080fd5b6101c8610531565b60405190815260200160405180910390f35b34156101e557600080fd5b6101a1600160a060020a0360043581169060243516604435610537565b341561020d57600080fd5b6102156105ae565b60405160ff909116815260200160405180910390f35b341561023657600080fd5b6102ba6004602481358181019083013580602081810201604051908101604052809392919081815260200183836020028082843782019150505050505091908035906020019082018035906020019080806020026020016040519081016040528093929190818152602001838360200280828437509496506105b795505050505050565b005b34156102c757600080fd5b6101a160043561070f565b34156102dd57600080fd5b6101c8600160a060020a036004351661079a565b34156102fc57600080fd5b6101a1600160a060020a03600435166024356107ac565b341561031e57600080fd5b610326610888565b604051600160a060020a03909116815260200160405180910390f35b341561034d57600080fd5b610108610897565b341561036057600080fd5b6102ba600160a060020a0360043516602435610902565b341561038257600080fd5b6101a1600160a060020a0360043516610911565b34156103a157600080fd5b6101a160048035600160a060020a03169060248035919060649060443590810190830135806020601f8201819004810201604051908101604052818152929190602084018383808284375094965061092695505050505050565b341561040657600080fd5b6101c8600160a060020a0360043581169060243516610a58565b341561042b57600080fd5b6102ba600160a060020a03600435166024351515610a75565b341561044f57600080fd5b6102ba600160a060020a0360043516610b01565b60018054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156104f95780601f106104ce576101008083540402835291602001916104f9565b820191906000526020600020905b8154815290600101906020018083116104dc57829003601f168201915b505050505081565b600160a060020a033381166000908152600660209081526040808320938616835292905220819055600192915050565b60045481565b600160a060020a0380841660009081526006602090815260408083203390941683529290529081205482111561056c57600080fd5b600160a060020a03808516600090815260066020908152604080832033909416835292905220805483900390556105a4848484610b4b565b5060019392505050565b60035460ff1681565b600080548190819033600160a060020a039081169116146105d757600080fd5b83518551146105e557600080fd5b600091505b84518210156106e9576005600086848151811061060357fe5b90602001906020020151600160a060020a0316815260208101919091526040016000205415156106de5783828151811061063957fe5b906020019060200201519050806005600087858151811061065657fe5b90602001906020020151600160a060020a0316815260208101919091526040016000208054909101905584828151811061068c57fe5b90602001906020020151600054600160a060020a0391821691167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405190815260200160405180910390a3918201915b6001909101906105ea565b505060008054600160a060020a0316815260056020526040902080549190910390555050565b600160a060020a0333166000908152600560205260408120548290101561073557600080fd5b600160a060020a03331660008181526005602052604090819020805485900390556004805485900390557fcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca59084905190815260200160405180910390a2506001919050565b60056020526000908152604090205481565b600160a060020a038216600090815260056020526040812054829010156107d257600080fd5b600160a060020a038084166000908152600660209081526040808320339094168352929052205482111561080557600080fd5b600160a060020a038084166000818152600560209081526040808320805488900390556006825280832033909516835293905282902080548590039055600480548590039055907fcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca59084905190815260200160405180910390a250600192915050565b600054600160a060020a031681565b60028054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156104f95780601f106104ce576101008083540402835291602001916104f9565b61090d338383610b4b565b5050565b60076020526000908152604090205460ff1681565b6000836109338185610501565b15610a505780600160a060020a0316638f4ffcb1338630876040518563ffffffff167c01000000000000000000000000000000000000000000000000000000000281526004018085600160a060020a0316600160a060020a0316815260200184815260200183600160a060020a0316600160a060020a0316815260200180602001828103825283818151815260200191508051906020019080838360005b838110156109e95780820151838201526020016109d1565b50505050905090810190601f168015610a165780820380516001836020036101000a031916815260200191505b5095505050505050600060405180830381600087803b1515610a3757600080fd5b6102c65a03f11515610a4857600080fd5b505050600191505b509392505050565b600660209081526000928352604080842090915290825290205481565b60005433600160a060020a03908116911614610a9057600080fd5b600160a060020a03821660009081526007602052604090819020805460ff19168315151790557f48335238b4855f35377ed80f164e8c6f3c366e54ac00b96a6402d4a9814a03a5908390839051600160a060020a039092168252151560208201526040908101905180910390a15050565b60005433600160a060020a03908116911614610b1c57600080fd5b6000805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0392909216919091179055565b600160a060020a0382161515610b6057600080fd5b600160a060020a03831660009081526005602052604090205481901015610b8657600080fd5b600160a060020a03821660009081526005602052604090205481810111610bac57600080fd5b600160a060020a03831660009081526007602052604090205460ff1615610bd257600080fd5b600160a060020a03821660009081526007602052604090205460ff1615610bf857600080fd5b600160a060020a038084166000818152600560205260408082208054869003905592851680825290839020805485019055917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9084905190815260200160405180910390a35050505600a165627a7a723058200361db4bcb745b27b3b20937accdbbe976d809756045483bcd87b0ba784403f200290000000000000000000000000000000000000000000000000000000060713d44000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000003435a5200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002d084000000000000000000000000000000000000000000000000000000000000";
            } else {
                console.error("/api/get_account Error");
            }
            self.IS_GET_INFO = true;
            self.loadingSwitch = false;
        }
    }
};
</script>

<style   scoped>
.page-block {
    width: 100%;
    position: relative;
}
#header {
    color: #fff;
    background: #5a59a0;
}
.sub-header {
    border-top: 1px solid #bdbdbd;
    border-bottom: 1px solid #bdbdbd;
    color: #585858;
    margin: 28px 0;
    padding: 16px 10px;
}
.sub_header-tit {
    display: inline-block;
    padding-right: 10px;
    margin: 0;
}
.sub_header-des {
    text-align: left;
    margin: 0;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
}
.block-info-wrap {
    position: relative;
    width: 100%;
    margin: 0 auto;
    color: black;
    text-align: left;
    padding-top: 20px;
    padding-bottom: 80px;
}
.block-item-des {
    padding: 10px 0;
    border-bottom: 1px dashed #f6f6f6;
}
@media (max-width: 1199px) {
    .bui-dlist {
        color: #3f3f3f;
        font-size: 16px;
        line-height: 2.4;
    }
    .block-item-des {
        display: block;
    }
    .bui-dlist-tit {
        display: block;
        width: 100%; /* 默认值, 具体根据视觉可改 */
        margin: 0;
        text-align: left;
    }
    .bui-dlist-det {
        display: block;
        color: #5f5f5f;
        text-align: left;
        margin: 0;
        table-layout: fixed;
        word-break: break-all;
        overflow: hidden;
    }
}

@media (min-width: 1200px) {
    .bui-dlist {
        color: #3f3f3f;
        font-size: 16px;
        line-height: 2.4;
        margin-top: 20px;
        border-top: 1px dashed #f6f6f6;
    }
    .block-item-des {
        display: -webkit-box;
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
    }
    .bui-dlist-tit {
        float: left;
        width: 15%; /* 默认值, 具体根据视觉可改 */
        text-align: left;
        margin: 0;
    }
    .bui-dlist-det {
        float: left;
        color: #5f5f5f;
        width: 80%; /* 默认值，具体根据视觉可改 */
        text-align: left;
        margin: 0;
        table-layout: fixed;
        word-break: break-all;
        overflow: hidden;
    }
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

.bui-dlist-tit .space-des {
    display: inline-block;
    width: 10px;
}

/*  记录 */
.account-main {
    padding: 30px 0;
}
.account-content {
    min-height: 300px;
    text-align: left;
    margin-top: 10px;
}
.account-content .transfer-tit {
    font-size: 18px;
    font-weight: 400;
}

/* Transaction Record */
.account-content .no-transfer-log {
    text-align: center;
    color: #9b9b9b;
}
.account-content .no-transfer-log .iconfont {
    font-size: 128px;
}
.account-content .transfer-log {
    padding: 22px 0;
}

.transfer-log .transfer-item {
    background-color: #fff;
    padding: 10px 0;
    cursor: pointer;
    border-bottom: 1px dashed #f0f0f0;
    -webkit-user-select: none;
}
.transfer-log .transfer-item:hover {
    text-decoration: none;
    background-color: #f5f5f5;
}

@media (max-width: 1199px) {
    .transfer-log .transfer-item {
        display: block;
    }
    .transfer-time {
        padding: 10px 0;
    }
}

@media (min-width: 1200px) {
    .transfer-log .transfer-item {
        display: -webkit-box;
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
    }
    .account-content .transfer-log .transfer-info {
        width: 800px;
        padding-left: 10px;
        text-align: left;
    }
    .transfer-log .transfer-assets .assets {
        font-size: 18px;
        height: 42px;
        line-height: 42px;
        width: 300px;
        text-align: right;
    }
}

.transfer-log .icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 50%;
}
.transfer-log .icon-wrap .icon-transfer {
    color: #fff;
    position: relative;
    left: 11px;
    top: 4px;
    font-size: 20px;
}
.transfer-log .plus-assets .icon-wrap {
    background-color: rgba(0, 128, 0, 0.555);
}
.transfer-log .less-assets .icon-wrap {
    background-color: rgba(255, 153, 0, 0.555);
}
.transfer-log .by-address {
    width: 100%;
    color: #9a9c9d;
    table-layout: fixed;
    word-break: break-all;
    overflow: hidden;
    color: rgb(54, 54, 54);
}
.transfer-log .transfer-time {
    color: rgb(161, 161, 161);
}

.plus-assets .assets {
    color: green;
}
.less-assets .assets {
    color: rgb(255, 51, 0);
}
.iconfont {
    font-size: 18px;
    color: #bfbef8;
}
.no-list {
    padding-top: 20px;
}
.pagin-wrap {
    padding: 15px 0;
}
.pagin-block {
    display: block;
    margin: 20px 0;
    text-align: right;
}
.table-long-item {
    max-width: 150px;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.trans-to-self {
    transform: rotate(90deg);
    -ms-transform: rotate(90deg); /* IE 9 */
    -moz-transform: rotate(90deg); /* Firefox */
    -webkit-transform: rotate(90deg); /* Safari 和 Chrome */
    -o-transform: rotate(90deg); /* Opera */
    padding: 0 6px;
}
</style>
