import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { marked } from 'marked'
import { apiService } from '../api'

function WikiPageView() {
  const navigate = useNavigate()
  const { '*': pagePath } = useParams()
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const renderedContent = useMemo(() => {
    if (!page?.content) return ''
    return marked(page.content)
  }, [page?.content])

  useEffect(() => {
    loadPage()
  }, [pagePath])

  const loadPage = async () => {
    if (!pagePath) return
    try {
      const wikiPage = await apiService.getWikiPage(pagePath)
      setPage(wikiPage)
    } catch (error) {
      console.error('Failed to load wiki page:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  if (!page) return null

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate('/wiki')} style={{ marginBottom: '1rem' }}>
        ← 返回知识库
      </button>
      
      <div className="card">
        <h2 style={{ marginBottom: '0.5rem' }}>{page.title}</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          {page.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        
        {page.relatedConcepts.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>相关概念: </strong>
            {page.relatedConcepts.map((concept: string) => (
              <span key={concept} style={{ marginLeft: '0.5rem' }}>
                {concept}
              </span>
            ))}
          </div>
        )}
        
        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderedContent }} />
      </div>
    </div>
  )
}

export default WikiPageView
