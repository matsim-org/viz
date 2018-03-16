import { BackgroundWorkerFacade } from './BackgroundWorkerFacade.js';
import { GeoJsonReader } from '../../contracts/GeoJsonReader.js';

class GeoJsonParser extends BackgroundWorkerFacade {

    parseGeoJson(parameters) {
        if (!parameters.geoJson || !parameters.z || !parameters.layerName)
            this.error('parseGeoJson: unsuficient parameters! z, layerName, geoJson are required');

        let reader = new GeoJsonReader(parameters.geoJson);
        let result = reader.parse();
        result.z = parameters.z;
        result.layerName = parameters.layerName;
        result.color = parameters.color;
        let transferrable = [
            result.points.buffer,
            result.lines.buffer,
            result.shapeVertices.buffer,
            result.shapeNormals.buffer
        ];
        this.postEventByReference('geoJsonParsed', result, transferrable);
        close();
    }

    //override
    onReceivedMethodCall(method, parameters) {
        switch (method) {
            case 'parseGeoJson':
                this.parseGeoJson(parameters);
                break;
            default:
                this.error('No method with name ' + method);
        }
    }
}

export { GeoJsonParser };

//Bootstrap Parser
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
    worker = new GeoJsonParser();
    removeEventListener('message', handleInitialize);
}