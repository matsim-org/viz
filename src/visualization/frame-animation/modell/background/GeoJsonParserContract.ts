export interface ParseParams {
  geoJson: string
  z: number
  layerName: string
  color?: number
}

export enum MethodNames {
  ParseGeoJson = 'parseGeoJson',
}
