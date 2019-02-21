<template lang="pug">
#container
  .status-blob(v-if="loadingText"): p {{ loadingText }}
  project-summary-block.project-summary-block(:project="project" :projectId="projectId")
  p#chart
</template>

<script lang="ts">
'use strict'

import * as turf from '@turf/turf'
import * as BlobUtil from 'blob-util'
import colormap from 'colormap'
// import * as d3 from 'd3'
import { Vue, Component, Prop } from 'vue-property-decorator'

import AuthenticationStore from '@/auth/AuthenticationStore'
import FileAPI from '@/communication/FileAPI'
import LegendBox from '@/visualization/transit-supply/LegendBox.vue'
import ProjectSummaryBlock from '@/visualization/transit-supply/ProjectSummaryBlock.vue'
import SharedStore from '@/SharedStore'
import { Visualization } from '@/entities/Entities'

import '@/visualization/sankey-diagram/sankey.js'

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
    //this.doD3()
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
      answer.nodes.push({ node: i, name: value })
      fromLookup[value] = i
    })

    toNodes.forEach((value: string, i: number) => {
      answer.nodes.push({ node: i + fromNodes.length, name: value })
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
    var units = 'Trips'

    console.log(d3)

    var margin = { top: 10, right: 10, bottom: 10, left: 10 }

    var width = 800 - margin.left - margin.right
    var height = 600 - margin.top - margin.bottom

    var formatNumber = d3.format(',.0f'), // zero decimal places
      format = function(d) {
        return formatNumber(d) + ' ' + units
      },
      color = d3.scale.category10()

    // append the svg canvas to the page
    var svg = d3
      .select('#chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // Set the sankey diagram properties
    var sankey = d3
      .sankey()
      .nodeWidth(18)
      .nodePadding(40)
      .size([width, height])

    var path = sankey.link()

    const graph = this.jsonChart

    sankey
      .nodes(graph.nodes)
      .links(graph.links)
      .layout(32)

    // add in the links
    var link = svg
      .append('g')
      .selectAll('.link')
      .data(graph.links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', path)
      .style('stroke-width', function(d) {
        return Math.max(1, d.dy)
      })
      .sort(function(a, b) {
        return b.dy - a.dy
      })

    // add the link titles
    link.append('title').text(function(d) {
      return d.source.name + ' → ' + d.target.name + '\n' + format(d.value)
    })

    // add in the nodes
    var node = svg
      .append('g')
      .selectAll('.node')
      .data(graph.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')'
      })
      .call(
        d3.behavior
          .drag()
          .origin(function(d) {
            return d
          })
          .on('dragstart', function() {
            this.parentNode.appendChild(this)
          })
          .on('drag', dragmove)
      )

    // add the rectangles for the nodes
    node
      .append('rect')
      .attr('height', function(d) {
        return d.dy
      })
      .attr('width', sankey.nodeWidth())
      .style('fill', function(d) {
        return (d.color = color(d.name.replace(/ .*/, '')))
      })
      .append('title')
      .text(function(d) {
        return d.name + '\n' + format(d.value)
      })

    // add in the title for the nodes
    node
      .append('text')
      .attr('x', -6)
      .attr('y', function(d) {
        return d.dy / 2
      })
      .attr('dy', '.35em')
      .attr('text-anchor', 'end')
      .attr('transform', null)
      .text(function(d) {
        return d.name
      })
      .filter(function(d) {
        return d.x < width / 2
      })
      .attr('x', 6 + sankey.nodeWidth())
      .attr('text-anchor', 'start')

    // the function for moving the nodes
    function dragmove(d) {
      d3.select(this).attr(
        'transform',
        'translate(' + d.x + ',' + (d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))) + ')'
      )
      sankey.relayout()
      link.attr('d', path)
    }
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
  grid-row: 1/3;
  grid-column: 1/3;
  width: 100%;
  height: 100%;
}
</style>
