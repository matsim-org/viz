<template lang="pug">
.main-content
  #mymap
  .controls
    button.ui.tiny.red.button(@click="doIt" :class="{shrunken: !sharedStore.isSidePanelExpanded}") DO IT!
</template>

<script>
'use strict';

import { BigStore, EventBus } from '../shared-store.js';
import mapboxgl from 'mapbox-gl';
import { nSQL } from 'nano-sql';

let pako = require('pako')
let sax = require('sax')
let readBlob = require('read-blob')
let proj4 = require('proj4').default

let L = require('leaflet');

// import { BigStore } from '../shared-store.js';
// store is the component data store -- the state of the component.
let store = {
  nodes: {},
  links: {},
  msg: '',
  sharedStore: BigStore.state,
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
    'outdoors' +
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

function addLinksToMap () {
  for (let id in store.links) {
    let link = store.links[id]
    let fromNode = store.nodes[link.from]
    let toNode = store.nodes[link.to]

    let width = 2; // link.permlanes * link.permlanes
    let color = '#00996680'
    if (parseInt(link.capacity) > '1000') color = 'blue'

    L.polyline([
      [fromNode.y, fromNode.x],
      [toNode.y, toNode.x]
    ], {color: color, weight: width}).addTo(mymap);
  }
}

nSQL('events').config({mode: 'TEMP'}).model([
  {key: 'id', type: 'int', props: ['pk']},
  {key: 'time', type: 'int', props: ['idx']},
  {key: 'actType', type: 'string'},
  {key: 'person', type: 'string'},
  {key: 'type', type: 'string'},
  {key: 'link', type: 'string'},
  {key: 'vehicle', type: 'string', props: ['idx']},
  {key: 'networkMode', type: 'string', props: ['idx']},
  {key: 'legMode', type: 'string', props: []},
  {key: 'relativePosition', type: 'string', props: []},
])
nSQL().connect()

async function testQuery() {
  console.log("START QUERY")
  nSQL("events").query("select").where(["time", "BETWEEN", [23499,23550]]).exec().then(function(rows, db) {
    console.log({QUERY_RESULTS_LEN: rows.length, QUERY_RESULTS: rows})
  })
}

async function readEventsFile () {
  let events = []
  let time_idx = {}

  let id_auto_inc = 0;
  let saxparser = sax.parser(true); // strictmode=true

  saxparser.onopentag = function (tag) {
    if (tag.name === 'event') {
      let attr = tag.attributes

      attr.id = ++id_auto_inc;
      let key = parseInt(attr.time)
      attr.time = key
      events.push(attr)

      // create index, too
      if (!time_idx[key]) time_idx[key] = []
      time_idx[key].push(attr.id)
    }
  }

  saxparser.onend = function () {
    console.log('START CONVERTING INDEX', events.length, 'events')
    let z = []
    for (let id in time_idx) {
      z.push({id:id, rows:time_idx[id]})
    }

    console.log('START RAW EVENT DB IMPORT', events.length, 'events')
    nSQL().rawImport({
    	events: events,
      _events_idx_time: z
    }).then(() => {
      console.log('DONE EVENTS')
      testQuery();
    })
  }

  console.log('Start EVENTS')

  try {
    let url = '/static/data-cottbus/events.xml.gz'
    // let url = 'http://svn.vsp.tu-berlin.de/repos/public-svn/matsim/scenarios/countries/de/berlin/2014-08-01_car_1pct/network.xml.gz'
    // let url = 'http://matsim-viz.surge.sh/static/data-cottbus/network.xml.gz'
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

async function readNetworkFile () {
  let saxparser = sax.parser(true); // strictmode=true

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
    convertCoords('+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs')
    addLinksToMap();
  }

  try {
    let url = '/static/data-cottbus/network.xml.gz'
    // let url = 'http://svn.vsp.tu-berlin.de/repos/public-svn/matsim/scenarios/countries/de/berlin/2014-08-01_car_1pct/network.xml.gz'
    // let url = 'http://matsim-viz.surge.sh/static/data-cottbus/network.xml.gz'
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

async function doIt () {
  readNetworkFile()
  readEventsFile()
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
  background: #eee;
}

.controls {
  padding: 4px 10px 4px 5px;
  grid-row: 2 / 3;
  grid-column: 1 / 2;
  border-top: solid 1px;
  border-color: #ddd;
}

.shrunken { margin-left: 35px;}

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
