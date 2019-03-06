import { GeoJsonReader } from '@/visualization/frame-animation/contracts/GeoJsonReader'
import AsyncBackgroundWorker, {
  MethodCall,
  MethodResult,
} from '@/visualization/frame-animation/modell/background/AsyncBackgroundWorker'
import { ParseParams, MethodNames } from '@/visualization/frame-animation/modell/background/GeoJsonParserContract'

class GeoJsonParser extends AsyncBackgroundWorker {
  constructor() {
    super()
  }

  public async handleInitialize(call: MethodCall) {
    return
  }

  public async handleMethodCall(call: MethodCall): Promise<MethodResult> {
    switch (call.method) {
      case MethodNames.ParseGeoJson:
        return this.parseGeoJson(call.parameters)
      default:
        throw new Error('No method with name: ' + call.method)
    }
  }

  public parseGeoJson(parameters: ParseParams): Promise<MethodResult> {
    if (!this.isValid(parameters)) {
      throw new Error('parseGeoJson: invalid parameters! geoJson:string, layerName:string, z:number required')
    }

    const reader = new GeoJsonReader(parameters.geoJson)
    const result = reader.parse() as any
    result.z = parameters.z
    result.layerName = parameters.layerName
    result.color = parameters.color || undefined

    const transferrable = [
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

// make Typescript compiler happy when importing this module
export default null as any

// Bootstrap Worker
const worker = new GeoJsonParser()
