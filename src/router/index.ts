import Vue from 'vue'
import Router from 'vue-router'

import KiberaAccessibility from '@/components/KiberaAccessibility.vue'
import NetworkViz from '@/components/NetworkViz.vue'
import StartPage from '@/components/StartPage.vue'
import NetworkFlows from '@/components/NetworkFlows.vue'
import Projects from '@/components/Projects.vue'

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
    },
  ],
})
