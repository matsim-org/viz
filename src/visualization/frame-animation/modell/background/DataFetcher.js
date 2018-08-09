import AsyncWorkerConnector from './AsyncWorkerConnector'
import BackgroundWorker from './DataFetcher.worker'
import { INITIALIZE, GET_CONFIG, GET_NETWORK_DATA, GET_SNAPSHOT_DATA, GET_PLAN } from './Contracts'

/*
  The typescript compiler complains that BackgroundWorker is not a module if this is a tpyescript module.
  Until the described problem is solved this part of the worker implementation has to stay javascript, since
  javascript doesn't care about anything
*/
export default class DataFetcher extends AsyncWorkerConnector {
  constructor() {
    super(new BackgroundWorker())
  }

  static async create(params) {
    let fetcher = new DataFetcher()
    await fetcher.initialize(params)
    return fetcher
  }

  async initialize(params) {
    await this.postAsyncWorkerMessage(INITIALIZE, params)
  }

  async fetchServerConfig() {
    return this.postAsyncWorkerMessage(GET_CONFIG, {})
  }

  async fetchNetwork() {
    return this.postAsyncWorkerMessage(GET_NETWORK_DATA, {})
  }

  async fetchSnapshots(params) {
    return this.postAsyncWorkerMessage(GET_SNAPSHOT_DATA, params)
  }

  async fetchPlan(params) {
    return this.postAsyncWorkerMessage(GET_PLAN, params)
  }
}
