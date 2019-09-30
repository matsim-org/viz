import DrawingController from '@/visualization/frame-animation/view/DrawingController.js'
import Playback from './modell/Playback'
import DataProvider from './modell/DataProvider'
import Configuration, { ConfigParams } from './contracts/Configuration'
import FrameAnimationAPI from './communication/FrameAnimationAPI'

export default class Webvis {
  private _config: Configuration
  private _playback: Playback
  private _dataProvider: DataProvider
  private _drawingController: any
  private _onServerConfigChanged?: () => void
  private _onFetchingData?: (isFetching: boolean) => void

  get firstTimestep() {
    return this._config.firstTimestep
  }

  get lastTimestep() {
    return this._config.lastTimestep
  }

  get timestepSize() {
    return this._config.timestepSize
  }

  get playbackSpeedFactor() {
    return this._playback.speedFactor
  }

  get isPlaying() {
    return this._drawingController.shouldRender
  }

  get progress() {
    return this._config.progress
  }

  set onServerConfigChanged(value: () => void) {
    this._onServerConfigChanged = value
  }

  set onTimestepChanged(value: (timestep: number) => void) {
    this._playback.addTimestepChangedListener(value)
  }

  set onFetchingData(value: (isFetching: boolean) => void) {
    this._onFetchingData = value
  }

  /**
   * Constructor for the webvis Wrapper. It loads everything necessary for starting a Matsim visualization
   * Call this constructor only after "DOMContentLoaded" event!
   * @param {object} configuration - A configuration Object with a lot of stuff inside
   */
  constructor(configParameters: ConfigParams) {
    this._config = new Configuration(configParameters)
    this._config.subscribeServerConfigUpdated(() => this.handleServerConfigChanged())

    const api = new FrameAnimationAPI(this._config.dataUrl, this._config.vizId, configParameters.accessToken)
    this._dataProvider = new DataProvider(api, this._config)
    this._dataProvider.loadServerConfig()
    this._dataProvider.isFetchingDataChanged = () => this.handleIsFetchingDataChanged()

    this._playback = new Playback(this._dataProvider, this._config)
    this._drawingController = new DrawingController(this._playback, this._dataProvider, this._config)
  }

  /**
   * Starts playback of the qSim from current Timestep
   */
  public startPlayback(): void {
    this._drawingController.startPlayback()
  }

  /**
   * Stops playback of the qSim
   */
  public stopPlayback() {
    this._drawingController.stopPlayback()
  }

  /**
   * Sets the timestep of the playback to the provided timestep
   * @param {number} timestep - Timesteps for the next frame, should be between last and first timestep
   */
  public seekTimestep(timestep: number) {
    this._playback.seekTimestep(timestep)
  }

  /**
   * Sets the speed of the playback. Simple speed is multiplied by the provided factor.
   * If factor is e.g. 2.0 every other frame is skipped, thus the animation runs twice as fast
   * @param {number} factor - The playback speed is multiplied by the supplied factor
   */
  public setPlaybackSpeed(factor: number) {
    this._playback.speedFactor = factor
  }

  public addGeoJsonLayer(geoJson: string, layerName: string, z: number, color: any) {
    this._dataProvider.addGeoJsonLayer(geoJson, layerName, -z, color)
  }

  public removeGeoJsonLayer(layerName: string) {
    this._dataProvider.removeGeoJsonLayer(layerName)
  }

  public destroy() {
    // kill all members
    this._dataProvider.destroy()
    this._drawingController.destroy()
    this._playback.destroy()
    this._config.destroy()

    // remove all delegates
    this._onFetchingData = () => {}
    this._onServerConfigChanged = () => {}
  }

  private handleServerConfigChanged() {
    if (this._onServerConfigChanged) {
      this._onServerConfigChanged()
    }
  }

  private handleIsFetchingDataChanged() {
    if (this._onFetchingData) {
      this._onFetchingData(this._dataProvider.isFetchingData)
    }
  }
}
