import FrameAnimationAPI from '../frame-animation/communication/FrameAnimationAPI'
import NetworkStore from './NetworkStore'
import EventsAnimationAPI from './EventsAnimationAPI'
import DrawingController from './DrawingController'
import LinkTripsStore from './LinkTripsStore'

export interface ContainerInit {
  vizId: string
  canvas: HTMLCanvasElement
  endpoint: URL
  accessToken: string
}
export default class Container {
  private drawingController!: DrawingController
  private isrunning = false

  public get IsRunning() {
    return this.isrunning
  }

  constructor(init: ContainerInit) {
    this.initialize(init)
  }

  public testAgents() {
    if (this.isrunning) {
      this.drawingController.stopAnimation()
    } else {
      this.drawingController.startAnimation()
    }
    this.isrunning = !this.isrunning
  }

  private async initialize(init: ContainerInit) {
    const api = new EventsAnimationAPI(init.endpoint, init.vizId, init.accessToken)
    const serverConfig = await api.fetchConfiguration()
    console.log('fetched server config with progress: ' + serverConfig.progress)
    const networkStore = new NetworkStore(api)
    const linkTripsStore = new LinkTripsStore(api, serverConfig)
    this.drawingController = new DrawingController(networkStore, linkTripsStore, init.canvas, serverConfig)
  }
}
