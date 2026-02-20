import type { ConsoleEntry } from '../types/project';

interface ConsolePanelProps {
  logs: ConsoleEntry[];
  onClear: () => void;
}

export const ConsolePanel = ({ logs, onClear }: ConsolePanelProps) => {
  return (
    <section className="flex h-48 flex-col border-t border-slate-700 bg-black/40">
      <header className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs uppercase tracking-wide text-slate-300">Console</h3>
        <button onClick={onClear} className="rounded bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700">
          Clear
        </button>
      </header>
      <div className="flex-1 space-y-1 overflow-auto px-3 pb-3 font-mono text-xs">
        {logs.map((log) => (
          <div key={log.id} className={log.level === 'error' ? 'text-rose-300' : 'text-slate-200'}>
            <span className="mr-2 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            {log.message}
            {log.stack ? <pre className="whitespace-pre-wrap text-[11px] text-rose-200">{log.stack}</pre> : null}
          </div>
        ))}
      </div>
    </section>
  );
};
