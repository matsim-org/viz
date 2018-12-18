import StartPage from '@/components/StartPage.vue'

describe('StartPage', () => {
  it('should be instanceable', () => {
    expect(new StartPage()).toBeInstanceOf(StartPage)
  })
})
