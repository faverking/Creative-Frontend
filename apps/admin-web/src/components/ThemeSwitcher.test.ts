import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'

import ThemeSwitcher from './ThemeSwitcher.vue'

describe('ThemeSwitcher', () => {
  it('renders localized mode label', () => {
    setActivePinia(createPinia())
    const wrapper = mount(ThemeSwitcher, {
      global: {
        stubs: {
          ElButton: {
            template: '<button><slot /></button>'
          }
        }
      }
    })

    expect(wrapper.text()).toMatch(/深色模式|浅色模式/)
  })
})
