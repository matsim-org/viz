import {
  ServerConfiguration,
  SnapshotRequestParams,
} from '@/visualization/frame-animation/communication/FrameAnimationAPI'
import { Snapshot } from '@/visualization/frame-animation/contracts/SnapshotReader'
import DataFetcher from '@/visualization/frame-animation/modell/background/DataFetcher'

interface SnapshotRequest {
  fromIndex: number
  toIndex: number
}

enum SnapshotEntryStatus {
  NOT_LOADED,
  LOADING,
  LOADED,
}

const emtpySnapshot: Snapshot = {
  ids: new Float32Array(0),
  nextPosition: new Float32Array(0),
  position: new Float32Array(0),
  shouldInterpolate: new Float32Array(0),
  time: 0,
}

class SnapshotEntry {
  private static _emtpyEntry: SnapshotEntry = new SnapshotEntry(SnapshotEntryStatus.NOT_LOADED, emtpySnapshot)
  private static _loadingEntry: SnapshotEntry = new SnapshotEntry(SnapshotEntryStatus.LOADING, emtpySnapshot)

  private _status: SnapshotEntryStatus
  private _snapshot: Snapshot

  get status() {
    return this._status
  }

  get snapshot() {
    return this._snapshot
  }

  private constructor(status: SnapshotEntryStatus, snapshot: Snapshot) {
    this._status = status
    this._snapshot = snapshot
  }

  public static getEmtpyEntry() {
    return SnapshotEntry._emtpyEntry
  }

  public static getLoadingEntry() {
    return SnapshotEntry._loadingEntry
  }

  public static createLoadedEntry(snapshot: Snapshot) {
    return new SnapshotEntry(SnapshotEntryStatus.LOADED, snapshot)
  }

  public isLoaded() {
    return this._status === SnapshotEntryStatus.LOADED
  }

  public isLoading() {
    return this._status === SnapshotEntryStatus.LOADING
  }

  public isNotLoaded() {
    return this._status === SnapshotEntryStatus.NOT_LOADED
  }
}

export default class SnapshotCache {
  private _firstTimestep: number
  private _lastTimestep: number
  private _timestepSize: number
  private snapshots: SnapshotEntry[] = []

  private minCacheSize = 200
  private fetchSize = 50
  private dataFetcher: DataFetcher
  private requests: SnapshotRequest[] = []

  get firstTimestep() {
    return this._firstTimestep
  }

  get lastTimestep() {
    return this._lastTimestep
  }

  get timestepSize() {
    return this._timestepSize
  }

  constructor(config: ServerConfiguration, dataFetcher: DataFetcher) {
    this._firstTimestep = config.firstTimestep
    this._lastTimestep = config.lastTimestep
    this._timestepSize = config.timestepSize
    this.dataFetcher = dataFetcher
    this.initEmptySnapshots()
  }

  public addSnapshots(snapshots: Snapshot[]) {
    snapshots.forEach(snapshot => this.addSnapshot(snapshot))
  }

  public addSnapshot(snapshot: Snapshot) {
    if (!this.isWithinBounds(snapshot.time)) {
      throw new Error('snapshot has invalid timestep')
    }

    const index = this.getIndexForTimestep(snapshot.time)
    this.snapshots[index] = SnapshotEntry.createLoadedEntry(snapshot)
  }

  public hasSnapshot(timestep: number): boolean {
    return this.getEntry(timestep).status === SnapshotEntryStatus.LOADED
  }

  public getSnapshot(timestep: number): Snapshot {
    return this.getEntry(timestep).snapshot
  }

  public getSnapshotSize(timestep: number): number {
    return this.getEntry(timestep).snapshot.ids.length
  }

  public clearSnapshots() {
    this.initEmptySnapshots()
  }

  public ensureSufficientCaching(timestep: number) {
    const timestepIndex = this.getIndexForTimestep(timestep)

    for (let i = timestepIndex; i < this.snapshots.length && i < timestepIndex + this.minCacheSize; i++) {
      const entry = this.snapshots[i]
      if (entry.isNotLoaded()) {
        this.loadChunkFrom(i)
      }
    }
  }

  private async loadChunkFrom(start: number) {
    let index = start
    while (index < this.snapshots.length && index < start + this.minCacheSize) {
      this.snapshots[index] = SnapshotEntry.getLoadingEntry()
      index++
    }

    const params: SnapshotRequestParams = {
      fromTimestep: this.firstTimestep + start * this.timestepSize,
      size: index - start,
      speedFactor: 1.0,
    }

    const snapshots = await this.dataFetcher.fetchSnapshots(params)
    this.addSnapshots(snapshots)
  }

  private initEmptySnapshots() {
    const length = (this._lastTimestep - this._firstTimestep) / this._timestepSize

    for (let i = 0; i < length; i++) {
      this.snapshots.push(SnapshotEntry.getEmtpyEntry())
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
