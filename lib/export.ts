import type { Collection, ApiItem } from './types'

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

export function exportAsTypeScript(collection: Collection): string {
  const lines: string[] = []

  lines.push(`// API Collection: ${collection.title}`)
  lines.push(`// Auto-generated TypeScript interfaces`)
  lines.push('')

  // Generate request and response types for each endpoint
  collection.items.forEach((item, index) => {
    const safeName = item.title.replace(/[^a-zA-Z0-9]/g, '').replace(/^(\d)/, '_$1')
    const requestName = `${safeName}Request`
    const responseName = `${safeName}Response`
    const endpointName = `${safeName}Endpoint`

    lines.push(`// ${item.title}`)
    if (item.description) {
      lines.push(`// ${item.description}`)
    }
    lines.push('')

    // Request interface
    const requestFields: string[] = []
    if (item.params.length > 0) {
      requestFields.push(`  params?: {`)
      item.params.forEach(param => {
        const desc = param.description ? ` // ${param.description}` : ''
        requestFields.push(`    ${param.key}?: string | number${desc}`)
      })
      requestFields.push(`  }`)
    }

    if (item.headers.length > 0) {
      requestFields.push(`  headers?: {`)
      item.headers.forEach(header => {
        requestFields.push(`    "${header.key}"?: string`)
      })
      requestFields.push(`  }`)
    }

    if (item.body && item.body.trim()) {
      requestFields.push(`  body?: ${parseJsonToInterface(item.body)}`)
    }

    if (requestFields.length > 0) {
      lines.push(`export interface ${requestName} {`)
      lines.push(...requestFields)
      lines.push(`}`)
      lines.push('')
    }

    // Response interface
    if (item.response && item.response.trim()) {
      lines.push(`export interface ${responseName} extends ${parseJsonToInterface(item.response)} {}`)
      lines.push('')
    }

    // Endpoint metadata interface
    lines.push(`export interface ${endpointName} {`)
    lines.push(`  method: '${item.method}'`)
    lines.push(`  path: string`)
    if (requestFields.length > 0) {
      lines.push(`  request?: ${requestName}`)
    }
    if (item.response && item.response.trim()) {
      lines.push(`  response?: ${responseName}`)
    }
    lines.push(`}`)
    lines.push('')
  })

  // Generate a collection interface
  const endpointInterfaces = collection.items.map((item) => {
    const safeName = item.title.replace(/[^a-zA-Z0-9]/g, '').replace(/^(\d)/, '_$1')
    return `${safeName}Endpoint`
  })

  lines.push(`export interface ${collection.title.replace(/[^a-zA-Z0-9]/g, '')}Collection {`)
  endpointInterfaces.forEach(iface => {
    lines.push(`  ${iface[0].toLowerCase() + iface.slice(1)}: ${iface}`)
  })
  lines.push(`}`)

  return lines.join('\n')
}

function parseJsonToInterface(json: string): string {
  try {
    JSON.parse(json)
    return 'Record<string, unknown>'
  } catch {
    return 'Record<string, unknown>'
  }
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
