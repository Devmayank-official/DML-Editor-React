import { AnimatePresence, motion } from 'framer-motion';

export interface ThemeSettings {
  bg: string;
  panel: string;
  accent: string;
  text: string;
}

interface ThemeBuilderProps {
  isOpen: boolean;
  settings: ThemeSettings;
  onChange: (next: ThemeSettings) => void;
  onClose: () => void;
  onReset: () => void;
}

const fields: Array<{ key: keyof ThemeSettings; label: string }> = [
  { key: 'bg', label: 'Background' },
  { key: 'panel', label: 'Panel' },
  { key: 'accent', label: 'Accent' },
  { key: 'text', label: 'Text' },
];

export const ThemeBuilder = ({ isOpen, settings, onChange, onClose, onReset }: ThemeBuilderProps) => (
  <AnimatePresence>
    {isOpen ? (
      <motion.div
        className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-4"
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 14, opacity: 0 }}
          onClick={(event) => event.stopPropagation()}
        >
          <h2 className="text-base font-semibold text-slate-100">Custom Theme Builder</h2>
          <p className="mt-1 text-xs text-slate-400">Tune your editor shell colors and keep them persisted locally.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {fields.map((field) => (
              <label key={field.key} className="space-y-1">
                <span className="text-xs text-slate-300">{field.label}</span>
                <div className="flex items-center gap-2 rounded border border-slate-700 bg-slate-950 px-2 py-1">
                  <input
                    className="h-7 w-7 cursor-pointer rounded border border-slate-600 bg-transparent"
                    type="color"
                    value={settings[field.key]}
                    onChange={(event) => onChange({ ...settings, [field.key]: event.target.value })}
                  />
                  <input
                    className="w-full bg-transparent text-xs text-slate-200 outline-none"
                    value={settings[field.key]}
                    onChange={(event) => onChange({ ...settings, [field.key]: event.target.value })}
                  />
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button className="rounded bg-slate-800 px-3 py-1 text-xs" onClick={onReset}>Reset</button>
            <button className="rounded bg-cyan-700 px-3 py-1 text-xs font-medium" onClick={onClose}>Done</button>
          </div>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
);
