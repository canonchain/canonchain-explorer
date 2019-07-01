import Vue from 'vue'
import App from './App'
import router from './router'
import axios from 'axios'

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

Vue.prototype.$axios = axios
// Vue.prototype.$router = router

// 封装的AXIOS，用于 await
import { api } from '@/tools/api/api.js'
Vue.prototype.$api = api

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
