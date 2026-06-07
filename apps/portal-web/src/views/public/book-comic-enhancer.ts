import type picaFactory from 'pica'

export const BOOK_COMIC_ENHANCEMENT_MAX_CSS_WIDTH = 1080
export const BOOK_COMIC_ENHANCEMENT_MAX_RASTER_SCALE = 2
export const BOOK_COMIC_ENHANCEMENT_UNSHARP_AMOUNT = 190
export const BOOK_COMIC_ENHANCEMENT_UNSHARP_RADIUS = 0.68
export const BOOK_COMIC_ENHANCEMENT_UNSHARP_THRESHOLD = 1

type PicaFactory = typeof picaFactory
type PicaInstance = ReturnType<PicaFactory>
export type BookComicEnhancementStage = 'request' | 'blob' | 'decode' | 'canvas' | 'resize'

export interface BookComicEnhancementTargetInput {
  containerWidth: number
  devicePixelRatio: number
  maxCssWidth?: number
  sourceHeight: number
  sourceWidth: number
}

export interface BookComicEnhancementTarget {
  cssWidth: number
  pixelHeight: number
  pixelWidth: number
}

export interface BookComicEnhancementQueue {
  run<T>(task: () => Promise<T>): Promise<T>
}

export interface EnhanceBookComicImageOptions {
  canvas: HTMLCanvasElement
  containerWidth: number
  maxCssWidth?: number
  signal?: AbortSignal
  src: string
}

export interface EnhanceBookComicImageResult extends BookComicEnhancementTarget {
  sourceHeight: number
  sourceWidth: number
}

export class BookComicEnhancementError extends Error {
  readonly cause: unknown
  readonly stage: BookComicEnhancementStage

  constructor(stage: BookComicEnhancementStage, message: string, cause?: unknown) {
    super(message)
    this.name = 'BookComicEnhancementError'
    this.stage = stage
    this.cause = cause
  }
}

let picaPromise: Promise<PicaInstance> | null = null

export const bookComicEnhancementQueue = createBookComicEnhancementQueue()

export function resolveBookComicEnhancementTarget({
  containerWidth,
  devicePixelRatio,
  maxCssWidth = BOOK_COMIC_ENHANCEMENT_MAX_CSS_WIDTH,
  sourceHeight,
  sourceWidth
}: BookComicEnhancementTargetInput): BookComicEnhancementTarget {
  const safeSourceWidth = Math.max(1, Math.floor(sourceWidth))
  const safeSourceHeight = Math.max(1, Math.floor(sourceHeight))
  const safeMaxCssWidth = Math.max(1, Math.floor(maxCssWidth))
  const safeContainerWidth = Math.max(1, Math.floor(containerWidth || safeMaxCssWidth))
  const safeDpr = Math.max(1, Math.min(devicePixelRatio || 1, 3))
  const cssWidth = Math.min(safeContainerWidth, safeMaxCssWidth)
  const desiredPixelWidth = Math.max(1, Math.round(cssWidth * safeDpr))
  const maxRasterWidth = Math.max(
    safeSourceWidth,
    Math.round(safeSourceWidth * BOOK_COMIC_ENHANCEMENT_MAX_RASTER_SCALE)
  )
  const pixelWidth = Math.min(maxRasterWidth, desiredPixelWidth)
  const pixelHeight = Math.max(1, Math.round((safeSourceHeight * pixelWidth) / safeSourceWidth))

  return {
    cssWidth,
    pixelHeight,
    pixelWidth
  }
}

export function createBookComicEnhancementQueue(): BookComicEnhancementQueue {
  let pending = Promise.resolve()

  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      const next = pending.then(task, task)
      pending = next.then(
        () => undefined,
        () => undefined
      )
      return next
    }
  }
}

export async function enhanceBookComicImage({
  canvas,
  containerWidth,
  maxCssWidth,
  signal,
  src
}: EnhanceBookComicImageOptions): Promise<EnhanceBookComicImageResult> {
  if (signal?.aborted) {
    throw createBookComicEnhancementAbortError()
  }

  const response = await runBookComicEnhancementStage('request', '漫画图片请求失败。', () =>
    globalThis.fetch(src, {
      credentials: 'omit',
      mode: 'cors',
      referrerPolicy: 'no-referrer',
      signal
    })
  )

  if (!response.ok) {
    throw new BookComicEnhancementError('request', `漫画图片请求失败：HTTP ${response.status}。`)
  }

  const blob = await runBookComicEnhancementStage('blob', '漫画图片数据读取失败。', () =>
    response.blob()
  )
  if (blob.type && !blob.type.toLocaleLowerCase().startsWith('image/')) {
    throw new BookComicEnhancementError('decode', `漫画图片类型无法解码：${blob.type}。`)
  }

  const bitmap = await runBookComicEnhancementStage('decode', '漫画图片解码失败。', () =>
    globalThis.createImageBitmap(blob)
  )
  try {
    if (signal?.aborted) {
      throw createBookComicEnhancementAbortError()
    }

    const target = resolveBookComicEnhancementTarget({
      containerWidth,
      devicePixelRatio: window.devicePixelRatio,
      maxCssWidth,
      sourceHeight: bitmap.height,
      sourceWidth: bitmap.width
    })
    const sourceCanvas = await createBookComicSourceCanvas(bitmap, signal)
    canvas.width = target.pixelWidth
    canvas.height = target.pixelHeight

    const pica = await runBookComicEnhancementStage('resize', '图片增强库加载失败。', () =>
      resolveBookComicPica()
    )
    await runBookComicEnhancementStage('resize', '图片增强处理失败。', () =>
      bookComicEnhancementQueue.run(() =>
        pica.resize(sourceCanvas, canvas, {
          cancelToken: createBookComicEnhancementCancelToken(signal),
          filter: 'mks2013',
          unsharpAmount: BOOK_COMIC_ENHANCEMENT_UNSHARP_AMOUNT,
          unsharpRadius: BOOK_COMIC_ENHANCEMENT_UNSHARP_RADIUS,
          unsharpThreshold: BOOK_COMIC_ENHANCEMENT_UNSHARP_THRESHOLD
        })
      )
    )

    return {
      ...target,
      sourceHeight: bitmap.height,
      sourceWidth: bitmap.width
    }
  } finally {
    bitmap.close()
  }
}

async function resolveBookComicPica(): Promise<PicaInstance> {
  if (!picaPromise) {
    picaPromise = import('pica').then((module) =>
      module.default({
        concurrency: 1
      })
    )
  }

  return picaPromise
}

async function createBookComicSourceCanvas(
  bitmap: ImageBitmap,
  signal?: AbortSignal
): Promise<HTMLCanvasElement> {
  return runBookComicEnhancementStage('canvas', '漫画图片画布准备失败。', async () => {
    if (signal?.aborted) {
      throw createBookComicEnhancementAbortError()
    }

    const sourceCanvas = document.createElement('canvas')
    sourceCanvas.width = Math.max(1, bitmap.width)
    sourceCanvas.height = Math.max(1, bitmap.height)

    const context = sourceCanvas.getContext('2d', {
      alpha: false
    })
    if (!context) {
      throw new Error('2D canvas context is unavailable.')
    }

    context.drawImage(bitmap, 0, 0)
    return sourceCanvas
  })
}

async function runBookComicEnhancementStage<T>(
  stage: BookComicEnhancementStage,
  message: string,
  task: () => T | Promise<T>
): Promise<T> {
  try {
    return await task()
  } catch (error) {
    if (isBookComicEnhancementAbortError(error)) {
      throw error
    }

    if (error instanceof BookComicEnhancementError) {
      throw error
    }

    throw new BookComicEnhancementError(stage, message, error)
  }
}

function createBookComicEnhancementCancelToken(signal?: AbortSignal): Promise<never> | undefined {
  if (!signal) {
    return undefined
  }

  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(createBookComicEnhancementAbortError())
      return
    }

    signal.addEventListener(
      'abort',
      () => {
        reject(createBookComicEnhancementAbortError())
      },
      { once: true }
    )
  })
}

function createBookComicEnhancementAbortError(): DOMException {
  return new DOMException('Comic image enhancement was aborted.', 'AbortError')
}

function isBookComicEnhancementAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
