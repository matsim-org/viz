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

interface EmptyBlock {
  start: number
  end: number
}

enum SnapshotEntryStatus {
  NOT_LOADED,
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

  public static createLoadedEntry(snapshot: Snapshot) {
    return new SnapshotEntry(SnapshotEntryStatus.LOADED, snapshot)
  }

  public isLoaded() {
    return this._status === SnapshotEntryStatus.LOADED
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
  private emptyBlocks: EmptyBlock[] = []

  private minCacheSize = 500
  private fetchSize = 100
  private dataFetcher: DataFetcher
  private _isFetching: boolean = false

  get firstTimestep() {
    return this._firstTimestep
  }

  get lastTimestep() {
    return this._lastTimestep
  }

  get timestepSize() {
    return this._timestepSize
  }

  get isFetching() {
    return this._isFetching
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

  public async ensureSufficientCaching(currentTimestep: number) {
    if (this._isFetching || this.emptyBlocks.length === 0) {
      return
    }
    const blockIndex = this.emptyBlocks.findIndex(block => {
      return block.end >= currentTimestep && block.start <= currentTimestep + this.minCacheSize * this.timestepSize
    })

    if (blockIndex >= 0) {
      await this.fetchSnapshots(currentTimestep, blockIndex)
    }
  }

  private async fetchSnapshots(currentTimestep: number, emptyBlockIndex: number) {
    const emptyBlock = this.emptyBlocks[emptyBlockIndex]
    const fromTimestep = Math.max(emptyBlock.start, currentTimestep)
    const toTimestep = Math.min(emptyBlock.end, fromTimestep + this.fetchSize * this.timestepSize)
    const parameters: SnapshotRequestParams = {
      fromTimestep: fromTimestep,
      size: (toTimestep - fromTimestep) / this.timestepSize,
      speedFactor: 1.0,
    }

    this._isFetching = true
    const snapshots = await this.dataFetcher.fetchSnapshots(parameters)
    this.addSnapshots(snapshots)

    this.updateEmtpyBlocks(fromTimestep, toTimestep, emptyBlock, emptyBlockIndex)
    this._isFetching = false
  }

  private updateEmtpyBlocks(fromTimestep: number, toTimestep: number, emptyBlock: EmptyBlock, emptyBlockIndex: number) {
    // remove the old block and insert two new ones
    if (fromTimestep > emptyBlock.start && toTimestep < emptyBlock.end) {
      const leftBlock = { start: emptyBlock.start, end: fromTimestep - this.timestepSize }
      const rightBlock = { start: toTimestep + this.timestepSize, end: emptyBlock.end }
      this.emptyBlocks.splice(emptyBlockIndex, 1, leftBlock, rightBlock)
    } // change start bounds of emtpy block
    else if (fromTimestep <= emptyBlock.start && toTimestep < emptyBlock.end) {
      emptyBlock.start = toTimestep
    } // change end bounds of empty block
    else if (fromTimestep > emptyBlock.start && toTimestep >= emptyBlock.end) {
      emptyBlock.end = fromTimestep
    } // the whole block has been loaded. Remove it
    else {
      this.emptyBlocks.splice(emptyBlockIndex, 1)
    }
  }

  private initEmptySnapshots() {
    const length = (this._lastTimestep - this._firstTimestep) / this._timestepSize + 1

    for (let i = 0; i < length; i++) {
      this.snapshots.push(SnapshotEntry.getEmtpyEntry())
    }

    this.emptyBlocks.push({ start: this.firstTimestep, end: this.lastTimestep })
  }

  private isWithinBounds(timestep: number) {
    return timestep > this._firstTimestep - 0.001 && timestep < this._lastTimestep + 0.001
  }

  private getIndexForTimestep(timestep: number) {
    if (!this.isWithinBounds(timestep)) throw new Error('invalid timestep')
    const index = (timestep - this._firstTimestep) / this._timestepSize
    if (index < 0) return 0
    return index
  }

  private getEntry(timestep: number) {
    const index = this.getIndexForTimestep(timestep)
    return this.snapshots[index]
  }
}
