import Vue from 'vue'
import App from './App'
import router from './router'
import axios from 'axios'

import ElementUI from 'element-ui';
// import 'element-ui/lib/theme-chalk/index.css';
import './theme/element/index.css';

// import VueParticles from 'vue-particles'
// Vue.use(VueParticles)

Vue.use(ElementUI);
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
