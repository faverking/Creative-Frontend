import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAutoLoadSentinel } from './useAutoLoadSentinel'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useAutoLoadSentinel', () => {
  it('uses browser-supported rootMargin units for IntersectionObserver', async () => {
    const observerOptions: IntersectionObserverInit[] = []

    class IntersectionObserverMock implements IntersectionObserver {
      readonly root = null
      readonly rootMargin = ''
      readonly scrollMargin = ''
      readonly thresholds = [0.01]

      constructor(_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        if (options) {
          observerOptions.push(options)
        }
      }

      disconnect(): void {}
      observe(): void {}
      takeRecords(): IntersectionObserverEntry[] {
        return []
      }
      unobserve(): void {}
    }

    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)

    const TestComponent = defineComponent({
      setup() {
        const enabled = ref(true)
        const { sentinelRef } = useAutoLoadSentinel({
          enabled,
          onLoadMore: vi.fn().mockResolvedValue(undefined)
        })

        return () => h('div', { ref: sentinelRef })
      }
    })

    mount(TestComponent)

    await nextTick()

    expect(observerOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rootMargin: '0px 0px 180px 0px'
        })
      ])
    )
    expect(observerOptions.every((options) => !options.rootMargin?.includes('rem'))).toBe(true)
  })
})
