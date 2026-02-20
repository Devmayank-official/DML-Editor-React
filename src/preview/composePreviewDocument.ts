import { previewCsp } from '../security/csp';
import type { ProjectFiles } from '../types/project';

export const composePreviewDocument = (files: ProjectFiles, useTailwind: boolean, useTs: boolean): string => {
  const runtime = useTs ? files.typescript : files.javascript;
  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${previewCsp}" />
${useTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
<style>${files.css}</style>
</head>
<body>
${files.html}
<script>
const send = (level, payload) => parent.postMessage({ source: 'dml-preview', level, ...payload }, '*');
['log','warn','info'].forEach((type) => {
  const old = console[type];
  console[type] = (...args) => {
    send('log', { message: args.map((a) => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') });
    old.apply(console, args);
  };
});
window.addEventListener('error', (event) => send('error', { message: event.message, stack: event.error?.stack }));
</script>
<script>${runtime}</script>
</body>
</html>`;
};
