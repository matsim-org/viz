// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App.vue'
import router from '@/router/Router'

Vue.config.productionTip = false

let app = new Vue({
  el: '#app',
  router: router,
  template: `<App/>`,
  components: { App },
})
