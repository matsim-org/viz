import fetchMock from 'fetch-mock'
import FrameAnimationAPI, { Progress } from '@/visualization/frame-animation/communication/FrameAnimationAPI'

describe('FrameAnimationAPI', () => {
  const endpoint = 'https://endpoint.com'
  const vizId = 'viz-id'
  const accessToken = 'access_token'

  afterEach(() => {
    fetchMock.reset()
  })

  it('fetches json from an endpoint and supplies an auth header', async () => {
    const expectedResult = { some: 'configuration' }
    fetchMock.get('*', expectedResult)

    let api = new FrameAnimationAPI(endpoint, vizId, accessToken)

    let result = await api.fetchConfiguration()

    expect(result).toEqual(expectedResult)
    const authHeader = fetchMock.lastOptions().headers.Authorization
    const corsOption = fetchMock.lastOptions().mode
    expect(authHeader).toBeDefined()
    expect(authHeader).toEqual('Bearer ' + accessToken)
    expect(corsOption).toBeDefined()
    expect(corsOption).toEqual('cors')
  })
  it('fetches arrayBuffer from an endpoint', async () => {
    const expectedResult = new ArrayBuffer(10)
    fetchMock.get('*', expectedResult, { sendAsJson: false })
    let api = new FrameAnimationAPI(endpoint, vizId, accessToken)

    let result = await api.fetchNetwork()

    expect(result).toBeInstanceOf(ArrayBuffer)
    expect(result.byteLength).toEqual(expectedResult.byteLength)
  })
  it('fetches from an endpoint and throw error if status is 401', async () => {
    fetchMock.get('*', 401)
    let api = new FrameAnimationAPI(endpoint, vizId, accessToken)

    try {
      let result = await api.fetchConfiguration()

      // fail test if we get here
      console.error('expected exception but got result')
      console.log(result)
      expect(false).toBeTruthy()
    } catch (error) {
      expect(error.message).toEqual('Unauthorized')
    }
  })
  it('fetches from an endpoint and throws an error with the result text', async () => {
    const errorMessage = 'error-message'
    fetchMock.get('*', {
      body: errorMessage,
      status: 404,
    })
    let api = new FrameAnimationAPI(endpoint, vizId, accessToken)

    try {
      let result = await api.fetchConfiguration()
      // fail test if we get here
      console.error('expected exception but got result')
      console.log(result)
      expect(false).toBeTruthy()
    } catch (error) {
      expect(error.message).toEqual(errorMessage)
    }
  })
})
