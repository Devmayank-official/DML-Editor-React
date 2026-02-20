import { useState } from 'react';

interface JsReplPanelProps {
  onLog: (message: string) => void;
}

export const JsReplPanel = ({ onLog }: JsReplPanelProps) => {
  const [expression, setExpression] = useState('2 + 2');

  const run = () => {
    try {
      // Isolated function scope to avoid leaking local variables.
      const value = Function(`"use strict"; return (${expression});`)();
      onLog(`REPL: ${String(value)}`);
    } catch (error) {
      onLog(`REPL Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <section className="rounded border border-slate-700 bg-slate-900/80 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">JS REPL</h3>
      <div className="mt-2 flex gap-2">
        <input
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          className="flex-1 rounded bg-slate-800 px-2 py-1 text-xs text-slate-100 outline-none"
          placeholder="Enter JavaScript expression"
        />
        <button className="rounded bg-cyan-700 px-3 py-1 text-xs font-medium text-white" onClick={run}>
          Eval
        </button>
      </div>
    </section>
  );
};
