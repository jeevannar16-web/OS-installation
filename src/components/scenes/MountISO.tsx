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
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-gray-600/30 bg-[#3c3c3c] shadow-2xl flex flex-col font-sans">
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-3 py-1.5 select-none rounded-t-2xl">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <div className="flex items-center gap-2 mx-auto text-[9px] text-gray-600 font-medium">
            <span>{config.branding.shortName} — Settings</span>
          </div>
          <div className="flex gap-1">
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-36 bg-[#f0f0f0] border-r border-gray-300/40 p-2 overflow-y-auto">
            {CATEGORIES.map(cat => (
              <div key={cat} onClick={() => { if (cat === "Storage") { playClick(); setActiveCat(cat); } }}
                className={`text-[8px] px-2 py-1 rounded mb-0.5 font-medium transition-all ${
                  cat === activeCat
                    ? "bg-[#4a8cff] text-white"
                    : "text-gray-500 hover:bg-gray-200 cursor-pointer"
                } ${cat !== "Storage" ? "opacity-60 cursor-default" : ""}`}>{cat}</div>
            ))}
          </div>

          <div className="flex-1 bg-[#f0f0f0] flex overflow-hidden">
            <div className="w-1/3 border-r border-gray-300/40 bg-[#f7f7f7] p-3">
              <div className="text-[9px] font-semibold text-gray-600 mb-2 uppercase tracking-wider">Storage Tree</div>
              <div className="space-y-1">
                <div className="text-[8px] text-gray-500 font-medium px-1 py-0.5">IDE Controller</div>
                <div className="text-[8px] text-gray-700 pl-4 py-0.5 flex items-center gap-1">
                  <span className="text-[10px]">💿</span>
                  <span className={phase === "attached" ? "text-green-700 font-medium" : ""}>
                    {phase === "attached" ? config.iso.filename : "Empty"}
                  </span>
                </div>
                <div className="text-[8px] text-gray-500 font-medium px-1 py-0.5 mt-2">SATA Controller</div>
                <div className="text-[8px] text-gray-700 pl-4 py-0.5">{config.branding.shortName}.vdi</div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-700">Storage Devices</h3>
                <div className="flex gap-1">
                  <button className="text-[8px] bg-[#4a8cff] text-white px-2 py-1 rounded hover:brightness-110 transition-all">+</button>
                  <button className="text-[8px] bg-gray-200 text-gray-500 px-2 py-1 rounded">−</button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-[9px]">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[8px]">
                      <th className="text-left px-3 py-1.5 font-medium">Controller</th>
                      <th className="text-left px-3 py-1.5 font-medium">Attribute</th>
                      <th className="text-left px-3 py-1.5 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-3 py-1.5 text-gray-700 font-medium">IDE</td>
                      <td className="px-3 py-1.5 text-gray-500">Optical Drive</td>
                      <td className="px-3 py-1.5">
                        {phase === "attached" ? (
                          <span className="text-green-700 font-medium">{config.iso.filename}</span>
                        ) : (
                          <button onClick={handleBrowseClick}
                            className="text-[#4a8cff] hover:underline font-medium">Choose a disk file…</button>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 text-gray-700 font-medium">SATA</td>
                      <td className="px-3 py-1.5 text-gray-500">Hard Disk</td>
                      <td className="px-3 py-1.5 text-gray-700">{config.branding.shortName}.vdi</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {phase === "attached" && (
                <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="text-green-600 text-[10px]">✓</span>
                  <span className="text-[9px] text-green-700 font-medium">ISO image mounted successfully</span>
                </motion.div>
              )}

              <div className="mt-4 border-t border-gray-200 pt-3">
                <div className="text-[9px] font-semibold text-gray-600 mb-1.5">Attributes</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] text-gray-500 mb-0.5">Type:</label>
                    <select className="w-full border border-gray-300 rounded px-2 py-1 text-[9px] text-gray-700 bg-white outline-none">
                      <option>IDE Primary Master</option>
                      <option>IDE Primary Slave</option>
                      <option>IDE Secondary Master</option>
                      <option>IDE Secondary Slave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] text-gray-500 mb-0.5">Live CD/DVD:</label>
                    <input type="checkbox" defaultChecked className="accent-[#4a8cff] mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {phase === "browsing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl p-5 max-w-sm w-full">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">📂</span>
                  <h3 className="text-sm font-semibold text-gray-800">Select optical disk image</h3>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span>💿</span>
                    <span className="font-medium">{config.iso.filename}</span>
                    <span className="text-gray-400 ml-auto">{config.iso.size}</span>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5 ml-6">/home/user/Downloads</div>
                </div>
                <motion.div className="h-1 rounded-full bg-blue-100 overflow-hidden mb-3">
                  <motion.div className="h-full bg-[#4a8cff]" initial={{ width: "0%" }}
                    animate={{ width: "100%" }} transition={{ duration: 1.2, ease: "easeInOut" }} />
                </motion.div>
                <div className="flex justify-end">
                  <button disabled
                    className="text-xs font-semibold bg-gray-200 text-gray-400 px-4 py-1.5 rounded-lg">
                    Attaching…
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[#2a2a2a] border-t border-gray-600/40 px-2 py-0.5 flex items-center gap-2 rounded-b-2xl">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
            <span className="text-[7px] text-gray-400">Settings</span>
          </div>
          <div className="flex-1" />
          <div className="flex gap-2">
            <button onClick={() => { playClick(); onComplete(); }}
              className="text-[7px] text-gray-400 hover:text-white transition-colors">Cancel</button>
            {phase === "attached" && (
              <button onClick={() => { playClick(); onComplete(); }}
                className="text-[7px] text-[#4a8cff] font-medium hover:text-[#6aa6ff] transition-colors">OK</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
