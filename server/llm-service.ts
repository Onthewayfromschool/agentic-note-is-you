import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class LLMService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo';
  }

  async chat(messages: Array<{role: 'system' | 'user' | 'assistant', content: string}>, options?: {maxTokens?: number, temperature?: number}): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: options?.maxTokens || 4000,
      temperature: options?.temperature ?? 0.7,
    });

    return response.choices[0]?.message?.content || '';
  }

  async summarizeDocument(content: string, filename: string): Promise<{summary: string, tags: string[], concepts: string[]}> {
    const prompt = `你是一个知识管理助手。请分析以下文档内容，并提供：
1. 一个简洁的摘要（200字以内）
2. 3-5个标签
3. 提取的关键概念（3-8个）

文档标题: ${filename}
文档内容:
${content.substring(0, 8000)}

请以JSON格式返回，格式如下：
{
  "summary": "文档摘要",
  "tags": ["tag1", "tag2"],
  "concepts": ["concept1", "concept2"]
}`;

    const response = await this.chat([
      { role: 'system', content: '你是一个专业的知识管理助手，擅长分析、总结和提取关键信息。' },
      { role: 'user', content: prompt }
    ]);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse LLM response:', e);
    }

    return {
      summary: response.substring(0, 500),
      tags: [],
      concepts: []
    };
  }

  async generateWikiPage(documents: Array<{filename: string, content: string, summary: string}>): Promise<{title: string, content: string, tags: string[], relatedConcepts: string[]}> {
    const docsText = documents.map(doc => 
      `## ${doc.filename}\n摘要: ${doc.summary}\n内容:\n${doc.content.substring(0, 3000)}`
    ).join('\n\n');

    const prompt = `基于以下相关文档，生成一个综合的 Wiki 页面。要求：
1. 一个清晰的标题
2. 结构化的内容（使用Markdown格式）
3. 包含引用和反向链接
4. 5-8个标签
5. 识别相关概念

相关文档：
${docsText}

请以JSON格式返回：
{
  "title": "页面标题",
  "content": "Markdown格式的完整内容",
  "tags": ["tag1", "tag2"],
  "relatedConcepts": ["concept1", "concept2"]
}`;

    const response = await this.chat([
      { role: 'system', content: '你是一个专业的知识整理助手，擅长将多个相关文档整合成结构化的Wiki页面。' },
      { role: 'user', content: prompt }
    ], { maxTokens: 4000 });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse LLM response:', e);
    }

    return {
      title: 'Untitled',
      content: response,
      tags: [],
      relatedConcepts: []
    };
  }

  async answerQuestion(question: string, wikiContext: string): Promise<{answer: string, sources: string[], confidence: number}> {
    const prompt = `基于以下知识库内容，回答问题。如果知识库中没有相关信息，请明确说明。

问题: ${question}

知识库内容:
${wikiContext.substring(0, 10000)}

请提供：
1. 详细的回答
2. 引用来源（提到的文档或页面标题）
3. 置信度评分（0-1之间）

以JSON格式返回：
{
  "answer": "详细回答",
  "sources": ["来源1", "来源2"],
  "confidence": 0.85
}`;

    const response = await this.chat([
      { role: 'system', content: '你是一个知识问答助手，基于给定的知识库内容准确回答问题。' },
      { role: 'user', content: prompt }
    ], { maxTokens: 3000 });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse LLM response:', e);
    }

    return {
      answer: response,
      sources: [],
      confidence: 0
    };
  }

  async lintWiki(wikiPages: Array<{title: string, content: string, path: string}>): Promise<{issues: Array<{type: string, severity: string, page: string, message: string, suggestion?: string}>, suggestions: string[]}> {
    const pagesSummary = wikiPages.map(p => 
      `## ${p.title} (${p.path})\n${p.content.substring(0, 500)}...`
    ).join('\n\n');

    const prompt = `对以下Wiki页面进行健康检查，找出：
1. 缺失摘要或总结的页面
2. 可能的断裂链接
3. 重复或冗余内容
4. 数据不一致的地方
5. 缺失的关键信息
6. 建议新增的页面或概念

Wiki页面：
${pagesSummary.substring(0, 12000)}

以JSON格式返回：
{
  "issues": [
    {
      "type": "missing_summary|broken_link|duplicate|inconsistent|missing_data",
      "severity": "warning|error",
      "page": "页面路径",
      "message": "问题描述",
      "suggestion": "修复建议"
    }
  ],
  "suggestions": ["建议1", "建议2"]
}`;

    const response = await this.chat([
      { role: 'system', content: '你是一个质量控制助手，负责检查知识库的完整性和一致性。' },
      { role: 'user', content: prompt }
    ], { maxTokens: 3000 });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse LLM response:', e);
    }

    return { issues: [], suggestions: [] };
  }

  async suggestConnections(wikiPages: Array<{title: string, summary: string, tags: string[]}>): Promise<Array<{page1: string, page2: string, reason: string}>> {
    const pagesText = wikiPages.map(p => 
      `- ${p.title}: ${p.summary} [Tags: ${p.tags.join(', ')}]`
    ).join('\n');

    const prompt = `分析以下Wiki页面，找出可能有关联但尚未建立连接的页面对。

页面列表：
${pagesText}

返回有关联的页面对及原因，JSON格式：
[
  {
    "page1": "页面1标题",
    "page2": "页面2标题",
    "reason": "关联原因"
  }
]`;

    const response = await this.chat([
      { role: 'system', content: '你是一个知识图谱分析助手，擅长发现知识点之间的潜在关联。' },
      { role: 'user', content: prompt }
    ]);

    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse LLM response:', e);
    }

    return [];
  }
}

export const llmService = new LLMService();
