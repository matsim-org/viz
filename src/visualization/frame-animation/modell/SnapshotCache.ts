import { ServerConfiguration } from '@/visualization/frame-animation/communication/FrameAnimationAPI'
import { Snapshot } from '@/visualization/frame-animation/contracts/SnapshotReader'

interface SnapshotEntry {
  isLoaded: boolean
  data: Snapshot
}

export default class SnapshotCache {
  private _firstTimestep: number
  private _lastTimestep: number
  private _timestepSize: number
  private snapshots: SnapshotEntry[] = []

  get firstTimestep() {
    return this._firstTimestep
  }

  get lastTimestep() {
    return this._lastTimestep
  }

  get timestepSize() {
    return this._timestepSize
  }

  constructor(config: ServerConfiguration) {
    this._firstTimestep = config.firstTimestep
    this._lastTimestep = config.lastTimestep
    this._timestepSize = config.timestepSize
    this.initEmptySnapshots()
  }

  public addSnapshots(snapshots: Snapshot[]) {
    snapshots.forEach(snapshot => this.addSnapshot(snapshot))
  }

  public addSnapshot(snapshot: Snapshot) {
    // check whether timestep is within bounds
    if (!this.isWithinBounds(snapshot.time)) {
      throw new Error('snapshot has invalid timestep')
    }
    // if true just add the snapshot. (override existing)
    const index = this.getIndexForTimestep(snapshot.time)
    this.snapshots[index] = {
      isLoaded: true,
      data: snapshot,
    }
  }

  public hasSnapshot(timestep: number): boolean {
    return this.getEntry(timestep).isLoaded
  }

  public getSnapshot(timestep: number): Snapshot {
    return this.getEntry(timestep).data
  }

  public getSnapshotSize(timestep: number): number {
    return this.getEntry(timestep).data.ids.length
  }

  public clearSnapshots() {
    this.snapshots = []
  }

  private initEmptySnapshots() {
    const length = (this._lastTimestep - this._firstTimestep) / this._timestepSize
    const emptyEntry: SnapshotEntry = {
      isLoaded: false,
      data: {
        ids: new Float32Array(0),
        nextPosition: new Float32Array(0),
        position: new Float32Array(0),
        shouldInterpolate: new Float32Array(0),
        time: 0,
      },
    }
    for (let i = 0; i < length; i++) {
      this.snapshots.push(emptyEntry)
    }
  }

  private isWithinBounds(timestep: number) {
    return timestep > this._firstTimestep - 0.001 && timestep < this._lastTimestep + 0.001
  }

  private getIndexForTimestep(timestep: number) {
    if (timestep > this._lastTimestep || timestep < this._firstTimestep) throw new Error('invalid timestep')
    const index = (timestep - this._firstTimestep) / this._timestepSize
    if (index < 0) return 0
    return index
  }

  private getEntry(timestep: number) {
    const index = this.getIndexForTimestep(timestep)
    return this.snapshots[index]
  }
}
