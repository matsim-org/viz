<template lang="pug">
.main-content
  #mymap
  .slider-box
    time-slider.time-slider(:bind="currentTime" :initialTime="currentTime" @change="changedSlider")
  .left-overlay
    h1.clock {{clockTime}}
  .loading-message.ui.segment(v-show='loadingMsg')
    .ui.inverted.active.dimmer
      .ui.text.loader {{ loadingMsg }}
</template>

<script lang="ts">
'use strict'
import mapboxgl from 'mapbox-gl'
import { LngLat } from 'mapbox-gl/dist/mapbox-gl'
import * as timeConvert from 'convert-seconds'
import pako from 'pako'
import proj4 from 'proj4'
import readBlob from 'read-blob'
import sharedStore from '../SharedStore'
import EventBus from '@/EventBus.vue'
import FileAPI from '@/communication/FileAPI'
import TimeSlider from '../components/TimeSlider.vue'
import { Vue, Component, Watch } from 'vue-property-decorator'
import { inferno, viridis } from 'scale-color-perceptual'

sharedStore.addVisualizationType({
  typeName: 'nox',
  prettyName: 'NOX Emissions',
  description: 'Show NOX emissions at gridpoints',
  requiredFileKeys: ['JSON x/y/t/nox'],
  requiredParamKeys: ['Map projection'],
})

// choose your colormap: for emissions we'll use inferno
// https://www.npmjs.com/package/scale-color-perceptual
const colormap = inferno

interface MapElement {
  lngLat: LngLat
  features: any[]
}

interface NOXEntry {
  id: string
  time: number
  nox: number
}

interface Point {
  id: string
  lon: number
  lat: number
  events: any[]
}

@Component({
  components: { 'time-slider': TimeSlider },
  props: { projectId: String, fileApi: Object },
})
export default class NOXPlot extends Vue {
  private currentTime: number = 0
  private firstEventTime: number = 0
  private loadingMsg: string = ''
  private mymap!: mapboxgl.Map
  private myGeoJson!: any
  private mapExtentXYXY: any = [180, 90, -180, -90]
  private noxLocations: any
  private sharedState: any = sharedStore.state

  // store is the component data store -- the state of the component.
  private store: any = {
    loadingText: 'NOX Emissions Plot',
    visualization: null,
    project: {},
    api: FileAPI,
  }

  private get clockTime() {
    return this.convertSecondsToClockTime(this.currentTime)
  }

  // VUE LIFECYCLE: created
  public created() {
    this.store.api = (this as any).fileApi
  }

  // VUE LIFECYCLE: mounted
  public async mounted() {
    this.store.projectId = (this as any).$route.params.projectId
    this.store.vizId = (this as any).$route.params.vizId
    this.store.visualization = await this.store.api.fetchVisualization(this.store.projectId, this.store.vizId)
    this.store.project = await this.store.api.fetchProject(this.store.projectId)

    this.setBreadcrumb()

    const jsondata = await this.loadData()
    this.myGeoJson = await this.convertJsonToGeoJson(jsondata)
    await this.buildEventDatabase(jsondata)

    this.mymap = new mapboxgl.Map({
      bearing: 0,
      // center: [13.325, 52.52], // lnglat, not latlng (think of it as: x,y)
      container: 'mymap',
      logoPosition: 'bottom-right',
      style: 'mapbox://styles/mapbox/light-v9',
      pitch: 0,
      zoom: 14,
    })

    // do things that can only be done after MapBox is fully initialized
    this.mymap.on('style.load', this.mapIsReady)
  }

  private sortTest() {
    const ar = [1000, 5000, 5000, 9000, 10000]

    const test = [0, 1000, 1500, 5000, 9500, 10000, 11000]
    for (const z of test) {
      const answer = this.getUpperBoundEventForTimepoint(ar, z, (a: number, b: number) => a - b)
      console.log({ z, answer })
    }
  }

  private setBreadcrumb() {
    EventBus.$emit('set-breadcrumbs', [
      { title: 'My Projects', link: '/projects' },
      { title: this.store.project.name, link: '/project/' + this.store.projectId },
      { title: 'nox-' + this.store.vizId.substring(0, 4), link: '#' },
    ])
  }

  /**
   * Build lookup database of NOX events from input data
   */
  private buildEventDatabase(data: any) {
    this.noxLocations = {}
    console.log(this.noxLocations)

    for (const row of data) {
      // generate a row-id if there isn't one
      if (!row.id) row.id = row.lon.toString() + '/' + row.lat.toString()

      // save the row
      if (!this.noxLocations.hasOwnProperty(row.id)) {
        this.noxLocations[row.id] = []
      }
      this.noxLocations[row.id].push(row)
    }

    // sort each location's events by timestamp
    for (const location in this.noxLocations) {
      if (!this.noxLocations.hasOwnProperty(location)) continue
      this.noxLocations[location].sort((a: any, b: any) => a.time - b.time)
    }
    console.log({ LOCATIONS: this.noxLocations })
  }

  private addJsonToMap() {
    this.mymap.addSource('my-data', {
      data: this.myGeoJson,
      type: 'geojson',
    })

    console.log(this.myGeoJson)

    this.mymap.addLayer(
      {
        id: 'my-layer',
        source: 'my-data',
        type: 'circle',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['get', 'radius'],
        },
      },
      'water'
    ) // layer gets added just *above* this MapBox-defined layer.
  }

  private updateMapExtent(coordinates: any) {
    this.mapExtentXYXY[0] = Math.min(this.mapExtentXYXY[0], coordinates[0])
    this.mapExtentXYXY[1] = Math.min(this.mapExtentXYXY[1], coordinates[1])
    this.mapExtentXYXY[2] = Math.max(this.mapExtentXYXY[2], coordinates[0])
    this.mapExtentXYXY[3] = Math.max(this.mapExtentXYXY[3], coordinates[1])
  }

  private convertJsonToGeoJson(data: any) {
    const geojsonLinks: any = []

    this.firstEventTime = 1e20

    for (const point of data) {
      const coordinates = [point.lon, point.lat]
      const id = point.lon.toString() + '/' + point.lat.toString()

      this.firstEventTime = Math.min(this.firstEventTime, point.time)
      this.updateMapExtent(coordinates)

      const featureJson: any = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coordinates },
        properties: { id: id, radius: 0, color: '#000000' },
      }

      geojsonLinks.push(featureJson)
    }
    this.currentTime = this.firstEventTime

    return { type: 'FeatureCollection', features: geojsonLinks }
  }

  private changedSlider(seconds: number) {
    this.currentTime = seconds
    this.updateFlowsForTimeValue(seconds)
  }

  private convertSecondsToClockTimeMinutes(index: number) {
    try {
      const hms = timeConvert(index)
      const minutes = ('00' + hms.minutes).slice(-2)
      return `${hms.hours}:${minutes}`
    } catch (e) {
      return '0'
    }
  }

  private convertSecondsToClockTime(index: number) {
    const hms = timeConvert(index)
    const minutes = ('00' + hms.minutes).slice(-2)
    const seconds = ('00' + hms.seconds).slice(-2)
    return `${hms.hours}:${minutes}:${seconds}`
  }

  private updateFlowsForTimeValue(seconds: number) {
    if (!this.noxLocations || !this.myGeoJson) return

    const lookup: any = {}

    // loop on all point-ids and get NOX value for each at this timepoint
    for (const point in this.noxLocations) {
      if (!this.noxLocations.hasOwnProperty(point)) continue
      const location = this.noxLocations[point]
      // for each point, find the new time
      const timeIndex = this.getUpperBoundEventForTimepoint(location, seconds, (a: any, b: number) => a - b)
      if (timeIndex === -1) continue

      const noxEvent = location[timeIndex]

      if (noxEvent.NOX) {
        lookup[noxEvent.id] = colormap(noxEvent.NOX)
      }
    }

    // loop on all features and get NOX if it exists
    for (const feature of this.myGeoJson.features) {
      if (lookup[feature.properties.id]) {
        feature.properties.color = lookup[feature.properties.id]
        feature.properties.radius = 20
      } else {
        feature.properties.radius = 0
      }
    }

    const z: any = this.mymap.getSource('my-data')
    z.setData(this.myGeoJson)
  }

  private mapIsReady() {
    this.mymap.addControl(new mapboxgl.NavigationControl(), 'top-right')

    this.addJsonToMap()
    this.updateFlowsForTimeValue(this.firstEventTime)

    this.mymap.jumpTo({ center: [this.mapExtentXYXY[0], this.mapExtentXYXY[1]], zoom: 13 })
    this.mymap.fitBounds(this.mapExtentXYXY, { padding: 100 })

    this.currentTime = this.firstEventTime
  }

  private async loadData() {
    return await this.loadXYJsonData()
  }

  private async loadXYJsonData() {
    try {
      const XYDATA = this.store.visualization.inputFiles['JSON x/y/t/nox'].fileEntry.id
      console.log({ XYDATA, PROJECT: this.store.projectId })
      this.store.loadingText = 'Loading X/Y data...'
      // get the blob data
      const dataBlob = await this.store.api.downloadFile(XYDATA, this.store.projectId)
      let data = await readBlob.text(dataBlob)
      data = JSON.parse(data)

      return data
    } catch (e) {
      console.error(e)
      return null
    }
  }

  // MapBox requires long/lat
  private convertCoords(projection: any) {
    console.log('starting conversion', projection)
    /* TODO: convert from any EPSG:xxxx that Proj4 supports

    for (const key of Object.keys(this.store.nodes)) {
      const node = this.store.nodes[key]
      const z = proj4(projection, 'WGS84', node) as any
      node.x = z.x
      node.y = z.y
    }
    */
  }

  /*
   * Binary search in JavaScript.
   * Returns the index of of the element in a sorted array or (-n-1) where n is the insertion point for the new element.
   * Parameters:
   *     ar - A sorted array
   *     el - An element to search for
   *     compareFn - A comparator function. The function takes two arguments: (a, b) and returns:
   *        a negative number  if a is less than b;
   *        0 if a is equal to b;
   *        a positive number of a is greater than b.
   * The array may contain duplicate elements. If there are more than one equal elements in the array,
   * the returned value can be the index of any one of the equal elements.
   * More explicitly, this returns:
   *    the index, if the key is found
   *    -1, if the element is lower than anything found in the array
   *    -n-1, thus use (-n + 2) to get the index of the upper-bound element
   *
   */
  private binaryTimeSearch(ar: any, el: any, compareFn: any) {
    let m = 0
    let n = ar.length - 1
    while (m <= n) {
      // tslint:disable-next-line:no-bitwise
      const k = (n + m) >> 1
      const cmp = compareFn(el, ar[k].time)
      if (cmp > 0) {
        m = k + 1
      } else if (cmp < 0) {
        n = k - 1
      } else {
        return k
      }
    }
    return -m - 1
  }

  // use binary search to get the latest event that has already happened
  private getUpperBoundEventForTimepoint(ar: any, el: any, compareFn: any) {
    const bAnswer = this.binaryTimeSearch(ar, el, compareFn)
    if (bAnswer >= -1) return bAnswer
    return -bAnswer - 2
  }
}
</script>

<style scoped>
/* this is the initial start page layout */
.main-content {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: 1fr auto;
  height: 100%;
  padding: 0px;
}

#mymap {
  height: 100%;
  width: 100%;
  grid-row: 1 / 3;
  grid-column: 1 / 4;
  overflow: hidden;
  background: #222;
}

.loading-message {
  grid-row: 1 / 2;
  grid-column: 1 / 4;
  overflow: hidden;
  opacity: 0.8;
}

.left-overlay {
  grid-row: 1 / 3;
  grid-column: 1 / 2;
  z-index: 5000;
  pointer-events: none;
}

.clock {
  color: #ccc;
  background-color: #99a;
  margin: 0.5rem;
  padding: 0px 5px;
  border: solid 1px;
  border-color: #222;
  border-radius: 4px;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.2);
  font-size: 1.5rem;
}

.slider-box {
  grid-row: 2 / 3;
  grid-column: 1 / 4;
  background-color: #99a;
  margin: 0.5rem;
  z-index: 2;
  border: solid 1px;
  border-color: #222;
  border-radius: 4px;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.2);
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
</style>
