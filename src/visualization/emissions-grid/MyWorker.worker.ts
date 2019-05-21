import { inferno, viridis } from 'scale-color-perceptual'

import AsyncBackgroundWorker, {
  MethodCall,
  MethodResult,
} from '@/visualization/frame-animation/modell/background/AsyncBackgroundWorker'

import Coords from '@/components/Coords'
import { InitParams, MethodNames } from './MyWorkerContract'

class MyWorker extends AsyncBackgroundWorker {
  private params!: InitParams

  private dataLookup: any = {}
  private mapExtentXYXY: number[] = [180, 90, -180, -90]
  private pollutants: any = []
  private pollutantsMaxValue: { [id: string]: number } = {}
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
    const jsonData = await this.fetchEmissionsData()

    console.log('Ranges')

    await this.calculateMaxValues(jsonData)

    console.log('Time bins')
    this.buildLookupForTimeBins(jsonData)

    console.log({ dataLookup: this.dataLookup })
    console.log(this.mapExtentXYXY)

    return {
      data: {
        dataLookup: this.dataLookup,
        pollutants: this.pollutants,
        pollutantsMaxValue: this.pollutantsMaxValue,
        mapExtentXYXY: this.mapExtentXYXY,
        timeBins: this.timeBins,
      },
    }
  }

  private async fetchEmissionsData() {
    console.log({ WORKER_STARTING_UP: this.params })

    const allResults: any = { timeBins: [] }

    for (const startTime of this.params.bins) {
      const result = await this.fetchEmissionsDataForStartTime(startTime)
      const bin = { startTime, value: result }
      allResults.timeBins.push(bin)
    }
    console.log({ allResults })
    return allResults
  }

  private async fetchEmissionsDataForStartTime(startTime: number): Promise<any> {
    console.log('fetching startTime ' + startTime)

    const result = await fetch(this.params.url + startTime, {
      mode: 'cors',
      headers: { Authorization: 'Bearer ' + this.params.accessToken },
    })

    if (result.ok) {
      try {
        const thing = await result.json()
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

  private buildLookupForTimeBins(data: any) {
    for (const bin of data.timeBins) {
      const startTime = bin.startTime
      const hexesByPollutant = this.calculateHexValuesForCells(bin.value.cells)

      for (const p of Object.keys(hexesByPollutant)) {
        const key = p + ':' + startTime
        console.log(key)
        const output = hexesByPollutant[p]

        this.dataLookup[key] = output
      }
    }
  }

  private calculateHexValuesForCells(cells: any) {
    const hexesByPollutant: any = {}
    const fullRadius = 0.5 * parseFloat(this.params.cellSize)

    for (const p of this.pollutants) hexesByPollutant[p] = { type: 'FeatureCollection', features: [] }

    for (const point of cells) {
      if (point.value === {}) continue

      for (const p of this.pollutants) {
        const pollutantHex = this.getHexagonValuesForPollutant(point, p, fullRadius)
        if (pollutantHex) hexesByPollutant[p].features.push(pollutantHex)
      }
    }
    console.log({ hexesByPollutant })
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
      const longlat = Coords.toLngLat(this.params.projection, mm)
      return [longlat.x, longlat.y]
    })

    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [z] },
      properties: properties,
    }
  }

  private async calculateMaxValues(data: any) {
    console.log(data.timeBins)
    for (const bin of data.timeBins) {
      // save the start times of all time bins
      this.timeBins.push(bin.startTime)

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
        const coordinates = Coords.toLngLat(this.params.projection, { x: point.coordinate.x, y: point.coordinate.y })
        this.updateMapExtent([coordinates.x, coordinates.y])
      }
    }

    this.pollutants = Object.keys(this.pollutantsMaxValue).sort()

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
