import { Rectangle } from '../contracts/Rectangle.js'
import { OrthographicCamera } from 'three'

class MapState {
  /**
   * Map state handles the translation of screen coordinates into world coordinates the bounds are expected to be
   * in right hand coordinates -> lef < right, bottom < top
   * @param {*Rectangle} bounds - bounds of the rectangle that should be shown
   */
  constructor(bounds) {
    this._bounds = bounds
    this._viewport = bounds
    this._scale = 1
    this._camera = new OrthographicCamera(bounds.left, bounds.right, bounds.top, bounds.bottom, 1, 100)
    this._camera.position.z = 1
    this._camera.frustumCulled = false
  }

  static ZOOMFACTOR() {
    return 1.1
  }

  get bounds() {
    return this._bounds
  }

  set bounds(bounds) {
    this._bounds = bounds
    this._adjustCameraToBounds()
  }

  get camera() {
    return this._camera
  }

  get scale() {
    return this._scale
  }

  transformCoordinate(offsetX, offsetY) {
    return {
      x: offsetX * this._scale + this.bounds.left,
      y: this.bounds.bottom + this.bounds.height - offsetY * this._scale,
    }
  }

  resizeViewport(toWidth, toHeight) {
    this._viewport = new Rectangle(0, toWidth, toHeight, 0)
    this.resizeMap(toWidth, toHeight)
  }

  resizeMap(toWidth, toHeight) {
    this.bounds = Rectangle.createRectFromCenterDimensions(
      this.bounds.centerX,
      this.bounds.centerY,
      toWidth * this._scale,
      toHeight * this._scale
    )
  }

  resizeMapEnclose(rectangle) {
    let aspect = this._viewport.width / this._viewport.height
    let newBounds

    if (rectangle.width > rectangle.height) {
      newBounds = Rectangle.createRectFromCenterDimensions(
        rectangle.centerX,
        rectangle.centerY,
        rectangle.width,
        rectangle.width / aspect
      )
    } else {
      newBounds = Rectangle.createRectFromCenterDimensions(
        rectangle.centerX,
        rectangle.centerY,
        rectangle.height * aspect,
        rectangle.height
      )
    }
    let newScale = newBounds.width / this._viewport.width
    this._scale = isFinite(newScale) ? newScale : 1
    this.bounds = newBounds
  }

  moveMap(offsetX, offsetY) {
    this.bounds = Rectangle.createRectFromOffset(this.bounds, -offsetX * this._scale, -offsetY * this._scale)
  }

  moveMapTo(centerX, centerY) {
    this.bounds = Rectangle.createRectFromCenterDimensions(centerX, centerY, this.bounds.width, this.bounds.height)
  }

  zoomInReCenter(offsetX, offsetY) {
    this._zoomReCenter(1 / MapState.ZOOMFACTOR(), offsetX, offsetY)
  }

  zoomOutReCenter(offsetX, offsetY) {
    this._zoomReCenter(MapState.ZOOMFACTOR(), offsetX, offsetY)
  }

  _zoomReCenter(factor, offsetX, offsetY) {
    // 1. Translate center
    // calculate center of zoom
    let zoomCenterX = offsetX * this._scale + this.bounds.left
    let zoomCenterY = this.bounds.bottom + this.bounds.height - offsetY * this._scale

    this._scale = this._scale * factor

    // calculate the center of zoom relative to bounds as e.g. offset/width
    let relativeX = (zoomCenterX - this.bounds.left) / this.bounds.width
    let relativeY = (zoomCenterY - this.bounds.bottom) / this.bounds.height

    // 2. zoom
    let width = this._bounds.width * factor
    let height = this._bounds.height * factor

    // 3. Translate back
    // calculate bounds
    let left = zoomCenterX - width * relativeX
    let right = zoomCenterX + width * (1 - relativeX)
    let top = zoomCenterY + height * (1 - relativeY)
    let bottom = zoomCenterY - height * relativeY
    this.bounds = new Rectangle(left, right, top, bottom)
  }

  _adjustCameraToBounds() {
    this._camera.left = this._bounds.left
    this._camera.right = this._bounds.right
    this._camera.top = this._bounds.top
    this._camera.bottom = this._bounds.bottom
    this._camera.updateProjectionMatrix()
  }
}

export { MapState }
