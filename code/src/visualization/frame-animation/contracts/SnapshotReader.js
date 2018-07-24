import { Reader } from './Reader.js'

class SnapshotReader extends Reader {
  constructor(byteArray) {
    super(byteArray, Float32Array.BYTES_PER_ELEMENT)
    this.z = 0
  }

  parse() {
    let then = Date.now()
    let result = this._parseAndMerge()
    console.log('SnapshotReader: parsing ' + result.length + ' snapshots took: ' + (Date.now() - then) + 'ms')
    return result
  }

  _parseAndMerge() {
    let snapshots = []

    while (this.position < this.size) {
      let time = this.getFloat32AndIncrementPosition()
      let numberOfPositions = this.getFloat32AndIncrementPosition() / 3

      let snapshot = this._createEmptySnapshot(numberOfPositions)
      snapshot.time = time

      let positionsIndex = 0
      let prevIdIndex = 0
      let idIndex = 0

      let prevSnapshot

      if (snapshots.length > 0) {
        prevSnapshot = snapshots[snapshots.length - 1]
      }

      this.parseArray(numberOfPositions, 1, () => {
        // write the data for the current snapshot
        let x = this.getFloat32AndIncrementPosition()
        let y = this.getFloat32AndIncrementPosition()
        snapshot.position[positionsIndex + 0] = x
        snapshot.position[positionsIndex + 1] = y
        snapshot.position[positionsIndex + 2] = this.z

        let id = this.getFloat32AndIncrementPosition()
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

  _createEmptySnapshot(numberOfPositions) {
    return {
      time: 0,
      position: new Float32Array(numberOfPositions * 3),
      nextPosition: new Float32Array(numberOfPositions * 3),
      ids: new Float32Array(numberOfPositions),
      shouldInterpolate: new Float32Array(numberOfPositions),
    }
  }
}

export { SnapshotReader }
