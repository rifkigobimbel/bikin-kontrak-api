import type { Collection, ApiItem, ApiParam } from './types'

export function exportAsMarkdown(collection: Collection): string {
  const lines: string[] = []

  lines.push(`# ${collection.title}`)
  // if (collection.basePath) {
  //   lines.push(`**Base Path:** \`${collection.basePath}\``)
  // }
  lines.push('')

  collection.items.forEach((item, index) => {
    lines.push(`## ${index + 1}. ${item.title}`)
    lines.push('')

    if (item.description) {
      lines.push(`**Description:** ${item.description}`)
      lines.push('')
    }

    const fullPath = collection.basePath ? `${collection.basePath}${item.path}` : item.path
    lines.push(`**Method:** \`${item.method}\``)
    lines.push('')
    lines.push(`**Path:** \`${fullPath}\``)
    lines.push('')

    if (item.params.length > 0) {
      lines.push('### Query Parameters')
      lines.push('')
      lines.push('| Key | Type | Description |')
      lines.push('|-----|------|-------------|')
      item.params.forEach(param => {
        const desc = param.description || '-'
        const enumValues = param.enumValues ? ` (${param.enumValues})` : ''
        lines.push(`| ${param.key} | ${param.type}${enumValues} | ${desc} |`)
      })
      lines.push('')
    }

    if (item.headers.length > 0) {
      lines.push('### Headers')
      lines.push('')
      lines.push('| Key | Value |')
      lines.push('|-----|-------|')
      item.headers.forEach(header => {
        lines.push(`| ${header.key} | ${header.value} |`)
      })
      lines.push('')
    }

    if (item.body) {
      lines.push('### Request Body')
      lines.push('')
      lines.push('```json')
      lines.push(item.body)
      lines.push('```')
      lines.push('')
    }

    if (item.response) {
      lines.push('### Response')
      lines.push('')
      lines.push('```json')
      lines.push(item.response)
      lines.push('```')
      lines.push('')
    }

    lines.push('---')
    lines.push('')
  })

  return lines.join('\n')
}

export function exportAsPostman(collection: Collection) {
  const postmanCollection = {
    info: {
      name: collection.title,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: collection.basePath ? [
      {
        key: 'baseUrl',
        value: collection.basePath,
      }
    ] : [],
    item: collection.items.map(item => {
      const fullPath = collection.basePath ? `{{baseUrl}}${item.path}` : item.path
      return {
        name: item.title,
        request: {
          method: item.method,
          header: item.headers.map(h => ({
            key: h.key,
            value: h.value,
          })),
          url: {
            raw: fullPath,
            path: fullPath.split('/').filter(p => p && !p.startsWith('{{')),
            query: item.params.map(p => ({
              key: p.key,
              value: p.type,
              description: p.description || '',
            })),
          },
          body:
            item.body && item.body.trim()
              ? {
                  mode: 'raw',
                  raw: item.body,
                  options: {
                    raw: {
                      language: 'json',
                    },
                  },
                }
              : undefined,
          description: item.description || '',
        },
        response: item.response
          ? [
              {
                name: 'Example Response',
                body: item.response,
                status: 'OK',
                code: 200,
                header: [],
                _postman_previewlanguage: 'json',
              },
            ]
          : [],
      }
    }),
  }

  return postmanCollection
}

function parseJsonToType(json: string): string {
  try {
    const parsed = JSON.parse(json)
    console.log(parsed)
    return resolveRoot(parsed)
  } catch(e) {
    console.log(e)
    return 'unknown'
  }
}

function resolveRoot(value: any): string {
  if (Array.isArray(value)) {
    return resolveArray(value)
  }
  return resolveType(value)
}

function resolveType(value: any): string {
  if (value === null) return 'null'

  if (Array.isArray(value)) {
    return resolveArray(value)
  }

  switch (typeof value) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'object':
      return resolveObject(value)
    default:
      return 'unknown'
  }
}

function resolveArray(arr: any[]): string {
  if (arr.length === 0) return 'unknown[]'

  if (arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item))) {
    return `${mergeObjectArray(arr)}[]`
  }

  const types = Array.from(new Set(arr.map(item => resolveType(item))))
  return types.length === 1
    ? `${types[0]}[]`
    : `(${types.join(' | ')})[]`
}

function mergeObjectArray(arr: Record<string, any>[]): string {
  const keyMap: Record<string, any[]> = {}

  arr.forEach(obj => {
    Object.keys(obj).forEach(key => {
      if (!keyMap[key]) keyMap[key] = []
      keyMap[key].push(obj[key])
    })
  })

  const allKeys = new Set(arr.flatMap(obj => Object.keys(obj)))

  const fields = Array.from(allKeys).map(key => {
    const values = keyMap[key] || []
    const types = Array.from(new Set(values.map(v => resolveType(v))))
    const optional = values.length < arr.length
    const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `"${key}"`
    const finalType = types.length === 1 ? types[0] : `(${types.join(' | ')})`
    return `  ${safeKey}${optional ? '?' : ''}: ${finalType}`
  })

  return `{\n${fields.join('\n')}\n}`
}

function resolveObject(obj: Record<string, any>): string {
  const entries = Object.entries(obj)
  if (entries.length === 0) return '{}'

  const fields = entries.map(([key, value]) => {
    const safeKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? key : `"${key}"`
    return `  ${safeKey}: ${resolveType(value)}`
  })

  return `{\n${fields.join('\n')}\n}`
}

export function exportAsTypeScript(collection: Collection): string {
  const lines: string[] = []

  const toSafeName = (value: string) =>
    value.replace(/[^a-zA-Z0-9]/g, '').replace(/^(\d)/, '_$1')

  const toSafeKey = (value: string) =>
    /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value) ? value : `"${value}"`

  const mapParamType = (param: ApiParam): string => {
    switch (param.type) {
      case 'string':
        return 'string'
      case 'number':
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'enum':
        if (param.enumValues?.trim()) {
          return param.enumValues
            .split(',')
            .map(v => `'${v.trim()}'`)
            .join(' | ')
        }
        return 'string'
      default:
        return 'unknown'
    }
  }

  lines.push(`// =========================================`)
  lines.push(`// API Collection: ${collection.title}`)
  lines.push(`// Auto-generated TypeScript Types`)
  lines.push(`// Generated at: ${new Date().toISOString()}`)
  lines.push(`// =========================================`)
  lines.push('')

  collection.items.forEach((item) => {
    const safeName = toSafeName(item.title)
    const requestName = `${safeName}Request`
    const responseName = `${safeName}Response`
    const endpointName = `${safeName}Endpoint`

    lines.push(`// -----------------------------------------`)
    lines.push(`// ${item.title}`)
    if (item.description) {
      lines.push(`// ${item.description}`)
    }
    lines.push(`// -----------------------------------------`)
    lines.push('')

    const requestFields: string[] = []

    if (item.params.length > 0) {
      requestFields.push(`  params?: {`)
      item.params.forEach(param => {
        const desc = param.description ? ` // ${param.description}` : ''
        requestFields.push(
          `    ${toSafeKey(param.key)}?: ${mapParamType(param)}${desc}`
        )
      })
      requestFields.push(`  }`)
    }

    if (item.headers.length > 0) {
      requestFields.push(`  headers?: {`)
      item.headers.forEach(header => {
        requestFields.push(
          `    ${toSafeKey(header.key)}?: string`
        )
      })
      requestFields.push(`  }`)
    }

    if (item.body?.trim()) {
      requestFields.push(
        `  body?: ${parseJsonToType(item.body)}`
      )
    }

    if (requestFields.length > 0) {
      lines.push(`export type ${requestName} = {`)
      lines.push(...requestFields)
      lines.push(`}`)
      lines.push('')
    }

    if (item.response?.trim()) {
      lines.push(
        `export type ${responseName} = ${parseJsonToType(item.response)}`
      )
      lines.push('')
    }

    lines.push(`export type ${endpointName} = {`)
    lines.push(`  method: '${item.method}'`)
    lines.push(`  path: '${item.path}'`)

    if (requestFields.length > 0) {
      lines.push(`  request: ${requestName}`)
    }

    if (item.response?.trim()) {
      lines.push(`  response: ${responseName}`)
    }

    lines.push(`}`)
    lines.push('')
  })

  const collectionName = toSafeName(collection.title)

  lines.push(`export type ${collectionName}Collection = {`)
  collection.items.forEach((item) => {
    const safeName = toSafeName(item.title)
    const endpointName = `${safeName}Endpoint`
    const propName =
      endpointName.charAt(0).toLowerCase() + endpointName.slice(1)
    lines.push(`  ${propName}: ${endpointName}`)
  })
  lines.push(`}`)

  return lines.join('\n')
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}