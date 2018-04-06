<template lang="pug">
#app
  // global app sidebar
  side-bar.sidebar(v-bind:class="{ shrunken: !sharedState.isSidePanelExpanded }")

  // vue-router replaces this element with the correct page contents
  // see src/router/index.js to view/add route definitions

  router-view.main-content

  // our cute hide/show button
  #btn-toggle-sidepanel
    button.ui.tiny.blue.icon.button(v-on:click="toggleSidePanel")
      i.angle.white.double.icon(v-bind:class="{left: sharedState.isSidePanelExpanded, right: !sharedState.isSidePanelExpanded }")
</template>

<script lang="ts">
"use strict";

import Vue from "vue";
import { BigStore } from "./shared-store.js";
import SideBar from "@/components/SideBar.vue";

let store = {
  sharedState: BigStore.state
};

export default Vue.extend({
  name: "App",
  components: { SideBar },
  data() {
    return store;
  },
  methods: {
    toggleSidePanel: toggleSidePanel
  },
  mounted: function() {
    mounted(this);
  }
});

// mounted is called by Vue after this component is installed on the page
function mounted(component: any) {}

function toggleSidePanel() {
  BigStore.toggleSidePanel();
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
  font-family: "Lato", Helvetica, Arial, sans-serif;
  margin: 0px 0px;
  padding: 0px 0px;
}

#app {
  background-color: white;
  display: grid;
  font-family: "Lato", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  grid-template-columns: auto auto 1fr;
  grid-template-rows: 1fr auto;
  height: 100%;
  margin: 0px 0px 0px 0px;
  padding: 0px 0px 0px 0px;
  overflow: hidden;
}

.sidebar {
  grid-column: 1 / 2;
  grid-row: 1 / 3;
  height: 100%;
  margin-left: 0px;
  position: relative;
  width: 300px;
  transition: margin 0.25s;
}

.shrunken {
  margin-left: -300px;
}

#btn-toggle-sidepanel {
  background-color: #eeeee980;
  border-radius: 0px 4px 0px 0px;
  padding: 4px 2px 4px 4px;
  grid-column: 1 / 3;
  grid-row: 2 / 3;
  position: relative;
  z-index: 1005;
  margin-right: 0px;
}

.main-content {
  grid-column: 2 / 4;
  grid-row: 1 / 3;
  position: relative;
  z-index: 1;
}

h2,
h3 {
  color: #6666ff;
}

/* `:focus` is linked to `:hover` for basic accessibility */
a:hover,
a:focus {
  text-decoration: none;
}
</style>
