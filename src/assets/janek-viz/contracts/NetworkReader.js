import { Reader } from './Reader.js';

class NetworkReader extends Reader {

    constructor(byteArray) {
        super(byteArray, Float32Array.BYTES_PER_ELEMENT);
        this.z = 0;
    }

    parse() {

        let valuesPerLink = 2;
        let valueSize = 2;
        let numberOfLinks = this.size / valuesPerLink / valueSize / this.valueLength;

        return this.parseCoordinatesArray(numberOfLinks, valuesPerLink);
    }
}

export { NetworkReader };