import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import BookComicEnhancedImage from './BookComicEnhancedImage.vue'
import {
  BookComicEnhancementError,
  enhanceBookComicImage
} from '@/views/public/book-comic-enhancer'

vi.mock('@/views/public/book-comic-enhancer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/views/public/book-comic-enhancer')>()

  return {
    ...actual,
    enhanceBookComicImage: vi.fn()
  }
})

const enhanceBookComicImageMock = vi.mocked(enhanceBookComicImage)

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      disconnect(): void {}
      observe(): void {}
    }
  )
})

afterEach(() => {
  enhanceBookComicImageMock.mockReset()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('BookComicEnhancedImage', () => {
  it('renders only the enhanced canvas when pica processing succeeds', async () => {
    enhanceBookComicImageMock.mockImplementation(async ({ canvas }) => {
      canvas.width = 320
      canvas.height = 640
      return {
        cssWidth: 160,
        pixelHeight: 640,
        pixelWidth: 320,
        sourceHeight: 640,
        sourceWidth: 320
      }
    })

    const wrapper = mount(BookComicEnhancedImage, {
      props: {
        alt: '漫画第 1 页',
        loading: 'eager',
        src: 'https://cdn.example.test/page-1.webp'
      }
    })

    await flushPromises()

    expect(enhanceBookComicImageMock).toHaveBeenCalledTimes(1)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('图片增强失败')
    expect(wrapper.find('canvas').attributes('aria-label')).toBe('漫画第 1 页')
    expect((wrapper.find('canvas').element as HTMLCanvasElement).style.width).toBe('160px')
  })

  it('shows an enhancement failure state without rendering an original image fallback', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    enhanceBookComicImageMock.mockRejectedValue(
      new BookComicEnhancementError('request', 'comic image request failed', new TypeError())
    )

    const wrapper = mount(BookComicEnhancedImage, {
      props: {
        alt: '漫画第 1 页',
        loading: 'eager',
        src: 'https://cdn.example.test/page-1.webp'
      }
    })

    await flushPromises()

    expect(enhanceBookComicImageMock).toHaveBeenCalledTimes(1)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('request')
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[portal-book-reader] comic image enhancement failed',
      expect.objectContaining({
        src: 'https://cdn.example.test/page-1.webp'
      })
    )
    consoleErrorSpy.mockRestore()
    expect(wrapper.text()).toContain('图片增强失败')
  })
})
