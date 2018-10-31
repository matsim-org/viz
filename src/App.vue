<template lang="pug">
#app
  .banner
    h5
      router-link(to="/"): img.sidebar-logo(src="@/assets/matsim-logo-blue.png" style="height: 24px")
      a(style="float:right" href="/")  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SETTINGS
      a(style="float:right" href="/")  ACCOUNT

  router-view.main-content
</template>

<script lang="ts">
'use strict'

import Vue from 'vue'
import sharedStore from './SharedStore'
import SideBar from '@/components/SideBar.vue'
import 'bulma/css/bulma.css'

const store = {
  sharedState: sharedStore.state,
}

export default Vue.extend({
  name: 'App',
  components: { SideBar },
  data() {
    return store
  },
  methods: {
    toggleSidePanel,
  },
  mounted() {
    mounted(this)
  },
})

// mounted is called by Vue after this component is installed on the page
function mounted(component: any) {}

function toggleSidePanel() {
  sharedStore.toggleSidePanel()
}
</script>

<style>
body,
p,
h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Lato', Helvetica, Arial, sans-serif;
  margin: 0px 0px;
  padding: 0px 0px;
}

body {
  background-color: white;
}

#app {
  background-color: white;
  display: grid;
  font-family: 'Lato', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  height: 100%;
  margin: 0px 0px 0px 0px;
  padding: 0px 0px 0px 0px;
  overflow: hidden;
}

#btn-toggle-sidepanel {
  background-color: transparent;
  border-radius: 0px 4px 0px 0px;
  padding: 4px 2px 4px 4px;
  grid-column: 1 / 3;
  grid-row: 2 / 3;
  position: relative;
  z-index: 1005;
  margin-right: 0px;
}

.main-content {
  grid-column: 1 / 2;
  grid-row: 1 / 3;
  position: relative;
  z-index: 1;
}

.banner {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  padding: 10px 15px 5px 15px;
  background-color: #eeeeeecc;
  position: relative;
  z-index: 5;
}

h2,
h3 {
  color: #6666ff;
}

h2 {
  font-size: 1.4rem;
  font-weight: 700;
}

h3 {
  font-size: 1.2rem;
  font-weight: 700;
}

/* `:focus` is linked to `:hover` for basic accessibility */
a:hover,
a:focus {
  text-decoration: none;
}
</style>
