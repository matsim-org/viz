'use strict'

import { VisualizationType } from './entities/Entities'

interface BreadCrumb {
  label: string
  url?: string
}

interface SearchResult {
  title: string
  subtitle?: string
  url: string
  collection?: string
}

interface SharedState {
  breadCrumbs: BreadCrumb[]
  currentUser: string
  needToNagUserToLogin: boolean
  lastNavigation: string
  isFullPageMap: boolean
  searchResults: SearchResult[]
  visualizationTypes: Map<string, VisualizationType>
}

class SharedStore {
  private static STATE_KEY = 'shared-state'
  private _state: SharedState

  constructor() {
    this._state = this.initializeState()
  }

  public setBreadCrumbs(breadcrumbs: BreadCrumb[]) {
    this._state.breadCrumbs = breadcrumbs
  }

  public setCurrentUser(user: string) {
    this._state.currentUser = user
  }

  public setNagUserToLogin(nag: boolean) {
    this._state.needToNagUserToLogin = nag
  }

  public setFullPage(isFullPage: boolean) {
    this._state.isFullPageMap = isFullPage
  }

  public setLastNavigation(path: string): void {
    this._state.lastNavigation = path
    this.persistState()
  }

  public setSearchResults(results: SearchResult[]): void {
    this._state.searchResults = results
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
      breadCrumbs: [],
      currentUser: '',
      isFullPageMap: false,
      lastNavigation: '',
      needToNagUserToLogin: false,
      searchResults: [],
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

      const loadedState = this.defaultState()
      loadedState.lastNavigation = persistedState.lastNavigation
      return loadedState
    }
    return null
  }
}

export default new SharedStore()
export { SharedState, SearchResult }
