import NetworkFlows from '@/visualization/NetworkFlows.vue'

describe('NetworkFlows', () => {
  it('should be instanceable', () => {
    expect(new NetworkFlows()).toBeInstanceOf(NetworkFlows)
  })
})
