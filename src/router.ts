import Authentication from '@/auth/Authentication.vue'
import StartPage from '@/components/StartPage.vue'
import Project from '@/project/Project.vue'
import Projects from '@/project/Projects.vue'
import FrameAnimation from '@/visualization/frame-animation/FrameAnimation.vue'
import KiberaAccessibility from '@/visualization/KiberaAccessibility.vue'
import NetworkFlows from '@/visualization/NetworkFlows.vue'
import NetworkVolumePlot from '@/visualization/NetworkVolumePlot.vue'
import NOXPlot from '@/visualization/NOXPlot.vue'
import TransitSupply from '@/visualization/TransitSupply.vue'
import Vue from 'vue'
import Router, { Route } from 'vue-router'
import sharedStore from '@/SharedStore'
import ProjectStore from './project/ProjectStore'
import UploadStore from './project/UploadStore'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import FileAPI from './communication/FileAPI'

Vue.use(Router)

const AUTHENTICATION = '/authentication'

export default class AppRouter {
  private vueRouter: Router

  public get VueRouter() {
    return this.vueRouter
  }

  constructor(authStore: AuthenticationStore, uploadStore: UploadStore, projectStore: ProjectStore, fileApi: FileAPI) {
    this.vueRouter = new Router({
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
          props: {
            fileApi: fileApi,
          },
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
          path: '/nox',
          name: 'NOXPlot',
          component: NOXPlot,
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
              fileApi: fileApi,
            }
          },
        },
        {
          path: '/transit-supply/:projectId/:vizId',
          name: 'Transit Supply',
          component: TransitSupply,
          props: {
            fileApi: fileApi,
          },
        },
        {
          path: '/frame-animation/:projectId/:vizId',
          component: FrameAnimation,
          name: 'FrameAnimation',
          props: route => {
            return {
              vizId: route.params.vizId,
              projectStore: projectStore,
              authStore: authStore,
            }
          },
        },
        {
          path: AUTHENTICATION,
          name: 'Authentication',
          component: Authentication,
          props: {
            authStore: authStore,
          },
        },
      ],
    })

    this.vueRouter.beforeEach((to: Route, from: Route, next: (auth?: string) => any) => {
      if (!this.isAuthenticationComponent(to)) {
        sharedStore.setLastNavigation(to.fullPath)
      }

      if (this.isAuthRequired(to)) {
        if (authStore.state.status !== AuthenticationStatus.Authenticated) {
          next(AUTHENTICATION)
          return
        }
      }
      next()
    })
  }

  private isAuthenticationComponent(to: Route): boolean {
    return to.matched.some(record => record.path === AUTHENTICATION)
  }

  private isAuthRequired(to: Route): boolean {
    return to.matched.some(record => record.meta && record.meta.authRequired)
  }
}
