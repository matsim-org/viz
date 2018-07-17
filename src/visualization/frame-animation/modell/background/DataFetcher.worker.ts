import BackgroundWorker, { MethodCall } from './BackgroundWorker'
import FrameAnimationAPI, { SnapshotRequestParams } from '../../communication/FrameAnimationAPI'
import { NetworkReader } from '../../contracts/NetworkReader'
import { SnapshotReader } from '../../contracts/SnapshotReader'
import { GeoJsonReader } from '../../contracts/GeoJsonReader'

interface InitParams {
  dataUrl: URL
  vizId: string
}

interface GetSnapshotParams {
  requestNumber: number
  parameters: SnapshotRequestParams
}

interface GetPlanParams {
  idIndex: number
}

class DataFetcher extends BackgroundWorker {
  static readonly GET_SNAPSHOT_DATA: string = 'getSnapshotData'
  static readonly GET_NETWORK_DATA: string = 'getNetworkData'
  static readonly GET_CONFIG: string = 'getConfig'
  static readonly GET_PLAN: string = 'getPlan'

  static readonly EVENT_CONFIG_RECEIVED = 'configReceived'
  static readonly EVENT_SNAPSHOTS_RECEIVED = 'snapshotsReceived'
  static readonly EVENT_NETWORK_RECEIVED = 'networkReceived'
  static readonly EVENT_PLAN_RECEIVED = 'planReceived'

  private api!: FrameAnimationAPI

  constructor() {
    super()
  }

  handleInitialize(call: MethodCall): void {
    let params = call.parameters as InitParams
    this.api = new FrameAnimationAPI(params.dataUrl, params.vizId)
  }

  handleMethodCall(call: MethodCall): void {
    switch (call.method) {
      case DataFetcher.GET_CONFIG:
        this.getConfigData()
        break
      case DataFetcher.GET_NETWORK_DATA:
        this.getNetworkData()
        break
      case DataFetcher.GET_SNAPSHOT_DATA:
        this.getSnapshotData(call.parameters as GetSnapshotParams)
        break
      case DataFetcher.GET_PLAN:
        this.getPlan(call.parameters as GetPlanParams)
        break
      default:
        this.error('No method with name: ' + call.method)
    }
  }

  async getConfigData() {
    try {
      let configuration = await this.api.fetchConfiguration()
      this.event(DataFetcher.EVENT_CONFIG_RECEIVED, configuration)
    } catch (error) {
      this.error(error.message)
    }
  }

  async getNetworkData() {
    try {
      let response = await this.api.fetchNetwork()
      let network = new NetworkReader(response).parse()
      this.eventByReference(DataFetcher.EVENT_NETWORK_RECEIVED, network, [network.buffer])
    } catch (error) {
      this.error(error.message)
    }
  }

  async getSnapshotData(parameters: GetSnapshotParams) {
    let response = await this.api.fetchSnapshots(parameters.parameters)
    let snapshots = new SnapshotReader(response).parse()

    let transferrables: Array<ArrayBuffer> = []

    snapshots.forEach(snapshot => {
      transferrables.push(snapshot.position.buffer)
      transferrables.push(snapshot.nextPosition.buffer)
      transferrables.push(snapshot.shouldInterpolate.buffer)
      transferrables.push(snapshot.ids.buffer)
    })

    this.eventByReference(
      DataFetcher.EVENT_SNAPSHOTS_RECEIVED,
      { requestNumber: parameters.requestNumber, data: snapshots },
      transferrables
    )
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
    this.eventByReference(DataFetcher.EVENT_PLAN_RECEIVED, geoJson, transferrableObjects)
  }
}

export default DataFetcher

// Bootstrap DataFetcher when file is loaded from server
let worker = new DataFetcher()
