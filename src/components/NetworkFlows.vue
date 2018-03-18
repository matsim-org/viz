<template lang="pug">
.main-content
  #mymap
  .controls
    button.ui.tiny.red.button(@click="doIt" :class="{shrunken: !sharedStore.isSidePanelExpanded}") DO IT!
    .slider-things
      vue-slider.time-slider(v-bind="timeSlider" v-model="timeSliderValue")
      .clock-labels
        .hour 0
        .hour 3:00
        .hour 6:00
        .hour 9:00
        .hour 12:00
        .hour 15:00
        .hour 18:00
        .hour 21:00
        .hour 24
  h1#clock {{clockTime}}
</template>

<script>
'use strict';

import { BigStore, EventBus } from '../shared-store.js';
import mapboxgl from 'mapbox-gl';
import { nSQL } from 'nano-sql';
import vueSlider from 'vue-slider-component';

let pako = require('pako')
let sax = require('sax')
let readBlob = require('read-blob')
let proj4 = require('proj4').default

let L = require('leaflet');

let mySlider = {
  disabled: false,
  dotSize: 24,
  height: 10,
  min: 0,
  max: 86399,
  piecewise: false,
  show: true,
  tooltip: "always",
  width: "100%",
  tooltipDir: [],
  sliderStyle: [
    {"backgroundColor": "#f05b72"},
    {"backgroundColor": "#3498db"}
  ],
  tooltipStyle: [
    {"backgroundColor": "#f05b72",
     "borderColor": "#f05b72"
    },
    {"backgroundColor": "#3498db",
      "borderColor": "#3498db"
    }
  ],
  bgStyle: {
    "backgroundImage": "-webkit-linear-gradient(left, #fff,#fff,#fff,#fff,#fff,#fff,#205b72, #fff,#fff,#fff, #3498db, #fff)",
    "boxShadow": "inset 0.5px 0.5px 3px 1px rgba(0,0,0,.36)"
  },
  processStyle: {
    backgroundColor: "#00bb5588",
    borderColor: "#f05b72"
  },
  formatter: function(index) {
    return convertSecondsToClockTime(index);
  },
}

function convertSecondsToRoundClockTime(index) {
  let segment = Math.floor(index / 900)
  let hour = Math.floor(segment/4)
  let minutes = 15 * (segment - hour * 4)
  minutes = ("00" + minutes).slice (-2)
  return `${hour}:${minutes}`
}

function convertSecondsToClockTime(index) {
  let segment = Math.floor(index / 900)
  let hour = Math.floor(segment/4)
  let minutes = Math.floor((index - hour * 3600) / 60)
  minutes = ("00" + minutes).slice (-2)
  return `${hour}:${minutes}`
}

/* const hourLabels = ['0:00','1 AM','2 AM',
                  '3 AM','4 AM','5 AM','6 AM','7 AM',
                  '8 AM','9 AM','10 AM','11 AM',
                  'Noon','1 PM','2 PM','3 PM',
                  '4 PM','5 PM','6 PM','7 PM',
                  '8 PM','9 PM','10 PM','11 PM']
*/

// store is the component data store -- the state of the component.
let store = {
  sharedStore: BigStore.state,
  currentTimeSegment: 0,
  nodes: {},
  links: {},
  flows: {},
  flowSummary: new Array(96).fill(0),
  msg: '',
  timeSlider: mySlider,
  timeSliderValue: 0,
  setTimeSegment: function (segment) {
    this.currentTimeSegment = segment;
  }
}

// this export is the Vue Component itself
export default {
  name: 'NetworkFlows',
  components: {
    vueSlider,
  },
  computed: {
      clockTime: function () {
        return convertSecondsToClockTime(store.timeSliderValue)
      }
  },
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
    timeSliderValue: sliderChangedEvent
  },
}

let mymap;

function sliderChangedEvent (seconds) {
  updateFlowsForTimeValue(seconds)
}

function updateFlowsForTimeValue(seconds) {
  let segment = Math.floor(seconds/900); // 15 minutes
  store.setTimeSegment(segment)

  _linkLayers.eachLayer(function (layer) {
    layer.setStyle(calculateColorFromVolume(layer.linkID))
    layer.redraw()
  });
  console.log('done')
}

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

let _linkLayers;

function addLinksToMap () {
  _linkLayers = L.featureGroup().addTo(mymap);

  for (let id in store.links) {
    let link = store.links[id]
    let fromNode = store.nodes[link.from]
    let toNode = store.nodes[link.to]

    let layer = L.polyline([
      [fromNode.y, fromNode.x],
      [toNode.y, toNode.x]
    ], calculateColorFromVolume(id))

    layer.linkID = id;
    _linkLayers.addLayer(layer)
  }
}

function calculateColorFromVolume (id) {
  let volume = store.flows[id] ?
    (store.flows[id][store.currentTimeSegment] ?
      store.flows[id][store.currentTimeSegment] : 0) : 0;

  if (volume > 100) return { color: '#f66', weight: 4}
  if (volume > 20) return { color: '#fc6', weight: 3}
  if (volume > 1) return { color: '#69f', weight: 3}

  return { color: '#ddd', weight: 2}
}

nSQL('events').config({mode: 'TEMP'}).model([
  {key: 'id', type: 'int', props: ['pk']},
  {key: 'time', type: 'int', props: ['idx']},
  {key: 'actType', type: 'string'},
  {key: 'person', type: 'string'},
  {key: 'type', type: 'string', props: ['idx']},
  {key: 'link', type: 'string'},
  {key: 'vehicle', type: 'string', props: ['idx']},
  {key: 'networkMode', type: 'string', props: ['idx']},
  {key: 'legMode', type: 'string', props: []},
  {key: 'relativePosition', type: 'string', props: []},
])
nSQL().connect()

async function aggregate15minutes () {
  console.log('START 15-MIN AGGREGATION')
  nSQL('events').query('select')
    .where(['type', 'IN', ['left link','vehicle leaves traffic']])
    .exec().then(function (rows, db) {
      console.log('got so many rows:',rows.length)
      for (let row of rows) {
        let period = Math.floor(row.time / 900)
        if (!store.flows[row.link]) store.flows[row.link] = {}
        if (!store.flows[row.link][period]) store.flows[row.link][period] = 0
        store.flows[row.link][period]++
        store.flowSummary[period]++
      }
      console.log({flows: store.flowSummary})
  })
}

async function testQuery () {
  console.log('START QUERY')
  nSQL('events').query('select').where(['time', 'BETWEEN', [23499, 23550]]).exec().then(function (rows, db) {
    console.log({QUERY_RESULTS_LEN: rows.length, QUERY_RESULTS: rows})
  })
}

async function readEventsFile () {
  let events = []
  let time_idx = {}
  let type_idx = {}

  let id_auto_inc = 0;
  let saxparser = sax.parser(true); // strictmode=true

  saxparser.onopentag = function (tag) {
    if (tag.name === 'event') {
      let attr = tag.attributes

      attr.id = ++id_auto_inc;
      let key = parseInt(attr.time)
      attr.time = key
      events.push(attr)

      // create indices, too
      if (!time_idx[key]) time_idx[key] = []
      time_idx[key].push(attr.id)
      if (!type_idx[attr.type]) type_idx[attr.type] = []
      type_idx[attr.type].push(attr.id)
    }
  }

  saxparser.onend = function () {
    console.log('START CONVERTING INDEX', events.length, 'events')
    let z_time = []
    for (let id in time_idx) {
      z_time.push({id: id, rows: time_idx[id]})
    }
    let z_type = []
    for (let id in type_idx) {
      z_type.push({id: id, rows: type_idx[id]})
    }

    console.log('START RAW EVENT DB IMPORT', events.length, 'events')
    nSQL().rawImport({
      events: events,
      _events_idx_time: z_time,
      _events_idx_type: z_type,
    }).then(() => {
      console.log('DONE EVENTS')
      // testQuery();
      aggregate15minutes()
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
  let saxparser = sax.parser(true) // strictmode=true

  saxparser.onopentag = function (tag) {
    let attr = tag.attributes

    if (tag.name === 'node') {
      attr.x = parseFloat(attr.x)
      attr.y = parseFloat(attr.y)
      store.nodes[attr.id] = attr
    }

    if (tag.name === 'link') {
      store.links[attr.id] = attr
    }
  }

  saxparser.onend = function () {
    convertCoords('+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs')
    addLinksToMap()
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
  grid-template-columns: 1fr auto;
  grid-template-rows: 1fr auto;
  height: 100%;
  padding: 0px;
}

#mymap {
  height: 100%;
  width: 100%;
  grid-row: 1 / 2;
  grid-column: 1 / 3;
  overflow: hidden;
  background: #eee;
}

#clock {
  grid-row: 1 / 2;
  grid-column: 2 / 3;
  color: #c00;
  z-index: 5000;
  margin: 10px 10px 0px 0px;
}

.controls {
  display: flex;
  border-top: solid 1px;
  border-color: #ddd;
  grid-row: 2 / 3;
  grid-column: 1 / 3;
  padding: 4px 28px 4px 5px;
  width: 100%;

}

.slider-things {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.shrunken { margin-left: 38px;}

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

.time-slider {}

.clock-labels {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
  grid-template-rows: auto;
  width: 100%;
  margin-bottom: 0px;
  margin-top: -6px;
}

</style>
