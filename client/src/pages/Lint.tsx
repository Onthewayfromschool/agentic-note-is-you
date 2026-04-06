import { useState } from 'react'
import { apiService } from '../api'

function Lint() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleLint = async () => {
    setLoading(true)
    setReport(null)
    
    try {
      const lintReport = await apiService.lintWiki()
      setReport(lintReport)
    } catch (error) {
      console.error('Lint failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>🔍 健康检查</h2>
      
      <div className="card">
        <p style={{ marginBottom: '1rem' }}>
          运行健康检查以发现问题并获取改进建议。
        </p>
        <button className="btn" onClick={handleLint} disabled={loading}>
          {loading ? '分析中...' : '🔍 开始检查'}
        </button>
      </div>
      
      {loading && <div className="loading">正在分析知识库...</div>}
      
      {!loading && report && (
        <div style={{ marginTop: '1.5rem' }}>
          {report.issues.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>发现问题: {report.issues.length} 个</h3>
              
              {report.issues.map((issue: any, index: number) => (
                <div key={index} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong>{issue.page}</strong>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '0.25rem',
                      background: issue.severity === 'error' ? '#fee2e2' : '#fef3c7',
                      color: issue.severity === 'error' ? 'var(--error)' : 'var(--warning)',
                      fontSize: '0.75rem'
                    }}>
                      {issue.severity === 'error' ? '错误' : '警告'}
                    </span>
                  </div>
                  <p style={{ margin: '0.5rem 0' }}>{issue.message}</p>
                  {issue.suggestion && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      💡 {issue.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {report.suggestions.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>建议</h3>
              <ul style={{ marginLeft: '1.5rem', lineHeight: 2 }}>
                {report.suggestions.map((suggestion: string, index: number) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {report.issues.length === 0 && report.suggestions.length === 0 && (
            <div className="card success">
              <p>✅ 没有问题！你的知识库看起来很健康。</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Lint
