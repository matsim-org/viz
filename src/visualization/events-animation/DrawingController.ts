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
  }

  public startAnimation() {
    if (!this.runAnimation) {
      this.runAnimation = true
      this.render()
    }
  }

  public stopAnimation() {
    this.runAnimation = false
  }

  public loadAgents() {
    const trips = this.linkTripsStore.LinkTrips
    if (trips) {
      this.bufferHolder.updateAgentBufferAttribute('position', trips.fromPosition)
      this.bufferHolder.updateAgentBufferAttribute('toPosition', trips.toPosition)
      this.bufferHolder.updateAgentBufferAttribute('fromTime', trips.fromTime)
      this.bufferHolder.updateAgentBufferAttribute('toTime', trips.toTime)
      this.runAnimation = true
      this.render()
    }
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
  }

  private render() {
    if (this.runAnimation) {
      requestAnimationFrame(() => this.render())
      this.renderOnce()
    }
  }

  private renderOnce() {
    if (this.time % 100 === 0) {
      console.log(this.time)
    }
    this.bufferHolder.updateAgentBufferUniform('time', this.time)
    this.renderer.render(this.bufferHolder.Scene, this.camera)
    this.time++
  }
}
