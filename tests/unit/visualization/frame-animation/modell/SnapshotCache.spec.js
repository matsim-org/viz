import SnapshotCache from '@/visualization/frame-animation/modell/SnapshotCache'

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
    timestepSize: 3,
  }
}
describe('SnapshotCache', () => {
  let testObject
  let testConfig

  beforeEach(() => {
    testConfig = createServerConfig()
    testObject = new SnapshotCache(testConfig, new DummyDataFetcher())
  })

  describe('#initialization', () => {
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
  })
  describe('#addSnapshot', () => {
    it('should add a snapshot at first, last and random position', () => {
      const firstSnapshot = { time: testConfig.firstTimestep }
      const randomSnapshot = { time: testConfig.firstTimestep + 3 }
      const lastSnapshot = { time: testConfig.lastTimestep }

      testObject.addSnapshot(firstSnapshot)
      testObject.addSnapshot(randomSnapshot)
      testObject.addSnapshot(lastSnapshot)

      expect(testObject.getSnapshot(firstSnapshot.time)).toBe(firstSnapshot)
      expect(testObject.getSnapshot(randomSnapshot.time)).toBe(randomSnapshot)
      expect(testObject.getSnapshot(lastSnapshot.time)).toBe(lastSnapshot)
    })
    it('should throw if snapshot timestep is not within bounds', () => {
      expect(() => testObject.addSnapshot({ time: testConfig.firstTimestep - 1 })).toThrow()
      expect(() => testObject.addSnapshot({ time: testConfig.lastTimestep + 1 })).toThrow()
    })
  })
  describe('#addSnapshots', () => {
    it('should add all snapshots', () => {
      let firstSnapshot = { time: testConfig.firstTimestep + 5 }
      let secondSnapshot = { time: testConfig.firstTimestep + 9 }
      let thirdSnapshot = { time: testConfig.lastTimestep - 8 }

      testObject.addSnapshots([firstSnapshot, secondSnapshot, thirdSnapshot])

      expect(testObject.getSnapshot(firstSnapshot.time)).toBe(firstSnapshot)
      expect(testObject.getSnapshot(secondSnapshot.time)).toBe(secondSnapshot)
      expect(testObject.getSnapshot(thirdSnapshot.time)).toBe(thirdSnapshot)
    })
  })
  describe('#getSnapshot', () => {
    it('should retreive the correct snapshot at first, last and random position', () => {
      const firstSnapshot = { time: testConfig.firstTimestep }
      const randomSnapshot = { time: testConfig.firstTimestep + 3 }
      const lastSnapshot = { time: testConfig.lastTimestep }
      testObject.addSnapshots([firstSnapshot, randomSnapshot, lastSnapshot])

      expect(testObject.getSnapshot(firstSnapshot.time)).toBe(firstSnapshot)
      expect(testObject.getSnapshot(randomSnapshot.time)).toBe(randomSnapshot)
      expect(testObject.getSnapshot(lastSnapshot.time)).toBe(lastSnapshot)
    })
    it('should throw if requested timestep is out of bounds', () => {
      expect(() => testObject.getSnapshot(testConfig.firstTimestep - 1)).toThrow()
      expect(() => cache.getSnapshot(config.lastTimestep + 1)).toThrow()
    })
  })
  describe('#ensureSufficientCaching', () => {
    it('should load new snapshots if empty block ahead', () => {
      console.log('Think of a smart way to test this...')
    })
  })
})
