import { WorkerFacade } from './background/WorkerFacade.js'
import DataFetcher from './background/DataFetcher.worker.js'
import GeoJsonParser from './background/GeoJsonParser.worker.js'
import { SnapshotData } from './SnapshotData.js'
import { LayerData } from './LayerData.js'
import { Rectangle } from '../contracts/Rectangle.js'
import Configuration from '../contracts/Configuration.js'

class DataProvider {
  get isFetchingData() {
    return this._agentRequests >= this._maxConcurrentSnapshotRequests || this._isLoadingPlan
  }

  get lastCachedTimestep() {
    return this.snapshotData.lastTimestep
  }

  get firstCachedTimestep() {
    return this.snapshotData.firstTimestep
  }

  set networkDataChanged(callback) {
    this._networkDataChanged = callback
  }

  set geoJsonDataChanged(callback) {
    this._geoJsonDataChanged = callback
  }

  set isFetchingDataChanged(callback) {
    this._isFetchingDataChanged = callback
  }

  set speedFactor(value) {
    if (value >= 1.0) this._speedFactor = value
    else this._speedFactor = 1.0
  }

  constructor() {
    this._config = Configuration.getConfig()
    this._speedFactor = 1.0
    this._agentRequests = 0
    this._requestNumber = 0
    this._isLoadingPlan = false
    this._maxConcurrentSnapshotRequests = 1
    this.workerFacade = new WorkerFacade(DataFetcher, (name, data) => this.onWorkerEvent(name, data))
    this.layerData = new LayerData()
  }

  destroy() {
    this.workerFacade.destroy()
    if (this._parserWorkerFacade) {
      this._parserWorkerFacade.destroy()
    }
    this.snapshotData = null
    this.layerData = null
    this._networkDataChanged = null
    this._geoJsonDataChanged = null
    this._isFetchingDataChanged = null
  }

  loadServerConfig() {
    this.workerFacade.postWorkerMessage('initialize', { dataUrl: this._config.dataUrl })
    this.workerFacade.postWorkerMessage('getConfig', { id: this._config.vizId })
  }

  loadNetworkData() {
    this.workerFacade.postWorkerMessage('getNetworkData', { id: this._config.vizId })
  }

  loadPlan(id) {
    let params = {
      idIndex: id,
    }
    this.workerFacade.postWorkerMessage('getPlan', params)
    this._isLoadingPlan = true
    this._onFetchingDataChanged()
  }

  getId(index, timestep) {
    let snapshot = this.snapshotData.getSnapshot(timestep, this._speedFactor)
    return snapshot.ids[index]
  }

  getSnapshot(timestep) {
    this.lastRequestedTimestep = timestep
    let result
    // 1. Get snapshot from chache if available
    if (this.snapshotData.hasSnapshotFor(timestep)) {
      result = this.snapshotData.getSnapshot(timestep, this._speedFactor)
    } else {
      result = {}
    }

    // 2. Make sure there are enough snapshots chached
    // if not tell background worker to load more snapshots
    let lastCachedTimestep = this.snapshotData.lastTimestep

    if (this._isSmallerThanLastTimestep(lastCachedTimestep) && !this._isBufferSuficient(timestep)) {
      let fromTimestep
      if (lastCachedTimestep < timestep) {
        fromTimestep = timestep
      } else {
        fromTimestep = lastCachedTimestep
      }

      this._loadSnapshots(fromTimestep)
    }

    // 3. return the snapshot or empty object
    return result
  }

  addGeoJsonLayer(geoJson, layerName, z, color) {
    let parameters = {
      layerName: layerName,
      z: z,
      color: color,
      geoJson: geoJson,
    }
    this._parserWorkerFacade = new WorkerFacade(GeoJsonParser, (name, data) => this.onWorkerEvent(name, data))
    this._parserWorkerFacade.postWorkerMessage('initialize', {})
    this._parserWorkerFacade.postWorkerMessage('parseGeoJson', parameters)
  }

  removeGeoJsonLayer(layerName) {
    this.layerData.removeLayer(layerName)
    this._geoJsonDataChanged(layerName)
  }

  getLayer(layerName) {
    return this.layerData.getLayer(layerName)
  }

  clearCache() {
    this.snapshotData.clearSnapshots()

    // we also need to reload new agents
    if (this.isFetchingData) {
      this._maxConcurrentSnapshotRequests++
    }
  }

  _loadSnapshots(fromTimestep) {
    if (this.isFetchingData) return

    this._requestNumber++
    let requestSize = this._getRequestSize(fromTimestep)

    let params = {
      requestNumber: this._requestNumber,
      requestParameters: {
        id: this._config.vizId,
        fromTimestep: fromTimestep,
        speedFactor: this._speedFactor,
        size: requestSize,
        bounds: new Rectangle(1, 1, 1, 1),
      },
    }
    this._agentRequests++
    this.workerFacade.postWorkerMessage('getSnapshotData', params)
    this._onFetchingDataChanged()
  }

  _handleSnapshotDataReceived(response) {
    if (response.requestNumber === this._requestNumber) {
      let smallestSnapshotToKeep = this.lastRequestedTimestep

      if (smallestSnapshotToKeep < this.snapshotData.lastTimestep) {
        smallestSnapshotToKeep =
          this.lastRequestedTimestep - this._config.cache.oldSnapshotsToKeep * this._config.timestepSize
      }
      this.snapshotData.addSnapshotsAndForgetOldOnes(response.data, smallestSnapshotToKeep, this._speedFactor)
    } else {
      this._maxConcurrentSnapshotRequests--
      console.log('ignore received snapshot since it is outdated')
    }
    this._agentRequests--
    this._onFetchingDataChanged()
  }

  _handleConfigDataReceived(data) {
    Configuration.updateServerConfiguration(data)
    this.snapshotData = new SnapshotData(data.timestepSize)
    this.lastTimestep = data.lastTimestep
    this.firstTimestep = data.firstTimestep
  }

  _handlePlanDataReceived(data) {
    this._isLoadingPlan = false
    let name = 'selectedPlan'
    let layer = LayerData.createLayer(name, -9.0, this._config.colors.selectedPlan, data)
    this.layerData.addLayer(layer)
    this._onFetchingDataChanged()
    this._geoJsonDataChanged(name)
  }

  _handleGeoJsonParsed(data) {
    let layer = LayerData.createLayer(data.layerName, data.z, data.color, data)
    this.layerData.addLayer(layer)
    this._geoJsonDataChanged(layer.name)
  }

  _isBufferSuficient(timestep) {
    return this._numberOfCachedTimestepsAhead(timestep) > this._config.cache.cachedSnapshots
  }

  _numberOfCachedTimestepsAhead(timestep) {
    return (this.snapshotData.lastTimestep - timestep) / this.snapshotData.timestepSize
  }

  _isSmallerThanLastTimestep(timestep) {
    return timestep + this.snapshotData.timestepSize * this._speedFactor <= this.lastTimestep
  }

  _getRequestSize(timestep) {
    let size = this._numberOfCachedTimestepsAhead(this.lastRequestedTimestep)
    if (this._config.cache.minRequestSize > size) {
      size = this._config.cache.minRequestSize
    }
    return size
  }

  _onFetchingDataChanged() {
    if (this._isFetchingDataChanged) {
      this._isFetchingDataChanged()
    }
  }

  onWorkerEvent(name, data) {
    switch (name) {
      case 'configDataReceived':
        this._handleConfigDataReceived(data)
        break
      case 'networkDataReceived':
        this._networkDataChanged(data)
        break
      case 'snapshotDataReceived':
        this._handleSnapshotDataReceived(data)
        break
      case 'planDataReceived':
        this._handlePlanDataReceived(data)
        break
      case 'geoJsonParsed':
        this._handleGeoJsonParsed(data)
        break
      default:
        throw new Error('no such event name: ' + name)
    }
  }
}

export { DataProvider }
