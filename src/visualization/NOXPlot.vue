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

import { Vue, Component, Watch } from 'vue-property-decorator'
import sharedStore, { EventBus } from '../SharedStore'
import * as mapboxgl from 'mapbox-gl'
import { LngLat } from 'mapbox-gl/dist/mapbox-gl'
import { nSQL } from 'nano-sql'
import pako from 'pako'
import proj4 from 'proj4' // = require('proj4').default
import readBlob from 'read-blob'
import sax from 'sax'
import * as timeConvert from 'convert-seconds'
import vueSlider from 'vue-slider-component'

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
  private get clockTime() {
    return this.convertSecondsToClockTime(this.store.timeSliderValue)
  }

  private token: string =
    'pk.eyJ1IjoidnNwLXR1LWJlcmxpbiIsImEiOiJjamNpemh1bmEzNmF0MndudHI5aGFmeXpoIn0.u9f04rjFo7ZbWiSceTTXyA'

  private _linkData: any
  private mymap!: mapboxgl.Map

  private sharedState: any = sharedStore.state

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

  // VUE LIFECYCLE: created
  public created() {
    sharedStore.addVisualizationType({
      typeName: 'emissions',
      prettyName: 'NOX Emissions',
      description: 'Show NOX emissions at the link level',
      requiredFileKeys: ['Network', 'Events'],
      requiredParamKeys: ['Projection'],
    })
  }

  // VUE LIFECYCLE: mounted
  public mounted() {
    // this weird trick allows us to set mapbox token in typescript
    // see https://stackoverflow.com/questions/44332290/mapbox-gl-typing-wont-allow-accesstoken-assignment
    // tslint:disable-next-line:semicolon
    ;(mapboxgl as any).accessToken = this.token

    this.mymap = new mapboxgl.Map({
      bearing: 0,
      center: [14.35, 51.75], // lnglat, not latlng (think of it as: x,y)
      container: 'mymap',
      logoPosition: 'bottom-right',
      style: 'mapbox://styles/mapbox/light-v9',
      pitch: 0,
      zoom: 11,
    })

    // do things that can only be done after MapBox is fully initialized
    this.mymap.on('style.load', this.mapIsReady)
    this.setupEventListeners()
    this.loadData()
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
    this.mymap.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
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

    console.log({ links: linksAsGeojson, boop: this.mymap.getStyle().layers })

    this.mymap.addLayer(
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

  private async readEventsFile() {
    this.store.loadingMsg = 'Loading Events'

    const events: any[] = []
    const timeIndex: any = {}
    const typeIndex: any = {}

    let idAutoInc = 0
    const saxparser = sax.parser(true, {}) // strictmode=true

    const parent = this
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
      parent.store.loadingMsg = 'Analyzing'
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
          parent.aggregate15minutes()
        })
    }

    console.log('Start EVENTS')

    try {
      const url = '/data-cottbus/events.xml.gz'
      const resp = await fetch(url, { mode: 'no-cors' })
      const blob = await resp.blob()
      // get the blob data
      readBlob.arraybuffer(blob).then((content: any) => {
        const xml = pako.inflate(content, { to: 'string' })
        saxparser.write(xml).close()
      })
    } catch (e) {
      this.store.msg = 'ERR>>'
      console.log(e)
    }
  }

  private async readNetworkFile() {
    this.store.loadingMsg = 'Reading Network'
    const saxparser = sax.parser(true, {}) // strictmode=true

    const parent = this
    saxparser.onopentag = function(tag: any) {
      const attr = tag.attributes

      if (tag.name === 'node') {
        attr.x = parseFloat(attr.x)
        attr.y = parseFloat(attr.y)
        parent.store.nodes[attr.id] = attr
      }

      if (tag.name === 'link') {
        parent.store.links[attr.id] = attr
      }
    }

    const COTTBUS_PROJECTION = '+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs'

    saxparser.onend = function() {
      parent.convertCoords(COTTBUS_PROJECTION)
    }

    try {
      const url = '/data-cottbus/network.xml.gz'
      const resp = await fetch(url, { mode: 'no-cors' })
      const blob = await resp.blob()
      // get the blob data
      readBlob.arraybuffer(blob).then((content: any) => {
        const xml = pako.inflate(content, { to: 'string' })
        saxparser.write(xml).close()
      })
    } catch (e) {
      this.store.msg = 'ERR>>'
      console.log(e)
    }
  }

  private async loadData() {
    this.readNetworkFile()
    this.readEventsFile()
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
