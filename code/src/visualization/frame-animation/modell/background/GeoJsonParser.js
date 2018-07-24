import AsyncWorkerConnector from './AsyncWorkerConnector'
import BackgroundWorker from './GeoJsonParser.worker'
import { PARSE_GEO_JSON, INITIALIZE } from './Contracts'

export default class GeoJsonParser extends AsyncWorkerConnector {
  constructor() {
    super(new BackgroundWorker())
  }

  async _initialize() {
    this.postAsyncWorkerMessage(INITIALIZE, {})
  }

  async parseGeoJson(params) {
    return this.postAsyncWorkerMessage(PARSE_GEO_JSON, params)
  }

  static async cretae() {
    let parser = new GeoJsonParser()
    await parser._initialize()
    return parser
  }
}
