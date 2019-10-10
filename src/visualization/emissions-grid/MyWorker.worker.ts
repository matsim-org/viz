import { inferno, viridis } from 'scale-color-perceptual'
import csv from 'csvtojson'

import AsyncBackgroundWorker, {
  MethodCall,
  MethodResult,
} from '@/visualization/frame-animation/modell/background/AsyncBackgroundWorker'

import Coords from '@/components/Coords'
import { InitParams, MethodNames } from './MyWorkerContract'

interface CsvRow {
  timebin: number
  x: number
  y: number
  value: number
}

class MyWorker extends AsyncBackgroundWorker {
  private params!: InitParams

  private dataLookup: any = {}
  private mapExtentXYXY: number[] = [180, 90, -180, -90]
  private pollutants: any = []
  private pollutantsMaxValue = 0
  private timeBins: any = []

  public handleInitialize(call: MethodCall) {
    this.params = call.parameters as InitParams
  }

  public async handleMethodCall(call: MethodCall): Promise<MethodResult> {
    switch (call.method) {
      case MethodNames.LoadData:
        return this.loadData()
      default:
        throw new Error('No method with name ' + call.method)
    }
  }

  private async loadData() {
    console.log('Fetching')
    const csvData = await this.fetchEmissionsData()

    console.log('Sorting pollutants into time bins')
    this.calculateMaxValues(csvData)
    this.buildLookupForTimeBins(csvData)

    console.log({ lookup: this.dataLookup })
    console.log(this.mapExtentXYXY)

    return {
      data: {
        dataLookup: this.dataLookup,
        pollutants: ['NOx'], // this.pollutants,
        pollutantsMaxValue: this.pollutantsMaxValue,
        mapExtentXYXY: this.mapExtentXYXY,
        timeBins: this.timeBins,
      },
      transferrables: [],
    }
  }

  private async fetchEmissionsData() {
    console.log({ WORKER_STARTING_UP: this.params })

    const allResults: any = { timeBins: [] }

    console.log('fetching')
    const url = this.params.url
    // const csvFilePath = './berlin.csv'
    // const csvFilePath = './berlin-v5.4-1pct.NOx.csv'
    // const csvFilePath = './ruhrgebiet-v1.0-1pct.NOx.csv'

    const results = await fetch(url, { mode: 'cors' })

    if (!results.ok) {
      console.log(results.status)
      console.log(results.statusText)
      console.log({ results })
      throw new Error(results.statusText)
    }

    const rawText = await results.text()

    const csvArray = await csv({
      headers: ['timebin', 'x', 'y', 'value'],
      delimiter: [',', ';', '\t'],
      noheader: false,
      checkType: true,
    }).fromString(rawText)

    return csvArray as CsvRow[]
  }

  private buildLookupForTimeBins(data: CsvRow[]) {
    for (const [i, row] of data.entries()) {
      if (i % 8127 === 0) console.log(i)
      // if (i % 3) continue

      if (!this.dataLookup[row.timebin]) {
        console.log('found timebin starting at:', row.timebin)
        this.dataLookup[row.timebin] = { type: 'FeatureCollection', features: [] }
        this.timeBins.push(row.timebin)
      }

      const fullRadius = 10000 // 0.5 * parseFloat(this.params.cellSize)

      const pollutantHex = this.getHexagonValuesForPollutant(i, row, 'NOx', fullRadius)
      if (pollutantHex) this.dataLookup[row.timebin].features.push(pollutantHex)
    }
  }

  private getHexagonValuesForPollutant(i: number, point: CsvRow, p: string, fullRadius: number) {
    let value = point.value / this.pollutantsMaxValue

    if (!value) return null
    if (value < 0.01) return null

    if (value > 1) value = 1

    // Rapidly scale up opacity when rel.value is 0-20%; anything > 20% gets full opacity
    const op = Math.min(0.95, value * 5)

    const colorInferno = inferno(value)
    const colorViridis = viridis(value)
    const revInferno = inferno(1.0 - value)
    const revViridis = viridis(1.0 - value)

    const properties = {
      id: i,
      op,
      colorInferno,
      // colorViridis,
      revInferno,
      // revViridis,
    }

    // point
    const longlat = Coords.toLngLat(this.params.projection, point)
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [longlat.x, longlat.y] },
      properties: properties,
    }
  }

  private async calculateMaxValues(data: any[]) {
    let maxValue = 0
    for (const row of data) {
      maxValue = Math.max(maxValue, row.value)

      // set map extent
      const coordinates = Coords.toLngLat(this.params.projection, { x: row.x, y: row.y })
      this.updateMapExtent([coordinates.x, coordinates.y])
    }

    this.pollutantsMaxValue = maxValue
    console.log({ MAX_VALUE: this.pollutantsMaxValue })
  }

  private updateMapExtent(coordinates: any) {
    this.mapExtentXYXY[0] = Math.min(this.mapExtentXYXY[0], coordinates[0])
    this.mapExtentXYXY[1] = Math.min(this.mapExtentXYXY[1], coordinates[1])
    this.mapExtentXYXY[2] = Math.max(this.mapExtentXYXY[2], coordinates[0])
    this.mapExtentXYXY[3] = Math.max(this.mapExtentXYXY[3], coordinates[1])
  }
}

// make the typescript compiler happy on import
export default null as any

// bootstrap when worker is loaded
const worker = new MyWorker()
