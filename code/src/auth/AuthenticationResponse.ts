import * as JWT from 'jwt-decode'
import { AuthenticationRequestVars } from '@/auth/AuthenticationRequest'

export default class AuthenticationResponse {
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
      // this should also pinpoint the auth server address once deployed
      valid = false
    }

    // here should also be a validation of the signature, but that's another ticket
    return valid
  }
}
