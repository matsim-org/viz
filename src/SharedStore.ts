'use strict'

// shared event bus for cross-component communication
// see https://alligator.io/vuejs/global-event-bus/
import Vue from 'vue'
export const EventBus = new Vue()

import Authentication from './auth/Auth'
import { Dictionary } from 'vue-router/types/router'

interface AuthenticationState {
  isAuthenticated: boolean
  isRequestingAuthentication: boolean
}

interface SharedState {
  isSidePanelExpanded: boolean
  lastNavigatedRoute: string
  authentication: AuthenticationState
}

class StoreState {
  private _stateData: SharedState

  get isSidePanelExpanded(): boolean {
    return this._stateData.isSidePanelExpanded
  }

  get lastNavigatedRoute(): string {
    return this._stateData.lastNavigatedRoute
  }

  get isAuthenticated(): boolean {
    return this._stateData.authentication.isAuthenticated
  }

  get isRequestingAuthentication(): boolean {
    return this._stateData.authentication.isRequestingAuthentication
  }

  constructor(stateData: SharedState = StoreState.defaultState()) {
    this._stateData = stateData
  }

  assign(newProps: any): StoreState {
    let newState = Object.assign({}, this._stateData, newProps) as SharedState
    return new StoreState(newState)
  }

  static defaultState(): SharedState {
    return {
      isSidePanelExpanded: false,
      lastNavigatedRoute: '',
      authentication: {
        isAuthenticated: false,
        isRequestingAuthentication: false,
      },
    }
  }
}

class SharedStore {
  private _state: StoreState
  private _authentication: Authentication = new Authentication()

  get state(): StoreState {
    return this._state
  }

  constructor() {
    this._state = this.initializeState()
  }

  private initializeState(): StoreState {
    return new StoreState()
  }

  public toggleSidePanel(): void {
    //this._state.isSidePanelExpanded = !this.state.isSidePanelExpanded

    this._state = this._state.assign({ isSidePanelExpanded: true })
    console.log('is sidebar extended: ' + this.state.isSidePanelExpanded)
    EventBus.$emit('sidebar-toggled', this.state.isSidePanelExpanded)
  }

  public setLastNavigatedRoute(path: string): void {
    //this._state.lastNavigatedRoute = path
    EventBus.$emit('lastNavigatedRoute-changed', this.state.lastNavigatedRoute)
  }

  public authenticate(): void {
    //this._state.authentication.isRequestingAuthentication = true
    this._authentication.requestAuthorization()
    EventBus.$emit(
      'isRequestingAuthentication-changed'
      // this.state.authentication.isRequestingAuthentication
    )
  }

  public handleAuthenticationResponse(fragment: string): void {
    this._authentication.handleAuthorizationResponse(fragment)
  }

  handleFailedAuthenticationResponse(parameter: Dictionary<string>): void {
    this._authentication.handleFailedAuthorizationResponse(parameter)
  }
}

export default new SharedStore()

/*
export const BigStore = {
  debug: true,
  state: {
    isSidePanelExpanded: true,
    lastNavigatedRoute: '',
    authentication: {
      isAuthenticated: () => authentication.isAuthenticated(),
    },
  },

  toggleSidePanel(): void {
    this.state.isSidePanelExpanded = !this.state.isSidePanelExpanded
    if (this.debug) {
      console.log('Show Side Panel:', this.state.isSidePanelExpanded)
    }

    EventBus.$emit('sidebar-toggled', this.state.isSidePanelExpanded)
  },

  setLastNavigatedRoute(route: string): void {
    this.state.lastNavigatedRoute = route
  },

  authenticate(): void {
    authentication.requestAuthorization()
  },

  handleAuthenticationResponse(fragment: string): void {
    authentication.handleAuthorizationResponse(fragment)
  },

  handleFailedAuthenticationResponse(parameter: Dictionary<string>): void {
    authentication.handleFailedAuthorizationResponse(parameter)
  },
}


if (BigStore.debug) console.log('BigStore initialized')*/
