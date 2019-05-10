import FrameAnimationAPI from '../frame-animation/communication/FrameAnimationAPI'
import NetworkStore from './NetworkStore'
import EventsAnimationAPI from './EventsAnimationAPI'
import DrawingController from './DrawingController'

export interface ContainerInit {
  vizId: string
  canvas: HTMLCanvasElement
  endpoint: URL
  accessToken: string
}
export default class Container {
  constructor(init: ContainerInit) {
    const api = new EventsAnimationAPI(init.endpoint, init.vizId, init.accessToken)
    const networkStore = new NetworkStore(api)
    const drawingController = new DrawingController(networkStore, init.canvas)
    drawingController.initialize()
  }
}
