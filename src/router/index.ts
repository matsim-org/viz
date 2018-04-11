import Vue from 'vue'
import Router, { Route } from 'vue-router'

import KiberaAccessibility from '@/components/KiberaAccessibility.vue'
import NetworkViz from '@/components/NetworkViz.vue'
import StartPage from '@/components/StartPage.vue'
import NetworkFlows from '@/components/NetworkFlows.vue'
import Projects from '@/components/Projects.vue'
import Authentication from '@/auth/Authentication.vue'
import sharedStore from '../SharedStore'

Vue.use(Router)

let instance = new Router({
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
      meta: { authRequired: true },
    },
    {
      path: '/authentication',
      name: 'Authentication',
      component: Authentication,
    },
  ],
})

instance.beforeEach((to: Route, from: Route, next: Function) => {
  sharedStore.setLastNavigatedRoute(to.fullPath)
  if (to.matched.some(record => record.meta && record.meta.authRequired)) {
    //login is required
    //const authenticated = sharedStore.state.authentication.isAuthenticated
    if (false) {
      //we are not logged in: redirect to authentication component
      //next('/authentication')
    }
  }
  next()
})

export default instance
