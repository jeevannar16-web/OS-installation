import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playSuccess } from "../shared/sounds";

function ClickArea({ area, onClick, hint }: { area: { top: number; left: number; width: number; height: number }; onClick: () => void; hint?: string }) {
  return (
    <div
      className="absolute z-10 cursor-pointer rounded border-2 border-transparent transition-all duration-200 hover:border-white/40 hover:bg-white/[0.08] group"
      style={{ top: `${area.top}%`, left: `${area.left}%`, width: `${area.width}%`, height: `${area.height}%` }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {hint && (
        <div className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-black shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
          {hint}
        </div>
      )}
    </div>
  );
}

export default function MountISO({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [phase, setPhase] = useState<"settings" | "browsing" | "attached">("settings");
  const [showFilePicker, setShowFilePicker] = useState(false);
  const accent = config.branding.accent || "#E95420";

  function handleAttach() {
    playClick();
    setShowFilePicker(true);
    setPhase("browsing");
    setTimeout(() => {
      setShowFilePicker(false);
      setPhase("attached");
      playSuccess();
    }, 1500);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <AnimatePresence mode="wait">
          <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="absolute inset-0">

            <img src="/images/virtualbox/05-select-iso.jpg" alt="VirtualBox Storage Settings"
              className="absolute inset-0 w-full h-full object-cover bg-[#2a2a2b]" />

            {/* Click "Empty" optical drive or CD icon to attach ISO */}
            {phase === "settings" && (
              <ClickArea area={{ top: 26, left: 12, width: 28, height: 8 }}
                onClick={handleAttach} hint="Click to attach ISO" />
            )}

            {phase === "attached" && (
              <div className="absolute inset-x-0 bottom-0 p-4 z-10">
                <div className="mx-auto max-w-md rounded-xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-sm p-3 text-center">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">✓ ISO mounted</div>
                  <p className="text-xs text-white/60 mt-1">
                    <span className="font-mono text-white/80">{config.iso.filename}</span> attached to the virtual drive.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ISO file picker overlay */}
        <AnimatePresence>
          {showFilePicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="rounded-xl bg-[#1e1e1e] border border-white/10 p-4 shadow-2xl w-80">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                  <span className="text-lg text-white/60">📂</span>
                  <span className="text-xs text-white/60 font-medium">Virtual Optical Disk Selector</span>
                </div>
                <div className="rounded-lg bg-[#2a2a2b] p-3 text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="inline-block text-2xl">💿</motion.div>
                  <div className="mt-2 text-xs text-white/50">Selecting disk image…</div>
                  <div className="mt-1 text-[10px] text-white/30 font-mono">{config.iso.filename}</div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }} animate={{ width: "100%" }}
                      transition={{ duration: 1.4, ease: "easeInOut" }}
                      style={{ background: accent }} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom status */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
          {phase === "attached" ? (
            <button onClick={() => { playClick(); onComplete(); }}
              className="rounded-lg px-5 py-2 text-xs font-semibold text-white transition-colors"
              style={{ background: accent }}>
              Start VM →
            </button>
          ) : phase === "settings" ? (
            <span className="text-[10px] text-white/40">Click the CD/DVD drive in the image above</span>
          ) : (
            <span className="text-[10px] text-white/40">Attaching ISO…</span>
          )}
        </div>
      </div>
    </div>
  );
}
