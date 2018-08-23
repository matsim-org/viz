import AsyncWorkerConnector from '@/visualization/frame-animation/modell/background/AsyncWorkerConnector'
import BackgroundWorker, {
  InitParams,
  GetPlanParams,
} from '@/visualization/frame-animation/modell/background/DataFetcher.worker'
import {
  INITIALIZE,
  GET_CONFIG,
  GET_NETWORK_DATA,
  GET_SNAPSHOT_DATA,
  GET_PLAN,
} from '@/visualization/frame-animation/modell/background/Contracts'
import {
  ServerConfiguration,
  SnapshotRequestParams,
} from '@/visualization/frame-animation/communication/FrameAnimationAPI'
import { Snapshot } from '@/visualization/frame-animation/contracts/SnapshotReader'

export default class DataFetcher extends AsyncWorkerConnector {
  constructor() {
    super(new BackgroundWorker())
  }

  public static async create(params: InitParams) {
    const fetcher = new DataFetcher()
    await fetcher.initialize(params)
    return fetcher
  }

  public async fetchServerConfig(): Promise<ServerConfiguration> {
    return this.postAsyncWorkerMessage<ServerConfiguration>(GET_CONFIG, {})
  }

  public async fetchNetwork(): Promise<Float32Array> {
    return this.postAsyncWorkerMessage<Float32Array>(GET_NETWORK_DATA, {})
  }

  public async fetchSnapshots(params: SnapshotRequestParams): Promise<Snapshot[]> {
    return this.postAsyncWorkerMessage<Snapshot[]>(GET_SNAPSHOT_DATA, params)
  }

  public async fetchPlan(params: GetPlanParams) {
    return this.postAsyncWorkerMessage(GET_PLAN, params)
  }

  private async initialize(params: InitParams) {
    await this.postAsyncWorkerMessage(INITIALIZE, params)
  }
}
