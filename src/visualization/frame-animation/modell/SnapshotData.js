class SnapshotData {
  get firstTimestep() {
    if (this._hasSnapshots()) {
      return this.snapshots[0].time
    }
    return 0
  }

  get lastTimestep() {
    if (this._hasSnapshots()) {
      return this.snapshots[this.snapshots.length - 1].time
    }
    return 0
  }

  constructor(timestepSize) {
    this.timestepSize = timestepSize
    this.snapshots = []
  }

  addSnapshotsAndForgetOldOnes(data, smallestTimestepToKeepCached, speedFactor) {
    // there was a jump in on the timeline, so all cached snapshots can be deleted
    if (this.snapshots.length === 0 || smallestTimestepToKeepCached > this.lastTimestep) {
      this.snapshots = data
    } else if (data.length > 0) {
      // otherwise we can forget older snapshots and append the newly loaded snapshots
      let firstTimestepToAppend = data[0].time
      let indexToKeep = this._getIndexForTimestep(smallestTimestepToKeepCached, speedFactor)
      let dataToAppend

      if (!this._canTimestepBeAppended(firstTimestepToAppend)) {
        dataToAppend = this._makeSnapshotsAppendable(data)
      } else {
        dataToAppend = data
      }

      if (dataToAppend) {
        // remove the last snaphot, since we'll get a new one
        this.snapshots.splice(this.snapshots.length - 1, 1)

        // get rid of old snapshots and concatenate the new ones
        this.snapshots = this.snapshots.slice(indexToKeep).concat(data)
      } else {
        throw new Error(
          'new Data didn"t fit lastTimestep: ' + this.lastTimestep + ' first new timestep: ' + firstTimestepToAppend
        )
      }
    }
  }

  getSnapshot(timestep, speedFactor) {
    // ensure timeststep is within bounds
    if (this.firstTimestep - 0.0001 > timestep || this.lastTimestep + 0.0001 < timestep) {
      throw new RangeError('timestep: ' + timestep + ' was not within chached timespan')
    }

    if (speedFactor < 1.0) {
      throw new RangeError('speedFactor must not be smaller than 1.0 but was: ' + speedFactor)
    }
    // calculate index
    let index = this._getIndexForTimestep(timestep, speedFactor)
    return this.snapshots[Math.floor(index)]
  }

  hasSnapshotFor(timestep) {
    return this.firstTimestep <= timestep && this.lastTimestep >= timestep
  }

  clearSnapshots() {
    this.snapshots = []
  }

  _getIndexForTimestep(timestep, speedFactor) {
    let index = (timestep - this.firstTimestep) / this.timestepSize / speedFactor

    if (index < 0) {
      index = 0
    }
    return index
  }

  _canTimestepBeAppended(timestep) {
    // timestep must be the same as last timestep
    return this.lastTimestep + 0.0001 > timestep && this.lastTimestep - 0.0001 < timestep
  }

  _makeSnapshotsAppendable(data) {
    for (let i = 0; i < data.length; i++) {
      if (this._canTimestepBeAppended(data[i].time)) {
        return data.slice(i)
      }
    }
    return undefined
  }

  _hasSnapshots() {
    return this.snapshots.length > 0
  }
}

export { SnapshotData }
