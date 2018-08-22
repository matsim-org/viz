import AsyncWorkerConnector from '@/visualization/frame-animation/modell/background/AsyncWorkerConnector'
import BackgroundWorker, { ParseParams } from '@/visualization/frame-animation/modell/background/GeoJsonParser.worker'
import { PARSE_GEO_JSON, INITIALIZE } from '@/visualization/frame-animation/modell/background/Contracts'

export default class GeoJsonParser extends AsyncWorkerConnector {
  constructor() {
    super(new BackgroundWorker())
  }

  public static async cretae() {
    const parser = new GeoJsonParser()
    await parser.initialize()
    return parser
  }

  public async parseGeoJson(params: ParseParams) {
    return this.postAsyncWorkerMessage(PARSE_GEO_JSON, params)
  }

  private async initialize() {
    this.postAsyncWorkerMessage(INITIALIZE, {})
  }
}
