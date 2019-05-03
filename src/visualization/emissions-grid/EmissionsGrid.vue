<template lang="pug">
.main-content
  .status-blob(v-if="loadingText"): p {{ loadingText }}
  project-summary-block.project-summary-block(:project="project" :projectId="projectId")
  .info-blob(v-if="!loadingText")
    project-summary-block.project-summary-block(:project="project" :projectId="projectId")
    .info-header
      h3(style="padding: 0rem 3rem 0.5rem 3rem; font-weight: normal;color: white;") Emissions Grid
    .buttons-bar
      h4.heading Pollutant
      .pollutants
        .hey(v-for="p in pollutants")
          button.button(style="width:100%;" :class="{'is-warning': p===pollutant, 'is-black': p!==pollutant}"
            @click="clickedPollutant(p)") {{p}}

    h4.heading(style="padding-left:0.5rem") Time of Day
    .slider-box
      time-slider.time-slider(:bind="currentTime" :initialTime="currentTime" @change="changedSlider")

  #mymap
  //.left-overlay
  // h1.clock {{clockTime}}
</template>

<script lang="ts">
'use strict'
import * as timeConvert from 'convert-seconds'
import mapboxgl from 'mapbox-gl'
import { LngLat } from 'mapbox-gl/dist/mapbox-gl'
import pako from 'pako'
import proj4 from 'proj4'
import readBlob from 'read-blob'

import AuthenticationStore from '@/auth/AuthenticationStore'
import Coords from '@/components/Coords'
import Config from '@/config/Config'
import EventBus from '@/EventBus.vue'
import FileAPI from '@/communication/FileAPI'
import ProjectStore from '@/project/ProjectStore'
import ProjectSummaryBlock from '@/visualization/transit-supply/ProjectSummaryBlock.vue'
import sharedStore from '@/SharedStore'
import TimeSlider from '@/components/TimeSlider.vue'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { inferno, viridis } from 'scale-color-perceptual'

sharedStore.addVisualizationType({
  typeName: 'emissions',
  prettyName: 'Emissions Grid',
  description: 'Show emissions at gridpoints',
  requiredFileKeys: ['Events', 'Network'],
  requiredParamKeys: ['Projection', 'Cell size', 'Smoothing radius', 'Time bin size'],
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
  components: {
    'time-slider': TimeSlider,
    'project-summary-block': ProjectSummaryBlock,
  },
})
export default class EmissionsGrid extends Vue {
  @Prop({ type: String, required: true })
  private projectId!: string

  @Prop({ type: String, required: true })
  private vizId!: string

  @Prop({ type: ProjectStore, required: true })
  private projectStore!: ProjectStore

  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

  @Prop({ type: FileAPI, required: true })
  private fileApi!: FileAPI

  private currentTime: number = 0
  private firstEventTime: number = 0
  private mymap!: mapboxgl.Map
  private mapExtentXYXY: any = [180, 90, -180, -90]
  private noxLocations: any
  private sharedState: any = sharedStore.state

  private loadingText: string = 'Emissions Grid'
  private visualization: any = null
  private project: any = {}
  private projection!: string

  private pollutant: string = ''
  private pollutantsMaxValue: { [id: string]: number } = {}
  private pollutantsHexagons: { [id: string]: any } = {}

  private maxEmissionValue: number = 0

  private get clockTime() {
    return this.convertSecondsToClockTime(this.currentTime)
  }

  private get pollutants() {
    return Object.keys(this.pollutantsMaxValue).sort()
  }

  public created() {}

  public async fetchEmissionsData(): Promise<any> {
    const result = await fetch(`${Config.emissionsServer}/${this.vizId}/data`, {
      mode: 'cors',
      headers: { Authorization: 'Bearer ' + this.authStore.state.accessToken },
    })

    if (result.ok) {
      try {
        const thing = await result.json()
        console.log(thing)
        return thing
      } catch (e) {
        throw new Error(e)
      }
    } else if (result.status === 401) {
      throw new Error('Unauthorized: ' + (await result.text()))
    } else {
      throw new Error(await result.text())
    }
  }

  // VUE LIFECYCLE: mounted
  public async mounted() {
    this.visualization = await this.fileApi.fetchVisualization(this.projectId, this.vizId)
    this.project = await this.fileApi.fetchProject(this.projectId)
    if (this.visualization.parameters.Projection) this.projection = this.visualization.parameters.Projection.value

    this.mymap = new mapboxgl.Map({
      bearing: 0,
      // center: [x,y], // lnglat, not latlng (think of it as: x,y)
      container: 'mymap',
      logoPosition: 'bottom-right',
      style: 'mapbox://styles/mapbox/light-v9',
      pitch: 0,
      zoom: 14,
    })

    // this.myGeoJson = await this.convertJsonToGeoJson(jsondata)
    // await this.buildEventDatabase(jsondata)

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
    this.mymap.addSource('hexagons', {
      data: this.pollutantsHexagons[this.pollutants[0]],
      type: 'geojson',
    })

    this.mymap.addLayer(
      {
        id: 'my-layer',
        source: 'hexagons',
        type: 'fill',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['get', 'op'],
        },
      },
      'road-street'
      // 'water', 'tunnel-street-low' // water, road-street, road-secondary-tertiary, building...
    ) // layer gets added just *under* this MapBox-defined layer.
  }

  private updateMapExtent(coordinates: any) {
    this.mapExtentXYXY[0] = Math.min(this.mapExtentXYXY[0], coordinates[0])
    this.mapExtentXYXY[1] = Math.min(this.mapExtentXYXY[1], coordinates[1])
    this.mapExtentXYXY[2] = Math.max(this.mapExtentXYXY[2], coordinates[0])
    this.mapExtentXYXY[3] = Math.max(this.mapExtentXYXY[3], coordinates[1])
  }

  private clickedPollutant(p: string) {
    console.log(this.pollutantsHexagons[p])
    this.pollutant = p

    ;(this.mymap.getSource('hexagons') as any).setData(this.pollutantsHexagons[p])
  }

  private async calculateMaxValues(data: any) {
    for (const point of data.timeBins[0].value.cells) {
      if (!point.value) continue

      // set pollutant max-extent
      for (const pollutant of Object.keys(point.value)) {
        if (!this.pollutantsMaxValue.hasOwnProperty(pollutant)) {
          this.pollutantsMaxValue[pollutant] = point.value[pollutant]
        }
        this.pollutantsMaxValue[pollutant] = Math.max(this.pollutantsMaxValue[pollutant], point.value[pollutant])
      }

      // set map extent
      const coordinates = Coords.toLngLat(this.projection, { x: point.coordinate.x, y: point.coordinate.y })
      this.updateMapExtent([coordinates.x, coordinates.y])
    }
    console.log({ MAX_VALUE: this.pollutantsMaxValue })
  }

  private convertJsonToGeoJson(data: any, pollutantID: string) {
    const geojsonPoints: any = []

    this.firstEventTime = 1e20

    const fullradius = 0.5 * parseFloat(this.visualization.parameters['Cell size'].value)

    this.maxEmissionValue = this.pollutantsMaxValue[pollutantID]

    for (const point of data.timeBins[0].value.cells) {
      if (point.value === {}) continue

      let value = point.value[pollutantID] / this.maxEmissionValue
      if (!value) continue
      if (value < 0.01) continue

      if (value > 1) value = 1

      const hexwidth = fullradius * Math.min(1.0, value * 10)
      const hexheight = hexwidth * 1.1547005 // which is 2/sqrt(3)
      const halfhexheight = 0.5 * hexheight

      const color = colormap(value)
      const op = Math.min(0.95, value * 5)

      // this.firstEventTime = Math.min(this.firstEventTime, point.time)

      // HEXagons
      const coord = point.coordinate
      const hexPoints = []
      hexPoints.push({ x: coord.x, y: coord.y + hexheight })
      hexPoints.push({ x: coord.x + hexwidth, y: coord.y + halfhexheight })
      hexPoints.push({ x: coord.x + hexwidth, y: coord.y - halfhexheight })
      hexPoints.push({ x: coord.x, y: coord.y - hexheight })
      hexPoints.push({ x: coord.x - hexwidth, y: coord.y - halfhexheight })
      hexPoints.push({ x: coord.x - hexwidth, y: coord.y + halfhexheight })
      hexPoints.push({ x: coord.x, y: coord.y + hexheight })

      const z = hexPoints.map(mm => {
        const longlat = Coords.toLngLat(this.projection, mm)
        return [longlat.x, longlat.y]
      })

      const id = point.coordinate.x.toString() + '/' + point.coordinate.y.toString()

      const featureJson: any = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [z] },
        properties: { id: id, color: color, op: op }, // '#003388' },
      }

      geojsonPoints.push(featureJson)
    }
    console.log(geojsonPoints)
    // this.currentTime = this.firstEventTime

    return { type: 'FeatureCollection', features: geojsonPoints }
  }

  private changedSlider(seconds: number) {
    //    this.currentTime = seconds
    //    this.updateFlowsForTimeValue(seconds)
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

  private async mapIsReady() {
    this.mymap.addControl(new mapboxgl.NavigationControl(), 'top-right')

    this.loadingText = 'Fetching data'
    const jsonData = await this.fetchEmissionsData()

    this.loadingText = 'Calculating ranges'
    await this.calculateMaxValues(jsonData)

    this.loadingText = 'Laying out tiles'

    for (const p of this.pollutants) {
      console.log(p)
      this.pollutantsHexagons[p] = await this.convertJsonToGeoJson(jsonData, p)
    }

    console.log(this.mapExtentXYXY)

    this.pollutant = this.pollutants[0]
    this.addJsonToMap()
    // this.updateFlowsForTimeValue(this.firstEventTime)

    this.mymap.jumpTo({ center: [this.mapExtentXYXY[0], this.mapExtentXYXY[1]], zoom: 13 })
    this.mymap.fitBounds(this.mapExtentXYXY, { padding: 100 })

    this.loadingText = ''
    // this.currentTime = this.firstEventTime
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

.status-blob {
  background-color: #222;
  box-shadow: 0 0 8px #00000040;
  opacity: 0.9;
  margin: auto 0px auto -10px;
  padding: 3rem 0px;
  text-align: center;
  grid-column: 1 / 3;
  grid-row: 1 / 3;
  z-index: 2;
  border-top: solid 1px #479ccc;
  border-bottom: solid 1px #479ccc;
}

.status-blob p {
  color: #ffa;
}

.project-summary-block {
  width: 16rem;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  margin: 0px auto auto 0px;
  z-index: 10;
}

.info-blob {
  display: flex;
  flex-direction: column;
  width: 16rem;
  height: 100vh;
  background-color: #363a45;
  margin: 0px 0px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  text-align: center;
  grid-column: 1 / 2;
  grid-row: 1 / 3;
  opacity: 0.95;
  z-index: 5;
  animation: 0.3s ease 0s 1 slideInFromLeft;
}

.info-header {
  background-color: #097c43;
  padding: 0.5rem 0rem;
  border-top: solid 1px #888;
  border-bottom: solid 1px #888;
}

.buttons-bar {
  margin: 0.5rem 0.5rem 0.5rem 0.5rem;
  height: 100%;
}

.heading {
  text-align: left;
  color: #fff;
  margin-top: 1rem;
}

@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.hey {
  margin-top: 2px;
}
</style>
