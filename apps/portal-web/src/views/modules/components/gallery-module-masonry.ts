import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

import { resolvePortalViewportMode } from '@/utils/viewport-mode'

const GALLERY_MODULE_DESKTOP_COLUMN_COUNT = 5
const GALLERY_MODULE_MOBILE_COLUMN_COUNT = 2

export interface GalleryModuleMasonryColumnItem<TItem> {
  index: number
  item: TItem
}

function readGalleryModuleColumnCount(): number {
  if (typeof window === 'undefined') {
    return GALLERY_MODULE_DESKTOP_COLUMN_COUNT
  }

  return resolvePortalViewportMode(window.innerWidth) === 'mobile'
    ? GALLERY_MODULE_MOBILE_COLUMN_COUNT
    : GALLERY_MODULE_DESKTOP_COLUMN_COUNT
}

export function useGalleryModuleMasonryColumns<TItem>(items: Ref<readonly TItem[]>) {
  const columnCount = ref(readGalleryModuleColumnCount())
  const columns = computed<GalleryModuleMasonryColumnItem<TItem>[][]>(() => {
    const nextColumns = Array.from(
      { length: columnCount.value },
      () => [] as GalleryModuleMasonryColumnItem<TItem>[]
    )

    items.value.forEach((item, index) => {
      nextColumns[index % columnCount.value]?.push({
        index,
        item
      })
    })

    return nextColumns
  })

  function syncColumnCount(): void {
    columnCount.value = readGalleryModuleColumnCount()
  }

  onMounted(() => {
    syncColumnCount()
    window.addEventListener('resize', syncColumnCount, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', syncColumnCount)
  })

  return {
    columns,
    columnCount
  }
}
