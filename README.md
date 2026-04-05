# LLM Knowledge Base

基于 Karpathy 理念的 LLM 驱动个人知识库管理系统。

## 核心理念

- **Data Ingest**: 将原始文档放入 `raw/` 目录，LLM 自动处理并编译成 Wiki
- **Wiki Compilation**: LLM 自动生成摘要、标签、反向链接和概念关联
- **Q&A**: 基于 Wiki 知识库进行智能问答
- **Linting**: 健康检查，发现不一致、缺失数据等问题
- **Incremental Enhancement**: 所有探索都会增强知识库

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd client && npm install && cd ..
```

### 2. 配置

复制 `.env.example` 为 `.env` 并配置你的 OpenAI API Key：

```bash
cp .env.example .env
```

编辑 `.env`：
```
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4-turbo
```

### 3. 启动

```bash
# 开发模式（同时启动前后端）
npm run dev

# 或分别启动
npm run dev:server  # 后端: http://localhost:3000
npm run dev:client  # 前端: http://localhost:5173
```

## 使用方法

### 添加文档

将你的原始文档（Markdown、TXT、JSON）放入 `knowledge-base/raw/` 目录。

### 处理文档

1. 打开 Dashboard (http://localhost:5173)
2. 点击 "Ingest Documents" - LLM 会分析每个文档并生成 Wiki 页面
3. 点击 "Compile Wiki" - LLM 会整合相关文档生成综合页面

### 探索知识

- **Raw Documents**: 查看原始文档
- **Wiki**: 浏览 LLM 生成的知识页面
- **Search**: 搜索知识库
- **Q&A**: 向知识库提问
- **Lint**: 运行健康检查

## 项目结构

```
personNoteMemory/
├── server/                 # 后端代码
│   ├── index.ts           # Express 服务器
│   ├── llm-service.ts     # LLM API 封装
│   ├── knowledge-base.ts  # 知识库管理
│   └── types.ts           # 类型定义
├── client/                # 前端代码
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   ├── api.ts        # API 客户端
│   │   └── router.ts     # 路由配置
│   └── ...
├── knowledge-base/        # 知识库数据
│   ├── raw/              # 原始文档目录
│   └── wiki/             # 生成的 Wiki 目录
└── ...
```

## API 端点

- `GET /api/status` - 知识库状态
- `POST /api/ingest` - 摄入文档
- `POST /api/compile` - 编译 Wiki
- `GET /api/raw` - 原始文档列表
- `GET /api/wiki/pages` - Wiki 页面列表
- `GET /api/search?q=xxx` - 搜索
- `POST /api/qa` - 问答
- `POST /api/lint` - 健康检查

## 技术栈

- **后端**: Node.js + Express + TypeScript
- **前端**: Vue 3 + Vite + TypeScript
- **LLM**: OpenAI API (GPT-4)
- **存储**: 本地文件系统 (Markdown)

## 扩展建议

1. 支持更多 LLM 后端（Ollama、Claude 等）
2. 向量数据库集成（语义搜索）
3. 文件监听自动摄入
4. Obsidian 插件集成
5. 可视化知识图谱
6. 导出功能（Marp 幻灯片等）

## License

MIT
# agentic-note-is-you
