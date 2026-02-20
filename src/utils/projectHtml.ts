import type { ProjectFiles } from '../types/project';

export const parseHtmlProject = (source: string, existing: ProjectFiles): ProjectFiles => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(source, 'text/html');

  const styleNodes = Array.from(doc.querySelectorAll('style'));
  const scriptNodes = Array.from(doc.querySelectorAll('script'));

  const css = styleNodes.map((node) => node.textContent ?? '').join('\n').trim();

  const scriptBodies = scriptNodes
    .filter((node) => !(node as HTMLScriptElement).src)
    .map((node) => node.textContent ?? '');

  styleNodes.forEach((node) => node.remove());
  scriptNodes.forEach((node) => node.remove());

  const html = (doc.body?.innerHTML ?? source).trim();
  const javascript = scriptBodies.join('\n').trim();

  return {
    html: html || existing.html,
    css: css || existing.css,
    javascript: javascript || existing.javascript,
    typescript: existing.typescript,
  };
};

export const composeStandaloneHtml = (files: ProjectFiles, runtime: 'javascript' | 'typescript'): string => {
  const script = runtime === 'typescript' ? files.typescript : files.javascript;
  return `<!doctype html><html><head><meta charset="utf-8" /><style>${files.css}</style></head><body>${files.html}<script>${script}</script></body></html>`;
};
