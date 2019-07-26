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

/*  DO NOT CHECK REAL ONE INTO GITHUB:
const firebaseConfig = {
  apiKey: '...',
  authDomain: 'matsim-viz.firebaseapp.com',
  databaseURL: 'https://matsim-viz.firebaseio.com',
  projectId: 'matsim-viz',
  storageBucket: '',
  messagingSenderId: '...',
  appId: '...',
}
*/

// Firebase API key is in this:
import firebaseConfig from '@/firebase-config'

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

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
  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore
  private authState = this.authStore.state
}
</script>

<style>
html,
body {
  background-color: white;
  font-family: 'Segoe UI', 'Open Sans', Helvetica, Arial, sans-serif;
  font-weight: 300;
  margin: 0px 0px;
  padding: 0px 0px;
  overflow-y: auto;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Segoe UI', 'Open Sans', Helvetica, Arial, sans-serif;
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
}

.main-content {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  z-index: 1;
  margin-top: 3rem;
}

.top-nav-strip {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  padding: 0rem 0.5rem 0rem 0.5rem;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.3);
  z-index: 5;
  position: absolute;
  top: 0;
  width: 100%;
  height: 3rem;
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
