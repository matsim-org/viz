<template lang="pug">
.main-content
  h3 NETWORK VIZ
  br
  p it worked!
</template>

<script>
'use strict';

// import { BigStore } from '../shared-store.js';

// store is the component data store -- the state of the component.
let store = {
}

// this export is the Vue Component itself
export default {
  name: 'NetworkViz',
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

</style>
