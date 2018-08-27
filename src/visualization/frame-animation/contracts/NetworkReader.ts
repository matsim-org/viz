import { Reader } from '@/visualization/frame-animation/contracts/Reader'

export default class NetworkReader extends Reader {
  constructor(byteArray: ArrayBuffer) {
    super(byteArray, Float32Array.BYTES_PER_ELEMENT)
  }

  public parse() {
    const valuesPerLink = 2
    const valueSize = 2
    const numberOfLinks = this.size / valuesPerLink / valueSize / this.valueLength

    return this.parseCoordinatesArray(numberOfLinks, valuesPerLink)
  }
}
