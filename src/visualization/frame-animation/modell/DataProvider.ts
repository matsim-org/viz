import DataFetcher from './background/DataFetcher'
import GeoJsonParser from './background/GeoJsonParser.worker'
import { SnapshotData } from './SnapshotData.js'
import { LayerData } from './LayerData.js'
import { Rectangle } from '../contracts/Rectangle.js'
import Configuration from '../contracts/Configuration'
import { Progress, ServerConfiguration, SnapshotRequestParams } from '../communication/FrameAnimationAPI'
import SnapshotCache from '@/visualization/frame-animation/modell/SnapshotCache'
import { Snapshot } from '@/visualization/frame-animation/contracts/SnapshotReader'

class DataProvider {
  // new caching
  private snapshotCache!: SnapshotCache
  private dataFetcher!: DataFetcher
  private _layerData = new LayerData()

  // old callbacks
  private _networkDataChanged?: (data: Float32Array) => void
  private _geoJsonDataChanged?: (layerName: string) => void
  private _isFetchingDataChanged?: () => void

  // internal state
  private lastRequestedTimestep = 0
  private maxConcurrentRequests = 1
  private ongoingRequests = 0

  private _agentRequests = 0
  private _config = Configuration.getConfig()
  private _isLoadingPlan = false
  private _maxConcurrentSnapshotRequests = 1

  get isFetchingData(): boolean {
    return this._agentRequests >= this._maxConcurrentSnapshotRequests || this._isLoadingPlan
  }

  // is not correct anymore
  get lastCachedTimestep() {
    return this.snapshotCache.lastTimestep
  }

  // is not correct anymore
  get firstCachedTimestep() {
    return this.snapshotCache.firstTimestep
  }

  set networkDataChanged(callback: (data: Float32Array) => void) {
    this._networkDataChanged = callback
  }

  set geoJsonDataChanged(callback: (layerName: string) => void) {
    this._geoJsonDataChanged = callback
  }

  set isFetchingDataChanged(callback: () => void) {
    this._isFetchingDataChanged = callback
  }

  constructor() {}

  public destroy() {
    this.dataFetcher.destroy()
  }

  public async loadServerConfig() {
    if (!this.dataFetcher) {
      this.dataFetcher = await DataFetcher.create({ dataUrl: this._config.dataUrl, vizId: this._config.vizId })
    }
    try {
      const config = await this.dataFetcher.fetchServerConfig()
      this.handleServerConfigReceived(config)
    } catch (error) {
      console.log(error)
      console.log('reatempting to connect to server in 5s')
      setTimeout(() => this.loadServerConfig(), 5000)
    }
  }

  public async loadNetworkData() {
    const network = await this.dataFetcher.fetchNetwork()
    if (this._networkDataChanged) this._networkDataChanged(network)
  }

  public hasSnapshot(timestep: number) {
    return this.snapshotCache.hasSnapshot(timestep)
  }

  public getSnapshot(timestep: number, speedFactor: number): Snapshot {
    this.lastRequestedTimestep = timestep

    // 1. Get snapshot from chache if available
    if (this.snapshotCache.hasSnapshot(timestep)) {
      return this.snapshotCache.getSnapshot(timestep)
    } else {
      // if not available schedule caching and throw an error
      this.scheduleSnapshotFetching(timestep, speedFactor)
      throw new Error('no snapshot for timestep ' + timestep)
    }

    /*
    if (this.snapshotData.hasSnapshotFor(timestep)) {
      result = this.snapshotData.getSnapshot(timestep, this._speedFactor)
    } else {
      result = {}
    }
    */

    // 2. Make sure there are enough snapshots chached
    // if not tell background worker to load more snapshots
    /*
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
    */
  }

  public async loadPlan(id: number) {
    const params = {
      idIndex: id,
    }

    this._isLoadingPlan = true
    this._onFetchingDataChanged()
    const plan = await this.dataFetcher.fetchPlan(params)
    this._handlePlanDataReceived(plan)
  }

  public getId(index: number, timestep: number) {
    /*let snapshot = this.snapshotData.getSnapshot(timestep, this._speedFactor)
    return snapshot.ids[index]
    */

    throw new Error('not implemented yet')
  }

  public async addGeoJsonLayer(geoJson: string, layerName: string, z: number, color: any) {
    const parameters = {
      layerName: layerName,
      z: z,
      color: color,
      geoJson: geoJson,
    }

    const parser = GeoJsonParser.create()
    const result = await parser.parseGeoJson(parameters)
    this._handleGeoJsonParsed(result)
    parser.destroy()
  }

  public removeGeoJsonLayer(layerName: string) {
    this._layerData.removeLayer(layerName)
    if (this._geoJsonDataChanged) this._geoJsonDataChanged(layerName)
  }

  public getLayer(layerName: string) {
    return this._layerData.getLayer(layerName)
  }

  public clearCache() {
    this.snapshotCache.clearSnapshots()

    // we also need to reload new agents
    if (this.isFetchingData) {
      this._maxConcurrentSnapshotRequests++
    }
  }

  private scheduleSnapshotFetching(timestep: number, speedFactor: number) {
    if (this.ongoingRequests < this.maxConcurrentRequests) {
      this.ongoingRequests++
      setTimeout((t: number, s: number) => this.loadSnapshots(t, s), 0, timestep, speedFactor)
    }
  }

  private async loadSnapshots(fromTimestep: number, speedFactor: number) {
    const requestSize = 100 // use a dynamic estimate later
    const params: SnapshotRequestParams = {
      fromTimestep: fromTimestep,
      size: requestSize,
      speedFactor: speedFactor,
    }

    const response = await this.dataFetcher.fetchSnapshots(params)
    this.ongoingRequests--
    this.snapshotCache.addSnapshots(response)
  }

  private handleServerConfigReceived(config: ServerConfiguration) {
    Configuration.updateServerConfiguration(config)

    if (config.progress !== Progress.Done) {
      setTimeout(() => this.loadServerConfig(), 10000)
    } else {
      this.snapshotCache = new SnapshotCache(config)
      this.loadNetworkData()
    }
  }

  /* async _loadSnapshots(fromTimestep) {
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
    this._onFetchingDataChanged()
    let snapshotResponse = await this.dataFetcher.fetchSnapshots(params)
    this._handleSnapshotDataReceived(snapshotResponse)
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
  */

  // data is of type any until GeoJsonReader is typescript
  private _handlePlanDataReceived(data: any) {
    this._isLoadingPlan = false
    const name = 'selectedPlan'
    const layer = LayerData.createLayer(name, -9.0, this._config.colors.selectedPlan, data)
    this._layerData.addLayer(layer)
    this._onFetchingDataChanged()
    if (this._geoJsonDataChanged) this._geoJsonDataChanged(name)
  }

  private _handleGeoJsonParsed(data: any) {
    const layer = LayerData.createLayer(data.layerName, data.z, data.color, data)
    this._layerData.addLayer(layer)
    if (this._geoJsonDataChanged) this._geoJsonDataChanged(layer.name)
  }

  /*private _isBufferSuficient(timestep) {
    return this._numberOfCachedTimestepsAhead(timestep) > this._config.cache.cachedSnapshots
  }

  private _numberOfCachedTimestepsAhead(timestep) {
    return (this.snapshotData.lastTimestep - timestep) / this.snapshotData.timestepSize
  }

  private _isSmallerThanLastTimestep(timestep) {
    return timestep + this.snapshotData.timestepSize * this._speedFactor <= this.lastTimestep
  }

  private _getRequestSize(timestep) {
    let size = this._numberOfCachedTimestepsAhead(this.lastRequestedTimestep)
    if (this._config.cache.minRequestSize > size) {
      size = this._config.cache.minRequestSize
    }
    return size
  }
  */

  private _onFetchingDataChanged() {
    if (this._isFetchingDataChanged) {
      this._isFetchingDataChanged()
    }
  }
}

export { DataProvider }
