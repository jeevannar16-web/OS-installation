import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

const VM_SCREENSHOTS: Record<string, string> = {
  ubuntu: "/images/vm/ubuntu/installer.jpg",
  windows: "/images/vm/windows/setup.jpg",
  fedora: "/images/vm/fedora/boot.jpg",
  mint: "/images/vm/mint/installer.jpg",
  zorin: "/images/vm/zorin/installer.jpg",
  debian: "/images/vm/debian/installer.jpg",
};

export default function VmBoot({
  config,
  speed,
  onComplete,
  vtEnabled: _vtEnabled,
  onEnableVT: _onEnableVT,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
  vtEnabled?: boolean;
  onEnableVT?: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [poweredOn, setPoweredOn] = useState(false);
  const screenshot = VM_SCREENSHOTS[config.id] || VM_SCREENSHOTS.ubuntu;

  useEffect(() => {
    const t = setTimeout(() => setPoweredOn(true), speed === "fast" ? 300 : 1000);
    return () => clearTimeout(t);
  }, [speed]);

  useEffect(() => {
    if (poweredOn) {
      registerAdvance(() => {
        playClick();
        onComplete();
      });
    }
  }, [poweredOn, registerAdvance, onComplete]);

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl">
      <div className="overflow-hidden rounded-xl border border-gray-600/40 shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-3 py-1.5 select-none">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <div className="flex items-center gap-2 mx-auto text-[9px] sm:text-[10px] text-gray-600 font-medium">
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
        <div className="flex items-center gap-2 bg-[#f5f5f5] px-2 py-[1px] border-b border-gray-300/60 text-[7px] sm:text-[8px] text-gray-600">
          {["File", "Machine", "View", "Devices", "Help"].map((m) => (
            <span key={m} className="hover:bg-gray-200 px-1 rounded cursor-default">{m}</span>
          ))}
          <div className="flex-1" />
          <span className="text-[6px] sm:text-[7px] text-gray-400">{config.branding.shortName} VM</span>
        </div>

        {/* VM Screen */}
        <div className="relative flex h-[360px] sm:h-[420px] lg:h-[520px] xl:h-[600px] items-center justify-center overflow-hidden bg-black select-none">
          <AnimatePresence mode="wait">
            {!poweredOn && (
              <motion.div key="off" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl sm:text-5xl mb-3">⬡</motion.div>
                <div className="text-xs sm:text-sm text-white/30">Click ▶ Start to power on</div>
              </motion.div>
            )}

            {poweredOn && (
              <motion.div key="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black">
                <img src={screenshot} alt={`${config.branding.name} VM`}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => { playClick(); onComplete(); }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status bar */}
          <div className="absolute bottom-0 inset-x-0 h-3 sm:h-3.5 bg-[#2a2a2a] border-t border-gray-600/40 flex items-center px-2 select-none">
            <div className="flex items-center gap-1">
              <div className={`h-1.5 w-1.5 rounded-full ${poweredOn ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
              <span className="text-[5px] sm:text-[6px] text-gray-400 font-mono">{poweredOn ? "Running" : "Powered Off"}</span>
            </div>
            <div className="flex-1" />
            <span className="text-[5px] sm:text-[6px] text-gray-500 font-mono">1 CPU | {config.vmConfig.defaultMemoryMB} MB | {config.vmConfig.defaultDiskGB} GB</span>
          </div>
        </div>
      </div>

      {poweredOn && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 sm:mt-4 text-center text-[11px] sm:text-sm text-white/50">
          Click the VM screen to begin installation.
        </motion.div>
      )}
    </div>
  );
}
