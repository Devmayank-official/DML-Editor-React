import type { ProjectFiles } from '../types/project';

export interface TemplateDefinition {
  id: string;
  name: string;
  files: ProjectFiles;
}

export const templateLibrary: TemplateDefinition[] = [
  {
    id: 'landing',
    name: 'Landing Page',
    files: {
      html: `<main class="min-h-screen bg-slate-950 text-slate-100">\n  <section class="mx-auto max-w-5xl px-6 py-20">\n    <h1 class="text-5xl font-bold tracking-tight">Launch better products faster.</h1>\n    <p class="mt-6 max-w-2xl text-lg text-slate-300">DML Editor template for polished hero sections.</p>\n    <div class="mt-8 flex gap-3">\n      <button class="rounded bg-cyan-500 px-4 py-2 font-semibold">Get started</button>\n      <button class="rounded border border-slate-600 px-4 py-2">Documentation</button>\n    </div>\n  </section>\n</main>`,
      css: 'body { margin: 0; font-family: Inter, system-ui, sans-serif; }',
      javascript: "console.log('Landing template ready');",
      typescript: "console.log('Landing template ready');",
    },
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    files: {
      html: `<main class="min-h-screen bg-slate-950 px-6 py-10 text-white">\n  <h1 class="text-3xl font-bold">Alex Carter</h1>\n  <p class="mt-2 text-slate-300">Frontend Engineer</p>\n  <section class="mt-8 grid gap-4 sm:grid-cols-2">\n    <article class="rounded border border-slate-700 p-4">Project One</article>\n    <article class="rounded border border-slate-700 p-4">Project Two</article>\n  </section>\n</main>`,
      css: 'body { margin: 0; font-family: Inter, system-ui, sans-serif; }',
      javascript: "console.log('Portfolio template ready');",
      typescript: "console.log('Portfolio template ready');",
    },
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    files: {
      html: `<div class="min-h-screen bg-slate-950 text-slate-100 p-4">\n  <header class="flex items-center justify-between rounded bg-slate-900 p-4">\n    <h1 class="text-xl font-semibold">Dashboard</h1>\n    <span class="rounded bg-emerald-500/20 px-2 py-1 text-emerald-300">Online</span>\n  </header>\n  <section class="mt-4 grid gap-4 md:grid-cols-3">\n    <article class="rounded bg-slate-900 p-4">Revenue</article>\n    <article class="rounded bg-slate-900 p-4">Users</article>\n    <article class="rounded bg-slate-900 p-4">Errors</article>\n  </section>\n</div>`,
      css: 'body { margin: 0; font-family: Inter, system-ui, sans-serif; }',
      javascript: "console.log('Dashboard template ready');",
      typescript: "console.log('Dashboard template ready');",
    },
  },
  {
    id: 'form',
    name: 'Form',
    files: {
      html: `<main class="grid min-h-screen place-items-center bg-slate-950 text-white">\n  <form class="w-full max-w-md space-y-4 rounded bg-slate-900 p-6" onsubmit="submitForm(event)">\n    <h1 class="text-2xl font-semibold">Contact</h1>\n    <input class="w-full rounded bg-slate-800 p-2" placeholder="Name" required />\n    <input class="w-full rounded bg-slate-800 p-2" placeholder="Email" type="email" required />\n    <textarea class="w-full rounded bg-slate-800 p-2" placeholder="Message"></textarea>\n    <button class="rounded bg-cyan-500 px-4 py-2 font-semibold">Submit</button>\n  </form>\n</main>`,
      css: 'body { margin: 0; font-family: Inter, system-ui, sans-serif; }',
      javascript: "function submitForm(event){ event.preventDefault(); console.log('Form submitted'); }",
      typescript: "const submitForm = (event: Event): void => { event.preventDefault(); console.log('Form submitted'); };",
    },
  },
];
