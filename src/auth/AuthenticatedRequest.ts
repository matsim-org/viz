import AuthenticationStore from '@/auth/AuthenticationStore'

export default class AuthenticatedRequest {
  private authStore: AuthenticationStore

  constructor(authStore: AuthenticationStore) {
    this.authStore = authStore
  }

  public async fetch(endpoint: string, options: RequestInit): Promise<Response> {
    options.headers = this.appendAuthorizationHeader(options.headers)
    const response = await fetch(endpoint, options)

    if (response.status === 401) {
      // token was invalid try to request a new one
      this.authStore.resetState()
      this.authStore.requestAuthentication()
    }

    return response
  }

  private appendAuthorizationHeader(init: HeadersInit | undefined): Headers {
    const headers = new Headers(init)
    headers.append('Authorization', 'Bearer ' + this.authStore.state.accessToken)
    return headers
  }
}
