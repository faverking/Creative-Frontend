import type { TrackingEvent, TrackingStorage } from './types'

const DEFAULT_DB_NAME = 'monoapp-tracking'
const DEFAULT_STORE_NAME = 'events'

export class InMemoryTrackingStorage implements TrackingStorage {
  private readonly events: TrackingEvent[] = []

  async initialize(): Promise<void> {
    return Promise.resolve()
  }

  async add(event: TrackingEvent): Promise<void> {
    this.events.push(event)
  }

  async list(limit = 20): Promise<TrackingEvent[]> {
    return this.events.slice(0, limit)
  }

  async remove(ids: string[]): Promise<void> {
    const idSet = new Set(ids)
    for (let index = this.events.length - 1; index >= 0; index -= 1) {
      if (idSet.has(this.events[index].id)) {
        this.events.splice(index, 1)
      }
    }
  }
}

export class IndexedDbTrackingStorage implements TrackingStorage {
  private dbPromise: Promise<IDBDatabase> | null = null

  constructor(
    private readonly dbName = DEFAULT_DB_NAME,
    private readonly storeName = DEFAULT_STORE_NAME
  ) {}

  async initialize(): Promise<void> {
    await this.getDatabase()
  }

  async add(event: TrackingEvent): Promise<void> {
    const db = await this.getDatabase()

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(event)

      request.onerror = () => {
        reject(request.error ?? new Error('Failed to store tracking event.'))
      }
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('Failed to store tracking event.'))
      }
      transaction.onabort = () => {
        reject(transaction.error ?? new Error('Tracking event transaction aborted.'))
      }
    })
  }

  async list(limit = 20): Promise<TrackingEvent[]> {
    const db = await this.getDatabase()

    return new Promise<TrackingEvent[]>((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('timestamp')
      const events: TrackingEvent[] = []
      const request = index.openCursor()

      request.onerror = () => {
        reject(request.error ?? new Error('Failed to read tracking events.'))
      }

      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor || events.length >= limit) {
          resolve(events)
          return
        }

        events.push(cursor.value as TrackingEvent)
        cursor.continue()
      }
    })
  }

  async remove(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return
    }

    const db = await this.getDatabase()

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)

      ids.forEach((id) => {
        store.delete(id)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => {
        reject(transaction.error ?? new Error('Failed to delete tracking events.'))
      }
      transaction.onabort = () => {
        reject(transaction.error ?? new Error('Tracking event delete transaction aborted.'))
      }
    })
  }

  private getDatabase(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(this.dbName, 1)

        request.onupgradeneeded = () => {
          const database = request.result
          if (!database.objectStoreNames.contains(this.storeName)) {
            const store = database.createObjectStore(this.storeName, {
              keyPath: 'id'
            })
            store.createIndex('timestamp', 'timestamp', {
              unique: false
            })
          }
        }

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => {
          reject(request.error ?? new Error('Failed to open tracking IndexedDB.'))
        }
      })
    }

    return this.dbPromise
  }
}

class ResilientTrackingStorage implements TrackingStorage {
  private activeStorage: TrackingStorage

  constructor(
    private readonly primaryStorage: TrackingStorage,
    private readonly fallbackStorage: TrackingStorage
  ) {
    this.activeStorage = primaryStorage
  }

  async initialize(): Promise<void> {
    try {
      await this.primaryStorage.initialize()
      this.activeStorage = this.primaryStorage
    } catch {
      await this.fallbackStorage.initialize()
      this.activeStorage = this.fallbackStorage
    }
  }

  async add(event: TrackingEvent): Promise<void> {
    await this.ensureInitialized()
    return this.activeStorage.add(event)
  }

  async list(limit?: number): Promise<TrackingEvent[]> {
    await this.ensureInitialized()
    return this.activeStorage.list(limit)
  }

  async remove(ids: string[]): Promise<void> {
    await this.ensureInitialized()
    return this.activeStorage.remove(ids)
  }

  private async ensureInitialized(): Promise<void> {
    if (this.activeStorage === this.primaryStorage) {
      try {
        await this.primaryStorage.initialize()
      } catch {
        // 浏览器禁用 IndexedDB 或初始化失败时，自动降级到内存存储。
        await this.fallbackStorage.initialize()
        this.activeStorage = this.fallbackStorage
      }
      return
    }

    await this.activeStorage.initialize()
  }
}

export function createDefaultTrackingStorage(): TrackingStorage {
  if (typeof indexedDB === 'undefined') {
    return new InMemoryTrackingStorage()
  }

  return new ResilientTrackingStorage(new IndexedDbTrackingStorage(), new InMemoryTrackingStorage())
}
