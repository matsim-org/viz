<template lang="pug">
#container
  .status-blob(v-if="loadingText"): p {{ loadingText }}
  project-summary-block.project-summary-block(:project="project" :projectId="projectId")
  .info-blob
    project-summary-block.project-summary-block(:project="project" :projectId="projectId")
    .info-header
      h3(style="padding: 0.5rem 3rem; font-weight: normal;color: white;") Trips between aggregate areas:
    p.details.help-text(style="margin-top:20px") Select a link for more details.
    b Time of day:
    time-slider(style="margin: 1rem 0rem 1rem 0.25rem")
  #mymap
  // legend-box.legend(:rows="legendRows")
</template>

<script lang="ts">
'use strict'

import * as BlobUtil from 'blob-util'
import * as shapefile from 'shapefile'
import * as turf from '@turf/turf'
import colormap from 'colormap'
import mapboxgl, { MapMouseEvent } from 'mapbox-gl'
import proj4 from 'proj4'
import VueSlider from 'vue-slider-component'
import { Vue, Component, Prop } from 'vue-property-decorator'

import AuthenticationStore from '@/auth/AuthenticationStore'
import FileAPI from '@/communication/FileAPI'
import LegendBox from '@/visualization/transit-supply/LegendBox.vue'
import ProjectSummaryBlock from '@/visualization/transit-supply/ProjectSummaryBlock.vue'
import SharedStore from '@/SharedStore'
import TimeSlider from '@/components/TimeSlider.vue'
import { Visualization } from '@/entities/Entities'
import { multiPolygon } from '@turf/turf'
import { FeatureCollection, Feature } from 'geojson'

const COLOR_CATEGORIES = 16

const sliderSettings = {
  value: '2016-10-01',
  width: '80%',
  tooltip: 'always',
  disabled: false,
  piecewise: true,
  piecewiseLabel: true,
  style: {
    marginLeft: '10%',
  },
  data: ['2016-10-01', '2016-10-02', '2016-10-03', '2016-10-04', '2016-10-05', '2016-10-06', '2016-10-07'],
  piecewiseStyle: {
    backgroundColor: '#ccc',
    visibility: 'visible',
    width: '12px',
    height: '12px',
  },
  piecewiseActiveStyle: {
    backgroundColor: '#3498db',
  },
  labelActiveStyle: {
    color: '#3498db',
  },
}

proj4.defs([
  [
    // south africa
    'EPSG:2048',
    '+proj=tmerc +lat_0=0 +lon_0=19 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    // berlin
    'EPSG:31468',
    '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs',
  ],
  [
    // cottbus
    'EPSG:25833',
    '+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs',
  ],
])

// aliases
proj4.defs('DK4', proj4.defs('EPSG:31468'))

const INPUTS = {
  OD_FLOWS: 'O/D Flows (.csv)',
  SHP_FILE: 'Shapefile .SHP',
  DBF_FILE: 'Shapefile .DBF',
}

// register component with the SharedStore
SharedStore.addVisualizationType({
  typeName: 'aggregate-od',
  prettyName: 'Origin/Destination Patterns',
  description: 'Depicts aggregate O/D flows between areas.',
  requiredFileKeys: [INPUTS.OD_FLOWS, INPUTS.SHP_FILE, INPUTS.DBF_FILE],
  requiredParamKeys: ['Projection'],
})

@Component({
  components: {
    'legend-box': LegendBox,
    'project-summary-block': ProjectSummaryBlock,
    'time-slider': TimeSlider,
  },
})
export default class AggregateOD extends Vue {
  @Prop({ type: String, required: true })
  private vizId!: string

  @Prop({ type: String, required: true })
  private projectId!: string

  @Prop({ type: FileAPI, required: true })
  private fileApi!: FileAPI

  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

  // -------------------------- //

  private centroids: any = {}
  private odLookup: any = {}

  private loadingText: string = 'Aggregate Origin/Destination Flows'
  private mymap!: mapboxgl.Map
  private project: any = {}
  private visualization!: Visualization

  private projection!: string
  private hoveredStateId: any

  private _mapExtentXYXY!: any
  private _maximum!: number

  public created() {
    this._mapExtentXYXY = [180, 90, -180, -90]
    this._maximum = 0
  }

  public async mounted() {
    this.projectId = (this as any).$route.params.projectId
    this.vizId = (this as any).$route.params.vizId

    await this.getVizDetails()
    this.setupMap()
  }

  private async getVizDetails() {
    this.visualization = await this.fileApi.fetchVisualization(this.projectId, this.vizId)
    this.project = await this.fileApi.fetchProject(this.projectId)

    if (this.visualization.parameters.Projection) {
      this.projection = this.visualization.parameters.Projection.value
    }

    if (SharedStore.debug) console.log(this.visualization)
  }

  private get legendRows() {
    return [['#a03919', 'Rail'], ['#448', 'Bus']]
  }

  private setupMap() {
    this.mymap = new mapboxgl.Map({
      container: 'mymap',
      logoPosition: 'bottom-left',
      style: 'mapbox://styles/mapbox/outdoors-v9',
    })

    const extent = localStorage.getItem(this.vizId + '-bounds')
    if (extent) {
      const lnglat = JSON.parse(extent)
      this.mymap.fitBounds(lnglat, {
        padding: { top: 50, bottom: 100, right: 100, left: 300 },
        animate: false,
      })
    }

    this.mymap.addControl(new mapboxgl.NavigationControl(), 'top-right')
    this.mymap.on('click', this.handleEmptyClick)
    // Start doing stuff AFTER the MapBox library has fully initialized
    this.mymap.on('load', this.mapIsReady)
  }

  private handleEmptyClick(e: mapboxgl.MapMouseEvent) {}

  private async mapIsReady() {
    const files = await this.loadFiles()
    if (files) {
      const geojson = await this.processInputs(files)
      this.setMapExtent()
      this.addGeojsonToMap(geojson)
      this.addCentroids(geojson)
      this.processHourlyData(files.odFlows)
      this.buildSpiderLinks()
      this.setupKeyListeners()
    }

    this.loadingText = ''
  }

  private buildSpiderLinks() {
    const featureCollection: FeatureCollection = { type: 'FeatureCollection', features: [] }
    for (const id in this.odLookup) {
      if (!this.odLookup.hasOwnProperty(id)) continue

      const link: any = this.odLookup[id]
      try {
        const origCoord = this.centroids[link.orig].geometry.coordinates
        const destCoord = this.centroids[link.dest].geometry.coordinates
        const feature: any = {
          type: 'Feature',
          properties: { id: id, orig: link.orig, dest: link.dest, daily: link.daily },
          geometry: {
            type: 'LineString',
            coordinates: [origCoord, destCoord],
          },
        }

        featureCollection.features.push(feature)
      } catch (e) {
        // some dests aren't on map: z.b. 'other'
      }
    }

    this.mymap.addSource('spider-source', {
      data: featureCollection,
      type: 'geojson',
    } as any)

    this.mymap.addLayer(
      {
        id: 'spider-layer',
        source: 'spider-source',
        type: 'line',
        paint: {
          'line-color': '#097c43',
          'line-width': ['get', 'daily'],
        },
      },
      'centroid-layer'
    )

    const parent = this
    this.mymap.on('click', 'spider-layer', function(e: mapboxgl.MapMouseEvent) {
      parent.clickedOnSpiderLink(e)
    })

    // turn "hover cursor" into a pointer, so user knows they can click.
    this.mymap.on('mousemove', 'spider-layer', function(e: mapboxgl.MapMouseEvent) {
      parent.mymap.getCanvas().style.cursor = e ? 'pointer' : 'grab'
    })

    // and back to normal when they mouse away
    this.mymap.on('mouseleave', 'spider-layer', function() {
      parent.mymap.getCanvas().style.cursor = 'grab'
    })
  }

  private clickedOnSpiderLink(e: any) {
    console.log({ CLICK: e })

    const props = e.features[0].properties
    console.log(props)

    const trips = props.daily
    let revTrips = 0
    const reverseDir = '' + props.dest + ':' + props.orig

    if (this.odLookup[reverseDir]) revTrips = this.odLookup[reverseDir].daily

    const totalTrips = trips + revTrips

    let html = `<h1>${totalTrips} Total Trips</h1><br/>`
    html += `<p><b>${trips} trips</b> (${props.orig} -> ${props.dest})</p>`
    html += `<p><b>${revTrips} trips</b> (${props.dest} -> ${props.orig})</p>`

    new mapboxgl.Popup({ closeOnClick: true })
      .setLngLat(e.lngLat)
      .setHTML(html)
      .addTo(this.mymap)
  }

  private addCentroids(geojson: FeatureCollection) {
    const centroids: FeatureCollection = { type: 'FeatureCollection', features: [] }

    for (const feature of geojson.features) {
      const centroid: any = turf.centerOfMass(feature as any)
      centroid.properties.id = feature.id
      centroids.features.push(centroid)

      if (feature.properties) this.centroids[feature.properties.NO] = centroid
    }
    console.log({ CENTROIDS: this.centroids })

    this.mymap.addSource('centroids', {
      data: centroids,
      type: 'geojson',
    } as any)

    this.mymap.addLayer({
      id: 'centroid-layer',
      source: 'centroids',
      type: 'circle',
      paint: {
        'circle-color': '#ec0',
        'circle-radius': 12,
        'circle-stroke-width': 3,
        'circle-stroke-color': 'white',
      },
    })

    this.mymap.addLayer({
      id: 'centroid-label-layer',
      source: 'centroids',
      type: 'symbol',
      layout: {
        'text-field': '{id}',
        'text-size': 11,
      },
    })
  }

  private setMapExtent() {
    localStorage.setItem(this.vizId + '-bounds', JSON.stringify(this._mapExtentXYXY))
    this.mymap.fitBounds(this._mapExtentXYXY, {
      padding: { top: 50, bottom: 100, right: 100, left: 300 },
      animate: false,
    })
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

  private async loadFiles() {
    try {
      this.loadingText = 'Loading files...'

      if (SharedStore.debug) console.log(this.visualization.inputFiles)

      const shpfileID = this.visualization.inputFiles[INPUTS.SHP_FILE].fileEntry.id
      const shpBlob = await this.fileApi.downloadFile(shpfileID, this.projectId)
      const shpFile: ArrayBuffer = await BlobUtil.blobToArrayBuffer(shpBlob)

      const dbfID = this.visualization.inputFiles[INPUTS.DBF_FILE].fileEntry.id
      const dbfBlob = await this.fileApi.downloadFile(dbfID, this.projectId)
      const dbfFile: ArrayBuffer = await BlobUtil.blobToArrayBuffer(dbfBlob)

      const odFlowsID = this.visualization.inputFiles[INPUTS.OD_FLOWS].fileEntry.id
      const odBlob = await this.fileApi.downloadFile(odFlowsID, this.projectId)
      const odFlows: string = await BlobUtil.blobToBinaryString(odBlob)

      return { shpFile, dbfFile, odFlows }
    } catch (e) {
      console.error({ e })
      this.loadingText = '' + e
      return null
    }
  }

  private async processInputs(files: any) {
    this.loadingText = 'Converting to GeoJSON...'
    const geojson = await shapefile.read(files.shpFile, files.dbfFile)

    this.loadingText = 'Converting coordinates...'
    for (const feature of geojson.features) {
      // save id
      if (feature.properties) feature.id = feature.properties.NO

      try {
        if (feature.geometry.type === 'MultiPolygon') {
          this.convertMultiPolygonCoordinatesToWGS84(feature)
        } else {
          this.convertPolygonCoordinatesToWGS84(feature)
        }
      } catch (e) {
        console.error('ERR with feature: ' + feature)
        console.error(e)
      }
    }

    console.log(geojson)
    return geojson
  }

  private convertPolygonCoordinatesToWGS84(polygon: any) {
    for (const origCoords of polygon.geometry.coordinates) {
      const newCoords: any = []
      for (const p of origCoords) {
        const lnglat = proj4(this.projection, 'WGS84', p) as any
        newCoords.push(lnglat)
      }

      // replace existing coords
      origCoords.length = 0
      origCoords.push(...newCoords)

      if (origCoords.length > 0) this.updateMapExtent(origCoords[0])
    }
  }

  private convertMultiPolygonCoordinatesToWGS84(multipolygon: any) {
    for (const origCoords of multipolygon.geometry.coordinates) {
      const coordinates = origCoords[0] // multipolygons have an extra array[0] added

      const newCoords: any = []
      for (const p of coordinates) {
        const lnglat = proj4(this.projection, 'WGS84', p) as any
        newCoords.push(lnglat)
      }

      origCoords[0] = newCoords

      if (origCoords[0].length > 0) this.updateMapExtent(origCoords[0][0])
    }
  }

  private processHourlyData(csvData: string) {
    const lines = csvData.split('\n')
    if (lines[0].trim().split(';').length !== 26) {
      this.loadingText = 'CSV data does not have O,D, and then 24 hourly columns.'
      return
    }

    this.loadingText = 'Analyzing hourly data...'
    for (const row of lines.slice(1)) {
      const columns = row.split(';')
      if (columns.length !== 26) continue
      const values = columns.slice(2).map(a => {
        return parseFloat(a)
      })

      // TODO build in-memory lookup table here
      const daily = values.slice(2).reduce((total, num) => {
        return total + num
      })

      if (daily === 0) continue

      const rowName = String(columns[0]) + ':' + String(columns[1])
      this.odLookup[rowName] = { orig: columns[0], dest: columns[1], daily, values }
    }
    console.log(this.odLookup)
  }

  private updateMapExtent(coordinates: any) {
    this._mapExtentXYXY[0] = Math.min(this._mapExtentXYXY[0], coordinates[0])
    this._mapExtentXYXY[1] = Math.min(this._mapExtentXYXY[1], coordinates[1])
    this._mapExtentXYXY[2] = Math.max(this._mapExtentXYXY[2], coordinates[0])
    this._mapExtentXYXY[3] = Math.max(this._mapExtentXYXY[3], coordinates[1])
  }

  private addGeojsonToMap(geojson: any) {
    this.mymap.addSource('shpsource', {
      data: geojson,
      type: 'geojson',
    } as any)

    this.mymap.addLayer(
      {
        id: 'shplayer-fill',
        source: 'shpsource',
        type: 'fill',
        paint: {
          'fill-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#fba', '#dde'],
          'fill-opacity': 0.6,
        },
      },
      'road-primary'
    )
    /*
    this.mymap.addLayer(
      {
        id: 'shplayer-borders',
        source: 'shpsource',
        type: 'line',
        paint: {
          'line-color': '#aaccee',
          'line-width': 3,
        },
      },
      'waterway-label'
    )
*/
    // HOVER effects
    const parent = this

    this.mymap.on('mousemove', 'shplayer-fill', function(e: any) {
      // typescript definitions and mapbox-gl are out of sync at the moment :-(
      // so setFeatureState is missing
      const tsMap = parent.mymap as any
      if (e.features.length > 0) {
        if (parent.hoveredStateId) {
          tsMap.setFeatureState({ source: 'shpsource', id: parent.hoveredStateId }, { hover: false })
        }
        parent.hoveredStateId = e.features[0].properties.NO
        tsMap.setFeatureState({ source: 'shpsource', id: parent.hoveredStateId }, { hover: true })
      }
    })

    // When the mouse leaves the state-fill layer, update the feature state of the
    // previously hovered feature.
    this.mymap.on('mouseleave', 'shplayer-fill', function() {
      const tsMap = parent.mymap as any
      if (parent.hoveredStateId) {
        tsMap.setFeatureState({ source: 'shpsource', id: parent.hoveredStateId }, { hover: false })
      }
      parent.hoveredStateId = null
    })
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

  private pressedEscape() {}

  private pressedArrowKey(delta: number) {}
}

const _colorScale = colormap({ colormap: 'viridis', nshades: COLOR_CATEGORIES })
</script>

<style scoped>
.mapboxgl-popup-content {
  padding: 0px 20px 0px 0px;
  opacity: 0.95;
  box-shadow: 0 0 3px #00000080;
}

h3 {
  margin: 0px 0px;
  font-size: 16px;
}

h4,
p {
  margin: 0px 10px;
}

#container {
  height: 100vh;
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
}

.status-blob {
  background-color: white;
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

#mymap {
  width: 100%;
  height: 100%;
  background-color: #eee;
  overflow: hidden;
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}

.mytitle {
  margin-left: 10px;
  color: white;
}

.details {
  font-size: 12px;
  margin-bottom: auto;
}

.bigtitle {
  font-weight: bold;
  font-style: italic;
  font-size: 20px;
  margin: 20px 0px;
}

.info-header {
  background-color: #097c43;
  padding: 0.5rem 0rem;
  border-top: solid 1px #666;
  border-bottom: solid 1px #666;
}

.project-summary-block {
  width: 16rem;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  margin: 0px auto 0px 0px;
  z-index: 10;
}

.info-blob {
  display: flex;
  flex-direction: column;
  width: 16rem;
  height: 100vh;
  background-color: #eeeeffbb;
  margin: 0px 0px;
  box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.25);
  text-align: center;
  grid-column: 1 / 2;
  grid-row: 1 / 3;
  opacity: 1;
  z-index: 5;
  animation: 0.3s ease 0s 1 slideInFromLeft;
}

@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.routeList {
  width: 16rem;
  height: 100%;
  overflow-y: auto;
}

.status-blob p {
  color: #555;
}

.legend {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
  margin: auto 0.5rem 2rem auto;
  z-index: 10;
}
</style>
