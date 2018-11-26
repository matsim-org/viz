import Authentication from '@/auth/Authentication.vue'
import StartPage from '@/components/StartPage.vue'
import Project from '@/project/Project.vue'
import Projects from '@/project/Projects.vue'
import FrameAnimation from '@/visualization/frame-animation/FrameAnimation.vue'
import KiberaAccessibility from '@/visualization/KiberaAccessibility.vue'
import NetworkFlows from '@/visualization/NetworkFlows.vue'
import NetworkVolumePlot from '@/visualization/NetworkVolumePlot.vue'
import TransitSupply from '@/visualization/TransitSupply.vue'
import Vue from 'vue'
import Router, { Route } from 'vue-router'
import sharedStore from '@/SharedStore'
import authenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import ProjectStore from './project/ProjectStore'
import UploadStore from './project/UploadStore'

Vue.use(Router)

const AUTHENTICATION = '/authentication'
const uploadStore = new UploadStore()
const projectStore = new ProjectStore(uploadStore)

const instance = new Router({
  mode: 'history', // 'history' mode produces clean, normal URLs
  routes: [
    {
      path: '/',
      name: 'StartPage',
      component: StartPage,
      props: { projectStore: projectStore },
    },
    {
      path: '/Network Links/:projectId/:vizId',
      name: 'NetworkVolumePlot',
      component: NetworkVolumePlot,
      props: true,
    },
    {
      path: '/network-volume-plot/:projectId/:vizId',
      name: 'Network Volume Plot',
      component: NetworkVolumePlot,
      props: true,
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
      props: { projectStore: projectStore },
    },
    {
      path: '/project/:projectId',
      component: Project,
      name: 'Project',
      meta: { authRequired: true },
      props: route => {
        return {
          projectId: route.params.projectId,
          projectStore: projectStore,
          uploadStore: uploadStore,
        }
      },
    },
    {
      path: '/transit-supply/:projectId/:vizId',
      name: 'Transit Supply',
      component: TransitSupply,
      props: true,
    },
    {
      path: '/frame-animation/:projectId/:vizId',
      component: FrameAnimation,
      name: 'FrameAnimation',
    },
    {
      path: AUTHENTICATION,
      name: 'Authentication',
      component: Authentication,
    },
  ],
})

instance.beforeEach((to: Route, from: Route, next: (auth?: string) => any) => {
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
