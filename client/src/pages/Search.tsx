import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../api'

function Search() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setLoading(true)
    setSearched(false)
    
    try {
      const searchResults = await apiService.search(query)
      setResults(searchResults)
      setSearched(true)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewResult = (result: any) => {
    if (result.type === 'raw') {
      navigate(`/raw/${result.id}`)
    } else if (result.type === 'wiki') {
      navigate(`/wiki/${result.path}`)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>🔍 搜索</h2>
      
      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索文档和知识库..."
            className="input"
          />
          <button className="btn" onClick={handleSearch} disabled={loading}>
            {loading ? '搜索中...' : '搜索'}
          </button>
        </div>
      </div>
      
      {loading && <div className="loading">搜索中...</div>}
      
      {!loading && results.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            找到 {results.length} 条结果
          </p>
          
          <div className="list">
            {results.map(result => (
              <div key={result.id} className="list-item" onClick={() => viewResult(result)}>
                <h3>{result.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  类型: {result.type === 'raw' ? '原始文档' : '知识库'} | 路径: {result.path}
                </p>
                <p style={{ marginTop: '0.5rem' }}>{result.content.substring(0, 200)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!loading && searched && results.length === 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>没有找到结果。</p>
        </div>
      )}
    </div>
  )
}

export default Search
