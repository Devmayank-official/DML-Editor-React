import { AnimatePresence, motion } from 'framer-motion';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { title: 'Project Tabs', description: 'Create and switch between local projects using tabs in the workspace header.' },
  { title: 'Keyboard Commands', description: 'Use Ctrl+S, Ctrl+Enter, Ctrl+Shift+F, Ctrl+/, and Ctrl+P for faster workflows.' },
  { title: 'Templates and Restore', description: 'Create from templates and restore snapshots from version history instantly.' },
];

export const OnboardingTour = ({ isOpen, onClose }: OnboardingTourProps) => {
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
            className="w-full max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-100">Welcome to DML Editor</h2>
            <div className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <article key={step.title} className="rounded border border-slate-700 bg-slate-950/50 p-3">
                  <h3 className="text-sm font-medium text-cyan-300">{index + 1}. {step.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{step.description}</p>
                </article>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button onClick={onClose} className="rounded bg-cyan-700 px-4 py-2 text-sm font-medium text-white">
                Get Started
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
