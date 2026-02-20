import type { ProjectFiles } from '../types/project';
import { composeStandaloneHtml } from './projectHtml';

type RuntimeMode = 'javascript' | 'typescript';

type GitProvider = 'github' | 'gitlab' | 'bitbucket';

const openPostForm = (action: string, fields: Record<string, string>) => {
  const form = document.createElement('form');
  form.action = action;
  form.method = 'POST';
  form.target = '_blank';

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

export const exportToCodePen = (name: string, files: ProjectFiles, runtime: RuntimeMode, useTailwind: boolean) => {
  const payload = {
    title: name,
    html: files.html,
    css: files.css,
    js: runtime === 'typescript' ? files.typescript : files.javascript,
    js_pre_processor: runtime === 'typescript' ? 'typescript' : 'none',
    editors: '101',
    css_external: useTailwind ? 'https://cdn.tailwindcss.com' : '',
  };

  openPostForm('https://codepen.io/pen/define', { data: JSON.stringify(payload) });
};

export const exportToJSFiddle = (name: string, files: ProjectFiles, runtime: RuntimeMode, useTailwind: boolean) => {
  openPostForm('https://jsfiddle.net/api/post/library/pure/', {
    title: name,
    description: `Exported from DML Editor: ${name}`,
    html: files.html,
    css: files.css,
    js: runtime === 'typescript' ? files.typescript : files.javascript,
    js_wrap: 'onLoad',
    resources: useTailwind ? 'https://cdn.tailwindcss.com' : '',
  });
};

const providerUrl: Record<GitProvider, string> = {
  github: 'https://github.com/new',
  gitlab: 'https://gitlab.com/projects/new',
  bitbucket: 'https://bitbucket.org/repo/create',
};

export const prepareGitProviderExport = async (
  provider: GitProvider,
  projectName: string,
  files: ProjectFiles,
  runtime: RuntimeMode,
): Promise<void> => {
  const readme = `# ${projectName}\n\nExported from DML Editor.\n\n## Files\n- index.html\n- styles.css\n- ${runtime === 'typescript' ? 'script.ts' : 'script.js'}\n`;
  const scaffold = `\n\n--- index.html ---\n${composeStandaloneHtml(files, runtime)}\n\n--- styles.css ---\n${files.css}\n\n--- script.${runtime === 'typescript' ? 'ts' : 'js'} ---\n${runtime === 'typescript' ? files.typescript : files.javascript}`;

  try {
    await navigator.clipboard.writeText(`${readme}${scaffold}`);
  } catch {
    // Clipboard can fail in non-secure contexts; still proceed with provider redirect.
  }

  window.open(providerUrl[provider], '_blank', 'noopener,noreferrer');
};

export const exportPreviewScreenshotSvg = (
  projectName: string,
  files: ProjectFiles,
  runtime: RuntimeMode,
  useTailwind: boolean,
) => {
  const runtimeSource = runtime === 'typescript' ? files.typescript : files.javascript;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
  <foreignObject x="0" y="0" width="1280" height="720">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:1280px;height:720px;background:#0a0f1a;color:#fff;overflow:hidden;">
      <style>${files.css}</style>
      ${useTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
      ${files.html}
      <script>${runtimeSource}</script>
    </div>
  </foreignObject>
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-preview.svg`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const exportPreviewPdf = (projectName: string, files: ProjectFiles, runtime: RuntimeMode, useTailwind: boolean) => {
  const runtimeSource = runtime === 'typescript' ? files.typescript : files.javascript;
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=860');
  if (!popup) return;

  popup.document.write(`<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${projectName} PDF Export</title>
    <style>${files.css}</style>
    <style>body{margin:0;padding:0;} @page { margin: 12mm; }</style>
    ${useTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
  </head>
  <body>
    ${files.html}
    <script>${runtimeSource}</script>
  </body>
  </html>`);
  popup.document.close();
  popup.focus();
  popup.print();
};
