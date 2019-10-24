<template lang="pug">
#vega-chart
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import readBlob from 'read-blob'
import csv from 'csvtojson'
import vegaEmbed from 'vega-embed'

import { FileEntry } from '@/entities/Entities'
import FileAPI from '@/communication/FileAPI'
import { VgDataRef } from 'vega-lite/build/src/vega.schema'
import { isString } from 'util'

@Component
export default class VegaChartEmbedder extends Vue {
  @Prop({ required: true })
  private fileApi!: FileAPI

  @Prop({ required: true })
  private fileEntry!: any

  @Prop({ required: true })
  private projectId!: string

  private tsvData: any = ''

  private vegaDefinition: any = {
    $schema: 'https://vega.github.io/schema/vega-lite/v3.4.json',
    width: 500,
    height: 200,
    description: 'A simple bar chart with embedded data.',
    mark: 'bar',
    encoding: {
      x: { field: 'Iteration', type: 'ordinal' },
      y: {
        field: 'replanning',
        type: 'quantitative',
        color: 'green',
      },
      y2: {
        field: 'mobsim',
        type: 'quantitative',
        color: 'red',
      },
    },
  }

  public async mounted() {
    console.log(this.fileEntry.userFileName)
    const rawData = await this.fetchTSV()
    this.tsvData = await this.processRawData(rawData)

    this.vegaDefinition.data = { values: this.tsvData }

    console.log({ def: this.vegaDefinition })
    vegaEmbed('#vega-chart', this.vegaDefinition, { renderer: 'svg', actions: false })
  }

  private async fetchTSV() {
    try {
      const fileID = this.fileEntry.id
      const blob = await this.fileApi.downloadFile(fileID, this.projectId)
      const data = await readBlob.text(blob)
      return data
    } catch (e) {
      console.log({ e })
    }
    return ''
  }

  private async processRawData(rawData: string) {
    const output = await csv({ delimiter: '\t', checkType: true }).fromString(rawData)

    for (const row of output) {
      for (const key of Object.keys(row)) {
        if (key.startsWith('BEGIN')) continue
        if (key.startsWith('END')) continue
        const v = row[key]
        if (!isString(v)) continue
        if (v.indexOf(':') > -1) {
          const hms = v.split(':')
          const seconds = parseInt(hms[0], 10) * 3600 + parseInt(hms[1], 10) * 60 + parseInt(hms[2], 10)
          row[key] = seconds
        }
      }
    }

    console.log({ ttthe: output })

    return output
  }
}
</script>

<style scoped>
.medium-zoom {
  padding: 0.5rem 0.5rem;
}
</style>
