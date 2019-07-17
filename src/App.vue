<template lang="pug">
#app
  system-nav-bar.top-nav-strip(:authStore="authStore")
  router-view.main-content
</template>

<script lang="ts">
import 'bulma/css/bulma.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import { Vue, Component, Prop } from 'vue-property-decorator'

import * as firebase from 'firebase/app'

import sharedStore from '@/SharedStore'
import EventBus from '@/EventBus.vue'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import LoginPanel from '@/components/LoginPanel.vue'
import SystemNavBar from '@/components/SystemNavBar.vue'

// MAPBOX TOKEN
// this is a required workaround to get the mapbox token assigned in TypeScript
// see https://stackoverflow.com/questions/44332290/mapbox-gl-typing-wont-allow-accesstoken-assignment
const writableMapBox: any = mapboxgl
writableMapBox.accessToken =
  'pk.eyJ1IjoidnNwLXR1LWJlcmxpbiIsImEiOiJjamNpemh1bmEzNmF0MndudHI5aGFmeXpoIn0.u9f04rjFo7ZbWiSceTTXyA'

interface BreadCrumb {
  title: string
  link: string
}

// Register a global custom directive called `v-focus`
Vue.directive('focus', {
  // When the bound element is inserted into the DOM...
  inserted: function(el) {
    // Focus the element
    el.focus()
  },
})

@Component({ components: { LoginPanel, SystemNavBar } })
export default class App extends Vue {
  private breadcrumbs: BreadCrumb[] = []
  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore
  private authState = this.authStore.state
}
</script>

<style>
html,
body {
  background-color: white;
  height: 100vh;
  min-height: 100vh;
  overflow-y: auto;
  font-family: 'Open Sans', Helvetica, Arial, sans-serif;
  margin: 0px 0px;
  padding: 0px 0px;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Open Sans', Helvetica, Arial, sans-serif;
  font-weight: 700;
  color: #363636;
}

#app {
  background-color: white;
  display: grid;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  margin: 0px 0px 0px 0px;
  padding: 0px 0px 0px 0px;
  height: 100%;
  max-height: 100vh;
  overflow-y: auto;
}

.main-content {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  z-index: 1;
}

.top-nav-strip {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  padding: 0rem 0.5rem 0rem 0.5rem;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.3);
  z-index: 5;
}

/* `:focus` is linked to `:hover` for basic accessibility */
a:hover,
a:focus {
  text-decoration: none;
}

.topnavrow-item {
  color: #ccc;
  margin-left: 1rem;
}

.nav-link {
  display: flex;
}

.breadcrumb-row {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  display: flex;
  flex-direction: row;
  vertical-align: center;
}

.nav-breadcrumb {
  color: #ccc;
  margin: auto 0.25rem auto 0rem;
  font-size: 0.8rem;
}

.nav-bread-link {
  margin-left: 0.5rem;
}
a:hover {
  color: #fff;
}

.nav-rightside {
  display: flex;
  align-items: flex-end;
  flex-direction: row;
  font-size: 0.8rem;
  margin: auto 0rem;
}

.medium-zoom-overlay {
  z-index: 100;
}

.medium-zoom-overlay ~ img {
  z-index: 101;
}
</style>
