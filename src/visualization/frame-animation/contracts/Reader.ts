class Reader {
  private _data: DataView
  private _size: number
  private _position: number
  private _valueLength: number
  private _z: number

  protected get position() {
    return this._position
  }

  protected get size() {
    return this._size
  }

  protected get valueLength() {
    return this._valueLength
  }

  protected get z() {
    return this._z
  }

  constructor(byteArray: ArrayBuffer, valueLength: number) {
    this._data = new DataView(byteArray)
    this._size = this._data.byteLength
    this._position = 0
    this._valueLength = valueLength
    this._z = 0
  }

  /**
   * Parses an array of (x,y)-Coordinates into a Float32Array of (x,y,z)-coordinates. The length of the
   * array is calculate as numberOfItems * valuesPerItem. The coordinates of the result are set according to
   * the following ruels: x == x, y == y, z == this.z
   * @param {* number } numberOfItems - number of items in the array e.g. how many lines
   * @param {* number } valuesPerItem - number of values per Item e.g. how many coordinates per line
   */
  protected parseCoordinatesArray(numberOfItems: number, valuesPerItem: number) {
    const result = new Float32Array(numberOfItems * valuesPerItem * 3)
    let index = 0

    this.parseArray(numberOfItems, valuesPerItem, () => {
      this._parsePoint(result, index, 0)
      index += 3
    })

    return result
  }

  /**
   * Parses an array which has the length numberOfItems * valuesPerItem. The actual parsing is done by
   * by the parseValue Function. The parseValue function must take care of adjusting the readers position
   * correctly
   * @param {* number} numberOfItems - number of items in the array e.g. how many lines
   * @param {* number} valuesPerItem - number of values per Item e.g. how many coordinates per line
   * @param {* function} parseValue - function to actually read the bytes from the buffer
   */
  protected parseArray(numberOfItems: number, valuesPerItem: number, parseValue: () => void) {
    let itemsProcessed = 0

    while (itemsProcessed < numberOfItems) {
      this._parseItem(valuesPerItem, parseValue)
      itemsProcessed++
    }
  }

  /**
   * Reads a Float32 from the current position in the byteArray and increments the reader position by 'valueLength'.
   * Big Endianess is assumed.
   */
  protected getFloat32AndIncrementPosition() {
    const val = this._data.getFloat32(this._position, false)
    this._position += this._valueLength
    return val
  }

  private _parseItem(valuesPerItem: number, parseValue: () => void) {
    let valuesProcessed = 0

    while (valuesProcessed < valuesPerItem) {
      parseValue()
      valuesProcessed++
    }
  }

  private _parsePoint(array: Float32Array, index: number, valueIndex: number) {
    array[index + valueIndex] = this.getFloat32AndIncrementPosition()
    array[index + valueIndex + 1] = this.getFloat32AndIncrementPosition()
    array[index + valueIndex + 2] = this._z // add z component
  }
}

export { Reader }
