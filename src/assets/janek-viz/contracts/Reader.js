class Reader {
  constructor (byteArray, valueLength) {
    this.data = new DataView(byteArray);
    this.size = this.data.byteLength;
    this.position = 0;
    this.valueLength = valueLength;
    this.z = 0;
  }

  /**
     * Parses an array of (x,y)-Coordinates into a Float32Array of (x,y,z)-coordinates. The length of the
     * array is calculate as numberOfItems * valuesPerItem. The coordinates of the result are set according to
     * the following ruels: x == x, y == y, z == this.z
     * @param {* number } numberOfItems - number of items in the array e.g. how many lines
     * @param {* number } valuesPerItem - number of values per Item e.g. how many coordinates per line
     */
  parseCoordinatesArray (numberOfItems, valuesPerItem) {
    let result = new Float32Array(numberOfItems * valuesPerItem * 3);
    let index = 0;

    this.parseArray(numberOfItems, valuesPerItem, () => {
      this._parsePoint(result, index, 0);
      index += 3;
    });

    return result;
  }

  /**
     * Parses an array which has the length numberOfItems * valuesPerItem. The actual parsing is done by
     * by the parseValue Function. The parseValue function must take care of adjusting the readers position
     * correctly
     * @param {* number} numberOfItems - number of items in the array e.g. how many lines
     * @param {* number} valuesPerItem - number of values per Item e.g. how many coordinates per line
     * @param {* function} parseValue - function to actually read the bytes from the buffer
     */
  parseArray (numberOfItems, valuesPerItem, parseValue) {
    let itemsProcessed = 0;

    while (itemsProcessed < numberOfItems) {
      this._parseItem(valuesPerItem, parseValue);
      itemsProcessed++;
    }
  }

  _parseItem (valuesPerItem, parseValue) {
    let valuesProcessed = 0;

    while (valuesProcessed < valuesPerItem) {
      parseValue();
      valuesProcessed++;
    }
  }

  _parsePoint (array, index, valueIndex) {
    array[index + valueIndex] = this.getFloat32AndIncrementPosition();
    array[index + valueIndex + 1] = this.getFloat32AndIncrementPosition(); // invert y
    array[index + valueIndex + 2] = this.z; // add z component
  }

  /**
     * Reads a Float32 from the current position in the byteArray and increments the reader position by 'valueLength'.
     * Big Endianess is assumed.
     */
  getFloat32AndIncrementPosition () {
    let val = this.data.getFloat32(this.position, false);
    this.position += this.valueLength;
    return val;
  }
}

export { Reader }
