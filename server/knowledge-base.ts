import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { Document, WikiPage, WikiIndex, IngestResult } from './types.js';
import { llmService } from './llm-service.js';

export class KnowledgeBase {
  private kbDir: string;
  private rawDir: string;
  private wikiDir: string;

  constructor(kbDir: string) {
    this.kbDir = kbDir;
    this.rawDir = path.join(kbDir, 'raw');
    this.wikiDir = path.join(kbDir, 'wiki');
  }

  async initialize() {
    await fs.ensureDir(this.rawDir);
    await fs.ensureDir(this.wikiDir);
    await fs.ensureDir(path.join(this.wikiDir, 'concepts'));
    await fs.ensureDir(path.join(this.wikiDir, 'articles'));
  }

  // 扫描 raw 目录
  async scanRawDocuments(): Promise<Document[]> {
    const files = await glob('**/*.{md,txt,json}', {
      cwd: this.rawDir,
      absolute: true
    });

    const documents: Document[] = [];
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const stat = await fs.stat(file);
      
      documents.push({
        id: this.generateId(file),
        path: file,
        filename: path.basename(file),
        content,
        createdAt: stat.birthtime,
        updatedAt: stat.mtime
      });
    }

    return documents;
  }

  // 数据摄入：处理 raw 文档并更新 wiki
  async ingestDocuments(): Promise<IngestResult> {
    const docs = await this.scanRawDocuments();
    const index = await this.loadWikiIndex();
    
    const result: IngestResult = {
      processed: 0,
      skipped: 0,
      errors: [],
      wikiUpdates: []
    };

    for (const doc of docs) {
      try {
        // 检查是否已处理
        const existingPage = index.pages.find(p => 
          p.path.includes(doc.filename)
        );

        if (existingPage) {
          result.skipped++;
          continue;
        }

        // 使用 LLM 分析文档
        console.log(`Processing: ${doc.filename}`);
        const analysis = await llmService.summarizeDocument(doc.content, doc.filename);

        // 创建 Wiki 页面
        const wikiPage: WikiPage = {
          id: this.generateId(doc.filename),
          title: doc.filename.replace(/\.(md|txt|json)$/, ''),
          path: path.join('articles', `${doc.filename.replace(/\.(md|txt|json)$/, '')}.md`),
          content: this.generateWikiContent(doc, analysis),
          summary: analysis.summary,
          tags: analysis.tags,
          backlinks: [],
          relatedConcepts: analysis.concepts,
          sourceDocuments: [doc.path],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // 保存 Wiki 页面
        const wikiPath = path.join(this.wikiDir, wikiPage.path);
        await fs.ensureDir(path.dirname(wikiPath));
        await fs.writeFile(wikiPath, this.formatWikiPage(wikiPage));

        // 更新索引
        index.pages.push({
          id: wikiPage.id,
          title: wikiPage.title,
          path: wikiPage.path,
          summary: wikiPage.summary,
          tags: wikiPage.tags
        });

        result.processed++;
        result.wikiUpdates.push(wikiPage.title);
      } catch (error) {
        result.errors.push(`Failed to process ${doc.filename}: ${error}`);
      }
    }

    // 保存索引
    await this.saveWikiIndex(index);

    return result;
  }

  // 编译 Wiki：整合相关文档生成综合页面
  async compileWiki(): Promise<string[]> {
    const docs = await this.scanRawDocuments();
    const updates: string[] = [];

    // 为每个概念分组文档
    const conceptGroups = new Map<string, typeof docs>();
    
    for (const doc of docs) {
      const analysis = await llmService.summarizeDocument(doc.content, doc.filename);
      
      for (const concept of analysis.concepts) {
        if (!conceptGroups.has(concept)) {
          conceptGroups.set(concept, []);
        }
        conceptGroups.get(concept)!.push(doc);
      }
    }

    // 为每个概念生成综合 Wiki 页面
    for (const [concept, conceptDocs] of conceptGroups) {
      if (conceptDocs.length < 2) continue; // 至少需要2个文档

      console.log(`Compiling wiki for concept: ${concept}`);
      
      // 先获取所有文档的摘要
      const docSummaries = [];
      for (const doc of conceptDocs) {
        const summary = await llmService.summarizeDocument(doc.content, doc.filename);
        docSummaries.push({
          filename: doc.filename,
          content: doc.content,
          summary: summary.summary
        });
      }

      const wikiPage = await llmService.generateWikiPage(docSummaries);
      
      const wikiPath = path.join(this.wikiDir, 'articles', `${concept.replace(/\s+/g, '_')}.md`);
      await fs.writeFile(wikiPath, this.formatCompiledWikiPage(wikiPage, conceptDocs));
      
      updates.push(concept);
    }

    return updates;
  }

  // 加载 Wiki 索引
  async loadWikiIndex(): Promise<WikiIndex> {
    const indexPath = path.join(this.wikiDir, 'INDEX.json');
    
    if (await fs.pathExists(indexPath)) {
      const data = await fs.readJson(indexPath);
      return {
        ...data,
        lastUpdated: new Date(data.lastUpdated)
      };
    }

    return {
      pages: [],
      concepts: [],
      lastUpdated: new Date()
    };
  }

  // 保存 Wiki 索引
  async saveWikiIndex(index: WikiIndex): Promise<void> {
    const indexPath = path.join(this.wikiDir, 'INDEX.json');
    index.lastUpdated = new Date();
    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  // 获取所有 Wiki 页面
  async getWikiPages(): Promise<WikiPage[]> {
    const files = await glob('**/*.md', {
      cwd: this.wikiDir,
      absolute: true
    });

    const pages: WikiPage[] = [];
    for (const file of files) {
      if (file.includes('INDEX.json')) continue;
      
      const content = await fs.readFile(file, 'utf-8');
      const metadata = this.parseWikiMetadata(content);
      
      pages.push({
        id: this.generateId(file),
        title: metadata.title || path.basename(file, '.md'),
        path: path.relative(this.wikiDir, file),
        content,
        summary: metadata.summary || '',
        tags: metadata.tags || [],
        backlinks: metadata.backlinks || [],
        relatedConcepts: metadata.relatedConcepts || [],
        sourceDocuments: metadata.sourceDocuments || [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return pages;
  }

  // 获取单个 Wiki 页面
  async getWikiPage(pagePath: string): Promise<WikiPage | null> {
    const fullPath = path.join(this.wikiDir, pagePath);
    
    if (!(await fs.pathExists(fullPath))) {
      return null;
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    const metadata = this.parseWikiMetadata(content);

    return {
      id: this.generateId(fullPath),
      title: metadata.title || path.basename(fullPath, '.md'),
      path: pagePath,
      content,
      summary: metadata.summary || '',
      tags: metadata.tags || [],
      backlinks: metadata.backlinks || [],
      relatedConcepts: metadata.relatedConcepts || [],
      sourceDocuments: metadata.sourceDocuments || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // 搜索知识库
  async search(query: string): Promise<Array<{id: string, title: string, path: string, content: string, type: string}>> {
    const results: Array<{id: string, title: string, path: string, content: string, type: string}> = [];
    const queryLower = query.toLowerCase();

    // 搜索 raw 文档
    const rawDocs = await this.scanRawDocuments();
    for (const doc of rawDocs) {
      if (doc.content.toLowerCase().includes(queryLower) || 
          doc.filename.toLowerCase().includes(queryLower)) {
        results.push({
          id: doc.id,
          title: doc.filename,
          path: doc.path,
          content: doc.content.substring(0, 500),
          type: 'raw'
        });
      }
    }

    // 搜索 wiki 页面
    const wikiPages = await this.getWikiPages();
    for (const page of wikiPages) {
      if (page.content.toLowerCase().includes(queryLower) || 
          page.title.toLowerCase().includes(queryLower) ||
          page.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
        results.push({
          id: page.id,
          title: page.title,
          path: page.path,
          content: page.content.substring(0, 500),
          type: 'wiki'
        });
      }
    }

    return results;
  }

  // 辅助方法
  private generateId(input: string): string {
    return Buffer.from(input).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private generateWikiContent(doc: Document, analysis: {summary: string, tags: string[], concepts: string[]}): string {
    return `---
title: ${doc.filename}
summary: ${analysis.summary}
tags: [${analysis.tags.join(', ')}]
concepts: [${analysis.concepts.join(', ')}]
source: ${doc.path}
---

# ${doc.filename}

## 摘要

${analysis.summary}

## 内容

${doc.content}

## 元数据

- 创建时间: ${doc.createdAt.toISOString()}
- 更新时间: ${doc.updatedAt.toISOString()}
- 来源: ${doc.path}
`;
  }

  private formatWikiPage(page: WikiPage): string {
    return `---
title: ${page.title}
summary: ${page.summary}
tags: [${page.tags.join(', ')}]
concepts: [${page.relatedConcepts.join(', ')}]
sources: [${page.sourceDocuments.join(', ')}]
---

# ${page.title}

## 摘要

${page.summary}

## 内容

${page.content}

## 相关概念

${page.relatedConcepts.map(c => `- [[${c}]]`).join('\n')}

## 来源文档

${page.sourceDocuments.map(s => `- ${path.basename(s)}`).join('\n')}
`;
  }

  private formatCompiledWikiPage(wikiPage: {title: string, content: string, tags: string[], relatedConcepts: string[]}, sources: Document[]): string {
    return `---
title: ${wikiPage.title}
tags: [${wikiPage.tags.join(', ')}]
concepts: [${wikiPage.relatedConcepts.join(', ')}]
compiled: true
---

# ${wikiPage.title}

${wikiPage.content}

## 来源文档

${sources.map(s => `- [[${s.filename}]]`).join('\n')}
`;
  }

  private parseWikiMetadata(content: string): Record<string, any> {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};

    const metadata: Record<string, any> = {};
    const lines = match[1].split('\n');

    for (const line of lines) {
      const [key, ...values] = line.split(':');
      if (key && values.length > 0) {
        const value = values.join(':').trim();
        
        if (value.startsWith('[') && value.endsWith(']')) {
          metadata[key.trim()] = value.slice(1, -1).split(',').map(s => s.trim());
        } else {
          metadata[key.trim()] = value;
        }
      }
    }

    return metadata;
  }
}
