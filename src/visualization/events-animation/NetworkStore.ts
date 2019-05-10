import EventsAnimationAPI from './EventsAnimationAPI'
import NetworkReader from './reader/NetworkReader'

export default class NetworkStore {
  private api: EventsAnimationAPI
  private network?: Float32Array

  constructor(api: EventsAnimationAPI) {
    this.api = api
  }

  public async getNetwork() {
    if (!this.network) {
      const buffer = await this.api.fetchNetwork()
      this.network = new NetworkReader(buffer).parse()
    }
    return this.network
  }
}
