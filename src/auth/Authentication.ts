import { Dictionary } from 'lodash'
import { IncomingMessage } from 'http'
import * as JWT from 'jwt-decode'
import { Method } from '../communication/Constants'

export enum AuthenticationStatus {
  NotAuthenticated,
  Requesting,
  Failed,
  Authenticated,
}

export interface AuthenticationState {
  idToken: any
  accessToken: string
  status: AuthenticationStatus
  errorMessage: string
}

class AuthenticationStore {
  private authState: AuthenticationState

  private static get STATE_STORAGE_KEY(): string {
    return 'Authentication-state'
  }

  private static get TMP_STORAGE_KEY(): string {
    return 'Authentication-tmp-variables'
  }

  get state(): AuthenticationState {
    return this.authState
  }

  constructor() {
    this.authState = this.initializeState()
  }

  private initializeState(): AuthenticationState {
    let loaded = this.loadState()
    if (!loaded) loaded = this.createDefaultState()

    return loaded
  }

  private createDefaultState(): AuthenticationState {
    return {
      idToken: {},
      accessToken: '',
      status: AuthenticationStatus.NotAuthenticated,
      errorMessage: '',
    }
  }

  requestAuthentication(): void {
    this.authState.status = AuthenticationStatus.Requesting

    const request = new AuthenticationRequest()
    AuthenticationRequest.persistVariables(request)
    this.persistState()
    request.submit()
  }

  handleAuthenticationResponse(fragment: string) {
    fragment = fragment.replace('#', '')
    const parameters = new URLSearchParams(fragment)
    const requestVars = AuthenticationRequest.loadVariablesAndDelete()

    try {
      const response = new AuthenticationResponse(parameters, requestVars)
      this.resetState()
      this.authState.accessToken = response.accessToken
      this.authState.idToken = response.idToken
      this.authState.status = AuthenticationStatus.Authenticated
    } catch (error) {
      this.authState.status = AuthenticationStatus.Failed
      this.authState.errorMessage = error.message
    }
    this.persistState()
  }

  handleFailedAuthenticationResponse(parameters: { [key: string]: string }) {
    const response = new ErrorResponse(parameters)
    console.error('authentication failed. error: ' + response.error + ' description: ' + response.description)
    this.setToStateToFailed(response.description)
  }

  resetState(): void {
    this.authState.status = AuthenticationStatus.NotAuthenticated
    this.authState.idToken = {}
    this.authState.accessToken = ''
    this.authState.errorMessage = ''
  }

  private setToStateToFailed(message: string): void {
    this.resetState()
    this.authState.status = AuthenticationStatus.Failed
    this.authState.errorMessage = message
  }

  private persistState(): void {
    sessionStorage.setItem(AuthenticationStore.STATE_STORAGE_KEY, JSON.stringify(this.authState))
  }

  private loadState(): AuthenticationState | null {
    let state = sessionStorage.getItem(AuthenticationStore.STATE_STORAGE_KEY)
    if (state) return JSON.parse(state) as AuthenticationState
    return null
  }
}

interface AuthenticationRequestVars {
  state: string
  nonce: string
}

class AuthenticationRequest {
  private static get TMP_STORAGE_KEY(): string {
    return 'Authentication-Request-variables'
  }

  private request: any
  private endpoint: string = 'https://cnode00.vsp.tu-berlin.de:3000/authorize/'

  get stateVariable(): string {
    return this.request.state
  }
  get nonceVariable(): string {
    return this.request.nonce
  }

  constructor() {
    this.request = {
      scope: 'openid',
      response_type: 'id_token token',
      client_id: 'matsim-viz-local-client-id',
      redirect_uri: 'http://localhost:8080/authentication',
      state: this.randomString(),
      nonce: this.randomString(),
    }
  }

  public submit(): void {
    const form = document.createElement('form')
    form.setAttribute('method', Method.GET)
    form.setAttribute('action', this.endpoint)

    for (let key in this.request) {
      let value = (this.request as any)[key]
      form.appendChild(this.createInput(key, value))
    }

    document.body.appendChild(form)
    form.submit()
    document.body.removeChild(form)
  }

  public static persistVariables(request: AuthenticationRequest): void {
    let toPersist = {
      state: request.stateVariable,
      nonce: request.nonceVariable,
    }
    sessionStorage.setItem(AuthenticationRequest.TMP_STORAGE_KEY, JSON.stringify(toPersist))
  }

  public static loadVariablesAndDelete(): AuthenticationRequestVars {
    let loaded = sessionStorage.getItem(AuthenticationRequest.TMP_STORAGE_KEY)
    if (loaded) {
      sessionStorage.removeItem(AuthenticationRequest.TMP_STORAGE_KEY)
      return JSON.parse(loaded) as AuthenticationRequestVars
    } else {
      return {
        state: '',
        nonce: '',
      }
    }
  }

  private createInput(key: string, value: string): HTMLInputElement {
    const input = document.createElement('input')
    input.setAttribute('type', 'hidden')
    input.setAttribute('name', key)
    input.setAttribute('value', value)
    return input
  }

  private randomString(): string {
    let randomValues = new Int32Array(5)
    window.crypto.getRandomValues(randomValues)
    let result: string = ''
    randomValues.forEach(value => (result += value.toString()))
    return result
  }
}

class AuthenticationResponse {
  private static get ID_TOKEN(): string {
    return 'id_token'
  }

  private static get ACCESS_TOKEN(): string {
    return 'access_token'
  }

  private static get SCOPE(): string {
    return 'scope'
  }

  private static get STATE(): string {
    return 'state'
  }

  private static get NONCE(): string {
    return 'nonce'
  }

  private _idToken: any = {}
  private _accessToken: string = ''

  get idToken(): any {
    return this._idToken
  }

  get accessToken(): string {
    return this._accessToken
  }

  constructor(params: URLSearchParams, requestVars: AuthenticationRequestVars) {
    this.parseResponse(params, requestVars)
  }

  private parseResponse(params: URLSearchParams, requestVars: AuthenticationRequestVars): void {
    if (!this.isValidResponse(params, requestVars.state)) {
      throw new Error('received invalid authentication response')
    }

    const idToken = params.get(AuthenticationResponse.ID_TOKEN) as string
    const decodedToken = JWT(idToken) as any

    if (!this.isValidToken(decodedToken, requestVars.nonce)) {
      throw new Error('received invalid token!')
    }

    this._idToken = decodedToken
    this._accessToken = params.get(AuthenticationResponse.ACCESS_TOKEN) as string
  }

  private isValidResponse(params: URLSearchParams, persistedState: string): boolean {
    let valid = true

    const state = params.get(AuthenticationResponse.STATE)
    if (!state || state !== persistedState) {
      valid = false
    }
    if (!params.get(AuthenticationResponse.ID_TOKEN)) {
      valid = false
    }
    if (!params.get(AuthenticationResponse.ACCESS_TOKEN)) {
      valid = false
    }
    return valid
  }

  private isValidToken(decodedToken: any, nonce: string): boolean {
    let valid = true
    if (!decodedToken.sub) {
      valid = false
    }
    if (!decodedToken.exp) {
      valid = false
    }
    if (!decodedToken.nonce || decodedToken.nonce !== nonce) {
      valid = false
    }
    if (!decodedToken.iss) {
      //this should also pinpoint the auth server address once deployed
      valid = false
    }

    //here should also be a validation of the signature, but that's another ticket
    return valid
  }
}

class ErrorResponse {
  private static get ERROR(): string {
    return 'error'
  }

  private static get DESCRIPTION(): string {
    return 'error_description'
  }

  private _error: string = ''
  private _description: string = ''

  get error(): string {
    return this._error
  }

  get description(): string {
    return this._description
  }

  constructor(parameter: { [key: string]: string }) {
    if (parameter[ErrorResponse.ERROR]) this._error = parameter[ErrorResponse.ERROR]
    if (parameter[ErrorResponse.DESCRIPTION]) this._description = parameter[ErrorResponse.DESCRIPTION]
  }
}

export default new AuthenticationStore()
