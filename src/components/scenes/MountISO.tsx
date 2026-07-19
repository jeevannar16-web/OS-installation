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

          {/* Storage settings — pure HTML matching VirtualBox style */}
          <div className="flex-1 bg-[#f0f0f0] flex flex-col text-[10px]">
            {/* Storage Tree */}
            <div className="border-b border-gray-300/60 p-2">
              <div className="text-[9px] font-semibold text-gray-700 mb-1">Storage Tree</div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-gray-600">
                  <span>💾</span>
                  <span>Controller: SATA</span>
                </div>
                <div className="ml-4 flex items-center gap-1 text-gray-600">
                  <span className="text-[11px]">💿</span>
                  <span>{config.branding.shortName}.vdi</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <span>💾</span>
                  <span>Controller: IDE</span>
                </div>
                <div className={`ml-4 flex items-center gap-1 ${phase === "attached" ? "text-green-700" : "text-gray-600"}`}>
                  <span className="text-[11px]">💿</span>
                  <span>
                    {phase === "attached" ? config.iso.filename.slice(0, 22) + "…" : "[Optical Drive] Empty"}
                  </span>
                </div>
              </div>
            </div>

            {/* Properties */}
            <div className="flex-1 p-2">
              <div className="text-[9px] font-semibold text-gray-700 mb-2">Properties</div>

              {/* CD/DVD drive panel — VirtualBox style */}
              <div className="border border-[#7f9db9] bg-white p-2">
                {phase === "attached" ? (
                  <div>
                    <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                      <span>✓</span>
                      <span>Optical disk mounted</span>
                    </div>
                    <div className="text-gray-600 mb-2 font-mono text-[10px]">{config.iso.filename}</div>
                    <button onClick={() => { playClick(); setPhase("settings"); }}
                      className="border border-[#7f9db9] bg-[#e8e8e8] px-2 py-0.5 text-[10px] text-gray-700"
                      style={{ boxShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}>
                      Remove disk
                    </button>
                  </div>
                ) : phase === "browsing" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <motion.span animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="inline-block">💿</motion.span>
                      <span>Selecting optical disk...</span>
                    </div>
                    <motion.div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        initial={{ width: "0%" }} animate={{ width: "100%" }}
                        transition={{ duration: 1.4, ease: "easeInOut" }}
                        style={{ background: accent }} />
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-gray-600">
                      <span>💿</span>
                      <span className="text-gray-400 italic">(empty)</span>
                    </div>
                    <button onClick={handleClick}
                      className="border border-[#7f9db9] bg-[#e8e8e8] px-2 py-0.5 text-[10px] text-gray-700 active:border-[#0078d4]"
                      style={{ boxShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}>
                      Choose Virtual Optical Disk File...
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 text-[9px] text-gray-500 leading-relaxed">
                {phase === "attached"
                  ? "The ISO is attached. Close this window and start the VM."
                  : "Select an ISO file to mount as a virtual optical disk."}
              </div>
            </div>

            {/* Dialog buttons */}
            <div className="border-t border-gray-300/60 px-3 py-2 flex items-center justify-end gap-2">
              <button onClick={() => { if (phase === "attached") { playClick(); onComplete(); } }}
                disabled={phase !== "attached"}
                className={`px-3 py-1 text-[10px] border border-[#7f9db9] bg-[#e8e8e8] disabled:opacity-30 active:border-[#0078d4]`}
                style={{ boxShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}>
                OK
              </button>
              <button onClick={() => { playClick(); onComplete(); }}
                className="px-3 py-1 text-[10px] border border-[#7f9db9] bg-[#e8e8e8] text-gray-700 active:border-[#0078d4]"
                style={{ boxShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}>
                Cancel
              </button>
            </div>
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
    </div>
  );
}
