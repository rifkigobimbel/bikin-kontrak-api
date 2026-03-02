'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

interface HeaderProps {
  onClearAll?: () => void
}

export function Header({ onClearAll }: HeaderProps) {
  const [showClearDialog, setShowClearDialog] = useState(false)

  const handleClear = () => {
    onClearAll?.()
    setShowClearDialog(false)
  }

  return (
    <>
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold">
                API
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">API Contract Maker</h1>
                <p className="text-sm text-muted-foreground">
                  Document and export API specifications
                </p>
              </div>
            </div>
            {onClearAll && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </header>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Clear All Collections</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete all your API collections and cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
