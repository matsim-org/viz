'use strict'

// shared event bus for cross-component communication
// see https://alligator.io/vuejs/global-event-bus/
// import Vue from 'vue';
// export const EventBus = new Vue();

// Shared common state storage. state object should ONLY be read.
// Use methods to modify state.
export const BigStore = {
  debug: false,

  state: {
    layers: {},
    prjCache: {},
  },

  addCacheItem (key, value) {
    if (this.debug) console.log('addCache triggered:', key)
    this.state.prjCache[key] = value;
  },

  addLayer (key, value) {
    if (this.debug) console.log('addLayer triggered:', key)
    this.state.layers[key] = value;
  },

  sendLayerBack (layer) {
    if (this.debug) console.log('sendLayerBack triggered:')
    this.state.layers[layer].bringToBack();
  },

}

if (BigStore.debug) console.log('BigStore initialized')
