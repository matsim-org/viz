import EventsAnimationAPI, { ServerConfiguration } from './EventsAnimationAPI'
import LinkTripReader, { LinkTripAsFloat32 } from './reader/LinkTripReader'

export default class LinkTripsStore {
  private api: EventsAnimationAPI
  private linkTrips?: LinkTripAsFloat32

  get LinkTrips() {
    return this.linkTrips
  }

  constructor(api: EventsAnimationAPI, config: ServerConfiguration) {
    this.api = api
    this.startFetching(config)
  }

  private async startFetching(config: ServerConfiguration) {
    const linkTrips = await this.api.fetchLinkTrips(config.firstTimestep, config.firstTimestep + 10000)
    console.log('received ' + linkTrips.length + ' link trips')
    this.linkTrips = new LinkTripReader(linkTrips).parse()
    console.log('parsed link trips')
  }
}
