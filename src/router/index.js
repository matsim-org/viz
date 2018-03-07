import Vue from 'vue'
import Router from 'vue-router'

import AppFrame from '@/components/AppFrame'

Vue.use(Router)

export default new Router({
  mode: 'history', // 'history' mode produces clean, normal URLs
  routes: [
    {
      path: '/',
      name: 'AppFrame',
      component: AppFrame,
    },
  ]
})
