<template lang="pug">
#container
  #mymap
  .status-blob(v-if="loadingText"): h2 {{ loadingText }}
  .info-blob
    h5.bigtitle Routes on link:
    .route(v-for="route in routesOnLink"
           :key="route.uniqueRouteID"
           :class="{highlightedRoute: selectedRoute && route.id === selectedRoute.id}"
           @click="clickedRouteDetails(route.id)"
    )
      h3.title {{route.id}}
      p.details {{route.departures}} departures
      p.details First: {{route.firstDeparture}}
      p.details Last: {{route.lastDeparture}}

</template>

<script lang="ts">
'use strict'

import mapboxgl from 'mapbox-gl'
import * as turf from '@turf/turf'
import xml2js from 'xml2js'
import colormap from 'colormap'
import proj4 from 'proj4'
import 'mapbox-gl/dist/mapbox-gl.css'

import sharedStore, { EventBus } from '../SharedStore'

const MY_PROJECTION = 'EPSG:2048'
const COLOR_CATEGORIES = 16
const SHOW_STOPS_AT_ZOOM_LEVEL = 11

interface RouteDetails {
  id: string
  departures: number
  firstDeparture: string
  lastDeparture: string
  geojson: any
  routeProfile: string[]
  route: string[]
  transportMode: string
  uniqueRouteID?: number
}

interface Network {
  nodes: { [id: string]: NetworkNode }
  links: { [id: string]: NetworkLink }
}

interface NetworkNode {
  x: number
  y: number
}

interface NetworkInputs {
  road: any
  transit: any
}

interface NetworkLink {
  readonly from: string
  readonly to: string
}

interface TransitLine {
  id: string
  transitRoutes: any[]
}

class Departure {
  public total: number = 0
  public routes: Set<string> = new Set()
}

// Add various projections that we use here
proj4.defs(
  'EPSG:2048',
  '+proj=tmerc +lat_0=0 +lon_0=19 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
)

// store is the component data store -- the state of the component.
const store: any = {
  loadingText: 'MATSim Transit Inspector',
  routeData: {},
  routesOnLink: [],
  selectedRoute: null,
  projectId: null,
  vizId: null,
  visualization: null,
}

let _map: mapboxgl.Map

const _departures: { [linkID: string]: Departure } = {}
const _network: Network = { nodes: {}, links: {} }
const _stopFacilities: { [index: string]: NetworkNode } = {}
const _transitLines: { [index: string]: TransitLine } = {}
const _routeData: { [index: string]: RouteDetails } = store.routeData
const _stopMarkers: any[] = []
let _attachedRouteLayers: string[]

let _linkData
let _maximum = 0

const _colorScale = colormap({ colormap: 'viridis', nshades: COLOR_CATEGORIES })

// this export is the Vue Component itself
export default {
  name: 'App',
  data() {
    return store
  },
  mounted: function() {
    store.projectId = this.$route.params.projectId
    store.vizId = this.$route.params.vizId
    getVizDetails()
    setupMap()
  },
  components: {},
  methods: {
    clickedRouteDetails,
    pressedEscape,
  },
  watch: {},
}

// mounted is called by Vue after this component is installed on the page
function mounted() {
  _map = new mapboxgl.Map({
    bearing: 0,
    center: [18.5, -33.8], // lnglat, not latlng
    container: 'mymap',
    logoPosition: 'bottom-left',
    style: 'mapbox://styles/mapbox/light-v9',
    pitch: 0,
    zoom: 9,
  })

  // Start doing stuff AFTER the MapBox library has fully initialized
  _map.on('load', mapIsReady)

  _map.on('zoomstart', removeStopMarkers)
  _map.on('zoomend', updateZoomLevel)
  _map.on('moveend', updateZoomLevel)
  _map.on('click', clickedOnMap)

  _map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
}

// this is a required workaround to get the mapbox token assigned in TypeScript
// see https://stackoverflow.com/questions/44332290/mapbox-gl-typing-wont-allow-accesstoken-assignment
mapboxgl.accessToken =
  'pk.eyJ1IjoidnNwLXR1LWJlcmxpbiIsImEiOiJjamNpemh1bmEzNmF0MndudHI5aGFmeXpoIn0.u9f04rjFo7ZbWiSceTTXyA'

async function mapIsReady() {
  let networks
  if (process.versions && process.versions.hasOwnProperty('electron')) {
    networks = await loadNetworksLocal()
  } else {
    networks = await loadNetworks()
  }

  if (networks) processInputs(networks)
  setupKeyListeners()
}

function setupKeyListeners() {
  window.addEventListener('keyup', function(event) {
    if (event.keyCode === 27) {
      // ESC
      pressedEscape()
    }
  })
}

function updateZoomLevel() {
  // repost stops after a brief hiatus; mapbox weirdness
  if (_stopMarkers) setTimeout(clickedRouteDetails, 200)
}

// MapBox requires long/lat
function convertCoords(projection: string) {
  store.loadingText = 'CONVERT COORDINATES ' + projection

  for (const id in _network.nodes) {
    if (_network.nodes.hasOwnProperty(id)) {
      const node: NetworkNode = _network.nodes[id]
      const z = proj4(projection, 'EPSG:4326', node) as any
      node.x = z.x
      node.y = z.y
    }
  }
}

function generateStopFacilitiesFromXML(xml: any) {
  const stopFacilities = xml.transitSchedule.transitStops[0].stopFacility
  for (const stop of stopFacilities) {
    const attr = stop.$
    attr.x = parseFloat(attr.x)
    attr.y = parseFloat(attr.y)
    // convert coords
    const z = proj4(MY_PROJECTION, 'EPSG:4326', attr) as any
    attr.x = z.x
    attr.y = z.y

    _stopFacilities[attr.id] = attr
  }
}

function buildTransitRouteDetails(route: any) {
  const allDepartures = route.departures[0].departure
  allDepartures.sort(function(a: any, b: any) {
    const timeA = a.$.departureTime
    const timeB = b.$.departureTime
    if (timeA < timeB) return -1
    if (timeA > timeB) return 1
    return 0
  })

  const routeDetails: RouteDetails = {
    id: route.$.id,
    transportMode: route.transportMode[0],
    routeProfile: [],
    route: [],
    departures: route.departures[0].departure.length,
    firstDeparture: allDepartures[0].$.departureTime,
    lastDeparture: allDepartures[allDepartures.length - 1].$.departureTime,
    geojson: '',
  }

  for (const stop of route.routeProfile[0].stop) {
    routeDetails.routeProfile.push(stop.$)
  }

  for (const link of route.route[0].link) {
    routeDetails.route.push(link.$.refId)
  }

  routeDetails.geojson = buildCoordinatesForRoute(routeDetails)

  _routeData[routeDetails.id] = routeDetails

  return routeDetails
}

async function processTransit(xml: any) {
  store.loadingText = 'Parsing Transit Network'

  generateStopFacilitiesFromXML(xml)
  let uniqueRouteID = 0

  const transitLines = xml.transitSchedule.transitLine
  for (const line of transitLines) {
    const attr: TransitLine = {
      id: line.$.id,
      transitRoutes: [],
    }

    for (const route of line.transitRoute) {
      const details: RouteDetails = buildTransitRouteDetails(route)
      details.uniqueRouteID = uniqueRouteID++
      attr.transitRoutes.push(details)
    }
    _transitLines[attr.id] = attr
  }
}

const nodeReadAsync = function(filename: string) {
  const fs = require('fs')
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err: Error, data: string) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

const parseXML = function(xml: string) {
  const parser = new xml2js.Parser({ preserveChildrenOrder: true })
  return new Promise((resolve, reject) => {
    parser.parseString(xml, function(err: Error, result: string) {
      if (err) reject(err)
      else resolve(result)
    })
  })
}

async function loadNetworksLocal() {
  const argv = require('electron').remote.process.argv

  store.loadingText = 'Loading road network...'
  const road = await nodeReadAsync(argv[1])
  store.loadingText = 'Loading transit network...'
  const transit = await nodeReadAsync(argv[2])

  return { road: road, transit: transit }
}

async function loadNetworks() {
  try {
    let response

    store.loadingText = 'Loading road network...'
    const ROAD_NET = '/clean_network.xml'
    response = await fetch(ROAD_NET)
    const road = await response.text()

    store.loadingText = 'Loading transit network...'
    const TRANSIT_NET = '/output_transitSchedule.xml'
    response = await fetch(TRANSIT_NET)
    const transit = await response.text()

    return { road, transit }
  } catch (e) {
    console.error(e)
    return null
  }
}

async function processInputs(networks: NetworkInputs) {
  const roadXML = await parseXML(networks.road)
  await processRoadXML(roadXML)
  await convertCoords(MY_PROJECTION)

  const transitXML = await parseXML(networks.transit)
  await processTransit(transitXML)
  await addLinksToMap()
  await processDepartures()
  await addTransitToMap()

  store.loadingText = ''
}

async function addLinksToMap() {
  const linksAsGeojson = constructGeoJsonFromLinkData()
  console.log({ linksAsGeojson })

  _map.addSource('link-data', {
    data: linksAsGeojson,
    type: 'geojson',
  } as any)

  _map.addLayer({
    id: 'link-layer',
    source: 'link-data',
    type: 'line',
    paint: {
      'line-opacity': 1.0,
      'line-width': 3, // ['get', 'width'],
      'line-color': '#ccf', // ['get', 'color'],
    },
  })
}

async function processDepartures() {
  store.loadingText = 'Processing departures'

  for (const id in _transitLines) {
    if (_transitLines.hasOwnProperty(id)) {
      const transitLine = _transitLines[id]
      for (const route of transitLine.transitRoutes) {
        for (const linkID of route.route) {
          if (!(linkID in _departures)) _departures[linkID] = { total: 0, routes: new Set() }

          _departures[linkID].total += route.departures
          _departures[linkID].routes.add(route.id)

          _maximum = Math.max(_maximum, _departures[linkID].total)
        }
      }
    }
  }
  console.log({ _departures })
}

async function addTransitToMap() {
  const geodata = await constructDepartureFrequencyGeoJson()

  _map.addSource('transit-source', {
    data: geodata,
    type: 'geojson',
  } as any)

  _map.addLayer({
    id: 'transit-link',
    source: 'transit-source',
    type: 'line',
    paint: {
      'line-opacity': 1.0,
      'line-width': ['get', 'width'],
      'line-color': ['get', 'color'],
    },
  })

  _map.on('click', 'transit-link', function(e: mapboxgl.MapMouseEvent) {
    clickedOnTransitLink(e)
  })

  // turn "hover cursor" into a pointer, so user knows they can click.
  _map.on('mousemove', 'transit-link', function(e: mapboxgl.MapMouseEvent) {
    _map.getCanvas().style.cursor = e ? 'pointer' : '-webkit-grab'
  })

  // and back to normal when they mouse away
  _map.on('mouseleave', 'transit-link', function() {
    _map.getCanvas().style.cursor = '-webkit-grab'
  })
}

async function processRoadXML(xml: any) {
  const netNodes = xml.network.nodes[0].node
  const netLinks = xml.network.links[0].link

  for (const node of netNodes) {
    const attr = node.$
    attr.x = parseFloat(attr.x)
    attr.y = parseFloat(attr.y)
    _network.nodes[attr.id] = attr
  }

  for (const link of netLinks) {
    const attr = link.$
    _network.links[attr.id] = attr
  }
}

function constructGeoJsonFromLinkData() {
  const geojsonLinks = []

  for (const id in _network.links) {
    if (_network.links.hasOwnProperty(id)) {
      const link = _network.links[id]
      const fromNode = _network.nodes[link.from]
      const toNode = _network.nodes[link.to]

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

async function constructDepartureFrequencyGeoJson() {
  store.loadingText = 'Construct departure frequencies'
  const geojson = []

  for (const linkID in _departures) {
    if (_departures.hasOwnProperty(linkID)) {
      const link = _network.links[linkID]
      const coordinates = [
        [_network.nodes[link.from].x, _network.nodes[link.from].y],
        [_network.nodes[link.to].x, _network.nodes[link.to].y],
      ]

      const departures = _departures[linkID].total
      const colorBin = Math.floor((COLOR_CATEGORIES * (departures - 1)) / _maximum)

      let isRail = false
      for (const route of _departures[linkID].routes) {
        if (_routeData[route].transportMode === 'rail') {
          isRail = true
          break
        }
      }

      let line = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates,
        },
        properties: {
          width: Math.max(2.5, 0.01 * _departures[linkID].total),
          color: isRail ? '#da4' : _colorScale[colorBin],
          colorBin: colorBin,
          departures: departures,
          id: linkID,
          isRail: isRail,
          from: link.from, // _stopFacilities[fromNode].name || fromNode,
          to: link.to, // _stopFacilities[toNode].name || toNode,
        },
      }

      line = offsetLineByMeters(line, -10)
      geojson.push(line)
    }
  }

  geojson.sort(function(a: any, b: any) {
    if (a.isRail && !b.isRail) return -1
    if (b.isRail && !a.isRail) return 1
    return 0
  })

  console.log('MAX DEPARTURES: ', _maximum)
  return { type: 'FeatureCollection', features: geojson }
}

function offsetLineByMeters(line: any, metersToTheRight: number) {
  try {
    const offsetLine = turf.lineOffset(line, metersToTheRight, { units: 'meters' })
    return offsetLine
  } catch (e) {
    // offset can fail if points are exactly on top of each other; ignore.
  }
  return line
}

function buildCoordinatesForRoute(transitRoute: RouteDetails) {
  const coords = []
  let previousLink: boolean = false

  for (const linkID of transitRoute.route) {
    if (!previousLink) {
      const x0 = _network.nodes[_network.links[linkID].from].x
      const y0 = _network.nodes[_network.links[linkID].from].y
      coords.push([x0, y0])
    }
    const x = _network.nodes[_network.links[linkID].to].x
    const y = _network.nodes[_network.links[linkID].to].y
    coords.push([x, y])
    previousLink = true
  }

  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coords,
    },
    properties: {
      id: transitRoute.id,
      from: coords[0],
      to: coords[coords.length - 1],
    },
  }
  return geojson
}

function removeStopMarkers() {
  for (const marker of _stopMarkers) {
    marker.remove()
  }
}

function showTransitStops() {
  removeStopMarkers()

  const route = store.selectedRoute
  const stopSizeClass = _map.getZoom() > SHOW_STOPS_AT_ZOOM_LEVEL ? 'stop-marker-big' : 'stop-marker'

  let bearing
  for (const [i, stop] of route.routeProfile.entries()) {
    const coord = [_stopFacilities[stop.refId].x, _stopFacilities[stop.refId].y]
    // recalc bearing for every node except the last
    if (i < route.routeProfile.length - 1) {
      const point1 = turf.point(coord)
      const point2 = turf.point([
        _stopFacilities[route.routeProfile[i + 1].refId].x,
        _stopFacilities[route.routeProfile[i + 1].refId].y,
      ])
      bearing = turf.bearing(point1, point2)
    }
    const el = document.createElement('div')
    el.className = stopSizeClass

    const marker = new mapboxgl.Marker(el).setLngLat(coord)
    _stopMarkers.push(marker)
    marker.addTo(_map)

    // rotation only works after element is added to document
    el.style.transform += ` rotate(${bearing}deg)`
  }
}

function clickedOnMap(e: any) {
  console.log({ CLICKKED: e })
}

function clickedRouteDetails(routeID: string) {
  if (_stopMarkers) removeStopMarkers()
  showTransitRoute(routeID ? routeID : store.selectedRoute.id)
  showTransitStops()
}

function showTransitRoute(routeID: string) {
  const route = _routeData[routeID]
  console.log({ SELECTED_ROUTE: route })

  store.selectedRoute = route

  const source = _map.getSource('selected-route-data') as any
  if (source) {
    source.setData(route.geojson)
  } else {
    _map.addSource('selected-route-data', {
      data: route.geojson,
      type: 'geojson',
    })
  }

  if (!_map.getLayer('selected-route')) {
    _map.addLayer({
      id: 'selected-route',
      source: 'selected-route-data',
      type: 'line',
      paint: {
        'line-opacity': 1.0,
        'line-width': 5, // ['get', 'width'],
        'line-color': '#f00', // ['get', 'color'],
      },
    })
  }
}

function removeSelectedRoute() {
  if (store.selectedRoute) {
    _map.removeLayer('selected-route')
    store.selectedRoute = null
  }
}

function clickedOnTransitLink(e: any) {
  removeStopMarkers()
  removeSelectedRoute()

  // the browser delivers some details that we need, in the fn argument 'e'
  const props = e.features[0].properties

  const routeIDs = _departures[props.id].routes

  const routes = []
  for (const id of routeIDs) {
    routes.push(_routeData[id])
  }

  // sort by highest departures first
  routes.sort(function(a, b) {
    return a.departures < b.departures ? -1 : 1
  })

  store.routesOnLink = routes
  highlightAllAttachedRoutes()
}

function removeAttachedRoutes() {
  for (const layerID of _attachedRouteLayers) {
    _map.removeLayer('route-' + layerID)
    _map.removeSource('source-route-' + layerID)
  }
  _attachedRouteLayers = []
}

function highlightAllAttachedRoutes() {
  removeAttachedRoutes()

  for (const route of store.routesOnLink) {
    _map.addSource('source-route-' + route.id, {
      data: route.geojson,
      type: 'geojson',
    })
    _map.addLayer({
      id: 'route-' + route.id,
      source: 'source-route-' + route.id,
      type: 'line',
      paint: {
        'line-opacity': 0.7,
        'line-width': 10, // ['get', 'width'],
        'line-color': '#ccff33', // ['get', 'color'],
      },
    })
    _attachedRouteLayers.push(route.id)
  }
}

function pressedEscape() {
  removeSelectedRoute()
  removeStopMarkers()
  removeAttachedRoutes()

  store.selectedRoute = null
  store.routesOnLink = []
}
</script>

<style>
html,
body {
  margin: 0px 0px 0px 0px;
  font-family: 'Lato', Helvetica, Arial, sans-serif;
}

.mapboxgl-popup-content {
  padding: 0px 20px 0px 0px;
  opacity: 0.95;
  box-shadow: 0 0 3px #00000080;
}

h4,
p {
  margin: 0px 10px;
}

.transit-popup {
  padding: 0px 0px;
  margin: 0px 0px;
  border-style: solid;
  border-width: 0px 0px 0px 20px;
}

#container {
  background-color: #fff;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto;
  height: 100%;
  max-height: 100%;
  margin: 0px 0px 0px 0px;
  padding: 0px 0px 0px 0px;
}

.status-blob {
  background-color: white;
  opacity: 0.8;
  margin: auto 0;
  text-align: center;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  z-index: 2;
}

.info-blob {
  background-color: white;
  margin: 0 0;
  width: 250px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  height: 100vh;
  overflow-y: auto;
  text-align: center;
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  opacity: 0.95;
  z-index: 2;
}

#mymap {
  width: 100%;
  height: 100vh;
  background-color: white;
  overflow: hidden;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  z-index: 1;
}

.route {
  background-color: white;
  margin: 0px 0px;
  padding: 5px 5px;
  text-align: left;
}

.route:hover {
  background-color: #f4f4f4;
  cursor: pointer;
}

h3 {
  margin: 0px 0px;
  font-size: 16px;
}

.title {
  margin-left: 10px;
}

.details {
  font-size: 12px;
}

.stop-marker {
  background: url('./assets/icon-stop-triangle.png') no-repeat;
  background-size: 100%;
  width: 8px;
  height: 8px;
}

.stop-marker-big {
  background: url('./assets/icon-stop-triangle.png') no-repeat;
  background-size: 100%;
  width: 16px;
  height: 16px;
}

.highlightedRoute {
  background-color: #eee;
}

.bigtitle {
  font-weight: bold;
  font-style: italic;
  font-size: 20px;
  margin: 20px 0px;
}
</style>
