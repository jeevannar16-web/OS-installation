import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playSuccess } from "../shared/sounds";

export default function MountISO({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [phase, setPhase] = useState<"settings" | "attached">("settings");
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [hover, setHover] = useState(false);
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
      {/* VirtualBox VM Settings window */}
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

        {/* Main content - Storage Settings */}
        <div className="flex-1 flex overflow-hidden cursor-pointer"
          onClick={() => { if (phase === "settings") setShowHelp(true); }}>
          {/* Left sidebar - Settings categories */}
          <div className="w-36 bg-[#f0f0f0] border-r border-gray-300/40 p-2 hidden sm:block">
            {["General", "System", "Display", "Storage", "Audio", "Network", "USB", "Shared Folders"].map((cat) => (
              <div key={cat}
                className={`text-[8px] px-2 py-1 rounded mb-0.5 font-medium ${
                  cat === "Storage"
                    ? "bg-[#4a8cff] text-white"
                    : "text-gray-600 hover:bg-gray-200"
                }`}>
                {cat}
              </div>
            ))}
          </div>

          {/* Right content */}
          <div className="flex-1 relative bg-[#2a2a2b] overflow-hidden">
            {/* Screenshot overlay */}
            <img src="/images/virtualbox/05-select-iso.jpg" alt="VirtualBox Storage Settings"
              className="absolute inset-0 w-full h-full object-cover bg-[#2a2a2b]" />

            {/* CD/DVD drive icon - interactive */}
            <motion.div
              animate={phase === "settings" ? {
                scale: hover ? 1.05 : 1,
                boxShadow: hover ? "0 0 30px rgba(74, 140, 255, 0.4)" : "0 0 0px rgba(74, 140, 255, 0)",
              } : {}}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              className="absolute top-[55%] left-[38%] z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); if (phase === "settings") setShowHelp(true); }}>
              <div className={`rounded-xl p-3 transition-all ${phase === "attached" ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/10 border border-white/20 hover:bg-white/15"}`}>
                <div className="text-2xl text-center mb-1">{phase === "attached" ? "💿" : "💿"}</div>
                <div className="text-[9px] font-mono text-center">
                  {phase === "attached" ? (
                    <span className="text-emerald-300">{config.iso.filename}</span>
                  ) : (
                    <span className="text-white/60">Empty — Click to attach ISO</span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Badge when attached */}
            {phase === "attached" && (
              <div className="absolute top-4 right-4 z-10 rounded-xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-sm px-4 py-2">
                <div className="text-xs text-emerald-400 font-semibold">✓ ISO mounted</div>
                <div className="text-[10px] text-white/50 mt-0.5 font-mono">{config.iso.filename}</div>
              </div>
            )}

            {/* Bottom hint */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-white/50 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
              {phase === "attached" ? "ISO ready — click to continue" : "Click the CD/DVD drive to attach ISO"}
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

      {/* Help popup */}
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
