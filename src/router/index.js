import Vue from 'vue'
import Router from 'vue-router'

import KiberaAccessibility from '@/components/KiberaAccessibility'
import NetworkViz from '@/components/NetworkViz'
import StartPage from '@/components/StartPage'
import NetworkFlows from '@/components/NetworkFlows'
import Projects from '@/components/Projects'

Vue.use(Router)

export default new Router({
  mode: 'history', // 'history' mode produces clean, normal URLs
  routes: [
    {
      path: '/',
      name: 'StartPage',
      component: StartPage,
    },
    {
      path: '/network',
      name: 'NetworkViz',
      component: NetworkViz,
    },
    {
      path: '/accessibility',
      name: 'KiberaAccessibility',
      component: KiberaAccessibility,
    },
    {
      path: '/flows',
      name: 'NetworkFlows',
      component: NetworkFlows,
    },
    {
      path: '/personal',
      name: 'Your Projects',
      component: Projects,
    }
  ]
})
