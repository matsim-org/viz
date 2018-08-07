import { GeoJsonReader } from '../../contracts/GeoJsonReader'
import { MethodCall, PARSE_GEO_JSON, MethodResult } from './Contracts'
import AsyncBackgroundWorker from './AsyncBackgroundWorker'

interface ParseParams {
  geoJson: string
  z: number
  layerName: string
  color?: number
}

export default class GeoJsonParser extends AsyncBackgroundWorker {
  constructor() {
    super()
  }

  async handleInitialize(call: MethodCall) {
    return
  }

  async handleMethodCall(call: MethodCall): Promise<MethodResult> {
    switch (call.method) {
      case PARSE_GEO_JSON:
        return this.parseGeoJson(call.parameters)
      default:
        throw new Error('No method with name: ' + call.method)
    }
  }

  parseGeoJson(parameters: ParseParams): Promise<MethodResult> {
    if (!this.isValid(parameters))
      throw new Error('parseGeoJson: invalid parameters! geoJson:string, layerName:string, z:number required')

    let reader = new GeoJsonReader(parameters.geoJson)
    let result = reader.parse()
    result.z = parameters.z
    result.layerName = parameters.layerName
    result.color = parameters.color || undefined

    let transferrable = [
      result.points.buffer,
      result.lines.buffer,
      result.shapeVertices.buffer,
      result.shapeNormals.buffer,
    ]
    return Promise.resolve<MethodResult>({
      data: result,
      transferrables: transferrable,
    })
  }

  private isValid(parameters: ParseParams) {
    return parameters && parameters.geoJson && parameters.layerName && parameters.z
  }
}

let worker = new GeoJsonParser()
