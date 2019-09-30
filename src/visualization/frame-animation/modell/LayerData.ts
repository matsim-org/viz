class LayerData {
  get layers() {
    return this._layers
  }

  private _layers: any[] = []

  constructor() {
    this._layers = []
  }

  public static createLayer(name: any, z: any, color: any, data: any) {
    return {
      name: name,
      z: z,
      color: color,
      points: data.points,
      lines: data.lines,
      shapeVertices: data.shapeVertices,
      shapeNormals: data.shapeNormals,
    }
  }

  public addLayer(layer: any) {
    // check whether a layer with the name exists
    let foundIndex = -1
    this._layers.find((entry: any, index) => {
      if (entry.name === layer.name) {
        foundIndex = index
        return true
      }
    })

    if (foundIndex >= 0) {
      this._layers.splice(foundIndex, 1, layer)
    } else {
      this._layers.push(layer)
    }
  }

  public removeLayer(layerName: any) {
    let foundIndex = -1
    this._layers.find((entry: any, index) => {
      if (entry.name === layerName) {
        foundIndex = index
        return true
      }
    })

    if (foundIndex >= 0) {
      this._layers.splice(foundIndex, 1)
    }
  }

  public getLayer(layerName: any) {
    const layer = this._layers.find((entry: any) => {
      return layerName === entry.name
    })
    return layer
  }
}

export default LayerData
