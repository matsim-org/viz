import { Shape, Path, ShapeBufferGeometry } from 'three'

class GeoJsonReader {
  constructor(geoJson) {
    this.geoJson = geoJson
    this.lineVertices = []
    this.pointVertices = []
    this.shapeGeometries = []
  }

  parse() {
    let json = JSON.parse(this.geoJson)

    for (let i = 0; i < json.features.length; i++) {
      let feature = json.features[i]
      this._parseFeature(feature)
    }

    // join the attributes of the shape geometries
    let vertices = []
    let normals = []

    for (let i = 0; i < this.shapeGeometries.length; i++) {
      let geometry = this.shapeGeometries[i]
      this._copyValues(vertices, 'position', geometry)
      this._copyValues(normals, 'normal', geometry)
    }

    return {
      points: new Float32Array(this.pointVertices),
      lines: new Float32Array(this.lineVertices),
      shapeVertices: new Float32Array(vertices),
      shapeNormals: new Float32Array(normals),
    }
  }

  _copyValues(data, key, geometry) {
    let values = geometry.getAttribute(key).array
    for (let i = 0; i < values.length; i++) {
      data.push(values[i])
    }
  }

  _parseFeature(feature) {
    switch (feature.geometry.type) {
      case 'LineString':
        this._parseLineString(feature.geometry.coordinates)
        break
      case 'MultiLineString':
        this._parseMultiGeometry(feature.geometry.coordinates, c => this._parseLineString(c))
        break
      case 'Point':
        this._addCoordinateToArray(feature.geometry.coordinates, this.pointVertices)
        break
      case 'MultiPoint':
        this._parseMultiGeometry(feature.geometry.coordinates, c => this._addCoordinateToArray(c))
        break
      case 'Polygon':
        this._parsePolygon(feature.geometry.coordinates)
        break
      case 'MultiPolygon':
        this._parseMultiGeometry(feature.geometry.coordinates, c => this._parsePolygon(c))
        break
      default:
        console.log('GeoJsonReader: Geometry type: ' + feature.geometry.type + ' is not implemented yet')
    }

    // properties should also be handled
  }

  _parseMultiGeometry(coordinatesSet, parseFunction) {
    for (let i = 0; i < coordinatesSet.length; i++) {
      let entry = coordinatesSet[i]
      parseFunction(entry)
    }
  }

  _parseLineString(coordinates) {
    for (let i = 0; i < coordinates.length; i++) {
      let coordinate = coordinates[i]
      this._addCoordinateToArray(coordinate, this.lineVertices)
    }
  }

  _parsePolygon(coordinates) {
    // read the exterior ring
    let exteriorRing = coordinates[0]
    let shape = new Shape()
    this._addLineToPath(exteriorRing, shape)

    // add holes
    for (let lineIndex = 1; lineIndex < coordinates.length; lineIndex++) {
      let line = coordinates[lineIndex]
      let hole = new Path()
      this._addLineToPath(line, hole)
      shape.holes.push(hole)
    }

    // write to geometry
    let geometry = new ShapeBufferGeometry(shape)
    this.shapeGeometries.push(geometry.toNonIndexed())
  }

  _addLineToPath(line, path) {
    path.moveTo(line[0][0], line[0][1]) // move context to first coordinate

    for (let coordIndex = 0; coordIndex < line.length; coordIndex++) {
      let coord = line[coordIndex]
      path.lineTo(coord[0], coord[1])
    }
  }

  _addCoordinateToArray(coordinate, array) {
    array.push(coordinate[0]) // x
    array.push(coordinate[1]) // y
    array.push(0) // z
  }
}

export { GeoJsonReader }
