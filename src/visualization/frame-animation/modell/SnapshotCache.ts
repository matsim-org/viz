import { ServerConfiguration } from '@/visualization/frame-animation/communication/FrameAnimationAPI'
import { Snapshot } from '@/visualization/frame-animation/contracts/SnapshotReader'

// rename this into something meaningfull
interface SnapshotEntry {
  isLoaded: boolean
  data: Snapshot
}

export default class SnapshotCache {
  private firstTimestep: number
  private lastTimestep: number
  private timestepSize: number

  private snapshots: SnapshotEntry[]

  constructor(config: ServerConfiguration) {
    this.firstTimestep = config.firstTimestep
    this.lastTimestep = config.lastTimestep
    this.timestepSize = config.timestepSize

    const lenth = (this.lastTimestep - this.firstTimestep) / this.timestepSize
    this.snapshots = new Array<SnapshotEntry>(length)
  }
}
