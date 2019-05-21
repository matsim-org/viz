import proj4 from 'proj4'

interface Xy {
  x: number
  y: number
}

// Add all standard MATSim projects from TransformationFactory to proj4
proj4.defs([
  [
    // south africa
    'EPSG:2048',
    '+proj=tmerc +lat_0=0 +lon_0=19 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  ],
  [
    // berlin
    'EPSG:31468',
    '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs',
  ],
  [
    // cottbus
    'EPSG:25833',
    '+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs',
  ],
])

// aliases for existing definitions here
proj4.defs('DK4', proj4.defs('EPSG:31468'))

// aliases for common cities
proj4.defs('Cottbus', proj4.defs('EPSG:25833'))
proj4.defs('Berlin', proj4.defs('EPSG:31468'))
proj4.defs('South Africa', proj4.defs('EPSG:2048'))

function toLngLat(projection: string, p: Xy) {
  return proj4(projection, 'WGS84', p) as any
}

export default { toLngLat }
