<template lang="pug">
.main-content
  #mymap
  .controls
    .slider-things
      vue-slider.time-slider(v-bind="timeSlider" v-model="timeSliderValue")
      .clock-labels
        .hour &nbsp;0:00
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

import * as mapboxgl from 'mapbox-gl'
import * as timeConvert from 'convert-seconds'
import pako from 'pako'
import proj4 from 'proj4'
import sharedStore, { EventBus } from '../SharedStore'
import vueSlider from 'vue-slider-component'
import { Vue, Component, Watch } from 'vue-property-decorator'
import { LngLat } from 'mapbox-gl/dist/mapbox-gl'
import { nSQL } from 'nano-sql'
import { inferno, viridis } from 'scale-color-perceptual'

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

interface StoreType {
  sharedStore: any
  currentTimeSegment: number
  nodes: any
  links: any
  msg: string
  timeSlider: any
  timeSliderValue: number
  setTimeSegment: any
  loadingMsg: string
}

const vueInstance = Vue.extend({
  props: {
    projectId: String,
  },
  components: {
    'vue-slider': vueSlider,
  },
})

@Component
export default class NOXPlot extends vueInstance {
  private sharedState: any = sharedStore.state

  private token: string =
    'pk.eyJ1IjoidnNwLXR1LWJlcmxpbiIsImEiOiJjamNpemh1bmEzNmF0MndudHI5aGFmeXpoIn0.u9f04rjFo7ZbWiSceTTXyA'

  private _linkData: any
  private mymap!: mapboxgl.Map

  private _locations: any

  private _firstEventTime: number = 0

  private mySlider = {
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
    formatter: (index: number) => {
      return this.convertSecondsToClockTimeMinutes(index)
    },
  }

  // store is the component data store -- the state of the component.
  private store: StoreType = {
    sharedStore: sharedStore.state,
    currentTimeSegment: 0,
    nodes: {},
    links: {},
    loadingMsg: '',
    msg: '',
    timeSlider: this.mySlider,
    timeSliderValue: 0,
    setTimeSegment: function(segment: number) {
      this.currentTimeSegment = segment
    },
  }

  private loadingMsg: string = this.store.loadingMsg
  private timeSlider: any = this.mySlider
  private timeSliderValue: number = this.store.timeSlider

  private myGeoJson!: any

  private get clockTime() {
    return this.convertSecondsToClockTime(this.store.timeSliderValue)
  }

  // VUE LIFECYCLE: created
  public created() {
    sharedStore.addVisualizationType({
      typeName: 'emissions',
      prettyName: 'NOX Emissions',
      description: 'Show NOX emissions at gridpoints',
      requiredFileKeys: ['JSON x/y/t/nox'],
      requiredParamKeys: ['Map projection'],
    })

    // this.sortTest()
  }

  // VUE LIFECYCLE: mounted
  public async mounted() {
    this.setupEventListeners()

    // this weird trick allows us to set mapbox token in typescript
    // see https://stackoverflow.com/questions/44332290/mapbox-gl-typing-wont-allow-accesstoken-assignment
    // tslint:disable-next-line:semicolon
    ;(mapboxgl as any).accessToken = this.token

    const jsondata = await this.loadData()
    this.myGeoJson = await this.convertJsonToGeoJson(jsondata)
    await this.buildEventDatabase(jsondata)

    this.mymap = new mapboxgl.Map({
      bearing: 0,
      center: [13.325, 52.52], // lnglat, not latlng (think of it as: x,y)
      container: 'mymap',
      logoPosition: 'bottom-right',
      style: 'mapbox://styles/mapbox/dark-v9',
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

  /**
   * Build lookup database of NOX events from input data
   */
  private buildEventDatabase(data: any) {
    this._locations = {}
    console.log(this._locations)

    for (const row of data) {
      // generate a row-id if there isn't one
      if (!row.id) row.id = row.lon.toString() + '/' + row.lat.toString()

      // save the row
      if (!this._locations.hasOwnProperty(row.id)) {
        this._locations[row.id] = []
      }
      this._locations[row.id].push(row)
    }

    // sort each location's events by timestamp
    for (const location in this._locations) {
      if (!this._locations.hasOwnProperty(location)) continue
      this._locations[location].sort((a: any, b: any) => a.time - b.time)
    }
    console.log({ LOCATIONS: this._locations })
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

  private convertJsonToGeoJson(data: any) {
    const geojsonLinks: any = []

    this._firstEventTime = 1e20

    for (const point of data) {
      this._firstEventTime = Math.min(this._firstEventTime, point.time)
      const coordinates = [point.lon, point.lat]
      const id = point.lon.toString() + '/' + point.lat.toString()

      const featureJson: any = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coordinates },
        properties: { id: id, radius: 0, color: '#000000' },
      }

      geojsonLinks.push(featureJson)
    }
    console.log('TIME:' + this._firstEventTime)
    this.store.timeSliderValue = this._firstEventTime

    return { type: 'FeatureCollection', features: geojsonLinks }
  }

  @Watch('timeSliderValue')
  private sliderChangedEvent(seconds: number) {
    this.store.timeSliderValue = seconds
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
    const lookup: any = {}

    // loop on all point-ids and get NOX value for each at this timepoint
    for (const point in this._locations) {
      if (!this._locations.hasOwnProperty(point)) continue
      const location = this._locations[point]
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
        feature.properties.radius = 10
      } else {
        feature.properties.radius = 0
      }
    }

    const z: any = this.mymap.getSource('my-data')
    z.setData(this.myGeoJson)
  }

  private updateTimeSliderSegmentColors(segments: number[]) {
    let gradient = '-webkit-linear-gradient(left'
    const total = segments.reduce((sum, current) => sum + current)

    for (const segment of segments) {
      if (sharedStore.debug) console.log(segment)

      const percent = (100.0 * segment) / total
      let color = ',#eee'
      if (percent > 50) color = ',#04f'
      else if (percent > 20) color = ',#33c'
      else if (percent > 10) color = ',#669'
      else if (percent > 5) color = ',#99c'
      else if (percent > 0) color = ',#aaf'
      gradient += color
    }
    gradient += ')'

    this.store.timeSlider.bgStyle.backgroundImage = gradient
  }

  private mapIsReady() {
    this.mymap.addControl(new mapboxgl.NavigationControl(), 'top-right')
    this.addJsonToMap()
    this.updateFlowsForTimeValue(this._firstEventTime)
    this.timeSliderValue = this._firstEventTime
  }

  private setupEventListeners() {}

  private async loadData() {
    return await this.readJSONFile()
  }

  private async readJSONFile() {
    this.store.loadingMsg = 'Reading data'

    try {
      const url = '/fake-nox.json'
      const resp = await fetch(url, { mode: 'no-cors' })
      const j = await resp.json()
      return j
    } catch (e) {
      this.store.msg = 'ERR >> '
      console.log(e)
      return []
    }
  }

  // MapBox requires long/lat
  private convertCoords(projection: any) {
    console.log('starting conversion', projection)

    for (const key of Object.keys(this.store.nodes)) {
      const node = this.store.nodes[key]
      const z = proj4(projection, 'WGS84', node) as any
      node.x = z.x
      node.y = z.y
    }
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
  background-color: #ffffffee;
  margin: 10px 50px;
  padding: 0px 10px;
  border: solid 1px;
  border-color: #bbb;
  border-radius: 4px;
  box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.2);
  font-size: 1.5rem;
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

.clock-labels {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr auto;
  grid-template-rows: auto;
  width: 100%;
  font-size: 10px;
  margin-bottom: 0px;
  margin-top: 0px;
  pointer-events: none;
  z-index: 2;
}
</style>
