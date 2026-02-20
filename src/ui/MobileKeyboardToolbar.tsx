interface MobileKeyboardToolbarProps {
  onInsert: (text: string) => void;
  onFormat: () => void;
  onComment: () => void;
  onEmmet: () => void;
  onRun: () => void;
}

const tokens = ['{', '}', '()', '=>', '<div></div>', 'console.log()'];

export const MobileKeyboardToolbar = ({ onInsert, onFormat, onComment, onEmmet, onRun }: MobileKeyboardToolbarProps) => (
  <div className="fixed inset-x-0 bottom-20 z-40 flex items-center gap-2 overflow-x-auto border-t border-slate-700 bg-slate-900/95 px-3 py-2 md:hidden">
    {tokens.map((token) => (
      <button key={token} className="rounded bg-slate-800 px-3 py-1 text-xs whitespace-nowrap" onClick={() => onInsert(token)}>
        {token}
      </button>
    ))}
    <button className="rounded bg-slate-700 px-3 py-1 text-xs whitespace-nowrap" onClick={onComment}>Comment</button>
    <button className="rounded bg-slate-700 px-3 py-1 text-xs whitespace-nowrap" onClick={onEmmet}>Emmet</button>
    <button className="rounded bg-slate-700 px-3 py-1 text-xs whitespace-nowrap" onClick={onFormat}>Format</button>
    <button className="rounded bg-cyan-700 px-3 py-1 text-xs font-medium whitespace-nowrap" onClick={onRun}>Run</button>
  </div>
);
