import Configuration from '../contracts/Configuration'
import DataProvider from '@/visualization/frame-animation/modell/DataProvider'

export default class Playback {
  private _currentTimestep = 0
  private _currentTime = 0
  private _speedFactor = 0.0
  private _firstTimestep = 0
  private _lastTimestep = 0
  private _timestepSize = 0
  private _dataProvider: DataProvider
  private _config: Configuration

  // callbacks
  private _timestepChangedListeners: Array<(timestep: number) => void> = []

  get currentTimestep() {
    return this._currentTimestep
  }

  get currentTime() {
    return this._currentTime
  }

  get timestepFraction() {
    return (this._currentTime - this._currentTimestep) / this._timestepSize
  }

  set speedFactor(value) {
    this._speedFactor = value
  }

  get speedFactor() {
    return this._speedFactor
  }

  constructor(dataProvider: DataProvider, config: Configuration) {
    this._config = config
    this._config.subscribeServerConfigUpdated(() => this.onServerConfigUpdated())
    this._dataProvider = dataProvider
  }

  public addTimestepChangedListener(callback: (timestep: number) => void) {
    this._timestepChangedListeners.push(callback)
  }

  public advanceTime() {
    this._currentTime = this._currentTime + this._timestepSize * this._speedFactor

    // if next time crosses a real timestep
    if (this._currentTime <= this._currentTimestep || this._currentTime >= this._currentTimestep + this._timestepSize) {
      // check if a snapshot for that next timestep exsists
      if (this._dataProvider.hasSnapshot(this._currentTime, this._speedFactor)) {
        // if so, set current time to next timestep
        this.setCurrentTimestep(this._dataProvider.getSnapshot(this._currentTime).time)
      } else {
        // maybe we have reached the end
        if (this._currentTime <= this._firstTimestep) {
          this.setCurrentTimestep(this._lastTimestep)
          this._currentTime = this._currentTimestep
        } else if (this._currentTime >= this._lastTimestep) {
          this.setCurrentTimestep(this._firstTimestep)
          this._currentTime = this._currentTimestep
        }
      }
    }
  }

  public seekTimestep(timestep: number) {
    if (timestep > this._lastTimestep || timestep < this._firstTimestep) {
      timestep = this._firstTimestep
    }

    const modulo = timestep % this._timestepSize
    this.setCurrentTimestep(timestep - modulo)
    this._currentTime = this.currentTimestep
  }

  public destroy() {
    this._timestepChangedListeners = []
  }

  private onServerConfigUpdated() {
    this._currentTimestep = this._config.firstTimestep
    this._currentTime = this._config.firstTimestep
    this._firstTimestep = this._config.firstTimestep
    this._lastTimestep = this._config.lastTimestep
    this._timestepSize = this._config.timestepSize
  }

  private setCurrentTimestep(time: number) {
    this._currentTimestep = time
    this.callTimestepChangedListeners()
  }

  private callTimestepChangedListeners() {
    this._timestepChangedListeners.forEach(listener => {
      listener(this._currentTimestep)
    })
  }
}
