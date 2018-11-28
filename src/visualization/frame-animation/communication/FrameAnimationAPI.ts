enum Progress {
  Downloading = 'Downloading',
  Processing = 'Processing',
  Done = 'Done',
  Failed = 'Failed',
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
  private accessToken: string

  constructor(endpoint: string, vizId: string, accessToken: string) {
    this.endpoint = new URL(endpoint + `/${vizId}`)
    this.accessToken = accessToken
  }

  public async fetchConfiguration(): Promise<ServerConfiguration> {
    return this.fetchJson(this.endpoint + FrameAnimationAPI.CONFIGURATION)
  }

  public async fetchNetwork(): Promise<ArrayBuffer> {
    return this.fetchArrayBuffer(this.endpoint + FrameAnimationAPI.NETWORK)
  }

  public async fetchSnapshots(params: SnapshotRequestParams): Promise<ArrayBuffer> {
    const url = new URL(this.endpoint.toString() + FrameAnimationAPI.SNAPSHOTS)
    url.searchParams.set('fromTimestep', params.fromTimestep.toString())
    url.searchParams.set('numberOfTimesteps', params.size.toString())
    url.searchParams.set('speedFactor', params.speedFactor.toString())

    return this.fetchArrayBuffer(url.toString())
  }

  public async fetchPlan(index: number): Promise<any> {
    const url = new URL(this.endpoint.toString() + FrameAnimationAPI.PLAN)
    url.searchParams.set('index', index.toString())

    return this.fetchJson(url.toString())
  }

  private async fetchArrayBuffer(endpoint: string): Promise<ArrayBuffer> {
    return this.fetch(endpoint, response => Promise.resolve(response.arrayBuffer()))
  }

  private async fetchJson(endpoint: string) {
    return this.fetch(endpoint, response => response.json())
  }

  private async fetch<T>(endpoint: string, retreiveResponse: (response: Response) => Promise<T>): Promise<T> {
    const headers = new Headers()
    headers.append('Authorization', 'Bearer ' + this.accessToken)
    const result = await fetch(endpoint, {
      mode: 'cors',
      headers: headers,
    })

    if (result.ok) return retreiveResponse(result)
    else if (result.status === 401) throw new Error('Unauthorized')
    else throw new Error(await result.text())
  }
}

export { Progress, ServerConfiguration, Rect, SnapshotRequestParams }
