import { triggerHaptic } from '../utils/haptics';

interface FloatingActionsProps {
  onRun: () => void;
  onSave: () => void;
  onSettings: () => void;
}

export const FloatingActions = ({ onRun, onSave, onSettings }: FloatingActionsProps) => {
  const withHaptic = (action: () => void) => () => {
    triggerHaptic(12);
    action();
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2 rounded-full border border-slate-700 bg-slate-900/95 p-2 shadow-lg md:hidden">
      <button className="rounded-full bg-cyan-700 px-4 py-2 text-xs font-semibold" onClick={withHaptic(onRun)}>
        Run
      </button>
      <button className="rounded-full bg-slate-700 px-4 py-2 text-xs" onClick={withHaptic(onSave)}>
        Save
      </button>
      <button className="rounded-full bg-slate-700 px-4 py-2 text-xs" onClick={withHaptic(onSettings)}>
        Settings
      </button>
    </div>
  );
};
