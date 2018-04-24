import Authentication from '@/auth/Authentication.vue'
import StartPage from '@/components/StartPage.vue'
import CreateProject from '@/project/CreateProject.vue'
import Project from '@/project/Project.vue'
import Projects from '@/project/Projects.vue'
import KiberaAccessibility from '@/visualization/KiberaAccessibility.vue'
import NetworkFlows from '@/visualization/NetworkFlows.vue'
import NetworkViz from '@/visualization/NetworkViz.vue'
import Vue from 'vue'
import Router, { Route } from 'vue-router'
import sharedStore, { AuthenticationState } from '../SharedStore'

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
      path: '/projects/new',
      component: CreateProject,
      name: 'New Project',
      meta: { authRequired: true },
    },
    {
      path: '/project/:id',
      component: Project,
      name: 'Project',
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
  if (to.matched.some(record => record.meta && record.meta.authRequired)) {
    if (
      sharedStore.state.authentication !== AuthenticationState.Authenticated
    ) {
      sharedStore.setNavigateToOnAuthentication(to.fullPath)
      next(AUTHENTICATION)
      return
    }
  }
  next()
})

export default instance
