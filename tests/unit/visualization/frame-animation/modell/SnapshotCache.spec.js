import SnapshotCache from '@/visualization/frame-animation/modell/SnapshotCache'
import DataFetcher from '@/visualization/frame-animation/modell/background/DataFetcher'
import { Rectangle } from '@/visualization/frame-animation/contracts/Rectangle'
import { Progress } from '@/visualization/frame-animation/communication/FrameAnimationAPI'

class DummyDataFetcher {
  constructor() {}
  async fetchSnapshots(params) {
    await setTimeout(() => {}, 0)
  }
}

function createServerConfig() {
  return {
    firstTimestep: 13,
    lastTimestep: 69,
    timestepSize: 4,
  }
}
describe('SnapshotCache', () => {
  it('should initialize its state', () => {
    const config = createServerConfig()
    const cache = new SnapshotCache(config, new DummyDataFetcher())

    expect(cache.firstTimestep).toEqual(config.firstTimestep)
    expect(cache.lastTimestep).toEqual(config.lastTimestep)
    expect(cache.timestepSize).toEqual(config.timestepSize)
    expect(cache.getSnapshotSize(config.firstTimestep)).toEqual(0)
    expect(cache.getSnapshotSize(config.lastTimestep)).toEqual(0)
  })

  it('should throw an error if requested timestep smaller than first timestep', () => {
    const config = createServerConfig()
    const cache = new SnapshotCache(config, new DummyDataFetcher())

    expect(() => cache.getSnapshot(config.firstTimestep - 1)).toThrow()
  })
  it('should throw an error if requested timestep greater than last timestep', () => {
    const config = createServerConfig()
    const cache = new SnapshotCache(config, new DummyDataFetcher())

    expect(() => cache.getSnapshot(config.lastTimestep + 1)).toThrow()
  })
})
