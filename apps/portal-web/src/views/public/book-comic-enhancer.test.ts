import { afterEach, describe, expect, it, vi } from 'vitest'

const picaResizeMock = vi.hoisted(() =>
  vi.fn(async (_source: unknown, canvas: HTMLCanvasElement) => canvas)
)

vi.mock('pica', () => ({
  default: vi.fn(() => ({
    resize: picaResizeMock
  }))
}))

import {
  BOOK_COMIC_ENHANCEMENT_MAX_CSS_WIDTH,
  BOOK_COMIC_ENHANCEMENT_UNSHARP_AMOUNT,
  BOOK_COMIC_ENHANCEMENT_UNSHARP_RADIUS,
  BOOK_COMIC_ENHANCEMENT_UNSHARP_THRESHOLD,
  BookComicEnhancementError,
  createBookComicEnhancementQueue,
  enhanceBookComicImage,
  resolveBookComicEnhancementTarget
} from './book-comic-enhancer'

afterEach(() => {
  picaResizeMock.mockClear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('book comic enhancement target', () => {
  it('uses container width and dpr while allowing bounded raster upscaling', () => {
    expect(
      resolveBookComicEnhancementTarget({
        containerWidth: 960,
        devicePixelRatio: 2,
        sourceHeight: 2400,
        sourceWidth: 1600
      })
    ).toEqual({
      cssHeight: 1440,
      cssWidth: 960,
      pixelHeight: 2880,
      pixelWidth: 1920
    })
  })

  it('allows low-resolution source images to fill the reader width while capping raster scale', () => {
    expect(
      resolveBookComicEnhancementTarget({
        containerWidth: 960,
        devicePixelRatio: 2,
        sourceHeight: 1080,
        sourceWidth: 720
      })
    ).toEqual({
      cssHeight: 1440,
      cssWidth: 960,
      pixelHeight: 2160,
      pixelWidth: 1440
    })
  })

  it('does not keep 800-wide comic sources fixed at an 800 css width', () => {
    expect(
      resolveBookComicEnhancementTarget({
        containerWidth: 1080,
        devicePixelRatio: 2,
        sourceHeight: 1600,
        sourceWidth: 800
      })
    ).toEqual({
      cssHeight: 2160,
      cssWidth: 1080,
      pixelHeight: 3200,
      pixelWidth: 1600
    })
  })

  it('uses the comic reader width as the default enhanced canvas cap', () => {
    expect(
      resolveBookComicEnhancementTarget({
        containerWidth: 1120,
        devicePixelRatio: 2,
        sourceHeight: 2400,
        sourceWidth: 1800
      }).cssWidth
    ).toBe(BOOK_COMIC_ENHANCEMENT_MAX_CSS_WIDTH)
  })
})

describe('book comic enhancement queue', () => {
  it('runs image enhancement tasks sequentially', async () => {
    const queue = createBookComicEnhancementQueue()
    const releaseFirstTask = vi.fn<() => void>()
    let activeTasks = 0
    let maxActiveTasks = 0

    const firstTask = queue.run(async () => {
      activeTasks += 1
      maxActiveTasks = Math.max(maxActiveTasks, activeTasks)
      await new Promise<void>((resolve) => {
        releaseFirstTask.mockImplementation(resolve)
      })
      activeTasks -= 1
      return 'first'
    })
    const secondTask = queue.run(async () => {
      activeTasks += 1
      maxActiveTasks = Math.max(maxActiveTasks, activeTasks)
      activeTasks -= 1
      return 'second'
    })

    await Promise.resolve()
    expect(maxActiveTasks).toBe(1)

    releaseFirstTask()

    await expect(firstTask).resolves.toBe('first')
    await expect(secondTask).resolves.toBe('second')
    expect(maxActiveTasks).toBe(1)
  })
})

describe('enhanceBookComicImage', () => {
  it('fetches, decodes, and resizes a comic image through pica', async () => {
    const canvas = document.createElement('canvas')
    const imageBlob = new Blob(['comic'], { type: 'image/png' })
    const response = new Response(imageBlob, {
      headers: {
        'Content-Type': 'image/png'
      },
      status: 200
    })
    const bitmap = {
      close: vi.fn(),
      height: 1800,
      width: 1200
    } as unknown as ImageBitmap
    const drawImage = vi.fn()
    const fetchImage = vi.fn(async () => response)
    const decodeImage = vi.fn(async (_blob: Blob) => bitmap)

    vi.stubGlobal('fetch', fetchImage)
    vi.stubGlobal('createImageBitmap', decodeImage)
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage
    } as unknown as CanvasRenderingContext2D)

    const result = await enhanceBookComicImage({
      canvas,
      containerWidth: 500,
      src: 'https://cdn.example.test/page-1.webp'
    })

    expect(fetchImage).toHaveBeenCalledWith(
      'https://cdn.example.test/page-1.webp',
      expect.objectContaining({
        credentials: 'omit',
        mode: 'cors',
        referrerPolicy: 'no-referrer'
      })
    )
    expect(decodeImage).toHaveBeenCalledTimes(1)
    expect(decodeImage.mock.calls[0]?.[0].type).toBe('image/png')
    expect(canvas.width).toBe(1000)
    expect(canvas.height).toBe(1500)
    expect(picaResizeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        height: 1800,
        width: 1200
      }),
      canvas,
      expect.objectContaining({
        filter: 'mks2013',
        unsharpAmount: BOOK_COMIC_ENHANCEMENT_UNSHARP_AMOUNT,
        unsharpRadius: BOOK_COMIC_ENHANCEMENT_UNSHARP_RADIUS,
        unsharpThreshold: BOOK_COMIC_ENHANCEMENT_UNSHARP_THRESHOLD
      })
    )
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0)
    expect(bitmap.close).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      cssHeight: 750,
      cssWidth: 500,
      pixelHeight: 1500,
      pixelWidth: 1000,
      sourceHeight: 1800,
      sourceWidth: 1200
    })
  })

  it('passes image ticket headers and decodes octet-stream image responses', async () => {
    const canvas = document.createElement('canvas')
    const imageBlob = new Blob(['comic'], { type: 'application/octet-stream' })
    const response = new Response(imageBlob, {
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      status: 200
    })
    const bitmap = {
      close: vi.fn(),
      height: 1800,
      width: 1200
    } as unknown as ImageBitmap
    const drawImage = vi.fn()
    const fetchImage = vi.fn(async () => response)
    const decodeImage = vi.fn(async (_blob: Blob) => bitmap)

    vi.stubGlobal('fetch', fetchImage)
    vi.stubGlobal('createImageBitmap', decodeImage)
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage
    } as unknown as CanvasRenderingContext2D)

    await enhanceBookComicImage({
      canvas,
      containerWidth: 500,
      requestHeaders: {
        'x-image-ticket': 'ticket-1'
      },
      src: 'https://cdn.example.test/page-1'
    })

    expect(fetchImage).toHaveBeenCalledWith(
      'https://cdn.example.test/page-1',
      expect.objectContaining({
        headers: {
          'x-image-ticket': 'ticket-1'
        }
      })
    )
    expect(decodeImage).toHaveBeenCalledTimes(1)
    expect(decodeImage.mock.calls[0]?.[0].type).toBe('application/octet-stream')
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0)
  })

  it('calls default browser image APIs with the global receiver', async () => {
    const canvas = document.createElement('canvas')
    const imageBlob = new Blob(['comic'], { type: 'image/png' })
    const response = new Response(imageBlob, {
      headers: {
        'Content-Type': 'image/png'
      },
      status: 200
    })
    const bitmap = {
      close: vi.fn(),
      height: 600,
      width: 400
    } as unknown as ImageBitmap
    const drawImage = vi.fn()
    const fetchImage = vi.fn(function (
      this: typeof globalThis,
      _input: RequestInfo | URL,
      _init?: RequestInit
    ) {
      expect(this).toBe(globalThis)
      return Promise.resolve(response)
    })
    const decodeImage = vi.fn(function (this: typeof globalThis, _source: ImageBitmapSource) {
      expect(this).toBe(globalThis)
      return Promise.resolve(bitmap)
    })

    vi.stubGlobal('fetch', fetchImage)
    vi.stubGlobal('createImageBitmap', decodeImage)
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(1)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage
    } as unknown as CanvasRenderingContext2D)

    await enhanceBookComicImage({
      canvas,
      containerWidth: 400,
      src: 'https://cdn.example.test/page-1.webp'
    })

    expect(fetchImage).toHaveBeenCalledTimes(1)
    expect(decodeImage).toHaveBeenCalledTimes(1)
  })

  it('marks browser fetch failures as request-stage enhancement errors', async () => {
    const canvas = document.createElement('canvas')
    const fetchError = new TypeError('Failed to fetch')
    const fetchImage = vi.fn(async () => {
      throw fetchError
    })

    vi.stubGlobal('fetch', fetchImage)

    await expect(
      enhanceBookComicImage({
        canvas,
        containerWidth: 500,
        src: 'https://cdn.example.test/page-1.webp'
      })
    ).rejects.toMatchObject({
      cause: fetchError,
      stage: 'request'
    } satisfies Partial<BookComicEnhancementError>)
  })
})
