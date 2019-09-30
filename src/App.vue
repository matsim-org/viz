<template lang="pug">
#app(:class=" {'full-page-app' : isFullPage}" )
  system-nav-bar.top-nav-strip(:authStore="authStore")

  account-panel.user-nag-area(v-if="needToNagUser" :authStore="authStore")

  router-view.main-content

  search-results.search-panel(v-if="appState.searchResults.length")

</template>

<script lang="ts">
import 'bulma/css/bulma.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

import * as firebase from 'firebase/app'

import SharedStore from '@/SharedStore'
import EventBus from '@/EventBus.vue'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'
import AccountPanel from '@/components/AccountPanel.vue'
import LoginPanel from '@/components/LoginPanel.vue'
import SearchResults from '@/components/SearchResults.vue'
import SystemNavBar from '@/components/SystemNavBar.vue'
import CloudAPI from '@/communication/FireBaseAPI'

// MAPBOX TOKEN
// this is a required workaround to get the mapbox token assigned in TypeScript
// see https://stackoverflow.com/questions/44332290/mapbox-gl-typing-wont-allow-accesstoken-assignment
const writableMapBox: any = mapboxgl
writableMapBox.accessToken =
  'pk.eyJ1IjoidnNwLXR1LWJlcmxpbiIsImEiOiJjamNpemh1bmEzNmF0MndudHI5aGFmeXpoIn0.u9f04rjFo7ZbWiSceTTXyA'

// Firebase API key is in this: (securely)
import firebaseConfig from '@/firebase-secure.ts'

// Initialize Firebase
firebase.initializeApp(firebaseConfig)
CloudAPI.setDb()

// Register a global custom directive called `v-focus`
Vue.directive('focus', {
  // When the bound element is inserted into the DOM...
  inserted: function(el) {
    // Focus the element
    el.focus()
  },
})

@Component({ components: { AccountPanel, LoginPanel, SearchResults, SystemNavBar } })
export default class App extends Vue {
  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore
  private authState = this.authStore.state
  private appState = SharedStore.state

  private get isFullPage() {
    return this.appState.isFullPageMap
  }

  private get needToNagUser() {
    return SharedStore.state.needToNagUserToLogin
  }

  @Watch('appState.isFullPageMap')
  private fullPageUpdated(isFullPage: boolean) {
    console.log('~~SWITCHING FULL PAGE: ', isFullPage)

    if (isFullPage) document.body.classList.add('full-screen-page')
    else document.body.classList.remove('full-screen-page')
  }
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
  height: 100%;
  overscroll-behavior: contain;
}

body.full-screen-page {
  -webkit-overflow-scrolling: touch;
  overflow-y: hidden;
  height: 100%;
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

b {
  font-weight: 700;
}

#app {
  background-color: white;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0px 0px 0px 0px;
  padding: 0px 0px 0px 0px;
}

.full-page-app {
  height: 100%;
}

.top-nav-strip {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  padding: 0rem 0.5rem 0rem 0.5rem;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.3);
  z-index: 10;
  width: 100%;
  height: 4rem;
}

.user-nag-area {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
}

.main-content {
  grid-column: 1 / 2;
  grid-row: 3 / 4;
  z-index: 1;
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

.search-panel {
  grid-column: 1 / 2;
  grid-row: 1 / 4;
  margin: 4rem 2rem auto auto;
  z-index: 8;
  width: 22rem;
  box-shadow: 2px 5px 10px rgba(0, 0, 0, 0.4);
}
</style>
