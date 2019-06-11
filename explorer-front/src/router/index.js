import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/components/home'
import Block from '@/components/block'
import Dag from '@/components/dag'

// account
import Account from '@/components/account'
import AccountTransaction from '@/components/Account/transaction'
import AccountTransToken from '@/components/Account/trans_token'
import AccountTransInternal from '@/components/Account/trans_internal'
import AccountEventLogs from '@/components/Account/event_logs'
import contractCode from '@/components/Account/contract_code'

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
    // account相关
    {
      path: '/account/:id',
      name: 'AccountTransaction',
      component: AccountTransaction
    },
    {
      path: '/account/:id/trans_token',
      name: 'AccountTransToken',
      component: AccountTransToken
    },
    {
      path: '/account/:id/trans_internal',
      name: 'AccountTransInternal',
      component: AccountTransInternal
    },
    {
      path: '/account/:id/event_logs',
      name: 'AccountEventLogs',
      component: AccountEventLogs
    },
    {
      path: '/account/:id/contract_code',
      name: 'contractCode',
      component: contractCode
    },
    // 404
    {
      path: '*',
      component: NotFound
    }
  ]
})
