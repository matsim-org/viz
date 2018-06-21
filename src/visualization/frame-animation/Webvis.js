import { DrawingController } from './view/DrawingController.js'
import { Playback } from './modell/Playback.js'
import { DataProvider } from './modell/DataProvider.js'
import Configuration from './contracts/Configuration.js'

class Webvis {
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
    return this.playback.speedFactor
  }

  get isPlaying() {
    return this.drawingController.shouldRender
  }

  set onServerConfigChanged(value) {
    this._onServerConfigChanged = value
  }

  set onTimestepChanged(value) {
    this.playback.onTimestepChanged = value
  }

  set onFetchingData(value) {
    this._onFetchingData = value
  }

  /**
   * Constructor for the webvis Wrapper. It loads everything necessary for starting a Matsim visualization
   * Call this constructor only after "DOMContentLoaded" event!
   * @param {object} configuration - A configuration Object with a lot of stuff inside
   */
  constructor(configParameters) {
    Configuration.createConfiguration(configParameters)
    this._config = Configuration.getConfig()
    this._config.subscribeServerConfigUpdated(() => this._handleServerConfigChanged())
    this.dataProvider = new DataProvider()
    this.dataProvider.loadServerConfig()
    this.dataProvider.isFetchingDataChanged = () => this._handleIsFetchingDataChanged()

    this.drawingController = new DrawingController()
    this.drawingController.dataProvider = this.dataProvider

    this.playback = new Playback(this.dataProvider)
    this.drawingController.playback = this.playback
  }

  /**
   * Starts playback of the qSim from current Timestep
   */
  startPlayback() {
    this.drawingController.startPlayback()
  }

  /**
   * Stops playback of the qSim
   */
  stopPlayback() {
    this.drawingController.stopPlayback()
  }

  /**
   * Sets the timestep of the playback to the provided timestep
   * @param {number} timestep - Timesteps for the next frame, should be between last and first timestep
   */
  seekTimestep(timestep) {
    this.playback.seekTimestep(timestep)
  }

  /**
   * Sets the speed of the playback. Simple speed is multiplied by the provided factor.
   * If factor is e.g. 2.0 every other frame is skipped, thus the animation runs twice as fast
   * @param {number} factor - The playback speed is multiplied by the supplied factor
   */
  setPlaybackSpeed(factor) {
    this.playback.speedFactor = factor
  }

  addGeoJsonLayer(geoJson, layerName, z, color) {
    this.dataProvider.addGeoJsonLayer(geoJson, layerName, -z, color)
  }

  removeGeoJsonLayer(layerName) {
    this.dataProvider.removeGeoJsonLayer(layerName)
  }

  destroy() {
    // kill all members
    this.dataProvider.destroy()
    this.drawingController.destroy()
    this.playback.destroy()
    this._config.destroy()

    // remove all delegates
    this._onFetchingData = null
    this._onServerConfigChanged = null
  }

  _handleServerConfigChanged() {
    if (this._onServerConfigChanged) {
      this._onServerConfigChanged()
    }
  }

  _handleIsFetchingDataChanged() {
    if (this._onFetchingData) {
      this._onFetchingData(this.dataProvider.isFetchingData)
    }
  }
}

export default Webvis
