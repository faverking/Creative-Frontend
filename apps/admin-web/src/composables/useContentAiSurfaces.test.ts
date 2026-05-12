import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import { useContentAiSurfaces } from './useContentAiSurfaces'

function createFieldController() {
  return {
    canAccept: ref(false),
    showSuggestion: ref(false),
    activate: vi.fn(),
    deactivate: vi.fn(),
    acceptSuggestion: vi.fn(),
    dismissSuggestion: vi.fn(),
    reset: vi.fn()
  }
}

function createEditorController() {
  return {
    canAccept: ref(false),
    hasSuggestion: ref(false),
    dismissSuggestion: vi.fn(),
    reset: vi.fn()
  }
}

describe('useContentAiSurfaces', () => {
  it('keeps only the active surface suggestion context', () => {
    const title = createFieldController()
    const summary = createFieldController()
    const editor = createEditorController()
    const acceptEditorSuggestion = vi.fn()
    const surfaces = useContentAiSurfaces({
      title,
      summary,
      editor,
      acceptEditorSuggestion
    })

    surfaces.handleTitleFocusIn()
    expect(title.activate).toHaveBeenCalledTimes(1)
    expect(summary.deactivate).toHaveBeenCalledTimes(1)
    expect(editor.reset).toHaveBeenCalledTimes(1)

    surfaces.handleSummaryFocusIn()
    expect(summary.activate).toHaveBeenCalledTimes(1)
    expect(title.deactivate).toHaveBeenCalledTimes(1)
    expect(editor.reset).toHaveBeenCalledTimes(2)

    surfaces.activateEditorSurface()
    expect(title.deactivate).toHaveBeenCalledTimes(2)
    expect(summary.deactivate).toHaveBeenCalledTimes(2)
  })

  it('routes Tab and Escape to the current surface only', () => {
    const title = createFieldController()
    const summary = createFieldController()
    const editor = createEditorController()
    const acceptEditorSuggestion = vi.fn()
    const surfaces = useContentAiSurfaces({
      title,
      summary,
      editor,
      acceptEditorSuggestion
    })

    title.canAccept.value = true
    surfaces.handleTitleKeydown(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(title.acceptSuggestion).toHaveBeenCalledTimes(1)

    summary.showSuggestion.value = true
    surfaces.handleSummaryKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(summary.dismissSuggestion).toHaveBeenCalledTimes(1)

    editor.canAccept.value = true
    surfaces.handleEditorKeydown(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(acceptEditorSuggestion).toHaveBeenCalledTimes(1)
  })

  it('resets all surfaces together when content context changes', () => {
    const title = createFieldController()
    const summary = createFieldController()
    const editor = createEditorController()
    const surfaces = useContentAiSurfaces({
      title,
      summary,
      editor,
      acceptEditorSuggestion: vi.fn()
    })

    surfaces.reset()

    expect(title.reset).toHaveBeenCalledTimes(1)
    expect(summary.reset).toHaveBeenCalledTimes(1)
    expect(editor.reset).toHaveBeenCalledTimes(1)
  })
})
