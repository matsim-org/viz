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

// store is the component data store -- the state of the component.
let store = {
  visualizations: [],
  sharedState: BigStore.state,
}

// this export is the Vue Component itself
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

// mounted is called by Vue after this component is installed on the page
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

h2,h3 {
  color: #6666ff;
}

/* `:focus` is linked to `:hover` for basic accessibility */
a:hover,
a:focus {
  text-decoration: none;
}

</style>
