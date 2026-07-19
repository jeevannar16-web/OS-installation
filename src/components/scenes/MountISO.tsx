import { useState } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playSuccess } from "../shared/sounds";

export default function MountISO({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [phase, setPhase] = useState<"settings" | "browsing" | "attached">("settings");

  const imgSrc = "/images/virtualbox/05-select-iso.jpg";

  function handleBrowse() {
    if (phase !== "settings") return;
    playClick();
    setPhase("browsing");
    setTimeout(() => { setPhase("attached"); playSuccess(); }, 1600);
  }

  const hotspots = phase === "settings"
    ? [
        { id: "browse", x: 38, y: 42, w: 35, h: 8, onClick: handleBrowse },
        { id: "cancel", x: 68, y: 82, w: 14, h: 8, onClick: () => { playClick(); onComplete(); } },
      ]
    : phase === "attached"
    ? [
        { id: "ok", x: 52, y: 82, w: 14, h: 8, onClick: () => { playClick(); onComplete(); } },
        { id: "cancel", x: 68, y: 82, w: 14, h: 8, onClick: () => { playClick(); onComplete(); } },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-gray-600/30 bg-[#3c3c3c] shadow-2xl flex flex-col font-sans">
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

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Category sidebar */}
          <div className="w-36 bg-[#f0f0f0] border-r border-gray-300/40 p-2 hidden sm:block">
            {["General", "System", "Display", "Storage", "Audio", "Network", "USB", "Shared Folders"].map(cat => (
              <div key={cat}
                className={`text-[8px] px-2 py-1 rounded mb-0.5 font-medium ${
                  cat === "Storage" ? "bg-[#4a8cff] text-white" : "text-gray-600 hover:bg-gray-200 cursor-pointer"
                }`}>
                {cat}
              </div>
            ))}
          </div>

          {/* Screenshot + hotspots */}
          <div className="flex-1 relative bg-[#f0f0f0] overflow-hidden">
            <img src={imgSrc} alt="VirtualBox Storage Settings"
              className="absolute inset-0 w-full h-full object-cover" />
            {hotspots.map(h => (
              <div key={h.id} onClick={h.onClick}
                className="absolute z-10"
                style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%`, cursor: "pointer" }} />
            ))}
            {phase === "browsing" && (
              <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <motion.span animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="inline-block text-2xl">💿</motion.span>
                  <div className="text-xs text-white/60 font-mono">Selecting optical disk…</div>
                  <motion.div className="h-1 w-40 rounded-full bg-white/10 overflow-hidden">
                    <motion.div className="h-full rounded-full bg-white/60"
                      initial={{ width: "0%" }} animate={{ width: "100%" }}
                      transition={{ duration: 1.4, ease: "easeInOut" }} />
                  </motion.div>
                </div>
              </div>
            )}
            {phase === "attached" && (
              <div className="absolute bottom-2 right-2 z-20 bg-green-600/80 text-white text-[9px] px-2 py-0.5 rounded-full font-medium">
                ✓ ISO Mounted
              </div>
            )}
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
    </div>
  );
}
