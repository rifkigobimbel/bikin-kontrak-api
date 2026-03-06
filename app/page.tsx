'use client'

import { useState, useEffect } from 'react'
import { CollectionList } from '@/components/collection-list'
import { CollectionEditor } from '@/components/collection-editor'
import { Header } from '@/components/header'
import { loadCollections, saveCollections, clearAllCollections } from '@/lib/indexeddb'
import type { Collection } from '@/lib/types'
import { toast } from 'sonner'

export default function Home() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from IndexedDB on mount
  useEffect(() => {
    loadCollections().then(data => {
      setCollections(data)
      setIsLoaded(true)
    })
  }, [])

  // Save to IndexedDB whenever collections change
  useEffect(() => {
    if (isLoaded) {
      saveCollections(collections)
    }
  }, [collections, isLoaded])

  const handleCreateCollection = (title: string) => {
    const findExisting = collections.find(col => col.title === title)
    if (findExisting) {
      toast.info('A collection with this title already exists. Please choose a different name.')
      return
    }
    const newCollection: Collection = {
      id: Date.now().toString(),
      title,
      basePath: '',
      items: [],
      createdAt: new Date().toISOString(),
    }
    setCollections([...collections, newCollection])
  }

  const handleUpdateCollection = (updatedCollection: Collection) => {
    const findExisting = collections.find(col => col.title === updatedCollection.title && col.id !== updatedCollection.id)
    if (findExisting) {
      toast.info('A collection with this title already exists. Please choose a different name.')
      return
    }
    setCollections(
      collections.map(col => (col.id === updatedCollection.id ? updatedCollection : col))
    )
    setSelectedCollection(updatedCollection)
  }

  const handleDeleteCollection = (id: string) => {
    setCollections(collections.filter(col => col.id !== id))
    if (selectedCollection?.id === id) {
      setSelectedCollection(null)
      setShowEditor(false)
    }
  }

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection)
    setShowEditor(true)
  }

  const handleClearAll = async () => {
    await clearAllCollections()
    setCollections([])
    setSelectedCollection(null)
    setShowEditor(false)
  }

  const handleImportSuccess = (collection: Collection) => {
    setCollections(prev => [...prev, collection])
    setSelectedCollection(collection)
    setShowEditor(true)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading collections...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onClearAll={handleClearAll} onImportSuccess={handleImportSuccess} />
      <div className="flex gap-6 p-6 max-w-7xl mx-auto">
        <div className="w-full md:w-80 flex-shrink-0">
          <CollectionList
            collections={collections}
            selectedCollection={selectedCollection}
            onSelectCollection={handleSelectCollection}
            onCreateCollection={handleCreateCollection}
            onDeleteCollection={handleDeleteCollection}
          />
        </div>
        <div className="flex-1">
          {showEditor && selectedCollection ? (
            <CollectionEditor
              collection={selectedCollection}
              onUpdate={handleUpdateCollection}
              onClose={() => setShowEditor(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-96 rounded-lg border-2 border-dashed border-muted-foreground/20">
              <p className="text-muted-foreground">Select a collection to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
