<template lang="pug">
#container
  .status-blob(v-if="loadingText"): h2 {{ loadingText }}
  .info-blob
    .info-header
      h3(style="color: #ff8") ROUTES ON LINK

    p.details(style="margin-top:20px" v-if="routesOnLink.length === 0") Select a link to see the routes traversing it.

    .route(v-for="route in routesOnLink"
          :key="route.uniqueRouteID"
          :class="{highlightedRoute: selectedRoute && route.id === selectedRoute.id}"
          @click="showRouteDetails(route.id)"
    )
      h3.mytitle {{route.id}}
      p.details: b {{route.departures}} departures
      p.details First: {{route.firstDeparture}}
      p.details Last: {{route.lastDeparture}}
  #mymap
    .stop-marker(v-for="stop in stopMarkers" :key="stop.i"
      v-bind:style="{transform: 'translate(-50%,-50%) rotate('+stop.bearing+'deg)', left: stop.xy.x + 'px', top: stop.xy.y+'px'}"
    )

</template>

<script lang="ts">
'use strict'

import * as turf from '@turf/turf'
import * as BlobUtil from 'blob-util'
import colormap from 'colormap'
import gthread from 'greenlet'
import mapboxgl, { LngLatBoundsLike } from 'mapbox-gl'
import proj4 from 'proj4'
import pako from 'pako'
import xml2js from 'xml2js'
import { Vue, Component, Prop } from 'vue-property-decorator'

import AuthenticationStore from '@/auth/AuthenticationStore'
import EventBus from '@/EventBus.vue'
import FileAPI from '@/communication/FileAPI'
import SharedStore from '@/SharedStore'
import { Visualization } from '@/entities/Entities'

import XmlFetcher from '@/visualization/transit-supply/XmlFetcher'
import TransitSupplyHelper from '@/visualization/transit-supply/TransitSupplyHelper'
import TransitSupplyHelperWorker from '@/visualization/transit-supply/TransitSupplyHelper.worker'

const DEFAULT_PROJECTION = 'EPSG:31468' // 31468' // 2048'

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
  roadXML: any
  transitXML: any
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

// register component with the SharedStore
SharedStore.addVisualizationType({
  typeName: 'transit-supply',
  prettyName: 'Transit Supply',
  description: 'Depicts the scheduled transit routes on a network.',
  requiredFileKeys: ['Transit Schedule', 'Network'],
  requiredParamKeys: ['Description', 'Projection'],
})

@Component
export default class TransitSupply extends Vue {
  @Prop({ type: String, required: true })
  private vizId!: string

  @Prop({ type: String, required: true })
  private projectId!: string

  @Prop({ type: FileAPI, required: true })
  private fileApi!: FileAPI

  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

  // -------------------------- //

  private loadingText: string = 'MATSim Transit Inspector'
  private mymap!: mapboxgl.Map
  private project: any = {}
  private projection: string = DEFAULT_PROJECTION
  private routesOnLink: any = []
  private selectedRoute: any = {}
  private visualization!: Visualization
  private stopMarkers: any[] = []

  private _attachedRouteLayers!: string[]
  private _departures!: { [linkID: string]: Departure }
  private _linkData!: any
  private _mapExtentXYXY!: any
  private _maximum!: number
  private _network!: Network
  private _routeData!: { [index: string]: RouteDetails }
  private _stopFacilities!: { [index: string]: NetworkNode }
  private _transitLines!: { [index: string]: TransitLine }
  private _roadFetcher!: XmlFetcher
  private _transitFetcher!: XmlFetcher
  private _transitHelper!: TransitSupplyHelper

  public created() {
    this._attachedRouteLayers = []
    this._departures = {}
    this._mapExtentXYXY = [180, 90, -180, -90]
    this._maximum = 0
    this._network = { nodes: {}, links: {} }
    this._routeData = {}
    this._stopFacilities = {}
    this._transitLines = {}
    this.selectedRoute = null
  }

  public beforeDestroy() {
    if (this._roadFetcher) this._roadFetcher.destroy()
    if (this._transitFetcher) this._transitFetcher.destroy()
    if (this._transitHelper) this._transitHelper.destroy()
  }

  public async mounted() {
    this.projectId = (this as any).$route.params.projectId
    this.vizId = (this as any).$route.params.vizId

    await this.getVizDetails()
    this.setBreadcrumb()
    this.setupMap()
  }

  private async getVizDetails() {
    this.visualization = await this.fileApi.fetchVisualization(this.projectId, this.vizId)
    this.project = await this.fileApi.fetchProject(this.projectId)
    if (SharedStore.debug) console.log(this.visualization)

    if (this.visualization.parameters.Projection) {
      this.projection = this.visualization.parameters.Projection.value
    }
  }

  private setBreadcrumb() {
    EventBus.$emit('set-breadcrumbs', [
      { title: 'My Projects', link: '/projects' },
      { title: this.project.name, link: '/project/' + this.projectId },
      { title: 'viz-' + this.vizId.substring(0, 4), link: '#' },
    ])
  }

  private setupMap() {
    this.mymap = new mapboxgl.Map({
      bearing: 0,
      // center: [18.5, -33.8], // lnglat, not latlng
      container: 'mymap',
      logoPosition: 'bottom-right',
      style: 'mapbox://styles/mapbox/light-v9',
      pitch: 0,
      // zoom: 9,
    })

    // Start doing stuff AFTER the MapBox library has fully initialized
    this.mymap.on('load', this.mapIsReady)

    this.mymap.on('move', this.handleMapMotion)
    this.mymap.on('zoom', this.handleMapMotion)
    this.mymap.keyboard.disable() // so arrow keys don't pan

    this.mymap.addControl(new mapboxgl.NavigationControl(), 'top-right')
  }

  private handleMapMotion() {
    if (this.stopMarkers.length > 0) this.showTransitStops()
  }

  private showRouteDetails(routeID: string) {
    if (!routeID && !this.selectedRoute) return

    if (routeID) this.showTransitRoute(routeID)
    else this.showTransitRoute(this.selectedRoute.id)

    this.showTransitStops()
  }

  private async mapIsReady() {
    const networks = await this.loadNetworks()
    if (networks) this.processInputs(networks)

    this.setupKeyListeners()
  }

  private setupKeyListeners() {
    const parent = this
    window.addEventListener('keyup', function(event) {
      if (event.keyCode === 27) {
        // ESC
        parent.pressedEscape()
      }
    })
    window.addEventListener('keydown', function(event) {
      if (event.keyCode === 38) {
        // UP
        parent.pressedArrowKey(-1)
      }
      if (event.keyCode === 40) {
        // DOWN
        parent.pressedArrowKey(+1)
      }
    })
  }

  private async loadNetworks() {
    try {
      if (SharedStore.debug) console.log(this.visualization.inputFiles)

      const ROAD_NET = this.visualization.inputFiles.Network.fileEntry.id
      const TRANSIT_NET = this.visualization.inputFiles['Transit Schedule'].fileEntry.id

      if (SharedStore.debug) console.log({ ROAD_NET, TRANSIT_NET, PROJECT: this.projectId })

      this.loadingText = 'Loading networks...'

      console.log({ AUTH_STORE: this.authStore })

      this._roadFetcher = await XmlFetcher.create({
        accessToken: this.authStore.state.accessToken,
        fileId: ROAD_NET,
        projectId: this.projectId,
      })
      this._transitFetcher = await XmlFetcher.create({
        accessToken: this.authStore.state.accessToken,
        fileId: TRANSIT_NET,
        projectId: this.projectId,
      })

      // launch the long-running processes; these return promises
      const roadXMLPromise = this._roadFetcher.fetchXML()
      const transitXMLPromise = this._transitFetcher.fetchXML()

      // and wait for them to both complete
      const results = await Promise.all([roadXMLPromise, transitXMLPromise])

      this._roadFetcher.destroy()
      this._transitFetcher.destroy()

      return { roadXML: results[0], transitXML: results[1] }
    } catch (e) {
      console.error({ e })
      this.loadingText = '' + e
      return null
    }
  }

  private async processInputs(networks: NetworkInputs) {
    this.loadingText = 'Building data structures...'
    console.log(this.loadingText)

    // spawn transit helper web worker
    this._transitHelper = await TransitSupplyHelper.create({ xml: networks, projection: this.projection })

    this.loadingText = 'Crunching road network...'
    console.log(this.loadingText)
    await this._transitHelper.createNodesAndLinks()

    this.loadingText = 'Converting coordinates...'
    console.log(this.loadingText)
    await this._transitHelper.convertCoordinates()

    // await this.addLinksToMap() // --no links for now

    this.loadingText = 'Crunching transit network...'
    console.log(this.loadingText)

    const result: any = await this._transitHelper.processTransit()
    console.log(result)

    this._network = result.network
    this._mapExtentXYXY = result.mapExtent
    this._routeData = result.routeData
    this._stopFacilities = result.stopFacilities
    this._transitLines = result.transitLines
    this._mapExtentXYXY = result.mapExtent

    this.loadingText = 'Summarizing departures...'
    await this.processDepartures()

    const geodata = await this.constructDepartureFrequencyGeoJson()

    await this.addTransitToMap(geodata)

    this.mymap.fitBounds(this._mapExtentXYXY, {
      padding: { top: 50, bottom: 100, right: 100, left: 300 },
      animate: false,
    })
    this.loadingText = ''
  }

  /** Async worker caller
   *  See https://medium.com/@roman01la/run-web-worker-with-a-function-rather-than-external-file-303add905a0
   */
  private run(fn: any) {
    return new Worker(URL.createObjectURL(new Blob(['(' + fn + ')()'])))
  }

  private async addLinksToMap() {
    const linksAsGeojson = this.constructGeoJsonFromLinkData()

    this.mymap.addSource('link-data', {
      data: linksAsGeojson,
      type: 'geojson',
    } as any)

    this.mymap.addLayer({
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

  private async processDepartures() {
    this.loadingText = 'Processing departures'

    for (const id in this._transitLines) {
      if (this._transitLines.hasOwnProperty(id)) {
        const transitLine = this._transitLines[id]
        for (const route of transitLine.transitRoutes) {
          for (const linkID of route.route) {
            if (!(linkID in this._departures)) this._departures[linkID] = { total: 0, routes: new Set() }

            this._departures[linkID].total += route.departures
            this._departures[linkID].routes.add(route.id)

            this._maximum = Math.max(this._maximum, this._departures[linkID].total)
          }
        }
      }
    }
  }

  private async addTransitToMap(geodata: any) {
    this.mymap.addSource('transit-source', {
      data: geodata,
      type: 'geojson',
    } as any)

    this.mymap.addLayer({
      id: 'transit-link',
      source: 'transit-source',
      type: 'line',
      paint: {
        'line-opacity': 1.0,
        'line-width': ['get', 'width'],
        'line-color': ['get', 'color'],
      },
    })

    const parent = this
    this.mymap.on('click', 'transit-link', function(e: mapboxgl.MapMouseEvent) {
      parent.clickedOnTransitLink(e)
    })

    // turn "hover cursor" into a pointer, so user knows they can click.
    this.mymap.on('mousemove', 'transit-link', function(e: mapboxgl.MapMouseEvent) {
      parent.mymap.getCanvas().style.cursor = e ? 'pointer' : '-webkit-grab'
    })

    // and back to normal when they mouse away
    this.mymap.on('mouseleave', 'transit-link', function() {
      parent.mymap.getCanvas().style.cursor = '-webkit-grab'
    })
  }

  private constructGeoJsonFromLinkData() {
    const geojsonLinks = []

    for (const id in this._network.links) {
      if (this._network.links.hasOwnProperty(id)) {
        const link = this._network.links[id]
        const fromNode = this._network.nodes[link.from]
        const toNode = this._network.nodes[link.to]

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

    this._linkData = {
      type: 'FeatureCollection',
      features: geojsonLinks,
    }
    return this._linkData
  }

  private async constructDepartureFrequencyGeoJson() {
    this.loadingText = 'Construct departure frequencies'
    const geojson = []

    for (const linkID in this._departures) {
      if (this._departures.hasOwnProperty(linkID)) {
        const link = this._network.links[linkID]
        const coordinates = [
          [this._network.nodes[link.from].x, this._network.nodes[link.from].y],
          [this._network.nodes[link.to].x, this._network.nodes[link.to].y],
        ]

        const departures = this._departures[linkID].total
        const colorBin = Math.floor((COLOR_CATEGORIES * (departures - 1)) / this._maximum)

        let isRail = false
        for (const route of this._departures[linkID].routes) {
          if (this._routeData[route].transportMode === 'rail') {
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
            width: Math.max(2.5, 0.01 * this._departures[linkID].total),
            color: isRail ? '#da4' : _colorScale[colorBin],
            colorBin: colorBin,
            departures: departures,
            id: linkID,
            isRail: isRail,
            from: link.from, // _stopFacilities[fromNode].name || fromNode,
            to: link.to, // _stopFacilities[toNode].name || toNode,
          },
        }

        line = this.offsetLineByMeters(line, -10)
        geojson.push(line)
      }
    }

    geojson.sort(function(a: any, b: any) {
      if (a.isRail && !b.isRail) return -1
      if (b.isRail && !a.isRail) return 1
      return 0
    })

    return { type: 'FeatureCollection', features: geojson }
  }

  private offsetLineByMeters(line: any, metersToTheRight: number) {
    try {
      const offsetLine = turf.lineOffset(line, metersToTheRight, { units: 'meters' })
      return offsetLine
    } catch (e) {
      // offset can fail if points are exactly on top of each other; ignore.
    }
    return line
  }

  private removeStopMarkers() {
    this.stopMarkers = []
  }

  private async showTransitStops() {
    this.removeStopMarkers()

    const route = this.selectedRoute
    const stopSizeClass = 'stopmarker' // this.mymap.getZoom() > SHOW_STOPS_AT_ZOOM_LEVEL ? 'stop-marker-big' : 'stop-marker'
    const mapBearing = this.mymap.getBearing()

    let bearing

    for (const [i, stop] of route.routeProfile.entries()) {
      const coord = [this._stopFacilities[stop.refId].x, this._stopFacilities[stop.refId].y]
      // recalc bearing for every node except the last
      if (i < route.routeProfile.length - 1) {
        const point1 = turf.point(coord)
        const point2 = turf.point([
          this._stopFacilities[route.routeProfile[i + 1].refId].x,
          this._stopFacilities[route.routeProfile[i + 1].refId].y,
        ])
        bearing = turf.bearing(point1, point2) - mapBearing // so icons rotate along with map
      }

      const xy = this.mymap.project(coord)

      // every marker has a latlng coord and a bearing
      const marker = { i, bearing, xy: { x: Math.floor(xy.x), y: Math.floor(xy.y) } }
      this.stopMarkers.push(marker)
    }
  }

  private showTransitRoute(routeID: string) {
    if (!routeID) return

    const route = this._routeData[routeID]
    console.log({ SELECTED_ROUTE: route })

    this.selectedRoute = route

    const source = this.mymap.getSource('selected-route-data') as any
    if (source) {
      source.setData(route.geojson)
    } else {
      this.mymap.addSource('selected-route-data', {
        data: route.geojson,
        type: 'geojson',
      })
    }

    if (!this.mymap.getLayer('selected-route')) {
      this.mymap.addLayer({
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

  private removeSelectedRoute() {
    if (this.selectedRoute) {
      this.mymap.removeLayer('selected-route')
      this.selectedRoute = null
    }
  }

  private clickedOnTransitLink(e: any) {
    this.removeStopMarkers()
    this.removeSelectedRoute()

    // the browser delivers some details that we need, in the fn argument 'e'
    const props = e.features[0].properties
    const routeIDs = this._departures[props.id].routes

    const routes = []
    for (const id of routeIDs) {
      routes.push(this._routeData[id])
    }

    // sort by highest departures first
    routes.sort(function(a, b) {
      return a.departures > b.departures ? -1 : 1
    })

    this.routesOnLink = routes
    this.highlightAllAttachedRoutes()

    // highlight the first route, if there is one
    if (routes.length > 0) this.showRouteDetails(routes[0].id)
  }

  private removeAttachedRoutes() {
    for (const layerID of this._attachedRouteLayers) {
      this.mymap.removeLayer('route-' + layerID)
      this.mymap.removeSource('source-route-' + layerID)
    }
    this._attachedRouteLayers = []
  }

  private highlightAllAttachedRoutes() {
    this.removeAttachedRoutes()

    for (const route of this.routesOnLink) {
      this.mymap.addSource('source-route-' + route.id, {
        data: route.geojson,
        type: 'geojson',
      })
      this.mymap.addLayer({
        id: 'route-' + route.id,
        source: 'source-route-' + route.id,
        type: 'line',
        paint: {
          'line-opacity': 0.7,
          'line-width': 10, // ['get', 'width'],
          'line-color': '#ccff33', // ['get', 'color'],
        },
      })
      this._attachedRouteLayers.push(route.id)
    }
  }

  private pressedEscape() {
    this.removeSelectedRoute()
    this.removeStopMarkers()
    this.removeAttachedRoutes()

    this.selectedRoute = null
    this.routesOnLink = []
  }

  private pressedArrowKey(delta: number) {
    if (!this.selectedRoute) return

    let i = this.routesOnLink.indexOf(this.selectedRoute)
    i = i + delta

    if (i < 0 || i >= this.routesOnLink.length) return

    this.showRouteDetails(this.routesOnLink[i].id)
  }
}

const _colorScale = colormap({ colormap: 'viridis', nshades: COLOR_CATEGORIES })

const nodeReadAsync = function(filename: string) {
  const fs = require('fs')
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err: Error, data: string) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}
</script>

<style scoped>
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
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: 1fr;
}

.status-blob {
  background-color: white;
  box-shadow: 0 0 8px #00000040;
  opacity: 0.8;
  margin: auto 0px auto -10px;
  padding: 15px 0px;
  text-align: center;
  grid-column: 2 / 3;
  grid-row: 1 / 2;
  z-index: 2;
}

#mymap {
  width: 100%;
  height: 100%;
  background-color: white;
  overflow: hidden;
  grid-column: 1 / 3;
  grid-row: 1 / 2;
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

.mytitle {
  margin-left: 10px;
}

.details {
  font-size: 12px;
}

.stopmarker {
  width: 12px;
  height: 12px;
  cursor: pointer;
}

.stop-marker-big {
  background: url('../../assets/icon-stop-triangle.png') no-repeat;
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

.info-header {
  background-color: #557;
  border-radius: 8px 8px 0px 0px;
  padding: 0.5rem 0rem;
}

.info-blob {
  display: flex;
  flex-direction: column;
  width: 250px;
  background-color: white;
  border-radius: 8px;
  margin: 0.5rem 0.5rem 0.5rem 0.5rem;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  text-align: center;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  opacity: 0.95;
  z-index: 2;
  overflow-y: auto;
}
.stop-marker {
  position: absolute;
  width: 12px;
  height: 12px;
  background: url('../../assets/icon-stop-triangle.png') no-repeat;
  transform: translate(-50%, -50%);
  background-size: 100%;
  cursor: pointer;
}
</style>
