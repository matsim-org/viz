import Authentication from '@/auth/Authentication.vue'
import StartPage from '@/components/StartPage.vue'
import CreateProject from '@/project/CreateProject.vue'
import Project from '@/project/Project.vue'
import Projects from '@/project/Projects.vue'
import FrameAnimation from '@/visualization/frame-animation/FrameAnimation.vue'
import KiberaAccessibility from '@/visualization/KiberaAccessibility.vue'
import NetworkFlows from '@/visualization/NetworkFlows.vue'
import NetworkViz from '@/visualization/NetworkViz.vue'
import Vue from 'vue'
import Router, { Route } from 'vue-router'
import sharedStore from '../SharedStore'
import authenticationStore, { AuthenticationStatus } from '../auth/Authentication'

Vue.use(Router)
const AUTHENTICATION = '/authentication'

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
      path: '/projects',
      name: 'Your Projects',
      component: Projects,
      meta: { authRequired: true },
    },
    {
      path: '/project/:projectId',
      component: Project,
      name: 'Project',
      meta: { authRequired: true },
    },
    {
      path: '/frame-animation/:vizId',
      component: FrameAnimation,
      name: 'FrameAnimation',
      meta: { authRequired: true },
    },
    {
      path: AUTHENTICATION,
      name: 'Authentication',
      component: Authentication,
    },
  ],
})

instance.beforeEach((to: Route, from: Route, next: Function) => {
  if (!isAuthenticationComponent(to)) {
    sharedStore.setLastNavigation(to.fullPath)
  }

  if (isAuthRequired(to)) {
    if (authenticationStore.state.status !== AuthenticationStatus.Authenticated) {
      next(AUTHENTICATION)
      return
    }
  }
  next()
})

function isAuthenticationComponent(to: Route): boolean {
  return to.matched.some(record => record.path === AUTHENTICATION)
}

function isAuthRequired(to: Route): boolean {
  return to.matched.some(record => record.meta && record.meta.authRequired)
}

export default instance
