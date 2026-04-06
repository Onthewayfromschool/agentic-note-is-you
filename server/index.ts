import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { KnowledgeBase } from './knowledge-base.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../client/dist')));

// 初始化知识库
const kbDir = process.env.KB_DIR || path.join(process.cwd(), 'knowledge-base');
const kb = new KnowledgeBase(kbDir);

await kb.initialize();
console.log(`知识库已初始化: ${kbDir}`);

// API 路由

// 获取知识库状态
app.get('/api/status', async (req, res) => {
  try {
    const index = await kb.loadWikiIndex();
    res.json({
      status: 'ok',
      kbDir,
      wikiPages: index.pages.length,
      lastUpdated: index.lastUpdated
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// 获取原始文档列表
app.get('/api/raw', async (req, res) => {
  try {
    const docs = await kb.scanRawDocuments();
    res.json(docs.map(doc => ({
      id: doc.id,
      filename: doc.filename,
      path: doc.path,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    })));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// 获取单个原始文档
app.get('/api/raw/:id', async (req, res) => {
  try {
    const docs = await kb.scanRawDocuments();
    const doc = docs.find(d => d.id === req.params.id);
    
    if (!doc) {
      return res.status(404).json({ error: '文档未找到' });
    }
    
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// 获取 Wiki 索引
app.get('/api/wiki', async (req, res) => {
  try {
    const index = await kb.loadWikiIndex();
    res.json(index);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// 获取 Wiki 页面列表
app.get('/api/wiki/pages', async (req, res) => {
  try {
    const pages = await kb.getWikiPages();
    res.json(pages.map(page => ({
      id: page.id,
      title: page.title,
      path: page.path,
      summary: page.summary,
      tags: page.tags,
      updatedAt: page.updatedAt
    })));
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// 获取单个 Wiki 页面
app.get('/api/wiki/pages/:pagePath', async (req, res) => {
  try {
    const pagePath = decodeURIComponent(req.params.pagePath);
    const page = await kb.getWikiPage(pagePath);
    
    if (!page) {
      return res.status(404).json({ error: '页面未找到' });
    }
    
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// 搜索
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '需要提供搜索参数 "q"' });
    }
    
    const results = await kb.search(q);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`知识库目录: ${kbDir}`);
});
