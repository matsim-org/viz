<template lang="pug">
#zcontainer
  #mymap
  .status-blob(v-if="loadingText"): h2 {{ loadingText }}
</template>

<script lang="ts">
'use strict'

import mapboxgl from 'mapbox-gl'
import FileAPI from '@/communication/FileAPI'
import sharedStore from '@/SharedStore'
import EventBus from '@/EventBus.vue'
import { LngLat } from 'mapbox-gl/dist/mapbox-gl'
import readBlob from 'read-blob'
import SharedStore from '../SharedStore'
import Vue from 'vue'

// register component with the shared store
SharedStore.addVisualizationType({
  typeName: 'network-volume-plot',
  prettyName: 'Network Volume Plot',
  description: 'Depicting volumes, V/C ratios, etc on a network plot.',
  requiredFileKeys: ['geoJson'],
  requiredParamKeys: [],
})

// store is the component data store -- the state of the component.
const store: any = {
  loadingText: 'Network Volume Plot',
  visualization: null,
  project: {},
  api: FileAPI,
}

// this export is the Vue Component itself
export default Vue.extend({
  name: 'NetworkViz',
  props: ['fileApi'],
  components: {},
  data() {
    return store
  },
  created() {
    store.api = (this as any).fileApi
  },
  mounted: function() {
    store.projectId = (this as any).$route.params.projectId
    store.vizId = (this as any).$route.params.vizId
    mounted()
  },
  methods: {},
  watch: {},
})

async function mounted() {
  await getVizDetails()
  setBreadcrumb()
  setupMap()
}

function setBreadcrumb() {
  EventBus.$emit('set-breadcrumbs', [
    { title: store.project.name, link: '/project/' + store.projectId },
    { title: 'viz-' + store.vizId.substring(0, 4), link: '#' },
  ])
}

function setupMap() {
  map = new mapboxgl.Map({
    bearing: 0,
    center: [13.4, 52.5], // lnglat, not latlng
    container: 'mymap',
    logoPosition: 'bottom-left',
    style: 'mapbox://styles/mapbox/light-v9',
    pitch: 0,
    zoom: 11,
  })

  map.on('style.load', mapIsReady)
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')
}

async function getVizDetails() {
  store.visualization = await store.api.fetchVisualization(store.projectId, store.vizId)
  store.project = await store.api.fetchProject(store.projectId)
  console.log(Object.assign({}, store.visualization))
}

let map: mapboxgl.Map

interface MapElement {
  lngLat: LngLat
  features: any[]
}

async function loadNetwork() {
  try {
    const ROAD_NET = store.visualization.inputFiles.geoJson.fileEntry.id
    console.log({ ROAD_NET, PROJECT: store.projectId })
    // store.loadingText = 'Loading network...'
    // get the blob data
    const roadBlob = await store.api.downloadFile(ROAD_NET, store.projectId)
    let road = await readBlob.text(roadBlob)
    road = JSON.parse(road)

    return road
  } catch (e) {
    console.error(e)
    return null
  }
}

// Called immediately after MapBox is ready to draw the map
async function mapIsReady() {
  const json = await loadNetwork()
  if (!json) {
    store.loadingText('Problem loading network, sorry')
    return
  }

  calculateLinkProperties(json)
  addJsonToMap(json)
  setupMapListeners()
  store.loadingText = ''
}

function calculateLinkProperties(json: any) {
  for (const link of json.features) {
    link.properties.width = link.properties['base case (demand)_agents'] / 200
    if (link.properties.width < 3) link.properties.width = 2
    link.properties.vc = (1.0 * link.properties['base case (demand)_agents']) / link.properties.capacity
  }
}

function addJsonToMap(json: any) {
  map.addSource('my-data', {
    data: json,
    type: 'geojson',
  })

  map.addLayer(
    {
      id: 'my-layer',
      source: 'my-data',
      type: 'line',
      paint: {
        'line-opacity': 0.8,
        'line-width': ['get', 'width'],
        'line-color': {
          property: 'vc',
          stops: [[0.4, '#04c'], [0.8, '#084'], [1.0, '#0a0'], [1.3, '#cc0'], [1.7, '#fc0'], [2.0, '#800']],
        },
      },
      // });
    },
    'road-primary'
  ) // layer gets added just *above* this MapBox-defined layer.
}

function setupMapListeners() {
  map.on('click', 'my-layer', function(e: MapElement) {
    clickedOnTaz(e)
  })

  // turn "hover cursor" into a pointer, so user knows they can click.
  map.on('mousemove', 'my-layer', function(e: MapElement) {
    map.getCanvas().style.cursor = e ? 'pointer' : '-webkit-grab'
  })

  // and back to normal when they mouse away
  map.on('mouseleave', 'my-layer', function() {
    map.getCanvas().style.cursor = '-webkit-grab'
  })
}

let _popup

// clickedOnTaz: called when user... clicks on the taz
function clickedOnTaz(e: MapElement) {
  console.log(e)

  // cancel old close-popup event because it messes with event ordering
  // if (_popup) _popup.off('close', closePopupEvent);

  // the browser delivers some details that we need, in the fn argument 'e'
  const props = e.features[0].properties

  // highlight the zone that we clicked on, using this weird filter thing in MapBox API
  // see https://www.mapbox.com/mapbox-gl-js/example/hover-styles/
  // mymap.setFilter("highlight-layer", ["==", "id", props.id]);

  // build HTML of popup window
  let html = `<h4>Raw Values:</h4>`
  html +=
    'Freespeed: ' +
    props.Freespeed.toFixed(2) +
    '<br>' +
    'capacity: ' +
    props.capacity.toFixed(2) +
    '<br>' +
    'demand: ' +
    props['base case (demand)_agents']

  /* for (let altname in _activeDataset.alternatives) {
    let column = _activeDataset.alternatives[altname].column;
    let value = props[column].toFixed(4);
    html += `<p class="popup-value"><b>${altname}:</b> ${value}</p>`;
  } */

  _popup = new mapboxgl.Popup({ closeOnClick: true }).setLngLat(e.lngLat).setHTML(html)

  // add a close-event, to remove highlight if user closes the popup
  // _popup.on('close', closePopupEvent);

  // create the popup!
  _popup.addTo(map)
}
</script>

<style scoped>
#zcontainer {
  background-color: black;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  margin: 0px 0px 0px 0px;
  padding: 0px 0px 0px 0px;
}

#mymap {
  position: absolute;
  top: 3rem;
  bottom: 0;
  width: 100%;
  background-color: white;
  overflow: hidden;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

.status-blob {
  background-color: white;
  box-shadow: 0 0 8px #00000040;
  opacity: 0.9;
  margin: auto 0px auto -10px;
  padding: 3rem 0px;
  text-align: center;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  z-index: 99;
  border-top: solid 1px #479ccc;
  border-bottom: solid 1px #479ccc;
}

.status-blob p,
h2 {
  color: #555;
  font-weight: normal;
}
</style>
