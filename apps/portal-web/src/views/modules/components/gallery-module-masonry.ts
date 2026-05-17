import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const GALLERY_MODULE_COLUMN_COUNT_VARIABLE = '--portal-gallery-module-column-count'

export interface GalleryModuleMasonryColumnItem<TItem> {
  index: number
  item: TItem
}

function readGalleryModuleColumnCount(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 1
  }

  const rawColumnCount = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(GALLERY_MODULE_COLUMN_COUNT_VARIABLE)
    .trim()
  const nextColumnCount = Number.parseInt(rawColumnCount, 10)

  return Number.isFinite(nextColumnCount) && nextColumnCount > 0 ? nextColumnCount : 1
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
