import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playSuccess } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";
import OsIcon from "../shared/OsIcon";

const OS_VM_IMG: Record<string, string> = {
  ubuntu: "/images/virtualbox/12-ubuntu-running.jpg",
  arch: "/images/virtualbox/12-arch-running.png",
  windows: "/images/virtualbox/11-vbox-windows.jpg",
  zorin: "/images/virtualbox/12-zorin-running.png",
  mint: "/images/virtualbox/12-mint-running.png",
};

export default function VmClose({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const { register: registerAdvance } = useSceneAdvance();
  const [phase, setPhase] = useState<"eject" | "done">("eject");
  const [ejecting, setEjecting] = useState(false);
  const [ejected, setEjected] = useState(false);

  const handleEject = () => {
    if (ejected) return;
    playClick();
    setEjecting(true);
    setTimeout(() => {
      setEjecting(false);
      setEjected(true);
      playSuccess();
    }, 1200);
  };

  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black cursor-pointer" onClick={() => { playClick(); onComplete(); }}>
          <img src={OS_VM_IMG[config.id] || OS_VM_IMG.ubuntu} alt={`${config.branding.name} running in VirtualBox`}
            className="absolute inset-0 w-full h-full object-cover bg-[#2a2a2b]" />

          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 0.95 }}
              className="text-center space-y-3 bg-black/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="text-3xl">🎉</div>
              <h2 className="text-lg font-bold text-white">Installation complete!</h2>
              <p className="text-xs text-white/50 max-w-xs mx-auto">
                {config.branding.name} is now installed and running inside VirtualBox.
              </p>
              <p className="text-[10px] text-white/30">
                Click anywhere to continue.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black"
        onClick={() => !ejecting && registerAdvance(() => onComplete())}>
        {/* VirtualBox VM Window */}
        <div className="absolute inset-3 flex flex-col overflow-hidden rounded-lg border border-gray-600/50 bg-[#1a1a2e] shadow-2xl">
          {/* Title bar */}
          <div className="flex items-center gap-2 bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-3 py-1.5 select-none">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
            </div>
            <div className="flex items-center gap-2 mx-auto text-[9px] text-gray-600 font-medium">
              <span>Oracle VM VirtualBox</span>
              <span>—</span>
              <span>{config.branding.shortName} VM [Running]</span>
            </div>
            <div className="flex gap-1">
              <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
              <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
              <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
            </div>
          </div>

          {/* Menu bar */}
          <div className="flex items-center gap-2 bg-[#f5f5f5] px-2 py-[1px] border-b border-gray-300/60 text-[7px] text-gray-600">
            {["File", "Machine", "View", "Devices", "Help"].map((m) => (
              <span key={m} className="hover:bg-gray-200 px-1 rounded cursor-default">{m}</span>
            ))}
            <div className="flex-1" />
            <span className="text-[6px] text-gray-400">{config.branding.shortName} VM</span>
          </div>

          {/* VM Screen */}
          <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#0d0d2b] via-[#1a1a3e] to-[#0a0a1a]">
            <AnimatePresence mode="wait">
              {!ejected && !ejecting && (
                <motion.div key="vm-desktop" exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  {/* Desktop wallpaper */}
                  <div className="absolute inset-0" style={{
                    background: `radial-gradient(circle at 30% 40%, ${config.branding.accent}25 0%, transparent 50%),
                                 radial-gradient(circle at 70% 60%, ${config.branding.accent}10 0%, transparent 40%),
                                 linear-gradient(135deg, ${config.branding.surface} 0%, #0a0a1a 100%)`
                  }} />
                  
                  <div className="relative z-10 text-center space-y-4">
                    <div><OsIcon osId={config.id} accent={config.branding.accent} size={36} /></div>
                    <div className="text-sm text-white/50">
                      {config.branding.name} is installed.
                    </div>
                    <div className="text-[10px] text-white/30 max-w-xs leading-relaxed">
                      The ISO is still attached to the virtual CD/DVD drive. Eject it before restarting the VM.
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-[10px] text-white/40 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                        💿 {config.iso.filename}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {ejecting && (
                <motion.div key="ejecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <motion.div
                      animate={{ y: [0, -20, -40], opacity: [1, 0.5, 0] }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="text-3xl">💿</motion.div>
                    <div className="text-xs text-white/50">Ejecting ISO from virtual CD/DVD drive…</div>
                    <div className="h-1 w-36 mx-auto overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="h-full rounded-full"
                        style={{ background: config.branding.accent }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {ejected && (
                <motion.div key="ejected" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                      className="text-3xl">✅</motion.div>
                    <div className="text-xs text-emerald-400 font-semibold">ISO ejected successfully</div>
                    <div className="text-[10px] text-white/40 max-w-xs mx-auto">
                      The installation media has been removed from the virtual CD/DVD drive. You can now restart the VM safely.
                    </div>
                    <button onClick={() => { playClick(); setPhase("done"); }}
                      className="mt-2 rounded-lg px-4 py-2 text-xs font-bold text-white transition-all hover:scale-[1.02]"
                      style={{ background: config.branding.accent }}>
                      Continue →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status bar */}
            <div className="absolute bottom-0 inset-x-0 h-3 bg-[#2a2a2a] border-t border-gray-600/40 flex items-center px-2">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[5px] text-gray-400 font-mono">Running</span>
              </div>
              <div className="flex-1" />
              <span className="text-[5px] text-gray-500 font-mono">1 CPU | {config.vmConfig.defaultMemoryMB} MB | {config.vmConfig.defaultDiskGB} GB</span>
            </div>
          </div>
        </div>

        {/* Eject overlay */}
        {!ejecting && !ejected && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
            <button onClick={(e) => { e.stopPropagation(); handleEject(); }}
              className="rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02]"
              style={{ background: config.branding.accent }}>
              💿 Eject ISO from Virtual CD/DVD Drive
            </button>
          </div>
        )}

        {!ejecting && !ejected && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 text-[9px] text-white/30 bg-black/40 px-2 py-1 rounded-full">
            Click the button to eject the installation media
          </div>
        )}
      </div>
    </div>
  );
}
