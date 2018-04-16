'use strict'

import Vue from 'vue'
import { Dictionary } from 'vue-router/types/router'
import Authentication, { AuthenticationState } from './auth/Authentication'
import FileAPI from './communication/FileAPI'
import Project from './entities/Project'

// shared event bus for cross-component communication
// see https://alligator.io/vuejs/global-event-bus/
export const EventBus = new Vue()

interface SharedState {
  isSidePanelExpanded: boolean
  navigateToOnAuthentication: string
  authentication: AuthenticationState
  personalProjects: Project[]
}

class SharedStore {
  private static STATE_KEY = 'shared-state'
  private _state: SharedState
  private _authentication: Authentication = new Authentication()

  get state(): SharedState {
    return this._state
  }

  get accessToken(): string {
    return this._authentication.fileServerAccessToken
  }

  get debug(): boolean {
    return true
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

  public setNavigateToOnAuthentication(path: string): void {
    this._state.navigateToOnAuthentication = path
    console.log(
      'last nav route set to: ' + this.state.navigateToOnAuthentication
    )
    EventBus.$emit(
      'lastNavigatedRoute-changed',
      this.state.navigateToOnAuthentication
    )
  }

  public resetAuthenticationState(): void {
    this._authentication.resetState()
    this._state.authentication = this._authentication.state
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

  handleFailedAuthenticationResponse(parameter: {
    [key: string]: string
  }): void {
    this._authentication.handleFailedAuthenticationResponse(parameter)
    this._state.authentication = this._authentication.state
    this.persistState()
  }

  async fetchProjects(): Promise<void> {
    let fetchedProjects = await FileAPI.fetchProjects()
    this._state.personalProjects = fetchedProjects
  }

  private defaultState(): SharedState {
    return {
      isSidePanelExpanded: true,
      navigateToOnAuthentication: '',
      personalProjects: [],
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
