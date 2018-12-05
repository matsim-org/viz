import Vue from 'vue'
import App from './App.vue'
import router from '@/router'
import AuthenticationStore from './auth/AuthenticationStore'
import FileAPI from './communication/FileAPI'
import ProjectStore from './project/ProjectStore'
import UploadStore from './project/UploadStore'
import AppRouter from '@/router'

Vue.config.productionTip = false

const authStore = new AuthenticationStore()
const fileApi = new FileAPI(authStore)
const uploadStore = new UploadStore(authStore)
const projectStore = new ProjectStore(fileApi, uploadStore)
const appRouter = new AppRouter(authStore, uploadStore, projectStore, fileApi)

new Vue({
  router: appRouter.VueRouter,
  render: h => h(App, { props: { authStore: authStore } }),
}).$mount('#app')
