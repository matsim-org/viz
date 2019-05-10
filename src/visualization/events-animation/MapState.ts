import Rectangle from './Rectangle'

export default class MapState {
  private bounds: Rectangle
  private viewPort: Rectangle
  private scale = 1

  public get Bounds() {
    return this.bounds
  }

  constructor(bounds: Rectangle) {
    this.bounds = bounds
    this.viewPort = bounds
  }

  private static ZOOM_FACTOR() {
    return 1.1
  }

  public resizeMap(toWidth: number, toHeight: number) {
    this.bounds = Rectangle.createFromCenterWithDimensions(
      this.bounds.CenterX,
      this.bounds.CenterY,
      toWidth * this.scale,
      toHeight * this.scale
    )
  }

  public zoomOutReCenter(offsetX: number, offsetY: number) {
    this.zoomReCenter(MapState.ZOOM_FACTOR(), offsetX, offsetY)
  }

  public zoomInReCenter(offsetX: number, offsetY: number) {
    this.zoomReCenter(1 / MapState.ZOOM_FACTOR(), offsetX, offsetY)
  }

  public moveMap(offsetX: number, offsetY: number) {
    // the passed offset is inversed, since the camera has to move right when the mouse moves left
    this.bounds = Rectangle.createFromOffset(this.bounds, -offsetX * this.scale, -offsetY * this.scale)
  }

  private zoomReCenter(factor: number, offsetX: number, offsetY: number) {
    // 1. Translate center
    // calculate center of zoom
    const zoomCenterX = offsetX * this.scale + this.bounds.Left
    const zoomCenterY = this.bounds.Bottom + this.bounds.Height - offsetY * this.scale

    this.scale = this.scale * factor

    // calculate the center of zoom relative to bounds as e.g. offset/width
    const relativeX = (zoomCenterX - this.bounds.Left) / this.bounds.Width
    const relativeY = (zoomCenterY - this.bounds.Bottom) / this.bounds.Height

    // 2. zoom
    const width = this.bounds.Width * factor
    const height = this.bounds.Height * factor

    // 3. Translate back
    // calculate bounds
    const left = zoomCenterX - width * relativeX
    const right = zoomCenterX + width * (1 - relativeX)
    const top = zoomCenterY + height * (1 - relativeY)
    const bottom = zoomCenterY - height * relativeY
    this.bounds = new Rectangle(left, right, top, bottom)
  }
}
