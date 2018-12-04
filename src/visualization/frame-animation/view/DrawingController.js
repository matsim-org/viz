import Rectangle from '../contracts/Rectangle'
import { MapState } from './MapState.js'
import { MapInteractionController } from './MapInteractionController.js'
import { BufferHolder } from './BufferHolder.js'
import { WebGLRenderer, Raycaster, Vector3 } from 'three'

class DrawingController {
  constructor(playback, dataProvider, config) {
    this._config = config
    this._config.subscribeServerConfigUpdated(() => this._onServerConfigUpdated())
    this._playback = playback
    this._playback.addTimestepChangedListener(timestep => this._loadSnapshot(timestep))
    this._dataProvider = dataProvider
    this._dataProvider.networkDataChanged = data => this.onNetworkDataChanged(data)
    this._dataProvider.geoJsonDataChanged = layerName => this.onGeoJsonDataChanged(layerName)
    this.initialize()
  }

  set mapState(mapState) {
    this._mapState = mapState
    this.resize()
  }

  get mapState() {
    return this._mapState
  }

  set interactionController(controller) {
    this._interactionController = controller
    controller.clicked = p => this.raycast(p)
    controller.redrawNeeded = () => this.renderOnce(false)
  }

  get interactionController() {
    return this._interactionController
  }

  get playback() {
    return this._playback
  }

  get dataProvider() {
    return this._dataProvider
  }

  initialize() {
    let canvas = document.getElementById(this._config.canvasId)
    this.renderer = new WebGLRenderer({ canvas: canvas, antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this._bufferHolder = new BufferHolder(this._config)
    this._bufferHolder.redrawNeeded = () => this.renderOnce(false)
    this.mapState = new MapState(new Rectangle(0, 0, 0, 0))
    this.interactionController = new MapInteractionController(this.mapState, this._config)
    this._raycaster = new Raycaster()

    this.resize()
    this._boundResize = e => this.resize(e)
    window.addEventListener('resize', this._boundResize)
  }

  destroy() {
    window.removeEventListener('resize', this._boundResize)
    this.stopPlayback()
    this.renderer.dispose()
    this._interactionController.destroy()
  }

  _onServerConfigUpdated() {
    let rawBounds = this._config.bounds
    let bounds = new Rectangle(rawBounds.left, rawBounds.right, rawBounds.top, rawBounds.bottom)
    this.mapState.resizeMapEnclose(bounds)
  }

  onNetworkDataChanged(data) {
    this._bufferHolder.clearNetworkBuffer()
    this._bufferHolder.loadNetworkBuffer(data)
    this.renderOnce(false)
  }

  onGeoJsonDataChanged(layerName) {
    this._bufferHolder.clearGeoJsonBuffer(layerName)
    let layer = this.dataProvider.getLayer(layerName)
    this._bufferHolder.loadGeoJsonBuffer(layer)
    this.renderOnce(false)
  }

  resize() {
    let canvas = document.getElementById(this._config.canvasId)
    let width = canvas.clientWidth
    let height = canvas.clientHeight
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio

    this.resizeMap(width, height)
    this.renderer.setViewport(0, 0, width, height)
    this.renderOnce(false)
  }

  resizeMap(width, height) {
    if (this.mapState) {
      this.mapState.resizeViewport(width, height)
    }
  }

  raycast(point) {
    if (!this._bufferHolder.hasAgentLayer) return

    this._raycaster.params.Points.threshold = 10 * this.mapState.scale
    let ray = new Vector3(point.x, point.y, 0)
    this._raycaster.set(ray, new Vector3(0, 0, -1))
    let agentLayer = this._bufferHolder.getLayer(BufferHolder.AGENT_LAYER())
    let intersects = this._raycaster.intersectObject(agentLayer, false)
    if (intersects.length > 0) {
      let idIndex = this.dataProvider.getId(intersects[0].index, this.playback.currentTimestep)
      this.dataProvider.loadPlan(idIndex)
      this._bufferHolder.updateAgentBufferUniform('selectedId', idIndex)
    } else {
      this._bufferHolder.updateAgentBufferUniform('selectedId', -1)
      this._bufferHolder.clearGeoJsonBuffer('selectedPlan')
    }
    if (!this.shouldRender) this.renderOnce(false)
  }

  startPlayback() {
    if (!this.shouldRender) {
      this.shouldRender = true
      this.render()
    }
  }

  stopPlayback() {
    this.shouldRender = false
  }

  render() {
    if (!this.shouldRender) return

    requestAnimationFrame(() => this.render())
    this.renderOnce(true)
  }

  renderOnce(isAnimationFrame) {
    if (isAnimationFrame) {
      this.playback.advanceTime()
      this._animateAgents()
    }
    this.renderer.render(this._bufferHolder.scene, this.mapState.camera)
  }

  _animateAgents() {
    if (!this.playback || !this._bufferHolder.hasAgentLayer || !this.shouldRender) {
      return
    }
    this._bufferHolder.updateAgentBufferUniform('timestepFraction', this.playback.timestepFraction)
  }

  _loadSnapshot(timestep) {
    if (this.dataProvider.hasSnapshot(timestep, this.playback.speedFactor)) {
      const snapshot = this.dataProvider.getSnapshot(timestep)
      this._bufferHolder.updateAgentBufferAttribute('position', snapshot.position)
      this._bufferHolder.updateAgentBufferAttribute('nextPosition', snapshot.nextPosition)
      this._bufferHolder.updateAgentBufferAttribute('shouldInterpolate', snapshot.shouldInterpolate)
      this._bufferHolder.updateAgentBufferAttribute('id', snapshot.ids)

      if (!this.shouldRender) this.renderOnce(false)
    }
  }
}

export { DrawingController }
