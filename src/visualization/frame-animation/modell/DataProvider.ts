import DataFetcher from './background/DataFetcher'
import GeoJsonParser from './background/GeoJsonParser.worker'
import { LayerData } from './LayerData.js'
import Configuration from '../contracts/Configuration'
import { Progress, ServerConfiguration } from '../communication/FrameAnimationAPI'
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

  private _agentRequests = 0
  private _config = Configuration.getConfig()
  private _isLoadingPlan = false
  private _maxConcurrentSnapshotRequests = 1

  get isFetchingData(): boolean {
    return this.snapshotCache.isFetching || this._isLoadingPlan
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

  public getSnapshot(timestep: number): Snapshot {
    this.snapshotCache.ensureSufficientCaching(timestep)

    if (this.snapshotCache.hasSnapshot(timestep)) {
      return this.snapshotCache.getSnapshot(timestep)
    } else {
      throw new Error('no snapshot for timestep ' + timestep)
    }
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
  }

  private handleServerConfigReceived(config: ServerConfiguration) {
    Configuration.updateServerConfiguration(config)

    if (config.progress !== Progress.Done) {
      setTimeout(() => this.loadServerConfig(), 10000)
    } else {
      this.snapshotCache = new SnapshotCache(config, this.dataFetcher)
      this.loadNetworkData()
    }
  }

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

  private _onFetchingDataChanged() {
    if (this._isFetchingDataChanged) {
      this._isFetchingDataChanged()
    }
  }
}

export { DataProvider }
