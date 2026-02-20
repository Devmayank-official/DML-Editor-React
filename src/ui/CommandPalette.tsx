import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface CommandItem {
  id: string;
  label: string;
  onExecute: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export const CommandPalette = ({ isOpen, onClose, commands }: CommandPaletteProps) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return commands;
    return commands.filter((command) => command.label.toLowerCase().includes(normalized));
  }, [commands, query]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-start bg-black/70 p-4 pt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-xl rounded-lg border border-slate-700 bg-slate-900"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
          >
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a command"
              className="w-full border-b border-slate-700 bg-transparent px-4 py-3 text-sm outline-none"
            />
            <div className="max-h-72 overflow-auto p-2">
              {filtered.map((command) => (
                <button
                  key={command.id}
                  onClick={() => {
                    command.onExecute();
                    onClose();
                    setQuery('');
                  }}
                  className="block w-full rounded px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                >
                  {command.label}
                </button>
              ))}
              {filtered.length === 0 ? <p className="px-3 py-2 text-sm text-slate-400">No commands found.</p> : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
