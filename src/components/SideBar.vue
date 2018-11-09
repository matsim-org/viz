<template lang="pug">
.sidebar
  .sidebar-about
    router-link(to="/"): img.sidebar-logo(src="../assets/matsim-logo-blue.png")
  br
  br

  .sidebar-content
    h3
      i.cloud.download.icon
      | &nbsp;About
    br
    p MATSim Viz, release 0.1
    br
    p We welcome your feedback and contributions! Join us at:
      a(href="https://github.com/matsim-org") &nbsp;MATSim&nbsp;GitHub
    br
    br

    h3
      i.chart.area.alternate.icon
      | &nbsp;MY MATSIM
    nav.sidebar-nav
      router-link.sidebar-nav-item(to="/projects") MY PROJECTS

    br
    component(:is="sidebarComponent")
</template>

<script lang="ts">
'use strict'

import Vue from 'vue'
import sharedStore, { EventBus } from '../SharedStore'

import NetworkVizSidebar from '@/visualization/NetworkVizSidebar.vue'

// store is the component data store -- the state of the component.
const store = {
  sharedStore: sharedStore.state,
  sidebarComponent: '',
}

// this export is the Vue Component itself
export default Vue.extend({
  name: 'SideBar',
  data() {
    return store
  },
  components: { NetworkVizSidebar },
  mounted: function() {
    mounted()
  },
  methods: {},
  watch: {},
})

// mounted is called by Vue after this component is installed on the page
function mounted() {
  EventBus.$on('switch-sidebar', (sidebarComponent: string) => {
    store.sidebarComponent = sidebarComponent
  })
}
</script>

<style scoped>
.sidebar {
  overflow-x: hidden;
  color: #666;
  background-color: #f2f2f2;
  z-index: 100;
}

/* Sidebar links */
.sidebar a {
  color: #448;
  text-decoration: none;
}

/* About section */
.sidebar-about {
  padding-top: 20px;
}

.sidebar-about h1 {
  color: #66f;
  margin-top: 0;
  font-family: 'Oswald', sans-serif;
  font-size: 1.8rem;
  text-shadow: 4px 4px 4px #ccc;
}

.sidebar-content {
  padding: 0px 10px;
}
/* Sidebar nav */
.sidebar-nav-item {
  display: block;
  padding-top: 0.3rem;
  padding-bottom: 0.3rem;
  padding-left: 1rem;
  font-size: 1rem;
  min-height: 3rem;
}

.sidebar-nav-item:hover {
  background: #ded;
}

a.sidebar-nav-item:hover,
a.sidebar-nav-item:focus {
  text-decoration: none;
  color: #36a;
}
.sidebar-nav-item.active {
  font-weight: bold;
}

.theme-base-01 .sidebar {
  background-color: #ddd;
  border-right-width: 1.5px;
  border-color: #bbb;
}
.theme-base-01 .content a,
.theme-base-01 .related-posts li a:hover {
  color: #6666ff;
}

.sidebar-content h2,
h3 {
  border-style: solid;
  border-width: 1px 0 0 0;
  border-color: #36c;
  color: #36c;
  font-size: 1.1em;
  text-transform: uppercase;
}

.sidebar-logo {
  display: block;
  margin: 0px auto;
  width: 125px;
}

.lead {
  text-align: center;
  color: #555;
  font-family: 'Oswald', sans-serif;
}

/* `:focus` is linked to `:hover` for basic accessibility */
a:hover,
a:focus {
  text-decoration: none;
}
</style>
