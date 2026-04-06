import { useState, useEffect } from 'react'
import { apiService } from '../api'

function Dashboard() {
  const [status, setStatus] = useState<any>({})

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const statusData = await apiService.getStatus()
      setStatus(statusData)
    } catch (error) {
      console.error('Failed to load status:', error)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>📊 知识库概览</h2>
      
      <div className="stats">
        <div className="stat-card">
          <h3>知识库页面</h3>
          <div className="value">{status.wikiPages || 0}</div>
        </div>
        <div className="stat-card">
          <h3>最后更新</h3>
          <div className="value" style={{ fontSize: '1rem' }}>
            {status.lastUpdated ? new Date(status.lastUpdated).toLocaleString('zh-CN') : '从未'}
          </div>
        </div>
        <div className="stat-card">
          <h3>知识库路径</h3>
          <div className="value" style={{ fontSize: '1rem' }}>{status.kbDir || '未初始化'}</div>
        </div>
      </div>

      <div className="card">
        <h2>📖 使用说明</h2>
        <ol style={{ marginLeft: '1.5rem', lineHeight: 2 }}>
          <li>将你的原始文档放入 <code>knowledge-base/raw/</code> 目录</li>
          <li>使用外部 AI Agent 处理文档并生成知识库</li>
          <li>在这里浏览、搜索你的知识库</li>
          <li>知识库会自动读取本地文件并展示</li>
        </ol>
      </div>

      <div className="card">
        <h2>💡 工作流程</h2>
        <div style={{ lineHeight: 2 }}>
          <p><strong>1. 添加文档</strong> - 将 Markdown/TXT 文件放入 <code>raw/</code> 目录</p>
          <p><strong>2. AI 处理</strong> - 外部 Agent 读取并分析文档</p>
          <p><strong>3. 生成知识库</strong> - Agent 在 <code>wiki/</code> 目录生成结构化知识</p>
          <p><strong>4. 浏览探索</strong> - 使用本系统查看和搜索知识</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
