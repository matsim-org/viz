import AsyncWorkerConnector from '@/visualization/frame-animation/modell/background/AsyncWorkerConnector'
import BackgroundWorker, {
  InitParams,
  GetSnapshotParams,
  GetPlanParams,
} from '@/visualization/frame-animation/modell/background/DataFetcher.worker'
import {
  INITIALIZE,
  GET_CONFIG,
  GET_NETWORK_DATA,
  GET_SNAPSHOT_DATA,
  GET_PLAN,
} from '@/visualization/frame-animation/modell/background/Contracts'

export default class DataFetcher extends AsyncWorkerConnector {
  constructor() {
    super(new BackgroundWorker())
  }

  public static async create(params: InitParams) {
    const fetcher = new DataFetcher()
    await fetcher.initialize(params)
    return fetcher
  }

  public async fetchServerConfig() {
    return this.postAsyncWorkerMessage(GET_CONFIG, {})
  }

  public async fetchNetwork() {
    return this.postAsyncWorkerMessage(GET_NETWORK_DATA, {})
  }

  public async fetchSnapshots(params: GetSnapshotParams) {
    return this.postAsyncWorkerMessage(GET_SNAPSHOT_DATA, params)
  }

  public async fetchPlan(params: GetPlanParams) {
    return this.postAsyncWorkerMessage(GET_PLAN, params)
  }

  private async initialize(params: InitParams) {
    await this.postAsyncWorkerMessage(INITIALIZE, params)
  }
}
