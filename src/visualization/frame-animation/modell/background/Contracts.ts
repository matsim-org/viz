interface MethodCall {
  method: string
  parameters: any
}

interface Message {
  type: string
  name: string
  message: any
}
const INITIALIZE = 'initialize'
const TYPE_EVENT = 'event'
const TYPE_ERROR = 'error'

const GET_SNAPSHOT_DATA = 'getSnapshotData'
const GET_NETWORK_DATA: string = 'getNetworkData'
const GET_CONFIG: string = 'getConfig'
const GET_PLAN: string = 'getPlan'

const EVENT_CONFIG_RECEIVED = 'configReceived'
const EVENT_SNAPSHOTS_RECEIVED = 'snapshotsReceived'
const EVENT_NETWORK_RECEIVED = 'networkReceived'
const EVENT_PLAN_RECEIVED = 'planReceived'

const PARSE_GEO_JSON = 'parseGeoJson'
const EVENT_GEO_JSON_PARSED = 'geoJsonParsed'
export {
  MethodCall,
  Message,
  INITIALIZE,
  TYPE_EVENT,
  TYPE_ERROR,
  GET_SNAPSHOT_DATA,
  GET_NETWORK_DATA,
  GET_CONFIG,
  GET_PLAN,
  EVENT_CONFIG_RECEIVED,
  EVENT_NETWORK_RECEIVED,
  EVENT_SNAPSHOTS_RECEIVED,
  EVENT_PLAN_RECEIVED,
  PARSE_GEO_JSON,
  EVENT_GEO_JSON_PARSED,
}
