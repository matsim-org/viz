import AuthenticationRequest from '@/auth/AuthenticationRequest'
import AuthenticationResponse from '@/auth/AuthenticationResponse'
import ErrorResponse from '@/auth/ErrorResponse'

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

export default class AuthenticationStore {
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

  public requestAuthentication(): void {
    this.authState.status = AuthenticationStatus.Requesting

    const request = new AuthenticationRequest()
    AuthenticationRequest.persistVariables(request)
    this.persistState()
    request.submit()
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
    this.authState.idToken = {}
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
      idToken: {},
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
}
