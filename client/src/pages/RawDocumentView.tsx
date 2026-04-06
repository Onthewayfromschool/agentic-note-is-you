import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { marked } from 'marked'
import { apiService } from '../api'

function RawDocumentView() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const renderedContent = useMemo(() => {
    if (!document?.content) return ''
    return marked(document.content)
  }, [document?.content])

  useEffect(() => {
    loadDocument()
  }, [id])

  const loadDocument = async () => {
    if (!id) return
    try {
      const doc = await apiService.getRawDocument(id)
      setDocument(doc)
    } catch (error) {
      console.error('Failed to load document:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  if (!document) return null

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/raw')} style={{ marginBottom: '1rem' }}>
        ← 返回文档列表
      </button>
      
      <div className="card">
        <h2 style={{ marginBottom: '1rem' }}>{document.filename}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          更新于: {new Date(document.updatedAt).toLocaleString('zh-CN')}
        </p>
        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderedContent }} />
      </div>
    </div>
  )
}

export default RawDocumentView
