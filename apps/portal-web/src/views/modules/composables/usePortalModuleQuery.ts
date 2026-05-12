import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import type { ApiRequestResult } from '@/api/public-request'
import type { PortalRequestBoundaryErrorCode } from '@/components/PortalRequestBoundary.vue'
import type { PortalModuleListMode, PortalModuleSort } from '@/constants/public-modules'

function readSingleQueryValue(value: unknown): string {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0].trim() : ''
  }

  return typeof value === 'string' ? value.trim() : ''
}

function normalizeKeyword(value: string): string {
  return value.trim()
}

function parsePage(value: unknown): number {
  const normalized = readSingleQueryValue(value)

  if (!normalized) {
    return 1
  }

  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1
}

export interface PortalModuleListResponse<TItem> {
  items: TItem[]
  page: number
  limit: number
  total: number
}

interface PortalModuleFetchQuery<TCategory extends number | string> {
  categoryValue?: TCategory
  keyword?: string
  limit: number
  page: number
  sort: PortalModuleSort
}

interface UsePortalModuleQueryOptions<TItem, TCategory extends number | string> {
  categoryQueryKey: string
  defaultSort: PortalModuleSort
  fetchPage: (
    query: PortalModuleFetchQuery<TCategory>
  ) => Promise<ApiRequestResult<PortalModuleListResponse<TItem>>>
  listMode: PortalModuleListMode
  pageSize: number
  parseCategory: (value: unknown) => TCategory | undefined
  routeName: string
  serializeCategory: (value: TCategory | undefined) => string | undefined
}

export function usePortalModuleQuery<TItem, TCategory extends number | string>(
  options: UsePortalModuleQueryOptions<TItem, TCategory>
) {
  const route = useRoute()
  const router = useRouter()

  const keywordInput = ref('')
  const items = ref<TItem[]>([])
  const total = ref(0)
  const hasLoaded = ref(false)
  const loading = ref(false)
  const primaryError = ref(false)
  const primaryErrorCode = ref<PortalRequestBoundaryErrorCode>(500)
  const loadingMore = ref(false)
  const appendError = ref(false)
  const internalPage = ref(1)
  const hasMore = ref(true)

  let requestToken = 0

  const activeKeyword = computed(() => normalizeKeyword(readSingleQueryValue(route.query.keyword)))
  const activeCategoryValue = computed(() =>
    options.parseCategory(route.query[options.categoryQueryKey])
  )
  const activeSort = computed<PortalModuleSort>(() => {
    const raw = readSingleQueryValue(route.query.sort)
    return raw === 'latest' || raw === 'hot' || raw === 'recommend' ? raw : options.defaultSort
  })
  const routePage = computed(() => parsePage(route.query.page))
  const activePage = computed(() =>
    options.listMode === 'paged' ? routePage.value : internalPage.value
  )

  const requestBase = computed<Omit<PortalModuleFetchQuery<TCategory>, 'page'>>(() => ({
    categoryValue: activeCategoryValue.value,
    keyword: activeKeyword.value || undefined,
    limit: options.pageSize,
    sort: activeSort.value
  }))

  const totalPages = computed(() =>
    total.value > 0 ? Math.max(1, Math.ceil(total.value / options.pageSize)) : 1
  )

  const hasActiveFilters = computed(
    () =>
      activeKeyword.value.length > 0 ||
      activeCategoryValue.value != null ||
      activeSort.value !== options.defaultSort
  )

  const canLoadMore = computed(
    () =>
      options.listMode === 'append' &&
      hasMore.value &&
      !appendError.value &&
      !loading.value &&
      !loadingMore.value &&
      items.value.length > 0 &&
      items.value.length < total.value
  )

  const isRefreshing = computed(
    () => options.listMode === 'append' && loading.value && hasLoaded.value
  )

  watch(
    activeKeyword,
    (value) => {
      keywordInput.value = value
    },
    { immediate: true }
  )

  function createRouteQuery(
    keyword: string,
    categoryValue: TCategory | undefined,
    sort: PortalModuleSort,
    page: number
  ) {
    const serializedCategory = options.serializeCategory(categoryValue)

    return {
      ...(keyword ? { keyword } : {}),
      ...(serializedCategory ? { [options.categoryQueryKey]: serializedCategory } : {}),
      ...(sort !== options.defaultSort ? { sort } : {}),
      ...(options.listMode === 'paged' && page > 1 ? { page: `${page}` } : {})
    }
  }

  async function syncQuery(next: {
    categoryValue?: TCategory
    keyword?: string
    page?: number
    sort?: PortalModuleSort
  }): Promise<void> {
    const keyword = normalizeKeyword(next.keyword ?? activeKeyword.value)
    const categoryValue = Object.prototype.hasOwnProperty.call(next, 'categoryValue')
      ? next.categoryValue
      : activeCategoryValue.value
    const sort = next.sort ?? activeSort.value
    const page = Math.max(1, next.page ?? (options.listMode === 'paged' ? routePage.value : 1))

    const nextQuery = createRouteQuery(keyword, categoryValue, sort, page)
    const currentQuery = createRouteQuery(
      activeKeyword.value,
      activeCategoryValue.value,
      activeSort.value,
      options.listMode === 'paged' ? routePage.value : 1
    )

    if (JSON.stringify(nextQuery) === JSON.stringify(currentQuery)) {
      return
    }

    await router.replace({
      name: options.routeName,
      query: nextQuery
    })
  }

  function applyPageResult(response: PortalModuleListResponse<TItem>, append: boolean): void {
    if (append) {
      const mergedItems = [...items.value, ...response.items]
      const uniqueItems = Array.from(
        new Map(
          mergedItems.map((item, index) => [getItemIdentity(item, index), item] as const)
        ).values()
      ) as TItem[]

      items.value = uniqueItems
      total.value = Math.max(response.total, uniqueItems.length)
      internalPage.value = response.page
      hasMore.value = uniqueItems.length < total.value && response.items.length > 0
      if (uniqueItems.length === mergedItems.length - response.items.length) {
        appendError.value = true
      }
      return
    }

    items.value = response.items
    total.value = response.total
    internalPage.value = response.page
    hasMore.value = response.items.length > 0 && response.items.length < response.total
  }

  async function fetchModulePage(targetPage: number, append: boolean): Promise<void> {
    const token = ++requestToken

    if (append) {
      appendError.value = false
    }

    const requestQuery: PortalModuleFetchQuery<TCategory> = {
      ...requestBase.value,
      page: targetPage
    }

    const response = await options.fetchPage(requestQuery)

    if (token !== requestToken) {
      return
    }

    if (response.data) {
      primaryError.value = false
      primaryErrorCode.value = 500
      applyPageResult(response.data, append)
      return
    }

    if (append) {
      appendError.value = true
      return
    }

    primaryError.value = true
    primaryErrorCode.value = response.errorCode ?? 500
    items.value = []
    total.value = 0
    internalPage.value = 1
    hasMore.value = false
  }

  async function refresh(): Promise<void> {
    loading.value = true
    primaryError.value = false
    primaryErrorCode.value = 500
    appendError.value = false
    hasMore.value = true

    try {
      await fetchModulePage(options.listMode === 'paged' ? routePage.value : 1, false)
      hasLoaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function loadMore(): Promise<void> {
    if (!canLoadMore.value) {
      return
    }

    loadingMore.value = true

    try {
      await fetchModulePage(internalPage.value + 1, true)
    } finally {
      loadingMore.value = false
    }
  }

  async function retryLoadMore(): Promise<void> {
    if (!canLoadMore.value && !appendError.value) {
      return
    }

    appendError.value = false
    await loadMore()
  }

  async function submitKeyword(): Promise<void> {
    await syncQuery({
      keyword: keywordInput.value,
      page: 1
    })
  }

  async function setCategory(categoryValue?: TCategory): Promise<void> {
    await syncQuery({
      categoryValue,
      page: 1
    })
  }

  async function setSort(sort: PortalModuleSort): Promise<void> {
    await syncQuery({
      sort,
      page: 1
    })
  }

  async function setPage(page: number): Promise<void> {
    if (options.listMode !== 'paged') {
      return
    }

    await syncQuery({
      page
    })
  }

  async function clearFilters(): Promise<void> {
    keywordInput.value = ''
    await syncQuery({
      keyword: '',
      categoryValue: undefined,
      sort: options.defaultSort,
      page: 1
    })
  }

  watch(
    options.listMode === 'paged'
      ? [activeKeyword, activeCategoryValue, routePage, activeSort]
      : [activeKeyword, activeCategoryValue, activeSort],
    () => {
      void refresh()
    },
    { immediate: true }
  )

  return {
    activeCategoryValue,
    activePage,
    activeSort,
    appendError,
    canLoadMore,
    clearFilters,
    hasActiveFilters,
    hasLoaded,
    isRefreshing,
    items,
    keywordInput,
    loadMore,
    loading,
    loadingMore,
    primaryError,
    primaryErrorCode,
    refresh,
    retryLoadMore,
    setCategory,
    setPage,
    setSort,
    submitKeyword,
    total,
    totalPages
  }
}

function getItemIdentity<TItem>(item: TItem, index: number): string {
  if (item && typeof item === 'object' && 'id' in item && typeof item.id === 'string') {
    return item.id
  }

  return `${index}`
}
