import { Dictionary } from 'lodash'
import { IncomingMessage } from 'http'
import * as JWT from 'jwt-decode'

export enum AuthenticationState {
  NotAuthenticated,
  Requesting,
  Failed,
  Authenticated,
}

const AuthenticationResponse = {
  idToken: 'id_token',
  accessToken: 'access_token',
  scope: 'scope',
  state: 'state',
  nonce: 'nonce',
}

const ErrorCodes = {
  invalideRequest: 'invalid_request',
}

const ErrorResponse = {
  error: 'error',
  description: 'error_description',
}

export default class Authentication {
  private idToken: string = ''
  private _subjectId: string = ''
  private _tokenExpiresAt: number = 0
  private _state: AuthenticationState = AuthenticationState.NotAuthenticated
  private _errorMessage: string = ''
  fileServerAccessToken: string = ''

  get state() {
    return this._state
  }

  get errorMessage() {
    return this._errorMessage
  }

  constructor() {}

  requestAuthentication(): void {
    this._state = AuthenticationState.Requesting
    const authenticationRequest = this.createAuthRequest()
    const form = document.createElement('form')
    form.setAttribute('method', 'GET')
    form.setAttribute('action', 'https://localhost:3000/authorize/')

    for (let key in authenticationRequest) {
      let value = (authenticationRequest as any)[key]
      form.appendChild(this.createInput(key, value))
    }

    this.persist(AuthenticationResponse.state, authenticationRequest.state)
    this.persist(AuthenticationResponse.nonce, authenticationRequest.nonce)
    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  handleAuthenticationResponse(fragment: string) {
    fragment = fragment.replace('#', '')
    let parameters = new URLSearchParams(fragment)

    if (!this.isValidResponse(parameters)) {
      this.handleInvalidAuthenticationResponse(
        'response from auth server was not valid'
      )
      return
    }

    try {
      this.idToken = parameters.get(AuthenticationResponse.idToken) as string
      this.handleIdToken(this.idToken)
      this.fileServerAccessToken = parameters.get(
        AuthenticationResponse.accessToken
      ) as string
      this._state = AuthenticationState.Authenticated
    } catch (error) {
      this.handleInvalidAuthenticationResponse('could not validate token')
      return
    }
  }

  handleFailedAuthenticationResponse(parameter: { [key: string]: string }) {
    this._state = AuthenticationState.Failed
    const error = parameter[ErrorResponse.error]
    if (error === ErrorCodes.invalideRequest) {
      console.error(parameter[ErrorResponse.description])
      this._errorMessage = parameter[ErrorResponse.description]
    } else {
      console.error('Unknown error code: ' + error)
    }
  }

  isAuthenticated(): boolean {
    return this._state === AuthenticationState.Authenticated
  }

  resetState(): void {
    this._state = AuthenticationState.NotAuthenticated
  }

  private handleIdToken(token: string): void {
    let decoded = JWT(token) as any

    if (this.isValidToken(decoded)) {
      this._subjectId = decoded.sub
      this._tokenExpiresAt = decoded.exp
    } else {
      throw Error('invalid token')
    }
  }

  private isValidResponse(parameters: URLSearchParams): boolean {
    let valid = true

    const state = parameters.get(AuthenticationResponse.state)
    if (!state || state !== this.load(AuthenticationResponse.state)) {
      valid = false
    }
    if (!parameters.get(AuthenticationResponse.idToken)) {
      valid = false
    }
    if (!parameters.get(AuthenticationResponse.accessToken)) {
      valid = false
    }
    return valid
  }

  private isValidToken(decodedToken: any): boolean {
    let valid = true
    if (!decodedToken.sub) {
      valid = false
    }
    if (!decodedToken.exp) {
      valid = false
    }
    if (
      !decodedToken.nonce ||
      decodedToken.nonce !== this.load(AuthenticationResponse.nonce)
    ) {
      valid = false
    }
    if (!decodedToken.iss) {
      //this should also pinpoint the auth server address once deployed
      valid = false
    }

    //here should also be a validation of the signature, but that's another ticket
    return valid
  }

  private handleInvalidAuthenticationResponse(message: string) {
    this._state = AuthenticationState.Failed
    this.idToken = ''
    this.fileServerAccessToken = ''
    this._errorMessage = message
  }

  private createInput(key: string, value: string) {
    const input = document.createElement('input')
    input.setAttribute('type', 'hidden')
    input.setAttribute('name', key)
    input.setAttribute('value', value)
    return input
  }

  private createAuthRequest() {
    return {
      scope: 'openid',
      response_type: 'id_token token',
      client_id: 'test-client-id',
      redirect_uri: 'http://localhost:8080/authentication',
      state: this.randomString(),
      nonce: this.randomString(),
    }
  }

  private randomString() {
    let randomValues = new Int32Array(5)
    window.crypto.getRandomValues(randomValues)
    let result: string = ''
    randomValues.forEach(value => (result += value.toString()))
    return result
  }

  private persist(key: string, value: string): void {
    sessionStorage.setItem('Authentication-' + key, value)
  }

  private load(key: string): string | null {
    return sessionStorage.getItem('Authentication-' + key)
  }
}
