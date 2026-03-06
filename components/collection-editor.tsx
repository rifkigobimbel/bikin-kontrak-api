'use client'

import { useState, useEffect } from 'react'
import { Plus, FileJson, FileText, Download, Copy, Edit2, Trash2, Check, Eye, X, Share, Import, FileUp, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ApiItemForm } from '@/components/api-item-form'
import { exportAsMarkdown, exportAsPostman, exportAsTypeScript, downloadFile } from '@/lib/export'
import type { Collection, ApiItem } from '@/lib/types'
import { useDebounce } from '@/hooks/use-debounce'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { toast } from 'sonner'

interface CollectionEditorProps {
  collection: Collection
  onUpdate: (collection: Collection) => void
  onClose: () => void
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  OPTIONS: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
  HEAD: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
}

export function CollectionEditor({ collection, onUpdate, onClose }: CollectionEditorProps) {
  const [editingItem, setEditingItem] = useState<ApiItem | null>(null)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<ApiItem | null>(null)
  const [isEditingBasePath, setIsEditingBasePath] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [generalDesc, setGeneralDesc] = useState(collection.description || '')
  const debouncedSearch = useDebounce(searchValue, 300)

  useEffect(() => {
    setGeneralDesc(collection.description || '')
  }, [collection.id, collection.description])

  const handleSaveDescription = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({
      ...collection,
      description: generalDesc,
    })
    toast.success('Description saved')
  }

  const filteredItems = debouncedSearch
    ? collection.items.filter(item =>
        item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.path.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : collection.items

  const handleCreateItem = () => {
    const newItem: ApiItem = {
      id: Date.now().toString(),
      title: '',
      description: '',
      method: 'GET',
      path: '',
      params: [],
      body: '',
      response: '',
      headers: [],
    }
    setEditingItem(newItem)
  }

  const groupedItems = (filteredItems || []).reduce((acc, item) => {
    const module = item.path ? item.path.split('/')[1] || 'root' : 'ungrouped'
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(item)
    return acc
  }, {} as Record<string, ApiItem[]>)

  const handleSaveItem = (item: ApiItem) => {
    const existingItem = collection.items.find(i => i.id === item.id)
    const updatedItems = existingItem
      ? collection.items.map(i => (i.id === item.id ? item : i))
      : [...collection.items, item]

    onUpdate({
      ...collection,
      items: updatedItems,
    })
    setEditingItem(null)
  }

  const handleDeleteItem = (id: string) => {
    onUpdate({
      ...collection,
      items: collection.items.filter(item => item.id !== id),
    })
    setDeleteItemId(null)
  }

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
    })
  }

  const handleExportMarkdown = (action: 'download' | 'copy') => {
    const markdown = exportAsMarkdown(collection)
    if (action === 'download') {
      downloadFile(markdown, `${collection.title.replace(/\s+/g, '-').toLowerCase()}.md`, 'text/markdown')
    } else {
      copyToClipboard(markdown, 'markdown')
    }
  }

  const handleExportPostman = (action: 'download' | 'copy') => {
    const postman = exportAsPostman(collection)
    const json = JSON.stringify(postman, null, 2)
    if (action === 'download') {
      downloadFile(json, `${collection.title.replace(/\s+/g, '-').toLowerCase()}_postman.json`, 'application/json')
    } else {
      copyToClipboard(json, 'postman')
    }
  }

  const handleExportTypeScript = (action: 'download' | 'copy') => {
    const typescript = exportAsTypeScript(collection)
    if (action === 'download') {
      downloadFile(typescript, `${collection.title.replace(/\s+/g, '-').toLowerCase()}.ts`, 'text/typescript')
    } else {
      copyToClipboard(typescript, 'typescript')
    }
  }

  const handleUpdateBasePath = (basePath: string) => {
    onUpdate({
      ...collection,
      basePath,
    })
    setIsEditingBasePath(false)
  }

  const handleExport = (action: 'download' | 'copy') => {
    const json = JSON.stringify(collection, null, 2)
    if (action === 'download') {
      downloadFile(json, `${collection.title.replace(/\s+/g, '-').toLowerCase()}.kontrak-api.json`, 'application/json')
    } else {
      copyToClipboard(json, 'export')
    }
  }

  if (editingItem) {
    return (
      <Card className="p-8">
        <ApiItemForm
          item={editingItem}
          onSave={handleSaveItem}
          onCancel={() => setEditingItem(null)}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          {isEditingTitle ? (
            <div className="flex gap-2">
              <Input
                defaultValue={collection.title}
                placeholder="Collection Title"
                className="w-64 h-10 text-lg font-semibold"
                onBlur={e => {
                  onUpdate({ ...collection, title: e.target.value })
                  setIsEditingTitle(false)
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    onUpdate({ ...collection, title: (e.target as HTMLInputElement).value })
                    setIsEditingTitle(false)
                  }
                }}
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{collection.title || 'Untitled Collection'}</h2>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Base Path:</span>
            {isEditingBasePath ? (
              <div className="flex gap-2">
                <Input
                  defaultValue={collection.basePath}
                  placeholder="api/v1"
                  className="w-40 h-8"
                  onBlur={e => handleUpdateBasePath(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleUpdateBasePath((e.target as HTMLInputElement).value)
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded">{collection.basePath || '(none)'}</code>
                <button
                  onClick={() => setIsEditingBasePath(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-3">
            {collection.items.length} endpoint{collection.items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileText className="w-4 h-4" />
                Markdown
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportMarkdown('download')} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportMarkdown('copy')} className="gap-2">
                {copiedType === 'markdown' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileJson className="w-4 h-4" />
                Postman
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportPostman('download')} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportPostman('copy')} className="gap-2">
                {copiedType === 'postman' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileJson className="w-4 h-4" />
                TypeScript
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportTypeScript('download')} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportTypeScript('copy')} className="gap-2">
                {copiedType === 'typescript' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FileUp className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('download')} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('copy')} className="gap-2">
                {copiedType === 'export' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={handleCreateItem} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Endpoint
          </Button>
        </div>
      </div>


      <form className='my-4 w-full space-y-2' onSubmit={handleSaveDescription}>
        <Label htmlFor='general-description'>General description (markdown)</Label>
        <Textarea 
          id='general-description' 
          className='w-full' 
          placeholder='Describe this API collection...' 
          value={generalDesc}
          onChange={(e) => setGeneralDesc(e.target.value)}
        />
        {generalDesc !== (collection.description || '') && (
          <Button 
            type="submit" 
          >
            Save Changes
          </Button>
        )}
      </form>

      <Separator />

      {collection.items.length > 0 && (
        <div className="flex items-center gap-2">
          <Input type='search' placeholder="Search endpoints..." value={searchValue} onChange={e => setSearchValue(e.target.value)} />
        </div>
      )}

      {/* API Items List - Grouped by Module */}
      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <Card className="p-12 flex flex-col items-center justify-center text-center">
            {!debouncedSearch ? (
              <>
                <FileText className="w-10 h-10 mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No endpoints yet. Click "Add Endpoint" to create your first one!</p>
              </>
            ) : (
              <>
                <FileText className="w-10 h-10 mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No endpoints found for <span className="font-bold">"{debouncedSearch}"</span></p>
              </>
            )}
          </Card>
        ) : (
          Object.entries(groupedItems).map(([module, items]) => (
            <div key={module} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">/{module}</h3>
                <Badge variant="outline">{items.length} endpoint{items.length !== 1 ? 's' : ''}</Badge>
              </div>
              <div className="space-y-2">
                {items.map(item => (
                  <Card key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={METHOD_COLORS[item.method]}>
                            {item.method}
                          </Badge>
                          <span className="font-mono text-sm text-muted-foreground">{item.path}</span>
                          <h3 className="font-semibold truncate">{item.title || 'Untitled'}</h3>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                          {item.params.length > 0 && (
                            <span>{item.params.length} param{item.params.length !== 1 ? 's' : ''}</span>
                          )}
                          {item.headers.length > 0 && (
                            <span>{item.headers.length} header{item.headers.length !== 1 ? 's' : ''}</span>
                          )}
                          {item.body && <span>Request body</span>}
                          {item.response && <span>Response example</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setDetailItem(item)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-2"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteItemId(item.id)}
                          className="text-destructive hover:text-destructive/80 transition-colors p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{detailItem.title}</h3>
              <button
                onClick={() => setDetailItem(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {detailItem.description && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground">{detailItem.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Method</h4>
                  <Badge className={METHOD_COLORS[detailItem.method]}>
                    {detailItem.method}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Path</h4>
                  <code className="text-sm bg-muted px-2 py-1 rounded block">{collection.basePath}{detailItem.path}</code>
                </div>
              </div>

              {detailItem.params.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Query Parameters</h4>
                  <div className="space-y-2">
                    {detailItem.params.map((param, idx) => (
                      <div key={idx} className="text-sm p-2 bg-muted rounded">
                        <div className="font-mono font-semibold">{param.key}</div>
                        <div className="text-xs text-muted-foreground">Type: {param.type}</div>
                        {param.description && <div className="text-xs text-muted-foreground mt-1">{param.description}</div>}
                        {param.enumValues && <div className="text-xs text-muted-foreground mt-1">Values: {param.enumValues}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailItem.headers.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Headers</h4>
                  <div className="space-y-1 text-sm">
                    {detailItem.headers.map((header, idx) => (
                      <div key={idx} className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {header.key}: {header.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailItem.body && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Request Body</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-48">{detailItem.body}</pre>
                </div>
              )}

              {detailItem.response && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Response Example</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-48">{detailItem.response}</pre>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={open => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Endpoint</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The API endpoint will be permanently deleted.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteItemId) {
                  handleDeleteItem(deleteItemId)
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
