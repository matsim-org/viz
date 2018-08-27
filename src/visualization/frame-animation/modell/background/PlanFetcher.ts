import AsyncWorkerConnector from '@/visualization/frame-animation/modell/background/AsyncWorkerConnector'
import BackgroundWorker from '@/visualization/frame-animation/modell/background/PlanFetcher.worker'
import {
  InitParams,
  PlanRequestParams,
  MethodNames,
} from '@/visualization/frame-animation/modell/background/PlanFetcherContract'
import { INITIALIZE } from '@/visualization/frame-animation/modell/background/AsyncBackgroundWorker'

export default class PlanFetcher extends AsyncWorkerConnector {
  constructor() {
    super(new BackgroundWorker())
  }

  public static async create(params: InitParams) {
    const fetcher = new PlanFetcher()
    await fetcher.initialize(params)
    return fetcher
  }

  public async fetchPlan(params: PlanRequestParams) {
    return this.postAsyncWorkerMessage(MethodNames.FetchPlan, params)
  }

  private async initialize(params: InitParams) {
    await this.postAsyncWorkerMessage(INITIALIZE, params)
  }
}
