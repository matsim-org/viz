import NOXPlot from '@/visualization/NOXPlot.vue'

describe('NOXPlot', () => {
  it('should be instanceable', () => {
    expect(new NOXPlot()).toBeInstanceOf(NOXPlot)
  })
})
