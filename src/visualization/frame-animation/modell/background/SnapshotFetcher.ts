import AsyncWorkerConnector from '@/visualization/frame-animation/modell/background/AsyncWorkerConnector'
import BackgroundWorker from '@/visualization/frame-animation/modell/background/SnapshotFetcher.worker'
import { INITIALIZE } from '@/visualization/frame-animation/modell/background/Contracts'
import { SnapshotRequestParams } from '@/visualization/frame-animation/communication/FrameAnimationAPI'
import { Snapshot } from '@/visualization/frame-animation/contracts/SnapshotReader'
import { InitParams, MethodNames } from '@/visualization/frame-animation/modell/background/SnapshotFetcherContract'

export default class SnapshotFetcher extends AsyncWorkerConnector {
  constructor() {
    super(new BackgroundWorker())
  }

  public static async create(params: InitParams) {
    const fetcher = new SnapshotFetcher()
    await fetcher.initialize(params)
    return fetcher
  }

  public async fetchSnapshots(params: SnapshotRequestParams) {
    return this.postAsyncWorkerMessage<Snapshot[]>(MethodNames.FetchSnapshots, params)
  }

  private async initialize(params: InitParams) {
    await this.postAsyncWorkerMessage(INITIALIZE, params)
  }
}
