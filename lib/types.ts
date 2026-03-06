export type ParamType = 'string' | 'number' | 'boolean' | 'enum'

export interface ApiHeader {
  key: string
  value: string
}

export interface ApiParam {
  key: string
  type: ParamType
  description?: string
  enumValues?: string
}

export interface ApiItem {
  id: string
  title: string
  description: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
  path: string
  params: ApiParam[]
  body: string
  response: string
  headers: ApiHeader[]
}

export interface Collection {
  id: string
  title: string
  description?: string
  basePath: string
  items: ApiItem[]
  createdAt: string
}
