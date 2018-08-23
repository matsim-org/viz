<template lang="pug">
.main-content
  #mymap
  .controls
    .slider-things(:class="{shrunken: !sharedStore.isSidePanelExpanded}")
      vue-slider.time-slider(v-bind="timeSlider" v-model="timeSliderValue")
      .clock-labels
        .hour &nbsp;
        .hour 3:00
        .hour 6:00
        .hour 9:00
        .hour 12:00
        .hour 15:00
        .hour 18:00
        .hour 21:00
        .hour &nbsp;
  .right-overlay
    h1#clock {{clockTime}}
  .loading-message.ui.segment(v-show='loadingMsg')
    .ui.inverted.active.dimmer
      .ui.text.loader {{ loadingMsg }}
</template>

<script lang="ts">
'use strict'

import sharedStore, { EventBus } from '../SharedStore'
import { nSQL } from 'nano-sql'
import vueSlider from 'vue-slider-component'
import * as mapboxgl from 'mapbox-gl'
import { LngLat } from 'mapbox-gl/dist/mapbox-gl'
import * as timeConvert from 'convert-seconds'
import pako from 'pako'
import sax from 'sax'
import readBlob from 'read-blob'
import proj4 from 'proj4' // = require('proj4').default

let _linkData: any

// this is a required workaround to get the mapbox token assigned in TypeScript
// see https://stackoverflow.com/questions/44332290/mapbox-gl-typing-wont-allow-accesstoken-assignment
// TODO: move mapbox access token to sharedstore
let mymap: mapboxgl.Map
const writableMapBox: any = mapboxgl
writableMapBox.accessToken =
  'pk.eyJ1IjoidnNwLXR1LWJlcmxpbiIsImEiOiJjamNpemh1bmEzNmF0MndudHI5aGFmeXpoIn0.u9f04rjFo7ZbWiSceTTXyA'

const mySlider = {
  disabled: false,
  dotSize: 24,
  height: 10,
  min: 0,
  max: 86399,
  piecewise: false,
  show: true,
  tooltip: 'always',
  width: '100%',
  tooltipDir: 'center',
  sliderStyle: [{ backgroundColor: '#f05b72' }, { backgroundColor: '#3498db' }],
  tooltipStyle: [
    {
      backgroundColor: '#f05b72',
      borderColor: '#f05b72',
    },
    {
      backgroundColor: '#3498db',
      borderColor: '#3498db',
    },
  ],
  bgStyle: {
    backgroundImage: '-webkit-linear-gradient(left, #eee, #eee)',
    boxShadow: '1px 1px 2px 1px rgba(0,0,0,.36)',
  },
  processStyle: {
    backgroundColor: '#00bb5588',
    borderColor: '#f05b72',
  },
  formatter: function(index: number) {
    return convertSecondsToClockTimeMinutes(index)
  },
}

interface MapElement {
  lngLat: LngLat
  features: any[]
}

interface StoreType {
  sharedStore: any
  currentTimeSegment: number
  nodes: any
  links: any
  flows: any
  flowSummary: number[]
  msg: string
  timeSlider: any
  timeSliderValue: 0
  setTimeSegment: any
  loadingMsg: string
}

// store is the component data store -- the state of the component.
const store: StoreType = {
  sharedStore: sharedStore.state,
  currentTimeSegment: 0,
  nodes: {},
  links: {},
  loadingMsg: '',
  flows: {},
  flowSummary: Array.apply(null, new Array(96)).map(() => 0),
  msg: '',
  timeSlider: mySlider,
  timeSliderValue: 0,
  setTimeSegment: function(segment: number) {
    this.currentTimeSegment = segment
  },
}

function convertSecondsToClockTimeMinutes(index: number) {
  try {
    const hms = timeConvert(index)
    const minutes = ('00' + hms.minutes).slice(-2)
    return `${hms.hours}:${minutes}`
  } catch (e) {
    return ''
  }
}

function convertSecondsToClockTime(index: number) {
  const hms = timeConvert(index)
  const minutes = ('00' + hms.minutes).slice(-2)
  const seconds = ('00' + hms.seconds).slice(-2)
  return `${hms.hours}:${minutes}:${seconds}`
}

function sliderChangedEvent(seconds: number) {
  updateFlowsForTimeValue(seconds)
}

function updateFlowsForTimeValue(seconds: number) {
  const segment = Math.floor(seconds / 900) // 15 minutes

  // nothing to do if segment hasn't changed
  if (segment === store.currentTimeSegment) return

  store.setTimeSegment(segment)

  for (const link of _linkData.features) {
    const id = link.properties.id
    link.properties.color = calculateColorFromVolume(id)
  }

  const z: any = mymap.getSource('my-data')
  z.setData(_linkData)

  if (sharedStore.debug) console.log('done')
}

function updateTimeSliderSegmentColors(segments: number[]) {
  let gradient = '-webkit-linear-gradient(left'
  const total = segments.reduce((sum, current) => sum + current)

  for (const segment of segments) {
    if (sharedStore.debug) console.log(segment)

    const percent = 100.0 * segment / total
    let color = ',#eee'
    if (percent > 50) color = ',#04f'
    else if (percent > 20) color = ',#33c'
    else if (percent > 10) color = ',#669'
    else if (percent > 5) color = ',#99c'
    else if (percent > 0) color = ',#aaf'
    gradient += color
  }
  gradient += ')'

  store.timeSlider.bgStyle.backgroundImage = gradient
}

// mounted is called by Vue after this component is installed on the page
function mounted() {
  mymap = new mapboxgl.Map({
    bearing: 0,
    center: [14.35, 51.75], // lnglat, not latlng (think of it as: x,y)
    container: 'mymap',
    logoPosition: 'bottom-right',
    style: 'mapbox://styles/mapbox/light-v9',
    pitch: 0,
    zoom: 11,
  })

  // do things that can only be done after MapBox is fully initialized
  mymap.on('style.load', mapIsReady)
  setupEventListeners()
  loadDataFiles()
}

function mapIsReady() {
  mymap.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
}

function setupEventListeners() {
  EventBus.$on('sidebar-toggled', (isVisible: boolean) => {
    console.log(`Sidebar is now: ${isVisible} :)`)
    // map needs to be force-recentered, and it is slow.
    for (const delay of [50, 100, 150, 200, 250, 300]) {
      setTimeout(function() {
        mymap.resize()
      }, delay)
    }
  })
}

function constructGeoJsonFromLinkData() {
  const geojsonLinks = []

  for (const id in store.links) {
    if (store.links.hasOwnProperty(id)) {
      const link = store.links[id]
      const fromNode = store.nodes[link.from]
      const toNode = store.nodes[link.to]

      const coordinates = [[fromNode.x, fromNode.y], [toNode.x, toNode.y]]

      const featureJson = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates,
        },
        properties: { id: id, color: '#aaa' },
      }

      geojsonLinks.push(featureJson)
    }
  }

  _linkData = {
    type: 'FeatureCollection',
    features: geojsonLinks,
  }

  return _linkData
}

function addLinksToMap() {
  const linksAsGeojson: any = constructGeoJsonFromLinkData()

  mymap.addSource('my-data', {
    data: linksAsGeojson,
    type: 'geojson',
  })

  console.log({ links: linksAsGeojson, boop: mymap.getStyle().layers })

  mymap.addLayer(
    {
      id: 'my-layer',
      source: 'my-data',
      type: 'line',
      paint: {
        'line-opacity': 1.0,
        'line-width': 3, // ['get', 'width'],
        'line-color': ['get', 'color'],
      },
    },
    'road-primary'
  ) // layer gets added just *above* this MapBox-defined layer.

  mymap.on('click', 'my-layer', function(e: MapElement) {
    clickedOnLink(e)
  })

  // turn "hover cursor" into a pointer, so user knows they can click.
  mymap.on('mousemove', 'my-layer', function(e: MapElement) {
    mymap.getCanvas().style.cursor = e ? 'pointer' : '-webkit-grab'
  })

  // and back to normal when they mouse away
  mymap.on('mouseleave', 'my-layer', function() {
    mymap.getCanvas().style.cursor = '-webkit-grab'
  })
}

function calculateColorFromVolume(id: string) {
  const volume = store.flows[id]
    ? store.flows[id][store.currentTimeSegment] ? store.flows[id][store.currentTimeSegment] : 0
    : 0

  if (volume === 0) return '#aaa'
  if (volume < 20) return '#69f'
  if (volume < 100) return '#fc6'

  return '#f66'
}

function clickedOnLink(e: MapElement) {}

nSQL('events')
  .config({ mode: 'TEMP' })
  .model([
    { key: 'id', type: 'int', props: ['pk'] },
    { key: 'time', type: 'int', props: ['idx'] },
    { key: 'actType', type: 'string' },
    { key: 'person', type: 'string' },
    { key: 'type', type: 'string', props: ['idx'] },
    { key: 'link', type: 'string' },
    { key: 'vehicle', type: 'string', props: ['idx'] },
    { key: 'networkMode', type: 'string', props: ['idx'] },
    { key: 'legMode', type: 'string', props: [] },
    { key: 'relativePosition', type: 'string', props: [] },
  ])
nSQL().connect()

async function aggregate15minutes(): Promise<void> {
  console.log('START 15-MIN AGGREGATION')
  store.loadingMsg = 'Aggregating'

  nSQL('events')
    .query('select')
    // .where(['type', 'IN', ['left link', 'vehicle leaves traffic']])
    .exec()
    .then(rows => {
      console.log('got so many rows:', rows.length)
      for (const row of rows) {
        const period = Math.floor(row.time / 900)
        if (!store.flows[row.link]) store.flows[row.link] = {}
        if (!store.flows[row.link][period]) store.flows[row.link][period] = 0
        store.flows[row.link][period]++
        store.flowSummary[period]++
      }
      console.log({ flows: store.flowSummary })
      updateTimeSliderSegmentColors(store.flowSummary)
      addLinksToMap()
      store.loadingMsg = ''
    })
}

async function readEventsFile() {
  store.loadingMsg = 'Loading Events'

  const events: any[] = []
  const timeIndex: any = {}
  const typeIndex: any = {}

  let idAutoInc = 0
  const saxparser = sax.parser(true, {}) // strictmode=true

  saxparser.onopentag = function(tag: any) {
    if (tag.name === 'event') {
      const attr = tag.attributes

      attr.id = ++idAutoInc
      const key = parseInt(attr.time, 10)
      attr.time = key
      events.push(attr)

      // create indices, too
      if (!timeIndex[key]) timeIndex[key] = []
      timeIndex[key].push(attr.id)
      if (!typeIndex[attr.type]) typeIndex[attr.type] = []
      typeIndex[attr.type].push(attr.id)
    }
  }

  saxparser.onend = function() {
    store.loadingMsg = 'Analyzing'
    console.log('START CONVERTING INDEX', events.length, 'events')
    const zTime = []
    for (const id in timeIndex) {
      if (timeIndex.hasOwnProperty(id)) zTime.push({ id: id, rows: timeIndex[id] })
    }
    const zType = []
    for (const id in typeIndex) {
      if (typeIndex.hasOwnProperty(id)) zType.push({ id: id, rows: typeIndex[id] })
    }

    console.log('START RAW EVENT DB IMPORT', events.length, 'events')
    nSQL()
      .rawImport({
        events: events,
        _events_idx_time: zTime,
        _events_idx_type: zType,
      })
      .then(() => {
        console.log('DONE EVENTS')
        aggregate15minutes()
      })
  }

  console.log('Start EVENTS')

  try {
    const url = '/data-cottbus/events.xml.gz'
    // let url = 'http://svn.vsp.tu-berlin.de/repos/public-svn/matsim/scenarios/countries/de/berlin/2014-08-01_car_1pct/network.xml.gz'
    // let url = 'http://matsim-viz.surge.sh/static/data-cottbus/network.xml.gz'
    const resp = await fetch(url, { mode: 'no-cors' })
    const blob = await resp.blob()
    // get the blob data
    readBlob.arraybuffer(blob).then((content: any) => {
      const xml = pako.inflate(content, { to: 'string' })
      saxparser.write(xml).close()
    })
  } catch (e) {
    store.msg = 'ERR>>'
    console.log(e)
  }
}

async function readNetworkFile() {
  const saxparser = sax.parser(true, {}) // strictmode=true

  store.loadingMsg = 'Reading Network'

  saxparser.onopentag = function(tag: any) {
    const attr = tag.attributes

    if (tag.name === 'node') {
      attr.x = parseFloat(attr.x)
      attr.y = parseFloat(attr.y)
      store.nodes[attr.id] = attr
    }

    if (tag.name === 'link') {
      store.links[attr.id] = attr
    }
  }

  const COTTBUS_PROJECTION = '+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs'

  saxparser.onend = function() {
    convertCoords(COTTBUS_PROJECTION)
  }

  try {
    const url = '/data-cottbus/network.xml.gz'
    // let url = 'http://svn.vsp.tu-berlin.de/repos/public-svn/matsim/scenarios/countries/de/berlin/2014-08-01_car_1pct/network.xml.gz'
    // let url = 'http://matsim-viz.surge.sh/static/data-cottbus/network.xml.gz'
    const resp = await fetch(url, { mode: 'no-cors' })
    const blob = await resp.blob()
    // get the blob data
    readBlob.arraybuffer(blob).then((content: any) => {
      const xml = pako.inflate(content, { to: 'string' })
      saxparser.write(xml).close()
    })
  } catch (e) {
    store.msg = 'ERR>>'
    console.log(e)
  }
}

async function loadDataFiles() {
  readNetworkFile()
  readEventsFile()
}

// MapBox requires long/lat
function convertCoords(projection: any) {
  console.log('starting conversion', projection)

  for (const key of Object.keys(store.nodes)) {
    const node = store.nodes[key]
    const z = proj4(projection, 'WGS84', node) as any
    node.x = z.x
    node.y = z.y
  }
}

// this export is the Vue Component itself
export default {
  name: 'NetworkFlows',
  components: {
    vueSlider,
  },
  computed: {
    clockTime: function() {
      return convertSecondsToClockTime(store.timeSliderValue)
    },
  },
  data() {
    return store
  },
  mounted: function() {
    mounted()
  },
  methods: {
    loadData: loadDataFiles,
  },
  watch: {
    timeSliderValue: sliderChangedEvent,
  },
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

.loading-message {
  grid-row: 1 / 2;
  grid-column: 1 / 3;
  overflow: hidden;
  opacity: 0.8;
}

.right-overlay {
  grid-row: 1 / 3;
  grid-column: 2 / 3;
  z-index: 5000;
  pointer-events: none;
}

#clock {
  color: #36f;
  background-color: #fffb;
  margin: 10px 10px;
  padding: 0px 10px;
  border: solid 1px;
  border-color: #bbb;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.2);
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
  margin-bottom: 5px;
}

.shrunken {
  margin-left: 38px;
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
  margin-top: 10px;
}

.post {
  margin-top: 20px;
}

.clock-labels {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
  grid-template-rows: auto;
  width: 100%;
  font-size: 10px;
  margin-bottom: 0px;
  margin-top: -27px;
  pointer-events: none;
  z-index: 2;
}
</style>
