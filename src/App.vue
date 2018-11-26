<template lang="pug">
#app
  .banner
    router-link.nav-logo(to="/"): img.sidebar-logo(src="@/assets/matsim-logo-white.png")

    .breadcrumb-row
      span(v-for="crumb in breadcrumbs" :key="crumb.title")
        p.nav-breadcrumb &raquo;
          router-link.nav-breadcrumb.nav-bread-link(:to="crumb.link") {{ crumb.title }}

    .nav-rightside
      router-link.banner-item(:to="'#'")  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Settings
      router-link.banner-item(:to="'#'")  Account

  router-view.main-content
</template>

<script lang="ts">
'use strict'

import Vue from 'vue'
import sharedStore, { EventBus } from '@/SharedStore'
import SideBar from '@/components/SideBar.vue'
import 'bulma/css/bulma.css'

interface BreadCrumb {
  title: string
  link: string
}

const store = {
  sharedState: sharedStore.state,
  breadcrumbs: [] as BreadCrumb[],
}

export default Vue.extend({
  name: 'App',
  components: { SideBar },
  data() {
    return store
  },
  mounted() {
    mounted(this)
  },
})

// mounted is called by Vue after this component is installed on the page
function mounted(component: any) {
  EventBus.$on('set-breadcrumbs', (crumbs: BreadCrumb[]) => {
    store.breadcrumbs = crumbs
  })
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
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: 'Montserrat', Helvetica, Arial, sans-serif;
  margin: 0px 0px;
  padding: 0px 0px;
}

#app {
  background-color: white;
  display: grid;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  height: 100%;
  max-height: 100%;
  margin: 0px 0px 0px 0px;
  padding: 0px 0px 0px 0px;
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
  grid-row: 2 / 3;
  z-index: 1;
}

.banner {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  padding: 10px 1.5rem 5px 1.5rem;
  background-color: hsl(0, 0%, 29%);
  z-index: 5;
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto;
}

h2,
h3 {
  color: #3273dc;
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

.banner-item {
  float: right;
  color: #ccc;
}

.sidebar-logo {
  margin-right: 0.7rem;
  height: 26px;
}

.breadcrumb-row {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  display: flex;
  flex-direction: row;
}

.nav-breadcrumb {
  vertical-align: top;
  color: #ccc;
  margin-right: 0.25rem;
  margin-bottom: 0px;
  font-size: 1rem;
}

.nav-bread-link {
  margin-left: 0.5rem;
}
a:hover {
  color: #fff;
}

.nav-logo {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
}

.nav-rightside {
  grid-row: 1 / 2;
  grid-column: 3 / 4;
}
</style>
