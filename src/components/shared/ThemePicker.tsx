import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, THEMES } from "./ThemeProvider";

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-white/10 px-2.5 sm:px-3 py-1 text-xs sm:text-sm text-white/50 hover:text-white transition-colors"
        title="Change theme"
      >
        {theme.icon}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-52 rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl p-2"
          >
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-white/30 font-semibold">
              Theme
            </div>
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                  theme.id === t.id
                    ? "bg-accent/20 text-white"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                }`}
              >
                <span className="text-base">{t.icon}</span>
                <span>{t.name}</span>
                {theme.id === t.id && (
                  <span className="ml-auto text-accent text-xs">✓</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
