import Vue from 'vue'
import App from './App'
import router from './router'
import axios from 'axios'
import VueI18n from 'vue-i18n'
import languges from './i18n/languges_conf'

import './theme/element/base.css';
import './theme/element/button-group.css';
import './theme/element/button.css';
import './theme/element/col.css';
import './theme/element/form.css';
import './theme/element/icon.css';
import './theme/element/input.css';
import './theme/element/loading.css';
import './theme/element/message.css';
import './theme/element/radio.css';
import './theme/element/reset.css';
import './theme/element/row.css';
import './theme/element/tab-pane.css';
import './theme/element/table-column.css';
import './theme/element/table.css';
import './theme/element/tabs.css';

import {
  Pagination,
  Table,
  TableColumn,
  Row,
  Col,
  Radio,
  Form,
  Input,
  Button,
  ButtonGroup,
  Tabs,
  TabPane,

  Loading,
  Message
} from 'element-ui';

Vue.use(VueI18n);
Vue.use(Pagination);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Row);
Vue.use(Col);
Vue.use(Radio);
Vue.use(Form);
Vue.use(Input);
Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Tabs);
Vue.use(TabPane);
Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;

Vue.config.productionTip = false

// global filter 
import * as filters from '@/assets/js/filter.js'
Object.keys(filters).forEach(k => {
  Vue.filter(k, filters[k])
});

// i18
var language = window.navigator.language.toLowerCase() || 'en'
//判断用户的语言，跳转到不同的地方
if (language.indexOf("zh-") !== -1) {
  language = 'zh-CN'
} else if (language.indexOf('en') !== -1) {
  language = 'en'
} else {
  //其它的都使用英文
  language = 'en'
}

//把用户的语言写入缓存，供下次获取使用
localStorage.setItem('locale', language)

// Loading i18 language
const messages = {};
for (const languge in languges) {
  messages[languge] = require("./i18n/" + languge + ".json");
}
const i18n = new VueI18n({
  locale: language,// set locale
  messages,       // set locale messages 
});


Vue.prototype.$axios = axios
// Vue.prototype.$router = router

// 封装的AXIOS，用于 await
import { api } from '@/tools/api/api.js'
Vue.prototype.$api = api

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  i18n,
  render: h => h(App)
})
