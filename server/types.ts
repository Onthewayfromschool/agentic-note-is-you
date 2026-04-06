// 知识库类型定义

export interface Document {
  id: string;
  path: string;
  filename: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface WikiPage {
  id: string;
  title: string;
  path: string;
  content: string;
  summary: string;
  tags: string[];
  backlinks: string[];
  relatedConcepts: string[];
  sourceDocuments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  relatedPages: string[];
  relatedConcepts: string[];
}

export interface WikiIndex {
  pages: Array<{
    id: string;
    title: string;
    path: string;
    summary: string;
    tags: string[];
  }>;
  concepts: Concept[];
  lastUpdated: Date;
}

export interface SearchResult {
  id: string;
  title: string;
  path: string;
  content: string;
  score: number;
  type: 'raw' | 'wiki' | 'concept';
  highlights?: string[];
}

export interface QARequest {
  question: string;
  context?: string[];
}

export interface QAResponse {
  answer: string;
  sources: string[];
  confidence: number;
}

export interface LintReport {
  issues: LintIssue[];
  suggestions: string[];
  timestamp: Date;
}

export interface LintIssue {
  type: 'missing_summary' | 'broken_link' | 'duplicate' | 'inconsistent' | 'missing_data';
  severity: 'warning' | 'error';
  page: string;
  message: string;
  suggestion?: string;
}

export interface IngestResult {
  processed: number;
  skipped: number;
  errors: string[];
  wikiUpdates: string[];
}
