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
    const fetcher = new MyWorker()
    await fetcher.initialize(params)
    return fetcher
  }

  public async fetchXML() {
    return this.postAsyncWorkerMessage(MethodNames.FetchXML, {}) // no data, everything is in init
  }

  private async initialize(params: InitParams) {
    await this.postAsyncWorkerMessage(INITIALIZE, params)
  }
}
