import type { Reporter } from './report'
import type { MonitorContext, MonitorEvent } from './types'

export interface GlobalErrorCaptureOptions {
  onCaptured?: (event: MonitorEvent) => void | Promise<void>
  getContext?: () => MonitorContext | undefined
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function safeSerializeRecord(record: Record<string, unknown>): string {
  try {
    return JSON.stringify(record)
  } catch {
    return '[unserializable-error-object]'
  }
}

function normalizeUnknownError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  }

  const record = toRecord(error)
  if (record) {
    return {
      ...record,
      // 非 Error 对象也尽量归一化成稳定的 message 字段，便于日志检索和提示展示。
      message: typeof record.message === 'string' ? record.message : safeSerializeRecord(record)
    }
  }

  if (typeof error === 'string') {
    return {
      message: error
    }
  }

  return {
    message: 'Unknown runtime error',
    value: String(error)
  }
}

export function createErrorMonitorEvent(
  error: unknown,
  source = 'manual',
  context?: MonitorContext
): MonitorEvent {
  return {
    type: 'error',
    payload: {
      source,
      ...normalizeUnknownError(error)
    },
    context,
    timestamp: Date.now()
  }
}

export function reportError(
  reporter: Reporter,
  error: unknown,
  context?: MonitorContext
): Promise<void> {
  return reporter.report(createErrorMonitorEvent(error, 'manual', context))
}

export function installGlobalErrorCapture(
  reporter: Reporter,
  options: GlobalErrorCaptureOptions = {}
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const emitCapturedEvent = (event: MonitorEvent) => {
    void reporter.report(event)
    // 监控上报与埋点桥接并行执行，避免其中一方失败影响另一方。
    void options.onCaptured?.(event)
  }

  const handleRuntimeError = (event: ErrorEvent) => {
    const basePayload = normalizeUnknownError(event.error ?? event.message)
    emitCapturedEvent({
      type: 'error',
      payload: {
        source: 'window.error',
        message:
          typeof basePayload.message === 'string'
            ? basePayload.message
            : event.message || 'Script error',
        filename: event.filename || undefined,
        lineno: event.lineno || undefined,
        colno: event.colno || undefined,
        ...basePayload
      },
      context: options.getContext?.(),
      timestamp: Date.now()
    })
  }

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    emitCapturedEvent({
      type: 'error',
      payload: {
        source: 'window.unhandledrejection',
        ...normalizeUnknownError(event.reason)
      },
      context: options.getContext?.(),
      timestamp: Date.now()
    })
  }

  window.addEventListener('error', handleRuntimeError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)

  return () => {
    window.removeEventListener('error', handleRuntimeError)
    window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }
}
