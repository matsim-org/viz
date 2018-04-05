<template lang="pug">
.sidebar
  .sidebar-about
    router-link(to="/"): img.sidebar-logo(src="../assets/matsim-logo-blue.png")
  br
  br

  .sidebar-content
    h3
      i.cloud.download.icon
      | &nbsp;Datasets
    br
    p [ to be added ] -- need to decide how to add, organize, choose available datasets.
    br
    br

    h3
      i.chart.area.alternate.icon
      | &nbsp;Visualizations
    br

    nav.sidebar-nav
      router-link.sidebar-nav-item(to="/") HOME
      br
      router-link.sidebar-nav-item(to="flows") NETWORK FLOWS in Cottbus
      router-link.sidebar-nav-item(to="accessibility") ACCESSIBILITY: Kibera
      router-link.sidebar-nav-item(to="network") NETWORK LINKS: GeoJson
</template>

<script>
'use strict'

import { BigStore } from '../shared-store.js'

// store is the component data store -- the state of the component.
let store = {
  sharedStore: BigStore.state,
}

// this export is the Vue Component itself
export default {
  name: 'SideBar',
  data() {
    return store
  },
  mounted: function() {
    mounted()
  },
  methods: {
  },
  watch: {
  },
}

// mounted is called by Vue after this component is installed on the page
function mounted() {
}

</script>

<style scoped>
.sidebar {
  overflow-x: hidden;
  color: #666;
  background-color: #eeeee9;
  border-right: 1px solid;
  border-color: #ccc;
  z-index: 100;
}

/* Sidebar links */
.sidebar a {
  color: #448;
  text-decoration: none;
}

/* About section */
.sidebar-about { padding-top: 20px; }

.sidebar-about h1 {
  color: #66f;
  margin-top: 0;
  font-family: "Oswald", sans-serif;
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
  min-height:3rem;
}

.sidebar-nav-item:hover {
  background:#ded;
}

a.sidebar-nav-item:hover,
a.sidebar-nav-item:focus {
  text-decoration: none;
  color: #36a;
}
.sidebar-nav-item.active {
  font-weight: bold;
}

/* ------ SFCTA ------ */

.theme-base-01 .sidebar {
  background-color: #ddd;
  border-right-width: 1.5px;
  border-color: #bbb;
}
.theme-base-01 .content a,
.theme-base-01 .related-posts li a:hover {
  color: #6666ff;
}

.sidebar-content h2,h3 {
  border-style: solid;
  border-width: 1px 0 0 0;
  border-color: #36c;
  color: #36c;
  font-size: 1.1em;
  text-transform: uppercase;
}

.sidebar-logo {
  display: block;
  text-align:center;
  margin: auto;
  width: 150px;
}

.lead {
  text-align:center;
  color:#555;
  font-family: "Oswald", sans-serif;
}

/* `:focus` is linked to `:hover` for basic accessibility */
a:hover,
a:focus {
  text-decoration: none;
}

</style>
