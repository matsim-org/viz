'use strict'

import Vue from 'vue'
import { VisualizationType } from './entities/Entities'

// shared event bus for cross-component communication
// see https://alligator.io/vuejs/global-event-bus/

// tslint:disable-next-line:variable-name
export const EventBus = new Vue()

interface SharedState {
  lastNavigation: string
  visualizationTypes: Map<string, VisualizationType>
}

class SharedStore {
  private static STATE_KEY = 'shared-state'
  private _state: SharedState

  constructor() {
    this._state = this.initializeState()
  }

  public setLastNavigation(path: string): void {
    this._state.lastNavigation = path
    this.persistState()
    EventBus.$emit('lastNavigation-changed', this.state.lastNavigation)
  }

  public addVisualizationType(type: VisualizationType) {
    this._state.visualizationTypes.set(type.typeName, type)
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
      lastNavigation: '',
      visualizationTypes: new Map(),
    }
  }

  private persistState(): void {
    sessionStorage.setItem(
      SharedStore.STATE_KEY,
      JSON.stringify({
        lastNavigation: this._state.lastNavigation,
      })
    )
  }

  private loadState(): SharedState | null {
    const persistedStateString = sessionStorage.getItem(SharedStore.STATE_KEY)
    if (persistedStateString) {
      const persistedState = JSON.parse(persistedStateString as string)
      return {
        lastNavigation: persistedState.lastNavigation,
        visualizationTypes: new Map(),
      }
    }
    return null
  }
}

export default new SharedStore()
export { SharedState }
