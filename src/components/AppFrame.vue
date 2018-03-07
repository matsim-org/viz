<template lang="pug">
#container
  matsim-sidebar.sidebar(v-bind:class="{ shrunken: !sharedState.isSidePanelExpanded }")

  .main-content: start-page

  #btn-toggle-sidepanel
    button.ui.tiny.blue.icon.button(v-on:click="toggleSidePanel")
      i.angle.white.double.icon(v-bind:class="{left: sharedState.isSidePanelExpanded, right: !sharedState.isSidePanelExpanded }")
</template>

<script>
'use strict';

import { BigStore } from '../shared-store.js';
import MatsimSidebar from '@/components/MatsimSidebar.vue'
import StartPage from '@/components/StartPage.vue'

let store = {
  visualizations: [],
  sharedState: BigStore.state,
}

export default {
  name: 'AppFrame',
  components: { MatsimSidebar, StartPage },
  data () {
    return store
  },
  mounted: function () {
    mounted();
  },
  methods: {
    toggleSidePanel: toggleSidePanel,
  },
  watch: {
  },
}

function mounted () {
}

function toggleSidePanel () {
  BigStore.toggleSidePanel();
}

</script>

<style scoped>

#container {
  background-color: white;
  display: grid;
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
  margin-left: -293px;
}

#btn-toggle-sidepanel {
  background-color: #eeeee9;
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

.dataset-thumbnail {
  display: table-cell;
  vertical-align:top;
  background: #dde8ff;
  padding: 0 0 0.5rem 0;
  width: 20rem;
  height:100%;
  box-shadow: 0px 2px 7px rgba(0,0,0, 0.2);
  background-color: #fff;
  border-style: solid;
  border-width: 1px 1px;
  border-color: #aaa;
 }

.dataset-thumbnail:hover {
  background-color: #fff;
  opacity: 0.90;
  box-shadow: 3px 3px 10px rgba(0,0,80, 0.4);
  transition: all ease 0.2s;
  transform: translateY(-1px);
  border-color: #999;
}

.dataset-thumbnail:active {
  opacity: 1.0;
  box-shadow: 3px 3px 6px rgba(0,0,80, 0.6);
  transform: translateY(1px);
}

.thumbnail-image {
  vertical-align:top;
  margin-bottom: 5px;
}

.thumbnail-title {
  color: #3333aa;
  margin-top: 0px;
  padding-bottom: 10px;
  padding-left: 5px;
  padding-right: 2px;
}

.posts {
  display: table;
  border-spacing: 1.5rem 1.5rem;

}

.posts-row {
  display: table-row;
  background: #fff;
}

h2,h3 {
  color: #6666ff;
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
