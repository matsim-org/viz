import { Dictionary } from 'lodash'
import { IncomingMessage } from 'http'

export default class Authentication {
  idToken: String = ''
  fileServerAccessToken: String = ''
  _isAuthenticated: boolean = false

  constructor() {}

  requestAuthorization(): void {
    const parameters = new AuthRequest()
    const form = document.createElement('form')
    form.setAttribute('method', 'GET')
    form.setAttribute('action', parameters.endpoint.toString())
    form.appendChild(this.createInput('scope', parameters.scope))
    form.appendChild(
      this.createInput('response_type', parameters.response_type)
    )
    form.appendChild(this.createInput('client_id', parameters.client_id))
    form.appendChild(this.createInput('redirect_uri', parameters.redirect_uri))
    form.appendChild(this.createInput('state', parameters.state))
    form.appendChild(this.createInput('nonce', parameters.nonce))

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  handleAuthorizationResponse(fragment: string) {
    console.log(fragment)

    fragment = fragment.replace('#', '')
    let parameters = new URLSearchParams(fragment)
    this.idToken = parameters.get('id_token') as string
    this.fileServerAccessToken = parameters.get('access_token') as string
    this._isAuthenticated = true
  }

  handleFailedAuthorizationResponse(parameter: Dictionary<String>) {
    console.error(parameter)
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated
  }

  private createInput(key: string, value: string) {
    const input = document.createElement('input')
    input.setAttribute('type', 'hidden')
    input.setAttribute('name', key)
    input.setAttribute('value', value)
    return input
  }
}

class AuthRequest {
  endpoint: URL = new URL('https://localhost:3000/authorize/')
  scope: string = 'openid'
  response_type: string = 'id_token token'
  client_id: string = 'test-client-id'
  redirect_uri: string = 'http://localhost:8080/authentication'
  state: string = 'some random state'
  nonce: string = 'some nonce'

  constructor() {}

  toURLSearchParams(): URLSearchParams {
    let result = new URLSearchParams()
    result.append('scope', this.scope)
    result.append('response_type', this.response_type)
    result.append('client_id', this.client_id)
    result.append('redirect_uri', this.redirect_uri)
    result.append('state', this.state)
    result.append('nonce', this.nonce)
    return result
  }
}
