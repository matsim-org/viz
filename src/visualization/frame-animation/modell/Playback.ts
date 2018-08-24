import Configuration from '../contracts/Configuration'
import { DataProvider } from '@/visualization/frame-animation/modell/DataProvider'
import { Snapshot } from '@/visualization/frame-animation/contracts/SnapshotReader'

class Playback {
  private _currentTimestep = 0
  private _currentTime = 0
  private _timestepFraction = 0
  private _speedFactor = 1.0
  private _firstTimestep = 0
  private _lastTimestep = 0
  private _timestepSize = 0
  private dataProvider: DataProvider
  private config = Configuration.getConfig()

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

  constructor(dataProvider: DataProvider) {
    this.config.subscribeServerConfigUpdated(() => this._onServerConfigUpdated())
    this.dataProvider = dataProvider
  }

  public addTimestepChangedListener(callback: (timestep: number) => void) {
    this._timestepChangedListeners.push(callback)
  }

  public advanceTime() {
    const nextTime = this._currentTime + this._timestepSize * this._speedFactor

    // if next time crosses a real timestep
    if (nextTime <= this._currentTimestep || nextTime >= this._currentTimestep + this._timestepSize) {
      // check if a snapshot for that next timestep exsists
      if (this.dataProvider.hasSnapshot(nextTime)) {
        // if so, set current time to next timestep
        this.setCurrentTimestep(this.dataProvider.getSnapshot(nextTime).time)
      } else {
        // maybe we have reached the end
        if (nextTime <= this._firstTimestep) {
          this.setCurrentTimestep(this._lastTimestep)
        } else if (nextTime >= this._lastTimestep) {
          this.setCurrentTimestep(this._firstTimestep)
        }
      }
    } else {
      this._currentTime = nextTime
    }
  }

  public seekTimestep(timestep: number) {
    if (timestep > this._lastTimestep || timestep < this._firstTimestep) {
      timestep = this._firstTimestep
    }

    const modulo = timestep % this._timestepSize
    this.setCurrentTimestep(timestep - modulo)
  }

  public isBuffering(): boolean {
    return this.dataProvider.isFetchingData
  }

  public destroy() {
    this._timestepChangedListeners = []
  }

  private _onServerConfigUpdated() {
    this._currentTimestep = this.config.firstTimestep
    this._currentTime = this.config.firstTimestep
    this._firstTimestep = this.config.firstTimestep
    this._lastTimestep = this.config.lastTimestep
    this._timestepSize = this.config.timestepSize
  }

  private setCurrentTimestep(time: number) {
    this._currentTimestep = time
    this._currentTime = time
    this.callTimestepChangedListeners()
  }

  private callTimestepChangedListeners() {
    this._timestepChangedListeners.forEach(listener => {
      listener(this._currentTimestep)
    })
  }
}

export { Playback }
