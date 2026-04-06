import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../api'

function Wiki() {
  const navigate = useNavigate()
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      const wikiPages = await apiService.getWikiPages()
      setPages(wikiPages)
    } catch (error) {
      console.error('Failed to load wiki pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewPage = (page: any) => {
    navigate(`/wiki/${page.path}`)
  }

  if (loading) return <div className="loading">加载中...</div>

  if (pages.length === 0) {
    return (
      <div>
        <h2 style={{ marginBottom: '1.5rem' }}>📚 知识库</h2>
        <div className="card">
          <p style={{ color: 'var(--text-secondary)' }}>
            还没有知识库页面。请先在首页导入一些文档。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>📚 知识库</h2>
      <div className="grid">
        {pages.map(page => (
          <div key={page.id} className="card" style={{ cursor: 'pointer' }} onClick={() => viewPage(page)}>
            <h3>{page.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.5rem 0' }}>
              {page.summary.substring(0, 150)}...
            </p>
            <div>
              {page.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Wiki
