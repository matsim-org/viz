import GeoJsonParser from './background/GeoJsonParser.worker'
import { LayerData } from './LayerData.js'
import Configuration from '../contracts/Configuration'
import FrameAnimationAPI, { Progress, ServerConfiguration } from '../communication/FrameAnimationAPI'
import SnapshotCache from '@/visualization/frame-animation/modell/SnapshotCache'
import { Snapshot } from '@/visualization/frame-animation/contracts/SnapshotReader'
import SnapshotFetcher from '@/visualization/frame-animation/modell/background/SnapshotFetcher'
import NetworkReader from '@/visualization/frame-animation/contracts/NetworkReader'
import PlanFetcher from '@/visualization/frame-animation/modell/background/PlanFetcher'

export default class DataProvider {
  // new caching
  private _snapshotCache!: SnapshotCache
  private _layerData = new LayerData()
  private readonly _api: FrameAnimationAPI
  private _planFetcher!: PlanFetcher

  // old callbacks
  private _networkDataChanged?: (data: Float32Array) => void
  private _geoJsonDataChanged?: (layerName: string) => void
  private _isFetchingDataChanged?: () => void

  private _config = Configuration.getConfig()
  private _isLoadingPlan = false

  get isFetchingData(): boolean {
    return this._snapshotCache.isFetching || this._isLoadingPlan
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

  constructor(api: FrameAnimationAPI) {
    this._api = api
  }

  public destroy() {
    this._planFetcher.destroy()
  }

  public async loadServerConfig() {
    try {
      const config = await this._api.fetchConfiguration()
      this.handleServerConfigReceived(config)
    } catch (error) {
      console.log(error)
      console.log('reatempting to connect to server in 5s')
      setTimeout(() => this.loadServerConfig(), 5000)
    }
  }

  public async loadNetworkData() {
    const buffer = await this._api.fetchNetwork()
    const reader = new NetworkReader(buffer)
    const network = reader.parse()
    if (this._networkDataChanged) this._networkDataChanged(network)
  }

  public hasSnapshot(timestep: number) {
    const result = this._snapshotCache.hasSnapshot(timestep)
    this._snapshotCache.ensureSufficientCaching(timestep)
    return result
  }

  public getSnapshot(timestep: number): Snapshot {
    if (this._snapshotCache.hasSnapshot(timestep)) {
      return this._snapshotCache.getSnapshot(timestep)
    } else {
      throw new Error('no snapshot for timestep ' + timestep)
    }
  }

  public async loadPlan(id: number) {
    this._isLoadingPlan = true
    this._onFetchingDataChanged()
    const plan = await this._planFetcher.fetchPlan({ idIndex: id })
    this._handlePlanDataReceived(plan)
  }

  public getId(index: number, timestep: number) {
    const snapshot = this._snapshotCache.getSnapshot(timestep)
    return snapshot.ids[index]
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
    this._snapshotCache.clearSnapshots()
  }

  private async handleServerConfigReceived(config: ServerConfiguration) {
    Configuration.updateServerConfiguration(config)

    if (config.progress !== Progress.Done) {
      setTimeout(() => this.loadServerConfig(), 10000)
    } else {
      this.loadNetworkData()
      const snapshotFetcherTask = SnapshotFetcher.create({
        dataUrl: this._config.dataUrl,
        vizId: this._config.vizId,
      })
      const planFetcherTask = PlanFetcher.create({ dataUrl: this._config.dataUrl, vizId: this._config.vizId })
      this._snapshotCache = new SnapshotCache(config, await snapshotFetcherTask)
      this._snapshotCache.ensureSufficientCaching(config.firstTimestep)
      this._planFetcher = await planFetcherTask
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
