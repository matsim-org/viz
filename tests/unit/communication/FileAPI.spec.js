import fetchMock from 'fetch-mock'
import nodeFetch, { HeaderInit, Headers } from 'node-fetch'
import FileAPI from '@/communication/FileAPI'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'

describe('FileAPI', () => {
  beforeAll(() => {
    // override the global Headers and HeadersInit type with node-fetch types, since it is not set by default in headless unit tests
    global.HeadersInit = HeaderInit
    global.Headers = Headers
  })

  afterEach(() => {
    fetchMock.reset()
  })

  it('supplies a Bearer token and uses cors mode on each request', async () => {
    fetchMock.delete('*', 204)
    const fileServerUrl = 'https://some.uri'
    const projectId = 'some-project-id'
    const authStoreMock = mockAuthStore()
    const fileApi = new FileAPI(authStoreMock, fileServerUrl)

    // use delete project as an example
    await fileApi.deleteProject(projectId)

    const authHeader = fetchMock.lastOptions().headers.get('Authorization')
    const corsOptions = fetchMock.lastOptions().mode
    expect(authHeader).toBeDefined()
    expect(authHeader).toEqual('Bearer ' + authStoreMock.state.accessToken)
    expect(corsOptions).toBeDefined()
    expect(corsOptions).toEqual('cors')
    expect(fetchMock.lastUrl()).toEqual(`${fileServerUrl}/projects/${projectId}`)
  })
  it('deletes visualizations from the correct endpoint', async () => {
    fetchMock.delete('*', 204)
    const fileServerUrl = 'https://some.url'
    const projectId = 'project-id'
    const vizId = 'viz-id'
    const authStoreMock = mockAuthStore()
    const fileApi = new FileAPI(authStoreMock, fileServerUrl)

    await fileApi.deleteVisualization(projectId, vizId)

    expect(fetchMock.lastUrl()).toEqual(`${fileServerUrl}/projects/${projectId}/visualizations/${vizId}`)
  })
  it('deletes projects from the correct endpoin', async () => {
    fetchMock.delete('*', 204)
    const fileServerUrl = 'https://some.uri'
    const projectId = 'some-project-id'
    const authStoreMock = mockAuthStore()
    const fileApi = new FileAPI(authStoreMock, fileServerUrl)

    await fileApi.deleteProject(projectId)

    expect(fetchMock.lastUrl()).toEqual(`${fileServerUrl}/projects/${projectId}`)
  })
})

function mockAuthStore() {
  return {
    get state() {
      return {
        idToken: 'token',
        accessToken: 'some-access-token',
        status: AuthenticationStatus.Authenticated,
        errorMessage: '',
      }
    },
  }
}
