enum Progress {
  Downloading = 'Downloading',
  Processing = 'Processing',
  Done = 'Done',
}

interface ServerConfiguration {
  firstTimestep: number
  lastTimestep: number
  timestepSize: number
  bounds: Rect
  progress: Progress
}

interface Rect {
  left: number
  right: number
  top: number
  bottom: number
}

interface SnapshotRequestParams {
  fromTimestep: number
  size: number
  speedFactor: number
}

export default class FrameAnimationAPI {
  private static CONFIGURATION = '/configuration'
  private static NETWORK = '/network'
  private static SNAPSHOTS = '/snapshots'
  private static PLAN = '/plan'

  private endpoint: URL

  constructor(endpoint: URL, vizId: string) {
    this.endpoint = new URL(endpoint + `/${vizId}`)
  }

  public async fetchConfiguration(): Promise<ServerConfiguration> {
    let result = await fetch(this.endpoint + FrameAnimationAPI.CONFIGURATION, {
      mode: 'cors',
    })

    if (result.ok) return await result.json()
    else throw new Error(await result.text())
  }

  public async fetchNetwork(): Promise<ArrayBuffer> {
    let result = await fetch(this.endpoint + FrameAnimationAPI.NETWORK, {
      mode: 'cors',
    })

    if (result.ok) return await result.arrayBuffer()
    else throw new Error(await result.text())
  }

  public async fetchSnapshots(params: SnapshotRequestParams): Promise<ArrayBuffer> {
    let url = new URL(this.endpoint.toString() + FrameAnimationAPI.SNAPSHOTS)
    url.searchParams.set('fromTimestep', params.fromTimestep.toString())
    url.searchParams.set('numberOfTimesteps', params.size.toString())
    url.searchParams.set('speedFactor', params.speedFactor.toString())

    let result = await fetch(url.toString(), { mode: 'cors' })

    if (result.ok) return result.arrayBuffer()
    else throw new Error(await result.text())
  }

  public async fetchPlan(index: number): Promise<any> {
    let url = new URL(this.endpoint.toString() + FrameAnimationAPI.PLAN)
    url.searchParams.set('index', index.toString())

    let result = await fetch(url.toString(), { mode: 'cors' })

    if (result.ok) return result.json()
    else throw new Error(await result.text())
  }
}

export { Progress, ServerConfiguration, Rect, SnapshotRequestParams }
