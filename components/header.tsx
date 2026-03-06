'use client'

import { Button } from '@/components/ui/button'
import { Braces, Check, Copy, Download, FileDown, FileUp, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useRef, useState } from 'react'
import { ModeToggle } from './mode-toggle'
import Link from 'next/link'
import { Input } from './ui/input'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Collection } from '@/lib/types'
import { loadCollections, saveCollections } from '@/lib/indexeddb'

interface HeaderProps {
  onClearAll?: () => void
  onImportSuccess?: (collection: Collection) => void
}

export function Header({ onClearAll, onImportSuccess }: HeaderProps) {
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [importData, setImportData] = useState<Collection | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const postmanFileRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onClearAll?.()
    setShowClearDialog(false)
  }

  const handleImportKontrak = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if(!file.name.endsWith('.kontrak-api.json')){
      toast.info('File must exportted from bikin-kontrak-api (formated .kontrak-api.json)')
      return
    }

    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Collection
        
        // Validate basic structure
        if (!data.title || !data.id || !Array.isArray(data.items)) {
          toast.error('Invalid collection format')
          setIsLoading(false)
          return
        }

        const existingCollections = await loadCollections()
        const isExist = existingCollections.some(col => col.title === data.title)

        if (isExist) {
          setImportData(data)
          setShowImportConfirm(true)
        } else {
          // No collision, just save
          const newCollections = [...existingCollections, data]
          await saveCollections(newCollections)
          onImportSuccess?.(data)
          toast.success('Collection imported successfully')
        }
      } catch (err) {
        toast.error('Failed to parse file')
      } finally {
        setIsLoading(false)
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
      setIsLoading(false)
    }
    reader.readAsText(file)
    
    // Clear the input value so the same file can be imported again if needed
    if (fileRef.current) {
      fileRef.current.value = ''
    }
  }

  const handleConfirmImport = async () => {
    if (!importData) return
    setIsLoading(true)
    try {
      const existingCollections = await loadCollections()
      let newTitle = importData.title
      let counter = 2
      
      while (existingCollections.some(col => col.title === newTitle)) {
        newTitle = `${importData.title} v${counter}`
        counter++
      }

      const newCollection = {
        ...importData,
        id: Date.now().toString(), // Give it a new ID to avoid ID collision
        title: newTitle
      }
      
      const newCollections = [...existingCollections, newCollection]
      await saveCollections(newCollections)
      onImportSuccess?.(newCollection)
      toast.success(`Imported as ${newTitle}`)
    } catch (err) {
      toast.error('Failed to import collection')
    } finally {
      setIsLoading(false)
      setShowImportConfirm(false)
      setImportData(null)
    }
  }

  const handleImportPostman = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if(!file.name.endsWith('.json')){
      toast.info('File must be a JSON file')
      return
    }

    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        // Validate basic structure for Postman v2.1.0 or v2.0.0
        if (!data.info || !data.info.name || !Array.isArray(data.item)) {
          toast.error('Invalid Postman collection format')
          setIsLoading(false)
          return
        }

        const extractItems = (items: any[]): any[] => {
          let flatItems: any[] = []
          for (const item of items) {
            if (item.item && Array.isArray(item.item)) {
              flatItems = [...flatItems, ...extractItems(item.item)]
            } else if (item.request) {
              flatItems.push(item)
            }
          }
          return flatItems
        }

        const flatRequests = extractItems(data.item)

        const newCollection: Collection = {
          id: Date.now().toString(),
          title: data.info.name,
          basePath: '',
          items: flatRequests.map((item: any, index: number) => {
            let reqUrl = ''
            if (item.request?.url) {
              if (typeof item.request.url === 'string') {
                reqUrl = item.request.url
              } else if (item.request.url.raw) {
                reqUrl = item.request.url.raw
              }
            }

            let path = reqUrl
            try {
              if (reqUrl.startsWith('http')) {
                 const urlObj = new URL(reqUrl)
                 path = urlObj.pathname + (urlObj.search || '')
              }
            } catch(e) {}

            let method = item.request?.method?.toUpperCase() || 'GET'
            
            const headers = (item.request?.header || []).map((h: any) => ({
              key: h.key || '',
              value: h.value || ''
            }))

            let body = ''
            if (item.request?.body?.mode === 'raw') {
              body = item.request.body.raw || ''
            } else if (item.request?.body?.mode === 'urlencoded') {
              body = (item.request.body.urlencoded || []).map((p: any) => `${p.key}=${p.value}`).join('&')
            } else if (item.request?.body?.mode === 'formdata') {
              body = (item.request.body.formdata || []).map((p: any) => `${p.key}=${p.value}`).join('\\n')
            }

            // Map params if any in url.query
            const params: any[] = []
            if (item.request?.url?.query && Array.isArray(item.request.url.query)) {
              for (const q of item.request.url.query) {
                 params.push({
                   key: q.key || '',
                   type: 'string', // Default fallback
                   description: q.description || ''
                 })
              }
            }

            return {
              id: Date.now().toString() + index + Math.random().toString(36).substr(2, 5),
              title: item.name || 'Untitled Request',
              description: item.request?.description || '',
              method: method as any,
              path: path,
              params: params,
              body: body,
              response: '',
              headers: headers
            }
          }),
          createdAt: new Date().toISOString()
        }

        const existingCollections = await loadCollections()
        const isExist = existingCollections.some(col => col.title === newCollection.title)

        if (isExist) {
          setImportData(newCollection)
          setShowImportConfirm(true)
        } else {
          // No collision, just save
          const newCollections = [...existingCollections, newCollection]
          await saveCollections(newCollections)
          onImportSuccess?.(newCollection)
          toast.success('Postman collection imported successfully')
        }
      } catch (err) {
        toast.error('Failed to parse file')
      } finally {
        setIsLoading(false)
      }
    }
    reader.onerror = () => {
      toast.error('Failed to read file')
      setIsLoading(false)
    }
    reader.readAsText(file)
    
    // Clear the input value so the same file can be imported again if needed
    if (postmanFileRef.current) {
      postmanFileRef.current.value = ''
    }
  }

  const importPostman = () => {
    postmanFileRef.current?.click()
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
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2" disabled={isLoading}>
                    <FileDown className="w-4 h-4" />
                    {isLoading ? 'Importing...' : 'Import'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="gap-2" asChild onClick={e => {
                    e.preventDefault()
                    fileRef.current?.click()
                  }}>
                    <label htmlFor="import">
                      <FileDown className="w-4 h-4" />
                      Kontrak API Collection
                    </label>
                </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" asChild onClick={e => {
                    e.preventDefault()
                    importPostman()
                  }}>
                    <label htmlFor="import-postman">
                      <Braces className="w-4 h-4" />
                      Postman Collection
                    </label>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
              asChild
              size={"icon"}
                variant="outline">
                  <Link
                    target='_blank'
                    href={"https://github.com/rifkigobimbel/bikin-kontrak-api"}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z"></path></svg>
                  </Link>
              </Button>
            <ModeToggle />
            {onClearAll && (
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setShowClearDialog(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            </div>
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

      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogTitle>Collection Already Exists</AlertDialogTitle>
          <AlertDialogDescription>
            A collection with the title "{importData?.title}" already exists. 
            Do you want to import this as a new version?
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel
              disabled={isLoading}
              onClick={() => {
                setShowImportConfirm(false);
                setImportData(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmImport}
              disabled={isLoading}
            >
              {isLoading ? 'Importing...' : 'Import as New Version'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>


      <Input ref={fileRef} type="file" accept='.kontrak-api.json' id="import" className="sr-only" onChange={handleImportKontrak} />
      <Input ref={postmanFileRef} type="file" accept='.json' id="import-postman" className="sr-only" onChange={handleImportPostman} />
    </>
  )
}
