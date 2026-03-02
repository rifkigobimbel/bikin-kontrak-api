import type { Collection } from './types'

const DB_NAME = 'api_contract_maker'
const STORE_NAME = 'collections'
const DB_VERSION = 1

let db: IDBDatabase | null = null

async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = event => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function loadCollections(): Promise<Collection[]> {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  } catch (error) {
    console.error('Failed to load collections from IndexedDB:', error)
    return []
  }
}

export async function saveCollections(collections: Collection[]): Promise<void> {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      // Clear existing data
      store.clear()

      // Add new data
      collections.forEach(collection => {
        store.add(collection)
      })

      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve()
    })
  } catch (error) {
    console.error('Failed to save collections to IndexedDB:', error)
  }
}

export async function clearAllCollections(): Promise<void> {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      transaction.oncomplete = () => resolve()
    })
  } catch (error) {
    console.error('Failed to clear collections from IndexedDB:', error)
  }
}
