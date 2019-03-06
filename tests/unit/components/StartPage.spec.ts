import StartPage from '@/components/StartPage.vue'
import setupProjectStore from '../project/ProjectStore.spec.js'

describe('StartPage', () => {
  it('should be instanceable', () => {
    Promise.resolve(setupProjectStore()).then(store => {
      const sp = new StartPage({ props: { projectStore: store, authStore: Object } })
      expect(sp).toBeInstanceOf(StartPage)
    })
  })
})
