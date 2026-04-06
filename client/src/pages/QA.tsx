import { useState, useMemo } from 'react'
import { marked } from 'marked'
import { apiService } from '../api'

function QA() {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const renderedAnswer = useMemo(() => {
    if (!response?.answer) return ''
    return marked(response.answer)
  }, [response?.answer])

  const handleAsk = async () => {
    if (!question.trim()) return
    
    setLoading(true)
    setResponse(null)
    
    try {
      const answer = await apiService.askQuestion(question)
      setResponse(answer)
    } catch (error) {
      console.error('Q&A failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>💡 智能问答</h2>
      
      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="向你的知识库提问..."
            className="input"
          />
          <button className="btn" onClick={handleAsk} disabled={loading}>
            {loading ? '思考中...' : '提问'}
          </button>
        </div>
      </div>
      
      {loading && (
        <div className="loading">
          <p>正在分析知识库...</p>
        </div>
      )}
      
      {!loading && response && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>回答</h3>
          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderedAnswer }} />
          
          {response.sources.length > 0 && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>来源:</h4>
              <ul style={{ marginLeft: '1.5rem' }}>
                {response.sources.map((source: string, index: number) => (
                  <li key={index}>{source}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            置信度: {Math.round(response.confidence * 100)}%
          </div>
        </div>
      )}
    </div>
  )
}

export default QA
