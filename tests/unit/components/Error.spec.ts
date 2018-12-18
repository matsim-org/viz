import Error from '@/components/Error.vue'

describe('Error', () => {
  it('should be instanceable', () => {
    expect(new Error()).toBeInstanceOf(Error)
  })
})
