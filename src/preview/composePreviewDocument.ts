import ts from 'typescript';
import { previewCsp } from '../security/csp';
import type { ProjectFiles, StylePreprocessor } from '../types/project';
import { compileStyles } from '../utils/styleCompiler';

const transpileRuntime = (files: ProjectFiles, useTs: boolean): string => {
  if (!useTs) return files.javascript;

  const result = ts.transpileModule(files.typescript, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
    reportDiagnostics: true,
  });

  if ((result.diagnostics?.length ?? 0) > 0) {
    const message = result.diagnostics
      ?.map((entry) => ts.flattenDiagnosticMessageText(entry.messageText, '\n'))
      .join('\n');
    return `throw new Error(${JSON.stringify(message ?? 'TypeScript transpile failed.')});`;
  }

  return result.outputText;
};

export const composePreviewDocument = async (
  files: ProjectFiles,
  useTailwind: boolean,
  useTs: boolean,
  stylePreprocessor: StylePreprocessor,
): Promise<string> => {
  const runtime = transpileRuntime(files, useTs);
  const { css, error } = await compileStyles(files.css, stylePreprocessor);

  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${previewCsp}" />
${useTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
<style>${css}</style>
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
${error ? `send('error', { message: ${JSON.stringify(`[${stylePreprocessor.toUpperCase()}] ${error}`)} });` : ''}
</script>
<script>${runtime}</script>
</body>
</html>`;
};
