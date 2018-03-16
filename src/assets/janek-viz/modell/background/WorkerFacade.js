class WorkerFacade {

    constructor(worker, eventCallback) {
        if (worker) {
            this.worker = new worker();
            this.boundHandelWorkerMessage = e => this.handleWorkerMessage(e);
            this.worker.addEventListener('message', this.boundHandelWorkerMessage);
            this.eventCallback = eventCallback;
        }
    }

    destroy() {
        if (this.worker) {
            this.worker.removeEventListener('message', this.boundHandelWorkerMessage);
            this.worker.terminate();
        }
    }

    handleWorkerMessage(e) {
        let then = Date.now();
        let data = e.data;

        switch (data.type) {
            case 'error':
                console.error('Error in Web-Worker: ' + data.message);
                break;
            case 'log':
                console.log('Info Web-Worker: ' + data.message);
                break;
            case 'event':
                this.onWorkerEvent(data.name, data.data);
                break;
            default:
                this.onWorkerMessageReceived(data);
        }
        let time = Date.now() - then;
        if(data.name) {
            console.log('handle WorkerMessage "' + data.name + '" took: ' + time + 'ms');
        }
    }

    onWorkerMessageReceived(data) {
        //nothing: subclasses can override this method
        console.error('PlaybackController._handleWorkerMessage: Error! receivd unknown message type');

    }

    onWorkerEvent(name, data) {
        this.eventCallback(name, data);
    }

    postWorkerMessage(methodName, parameters) {
        if (this.worker) {
            this.worker.postMessage({ method: methodName, parameters: parameters });
        }
    }

    postWorkerMessage(methodName, data, transferrables) {
        if (this.worker) {
            let obj = {
                method: methodName,
                parameters: data
            };
            this.worker.postMessage(obj, transferrables);
        }
    }
}

export { WorkerFacade };