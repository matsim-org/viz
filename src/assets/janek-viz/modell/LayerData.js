class LayerData {

    get layers() {
        return this._layers;
    }

    constructor() {
        this._layers = [];
    }

    addLayer(layer) {

        //check whether a layer with the name exists
        let foundIndex = -1;
        let foundLayer = this._layers.find((entry, index) => {
            if (entry.name === layer.name) {
                foundIndex = index;
                return true;
            }
        });

        if (foundIndex >= 0) {
            this._layers.splice(foundIndex, 1, layer);
        }
        else {
            this._layers.push(layer);
        }
    }

    removeLayer(layerName) {
        let foundIndex = -1;
        this._layers.find((entry, index) => {
            if (entry.name === layerName) {
                foundIndex = index;
                return true;
            }
        });

        if (foundIndex >= 0) {
            this._layers.splice(foundIndex, 1);
        }
    }

    getLayer(layerName) {
        let layer = this._layers.find((entry) => {
            return layerName === entry.name;
        });
        return layer;
    }

    static createLayer(name, z, color, data) {
        return {
            name: name,
            z: z,
            color: color,
            points: data.points,
            lines: data.lines,
            shapeVertices: data.shapeVertices,
            shapeNormals: data.shapeNormals,
        };
    }
}

export { LayerData };