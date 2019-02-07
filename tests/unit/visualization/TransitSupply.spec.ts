import TransitSupply from '@/visualization/transit-supply/TransitSupply.vue'

describe('TransitSupply', () => {
  it('should be instanceable', () => {
    expect(
      new TransitSupply({ props: { vizId: String, projectId: String, fileApi: Object, authStore: Object } })
    ).toBeInstanceOf(TransitSupply)
  })
})
