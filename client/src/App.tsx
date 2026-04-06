import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import RawDocuments from './pages/RawDocuments'
import RawDocumentView from './pages/RawDocumentView'
import Wiki from './pages/Wiki'
import WikiPageView from './pages/WikiPageView'
import Search from './pages/Search'

function App() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="app">
      <header className="header">
        <h1>📚 LLM Knowledge Base</h1>
        <nav className="nav">
          <Link to="/" className={isActive('/') ? 'active' : ''}>首页</Link>
          <Link to="/raw" className={isActive('/raw') ? 'active' : ''}>原始文档</Link>
          <Link to="/wiki" className={isActive('/wiki') ? 'active' : ''}>知识库</Link>
          <Link to="/search" className={isActive('/search') ? 'active' : ''}>搜索</Link>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/raw" element={<RawDocuments />} />
          <Route path="/raw/:id" element={<RawDocumentView />} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/wiki/*" element={<WikiPageView />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
