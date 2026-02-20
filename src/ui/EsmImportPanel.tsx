import { useState } from 'react';
import { buildEsmImportSnippet, buildEsmImportUrl } from '../utils/esmImport';

interface EsmImportPanelProps {
  onInsert: (snippet: string) => void;
}

export const EsmImportPanel = ({ onInsert }: EsmImportPanelProps) => {
  const [pkg, setPkg] = useState('lodash-es');
  const [namedExport, setNamedExport] = useState('');

  const url = buildEsmImportUrl(pkg);

  return (
    <section className="rounded border border-slate-700 bg-slate-950/40 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">npm / esm.sh Import</h3>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        <input value={pkg} onChange={(event) => setPkg(event.target.value)} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs" placeholder="package or package/subpath" />
        <input value={namedExport} onChange={(event) => setNamedExport(event.target.value)} className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs" placeholder="named export (optional)" />
        <button
          className="rounded bg-cyan-700 px-2 py-1 text-xs font-medium"
          onClick={() => {
            const snippet = buildEsmImportSnippet(pkg, namedExport);
            if (!snippet) return;
            onInsert(snippet);
          }}
        >
          Insert Import
        </button>
      </div>
      <p className="mt-2 truncate text-xs text-slate-400">Resolved URL: {url || 'n/a'}</p>
    </section>
  );
};
