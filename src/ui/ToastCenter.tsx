import { AnimatePresence, motion } from 'framer-motion';

export interface Toast {
  id: string;
  message: string;
  tone: 'info' | 'error';
}

interface ToastCenterProps {
  toasts: Toast[];
}

export const ToastCenter = ({ toasts }: ToastCenterProps) => (
  <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className={`rounded border px-3 py-2 text-sm shadow-lg ${
            toast.tone === 'error'
              ? 'border-rose-500/60 bg-rose-950/90 text-rose-100'
              : 'border-cyan-500/60 bg-slate-900/95 text-slate-100'
          }`}
        >
          {toast.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);
