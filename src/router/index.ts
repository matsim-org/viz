import Vue from 'vue'
import Router, { Route } from 'vue-router'

import KiberaAccessibility from '@/components/KiberaAccessibility.vue'
import NetworkViz from '@/components/NetworkViz.vue'
import StartPage from '@/components/StartPage.vue'
import NetworkFlows from '@/components/NetworkFlows.vue'
import Projects from '@/components/Projects.vue'
import AuthCallback from '@/auth/AuthCallback.vue'
import { BigStore } from '../shared-store'

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
      path: '/authcallback',
      name: 'Auth Callback',
      component: AuthCallback,
    },
  ],
})

instance.beforeEach((to: Route, from: Route, next: Function) => {
  if (to.matched.some(record => record.meta && record.meta.authRequired)) {
    //login is required
    const authenticated = BigStore.state.authentication.isAuthenticated()
    if (!authenticated) {
      //we are not logged in: request login
      BigStore.authenticate()
    }
  } else {
    next()
  }
})

export default instance
