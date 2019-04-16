import AuthenticationRequest from '@/auth/AuthenticationRequest'
import AuthenticationResponse from '@/auth/AuthenticationResponse'
import ErrorResponse from '@/auth/ErrorResponse'
import Config from '@/config/Config'
import { Method } from '@/communication/Constants'
import { Url } from 'url'

export enum AuthenticationStatus {
  NotAuthenticated,
  Requesting,
  Failed,
  Authenticated,
}

export interface AuthenticationState {
  idToken: IdToken
  accessToken: string
  status: AuthenticationStatus
  errorMessage: string
}

export interface IdToken {
  sub: string
  exp: number
  iat: number
  iss: Url
  jti: string
  nonce: string
}

export default class AuthenticationStore {
  private authState: AuthenticationState

  private static get STATE_STORAGE_KEY(): string {
    return 'Authentication-state'
  }

  get state(): AuthenticationState {
    return this.authState
  }

  constructor() {
    this.authState = this.initializeState()
  }

  public requestAuthentication(): void {
    this.authState.status = AuthenticationStatus.Requesting

    const request = new AuthenticationRequest()
    AuthenticationRequest.persistVariables(request)
    this.persistState()
    request.submit()
  }

  public async logOut() {
    this.resetState()
    this.persistState()
    try {
      await fetch(`${Config.authServer}/logout`, {
        mode: 'cors',
        credentials: 'include',
        method: Method.POST,
      })
    } catch (error) {
      console.log(error)
    }
  }

  public handleAuthenticationResponse(fragment: string) {
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

  public handleFailedAuthenticationResponse(parameters: { [key: string]: string }) {
    const response = new ErrorResponse(parameters)
    console.error('authentication failed. error: ' + response.error + ' description: ' + response.description)
    this.setToStateToFailed(response.description)
  }

  public resetState(): void {
    this.authState.status = AuthenticationStatus.NotAuthenticated
    this.authState.idToken = this.getEmtpyIdToken()
    this.authState.accessToken = ''
    this.authState.errorMessage = ''
  }

  private initializeState(): AuthenticationState {
    let loaded = this.loadState()
    if (!loaded) loaded = this.createDefaultState()

    return loaded
  }

  private createDefaultState(): AuthenticationState {
    return {
      idToken: this.getEmtpyIdToken(),
      accessToken: '',
      status: AuthenticationStatus.NotAuthenticated,
      errorMessage: '',
    }
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
    const state = sessionStorage.getItem(AuthenticationStore.STATE_STORAGE_KEY)
    if (state) return JSON.parse(state) as AuthenticationState
    return null
  }

  private getEmtpyIdToken(): IdToken {
    return {
      exp: 0,
      iat: 0,
      iss: new URL('https://issuer.url'),
      jti: '',
      nonce: '',
      sub: '',
    }
  }
}
