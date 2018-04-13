'use strict'

import Vue from 'vue'
import { Dictionary } from 'vue-router/types/router'
import Authentication, { AuthenticationState } from './auth/Auth'

// shared event bus for cross-component communication
// see https://alligator.io/vuejs/global-event-bus/
export const EventBus = new Vue()

interface SharedState {
  isSidePanelExpanded: boolean
  lastNavigatedRoute: string
  authentication: AuthenticationState
}

class SharedStore {
  private static STATE_KEY = 'shared-state'
  private _state: SharedState
  private _authentication: Authentication = new Authentication()

  get state(): SharedState {
    return this._state
  }

  constructor() {
    this._state = this.initializeState()
  }

  private initializeState(): SharedState {
    let state = this.loadState()
    if (!state) {
      state = this.defaultState()
    }
    return state
  }

  public toggleSidePanel(): void {
    this._state.isSidePanelExpanded = !this._state.isSidePanelExpanded
    this.persistState()
    EventBus.$emit('sidebar-toggled', this.state.isSidePanelExpanded)
  }

  public setLastNavigatedRoute(path: string): void {
    this._state.lastNavigatedRoute = path
    console.log('last nav route set to: ' + this.state.lastNavigatedRoute)
    EventBus.$emit('lastNavigatedRoute-changed', this.state.lastNavigatedRoute)
  }

  public authenticate(): void {
    this._state.authentication = AuthenticationState.Requesting
    this.persistState()
    this._authentication.requestAuthentication()
  }

  public handleAuthenticationResponse(fragment: string): void {
    this._authentication.handleAuthenticationResponse(fragment)
    this._state.authentication = this._authentication.state
    this.persistState()
  }

  handleFailedAuthenticationResponse(parameter: Dictionary<string>): void {
    this._authentication.handleFailedAuthenticationResponse(parameter)
  }

  private defaultState(): SharedState {
    return {
      isSidePanelExpanded: true,
      lastNavigatedRoute: '',
      authentication: AuthenticationState.NotAuthenticated,
    }
  }

  private persistState(): void {
    sessionStorage.setItem(SharedStore.STATE_KEY, JSON.stringify(this.state))
  }

  private loadState(): SharedState | null {
    const state = sessionStorage.getItem(SharedStore.STATE_KEY)
    if (state) {
      return JSON.parse(state as string)
    }
    return null
  }
}

export default new SharedStore()
export { SharedState, AuthenticationState }
