import type { Ref } from 'vue'

type ContentAiSurface = 'title' | 'summary' | 'editor'
type ContentFieldSurface = 'title' | 'summary'

interface FieldSurfaceController {
  canAccept: Ref<boolean>
  showSuggestion: Ref<boolean>
  activate(): void
  deactivate(): void
  acceptSuggestion(): void
  dismissSuggestion(): void
  reset(): void
}

interface EditorSurfaceController {
  canAccept: Ref<boolean>
  hasSuggestion: Ref<boolean>
  dismissSuggestion(): void
  reset(): void
}

interface UseContentAiSurfacesOptions {
  title: FieldSurfaceController
  summary: FieldSurfaceController
  editor: EditorSurfaceController
  acceptEditorSuggestion: () => void
}

export function useContentAiSurfaces(options: UseContentAiSurfacesOptions) {
  function activateSurface(surface: ContentAiSurface): void {
    if (surface === 'title') {
      options.title.activate()
      options.summary.deactivate()
      options.editor.reset()
      return
    }

    if (surface === 'summary') {
      options.summary.activate()
      options.title.deactivate()
      options.editor.reset()
      return
    }

    options.title.deactivate()
    options.summary.deactivate()
  }

  function handleFieldFocusOut(surface: ContentFieldSurface, event: FocusEvent): void {
    const currentTarget = event.currentTarget as HTMLElement | null
    const nextTarget = event.relatedTarget as Node | null
    if (currentTarget && nextTarget && currentTarget.contains(nextTarget)) {
      return
    }

    if (surface === 'title') {
      options.title.deactivate()
      return
    }

    options.summary.deactivate()
  }

  function handleTitleFocusIn(): void {
    activateSurface('title')
  }

  function handleSummaryFocusIn(): void {
    activateSurface('summary')
  }

  function handleTitleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && options.title.canAccept.value) {
      event.preventDefault()
      options.title.acceptSuggestion()
      return
    }

    if (event.key === 'Escape' && options.title.showSuggestion.value) {
      event.preventDefault()
      options.title.dismissSuggestion()
    }
  }

  function handleSummaryKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && options.summary.canAccept.value) {
      event.preventDefault()
      options.summary.acceptSuggestion()
      return
    }

    if (event.key === 'Escape' && options.summary.showSuggestion.value) {
      event.preventDefault()
      options.summary.dismissSuggestion()
    }
  }

  function activateEditorSurface(): void {
    activateSurface('editor')
  }

  function handleEditorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && options.editor.canAccept.value) {
      event.preventDefault()
      options.acceptEditorSuggestion()
      return
    }

    if (event.key === 'Escape' && options.editor.hasSuggestion.value) {
      event.preventDefault()
      options.editor.dismissSuggestion()
    }
  }

  function reset(): void {
    options.title.reset()
    options.summary.reset()
    options.editor.reset()
  }

  return {
    handleTitleFocusIn,
    handleSummaryFocusIn,
    handleFieldFocusOut,
    handleTitleKeydown,
    handleSummaryKeydown,
    activateEditorSurface,
    handleEditorKeydown,
    reset
  }
}
