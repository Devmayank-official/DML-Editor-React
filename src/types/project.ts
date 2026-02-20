export type Language = 'html' | 'css' | 'javascript' | 'typescript';

export interface ProjectFiles {
  html: string;
  css: string;
  javascript: string;
  typescript: string;
}

export interface Project {
  id: string;
  name: string;
  files: ProjectFiles;
  createdAt: number;
  updatedAt: number;
}

export interface ConsoleEntry {
  id: string;
  level: 'log' | 'error';
  message: string;
  stack?: string;
  timestamp: number;
}

export type LayoutMode = 'side-by-side' | 'top-bottom' | 'editor-only' | 'preview-only';

export type StylePreprocessor = 'css' | 'scss' | 'less';
