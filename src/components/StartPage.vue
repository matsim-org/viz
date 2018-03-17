<template lang="pug">
.main-content
  h3 WELCOME TO MATSIM-VIZ.

  p You've found the "MATSim Visualizer" which is an experimental web-based visualization platform for exploring MATSim outputs.
  p Pick a dataset to explore from those below. More to come!

  h3 SAMPLE VISUALIZATIONS
  .visualizations
    .post(v-for="viz in visualizations")
      .viz-thumbnail
        router-link(:to="viz.url")
          img.thumbnail-image(:src="viz.thumbnail")
          h5.thumbnail-title {{ viz.title }}
  br
  br
  h3 ABOUT THIS SITE
  p You can find out more about MATSim at&nbsp;
    a(href="https://matsim.org" target="_blank") https://matsim.org
</template>

<script>
'use strict';
import { BigStore } from '../shared-store.js';

// store is the component data store -- the state of the component.
let store = {
  shared: BigStore.state,
  visualizations: [
    { title: '1. Network Links',
      url: '/network',
      thumbnail: '/static/network-viz/scrnshot.png'
    },
    { title: '2. Accessibility',
      url: '/accessibility',
      thumbnail: '/static/kibera-accessibility/scrnshot.png'
    },
    { title: '3. Cottbus Network Flows',
      url: '/flows',
      thumbnail: '/static/data-cottbus/scrnshot.jpg'
    },
    { title: '4. Cottbus Traffic Animation',
      url: '/animation-cottbus',
      thumbnail: '/static/janek-viz/scrnshot.png'
    },
  ],
}

// this export is the Vue Component itself
export default {
  name: 'StartPage',
  components: {},
  data () {
    return store
  },
  mounted: function () {
    mounted();
  },
  methods: {
  },
  watch: {
  },
}

// mounted is called by Vue after this component is installed on the page
function mounted () {
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
  height:100%;
  opacity: 0.9;
  padding: 0 0 0.5rem 0;
  box-shadow: 0px 2px 7px rgba(0,0,0, 0.2);
  vertical-align:top;
  width: 20rem;
 }

.viz-thumbnail:hover {
  background-color: #fff;
  opacity: 1.0;
  box-shadow: 3px 3px 10px rgba(0,0,80, 0.3);
  transition: all ease 0.2s;
  transform: translateY(-1px);
  border-color: #999;
}

.viz-thumbnail:active {
  opacity: 1.0;
  box-shadow: 3px 3px 6px rgba(0,0,80, 0.4);
  transform: translateY(1px);
}

.thumbnail-image {
  vertical-align:top;
  width: 20rem;
  margin-bottom: 5px;
}

.thumbnail-title {
  color: #3333aa;
  margin-top: 0px;
  padding-bottom: 10px;
  padding-left: 5px;
  padding-right: 2px;
}

h2,h3 {
  color: #6666ff;
  margin-top: 15px;
  margin-bottom: 3px;
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

.visualizations {
  margin-top: 10px;
}

.post {margin-top: 20px;}

</style>
