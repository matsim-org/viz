import fetchMock from 'fetch-mock'
import EventsAnimationAPI, { ServerConfiguration } from '@/visualization/events-animation/EventsAnimationAPI'
import { Progress } from '@/visualization/frame-animation/communication/FrameAnimationAPI'

const endpoint = new URL('https://some.url')
const vizId = 'some-viz-id'
const token = 'some-access-token'

describe('EventsAnimationAPI', () => {
  afterEach(() => {
    fetchMock.reset()
  })
  it('fetches configuration from the configuration endpoint', async () => {
    const expectedResult = {
      left: 0,
      right: 10,
      top: 0,
      bottom: 10,
      firstTimestep: 1,
      lastTimestep: 10,
      progress: Progress.Processing,
    }
    fetchMock.get(new URL(vizId + '/configuration', endpoint).toString(), expectedResult)

    const api = new EventsAnimationAPI(endpoint, vizId, token)
    const result = await api.fetchConfiguration()

    expect(result).toEqual(expectedResult)
    validateFetchOptions(fetchMock.lastOptions())
  })
  it('fetches network data from the network endpoint', async () => {
    const expectedResult = new ArrayBuffer([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    fetchMock.get(new URL(vizId + '/network', endpoint).toString(), expectedResult)

    const api = new EventsAnimationAPI(endpoint, vizId, token)
    const result = await api.fetchNetwork()

    expect(result).toEqual(expectedResult)
    validateFetchOptions(fetchMock.lastOptions())
  })
})

function validateFetchOptions(options) {
  expect(options.headers.Authorization).toEqual('Bearer ' + token)
  expect(options.mode).toEqual('cors')
}
