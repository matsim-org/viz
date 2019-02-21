<template lang="pug">
#container
  .status-blob(v-if="loadingText"): p {{ loadingText }}
  project-summary-block.project-summary-block(:project="project" :projectId="projectId")
  svg#chart.chart
</template>

<script lang="ts">
'use strict'

import * as turf from '@turf/turf'
import * as BlobUtil from 'blob-util'
import colormap from 'colormap'
import { sankey, sankeyDiagram } from 'd3-sankey-diagram'
import { select } from 'd3-selection'
import 'd3-sankey-diagram'
import { Vue, Component, Prop } from 'vue-property-decorator'

import AuthenticationStore from '@/auth/AuthenticationStore'
import FileAPI from '@/communication/FileAPI'
import LegendBox from '@/visualization/transit-supply/LegendBox.vue'
import ProjectSummaryBlock from '@/visualization/transit-supply/ProjectSummaryBlock.vue'
import SharedStore from '@/SharedStore'
import { Visualization } from '@/entities/Entities'

const INPUTS = {
  FLOWS: 'Flows (.csv)',
}

// register component with the SharedStore
SharedStore.addVisualizationType({
  typeName: 'sankey',
  prettyName: 'Sankey Flow Diagram',
  description: 'Depicts flows between choices',
  requiredFileKeys: [INPUTS.FLOWS],
  requiredParamKeys: [],
})

@Component({ components: { 'legend-box': LegendBox, 'project-summary-block': ProjectSummaryBlock } })
export default class SankeyDiagram extends Vue {
  @Prop({ type: String, required: true })
  private vizId!: string

  @Prop({ type: String, required: true })
  private projectId!: string

  @Prop({ type: FileAPI, required: true })
  private fileApi!: FileAPI

  @Prop({ type: AuthenticationStore, required: true })
  private authStore!: AuthenticationStore

  // -------------------------- //

  private loadingText: string = 'Flow Diagram'
  private project: any = {}
  private visualization!: Visualization
  private jsonChart: any = {}

  public created() {}

  public async mounted() {
    this.projectId = (this as any).$route.params.projectId
    this.vizId = (this as any).$route.params.vizId

    await this.getVizDetails()
    this.setupDiagram()
  }

  private async getVizDetails() {
    this.visualization = await this.fileApi.fetchVisualization(this.projectId, this.vizId)
    this.project = await this.fileApi.fetchProject(this.projectId)
    if (SharedStore.debug) console.log(this.visualization)
  }

  private get legendRows() {
    return [['#a03919', 'Rail'], ['#448', 'Bus']]
  }

  private async setupDiagram() {
    const networks = await this.loadFiles()
    if (networks) this.jsonChart = this.processInputs(networks)

    this.loadingText = ''
    this.doD3()
  }

  private async loadFiles() {
    try {
      this.loadingText = 'Loading files...'

      if (SharedStore.debug) console.log(this.visualization.inputFiles)

      const fileID = this.visualization.inputFiles[INPUTS.FLOWS].fileEntry.id
      const blob = await this.fileApi.downloadFile(fileID, this.projectId)
      const flows: string = await BlobUtil.blobToBinaryString(blob)

      return { flows }
    } catch (e) {
      console.error({ e })
      this.loadingText = '' + e
      return null
    }
  }

  private processInputs(networks: any) {
    this.loadingText = 'Building node graph...'

    const fromNodes: any = []
    const toNodes: any = []
    const links: any = []

    // build lookups
    const csv = networks.flows.split('\n')
    for (const line of csv.slice(1)) {
      const cols = line.trim().split(';')

      if (!fromNodes.includes(cols[0])) fromNodes.push(cols[0])
      if (!toNodes.includes(cols[1])) toNodes.push(cols[1])

      const value = parseFloat(cols[2])
      if (value) links.push([cols[0], cols[1], value])
    }

    console.log(fromNodes)
    console.log(toNodes)
    console.log(links)

    // build js object
    const answer: any = { nodes: [], links: [] }
    const fromLookup: any = {}
    const toLookup: any = {}

    fromNodes.forEach((value: string, i: number) => {
      answer.nodes.push({ id: i, title: value })
      fromLookup[value] = i
    })

    toNodes.forEach((value: string, i: number) => {
      answer.nodes.push({ id: i + fromNodes.length, title: value })
      toLookup[value] = i + fromNodes.length
    })

    for (const link of links) {
      answer.links.push({ source: fromLookup[link[0]], target: toLookup[link[1]], value: link[2] })
    }

    console.log(JSON.stringify(answer.nodes))
    console.log(JSON.stringify(answer.links))
    return answer
  }

  private doD3() {
    const data = this.jsonChart

    const layout = sankey().extent([[100, 100], [700, 400]])

    const diagram = sankeyDiagram().linkColor(function(d: any) {
      return '#40c' // d.color
    })

    // layout.ordering(data.order)

    select('#chart')
      .datum(layout(data))
      .call(diagram)
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 700 400')
      // class to make it responsive
      .classed('svg-content-responsive', true)
  }
}
</script>

<style scoped>
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

#project-summary-block {
  background-color: #999;
  width: 16rem;
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  margin: 0px auto auto 0px;
  z-index: 10;
}

.info-blob {
  display: flex;
  flex-direction: column;
  animation: 0.3s ease 0s 1 slideInFromLeft;
  background-color: #363a45;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  grid-column: 1 / 2;
  grid-row: 1 / 3;
  height: 100vh;
  margin: 0px 0px;
  opacity: 0.95;
  text-align: center;
  width: 16rem;
  z-index: 5;
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
  color: #444;
  font-size: 0.9rem;
}

.legend {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
  margin: auto 0.5rem 2rem auto;
  z-index: 10;
}

/* from sankey example */
.node rect {
  cursor: move;
  fill-opacity: 0.9;
  shape-rendering: crispEdges;
}

.node text {
  pointer-events: none;
  text-shadow: 0 1px 0 #fff;
}

.link {
  fill: none;
  stroke: #000;
  stroke-opacity: 0.2;
}

.link:hover {
  stroke-opacity: 0.4;
}

#chart {
  margin-top: 5rem;
  grid-row: 1/3;
  grid-column: 1/3;
  width: 100%;
  height: 100%;
  max-height: 500px;
}

.svg-content-responsive {
  display: inline-block;
  position: relative;
  margin: auto auto;
}
</style>
