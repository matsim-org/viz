import fetchMock from 'fetch-mock'
import Config from '@/config/Config'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'

describe('AuthenticationStore', () => {
  beforeAll(() => {})

  afterEach(() => {
    fetchMock.reset()
  })

  it('should delete all login information on logout and call auth-server logout', async () => {
    fetchMock.post(Config.authServer + '/logout', 202)

    const authStore = new AuthenticationStore()
    authStore.authState = {
      idToken: 'bla',
      accessToken: 'blabla',
      status: AuthenticationStatus.Authenticated,
      errorMessage: '',
    }

    authStore.logOut()

    expect(fetchMock.lastUrl()).toBe(Config.authServer + '/logout')
    expect(authStore.state.idToken).toEqual({
      exp: 0,
      iat: 0,
      iss: new URL('https://issuer.url'),
      jti: '',
      nonce: '',
      sub: '',
    })
    expect(authStore.state.accessToken).toBe('')
    expect(authStore.state.status).toBe(AuthenticationStatus.NotAuthenticated)
    expect(sessionStorage.setItem).toHaveBeenCalledTimes(1)
  })
})
