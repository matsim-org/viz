declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

// this keeps typescript / semantic / jquery happy together:
declare var $: any

declare module 'colormap'
declare module 'convert-seconds'
declare module 'read-blob'
declare module 'scale-color-perceptual'
declare module 'vue-slider-component'
declare module '@turf/nearest-point-to-line'
declare module '@turf/point-to-line-distance'
declare module 'filesize'
declare module 'd3-sankey-diagram'

declare module '*.worker' {
  class WebpackWorker extends Worker {
    constructor()
  }

  export default WebpackWorker
}

declare const __webpack_public_path__: string
