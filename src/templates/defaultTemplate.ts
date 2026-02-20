import type { ProjectFiles } from '../types/project';

export const defaultTemplate: ProjectFiles = {
  html: `<main class="min-h-screen grid place-items-center bg-slate-950 text-white">\n  <section class="text-center">\n    <h1 class="text-4xl font-bold">DML Editor</h1>\n    <p class="mt-3 text-slate-300">Production-ready browser IDE baseline.</p>\n    <button class="mt-6 rounded bg-cyan-500 px-4 py-2" onclick="hello()">Run action</button>\n  </section>\n</main>`,
  css: `:root { color-scheme: dark; }\nbody { margin: 0; font-family: Inter, system-ui, sans-serif; }`,
  javascript: `function hello(){ console.log('Hello from DML Editor'); }`,
  typescript: `const hello = (): void => { console.log('Hello from TypeScript runtime'); };\nhello();`,
};
