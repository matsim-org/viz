import AsyncBackgroundWorker, {
  MethodCall,
  MethodResult,
} from '@/visualization/frame-animation/modell/background/AsyncBackgroundWorker'
import FrameAnimationAPI, {
  SnapshotRequestParams,
} from '@/visualization/frame-animation/communication/FrameAnimationAPI'
import SnapshotReader, { Snapshot } from '@/visualization/frame-animation/contracts/SnapshotReader'
import { InitParams, MethodNames } from '@/visualization/frame-animation/modell/background/SnapshotFetcherContract'

class SnapshotFetcher extends AsyncBackgroundWorker {
  private api!: FrameAnimationAPI

  public handleInitialize(call: MethodCall) {
    const params = call.parameters as InitParams
    this.api = new FrameAnimationAPI(params.dataUrl, params.vizId)
  }

  public async handleMethodCall(call: MethodCall): Promise<MethodResult> {
    switch (call.method) {
      case MethodNames.FetchSnapshots:
        return this.fetchSnapshots(call.parameters as SnapshotRequestParams)
      default:
        throw new Error('No method with name: ' + call.method)
    }
  }

  private async fetchSnapshots(params: SnapshotRequestParams): Promise<MethodResult> {
    const response = await this.api.fetchSnapshots(params)
    const snapshots = new SnapshotReader(response).parse()
    const transferrables: ArrayBuffer[] = []

    snapshots.forEach((snapshot: Snapshot) => {
      transferrables.push(snapshot.position.buffer as ArrayBuffer)
      transferrables.push(snapshot.nextPosition.buffer as ArrayBuffer)
      transferrables.push(snapshot.shouldInterpolate.buffer as ArrayBuffer)
      transferrables.push(snapshot.ids.buffer as ArrayBuffer)
    })

    return { data: snapshots, transferrables: transferrables }
  }
}

// make Typescript compiler happy when importing this module
export default null as any

// bootstrap worker when file is loaded
const worker = new SnapshotFetcher()
