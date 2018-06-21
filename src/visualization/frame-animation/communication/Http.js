class Http {
  static URLPATH_NETWORK() {
    return 'network'
  }
  static URLPATH_SNAPSHOTS() {
    return 'snapshots'
  }
  static URLPATH_PLAN() {
    return 'plan'
  }
  static URLPATH_CONFIGURATION() {
    return 'configuration'
  }
  static STATUS_OK() {
    return 200
  }
  static RESPONSETYPE_TEXT() {
    return 'text'
  }
  static RESPONSETYPE_BUFFER() {
    return 'arraybuffer'
  }

  constructor(dataUrl) {
    this._dataUrl = dataUrl
  }

  getConfigData(parameters, success, error) {
    let url = this._dataUrl + Http.URLPATH_CONFIGURATION()
    this.makePostRequest(url, parameters, Http.RESPONSETYPE_TEXT(), success, error)
  }

  getNetworkData(parameters, success, error) {
    let url = this._dataUrl + Http.URLPATH_NETWORK()
    this.makePostRequest(url, parameters, Http.RESPONSETYPE_BUFFER(), success, error)
  }

  getSnapshotData(parameters, success, error) {
    let url = this._dataUrl + Http.URLPATH_SNAPSHOTS()
    this.makePostRequest(url, parameters, Http.RESPONSETYPE_BUFFER(), success, error)
  }

  getPlan(parameters, success, error) {
    var url = this._dataUrl + Http.URLPATH_PLAN()
    this.makePostRequest(url, parameters, Http.RESPONSETYPE_TEXT(), success, error)
  }

  makePostRequest(url, data, responseType, success, error) {
    console.log('POST request to: ' + url)
    let request = new XMLHttpRequest()
    request.onreadystatechange = () => this.readyStateChangedHandler(request, success, error)
    let dataString = JSON.stringify(data)
    request.open('POST', url)
    request.setRequestHeader('Content-type', 'application/JSON')
    request.responseType = responseType
    request.send(dataString)
  }

  readyStateChangedHandler(request, success, error) {
    if (Http.isRequestDone(request)) {
      if (Http.isStatusSuccess(request)) {
        success(request.response)
      } else {
        console.log('Error in Webrequest. Code: ' + request.status)
        if (error) {
          error({ message: 'error in web request', status: request.status })
        }
      }
    }
  }

  static isRequestDone(request) {
    return request.readyState === XMLHttpRequest.DONE
  }

  static isStatusSuccess(request) {
    return request.status === Http.STATUS_OK()
  }
}

export { Http }
