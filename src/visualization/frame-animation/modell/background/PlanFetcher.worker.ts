import AsyncBackgroundWorker, {
  MethodCall,
  MethodResult,
} from '@/visualization/frame-animation/modell/background/AsyncBackgroundWorker'
import FrameAnimationAPI from '@/visualization/frame-animation/communication/FrameAnimationAPI'
import {
  InitParams,
  MethodNames,
  PlanRequestParams,
} from '@/visualization/frame-animation/modell/background/PlanFetcherContract'
import GeoJsonParser from '@/visualization/frame-animation/modell/background/GeoJsonParser'
import { GeoJsonReader } from '@/visualization/frame-animation/contracts/GeoJsonReader'

class PlanFetcher extends AsyncBackgroundWorker {
  private api!: FrameAnimationAPI

  public handleInitialize(call: MethodCall) {
    const params = call.parameters as InitParams
    this.api = new FrameAnimationAPI(params.dataUrl, params.vizId)
  }

  public async handleMethodCall(call: MethodCall): Promise<MethodResult> {
    switch (call.method) {
      case MethodNames.FetchPlan:
        return this.fetchPlan(call.parameters)
      default:
        throw new Error('No method with name ' + call.method)
    }
  }

  private async fetchPlan(params: PlanRequestParams) {
    const response = await this.api.fetchPlan(params.idIndex)

    const geoJson = new GeoJsonReader(response).parse()
    const transferrableObjects = [
      geoJson.points.buffer,
      geoJson.lines.buffer,
      geoJson.shapeVertices.buffer,
      geoJson.shapeNormals.buffer,
    ]

    return { data: geoJson, transferrables: transferrableObjects }
  }
}

// make the typescript compiler happy on import
export default null as any

// bootstrap when worker is loaded
const worker = new PlanFetcher()
