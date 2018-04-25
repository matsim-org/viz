import AuthenticationStore from './Authentication'

export default class AuthenticatedRequest {
  public static async fetch(endpoint: string, options: RequestInit): Promise<Response> {
    options.headers = AuthenticatedRequest.appendAuthorizationHeader(options.headers)

    let response = await fetch(endpoint, options)

    if (response.status === 401) {
      //token was invalid try to request a new one
      AuthenticationStore.resetState()
      AuthenticationStore.requestAuthentication()
    }

    return response
  }

  private static appendAuthorizationHeader(init: HeadersInit | undefined): Headers {
    let headers = new Headers(init)
    headers.append('Authorization', 'Bearer ' + AuthenticationStore.state.accessToken)
    return headers
  }
}
