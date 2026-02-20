import JSZip from 'jszip';
import type { ProjectFiles } from '../types/project';
import { composeStandaloneHtml, parseHtmlProject } from './projectHtml';

const downloadBlob = (name: string, blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const exportSingleHtml = (files: ProjectFiles, runtime: 'javascript' | 'typescript' = 'javascript'): void => {
  downloadBlob('project.html', new Blob([composeStandaloneHtml(files, runtime)], { type: 'text/html' }));
};

export const exportCss = (files: ProjectFiles): void => {
  downloadBlob('styles.css', new Blob([files.css], { type: 'text/css' }));
};

export const exportScript = (files: ProjectFiles, runtime: 'javascript' | 'typescript'): void => {
  const name = runtime === 'typescript' ? 'script.ts' : 'script.js';
  const type = runtime === 'typescript' ? 'text/plain' : 'application/javascript';
  const source = runtime === 'typescript' ? files.typescript : files.javascript;
  downloadBlob(name, new Blob([source], { type }));
};

export const exportZip = async (files: ProjectFiles): Promise<void> => {
  const zip = new JSZip();
  zip.file('index.html', composeStandaloneHtml(files, 'javascript'));
  zip.file('styles.css', files.css);
  zip.file('script.js', files.javascript);
  zip.file('script.ts', files.typescript);
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob('project.zip', blob);
};

export const importHtml = async (file: File, existing: ProjectFiles): Promise<ProjectFiles> => {
  const html = await file.text();
  return parseHtmlProject(html, existing);
};

export const importZip = async (file: File, existing: ProjectFiles): Promise<ProjectFiles> => {
  const zip = await JSZip.loadAsync(file);
  const htmlSource = (await zip.file('index.html')?.async('text')) ?? '';
  const parsed = htmlSource ? parseHtmlProject(htmlSource, existing) : existing;
  return {
    html: parsed.html,
    css: (await zip.file('styles.css')?.async('text')) ?? parsed.css,
    javascript: (await zip.file('script.js')?.async('text')) ?? parsed.javascript,
    typescript: (await zip.file('script.ts')?.async('text')) ?? existing.typescript,
  };
};
