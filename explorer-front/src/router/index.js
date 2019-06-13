import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/components/home'
import Dag from '@/components/dag'

// Block
import Block from '@/components/block'
import BlockEventLog from '@/components/Block/event_log'
import BlockIntelTrans from '@/components/Block/intel_trans'

//internal
import Internals from '@/components/internals'

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
//Tokens
import Tokens from '@/components/tokens'
import Token from '@/components/Token/token'
import TokenHolder from '@/components/Token/holder'

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
    // Block
    {
      path: '/block/:id',
      name: 'Block',
      component: Block
    },
    {
      path: '/block/:id',
      name: 'Block',
      component: Block
    },
    {
      path: '/block/:id/intel_trans',
      name: 'BlockIntelTrans',
      component: BlockIntelTrans
    },
    {
      path: '/block/:id/event_log',
      name: 'BlockEventLog',
      component: BlockEventLog
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
    //Tokens
    {
      path: '/tokens',
      name: 'Tokens',
      component: Tokens
    },
    {
      path: '/token/:id',
      name: 'Token',
      component: Token
    },
    {
      path: '/token/:id/holder',
      name: 'Token',
      component: TokenHolder
    },

    //Internals
    {
      path: '/internals',
      name: 'Internals',
      component: Internals
    },
    // 404
    {
      path: '*',
      component: NotFound
    }
  ]
})
