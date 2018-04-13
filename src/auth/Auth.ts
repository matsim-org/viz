import { Dictionary } from 'lodash'
import { IncomingMessage } from 'http'
import * as JWT from 'jwt-decode'

export enum AuthenticationState {
  NotAuthenticated,
  Requesting,
  Failed,
  Authenticated,
}

const authenticationRequest = {
  //endpoint: new URL('https://localhost:3000/authorize/'),
  scope: 'openid',
  response_type: 'id_token token',
  client_id: 'test-client-id',
  redirect_uri: 'http://localhost:8080/authentication',
  state: 'some random state',
  nonce: 'some nonce',
}

export default class Authentication {
  private idToken: string = ''
  private _subjectId: string = ''
  private _tokenExpiresAt: number = 0
  private _state: AuthenticationState = AuthenticationState.NotAuthenticated
  fileServerAccessToken: string = ''

  get state() {
    return this._state
  }

  constructor() {}

  requestAuthentication(): void {
    this._state = AuthenticationState.Requesting
    const parameters = new AuthRequest()
    const form = document.createElement('form')
    form.setAttribute('method', 'GET')
    form.setAttribute('action', parameters.endpoint.toString())

    for (let key in authenticationRequest) {
      let value = (authenticationRequest as any)[key]
      form.appendChild(this.createInput(key, value))
    }
    /*

    form.appendChild(this.createInput('scope', parameters.scope))
    form.appendChild(
      this.createInput('response_type', parameters.response_type)
    )
    form.appendChild(this.createInput('client_id', parameters.client_id))
    form.appendChild(this.createInput('redirect_uri', parameters.redirect_uri))
    form.appendChild(this.createInput('state', parameters.state))
    form.appendChild(this.createInput('nonce', parameters.nonce))
*/
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  handleAuthenticationResponse(fragment: string) {
    fragment = fragment.replace('#', '')
    let parameters = new URLSearchParams(fragment)

    try {
      this.idToken = parameters.get('id_token') as string
      this.handleIdToken(this.idToken)
      this.fileServerAccessToken = parameters.get('access_token') as string
      this._state = AuthenticationState.Authenticated
    } catch (error) {
      this._state = AuthenticationState.Failed
      this.idToken = ''
      this.fileServerAccessToken = ''
    }
  }

  handleFailedAuthenticationResponse(parameter: Dictionary<String>) {
    console.error(parameter)
  }

  isAuthenticated(): boolean {
    return this._state === AuthenticationState.Authenticated
  }

  private handleIdToken(token: string): void {
    let decoded = JWT(token) as any

    if (this.isValid(decoded)) {
      this._subjectId = decoded.sub
      this._tokenExpiresAt = decoded.exp
    } else {
      throw Error('invalid token')
    }
  }

  private isValid(decodedToken: any): boolean {
    let valid = true
    if (!decodedToken.sub || !(decodedToken.sub instanceof String)) {
      valid = false
    }
    if (!decodedToken.exp || !(decodedToken.exp instanceof Number)) {
      valid = false
    }
    if (!decodedToken.nonce || !(decodedToken.nonce instanceof String)) {
      valid = false
    }
    if (!decodedToken.iss || !(decodedToken.iss instanceof String)) {
      //this should also pinpoint the auth server address once deployed
      valid = false
    }

    //here should also be a validation of the signature, but that's another ticket

    return valid
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
