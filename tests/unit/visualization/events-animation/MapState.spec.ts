import Rectangle from '@/visualization/events-animation/Rectangle'
import MapState from '@/visualization/events-animation/MapState'

describe('MapState', () => {
  it('moves the bounds of the map', () => {
    const rect = new Rectangle(-10, 10, 10, -10)
    const mapState = new MapState(rect)

    mapState.moveMap(10, 10)

    expect(rect.Left - 10).toEqual(mapState.Bounds.Left)
    expect(rect.Right - 10).toEqual(mapState.Bounds.Right)
    expect(rect.Top - 10).toEqual(mapState.Bounds.Top)
    expect(rect.Bottom - 10).toEqual(mapState.Bounds.Bottom)
  })
})
