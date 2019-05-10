import Rectangle from '@/visualization/events-animation/Rectangle'

describe('Rectangle', () => {
  it('yields correct center values', () => {
    const rect = new Rectangle(-10, 10, -10, 10)
    expect(rect.CenterX).toEqual(0)
    expect(rect.CenterY).toEqual(0)
    expect(rect.Left).toEqual(-10)
    expect(rect.Right).toEqual(10)
    expect(rect.Top).toEqual(-10)
    expect(rect.Bottom).toEqual(10)
  })
  it('creates a rect from the center with dimensions', () => {
    const rect = Rectangle.createFromCenterWithDimensions(0, 0, 20, 20)
    expect(rect.CenterX).toEqual(0)
    expect(rect.CenterY).toEqual(0)
    expect(rect.Left).toEqual(-10)
    expect(rect.Right).toEqual(10)
    expect(rect.Top).toEqual(10)
    expect(rect.Bottom).toEqual(-10)
  })
  it('creates a rect from an offset', () => {
    const fromRect = new Rectangle(-10, 10, -10, 10)
    const offset = 10
    const rect = Rectangle.createFromOffset(fromRect, offset, offset)

    expect(rect.CenterX).toEqual(0 + offset)
    expect(rect.CenterY).toEqual(0 + offset)
    expect(rect.Left).toEqual(-10 + offset)
    expect(rect.Right).toEqual(10 + offset)
    expect(rect.Top).toEqual(-10 + offset)
    expect(rect.Bottom).toEqual(10 + offset)
  })
  it('creates a vertically flipped rect', () => {
    const fromRect = new Rectangle(-10, 10, -10, 10)
    const rect = Rectangle.createVerticallyFlipped(fromRect)

    expect(rect.CenterX).toEqual(0)
    expect(rect.CenterY).toEqual(0)
    expect(rect.Left).toEqual(-10)
    expect(rect.Right).toEqual(10)
    expect(rect.Top).toEqual(10)
    expect(rect.Bottom).toEqual(-10)
  })
})
