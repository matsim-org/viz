import { BackgroundWorkerFacade } from './BackgroundWorkerFacade.js';
import { Http } from '../../communication/http.js';
import { NetworkReader } from '../../contracts/NetworkReader';
import { SnapshotReader } from '../../contracts/SnapshotReader.js';
import { GeoJsonReader } from '../../contracts/GeoJsonReader.js';

class DataFetcher extends BackgroundWorkerFacade {

    constructor(parameters) {
        super();
        this._http = new Http(parameters.dataUrl);
    }

    getConfigData(parameters) {
        this._http.getConfigData((response) => {
            let config = JSON.parse(response);
            this.postEvent('configDataReceived', config);
        }, (error) => this.error(error.message));
    }

    getNetworkData(parameters) {
        this._http.getNetworkData((response) => {
            let reader = new NetworkReader(response);
            let network = reader.parse();
            this.postEventByReference('networkDataReceived', network, [network.buffer]);
        }, (error) => this.error(error.message));
    }

    getSnapshotData(parameters) {
        let requestNumber = parameters.requestNumber;
        this._http.getSnapshotData(parameters.requestParameters,
            (response) => this._handleSnapshotData(requestNumber, response),
            (error) => this.error(error.message));
    }

    getPlan(parameters) {
        this._http.getPlan(parameters,
            (response) => this._handlePlanData(response),
            (error) => this.error(error.message));
    }

    _handleSnapshotData(requestNumber, response) {

        let reader = new SnapshotReader(response);
        let snapshots = reader.parse();

        let transferrables = [];
        for (let i = 0; i < snapshots.length; i++) {
            let snapshot = snapshots[i];
            transferrables.push(snapshot.position.buffer);
            transferrables.push(snapshot.nextPosition.buffer);
            transferrables.push(snapshot.shouldInterpolate.buffer);
            transferrables.push(snapshot.ids.buffer);
        }
        let result = { requestNumber: requestNumber, data: snapshots };
        this.postEventByReference('snapshotDataReceived', result, transferrables);
    }

    _handlePlanData(response) {

        let reader = new GeoJsonReader(response);
        let geoJson = reader.parse();

        let transferrableObjects = [
            geoJson.points.buffer,
            geoJson.lines.buffer,
            geoJson.shapeVertices.buffer,
            geoJson.shapeNormals.buffer,
        ]
        this.postEventByReference('planDataReceived', geoJson, transferrableObjects);
    }

    //override
    onReceivedMethodCall(method, parameters) {
        switch (method) {
            case 'getSnapshotData':
                this.getSnapshotData(parameters);
                break;
            case 'getNetworkData':
                this.getNetworkData(parameters);
                break;
            case 'getConfig':
                this.getConfigData(parameters);
                break;
            case 'getPlan':
                this.getPlan(parameters);
                break;
            default:
                this.error('Not method with name. ' + method);
                break;
        }
    }
}

export { DataFetcher };

//Bootstrap DataFetcher
var worker;

//This is necesarry to run unittests in node
if (global.addEventListener) {
    addEventListener('message', handleInitialize);
}

function handleInitialize(e) {
    let data = e.data;
    if (!data || !data.method || !data.parameters) {
        postMessage({ type: 'error', message: 'no data, method name or parameters received' });
        return;
    }
    if (data.method !== 'initialize') {
        postMessage({ type: 'error', message: 'call method "initialize" first to create a background controller' });
        return;
    }
    worker = new DataFetcher(data.parameters);
    removeEventListener('message', handleInitialize);
}
