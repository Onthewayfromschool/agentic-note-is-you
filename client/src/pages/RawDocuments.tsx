import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../api'

function RawDocuments() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const docs = await apiService.getRawDocuments()
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewDocument = (id: string) => {
    navigate(`/raw/${id}`)
  }

  if (loading) return <div className="loading">加载中...</div>

  if (documents.length === 0) {
    return (
      <div>
        <h2 style={{ marginBottom: '1.5rem' }}>📄 原始文档</h2>
        <div className="card">
          <p style={{ color: 'var(--text-secondary)' }}>
            没有找到文档。请将你的文件放入 <code>knowledge-base/raw/</code> 目录。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>📄 原始文档</h2>
      <div className="list">
        {documents.map(doc => (
          <div key={doc.id} className="list-item" onClick={() => viewDocument(doc.id)}>
            <h3>{doc.filename}</h3>
            <p>更新于: {new Date(doc.updatedAt).toLocaleString('zh-CN')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RawDocuments
