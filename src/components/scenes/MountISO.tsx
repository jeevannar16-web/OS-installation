import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playSuccess } from "../shared/sounds";

const CATEGORIES = [
  "General", "System", "Display", "Storage", "Audio", "Network", "USB", "Shared Folders",
];

export default function MountISO({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [phase, setPhase] = useState<"settings" | "browsing" | "attached">("settings");
  const [activeCat, setActiveCat] = useState("Storage");

  function handleBrowseClick() {
    if (phase !== "settings") return;
    playClick();
    setPhase("browsing");
    setTimeout(() => {
      setPhase("attached");
      playSuccess();
    }, 1400);
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-gray-600/30 shadow-2xl flex flex-col font-sans select-none"
        style={{ background: "linear-gradient(180deg, #3c3c3c 0%, #323232 100%)" }}>
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-3 py-1.5 shrink-0">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <div className="flex items-center gap-1.5 mx-auto text-[10px] text-gray-600 font-semibold">
            <span className="text-[11px] text-[#4a8cff]">⬡</span>
            <span>{config.branding.shortName} — Settings</span>
          </div>
          <div className="flex gap-1">
            <div className="h-2.5 w-3 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2.5 w-3 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2.5 w-3 rounded-sm bg-gray-300 border border-gray-400/50" />
          </div>
        </div>

        {/* Main content: full settings layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Category sidebar */}
          <div className="w-40 bg-[#f0f0f0] border-r border-gray-300/40 p-2 overflow-y-auto shrink-0">
            {CATEGORIES.map(cat => (
              <div key={cat} onClick={() => { if (cat === "Storage") { playClick(); setActiveCat(cat); } }}
                className={`text-[9px] px-2.5 py-1.5 rounded mb-0.5 font-semibold transition-all ${
                  cat === activeCat
                    ? "bg-[#4a8cff] text-white"
                    : "text-gray-500 hover:bg-gray-200 cursor-pointer"
                } ${cat !== "Storage" ? "opacity-60 cursor-default" : ""}`}>{cat}</div>
            ))}
          </div>

          {/* Storage pane */}
          <div className="flex-1 bg-[#f0f0f0] flex overflow-hidden">
            {/* Storage Tree */}
            <div className="w-2/5 border-r border-gray-300/40 bg-[#f7f7f7] flex flex-col overflow-hidden">
              <div className="px-3 pt-3 pb-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider shrink-0">Storage Tree</div>
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
                {/* IDE Controller */}
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold px-1 py-0.5">
                    <span className="text-gray-400 text-[8px]">▶</span>
                    <span>Controller: IDE</span>
                  </div>
                  <div className="ml-3 pl-3 border-l-2 border-gray-200 mt-1 space-y-1">
                    <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] transition-all ${
                      phase === "attached" ? "bg-blue-50/80 text-blue-700 font-medium" : "bg-white/70 text-gray-600"
                    }`}>
                      <span className="text-[11px]">💿</span>
                      <span className={phase === "attached" ? "text-blue-700 truncate" : "text-gray-400 italic"}>
                        {phase === "attached" ? config.iso.filename : "Empty"}
                      </span>
                    </div>
                  </div>
                </div>
                {/* SATA Controller */}
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold px-1 py-0.5">
                    <span className="text-gray-400 text-[8px]">▶</span>
                    <span>Controller: SATA</span>
                  </div>
                  <div className="ml-3 pl-3 border-l-2 border-gray-200 mt-1 space-y-1">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-white/70 text-[10px] text-gray-600">
                      <span className="text-[11px]">💾</span>
                      <span>{config.branding.shortName}.vdi</span>
                    </div>
                  </div>
                </div>
                {/* Add controller buttons */}
                <div className="flex gap-1 pt-1">
                  <button className="text-[9px] bg-gray-200 hover:bg-gray-300 text-gray-500 px-2 py-1 rounded font-medium transition-all">+ IDE</button>
                  <button className="text-[9px] bg-gray-200 hover:bg-gray-300 text-gray-500 px-2 py-1 rounded font-medium transition-all">+ SATA</button>
                </div>
              </div>
            </div>

            {/* Details pane */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col">
              <h3 className="text-xs font-bold text-gray-700 mb-3">Storage Devices</h3>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[9px] uppercase tracking-wider">
                      <th className="text-left px-3 py-2 font-semibold">Controller</th>
                      <th className="text-left px-3 py-2 font-semibold">Attribute</th>
                      <th className="text-left px-3 py-2 font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 text-gray-700 font-medium">IDE</td>
                      <td className="px-3 py-2 text-gray-500">Optical Drive</td>
                      <td className="px-3 py-2">
                        {phase === "attached" ? (
                          <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                            <span>✓</span>
                            <span className="truncate max-w-[120px] inline-block">{config.iso.filename}</span>
                          </span>
                        ) : (
                          <button onClick={handleBrowseClick}
                            className="text-[#4a8cff] hover:underline font-medium cursor-pointer bg-transparent border-none p-0 text-[10px]">
                            Choose a disk file…
                          </button>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 text-gray-700 font-medium">SATA</td>
                      <td className="px-3 py-2 text-gray-500">Hard Disk</td>
                      <td className="px-3 py-2 text-gray-700 font-mono text-[9px]">{config.branding.shortName}.vdi</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Attributes section */}
              <div className="mt-5 border-t border-gray-200 pt-4">
                <div className="text-[10px] font-bold text-gray-600 mb-3 uppercase tracking-wider">Attributes</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <label className="block text-[9px] text-gray-500 font-semibold mb-1">Slot:</label>
                    <select className="w-full border border-gray-300 rounded px-2 py-1.5 text-[11px] text-gray-700 bg-white outline-none focus:border-[#4a8cff] cursor-pointer">
                      <option>IDE Primary Master</option>
                      <option>IDE Primary Slave</option>
                      <option>IDE Secondary Master</option>
                      <option>IDE Secondary Slave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 font-semibold mb-1">Live CD/DVD:</label>
                    <input type="checkbox" defaultChecked className="accent-[#4a8cff] mt-1.5 w-4 h-4 cursor-pointer" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[9px] text-gray-400 font-mono">Information: {config.iso.size} — 2048 bytes/sector</p>
                </div>
              </div>

              {phase === "attached" && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                  <span className="text-green-600 text-sm">✓</span>
                  <span className="text-[10px] text-green-700 font-semibold">ISO image mounted successfully</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Browsing overlay */}
        <AnimatePresence>
          {phase === "browsing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📂</span>
                  <h3 className="text-sm font-bold text-gray-800">Select optical disk image</h3>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>💿</span>
                    <span className="font-semibold">{config.iso.filename}</span>
                    <span className="text-gray-400 ml-auto text-xs">{config.iso.size}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 ml-7 font-mono">/home/user/Downloads</div>
                </div>
                <motion.div className="h-1.5 rounded-full bg-blue-100 overflow-hidden mb-3">
                  <motion.div className="h-full bg-[#4a8cff]" initial={{ width: "0%" }}
                    animate={{ width: "100%" }} transition={{ duration: 1.2, ease: "easeInOut" }} />
                </motion.div>
                <div className="flex justify-end">
                  <button disabled
                    className="text-xs font-bold bg-gray-200 text-gray-400 px-5 py-2 rounded-lg">
                    Attaching…
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status bar */}
        <div className="bg-[#2a2a2a] border-t border-gray-600/40 px-3 py-1.5 flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
            <span className="text-[9px] text-gray-400">Settings</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-gray-500 mr-2">
              {phase === "settings" ? "Click 'Choose a disk file' to mount an ISO" : phase === "attached" ? "ISO mounted successfully" : ""}
            </span>
            <button onClick={() => { playClick(); onComplete(); }}
              className="text-xs text-gray-400 hover:text-white transition-colors font-medium px-3 py-1 rounded hover:bg-white/10">
              Cancel
            </button>
            {phase === "attached" && (
              <button onClick={() => { playClick(); onComplete(); }}
                className="text-sm font-bold text-white px-6 py-1.5 rounded-lg shadow-sm hover:brightness-110 transition-all"
                style={{ background: "#4a8cff" }}>
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
