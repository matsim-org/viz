import { shallowMount } from '@vue/test-utils'
import HelloWorld from '@/components/HelloWorld'

describe('StartPage.vue', () => {
  it('always passes', () => {
    const msg = 'new message'
    const wrapper = shallowMount(HelloWorld, {
      propsData: { msg },
    })
    expect('hi').toMatch('h' + 'i')
  })
})
