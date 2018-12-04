import Playback from '@/visualization/frame-animation/modell/Playback'
import Configuration from '../../../../../src/visualization/frame-animation/contracts/Configuration'

describe('Playback', () => {
  const timestepSize = 20
  const firstTimestep = 3
  const lastTimestep = 58
  let dataProviderMock
  let testObject

  beforeEach(() => {
    dataProviderMock = {
      hasSnapshot: (timestep, speedFactor) => {
        return true
      },
      getSnapshot: timestep => {
        return {
          time: timestep,
        }
      },
    }
    testObject = new Playback(
      dataProviderMock,
      new Configuration({
        accessToken: 'token',
        canvasId: 'id',
        dataUrl: 'url',
        vizId: 'id',
      })
    )

    // inject server config values
    testObject._firstTimestep = firstTimestep
    testObject._lastTimestep = lastTimestep
    testObject._timestepSize = timestepSize
  })

  it('should advance time according to current time and speedFactor', () => {
    const speedFactor = 0.75
    const currentTime = firstTimestep + 2 * timestepSize
    testObject._currentTime = currentTime
    testObject._currentTimestep = currentTime
    testObject.speedFactor = speedFactor

    testObject.advanceTime()

    expect(testObject.currentTime).toEqual(currentTime + timestepSize * speedFactor)
    expect(testObject.currentTimestep).toEqual(currentTime)
  })
  it('should advance time according to current time and speedFactor backwards', () => {
    const speedFactor = -0.75
    const currentTime = firstTimestep + 2 * timestepSize
    const currentTimestep = firstTimestep + 1 * timestepSize
    testObject._currentTime = currentTime
    testObject._currentTimestep = currentTimestep
    testObject.speedFactor = speedFactor

    testObject.advanceTime()

    expect(testObject.currentTime).toEqual(currentTime + timestepSize * speedFactor)
    expect(testObject.currentTimestep).toEqual(currentTimestep)
  })
  it('should advance timestep if time crosses timestep boundary', () => {
    const speedFactor = 1.5
    const currentTime = firstTimestep + 2 * timestepSize
    testObject._currentTime = currentTime
    testObject._currentTimestep = currentTime
    testObject.speedFactor = speedFactor

    testObject.advanceTime()

    expect(testObject.currentTime).toEqual(currentTime + timestepSize * speedFactor)
    expect(testObject.currentTimestep).toEqual(testObject.currentTime)
  })
  it('should advance timestep if time crosses timestep bondary backwards', () => {
    const speedFactor = -1.5
    const currentTime = firstTimestep + 2 * timestepSize
    testObject._currentTime = currentTime
    testObject._currentTimestep = currentTime
    testObject.speedFactor = speedFactor

    testObject.advanceTime()

    expect(testObject.currentTime).toEqual(currentTime + timestepSize * speedFactor)
    expect(testObject.currentTimestep).toEqual(testObject.currentTime)
  })
  it('should jump to first timestep if end of timeline is reached', () => {
    const speedFactor = 1.5
    testObject._currentTime = lastTimestep - 1 * timestepSize
    testObject._currentTimestep = lastTimestep - 1 * timestepSize
    testObject.speedFactor = speedFactor

    dataProviderMock.hasSnapshot = (timestep, speedFactor) => {
      return false
    }

    testObject.advanceTime()

    expect(testObject.currentTime).toEqual(firstTimestep)
    expect(testObject.currentTimestep).toEqual(firstTimestep)
  })
  it('should jump to last timestep if beginning of timeline is reached running backwards', () => {
    const speedFactor = -1.5
    testObject._currentTime = firstTimestep + 1 * timestepSize
    testObject._currentTimestep = firstTimestep + 1 * timestepSize
    testObject.speedFactor = speedFactor

    dataProviderMock.hasSnapshot = (timestep, speedFactor) => {
      return false
    }

    testObject.advanceTime()

    expect(testObject.currentTime).toEqual(lastTimestep)
    expect(testObject.currentTimestep).toEqual(lastTimestep)
  })
})
