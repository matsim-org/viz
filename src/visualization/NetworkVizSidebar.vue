<template lang="pug">
.sidebar
    h3
      i.cloud.download.icon
      | FIDDLY WIDGETS FOR THIS VIEW:
    br
    .black.ui.button(@click="clickedTheme('dark')") Dark View
    .white.ui.button(@click="clickedTheme('light')") Light View
    br
    br

</template>

<script lang="ts">
'use strict'

import Vue from 'vue'
import sharedStore, { EventBus } from '../SharedStore'

// store is the component data store -- the state of the component.
const store = {
  sharedStore: sharedStore.state,
}

// this export is the Vue Component itself
export default Vue.extend({
  name: 'NetworkVizSidebar',
  data() {
    return store
  },
  mounted: function() {
    mounted()
  },
  methods: {
    clickedTheme: clickedTheme,
  },
  watch: {},
})

// mounted is called by Vue after this component is installed on the page
function mounted() {}

function clickedTheme(theme: string) {
  console.log('clicked')
  EventBus.$emit('change_theme', theme)
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
  text-align: center;
  margin: auto;
  width: 150px;
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
