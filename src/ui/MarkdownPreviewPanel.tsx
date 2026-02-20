import { useMemo } from 'react';
import { renderMarkdownToHtml } from '../utils/markdown';

interface MarkdownPreviewPanelProps {
  markdown: string;
  onChange: (value: string) => void;
}

export const MarkdownPreviewPanel = ({ markdown, onChange }: MarkdownPreviewPanelProps) => {
  const html = useMemo(() => renderMarkdownToHtml(markdown), [markdown]);

  return (
    <section className="grid gap-2 rounded border border-slate-700 bg-slate-950/40 p-3 md:grid-cols-2">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Markdown Source</h3>
        <textarea
          value={markdown}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 h-40 w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs outline-none"
          placeholder="# Notes\n- Document your project"
        />
      </div>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Markdown Preview</h3>
        <article
          className="prose prose-invert mt-2 max-h-40 overflow-auto rounded border border-slate-700 bg-slate-900 p-3 text-xs"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
};
