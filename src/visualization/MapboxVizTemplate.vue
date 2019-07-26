<template lang="pug">
#container
  .status-blob(v-if="loadingText"): p {{ loadingText }}
  project-summary-block.project-summary-block(:project="project" :projectId="projectId")
  #mymap
  legend-box.legend(:rows="legendRows")
</template>

<script lang="ts">
'use strict'

/**
 * This template is a barebones visualization component which has a full-screen map,
 * and some files which get loaded at startup. The rest is up to you :-)
 *
 */
import * as turf from '@turf/turf'
import * as BlobUtil from 'blob-util'
import colormap from 'colormap'
import mapboxgl, { LngLatBoundsLike } from 'mapbox-gl'
import { Vue, Component, Prop } from 'vue-property-decorator'

import AuthenticationStore from '@/auth/AuthenticationStore'
import FileAPI from '@/communication/FileAPI'
import LegendBox from '@/visualization/transit-supply/LegendBox.vue'
import ProjectSummaryBlock from '@/visualization/transit-supply/ProjectSummaryBlock.vue'
import SharedStore from '@/SharedStore'
import { Visualization } from '@/entities/Entities'

const COLOR_CATEGORIES = 16

const INPUTS = {
  OD_FLOWS: 'O/D Flows (.csv)',
  SHPFILE: 'Shapefile (.shp or .zip)',
}

// register component with the SharedStore
/*
SharedStore.addVisualizationType({
  typeName: 'aggregate-od',
  prettyName: 'Origin/Destination Patterns',
  description: 'Depicts aggregate O/D flows between areas.',
  requiredFileKeys: [INPUTS.OD_FLOWS, INPUTS.SHPFILE],
  requiredParamKeys: [],
})
*/

@Component({ components: { 'legend-box': LegendBox, 'project-summary-block': ProjectSummaryBlock } })
class MyVizTemplate extends Vue {
  @Prop({ type: String, required: true })
  private vizId!: string

  @Prop({ type: String, required: true })
  private projectId!: string

  @Prop({ type: FileAPI, required: true })
  private fileApi!: FileAPI

  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

  // -------------------------- //

  private loadingText: string = 'Aggregate Origin/Destination Flows'
  private mymap!: mapboxgl.Map
  private project: any = {}
  private visualization!: Visualization

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
    if (SharedStore.debug) console.log(this.visualization)
  }

  private get legendRows() {
    return [['#a03919', 'Rail'], ['#448', 'Bus']]
  }

  private setupMap() {
    this.mymap = new mapboxgl.Map({
      bearing: 0,
      container: 'mymap',
      logoPosition: 'bottom-left',
      style: 'mapbox://styles/mapbox/light-v9',
      pitch: 0,
      // zoom: 9,
    })

    let extent: any = localStorage.getItem(this.vizId + '-bounds')
    if (extent) {
      extent = JSON.parse(extent)
      this.mymap.fitBounds(extent, {
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
    const networks = await this.loadNetworks()
    if (networks) await this.processInputs(networks)

    this.setupKeyListeners()
    this.loadingText = ''
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
      this.loadingText = 'Loading files...'

      if (SharedStore.debug) console.log(this.visualization.inputFiles)

      const shpfileID = this.visualization.inputFiles[INPUTS.SHPFILE].fileEntry.id
      const odFlowsID = this.visualization.inputFiles[INPUTS.OD_FLOWS].fileEntry.id

      const shpBlob = await this.fileApi.downloadFile(shpfileID, this.projectId)
      const shpFile: ArrayBuffer = await BlobUtil.blobToArrayBuffer(shpBlob)

      const odBlob = await this.fileApi.downloadFile(odFlowsID, this.projectId)
      const odFlows: string = await BlobUtil.blobToBinaryString(odBlob)

      return { shpFile, odFlows }
    } catch (e) {
      console.error({ e })
      this.loadingText = '' + e
      return null
    }
  }

  private async processInputs(networks: any) {
    this.loadingText = 'Converting to GeoJSON...'
    /*
    localStorage.set(this.vizId + '-bounds', this._mapExtentXYXY, { expires: 3650 })

    this.mymap.fitBounds(this._mapExtentXYXY, {
      padding: { top: 50, bottom: 100, right: 100, left: 300 },
      animate: false,
    })
    this.loadingText = ''
    */
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

export default MyVizTemplate
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

#mymap {
  width: 100%;
  height: 100%;
  background-color: black;
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
  border-top: solid 1px #888;
  border-bottom: solid 1px #888;
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
  color: #ffa;
}

.legend {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
  margin: auto 0.5rem 2rem auto;
  z-index: 10;
}
</style>
