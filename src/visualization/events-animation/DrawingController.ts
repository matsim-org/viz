import NetworkStore from './NetworkStore'
import { WebGLRenderer, OrthographicCamera } from 'three'
import MapInteractionController from './MapInteractionController'
import MapState from './MapState'
import Rectangle from './Rectangle'
import BufferHolder from './BufferHolder'
import { canvasToBlob } from 'blob-util'

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

  constructor(networkStore: NetworkStore, canvas: HTMLCanvasElement) {
    this.networkStore = networkStore
    this.canvas = canvas
    this.renderer = new WebGLRenderer({ canvas: canvas, antialias: true })
    this.mapInteractionController = new MapInteractionController(this.mapState, canvas)
  }

  public async initialize() {
    const networkData = await this.networkStore.getNetwork()
    this.bufferHolder.clearNetworkBuffer()
    this.bufferHolder.loadNetworkBuffer(networkData)
    this.renderOnce()
  }

  private resize() {
    this.canvas.width = this.canvas.clientWidth
    this.canvas.height = this.canvas.clientHeight

    this.mapState.resizeMap(this.canvas.width, this.canvas.height)
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

  private renderOnce() {
    this.renderer.render(this.bufferHolder.Scene, this.camera)
  }
}
