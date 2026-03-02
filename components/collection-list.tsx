'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Collection } from '@/lib/types'

interface CollectionListProps {
  collections: Collection[]
  selectedCollection: Collection | null
  onSelectCollection: (collection: Collection) => void
  onCreateCollection: (title: string) => void
  onDeleteCollection: (id: string) => void
}

export function CollectionList({
  collections,
  selectedCollection,
  onSelectCollection,
  onCreateCollection,
  onDeleteCollection,
}: CollectionListProps) {
  const [newTitle, setNewTitle] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleCreate = () => {
    if (newTitle.trim()) {
      onCreateCollection(newTitle)
      setNewTitle('')
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">New Collection</label>
          <div className="flex gap-2">
            <Input
              placeholder="Collection name..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <Button size="sm" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold px-2">Collections</h3>
        {collections.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-4">
            No collections yet. Create one to start!
          </p>
        ) : (
          collections.map(collection => (
            <div
              key={collection.id}
              className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                selectedCollection?.id === collection.id
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-muted border border-transparent'
              }`}
              onClick={() => onSelectCollection(collection)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{collection.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(collection.items || []).length} API{(collection.items || []).length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setDeleteId(collection.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Collection</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. All API items in this collection will be deleted.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDeleteCollection(deleteId)
                  setDeleteId(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
