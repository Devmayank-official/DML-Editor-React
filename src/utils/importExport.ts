import JSZip from 'jszip';
import type { ProjectFiles } from '../types/project';

const downloadBlob = (name: string, blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const exportSingleHtml = (files: ProjectFiles): void => {
  const html = `<!doctype html><html><head><style>${files.css}</style></head><body>${files.html}<script>${files.javascript}</script></body></html>`;
  downloadBlob('project.html', new Blob([html], { type: 'text/html' }));
};

export const exportZip = async (files: ProjectFiles): Promise<void> => {
  const zip = new JSZip();
  zip.file('index.html', files.html);
  zip.file('styles.css', files.css);
  zip.file('script.js', files.javascript);
  zip.file('script.ts', files.typescript);
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob('project.zip', blob);
};

export const importHtml = async (file: File, existing: ProjectFiles): Promise<ProjectFiles> => {
  const html = await file.text();
  return { ...existing, html };
};

export const importZip = async (file: File, existing: ProjectFiles): Promise<ProjectFiles> => {
  const zip = await JSZip.loadAsync(file);
  return {
    html: (await zip.file('index.html')?.async('text')) ?? existing.html,
    css: (await zip.file('styles.css')?.async('text')) ?? existing.css,
    javascript: (await zip.file('script.js')?.async('text')) ?? existing.javascript,
    typescript: (await zip.file('script.ts')?.async('text')) ?? existing.typescript,
  };
};
