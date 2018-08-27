import { ServerConfiguration, Progress } from '@/visualization/frame-animation/communication/FrameAnimationAPI'

interface ConfigColors {
  background?: number
  network?: number
  agents?: number
  selectedAgent?: number
  selectedPlan?: number
}

interface ConfigCacheParams {
  cachedSnapshots?: number
  minRequestSize?: number
  oldSnapshotsToKeep?: number
}

interface ConfigParams {
  vizId: string
  canvasId: string
  dataUrl: string
  colors?: ConfigColors
  cache?: ConfigCacheParams
}
class Config {
  get vizId() {
    return this._vizId
  }
  get canvasId() {
    return this._canvasId
  }
  get dataUrl() {
    return this._dataUrl
  }
  get colors() {
    return this._colors
  }
  get cache() {
    return this._cache
  }
  get firstTimestep() {
    return this._serverConfig.firstTimestep
  }
  get lastTimestep() {
    return this._serverConfig.lastTimestep
  }
  get timestepSize() {
    return this._serverConfig.timestepSize
  }
  get bounds() {
    return this._serverConfig.bounds
  }
  get progress() {
    return this._serverConfig.progress
  }

  private _listeners: Array<(() => void)> = []

  private _vizId = ''
  private _canvasId = ''
  private _dataUrl = ''
  private _colors: ConfigColors = {}
  private _cache: ConfigCacheParams = {}
  private _serverConfig: ServerConfiguration = {
    firstTimestep: 0,
    lastTimestep: 0,
    timestepSize: 1,
    bounds: { left: 0, right: 0, top: 0, bottom: 0 },
    progress: Progress.Downloading,
  }

  constructor(parameters: ConfigParams) {
    this.setVizId(parameters.vizId)
    this.setCanvasId(parameters.canvasId)
    this.setColors(parameters.colors || {})
    this.setCache(parameters.cache || {})
    this.setDataUrl(parameters.dataUrl)
  }

  public destroy() {
    this._listeners = []
  }

  public subscribeServerConfigUpdated(callback: () => void) {
    this._listeners.push(callback)
  }

  public unsubscribeServerConfigUpdated(callback: () => void) {
    const index = this._listeners.indexOf(callback)
    this._listeners.splice(index, 1)
  }

  public _broadCastServerConfigUpdated() {
    for (const listener of this._listeners) {
      listener()
    }
  }

  public _updateServerConfig(serverConfig: ServerConfiguration) {
    this.setServerConfig(serverConfig)
    this._broadCastServerConfigUpdated()
  }

  private setVizId(id: string) {
    if (!id) throw new Error('vizId is required!')
    this._vizId = id
  }

  private setCanvasId(id: string) {
    this._canvasId = id
  }

  private setDataUrl(url: string) {
    this._dataUrl = url
  }

  private setColors(colors: ConfigColors) {
    this._colors = {
      background: colors.background || 0xecf0f1,
      network: colors.network || 0x2c3e50,
      agents: colors.agents || 0x3498db,
      selectedAgent: colors.selectedAgent || 0xe74c3c,
      selectedPlan: colors.selectedPlan || 0xe74c3c,
    }
  }

  private setCache(cache: ConfigCacheParams) {
    this._cache = {
      cachedSnapshots: cache.cachedSnapshots || 1200,
      minRequestSize: cache.minRequestSize || 100,
      oldSnapshotsToKeep: cache.oldSnapshotsToKeep || 900,
    }
  }

  private setServerConfig(config: ServerConfiguration) {
    this._serverConfig = config
  }
}

let instance: Config

// bc: this is essentially acting a singleton.
// tslint:disable-next-line:variable-name
const Configuration = {
  createConfiguration: (parameters: ConfigParams) => {
    instance = new Config(parameters)
  },

  updateServerConfiguration: (parameters: ServerConfiguration) => {
    instance._updateServerConfig(parameters)
  },

  getConfig: () => {
    if (!instance) {
      throw Error('configuration was not created yet')
    }
    return instance
  },
}

export default Configuration
