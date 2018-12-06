import fetchMock from 'fetch-mock'
import sinon from 'sinon'
import Config from '@/config/Config'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'

describe('AuthenticationStore', () => {
  beforeAll(() => {
    global.sessionStorage = {
      getItem: key => {
        return undefined
      },
      setItem: (key, value) => {
        return undefined
      },
    }
  })
  afterEach(() => {
    fetchMock.reset()
  })

  it('should delete all login information on logout and call auth-server logout', async () => {
    fetchMock.post(Config.authServer + '/logout', 202)
    const getItemSpy = sinon.spy(global.sessionStorage, 'getItem')
    const setItemSpy = sinon.spy(global.sessionStorage, 'setItem')
    const authStore = new AuthenticationStore()
    authStore.authState = {
      idToken: 'bla',
      accessToken: 'blabla',
      status: AuthenticationStatus.Authenticated,
      errorMessage: '',
    }

    authStore.logOut()

    expect(fetchMock.lastUrl()).toBe(Config.authServer + '/logout')
    expect(authStore.state.idToken).toEqual({})
    expect(authStore.state.accessToken).toBe('')
    expect(authStore.state.status).toBe(AuthenticationStatus.NotAuthenticated)
    expect(setItemSpy.calledOnce).toBeTruthy()
  })
})
