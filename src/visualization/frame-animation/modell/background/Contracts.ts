interface MethodCall {
  method: string
  parameters: any
}

interface AsyncMessage {
  id: string
}

interface AsyncResult extends AsyncMessage {
  type: string
}

interface AsyncMethodCall extends AsyncMessage {
  call: MethodCall
}

interface MethodResult {
  data: any
  transferrables?: any[]
}

interface AsyncMethodResult extends AsyncResult {
  result: MethodResult
}

interface AsyncError extends AsyncResult {
  error: any
}
const INITIALIZE = 'initialize'
const TYPE_ERROR = 'error'
const TYPE_RESULT = 'result'

const GET_SNAPSHOT_DATA = 'getSnapshotData'
const GET_NETWORK_DATA: string = 'getNetworkData'
const GET_CONFIG: string = 'getConfig'
const GET_PLAN: string = 'getPlan'

const PARSE_GEO_JSON = 'parseGeoJson'
export {
  MethodCall,
  AsyncMessage,
  AsyncResult,
  AsyncMethodCall,
  AsyncMethodResult,
  AsyncError,
  MethodResult,
  INITIALIZE,
  TYPE_ERROR,
  TYPE_RESULT,
  GET_SNAPSHOT_DATA,
  GET_NETWORK_DATA,
  GET_CONFIG,
  GET_PLAN,
  PARSE_GEO_JSON,
}
