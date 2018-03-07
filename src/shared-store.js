'use strict'

// shared event bus for cross-component communication
// see https://alligator.io/vuejs/global-event-bus/
import Vue from 'vue';
export const EventBus = new Vue();

// Shared common state storage. state object should ONLY be read.
// Use methods to modify state.
export const BigStore = {
  debug: true,
  state: {
    isSidePanelExpanded: true,
  },

  toggleSidePanel () {
    this.state.isSidePanelExpanded = !this.state.isSidePanelExpanded;
    if (this.debug) console.log('Show Side Panel:', this.state.isSidePanelExpanded);

    EventBus.$emit('sidebar-toggled', this.state.isSidePanelExpanded);
  },
}

if (BigStore.debug) console.log('BigStore initialized')
