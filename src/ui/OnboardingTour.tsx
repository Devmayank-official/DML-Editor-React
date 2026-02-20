import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { title: 'Project Tabs', description: 'Create and switch between local projects using tabs in the workspace header.' },
  { title: 'Keyboard Commands', description: 'Use Ctrl+S, Ctrl+Enter, Ctrl+Shift+F, Ctrl+/, and Ctrl+P for faster workflows.' },
  { title: 'Theme Builder', description: 'Open the theme panel to tune accent, panel, text, and background colors.' },
  { title: 'Templates and Restore', description: 'Create from templates and restore snapshots from version history instantly.' },
];

export const OnboardingTour = ({ isOpen, onClose }: OnboardingTourProps) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  const step = steps[stepIndex];

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-xl rounded-lg border border-slate-700 bg-slate-900 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">Step {stepIndex + 1} of {steps.length}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-100">{step.title}</h2>
            <p className="mt-3 text-sm text-slate-300">{step.description}</p>
            <div className="mt-4 flex gap-1">
              {steps.map((entry, index) => (
                <button
                  key={entry.title}
                  className={`h-1.5 flex-1 rounded ${index === stepIndex ? 'bg-cyan-400' : 'bg-slate-700'}`}
                  onClick={() => setStepIndex(index)}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                disabled={stepIndex === 0}
                className="rounded bg-slate-800 px-3 py-2 text-xs disabled:opacity-40"
              >
                Previous
              </button>
              {stepIndex === steps.length - 1 ? (
                <button onClick={onClose} className="rounded bg-cyan-700 px-4 py-2 text-sm font-medium text-white">
                  Finish
                </button>
              ) : (
                <button
                  onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
                  className="rounded bg-cyan-700 px-4 py-2 text-sm font-medium text-white"
                >
                  Next
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
