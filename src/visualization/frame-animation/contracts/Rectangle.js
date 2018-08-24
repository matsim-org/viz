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

  constructor(left, right, top, bottom) {
    this._left = left
    this._right = right
    this._top = top
    this._bottom = bottom
  }

  static createRectFromCenterDimensions(centerX, centerY, width, height) {
    let left = centerX - width / 2
    let right = centerX + width / 2
    let top = centerY + height / 2
    let bottom = centerY - height / 2
    return new Rectangle(left, right, top, bottom)
  }

  static createRectFromOffset(rectangle, offsetX, offsetY) {
    let left = rectangle.left + offsetX
    let right = rectangle.right + offsetX
    let top = rectangle.top + offsetY
    let bottom = rectangle.bottom + offsetY
    return new Rectangle(left, right, top, bottom)
  }

  static createRectVerticallyFlipped(rectangle) {
    return new Rectangle(rectangle.left, rectangle.right, -rectangle.top, -rectangle.bottom)
  }

  toJSON() {
    return {
      left: this._left,
      right: this._right,
      top: this._top,
      bottom: this._bottom,
    }
  }
}
