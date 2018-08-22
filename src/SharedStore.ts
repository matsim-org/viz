'use strict'

import Vue from 'vue'
import FileAPI from './communication/FileAPI'
import Project from './entities/Project'
import { VisualizationType } from './entities/Visualization'

// shared event bus for cross-component communication
// see https://alligator.io/vuejs/global-event-bus/

// tslint:disable-next-line:variable-name
export const EventBus = new Vue()

interface SharedState {
  isSidePanelExpanded: boolean
  lastNavigation: string
  personalProjects: Project[]
  visualizationTypes: VisualizationType[]
}

class SharedStore {
  private static STATE_KEY = 'shared-state'
  private _state: SharedState

  constructor() {
    this._state = this.initializeState()
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

  public async fetchProjects(): Promise<void> {
    this._state.personalProjects = await FileAPI.fetchAllPersonalProjects()
  }

  public async fetchVizTypes(): Promise<void> {
    this._state.visualizationTypes = await FileAPI.fetchVisualizationTypes()
  }

  get state(): SharedState {
    return this._state
  }

  get debug(): boolean {
    return true
  }

  private initializeState(): SharedState {
    let state = this.loadState()
    if (!state) {
      state = this.defaultState()
    }
    return state
  }

  private defaultState(): SharedState {
    return {
      isSidePanelExpanded: true,
      lastNavigation: '',
      personalProjects: [],
      visualizationTypes: [],
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
export { SharedState }
