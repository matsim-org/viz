import AsyncWorkerConnector from '@/visualization/frame-animation/modell/background/AsyncWorkerConnector'
import BackgroundWorker from '@/visualization/frame-animation/modell/background/GeoJsonParser.worker'
import { INITIALIZE } from '@/visualization/frame-animation/modell/background/AsyncBackgroundWorker'
import { ParseParams, MethodNames } from '@/visualization/frame-animation/modell/background/GeoJsonParserContract'

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
    return this.postAsyncWorkerMessage(MethodNames.ParseGeoJson, params)
  }

  private async initialize() {
    this.postAsyncWorkerMessage(INITIALIZE, {})
  }
}
