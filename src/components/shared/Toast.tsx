import { createContext, useCallback, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Toast = { id: number; message: string; icon?: string };

const ToastCtx = createContext<(msg: string, icon?: string) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, icon?: string) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, message, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-6 z-[9999] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="pointer-events-auto flex items-center gap-3 rounded-xl border border-white/10 bg-[#1a1a2e] px-4 py-3 text-sm text-white shadow-2xl backdrop-blur"
            >
              {t.icon && <span className="text-lg">{t.icon}</span>}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
