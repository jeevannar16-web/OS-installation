import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playSuccess } from "../shared/sounds";

export default function MountISO({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [phase, setPhase] = useState<"settings" | "attached">("settings");
  const [browsing, setBrowsing] = useState(false);
  const accent = config.branding.accent;

  function handleAttach() {
    playClick();
    setBrowsing(true);
    setTimeout(() => {
      setBrowsing(false);
      setPhase("attached");
      playSuccess();
    }, 1600);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-gray-600/30 bg-[#3c3c3c] shadow-2xl flex flex-col">
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-3 py-1.5 select-none rounded-t-2xl">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <div className="flex items-center gap-2 mx-auto text-[9px] text-gray-600 font-medium">
            <span>{config.branding.shortName} VM — Settings</span>
          </div>
          <div className="flex gap-1">
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Settings sidebar */}
          <div className="w-36 bg-[#f0f0f0] border-r border-gray-300/40 p-2 hidden sm:block">
            {["General", "System", "Display", "Storage", "Audio", "Network", "USB", "Shared Folders"].map(cat => (
              <div key={cat}
                className={`text-[8px] px-2 py-1 rounded mb-0.5 font-medium ${
                  cat === "Storage"
                    ? "bg-[#4a8cff] text-white"
                    : "text-gray-600 hover:bg-gray-200 cursor-pointer"
                }`}>
                {cat}
              </div>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 relative bg-[#2a2a2b] overflow-hidden">
            <img src="/images/virtualbox/05-select-iso.jpg" alt="Storage Settings"
              className="absolute inset-0 w-full h-full object-cover" />

            {/* Interactive CD/DVD drive */}
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="absolute" style={{ top: "50%", left: "46%" }}>
                <motion.button
                  whileHover={phase === "settings" ? { scale: 1.06 } : {}}
                  onClick={() => { if (phase === "settings" && !browsing) handleAttach(); }}
                  disabled={phase !== "settings"}
                  className={`rounded-xl p-3 transition-all cursor-pointer ${
                    phase === "attached"
                      ? "bg-emerald-500/20 border border-emerald-500/30"
                      : "bg-white/10 border border-white/20 hover:bg-white/15"
                  }`}>
                  <div className="text-2xl text-center mb-1">💿</div>
                  <div className="text-[9px] font-mono text-center">
                    {phase === "attached" ? (
                      <span className="text-emerald-300">{config.iso.filename.length > 16 ? config.iso.filename.slice(0, 16) + "…" : config.iso.filename}</span>
                    ) : (
                      <span className="text-white/60">Empty</span>
                    )}
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Attached badge */}
            <AnimatePresence>
              {phase === "attached" && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute top-3 right-3 z-10 rounded-xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-sm px-4 py-2">
                  <div className="text-xs text-emerald-400 font-semibold">✓ ISO mounted</div>
                  <div className="text-[10px] text-white/50 mt-0.5 font-mono">{config.iso.filename}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Browsing animation — floats on the image */}
            <AnimatePresence>
              {browsing && (
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}
                  className="absolute bottom-10 left-2 right-2 z-20 text-center"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                  <div className="flex items-center justify-center gap-2 text-xs text-white/70 font-medium mb-1">
                    <motion.div animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="inline-block text-lg">💿</motion.div>
                    <span>Selecting {config.branding.shortName} disk image...</span>
                  </div>
                  <div className="text-[10px] text-white/50 font-mono mb-2">{config.iso.filename}</div>
                  <motion.div className="h-1 rounded-full bg-white/10 mx-auto max-w-[200px] overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }} animate={{ width: "100%" }}
                      transition={{ duration: 1.4, ease: "easeInOut" }}
                      style={{ background: accent }} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom hint */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-white/50 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
              {browsing ? "Browsing..." : phase === "attached" ? "ISO ready — continue below" : "Click the CD/DVD drive to attach ISO"}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-[#2a2a2a] border-t border-gray-600/40 px-2 py-0.5 flex items-center gap-2 rounded-b-2xl">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
            <span className="text-[7px] text-gray-400">Settings</span>
          </div>
          <div className="flex-1" />
          <span className="text-[7px] text-gray-500">Storage</span>
        </div>
      </div>

      {/* Continue button */}
      {phase === "attached" && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => { playClick(); onComplete(); }}
          className="w-full rounded-b-2xl border-t border-white/10 py-3 text-sm font-bold text-white transition-colors hover:opacity-90"
          style={{ background: accent }}>
          Start VM →
        </motion.button>
      )}
    </div>
  );
}
