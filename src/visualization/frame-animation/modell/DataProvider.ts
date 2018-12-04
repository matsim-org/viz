import GeoJsonParser from './background/GeoJsonParser.worker'
import { LayerData } from './LayerData.js'
import Configuration from '../contracts/Configuration'
import FrameAnimationAPI, { Progress, ServerConfiguration } from '../communication/FrameAnimationAPI'
import SnapshotCache from '@/visualization/frame-animation/modell/SnapshotCache'
import { Snapshot } from '@/visualization/frame-animation/contracts/SnapshotReader'
import SnapshotFetcher from '@/visualization/frame-animation/modell/background/SnapshotFetcher'
import NetworkReader from '@/visualization/frame-animation/contracts/NetworkReader'
import PlanFetcher from '@/visualization/frame-animation/modell/background/PlanFetcher'
import Rectangle from '@/visualization/frame-animation/contracts/Rectangle'

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

  private _config: Configuration
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

  constructor(api: FrameAnimationAPI, config: Configuration) {
    this._api = api
    this._config = config
  }

  public destroy() {
    if (this._planFetcher) this._planFetcher.destroy()
    if (this._snapshotCache) this._snapshotCache.destroy()
  }

  public async loadServerConfig() {
    try {
      const config = await this._api.fetchConfiguration()
      this.handleServerConfigReceived(config)
    } catch (error) {
      console.log(error)
      this._config.updateServerConfig({
        bounds: new Rectangle(0, 0, 0, 0),
        firstTimestep: 0,
        lastTimestep: 0,
        timestepSize: 0,
        progress: Progress.Failed,
      })
    }
  }

  public async loadNetworkData() {
    const buffer = await this._api.fetchNetwork()
    const reader = new NetworkReader(buffer)
    const network = reader.parse()
    if (this._networkDataChanged) this._networkDataChanged(network)
  }

  public hasSnapshot(timestep: number, speedFactor: number) {
    const result = this._snapshotCache.hasSnapshot(timestep)
    this._snapshotCache.ensureSufficientCaching(timestep, speedFactor)
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
    this.onFetchingDataChanged()
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
    this._config.updateServerConfig(config)

    if (config.progress !== Progress.Done && config.progress !== Progress.Failed) {
      setTimeout(() => this.loadServerConfig(), 10000)
    } else if (config.progress !== Progress.Failed) {
      this.loadNetworkData()
      const snapshotFetcherTask = SnapshotFetcher.create({
        dataUrl: this._config.dataUrl,
        vizId: this._config.vizId,
        accessToken: this._config.accessToken,
      })
      const planFetcherTask = PlanFetcher.create({
        dataUrl: this._config.dataUrl,
        vizId: this._config.vizId,
        accessToken: this._config.accessToken,
      })
      this._snapshotCache = new SnapshotCache(config, await snapshotFetcherTask, () => this.onFetchingDataChanged())
      this._snapshotCache.ensureSufficientCaching(config.firstTimestep, 1.0)
      this._planFetcher = await planFetcherTask
    }
  }

  // data is of type any until GeoJsonReader is typescript
  private _handlePlanDataReceived(data: any) {
    this._isLoadingPlan = false
    const name = 'selectedPlan'
    const layer = LayerData.createLayer(name, -9.0, this._config.colors.selectedPlan, data)
    this._layerData.addLayer(layer)
    this.onFetchingDataChanged()
    if (this._geoJsonDataChanged) this._geoJsonDataChanged(name)
  }

  private _handleGeoJsonParsed(data: any) {
    const layer = LayerData.createLayer(data.layerName, data.z, data.color, data)
    this._layerData.addLayer(layer)
    if (this._geoJsonDataChanged) this._geoJsonDataChanged(layer.name)
  }

  private onFetchingDataChanged() {
    if (this._isFetchingDataChanged) {
      this._isFetchingDataChanged()
    }
  }
}
