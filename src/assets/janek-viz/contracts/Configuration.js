
class Config {
  constructor (parameters) {
    this._setCanvasId(parameters.canvasId);
    this._setColors(parameters.colors);
    this._setBackendUrl(parameters.dataUrl);
    this._setCache(parameters.cache);
    this._listeners = [];
  }

  destroy () {
    this._listeners = null;
  }

  subscribeServerConfigUpdated (callback) {
    this._listeners.push(callback);
  }

  unsubscribeServerConfigUpdated (callback) {
    let index = this._listeners.indexOf(callback);
    this._listeners.splice(index, 1);
  }

  _broadCastServerConfigUpdated () {
    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i]();
    }
  }

  _setCanvasId (id) {
    this.canvasId = id || 'canvas';
  }

  _setColors (colors) {
    if (!colors) {
      colors = {};
    }

    this.colors = {
      background: colors.background ? colors.background : 0xECF0F1,
      network: colors.network ? colors.network : 0x2C3E50,
      agents: colors.agents ? colors.agents : 0x3498DB,
      selectedAgent: colors.selectedAgent ? colors.selectedAgent : 0xE74C3C,
      selectedPlan: colors.selectedPlan ? colors.selectedPlan : 0xE74C3C,
    };
  }

  _setBackendUrl (url) {
    this.dataUrl = url || 'http://localhost:3001/';
  }

  _setCache (cache) {
    if (!cache) {
      cache = {};
    }
    this.cache = {
      cachedSnapshots: cache.cachedSnapshots ? cache.cachedSnapshots : 1200,
      minRequestSize: cache.minRequestSize ? cache.minRequestSize : 100,
      oldSnapshotsToKeep: cache.oldSnapshotsToKeep ? cache.oldSnapshotsToKeep : 900,
    }
  }

  _updateServerConfig (parameters) {
    this.firstTimestep = parameters.firstTimestep;
    this.lastTimestep = parameters.lastTimestep;
    this.timestepSize = parameters.timestepSize;
    this.bounds = parameters.bounds;
    this._broadCastServerConfigUpdated();
  }
}

let instance;

let Configuration = {
  createConfiguration: (parameters) => {
    instance = new Config(parameters);
  },

  updateServerConfiguration: (parameters) => {
    instance._updateServerConfig(parameters);
  },

  getConfig: () => {
    if (!instance) {
      throw Error('configuration was not created yet');
    }
    return instance;
  }

};

export default Configuration;
