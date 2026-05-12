export interface RichTextSelectionAnchor {
  left: number
  top: number
  width: number
  height: number
  containerHeight: number
}

export interface RichTextEditorSelectionSnapshot {
  mode: 'range' | 'caret'
  plainText: string
  selectedText: string
  range: {
    index: number
    length: number
  }
  anchor: RichTextSelectionAnchor
}

export interface RichTextEditorExpose {
  replaceSelection(text: string): void
  insertAtCursor(text: string): void
  focus(): void
}
