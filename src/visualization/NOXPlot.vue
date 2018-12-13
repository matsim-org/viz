<template lang="pug">
.main-content
  #mymap
  .controls
    .slider-things
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
  flows: any
  flowSummary: number[]
  msg: string
  timeSlider: any
  timeSliderValue: 0
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
    formatter: function(index: number) {
      return '10' // convertSecondsToClockTimeMinutes(index)
    },
  }

  // store is the component data store -- the state of the component.
  private store: StoreType = {
    sharedStore: sharedStore.state,
    currentTimeSegment: 0,
    nodes: {},
    links: {},
    loadingMsg: '',
    flows: {},
    flowSummary: Array.apply(null, new Array(96)).map(() => 0),
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

  /**
   * Build lookup database of NOX events from input data
   */
  private buildEventDatabase(data: any) {
    this._locations = {}
    console.log(this._locations)

    for (const row of data) {
      // generate a row-id if there isn't one
      if (!row.id) row.id = row.lon.toString() + '/' + row.lat.toString()

      // generate a timestamp integer from the text-timestamp
      row._timestamp = Date.parse(row.t)

      // save the row
      if (!this._locations.hasOwnProperty(row.id)) {
        console.log('creating ' + row.id)
        this._locations[row.id] = []
      }
      this._locations[row.id].push(row)
    }

    // sort each location's events by timestamp
    for (const location in this._locations) {
      if (!this._locations.hasOwnProperty(location)) continue
      this._locations[location].sort((a: any, b: any) => a.t > b.t)
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
          'circle-radius': 60,
        },
      },
      'water'
    ) // layer gets added just *above* this MapBox-defined layer.
  }

  private convertJsonToGeoJson(data: any) {
    const geojsonLinks: any = []
    let id = 0

    for (const point of data) {
      const coordinates = [point.lon, point.lat]
      const color = colormap(point.NOX)

      const featureJson: any = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coordinates },
        properties: { id: id++, color: color },
      }

      geojsonLinks.push(featureJson)
    }

    return { type: 'FeatureCollection', features: geojsonLinks }
  }

  @Watch('timeSliderValue')
  private sliderChangedEvent(seconds: number) {
    this.updateFlowsForTimeValue(seconds)
  }

  private convertSecondsToClockTimeMinutes(index: number) {
    try {
      const hms = timeConvert(index)
      const minutes = ('00' + hms.minutes).slice(-2)
      return `${hms.hours}:${minutes}`
    } catch (e) {
      return ''
    }
  }

  private convertSecondsToClockTime(index: number) {
    const hms = timeConvert(index)
    const minutes = ('00' + hms.minutes).slice(-2)
    const seconds = ('00' + hms.seconds).slice(-2)
    return `${hms.hours}:${minutes}:${seconds}`
  }

  private updateFlowsForTimeValue(seconds: number) {
    const segment = Math.floor(seconds / 900) // 15 minutes

    // nothing to do if segment hasn't changed
    if (segment === this.store.currentTimeSegment) return

    this.store.setTimeSegment(segment)

    for (const link of this._linkData.features) {
      const id = link.properties.id
      link.properties.color = this.calculateColorFromVolume(id)
    }

    const z: any = this.mymap.getSource('my-data')
    z.setData(this._linkData)

    if (sharedStore.debug) console.log('done')
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
  }

  private setupEventListeners() {}

  private constructGeoJsonFromLinkData() {
    const geojsonLinks = []

    for (const id in this.store.links) {
      if (this.store.links.hasOwnProperty(id)) {
        const link = this.store.links[id]
        const fromNode = this.store.nodes[link.from]
        const toNode = this.store.nodes[link.to]

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

  private addLinksToMap() {
    const linksAsGeojson: any = this.constructGeoJsonFromLinkData()

    this.mymap.addSource('my-data', {
      data: linksAsGeojson,
      type: 'geojson',
    })

    this.mymap.addLayer(
      {
        id: 'my-layer',
        source: 'my-data',
        type: 'line',
      },
      'water'
    ) // layer gets added just *above* this MapBox-defined layer.

    const parent = this
    this.mymap.on('click', 'my-layer', function(e: MapElement) {
      parent.clickedOnLink(e)
    })

    // turn "hover cursor" into a pointer, so user knows they can click.
    this.mymap.on('mousemove', 'my-layer', function(e: MapElement) {
      parent.mymap.getCanvas().style.cursor = e ? 'pointer' : '-webkit-grab'
    })

    // and back to normal when they mouse away
    this.mymap.on('mouseleave', 'my-layer', function() {
      parent.mymap.getCanvas().style.cursor = '-webkit-grab'
    })
  }

  private calculateColorFromVolume(id: string) {
    const volume = this.store.flows[id]
      ? this.store.flows[id][this.store.currentTimeSegment]
        ? this.store.flows[id][this.store.currentTimeSegment]
        : 0
      : 0

    if (volume === 0) return '#aaa'
    if (volume < 20) return '#69f'
    if (volume < 100) return '#fc6'

    return '#f66'
  }

  private clickedOnLink(e: MapElement) {}

  private async aggregate15minutes(): Promise<void> {
    console.log('START 15-MIN AGGREGATION')
    this.store.loadingMsg = 'Aggregating'

    nSQL('events')
      .query('select')
      // .where(['type', 'IN', ['left link', 'vehicle leaves traffic']])
      .exec()
      .then(rows => {
        console.log('got so many rows:', rows.length)
        for (const row of rows) {
          const period = Math.floor(row.time / 900)
          if (!this.store.flows[row.link]) this.store.flows[row.link] = {}
          if (!this.store.flows[row.link][period]) this.store.flows[row.link][period] = 0
          this.store.flows[row.link][period]++
          this.store.flowSummary[period]++
        }
        console.log({ flows: this.store.flowSummary })
        this.updateTimeSliderSegmentColors(this.store.flowSummary)
        this.addLinksToMap()
        this.store.loadingMsg = ''
      })
  }

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

  private doNSQLstuff() {
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
   */
  private binarySearch(ar: any, el: any, compareFn: any) {
    let m = 0
    let n = ar.length - 1
    while (m <= n) {
      // tslint:disable-next-line:no-bitwise
      const k = (n + m) >> 1
      const cmp = compareFn(el, ar[k])
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
