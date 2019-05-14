import EventsAnimationAPI, { ServerConfiguration } from './EventsAnimationAPI'
import LinkTripReader, { LinkTripAsFloat32 } from './reader/LinkTripReader'
import { stat } from 'fs'

enum BlockStatus {
  Loaded,
  NotLoaded,
}

const emtpyLinkTrips: LinkTripAsFloat32 = {
  earliestTime: 0,
  fromPosition: new Float32Array(0),
  fromTime: new Float32Array(0),
  latestTime: 0,
  toPosition: new Float32Array(0),
  toTime: new Float32Array(0),
}

class Block {
  private static emptyBlock = new Block(BlockStatus.NotLoaded, emtpyLinkTrips)

  private data: LinkTripAsFloat32
  private status: BlockStatus

  public get Data() {
    return this.data
  }

  private constructor(status: BlockStatus, data: LinkTripAsFloat32) {
    this.data = data
    this.status = status
  }

  public static getEmptyBlock() {
    return Block.emptyBlock
  }

  public static createBlock(data: LinkTripAsFloat32) {
    return new Block(BlockStatus.Loaded, data)
  }
}

export default class LinkTripsStore {
  private static fetchSize = 10000

  private api: EventsAnimationAPI
  private blocks: Block[] = []
  private firstTimestep: number
  private lastTimestep: number

  constructor(api: EventsAnimationAPI, config: ServerConfiguration) {
    this.api = api
    this.firstTimestep = config.firstTimestep
    this.lastTimestep = config.lastTimestep
    this.createBlocks(config)
    this.startFetching(config)
  }

  public getLinkTrip(time: number) {
    const index = this.getIndex(time)
    return this.blocks[index].Data
  }

  public getNextBlockBoundary(time: number) {
    return this.getIndex(time) * LinkTripsStore.fetchSize
  }

  private createBlocks(config: ServerConfiguration) {
    const length = (config.lastTimestep - config.firstTimestep) / LinkTripsStore.fetchSize + 1

    for (let i = 0; i < length; i++) {
      this.blocks.push(Block.getEmptyBlock())
    }
  }

  private async startFetching(config: ServerConfiguration) {
    // fetch the whole scenario
    let fromTime = config.firstTimestep
    while (fromTime < config.lastTimestep) {
      const linkTrips = await this.api.fetchLinkTrips(fromTime, fromTime + LinkTripsStore.fetchSize)

      const start = Date.now()
      const parsedLinkTrips = new LinkTripReader(linkTrips).parse()
      const end = Date.now()
      console.log('parsed ' + parsedLinkTrips.toTime.length + ' link trips in ' + (end - start) + 'ms')
      const index = this.getIndex(fromTime)
      this.blocks[index] = Block.createBlock(parsedLinkTrips)

      // set up next fetch
      fromTime += LinkTripsStore.fetchSize + 1
    }
  }

  private getIndex(timestep: number) {
    return Math.floor((timestep - this.firstTimestep) / LinkTripsStore.fetchSize)
  }
}
