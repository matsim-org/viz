import VizThumbnail from '@/components/VizThumbnail.vue'

describe('VizThumbnail', () => {
  it('should be instanceable', () => {
    expect(new VizThumbnail({ props: { viz: {} } })).toBeInstanceOf(VizThumbnail)
  })
})
