import { ServerConfiguration, Progress } from '../communication/FrameAnimationAPI'

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
  private static instance: Config

  private _listeners: Array<Function> = []
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

  constructor(parameters: ConfigParams) {
    this.setVizId(parameters.vizId)
    this.setCanvasId(parameters.canvasId)
    this.setColors(parameters.colors || {})
    this.setCache(parameters.cache || {})
    this.setDataUrl(parameters.dataUrl)
  }

  destroy() {
    this._listeners = []
  }

  subscribeServerConfigUpdated(callback: Function) {
    this._listeners.push(callback)
  }

  unsubscribeServerConfigUpdated(callback: Function) {
    let index = this._listeners.indexOf(callback)
    this._listeners.splice(index, 1)
  }

  _broadCastServerConfigUpdated() {
    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i]()
    }
  }

  _updateServerConfig(serverConfig: ServerConfiguration) {
    this.setServerConfig(serverConfig)
    this._broadCastServerConfigUpdated()
  }
}

let instance: Config

let Configuration = {
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
