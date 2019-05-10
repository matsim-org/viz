enum Progress {
  Downloading = 'Downloading',
  Processing = 'Processing',
  Done = 'Done',
  Failed = 'Failed',
}

export interface ServerConfiguration {
  firstTimestep: number
  lastTimestep: number
  left: number
  right: number
  top: number
  bottom: number
  progress: Progress
}

export default class EventsAnimationAPI {
  private endpoint: URL
  private accessToken: string

  constructor(endpoint: URL, vizId: string, accessToken: string) {
    this.endpoint = new URL(endpoint + vizId)
    this.accessToken = accessToken
  }

  public async fetchConfiguration(): Promise<ServerConfiguration> {
    return this.fetchJson(this.endpoint + '/configuration')
  }

  public async fetchNetwork(): Promise<ArrayBuffer> {
    return this.fetchArrayBuffer(this.endpoint + '/network')
  }

  private async fetchArrayBuffer(endpoint: string): Promise<ArrayBuffer> {
    return this.fetch(endpoint, response => response.arrayBuffer())
  }

  private async fetchJson(endpoint: string) {
    return this.fetch(endpoint, response => response.json())
  }

  private async fetch<T>(endpoint: string, retreiveResponse: (response: Response) => Promise<T>) {
    const result = await fetch(endpoint, {
      mode: 'cors',
      headers: {
        Authorization: 'Bearer ' + this.accessToken,
      },
    })

    if (result.ok) return retreiveResponse(result)
    else if (result.status === 401) throw new Error('Unauthorized')
    else throw new Error(await result.text())
  }
}
