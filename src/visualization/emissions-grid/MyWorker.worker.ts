import AsyncBackgroundWorker, {
  MethodCall,
  MethodResult,
} from '@/visualization/frame-animation/modell/background/AsyncBackgroundWorker'

import { InitParams, MethodNames } from './MyWorkerContract'
import globalConfig from '@/config/Config'

class MyWorker extends AsyncBackgroundWorker {
  private params!: InitParams

  public handleInitialize(call: MethodCall) {
    this.params = call.parameters as InitParams
  }

  public async handleMethodCall(call: MethodCall): Promise<MethodResult> {
    switch (call.method) {
      case MethodNames.FetchEmissionsData:
        return this.fetchEmissionsData()
      default:
        throw new Error('No method with name ' + call.method)
    }
  }

  private async fetchEmissionsData() {
    console.log({ WORKER_STARTING_UP: this.params })

    const allResults: any = { timeBins: [] }

    for (const startTime of this.params.bins) {
      const result = await this.fetchEmissionsDataForStartTime(startTime)
      const bin = { startTime, value: result }
      allResults.timeBins.push(bin)
    }
    console.log({ WORKER_DONE: allResults })

    return { data: allResults }
  }

  private async fetchEmissionsDataForStartTime(startTime: number): Promise<any> {
    console.log('fetching startTime ' + startTime)

    const result = await fetch(this.params.url + startTime, {
      mode: 'cors',
      headers: { Authorization: 'Bearer ' + this.params.accessToken },
    })

    if (result.ok) {
      try {
        const thing = await result.json()
        return thing
      } catch (e) {
        throw new Error(e)
      }
    } else if (result.status === 401) {
      throw new Error('Unauthorized: ' + (await result.text()))
    } else {
      throw new Error(await result.text())
    }
  }
}

// make the typescript compiler happy on import
export default null as any

// bootstrap when worker is loaded
const worker = new MyWorker()
