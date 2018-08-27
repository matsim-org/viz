import { Reader } from '@/visualization/frame-animation/contracts/Reader'

export interface Snapshot {
  time: number
  position: Float32Array
  nextPosition: Float32Array
  ids: Float32Array
  shouldInterpolate: Float32Array
}

export default class SnapshotReader extends Reader {
  constructor(byteArray: ArrayBuffer) {
    super(byteArray, Float32Array.BYTES_PER_ELEMENT)
  }

  public parse() {
    const then = Date.now()
    const result = this._parseAndMerge()
    console.log('SnapshotReader: parsing ' + result.length + ' snapshots took: ' + (Date.now() - then) + 'ms')
    return result
  }

  private _parseAndMerge() {
    const snapshots = []

    while (this.position < this.size) {
      const time = this.getFloat32AndIncrementPosition()
      const numberOfPositions = this.getFloat32AndIncrementPosition() / 3

      const snapshot = this._createEmptySnapshot(numberOfPositions)
      snapshot.time = time

      let positionsIndex = 0
      let prevIdIndex = 0
      let idIndex = 0

      let prevSnapshot: Snapshot

      if (snapshots.length > 0) {
        prevSnapshot = snapshots[snapshots.length - 1]
      }

      this.parseArray(numberOfPositions, 1, () => {
        // write the data for the current snapshot
        const x = this.getFloat32AndIncrementPosition()
        const y = this.getFloat32AndIncrementPosition()
        snapshot.position[positionsIndex + 0] = x
        snapshot.position[positionsIndex + 1] = y
        snapshot.position[positionsIndex + 2] = this.z

        const id = this.getFloat32AndIncrementPosition()
        snapshot.ids[idIndex] = id

        // initialize default values for interpolation
        snapshot.nextPosition[positionsIndex + 0] = 0
        snapshot.nextPosition[positionsIndex + 1] = 0
        snapshot.nextPosition[positionsIndex + 2] = 0
        snapshot.shouldInterpolate[idIndex] = -1

        // do the interpolation stuff for the previous snapshot if there is one
        if (prevSnapshot && prevIdIndex < prevSnapshot.ids.length) {
          // compare ids
          let prevId = prevSnapshot.ids[prevIdIndex]

          while (prevId < id && prevIdIndex < prevSnapshot.ids.length - 1) {
            // this id has no corresponding id in the previous snapshot skip to the next previous id
            prevIdIndex++
            prevId = prevSnapshot.ids[prevIdIndex]
          }

          // this position has a corresponding id in the previous snapshot
          // set the interpolation indicator to true and copy values of this position into
          // the previous snapshot's nextPosition
          if (id === prevId) {
            prevSnapshot.shouldInterpolate[prevIdIndex] = 1
            prevSnapshot.nextPosition[prevIdIndex * 3 + 0] = x
            prevSnapshot.nextPosition[prevIdIndex * 3 + 1] = y
            prevSnapshot.nextPosition[prevIdIndex * 3 + 2] = this.z
            prevIdIndex++
          }
          // if 'prevId' is greater than 'id' don't do anything
        }

        positionsIndex += 3
        idIndex++
      })
      snapshots.push(snapshot)
    }
    return snapshots
  }

  private _createEmptySnapshot(numberOfPositions: number): Snapshot {
    return {
      time: 0,
      position: new Float32Array(numberOfPositions * 3),
      nextPosition: new Float32Array(numberOfPositions * 3),
      ids: new Float32Array(numberOfPositions),
      shouldInterpolate: new Float32Array(numberOfPositions),
    }
  }
}
