import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/pages/home'
import Dag from '@/pages/dag'

// Block
import Block from '@/pages/block'
import BlockEventLog from '@/pages/Block/event_log'
import BlockIntelTrans from '@/pages/Block/intel_trans'
import BlockAdvancedInfo from '@/pages/Block/advanced_info'

//internal
import Internals from '@/pages/internals'

// account
import AccountTransaction from '@/pages/Account/transaction'
import AccountTokenBalances from '@/pages/Account/token_balances'
import AccountTransToken from '@/pages/Account/trans_token'
import AccountTransInternal from '@/pages/Account/trans_internal'
import AccountEventLogs from '@/pages/Account/event_logs'
import contractCode from '@/pages/Account/contract_code'

import Accounts from '@/pages/accounts'
import Normal_Trans from '@/pages/normal_trans'
import WitnessTrans from '@/pages/witness_trans'
import NotFound from '@/pages/NotFound/NotFound.vue'
//Tokens
import Tokens from '@/pages/tokens'
import Token from '@/pages/Token/token'
import TokenHolder from '@/pages/Token/holder'

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
      path: '/block/:id/advanced_info',
      name: 'BlockAdvancedInfo',
      component: BlockAdvancedInfo
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
      path: '/account/:id/token_balances',
      name: 'AccountTokenBalances',
      component: AccountTokenBalances
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
