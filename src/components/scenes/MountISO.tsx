import { useState } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playSuccess } from "../shared/sounds";

export default function MountISO({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [phase, setPhase] = useState<"settings" | "browsing" | "attached">("settings");
  const accent = config.branding.accent;

  function handleClick() {
    if (phase !== "settings") return;
    playClick();
    setPhase("browsing");
    setTimeout(() => { setPhase("attached"); playSuccess(); }, 1600);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-gray-600/30 bg-[#3c3c3c] shadow-2xl flex flex-col">
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

        <div className="flex-1 flex overflow-hidden">
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

          <div className="flex-1 relative bg-[#2a2a2b] overflow-hidden">
            <img src="/images/virtualbox/05-select-iso.jpg" alt="Storage Settings"
              className="absolute inset-0 w-full h-full object-cover" />

            {/* CD/DVD drive — the only interactive element on the image */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
              <motion.button
                whileHover={phase === "settings" ? { scale: 1.06 } : {}}
                onClick={handleClick}
                disabled={phase !== "settings"}
                className={`pointer-events-auto rounded-xl p-3 transition-all ${
                  phase === "attached"
                    ? "bg-emerald-500/15"
                    : phase === "browsing"
                    ? "bg-white/5"
                    : "bg-white/10 hover:bg-white/15"
                }`}
                style={{ position: "absolute", top: "50%", left: "46%", transform: "translate(-50%, -50%)" }}>
                <motion.div className="text-2xl text-center mb-1"
                  animate={phase === "browsing" ? { rotate: 360 } : { rotate: 0 }}
                  transition={phase === "browsing" ? { repeat: Infinity, duration: 2, ease: "linear" } : {}}>
                  💿
                </motion.div>
                <div className="text-[9px] font-mono text-center">
                  {phase === "attached" ? (
                    <span className="text-emerald-300">{config.iso.filename.slice(0, 16)}…</span>
                  ) : phase === "browsing" ? (
                    <span className="text-white/40">Opening…</span>
                  ) : (
                    <span className="text-white/60">Empty</span>
                  )}
                </div>
              </motion.button>
            </div>

            {/* Minimal progress line during browsing */}
            {phase === "browsing" && (
              <motion.div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/10 z-20"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div className="h-full rounded-full"
                  initial={{ width: "0%" }} animate={{ width: "100%" }}
                  transition={{ duration: 1.4, ease: "easeInOut" }}
                  style={{ background: accent }} />
              </motion.div>
            )}
          </div>
        </div>

        <div className="bg-[#2a2a2a] border-t border-gray-600/40 px-2 py-0.5 flex items-center gap-2 rounded-b-2xl">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
            <span className="text-[7px] text-gray-400">Settings</span>
          </div>
          <div className="flex-1" />
          <span className="text-[7px] text-gray-500">Storage</span>
        </div>
      </div>

      {phase === "attached" && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={() => { playClick(); onComplete(); }}
          className="w-full rounded-b-2xl border-t border-white/10 py-3 text-sm font-bold text-white"
          style={{ background: accent }}>
          Start VM →
        </motion.button>
      )}
    </div>
  );
}
