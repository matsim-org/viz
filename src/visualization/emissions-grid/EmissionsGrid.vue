<template lang="pug">
.main-content
  #mymap
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
          button.button.pollutant(
            :class="{'is-warning': p===pollutant, 'is-gray': p!==pollutant}"
            @click="clickedPollutant(p)") {{p}}
      h4.heading Time of Day
      .slider-box
        time-slider.time-slider(:bind="currentTime"
                                :initialTime="currentTime"
                                @change="changedSlider")

    .theme-choices
      img.theme-button(v-for="theme in themes"
                       :class="{'selected-theme': theme.name === chosenTheme.name}"
                       :src="theme.icon"
                       @click="clickedTheme(theme)")
    // .left-overlay
    //   h1.clock {{clockTime}}
</template>

<script lang="ts">
'use strict'
import * as timeConvert from 'convert-seconds'
import mapboxgl from 'mapbox-gl'
import { LngLat } from 'mapbox-gl/dist/mapbox-gl'
import pako from 'pako'
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
  private firstLoad: boolean = true
  private mymap!: mapboxgl.Map
  private mapExtentXYXY: any = [180, 90, -180, -90]
  private initialMapExtent: any = null
  private noxLocations: any
  private sharedState: any = sharedStore.state

  private loadingText: string = 'Emissions Grid'
  private visualization: any = null
  private project: any = {}
  private projection!: string

  private pollutant: string = ''
  private pollutantsMaxValue: { [id: string]: number } = {}
  private dataLookup: any = []

  private themes: any = [
    {
      name: 'Inferno',
      colorRamp: 'revInferno',
      icon: '/infernwhite.png',
      style: 'mapbox://styles/mapbox/light-v9',
    },
    {
      name: 'Viridis',
      colorRamp: 'revViridis',
      icon: '/viriwhite.png',
      style: 'mapbox://styles/mapbox/light-v9',
    },
    {
      name: 'Indarko',
      colorRamp: 'colorInferno',
      icon: '/inferno.png',
      style: 'mapbox://styles/mapbox/dark-v9',
    },
    {
      name: 'Viridark',
      colorRamp: 'colorViridis',
      icon: '/viridis.png',
      style: 'mapbox://styles/mapbox/dark-v9',
    },
  ]

  // choose your colormap: for emissions we'll use inferno
  // https://www.npmjs.com/package/scale-color-perceptual
  private chosenTheme: any = this.themes[0]

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

    // do things that can only be done after MapBox is fully initialized
    this.mymap = new mapboxgl.Map({
      bearing: 0,
      // center: [x,y], // lnglat, not latlng (think of it as: x,y)
      container: 'mymap',
      logoPosition: 'bottom-right',
      style: this.chosenTheme.style,
      pitch: 0,
      zoom: 14,
    })

    this.initialMapExtent = localStorage.getItem(this.vizId + '-bounds')
    if (this.initialMapExtent) {
      const lnglat = JSON.parse(this.initialMapExtent)
      this.mymap.fitBounds(lnglat, {
        padding: { top: 50, bottom: 100, right: 100, left: 300 },
        animate: false,
      })
    }

    this.mymap.on('style.load', this.mapIsReady)
  }

  private clickedTheme(theme: any) {
    console.log('changing theme: ' + theme)

    if (theme.style !== this.chosenTheme.style) {
      console.log('changing style: ' + theme.style)
      this.mymap.setStyle(theme.style)
      // this.addJsonToMap()
    }

    this.chosenTheme = theme
    this.mymap.setPaintProperty('hex-layer', 'fill-extrusion-color', ['get', theme.colorRamp])
  }

  private setJsonSource() {
    try {
      this.mymap.addSource('hexagons', {
        data: this.dataLookup[0].hexesByPollutant[this.pollutants[0]],
        type: 'geojson',
      })
    } catch (e) {
      console.log(e)
    }
  }

  private addJsonToMap() {
    this.mymap.addLayer(
      {
        id: 'hex-layer',
        source: 'hexagons',
        type: 'fill-extrusion',
        paint: {
          'fill-extrusion-color': ['get', this.chosenTheme.colorRamp],
          'fill-extrusion-opacity': 0.95, // ['get', 'op'],
          'fill-extrusion-height': ['get', 'height'],
        },
      }
      // 'road-street'
      // 'water', 'tunnel-street-low' // water, road-street, road-secondary-tertiary, building...
    ) // layer gets added just *under* this MapBox-defined layer.
  }

  private updateMapExtent(coordinates: any) {
    this.mapExtentXYXY[0] = Math.min(this.mapExtentXYXY[0], coordinates[0])
    this.mapExtentXYXY[1] = Math.min(this.mapExtentXYXY[1], coordinates[1])
    this.mapExtentXYXY[2] = Math.max(this.mapExtentXYXY[2], coordinates[0])
    this.mapExtentXYXY[3] = Math.max(this.mapExtentXYXY[3], coordinates[1])
  }

  private setMapExtent() {
    localStorage.setItem(this.vizId + '-bounds', JSON.stringify(this.mapExtentXYXY))
    this.mymap.fitBounds(this.mapExtentXYXY, {
      padding: { top: 50, bottom: 100, right: 100, left: 300 },
      animate: false,
    })
  }

  private clickedPollutant(p: string) {
    console.log(p)
    this.pollutant = p
    ;(this.mymap.getSource('hexagons') as any).setData(this.dataLookup[0].hexesByPollutant[p])
  }

  private async calculateMaxValues(data: any) {
    for (const bin of data.timeBins) {
      for (const point of bin.value.cells) {
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
    }

    console.log({ MAX_VALUE: this.pollutantsMaxValue })
    this.setMapExtent()
  }

  private getHexagon(point: any, hexwidth: number, hexheight: number, properties: any) {
    // HEXagons
    const coord = point.coordinate
    const hexPoints = []

    const halfhexheight = 0.5 * hexheight

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

    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [z] },
      properties: properties,
    }
  }

  private buildLookupForTimeBins(data: any) {
    const lookup: any = []
    for (const bin of data.timeBins) {
      const startTime = bin.startTime
      const hexesByPollutant = this.calculateHexValuesForCells(bin.value.cells)

      lookup.push({ startTime, hexesByPollutant })
    }

    console.log(lookup)
    return lookup
  }

  private calculateHexValuesForCells(cells: any) {
    const hexesByPollutant: any = {}
    const fullRadius = 0.5 * parseFloat(this.visualization.parameters['Cell size'].value)

    for (const p of this.pollutants) hexesByPollutant[p] = { type: 'FeatureCollection', features: [] }

    for (const point of cells) {
      if (point.value === {}) continue

      for (const p of this.pollutants) {
        const pollutantHex = this.getHexagonValuesForPollutant(point, p, fullRadius)
        if (pollutantHex) hexesByPollutant[p].features.push(pollutantHex)
      }
    }

    return hexesByPollutant
  }

  private getHexagonValuesForPollutant(point: any, p: string, fullRadius: number) {
    let value = point.value[p] / this.pollutantsMaxValue[p]

    if (!value) return null
    if (value < 0.01) return null

    if (value > 1) value = 1

    const hexwidth = fullRadius * Math.min(1.0, value * 10)
    const hexheight = hexwidth * 1.1547005 // which is 2/sqrt(3)

    // Rapidly scale up opacity when rel.value is 0-20%; anything > 20% gets full opacity
    const op = Math.min(0.95, value * 5)

    const colorInferno = inferno(value)
    const colorViridis = viridis(value)
    const revInferno = inferno(1.0 - value)
    const revViridis = viridis(1.0 - value)

    const id = point.coordinate.x.toString() + '/' + point.coordinate.y.toString()
    const height = 2000 * value

    const properties = { id, value, height, op, colorInferno, colorViridis, revInferno, revViridis }
    const hexagon = this.getHexagon(point, hexwidth, hexheight, properties)

    return hexagon
  }

  private changedSlider(seconds: number) {
    console.log('SLIDER: ' + seconds)
    this.currentTime = seconds
    // this.updateFlowsForTimeValue(seconds)
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

  private async loadData() {
    this.loadingText = 'Fetching data'
    const jsonData = await this.fetchEmissionsData()

    this.loadingText = 'Calculating ranges'
    await this.calculateMaxValues(jsonData)

    this.loadingText = 'Laying out tiles'
    this.dataLookup = this.buildLookupForTimeBins(jsonData)

    console.log(this.mapExtentXYXY)

    this.pollutant = this.pollutants[0]
  }

  // this is called every time map setStyle is called, too
  private async mapIsReady() {
    if (this.firstLoad) {
      this.firstLoad = false
      this.mymap.addControl(new mapboxgl.NavigationControl(), 'top-right')
      await this.loadData()

      if (!this.initialMapExtent) {
        this.mymap.jumpTo({ center: [this.mapExtentXYXY[0], this.mapExtentXYXY[1]], zoom: 13 })
        this.mymap.fitBounds(this.mapExtentXYXY, { padding: 150 })
      }
    }

    this.setJsonSource()
    this.addJsonToMap()
    this.loadingText = ''
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
  background: #fff;
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
  background-color: #fff;
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
  color: #0066a2; /* #ffa; /* #0066a1; */
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
  background-color: #eeeeffee;
  margin: 0px 0px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  text-align: center;
  grid-column: 1 / 2;
  grid-row: 1 / 3;
  opacity: 1;
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
  padding: 0rem 0.25rem;
  height: 100%;
}

.pollutant {
  width: 100%;
  margin-bottom: 0.25rem;
}

.heading {
  text-align: left;
  color: black;
  margin-top: 2rem;
}

@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.theme-choices {
  display: flex;
  flex-direction: row;
  margin: 2px auto;
}

.theme-button {
  width: 3rem;
  height: 3rem;
  margin: 0rem 0.25rem 0.5rem 0.25rem;
  padding: 1px 1px;
  background-color: black;
}

.theme-button:hover {
  background-color: cyan;
}

.selected-theme {
  background-color: #6f6;
}

.selected-theme:hover {
  background-color: #6f6;
}
</style>
