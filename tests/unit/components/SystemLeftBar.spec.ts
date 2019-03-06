import SystemLeftBar from '@/components/SystemLeftBar.vue'
import AuthenticationStore, { AuthenticationStatus } from '@/auth/AuthenticationStore'

describe('StartPage', () => {
  it('should be instanceable', () => {
    const authStoreMock = mockAuthStore()
    const slb = new SystemLeftBar({ props: { authStore: authStoreMock as any } })
    expect(slb).toBeInstanceOf(SystemLeftBar)
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
