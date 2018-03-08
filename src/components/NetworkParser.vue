<template lang="pug">
.main-content
  h3 NETWORK PARSER

  button.ui.large.red.button(@click="doIt") DO IT!

  br
  br

  p {{msg}}

  br
  br

  h5 NODES: {{nodes.length}}

  br
  br

  h5 LINKS: {{links.length}}
  // p.node-row(v-for="link in links") {{link}}
</template>

<script>
'use strict';

// import { BigStore } from '../shared-store.js';
// store is the component data store -- the state of the component.
let store = {
  nodes: [],
  links: [],
  msg: '',
}

// this export is the Vue Component itself
export default {
  name: 'NetworkParser',
  components: {},
  data () {
    return store
  },
  mounted: function () {
    mounted();
  },
  methods: {
    doIt: doIt,
  },
  watch: {
  },
}

// mounted is called by Vue after this component is installed on the page
function mounted () {
}

async function doIt () {
  let pako = require('pako')

  let sax = require('sax')
  let saxparser = sax.parser(true); // strict

  store.msg = 'GO!';

  saxparser.onopentag = function (tag) {
    if (tag.name === 'node') store.nodes.push(tag.attributes);
    if (tag.name === 'link') store.links.push(tag.attributes);
  }

  try {
    let url = '/static/data-cottbus/network.xml.gz'
    let resp = await fetch(url)
    let blob = await resp.blob()

    // get the blob data
    let readBlob = require('read-blob')
    readBlob.arraybuffer(blob).then(content => {
      let xml = pako.inflate(content, { to: 'string' });
      saxparser.write(xml)
    })
  } catch (e) {
    store.msg = 'ERR>>'
    console.log(e)
  }
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
