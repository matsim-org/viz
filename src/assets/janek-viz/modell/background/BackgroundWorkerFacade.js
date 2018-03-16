class BackgroundWorkerFacade {
  constructor () {
    this.boundHandleMessage = e => this.handleMessage(e);
    addEventListener('message', this.boundHandleMessage);
  }

  kill () {
    removeEventListener('message', this.boundHandleMessage);
  }

  handleMessage (e) {
    let data = e.data;
    if (!data || !data.method || !data.parameters) {
      this.error('no data, method name or parameters received');
      return;
    }
    // this.log('received call to: ' + data.method);
    this.onReceivedMethodCall(data.method, data.parameters);
  }

  onReceivedMethodCall (method, parameters) {
    // nothing: subclasses may override this method
  }

  log (message) {
    postMessage({ type: 'log', message: message });
  }

  error (message) {
    postMessage({ type: 'error', message: message });
  }

  postEvent (name, data) {
    postMessage({ type: 'event', name: name, data: data });
  }

  /**
     * Posts an event to the main process. Uses Transferrable objects to avoid reparsing all the
     * Data.
     * @param {*string} name - the name of the event
     * @param {*object} data - event data
     * @param {*array} transferrable - transferrable objects which are included in data all included objects
     * are passed by reference all other fields contained in 'data' are copied
     */
  postEventByReference (name, data, transferrable) {
    let objData = {
      type: 'event',
      name: name,
      data: data
    };
    postMessage(objData, transferrable);
  }
}

export { BackgroundWorkerFacade }
