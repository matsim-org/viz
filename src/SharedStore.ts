'use strict'

import Vue from 'vue'
import { Dictionary } from 'vue-router/types/router'
import AuthenticationStore, { AuthenticationStatus } from './auth/Authentication'
import FileAPI from './communication/FileAPI'
import Project from './entities/Project'

// shared event bus for cross-component communication
// see https://alligator.io/vuejs/global-event-bus/
export const EventBus = new Vue()

interface SharedState {
  isSidePanelExpanded: boolean
  lastNavigation: string
  personalProjects: Project[]
}

class SharedStore {
  private static STATE_KEY = 'shared-state'
  private _state: SharedState

  get state(): SharedState {
    return this._state
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

  public setLastNavigation(path: string): void {
    this._state.lastNavigation = path
    this.persistState()
    EventBus.$emit('lastNavigation-changed', this.state.lastNavigation)
  }

  async fetchProjects(): Promise<void> {
    let fetchedProjects = await FileAPI.fetchAllPersonalProjects()
    this._state.personalProjects = fetchedProjects
  }

  private defaultState(): SharedState {
    return {
      isSidePanelExpanded: true,
      lastNavigation: '',
      personalProjects: [],
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
export { SharedState, AuthenticationStatus }
