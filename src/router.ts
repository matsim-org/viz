import AggregateOD from '@/visualization/aggregate-od/AggregateOD.vue'
import EmissionsGrid from '@/visualization/emissions-grid/EmissionsGrid.vue'
import FrameAnimation from '@/visualization/frame-animation/FrameAnimation.vue'
import NetworkVolumePlot from '@/visualization/NetworkVolumePlot.vue'
import SankeyDiagram from '@/visualization/SankeyDiagram.vue'
import TransitSupply from '@/visualization/transit-supply/TransitSupply.vue'

import Authentication from '@/auth/Authentication.vue'
import OwnerPage from '@/navigation/OwnerPage.vue'
import ProjectPage from '@/navigation/ProjectPage.vue'
import StartPage from '@/navigation/StartPage.vue'
import RunPage from '@/navigation/RunPage.vue'

import Vue from 'vue'
import Router, { Route, RouteConfig } from 'vue-router'
import sharedStore from '@/SharedStore'
import ProjectStore from './project/ProjectStore'
import UploadStore from './project/UploadStore'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import FileAPI from './communication/FileAPI'

import nprogress from 'nprogress'

// YOU MUST add every viz type here to register the viz url in the router:
const VIZ_PLUGINS = [AggregateOD, EmissionsGrid, FrameAnimation, NetworkVolumePlot, SankeyDiagram, TransitSupply]

const AUTHENTICATION = '/authentication'

Vue.use(Router)

export default class AppRouter {
  private vueRouter: Router

  private authStore: AuthenticationStore
  private projectStore: ProjectStore
  private uploadStore: UploadStore
  private fileApi: FileAPI

  public get VueRouter() {
    return this.vueRouter
  }

  constructor(authStore: AuthenticationStore, uploadStore: UploadStore, projectStore: ProjectStore, fileApi: FileAPI) {
    this.authStore = authStore
    this.projectStore = projectStore
    this.uploadStore = uploadStore
    this.fileApi = fileApi

    this.vueRouter = new Router({
      mode: 'history', // 'history' mode produces clean, normal URLs
    })

    // this.setDynamicRoutes()
    this.setStaticRoutes()

    this.vueRouter.beforeEach((to: Route, from: Route, next: (auth?: string) => any) => {
      // begin nav progress-meter
      nprogress.start()
      // always clear breadcrumbs on navigation, so that we never show wrong breadcrumbs
      sharedStore.setBreadCrumbs([])
      // always clear search box on navigation
      // sharedStore.setSearchResults([])

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

  private setDynamicRoutes() {
    const newRoutes: RouteConfig[] = []
    for (const viz of sharedStore.state.visualizationTypes) {
      const name = viz[0]
      const component = viz[1].component

      console.log('REGISTERING VIZ:', name)

      const newRoute = {
        path: `/${name}/:projectId/:vizId`,
        name: name,
        component: component,
        props: (route: Route) => {
          return {
            authStore: this.authStore,
            fileApi: this.fileApi,
            projectStore: this.projectStore,
            projectId: route.params.projectId,
            vizId: route.params.vizId,
          }
        },
      }
      newRoutes.push(newRoute)
    }
    this.vueRouter.addRoutes(newRoutes)
  }

  private setStaticRoutes() {
    const staticRoutes = [
      {
        path: '/',
        name: 'Emissions',
        component: EmissionsGrid,
        props: {
          // authStore: this.authStore,
          // projectStore: this.projectStore,
          // fileApi: this.fileApi,
        },
      },
      {
        path: AUTHENTICATION,
        name: 'Authentication',
        component: Authentication,
        props: {
          authStore: this.authStore,
        },
      },
      {
        path: '/:owner',
        name: 'OwnerPage',
        component: OwnerPage,
        props: (route: Route) => {
          return {
            authStore: this.authStore,
            fileApi: this.fileApi,
            owner: route.params.owner,
            projectStore: this.projectStore,
          }
        },
      },
      {
        path: '/:owner/:project',
        name: 'ProjectPage',
        component: ProjectPage,
        props: (route: Route) => {
          return {
            authStore: this.authStore,
            fileApi: this.fileApi,
            projectStore: this.projectStore,
            owner: route.params.owner,
            urlslug: route.params.project,
          }
        },
      },
      {
        path: '/:owner/:project/:run',
        name: 'RunPage',
        component: RunPage,
        props: (route: Route) => {
          return {
            authStore: this.authStore,
            fileApi: this.fileApi,
            projectStore: this.projectStore,
            uploadStore: this.uploadStore,
            owner: route.params.owner,
            urlslug: route.params.project,
            run: route.params.run,
          }
        },
      },
      {
        path: '/:owner/:project/:run/:viz',
        name: 'VizPage',
        component: RunPage,
        props: (route: Route) => {
          return {
            authStore: this.authStore,
            fileApi: this.fileApi,
            projectStore: this.projectStore,
            owner: route.params.owner,
            urlslug: route.params.project,
            run: route.params.run,
            viz: route.params.viz,
          }
        },
      },
    ]

    this.vueRouter.addRoutes(staticRoutes)
  }

  private isAuthenticationComponent(to: Route): boolean {
    return to.matched.some(record => record.path === AUTHENTICATION)
  }

  private isAuthRequired(to: Route): boolean {
    return to.matched.some(record => record.meta && record.meta.authRequired)
  }
}
