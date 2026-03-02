'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { ApiItem, ApiParam, ApiHeader } from '@/lib/types'

interface ApiItemFormProps {
  item: ApiItem
  onSave: (item: ApiItem) => void
  onCancel: () => void
}

const methodsWithoutBody = ['GET', 'DELETE', 'HEAD', 'OPTIONS']

function formatJSON(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
}

export function ApiItemForm({ item, onSave, onCancel }: ApiItemFormProps) {
  const [formData, setFormData] = useState(item)
  const [newParam, setNewParam] = useState({ key: '', type: 'string' as const, description: '', enumValues: '' })
  const [newHeader, setNewHeader] = useState({ key: '', value: '' })

  const supportsBody = !methodsWithoutBody.includes(formData.method)
  const supportsParams = formData.method !== 'HEAD'

  const handleAddParam = () => {
    if (newParam.key.trim()) {
      setFormData({
        ...formData,
        params: [...formData.params, { key: newParam.key, type: newParam.type, description: newParam.description, enumValues: newParam.enumValues }],
      })
      setNewParam({ key: '', type: 'string', description: '', enumValues: '' })
    }
  }

  const handleRemoveParam = (index: number) => {
    setFormData({
      ...formData,
      params: formData.params.filter((_, i) => i !== index),
    })
  }

  const handleAddHeader = () => {
    if (newHeader.key.trim() && newHeader.value.trim()) {
      setFormData({
        ...formData,
        headers: [...formData.headers, newHeader],
      })
      setNewHeader({ key: '', value: '' })
    }
  }

  const handleRemoveHeader = (index: number) => {
    setFormData({
      ...formData,
      headers: formData.headers.filter((_, i) => i !== index),
    })
  }

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }
    if (!formData.path.trim()) {
      alert('Please enter a path')
      return
    }
    onSave(formData)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{item.id === 'new' ? 'New API Endpoint' : 'Edit Endpoint'}</h3>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid gap-6">
        {/* Title and Method */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Get User by ID"
            />
          </div>
          <div>
            <Label htmlFor="method">Method</Label>
            <Select value={formData.method} onValueChange={method => setFormData({ ...formData, method: method as any })}>
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                <SelectItem value="HEAD">HEAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="path">Path</Label>
            <Input
              id="path"
              value={formData.path}
              onChange={e => setFormData({ ...formData, path: e.target.value })}
              placeholder="/api/v1/users/{id}"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what this endpoint does..."
            rows={2}
          />
        </div>

        <Separator />

        {/* Query Parameters */}
        {supportsParams && (
        <div>
          <h4 className="font-semibold mb-3">Query Parameters</h4>
          {formData.params.length > 0 && (
            <div className="space-y-2 mb-4">
              {formData.params.map((param, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-muted rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono">{param.key}</p>
                      <span className="text-xs px-2 py-0.5 bg-background rounded text-muted-foreground">{param.type}</span>
                    </div>
                    {param.description && (
                      <p className="text-xs text-muted-foreground italic mt-1">{param.description}</p>
                    )}
                    {param.enumValues && (
                      <p className="text-xs text-muted-foreground mt-1">Values: {param.enumValues}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveParam(idx)}
                    className="text-destructive hover:text-destructive/80 transition-colors p-1 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Parameter name"
                value={newParam.key}
                onChange={e => setNewParam({ ...newParam, key: e.target.value })}
              />
              <Select value={newParam.type} onValueChange={type => setNewParam({ ...newParam, type: type as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="enum">Enum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Description (optional)"
              value={newParam.description}
              onChange={e => setNewParam({ ...newParam, description: e.target.value })}
            />
            {newParam.type === 'enum' && (
              <Input
                placeholder="Enum values (comma-separated)"
                value={newParam.enumValues}
                onChange={e => setNewParam({ ...newParam, enumValues: e.target.value })}
              />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddParam}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Parameter
            </Button>
          </div>
        </div>
        )}

        <Separator />

        {/* Headers */}
        <div>
          <h4 className="font-semibold mb-3">Custom Headers</h4>
          {formData.headers.length > 0 && (
            <div className="space-y-2 mb-4">
              {formData.headers.map((header, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-mono">{header.key}</p>
                    <p className="text-xs text-muted-foreground">{header.value}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveHeader(idx)}
                    className="text-destructive hover:text-destructive/80 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Header name"
                value={newHeader.key}
                onChange={e => setNewHeader({ ...newHeader, key: e.target.value })}
              />
              <Input
                placeholder="Value"
                value={newHeader.value}
                onChange={e => setNewHeader({ ...newHeader, value: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddHeader}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Header
            </Button>
          </div>
        </div>

        <Separator />

        {/* Body */}
        {supportsBody && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="body">Request Body (JSON)</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormData({ ...formData, body: formatJSON(formData.body) })}
              className="h-6 px-2 text-xs gap-1"
            >
              <Wand2 className="w-3 h-3" />
              Format
            </Button>
          </div>
          <Textarea
            id="body"
            value={formData.body}
            onChange={e => setFormData({ ...formData, body: e.target.value })}
            placeholder={'{\n  "key": "value"\n}'}
            rows={6}
            className="font-mono text-sm"
          />
        </div>
        )}

        {/* Response */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="response">Response (JSON)</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormData({ ...formData, response: formatJSON(formData.response) })}
              className="h-6 px-2 text-xs gap-1"
            >
              <Wand2 className="w-3 h-3" />
              Format
            </Button>
          </div>
          <Textarea
            id="response"
            value={formData.response}
            onChange={e => setFormData({ ...formData, response: e.target.value })}
            placeholder={'{\n  "success": true,\n  "data": {}\n}'}
            rows={6}
            className="font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Endpoint</Button>
      </div>
    </div>
  )
}
