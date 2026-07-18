import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playSuccess } from "../shared/sounds";

export default function MountISO({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [phase, setPhase] = useState<"settings" | "attached">("settings");
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const accent = config.branding.accent;

  function handleAttach() {
    playClick();
    setShowFilePicker(true);
    setTimeout(() => {
      setShowFilePicker(false);
      setPhase("attached");
      playSuccess();
    }, 1500);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black cursor-pointer"
        onClick={() => {
          if (phase === "settings") setShowHelp(true);
        }}>
        <AnimatePresence mode="wait">
          <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="absolute inset-0">
            <img src="/images/virtualbox/05-select-iso.jpg" alt="VirtualBox Storage Settings"
              className="absolute inset-0 w-full h-full object-cover bg-[#2a2a2b]" />
          </motion.div>
        </AnimatePresence>

        {phase === "attached" && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 rounded-xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-sm px-4 py-2">
            <div className="text-xs text-emerald-400 font-semibold">✓ ISO mounted</div>
            <div className="text-[10px] text-white/50 mt-0.5 font-mono">{config.iso.filename}</div>
          </div>
        )}

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/50 bg-black/40 px-3 py-1 rounded-full pointer-events-none">
          {phase === "attached" ? "ISO ready — click to continue" : "Click the CD drive to attach ISO"}
        </div>

        <AnimatePresence>
          {showHelp && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => setShowHelp(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl border border-white/15 bg-[#1e1e1e] p-4 shadow-2xl w-72">
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>Mount ISO</div>
                <p className="text-xs text-white/60 mb-3">
                  In the Storage settings, click the <strong className="text-white/80">CD/DVD drive</strong> icon next to "Empty" under Controller: IDE, then browse for your ISO.
                </p>
                <button onClick={handleAttach}
                  className="w-full rounded-lg py-2 text-xs font-bold text-white transition-all hover:scale-[1.02]"
                  style={{ background: accent }}>💿 Browse for ISO…</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ISO picker */}
        <AnimatePresence>
          {showFilePicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowFilePicker(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="rounded-xl bg-[#1e1e1e] border border-white/10 p-4 shadow-2xl w-80">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                  <span className="text-lg text-white/60">📂</span>
                  <span className="text-xs text-white/60 font-medium">Select ISO image…</span>
                </div>
                <div className="rounded-lg bg-[#2a2a2b] p-3 text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="inline-block text-2xl">💿</motion.div>
                  <div className="mt-2 text-xs text-white/50">Selecting disk image…</div>
                  <div className="mt-1 text-[10px] text-white/30 font-mono">{config.iso.filename}</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom continue */}
      {phase === "attached" && (
        <button onClick={() => { playClick(); onComplete(); }}
          className="w-full rounded-b-2xl border border-white/10 bg-[#1a1a24] py-3 text-sm font-bold text-white transition-colors hover:opacity-90"
          style={{ background: accent }}>
          Start VM →
        </button>
      )}
    </div>
  );
}
