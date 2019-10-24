export default class Rectangle {
  get left() {
    return this._left
  }

  get right() {
    return this._right
  }

  get top() {
    return this._top
  }

  get bottom() {
    return this._bottom
  }

  get width() {
    return Math.abs(this._right - this._left)
  }

  get height() {
    return Math.abs(this._bottom - this._top)
  }

  get centerX() {
    return (this.left + this.right) / 2
  }

  get centerY() {
    return (this.top + this.bottom) / 2
  }

  private _left: number
  private _right: number
  private _top: number
  private _bottom: number

  constructor(left: number, right: number, top: number, bottom: number) {
    this._left = left
    this._right = right
    this._top = top
    this._bottom = bottom
  }

  public static createRectFromCenterDimensions(centerX: number, centerY: number, width: number, height: number) {
    const left = centerX - width / 2
    const right = centerX + width / 2
    const top = centerY + height / 2
    const bottom = centerY - height / 2
    return new Rectangle(left, right, top, bottom)
  }

  public static createRectFromOffset(rectangle: Rectangle, offsetX: number, offsetY: number) {
    const left = rectangle.left + offsetX
    const right = rectangle.right + offsetX
    const top = rectangle.top + offsetY
    const bottom = rectangle.bottom + offsetY
    return new Rectangle(left, right, top, bottom)
  }

  public static createRectVerticallyFlipped(rectangle: Rectangle) {
    return new Rectangle(rectangle.left, rectangle.right, -rectangle.top, -rectangle.bottom)
  }

  public toJSON() {
    return {
      left: this._left,
      right: this._right,
      top: this._top,
      bottom: this._bottom,
    }
  }
}
