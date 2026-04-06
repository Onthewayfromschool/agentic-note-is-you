import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000
})

export interface Document {
  id: string
  filename: string
  path: string
  content?: string
  createdAt: string
  updatedAt: string
}

export interface WikiPage {
  id: string
  title: string
  path: string
  content: string
  summary: string
  tags: string[]
  backlinks: string[]
  relatedConcepts: string[]
  sourceDocuments: string[]
  updatedAt: string
}

export interface WikiIndex {
  pages: Array<{
    id: string
    title: string
    path: string
    summary: string
    tags: string[]
  }>
  concepts: any[]
  lastUpdated: string
}

export interface SearchResult {
  id: string
  title: string
  path: string
  content: string
  type: string
}

export interface QAResponse {
  answer: string
  sources: string[]
  confidence: number
}

export interface LintIssue {
  type: string
  severity: string
  page: string
  message: string
  suggestion?: string
}

export interface LintReport {
  issues: LintIssue[]
  suggestions: string[]
  timestamp: string
}

export const apiService = {
  getStatus: async () => {
    const response = await api.get('/status')
    return response.data
  },

  getRawDocuments: async (): Promise<Document[]> => {
    const response = await api.get('/raw')
    return response.data
  },

  getRawDocument: async (id: string): Promise<Document> => {
    const response = await api.get(`/raw/${id}`)
    return response.data
  },

  getWikiIndex: async (): Promise<WikiIndex> => {
    const response = await api.get('/wiki')
    return response.data
  },

  getWikiPages: async (): Promise<WikiPage[]> => {
    const response = await api.get('/wiki/pages')
    return response.data
  },

  getWikiPage: async (pagePath: string): Promise<WikiPage> => {
    const response = await api.get(`/wiki/pages/${encodeURIComponent(pagePath)}`)
    return response.data
  },

  search: async (query: string): Promise<SearchResult[]> => {
    const response = await api.get('/search', { params: { q: query } })
    return response.data
  }
}
