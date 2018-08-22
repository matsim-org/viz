<template lang="pug">
.main-content
  h3 WELCOME TO MATSIM-VIZ.

  p You've found the "MATSim Visualizer" which is an experimental web-based visualization platform for exploring MATSim outputs.
  p Pick a dataset to explore from those below. More to come!

  h3 SAMPLE VISUALIZATIONS
  ul.visualizations
    li.viz-thumbnail(v-for="viz in visualizations")
      router-link(:to="viz.url")
        img.thumbnail-image(:src="viz.thumbnail")
        h5.thumbnail-title {{ viz.title }}
  br
  br
  h3 ABOUT THIS SITE
  p You can find out more about MATSim at&nbsp;
    a(href="https://matsim.org" target="_blank") https://matsim.org
</template>

<script lang="ts">
'use strict'
import sharedStore, { EventBus } from '../SharedStore'

// store is the component data store -- the state of the component.
const store = {
  shared: sharedStore.state,
  visualizations: [
    {
      title: 'Cottbus Network Flows',
      url: '/flows',
      thumbnail: '/data-cottbus/scrnshot.jpg',
    },
    {
      title: 'Network Links',
      url: '/network',
      thumbnail: '/network-viz/scrnshot.png',
    },
    {
      title: 'Accessibility',
      url: '/accessibility',
      thumbnail: '/kibera-accessibility/scrnshot.png',
    },
  ],
}

// this export is the Vue Component itself
export default {
  name: 'StartPage',
  components: {},
  data() {
    return store
  },
  mounted: function() {
    mounted()
  },
  methods: {},
  watch: {},
}

// mounted is called by Vue after this component is installed on the page
function mounted() {
  EventBus.$emit('switch-sidebar', '')
}
</script>

<style scoped>
/* this is the initial start page layout */
.main-content {
  padding: 20px;
  overflow-y: auto;
}

.viz-thumbnail {
  background: #dde8ff;
  background-color: #fff;
  border-style: solid;
  border-width: 1px 1px;
  border-color: #aaa;
  display: table-cell;
  height: 100%;
  opacity: 0.9;
  padding: 0 0 0.5rem 0;
  box-shadow: 0px 2px 7px rgba(0, 0, 0, 0.2);
  vertical-align: top;
  width: 20rem;
}

.viz-thumbnail:hover {
  background-color: #fff;
  opacity: 1;
  box-shadow: 3px 3px 10px rgba(0, 0, 80, 0.3);
  transition: all ease 0.2s;
  transform: translateY(-1px);
  border-color: #999;
}

.viz-thumbnail:active {
  opacity: 1;
  box-shadow: 3px 3px 6px rgba(0, 0, 80, 0.4);
  transform: translateY(1px);
}

.thumbnail-image {
  vertical-align: top;
  width: 20rem;
  margin-bottom: 5px;
  padding-right: 2px;
}

.thumbnail-title {
  color: #3333aa;
  margin-top: 0px;
  padding-bottom: 10px;
  padding-left: 5px;
  padding-right: 2px;
}

h2,
h3 {
  color: #6666ff;
  margin-top: 15px;
  margin-bottom: 3px;
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

.visualizations {
  display: grid;
  grid-gap: 20px;
  grid-template-columns: repeat(auto-fill, 20rem);
  list-style: none;
  margin-top: 20px;
  padding-left: 0px;
}
</style>
