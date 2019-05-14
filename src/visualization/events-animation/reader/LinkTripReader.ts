import { LinkTrip } from '../EventsAnimationAPI'

export interface LinkTripAsFloat32 {
  fromPosition: Float32Array
  toPosition: Float32Array
  fromTime: Float32Array
  toTime: Float32Array
}
export default class LinkTripReader {
  private data: LinkTrip[]

  constructor(data: LinkTrip[]) {
    this.data = data
  }

  public parse(): LinkTripAsFloat32 {
    const result: LinkTripAsFloat32 = {
      fromPosition: new Float32Array(this.data.length * 3),
      toPosition: new Float32Array(this.data.length * 3),
      fromTime: new Float32Array(this.data.length),
      toTime: new Float32Array(this.data.length),
    }

    for (let i = 0; i < this.data.length; i++) {
      const linkTrip = this.data[i]
      result.fromPosition[i * 3] = linkTrip.fromX
      result.fromPosition[i * 3 + 1] = linkTrip.fromY
      result.fromPosition[i * 3 + 2] = 0 // we don't have a z value but webGL requires it

      result.toPosition[i * 3] = linkTrip.toX
      result.toPosition[i * 3 + 1] = linkTrip.toY
      result.toPosition[i * 3 + 2] = 0 // we don't have a z value but webGL requires it

      result.fromTime[i] = linkTrip.enterTime
      result.toTime[i] = linkTrip.leaveTime
    }
    return result
  }
}
