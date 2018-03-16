import { DataProvider } from './DataProvider.js';
import Configuration from '../contracts/Configuration.js';

class Playback {
  get currentTimestep () {
    return this._currentTimestep;
  }

  get timestepFraction () {
    return this._timestepFraction;
  }

  set speedFactor (value) {
    if (this._shouldRelaodShansphots(value)) {
      this.dataProvider.clearCache();
    }
    this.dataProvider.speedFactor = value;
    this._speedFactor = value;
    this._timestepFraction = 0.0;
  }

  get speedFactor () {
    return this._speedFactor;
  }

  set onTimestepChanged (callback) {
    this._onTimestepChanged = callback;
  }

  constructor (dataProvider) {
    this._config = Configuration.getConfig();
    this._config.subscribeServerConfigUpdated(() => this._onServerConfigUpdated());

    this._speedFactor = 1.0;
    this.dataProvider = dataProvider;
    this.dataProvider.speedFactor = this._speedFactor;

    this._timestepFraction = 0;
    let fps = 60;
    this.timeBetweenFrames = 1000 / fps; // something like 16.7 ms for 60fps
  }

  _onServerConfigUpdated () {
    this._currentTimestep = this._config.firstTimestep;
    this.firstTimestep = this._config.firstTimestep;
    this.lastTimestep = this._config.lastTimestep;
    this.timestepSize = this._config.timestepSize;
  }

  shouldLoadNewSnapshot () {
    return (this.timestepFraction === 0);
  }

  getSnapshotForCurrentTimestep () {
    // 1. Serve positions
    let snapshot = this.dataProvider.getSnapshot(this.currentTimestep);
    if (!snapshot.time) {
      // return empty data
      snapshot = {
        position: new Float32Array(0),
        nextPosition: new Float32Array(0),
        shouldInterpolate: new Float32Array(0),
        ids: new Float32Array(0),
      };
    }
    return snapshot;
  }

  incrementTime () {
    if (this.dataProvider.lastCachedTimestep > this.currentTimestep &&
            this.currentTimestep >= this.dataProvider.firstCachedTimestep) {
      this._incrementCurrentTime();
    } else if (this._reachedEndOfPlayback(this.currentTimestep)) {
      this._resetToFirstTimestep();
    }
  }

  seekTimestep (timestep) {
    if (timestep > this.lastTimestep || timestep < this.firstTimestep) {
      timestep = this.firstTimestep;
    }

    if (timestep < this.dataProvider.firstCachedTimestep) {
      this.dataProvider.clearCache();
    }
    let modulo = timestep % this.timestepSize;
    this._setCurrentTime(timestep - modulo);
  }

  isBuffering () {
    return this.dataProvider.isFetchingData();
  }

  destroy () {
    this._onTimestepChanged = null;
  }

  _incrementCurrentTime () {
    let currentTime = this.currentTimestep + this.timestepFraction * this.timestepSize;
    let nextTime = currentTime + this.timestepSize * this._speedFactor;
    let newFraction = (nextTime - this.currentTimestep) / this.timestepSize;

    if (newFraction >= 1.0) {
      this._incrementCurrentTimestep();
      this._timestepFraction = 0.0;
    } else {
      this._timestepFraction = newFraction;
    }
  }

  _incrementCurrentTimestep () {
    let nextTimestep = 0;

    if (this._speedFactor >= 1.0) {
      nextTimestep = this.currentTimestep + this.timestepSize * this._speedFactor;
    } else {
      nextTimestep = this.currentTimestep + this.timestepSize;
    }

    if (this._reachedEndOfPlayback(nextTimestep)) {
      this._resetToFirstTimestep();
    } else {
      this._setCurrentTimestep(nextTimestep);
    }
  }

  _setCurrentTime (value) {
    this._timestepFraction = 0;
    this._setCurrentTimestep(value);
  }

  _setCurrentTimestep (value) {
    this._currentTimestep = value;
    if (this._onTimestepChanged) {
      this._onTimestepChanged(this._currentTimestep);
    }
  }

  _shouldRelaodShansphots (newSpeedFactor) {
    return (this._speedFactor > 1.0 || newSpeedFactor > 1.0);
  }

  _reachedEndOfPlayback (timestep) {
    return (timestep + this.timestepSize * this._speedFactor > this.lastTimestep);
  }

  _resetToFirstTimestep () {
    this._setCurrentTime(this.firstTimestep);
    this.dataProvider.clearCache();
  }
}

export { Playback };
