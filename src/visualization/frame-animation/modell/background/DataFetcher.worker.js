import { BackgroundWorkerFacade } from './BackgroundWorkerFacade.js'
import { NetworkReader } from '../../contracts/NetworkReader'
import { SnapshotReader } from '../../contracts/SnapshotReader.js'
import { GeoJsonReader } from '../../contracts/GeoJsonReader.js'
import FrameAnimationAPI from '../../communication/FrameAnimationAPI.ts'

class DataFetcher extends BackgroundWorkerFacade {
  constructor(parameters) {
    super()
    this._api = new FrameAnimationAPI(parameters.dataUrl, parameters.id)
  }

  async getConfigData(parameters) {
    try {
      let configuration = await this._api.fetchConfiguration()
      this.postEvent('configDataReceived', configuration)
    } catch (error) {
      this.error(error.message)
    }
  }

  async getNetworkData(parameters) {
    try {
      let response = await this._api.fetchNetwork()
      let network = new NetworkReader(response).parse()
      this.postEventByReference('networkDataReceived', network, [network.buffer])
    } catch (error) {
      this.error(error.message)
    }
  }

  async getSnapshotData(parameters) {
    let response = await this._api.fetchSnapshots(parameters.requestParameters)
    let snapshots = new SnapshotReader(response).parse()

    let transferrables = []

    snapshots.forEach(snapshot => {
      transferrables.push(snapshot.position.buffer)
      transferrables.push(snapshot.nextPosition.buffer)
      transferrables.push(snapshot.shouldInterpolate.buffer)
      transferrables.push(snapshot.ids.buffer)
    })

    this.postEventByReference(
      'snapshotDataReceived',
      { requestNumber: parameters.requestNumber, data: snapshots },
      transferrables
    )
  }

  async getPlan(parameters) {
    let response = await this._api.fetchPlan(parameters.idIndex)

    let geoJson = new GeoJsonReader(response).parse()
    let transferrableObjects = [
      geoJson.points.buffer,
      geoJson.lines.buffer,
      geoJson.shapeVertices.buffer,
      geoJson.shapeNormals.buffer,
    ]
    this.postEventByReference('planDataReceived', geoJson, transferrableObjects)
  }

  // override
  onReceivedMethodCall(method, parameters) {
    switch (method) {
      case 'getSnapshotData':
        this.getSnapshotData(parameters)
        break
      case 'getNetworkData':
        this.getNetworkData(parameters)
        break
      case 'getConfig':
        this.getConfigData(parameters)
        break
      case 'getPlan':
        this.getPlan(parameters)
        break
      default:
        this.error('Not method with name. ' + method)
        break
    }
  }
}

export default DataFetcher

// Bootstrap DataFetcher

// eslint-disable-next-line
var worker

// This is necesarry to run unittests in node
if (global.addEventListener) {
  addEventListener('message', handleInitialize)
}

function handleInitialize(e) {
  let data = e.data
  if (!data || !data.method || !data.parameters) {
    postMessage({ type: 'error', message: 'no data, method name or parameters received' })
    return
  }
  if (data.method !== 'initialize') {
    postMessage({ type: 'error', message: 'call method "initialize" first to create a background controller' })
    return
  }
  worker = new DataFetcher(data.parameters)
  removeEventListener('message', handleInitialize)
}
