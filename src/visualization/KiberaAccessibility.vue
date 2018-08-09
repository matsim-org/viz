<template lang="pug">
#container
  .ui.modal
      i.close.icon
      .header
        Accessibility Units
      .image.content
        .ui.medium.image
          img(src="kibera.thumb.jpg")
        .description
          .ui.header Accessibility units are the expected maximum utility (EMU) in Euros or other monetary units.
          p In easier terms: The color of a tile/origin tells you how plentiful (land-use aspect) and reachable (transport aspect) facilities/opportunities of a given type are from this location by a given mode of transport.
          p For an explanation of the computation procedure, data acquisition, and interpretation of the measure, see the paper labeled
            b VSP-WP 17-03
            | at the
            a(href="https://www.vsp.tu-berlin.de/publications/vspwp") VSP Publication Site.
      .actions
        .ui.positive.right.labeled.icon.button
          Okay
          i.checkmark.icon

  #page-content
    #titlebar
      h2
        .ui.dropdown
          .text
            div(v-cloak) {{DATASETS[0].city}}: {{DATASETS[0].name}}
          i.dropdown.icon
          .menu
            .item(v-for="(dataset,index) in DATASETS"
                :key="index"
                @click="clickedDataset(index)") {{dataset.city}}: {{dataset.name}}
      #description-panel: div(v-cloak) {{selectedDataset.description}}

      button.ui.right.floated.grey.button(v-for="item of alternatives"
              :key="item"
              :class="{ active: item==selectedAlt, green: item==selectedAlt }"
              @click="clickedAlternative(item)") {{item}}
    #mymap
</template>

<script lang=ts>
'use strict'

import mapboxgl from 'mapbox-gl'
import yaml from 'js-yaml'

import { EventBus } from '../SharedStore'

const SERVER_ADDR = 'http://geo.vsp.tu-berlin.de'
const SERVER_PARAMS =
  '/geoserver/accessibilities/ows?service=WFS' +
  '&version=1.0.0&request=GetFeature&outputFormat=application%2Fjson&typeName='

mapboxgl.accessToken =
  'pk.eyJ1IjoidnNwLXR1LWJlcmxpbiIsImEiOiJjamNpemh1bmEzNmF0MndudHI5aGFmeXpoIn0.u9f04rjFo7ZbWiSceTTXyA'

const STARTING_MODE = 'Walk'

// some global variables save some state for us.
let _activeDataLayer: any
let _activeDataset: any = { alternatives: [] }
let _chosenCity: any
let _popup: any

let mymap: mapboxgl.Map

let COLORS: any = {}

// store is the component data store -- the state of the component.
const store = {
  selectedAlt: STARTING_MODE,
  selectedDataset: _activeDataset,
  showUnitModal: false,
  DATASETS: [{ city: '', name: '' }],
  alternatives: Object.keys(_activeDataset.alternatives).reverse(), // reversed so they right-justify in the right order
}

// this export is the Vue Component itself
export default {
  name: 'KiberaAccessibility',
  components: {},
  data() {
    return store
  },
  mounted: function() {
    mounted()
  },
  methods: {
    clickedDataset: userChoseDataset,
    clickedAlternative: userChoseAlternative,
  },
  watch: {},
}

// mounted is called by Vue after this component is installed on the page
async function mounted() {
  store.DATASETS = await loadDatasetsFromFile()
  COLORS = await loadColorsFromFile()

  _activeDataset = store.DATASETS[0]
  store.selectedDataset = _activeDataset
  store.alternatives = Object.keys(_activeDataset.alternatives).reverse()

  mymap = new mapboxgl.Map({
    bearing: 0,
    center: _activeDataset.lnglat,
    container: 'mymap',
    logoPosition: 'bottom-right',
    style: 'mapbox://styles/vsp-tu-berlin/cjehd7p9v2uby2rmt79ks2s94',
    pitch: 10,
    zoom: _activeDataset.zoom,
  })

  // semantic requires this line for dropdowns to work
  // https://stackoverflow.com/questions/25347315/semantic-ui-dropdown-menu-do-not-work
  // tslint:disable-next-line
  $('.ui.dropdown').dropdown()

  // Start doing stuff AFTER the MapBox library has fully initialized
  mymap.on('style.load', mapIsReady)

  setupEventListeners()
}

function setupEventListeners() {
  EventBus.$on('sidebar-toggled', (isVisible: any) => {
    console.log(`Sidebar is now: ${isVisible} :)`)
    // map needs to be force-recentered, and it is slow.
    for (const delay of [50, 100, 150, 200, 250, 300]) {
      setTimeout(function() {
        mymap.resize()
      }, delay)
    }
  })
}

// Called immediately after MapBox is ready to draw the map
function mapIsReady() {
  // Add map chatchkies
  mymap.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
  tweakMapColors()
  loadDatasets()
  addAccessibilityLayer(STARTING_MODE)
}

// Add the dataset layer corresponding to our chosen alternative
async function addAccessibilityLayer(alt: string) {
  console.log('--City: ' + _activeDataset.city)
  console.log('--Dataset: ' + _activeDataset.name)
  console.log('--Alternative: ' + alt)

  const alternative = _activeDataset.alternatives[alt]
  const geoserverLayerId = alternative.geoserver
  console.log('--Geoserver Layer: ' + geoserverLayerId)

  // choose correct colors: dataset has default colorScale,
  // but alternative can override this setting.
  let colorRamp: any = COLORS[_activeDataset.colorScale]
  if ('colorScale' in alternative) {
    colorRamp = COLORS[alternative.colorScale]
  }

  mymap.addLayer(
    {
      id: geoserverLayerId,
      source: geoserverLayerId,
      type: 'fill',
      paint: {
        'fill-opacity': 0.9,
        'fill-color': {
          property: alternative.column,
          stops: [[-5, '#f00'], [5, '#00f']],
        },
      },
    },
    'water' // layer gets added just *above* this MapBox-defined layer.
  )

  // remove old layer after new layer is added
  if (_activeDataLayer) mymap.removeLayer(_activeDataLayer)
  _activeDataLayer = geoserverLayerId

  // add "highlight" layer: for highlighting the square under the mouse
  mymap.addLayer({
    id: 'highlight-layer',
    type: 'line',
    source: geoserverLayerId,
    paint: {
      'line-color': '#dff',
      'line-width': 5,
    },
    filter: ['==', 'id', ''],
  })

  // turn "hover cursor" into a pointer, so user knows they can click.
  mymap.on('mousemove', geoserverLayerId, function(e: any) {
    mymap.getCanvas().style.cursor = e ? 'pointer' : '-webkit-grab'
  })

  // and back to normal when they mouse away
  mymap.on('mouseleave', geoserverLayerId, function() {
    mymap.getCanvas().style.cursor = '-webkit-grab'
  })

  mymap.on('click', geoserverLayerId, function(e: any) {
    clickedOnTaz(e)
  })

  addLegend(colorRamp)

  mymap.resize() // this prevents some redraw problems in MapBox. Thanks MapBox.
}

// clickedOnTaz: called when user... clicks on the taz ;-)
function clickedOnTaz(e: any) {
  // cancel old close-popup event because it messes with event ordering
  if (_popup) _popup.off('close', closePopupEvent)

  // the browser delivers some details that we need, in the fn argument 'e'
  const props = e.features[0].properties

  // highlight the zone that we clicked on, using this weird filter thing in MapBox API
  // see https://www.mapbox.com/mapbox-gl-js/example/hover-styles/
  mymap.setFilter('highlight-layer', ['==', 'id', props.id])

  // build HTML of popup window
  let html = `<h4>Raw Values:</h4><hr/>`
  for (const altname of _activeDataset.alternatives.keys()) {
    const column = _activeDataset.alternatives[altname].column
    const value = props[column].toFixed(4)
    html += `<p class="popup-value"><b>${altname}:</b> ${value}</p>`
  }

  _popup = new mapboxgl.Popup({ closeOnClick: true }).setLngLat(e.lngLat).setHTML(html)

  // add a close-event, to remove highlight if user closes the popup
  _popup.on('close', closePopupEvent)

  // create the popup!
  _popup.addTo(mymap)
}

function closePopupEvent(p: any) {
  // remove highlight
  mymap.setFilter('highlight-layer', ['==', 'id', ''])
}

function addLegend(colorValues: [number, any]) {
  // remove old legend first
  const mapElement = document.getElementById('mymap')
  if (!mapElement) return

  let legend = document.getElementById('legend')
  if (legend) mapElement.removeChild(legend)

  // add new legend
  legend = document.createElement('div')
  legend.setAttribute('id', 'legend')
  legend.className = 'legend'

  let html = `<h4>Legend:</h4><hr/>`

  // loop through our color-bin intervals and generate a label with a colored square for each interval
  for (const [index, val] of colorValues.entries()) {
    if (index === 0 || index === 10) continue

    let pre = ''
    if (index === 1) pre = '< '
    if (index === 9) pre = '> '

    const breakpoint = val[0]
    const color = val[1]

    html +=
      '<p class="legend-row">' +
      '<i style="background:' +
      color +
      '"></i>&nbsp;' +
      '<b>' +
      pre +
      breakpoint +
      '</b>' +
      (colorValues[index + 1] ? '<br>' : '') +
      '</p>'
  }

  html += '<button id="units" class="ui tiny inverted green button">in EMU Units</button>'
  legend.innerHTML = html

  mapElement.appendChild(legend)
  const units = document.getElementById('units')
  if (units) units.addEventListener('click', clickedUnits, false)
}

// Show units modal-dialog when user clicks in legend
function clickedUnits() {
  // this is cheating: I'm using jQuery to unhide the modal "What are the units? modal dialog"
  // tslint:disable-next-line
  $('.ui.modal').modal('show')
}

// Add any map color & shape tweaks here
function tweakMapColors() {
  // Currently I like the stark black&white map, with one exception: the water should be blue
  mymap.setPaintProperty('water', 'fill-color', '#8af')
}

// Do things when user clicks on one of the alternative buttons
function userChoseAlternative(alt: any) {
  addAccessibilityLayer(alt)
  store.selectedAlt = alt
}

// Do things when user clicks on one of the dataset dropdown choices
function userChoseDataset(choice: any) {
  // first make sure user didn't just pick the same dataset
  if (store.DATASETS[choice].name === _activeDataset.name) return

  _activeDataset = store.DATASETS[choice]
  store.selectedDataset = _activeDataset

  // stay on selected mode, if we can (e.g., if bike was selected, stay on bike alt in new dataset)
  if (!(store.selectedAlt in _activeDataset.alternatives)) {
    store.selectedAlt = Object.keys(_activeDataset.alternatives)[0]
  }

  // zoom map, if we need to
  if (_activeDataset.city !== _chosenCity) {
    _chosenCity = _activeDataset.city

    mymap.flyTo({
      center: _activeDataset.lnglat,
      zoom: _activeDataset.zoom,
    })
  }

  // update the mode buttons
  store.alternatives = Object.keys(_activeDataset.alternatives).reverse()

  // add the datasets
  loadDatasets()

  // show the layer
  addAccessibilityLayer(store.selectedAlt)
}

// load geoserver data for all alternatives, but just for the one active dataset
function loadDatasets() {
  for (const id of Object.keys(_activeDataset.alternatives)) {
    const alt = _activeDataset.alternatives[id]
    if (!mymap.getSource(alt.geoserver)) {
      const url = SERVER_ADDR + SERVER_PARAMS + alt.geoserver
      mymap.addSource(alt.geoserver, {
        data: url,
        type: 'geojson',
      })
    }
  }
  if (_popup) _popup.remove()
}

// Load dataset definitions
async function loadDatasetsFromFile() {
  try {
    const url = '/kibera-accessibility/datasets.yml'
    const resp = await fetch(url)
    const text = await resp.text()
    const yml = await yaml.safeLoad(text)
    return yml
  } catch (error) {
    console.log('dataset load error: ' + error)
  }
}

// Load color definitions
async function loadColorsFromFile() {
  try {
    const url = '/kibera-accessibility/colors.json'
    const resp = await fetch(url)
    const json = await resp.json()
    return json
  } catch (error) {
    console.log('dataset load error: ' + error)
  }
}
</script>

<style scoped>
[v-cloak] {
  display: none;
}

html,
body {
  width: 100%;
  height: 100%;
  font-family: Noto, Arial;
}

body {
  margin: 0px 0px 0px 0px;
  height: 100%;
}

#page-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

#titlebar {
  background-color: #368;
  padding: 15px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

#mymap {
  flex: 1;
  background: #888;
  height: 100%;
  touch-action: none;
}

#legend {
  position: absolute;
  bottom: 0;
  left: 0;
  margin-bottom: 8px;
  margin-left: 8px;
  z-index: 99;
  background: white;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  padding: 6px 8px;
  font: Arial, Helvetica, sans-serif;
  font-size: 110%;
}

.legend h4 {
  text-align: center;
  margin-bottom: 0px;
  padding-bottom: 0px;
}

.legend i {
  width: 1rem;
  height: 1rem;
  float: left;
  margin-right: 0.25rem;
  opacity: 1;
}

p.legend-row {
  margin-bottom: 3px;
  color: #666;
}

h2 {
  color: #fff;
}

.mapboxgl-popup-content h4 {
  margin-top: 4px;
}

#description-panel {
  color: #ccc;
  margin-bottom: 8px;
}

p.popup-value {
  margin-bottom: 2px;
}

.page {
  height: 100%;
}

.content {
  height: 100%;
  padding-top: 0px;
  padding-left: 0px;
  padding-right: 0px;
  margin-left: 288px;
  margin-right: 0px;
}

/* ------------------- PHONE LAYOUT TWEAKS ----------------- */

@media only screen and (max-device-width: 480px) {
  .ui.dropdown > .text {
    font-size: 80%;
  }

  #description-panel {
    font-size: 80%;
  }
}
</style>
