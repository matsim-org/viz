import FrameAnimationAPI, { SnapshotRequestParams } from '../../communication/FrameAnimationAPI'
import { NetworkReader } from '../../contracts/NetworkReader'
import { SnapshotReader } from '../../contracts/SnapshotReader'
import { GeoJsonReader } from '../../contracts/GeoJsonReader'
import { MethodCall, GET_CONFIG, GET_SNAPSHOT_DATA, GET_PLAN, GET_NETWORK_DATA, MethodResult } from './Contracts'
import AsyncBackgroundWorker from './AsyncBackgroundWorker'

interface InitParams {
  dataUrl: URL
  vizId: string
}

interface GetSnapshotParams {
  requestNumber: number
  requestParameters: SnapshotRequestParams
}

interface GetPlanParams {
  idIndex: number
}

class DataFetcher extends AsyncBackgroundWorker {
  private api!: FrameAnimationAPI

  constructor() {
    super()
  }

  handleInitialize(call: MethodCall): void {
    let params = call.parameters as InitParams
    this.api = new FrameAnimationAPI(params.dataUrl, params.vizId)
  }

  async handleMethodCall(call: MethodCall): Promise<MethodResult> {
    switch (call.method) {
      case GET_CONFIG:
        return await this.getConfigData()
      case GET_NETWORK_DATA:
        return await this.getNetworkData()
      case GET_SNAPSHOT_DATA:
        return await this.getSnapshotData(call.parameters as GetSnapshotParams)
      case GET_PLAN:
        return await this.getPlan(call.parameters as GetPlanParams)
      default:
        throw new Error('No method with name: ' + call.method)
    }
  }

  async getConfigData() {
    let configuration = await this.api.fetchConfiguration()
    return { data: configuration }
  }

  async getNetworkData() {
    let response = await this.api.fetchNetwork()
    let network = new NetworkReader(response).parse()

    return { data: network, transferrables: [network.buffer] }
  }

  async getSnapshotData(parameters: GetSnapshotParams) {
    let response = await this.api.fetchSnapshots(parameters.requestParameters)
    let snapshots = new SnapshotReader(response).parse()

    let transferrables: Array<ArrayBuffer> = []

    snapshots.forEach(snapshot => {
      transferrables.push(snapshot.position.buffer)
      transferrables.push(snapshot.nextPosition.buffer)
      transferrables.push(snapshot.shouldInterpolate.buffer)
      transferrables.push(snapshot.ids.buffer)
    })

    return { data: { data: snapshots, requestNumber: parameters.requestNumber }, transferrables: transferrables }
  }

  async getPlan(parameters: GetPlanParams) {
    let response = await this.api.fetchPlan(parameters.idIndex)

    let geoJson = new GeoJsonReader(response).parse()
    let transferrableObjects = [
      geoJson.points.buffer,
      geoJson.lines.buffer,
      geoJson.shapeVertices.buffer,
      geoJson.shapeNormals.buffer,
    ]

    return { data: geoJson, transferrables: transferrableObjects }
  }
}

export default null as any

// Bootstrap DataFetcher when file is loaded from server
let worker = new DataFetcher()
