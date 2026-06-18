type ElementMessage = (typeof import('element-plus/es/components/message/index'))['ElMessage']
type MessageInput = Parameters<ElementMessage['success']>[0]
type MessageType = 'success' | 'warning' | 'error' | 'info'

let elementMessagePromise: Promise<ElementMessage> | null = null

async function loadElementMessage(): Promise<ElementMessage> {
  if (!elementMessagePromise) {
    elementMessagePromise = Promise.all([
      import('element-plus/es/components/message/style/css'),
      import('element-plus/es/components/message/index')
    ]).then(([, elementPlusMessage]) => elementPlusMessage.ElMessage)
  }

  return elementMessagePromise
}

function showMessage(type: MessageType, message: MessageInput): void {
  void loadElementMessage()
    .then((ElMessage) => {
      ElMessage[type](message)
    })
    .catch((error: unknown) => {
      console.error('[portal-message] failed to load Element Plus message', error)
    })
}

export const portalMessage = {
  error(message: MessageInput): void {
    showMessage('error', message)
  },
  info(message: MessageInput): void {
    showMessage('info', message)
  },
  success(message: MessageInput): void {
    showMessage('success', message)
  },
  warning(message: MessageInput): void {
    showMessage('warning', message)
  }
}
