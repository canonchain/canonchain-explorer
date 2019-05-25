import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/components/home'
import Block from '@/components/block'
import Dag from '@/components/dag'
import Account from '@/components/account'
import Accounts from '@/components/accounts'
import Normal_Trans from '@/components/normal_trans'
import WitnessTrans from '@/components/witness_trans'
import NotFound from '@/components/NotFound/NotFound'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/accounts',
      name: 'Accounts',
      component: Accounts
    },
    {
      path: '/normal_trans',
      name: 'Normal_Trans',
      component: Normal_Trans
    },
    {
      path: '/witness_trans',
      name: 'WitnessTrans',
      component: WitnessTrans
    },
    {
      path: '/dag',
      name: 'Dag',
      component: Dag
    },
    {
      path: '/dag/:id',
      name: 'Dag',
      component: Dag
    },
    {
      path: '/dag/:id/*',
      name: 'Dag',
      component: Dag
    },
    {
      path: '/block/:id',
      name: 'Block',
      component: Block
    },
    {
      path: '/account/:id',
      name: 'Account',
      component: Account
    },
    { 
      path: '*', 
      component: NotFound
    }
  ]
})
