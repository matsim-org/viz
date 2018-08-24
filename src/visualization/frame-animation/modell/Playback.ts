import Configuration from '../contracts/Configuration'
import { DataProvider } from '@/visualization/frame-animation/modell/DataProvider'
import { Snapshot } from '@/visualization/frame-animation/contracts/SnapshotReader'

class Playback {
  private _currentTimestep = 0
  private _timestepFraction = 0
  private _speedFactor = 1.0
  private _firstTimestep = 0
  private _lastTimestep = 0
  private _timestepSize = 0
  private dataProvider: DataProvider
  private config = Configuration.getConfig()

  // callbacks
  private _onTimestepChanged?: (timestep: number) => void

  get currentTimestep() {
    return this._currentTimestep
  }

  get timestepFraction() {
    return this._timestepFraction
  }

  set speedFactor(value) {
    if (this._shouldRelaodShansphots(value)) {
      this.dataProvider.clearCache()
    }
    this._speedFactor = value
    this._timestepFraction = 0.0
  }

  get speedFactor() {
    return this._speedFactor
  }

  set onTimestepChanged(callback: (timestep: number) => void) {
    this._onTimestepChanged = callback
  }

  constructor(dataProvider: DataProvider) {
    this.config.subscribeServerConfigUpdated(() => this._onServerConfigUpdated())
    this.dataProvider = dataProvider
  }

  public shouldLoadNewSnapshot() {
    return this.timestepFraction === 0
  }

  public getSnapshotForCurrentTimestep(): Snapshot {
    try {
      return this.dataProvider.getSnapshot(this.currentTimestep)
    } catch (error) {
      // if dataProvider has no snapshot we serve an emtpy one
      return {
        time: this.currentTimestep,
        position: new Float32Array(0),
        nextPosition: new Float32Array(0),
        shouldInterpolate: new Float32Array(0),
        ids: new Float32Array(0),
      }
    }
  }

  public incrementTime() {
    if (
      this.dataProvider.lastCachedTimestep > this.currentTimestep &&
      this.currentTimestep >= this.dataProvider.firstCachedTimestep
    ) {
      this._incrementCurrentTime()
    } else if (this._reachedEndOfPlayback(this.currentTimestep)) {
      this._resetToFirstTimestep()
    }
  }

  public seekTimestep(timestep: number) {
    if (timestep > this._lastTimestep || timestep < this._firstTimestep) {
      timestep = this._firstTimestep
    }

    if (timestep < this.dataProvider.firstCachedTimestep) {
      this.dataProvider.clearCache()
    }
    const modulo = timestep % this._timestepSize
    this._setCurrentTime(timestep - modulo)
  }

  public isBuffering(): boolean {
    return this.dataProvider.isFetchingData
  }

  public destroy() {
    this._onTimestepChanged = undefined
  }

  private _onServerConfigUpdated() {
    this._currentTimestep = this.config.firstTimestep
    this._firstTimestep = this.config.firstTimestep
    this._lastTimestep = this.config.lastTimestep
    this._timestepSize = this.config.timestepSize
  }

  private _incrementCurrentTime() {
    const currentTime = this.currentTimestep + this.timestepFraction * this._timestepSize
    const nextTime = currentTime + this._timestepSize * this._speedFactor
    const newFraction = (nextTime - this.currentTimestep) / this._timestepSize

    if (newFraction >= 1.0) {
      this._incrementCurrentTimestep()
      this._timestepFraction = 0.0
    } else {
      this._timestepFraction = newFraction
    }
  }

  private _incrementCurrentTimestep() {
    let nextTimestep = 0

    if (this._speedFactor >= 1.0) {
      nextTimestep = this.currentTimestep + this._timestepSize * this._speedFactor
    } else {
      nextTimestep = this.currentTimestep + this._timestepSize
    }

    if (this._reachedEndOfPlayback(nextTimestep)) {
      this._resetToFirstTimestep()
    } else {
      this._setCurrentTimestep(nextTimestep)
    }
  }

  private _setCurrentTime(value: number) {
    this._timestepFraction = 0
    this._setCurrentTimestep(value)
  }

  private _setCurrentTimestep(value: number) {
    this._currentTimestep = value
    if (this._onTimestepChanged) {
      this._onTimestepChanged(this._currentTimestep)
    }
  }

  private _shouldRelaodShansphots(newSpeedFactor: number) {
    return this._speedFactor > 1.0 || newSpeedFactor > 1.0
  }

  private _reachedEndOfPlayback(timestep: number) {
    return timestep + this._timestepSize * this._speedFactor > this._lastTimestep
  }

  private _resetToFirstTimestep() {
    this._setCurrentTime(this._firstTimestep)
    this.dataProvider.clearCache()
  }
}

export { Playback }
