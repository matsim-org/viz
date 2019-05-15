import AsyncWorkerConnector from '@/visualization/frame-animation/modell/background/AsyncWorkerConnector'
import { INITIALIZE } from '@/visualization/frame-animation/modell/background/AsyncBackgroundWorker'

import BackgroundWorker from './MyWorker.worker'
import { InitParams, MethodNames } from './MyWorkerContract'

export default class MyWorker extends AsyncWorkerConnector {
  constructor() {
    super(new BackgroundWorker())
  }

  public static async create(params: InitParams) {
    console.log('<< WORKER __ Create called!')
    const worker = new MyWorker()
    await worker.initialize(params)
    return worker
  }

  public async loadData() {
    // no data, everything is in init
    return this.postAsyncWorkerMessage(MethodNames.LoadData, {})
  }

  private async initialize(params: InitParams) {
    await this.postAsyncWorkerMessage(INITIALIZE, params)
  }
}
