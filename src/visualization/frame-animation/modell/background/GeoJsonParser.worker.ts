import BackgroundWorker, { MethodCall } from './BackgroundWorker'
import { GeoJsonReader } from '../../contracts/GeoJsonReader'

interface ParseParams {
  geoJson: string
  z: number
  layerName: string
  color?: number
}

export default class GeoJsonParser extends BackgroundWorker {
  static readonly PARSE_GEO_JSON = 'parseGeoJson'
  static readonly EVENT_GEO_JSON_PARSED = 'geoJsonParsed'

  constructor() {
    super()
  }

  handleInitialize(call: MethodCall) {}
  handleMethodCall(call: MethodCall) {
    switch (call.method) {
      case GeoJsonParser.PARSE_GEO_JSON:
        this.parseGeoJson(call.parameters)
        break
      default:
        this.error('No method with name: ' + call.method)
    }
  }

  parseGeoJson(parameters: ParseParams) {
    if (!this.isValid(parameters))
      this.error('parseGeoJson: invalid parameters! geoJson:string, layerName:string, z:number required')

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
    this.eventByReference(GeoJsonParser.EVENT_GEO_JSON_PARSED, result, transferrable)
    close()
  }

  private isValid(parameters: ParseParams) {
    return parameters && parameters.geoJson && parameters.layerName && parameters.z
  }
}

//let worker = new GeoJsonParser()
