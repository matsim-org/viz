<template lang="pug">
.main-content
  #mymap
  .controls
    h3 NETWORK PARSER &nbsp;
      button.ui.large.red.button(@click="doIt") DO IT!
</template>

<script>
'use strict';

import { EventBus } from '../shared-store.js';
import mapboxgl from 'mapbox-gl';

let L = require('leaflet');

// import { BigStore } from '../shared-store.js';
// store is the component data store -- the state of the component.
let store = {
  nodes: {},
  links: {},
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

let mymap;

// mounted is called by Vue after this component is installed on the page
function mounted () {
  mymap = L.map('mymap', { zoomSnap: 0.5 });
  mymap.fitBounds([[51.72, 14.3], [51.82, 14.4]]);
  mymap.zoomControl.setPosition('bottomright');

  let url =
    'https://api.mapbox.com/styles/v1/mapbox/' +
    'light' +
    '-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}';
  let token =
    'pk.eyJ1IjoicHNyYyIsImEiOiJjaXFmc2UxanMwM3F6ZnJtMWp3MjBvZHNrIn0._Dmske9er0ounTbBmdRrRQ';
  let attribution =
    '<a href="http://openstreetmap.org">OpenStreetMap</a> | ' +
    '<a href="http://mapbox.com">Mapbox</a>';
  L.tileLayer(url, {
    attribution: attribution,
    maxZoom: 18,
    accessToken: token,
  }).addTo(mymap);

  // Start doing stuff AFTER the MapBox library has fully initialized
  mymap.on('style.load', mapIsReady);
  setupEventListeners();
}

async function mapIsReady () {
  mymap.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
}

function setupEventListeners () {
  EventBus.$on('sidebar-toggled', isVisible => {
    console.log(`Sidebar is now: ${isVisible} :)`)
    // map needs to be force-recentered, and it is slow.
    for (let delay of [50, 100, 150, 200, 250, 300]) {
      setTimeout(function () { mymap.invalidateSize() }, delay);
    }
  });
}

function addNodesToMap () {
  for (let id in store.nodes) {
    try {
      let node = store.nodes[id]
      L.circle([node.y, node.x], {
        color: 'blue',
        fillColor: 'blue',
        fillOpacity: 0.5,
        weight: 1,
        radius: 4,
      }).addTo(mymap);
    } catch (e) {
      console.log(e)
    }
  }
}

function addLinksToMap () {
  for (let id in store.links) {
    let link = store.links[id]
    let fromNode = store.nodes[link.from]
    let toNode = store.nodes[link.to]

    let width = link.permlanes * link.permlanes
    let color = 'green'
    if (parseInt(link.capacity) > '1000') color = 'blue'

    L.polyline([
      [fromNode.y, fromNode.x],
      [toNode.y, toNode.x]
    ], {color: color, weight: width}).addTo(mymap);
  }
}

async function doIt () {
  let pako = require('pako')
  let sax = require('sax')
  let readBlob = require('read-blob')

  let saxparser = sax.parser(true); // strictmode=true

  store.msg = 'GO!';

  saxparser.onopentag = function (tag) {
    let attr = tag.attributes

    if (tag.name === 'node') {
      attr.x = parseFloat(attr.x)
      attr.y = parseFloat(attr.y)
      store.nodes[attr.id] = attr
    }

    if (tag.name === 'link') {
      store.links[attr.id] = attr;
    }
  }

  saxparser.onend = function () {
    convertCoords('+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs ')
    addLinksToMap();
    // addNodesToMap();
  }

  try {
    let url = '/static/data-cottbus/network.xml.gz'
    // let url = 'https://svn.vsp.tu-berlin.de/repos/public-svn/matsim/scenarios/countries/de/berlin/2014-08-01_car_1pct/network.xml.gz'
    let resp = await fetch(url, {mode: 'no-cors'})
    let blob = await resp.blob()

    // get the blob data
    readBlob.arraybuffer(blob).then(content => {
      let xml = pako.inflate(content, { to: 'string' });
      saxparser.write(xml).close()
    })
  } catch (e) {
    store.msg = 'ERR>>'
    console.log(e)
  }
}

// MapBox requires long/lat
function convertCoords (projection) {
  console.log('starting conversion', projection)

  for (let id in store.nodes) {
    let node = store.nodes[id]
    let z = proj4(projection, 'WGS84', node)
    node.x = z.x
    node.y = z.y
  }
  console.log('done')
}

</script>

<style scoped>

/* this is the initial start page layout */
.main-content {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr auto;
  height: 100%;
  padding: 0px;
}

#mymap {
  height: 100%;
  width: 100%;
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  overflow: hidden;
  background: #222;
}

.controls {
  padding-left: 50px;
  padding-bottom: 10px;
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  border-top: solid 1px;
  border-color: #ddd;
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
