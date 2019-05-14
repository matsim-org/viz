import NetworkStore from './NetworkStore'
import { WebGLRenderer, OrthographicCamera } from 'three'
import MapInteractionController from './MapInteractionController'
import MapState from './MapState'
import Rectangle from './Rectangle'
import BufferHolder from './BufferHolder'
import { ServerConfiguration } from '@/visualization/events-animation/EventsAnimationAPI'
import LinkTripsStore from './LinkTripsStore'

export default class DrawingController {
  private renderer: WebGLRenderer
  private canvas: HTMLCanvasElement

  private mapState = new MapState(new Rectangle(0, 0, 0, 0))
  private bufferHolder = new BufferHolder()
  private camera = new OrthographicCamera(
    this.mapState.Bounds.Left,
    this.mapState.Bounds.Right,
    this.mapState.Bounds.Top,
    this.mapState.Bounds.Bottom,
    1,
    100
  )
  private mapInteractionController: MapInteractionController
  private networkStore: NetworkStore
  private linkTripsStore: LinkTripsStore
  private resizeHandler: (e: UIEvent) => void
  private mapInteractionHandler: (e: MapState) => void
  private runAnimation = false
  private time = 0

  constructor(
    networkStore: NetworkStore,
    linkTripsStore: LinkTripsStore,
    canvas: HTMLCanvasElement,
    config: ServerConfiguration
  ) {
    this.networkStore = networkStore
    this.linkTripsStore = linkTripsStore
    this.canvas = canvas
    this.renderer = new WebGLRenderer({ canvas: canvas, antialias: true })
    this.mapInteractionController = new MapInteractionController(this.mapState, canvas)
    this.mapInteractionHandler = mapState => this.adjustCamera(mapState.Bounds)
    this.mapInteractionController.ChangedEvent.addEventHandler(this.mapInteractionHandler)
    this.time = config.firstTimestep

    this.resize()
    this.resizeHandler = e => this.resize()
    window.addEventListener('resize', this.resizeHandler)
    this.mapState.resizeMapToRect(new Rectangle(config.left, config.right, config.top, config.bottom))
    this.adjustCamera(this.mapState.Bounds)
    this.initialize()
  }

  public destroy() {
    window.removeEventListener('resize', this.resizeHandler)
    this.mapInteractionController.ChangedEvent.removeEventHandler(this.mapInteractionHandler)
  }

  public startAnimation() {
    if (!this.runAnimation) {
      this.runAnimation = true
      this.render()
      console.log('start animation')
    }
  }

  public stopAnimation() {
    this.runAnimation = false
    console.log('stop animation')
  }

  private async initialize() {
    const networkData = await this.networkStore.getNetwork()
    console.log('fetched network data')
    this.bufferHolder.clearNetworkBuffer()
    this.bufferHolder.loadNetworkBuffer(networkData)
    this.renderOnce()
  }

  private resize() {
    this.canvas.width = this.canvas.clientWidth
    this.canvas.height = this.canvas.clientHeight

    this.mapState.resizeViewPort(this.canvas.width, this.canvas.height)
    this.adjustCamera(this.mapState.Bounds)
    this.renderer.setViewport(0, 0, this.canvas.width, this.canvas.height)
    this.renderOnce()
  }

  private adjustCamera(bounds: Rectangle) {
    this.camera.left = bounds.Left
    this.camera.right = bounds.Right
    this.camera.top = bounds.Top
    this.camera.bottom = bounds.Bottom
    this.camera.updateProjectionMatrix()
    this.renderOnce()
  }

  private render() {
    if (this.runAnimation) {
      requestAnimationFrame(() => this.render())
      this.updateLinkTripData()
      if (this.time % 1000 === 0) {
        console.log(this.time)
      }
      this.time += 10

      this.bufferHolder.updateAgentBufferUniform('time', this.time)
      this.renderOnce()
    }
  }

  private renderOnce() {
    // check whether we need to update the data on the graphics card
    // if (this.linkTripsStore.getNextBlockBoundary(this.time) === this.time) {
    // console.log('updating link data for time: ' + this.time)

    this.renderer.render(this.bufferHolder.Scene, this.camera)
  }

  private updateLinkTripData() {
    const trips = this.linkTripsStore.getLinkTrip(this.time)
    this.bufferHolder.updateAgentBufferAttribute('position', trips.fromPosition)
    this.bufferHolder.updateAgentBufferAttribute('toPosition', trips.toPosition)
    this.bufferHolder.updateAgentBufferAttribute('fromTime', trips.fromTime)
    this.bufferHolder.updateAgentBufferAttribute('toTime', trips.toTime)
  }
}
