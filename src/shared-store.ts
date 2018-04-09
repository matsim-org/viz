'use strict'

// shared event bus for cross-component communication
// see https://alligator.io/vuejs/global-event-bus/
import Vue from 'vue'
export const EventBus = new Vue()

import Authentication from './auth/Auth'
import { Dictionary } from 'vue-router/types/router'

const authentication = new Authentication()
// Shared common state storage. state object should ONLY be read.
// Use methods to modify state.
export const BigStore = {
  debug: true,
  state: {
    isSidePanelExpanded: true,
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

if (BigStore.debug) console.log('BigStore initialized')
