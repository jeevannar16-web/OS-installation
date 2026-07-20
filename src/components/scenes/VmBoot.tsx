import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

const VM_SCREENSHOTS: Record<string, string> = {
  ubuntu: "/images/vm/ubuntu/installer.png",
  windows: "/images/vm/windows/install-now.jpg",
  fedora: "/images/vm/fedora/installer.jpg",
  mint: "/images/vm/mint/installer.png",
  zorin: "/images/vm/zorin/installer.webp",
  debian: "/images/vm/debian/grub.jpg",
};

export default function VmBoot({
  config,
  speed: _speed,
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
  const [imgErr, setImgErr] = useState(false);
  const screenshot = VM_SCREENSHOTS[config.id] || VM_SCREENSHOTS.ubuntu;

  useEffect(() => {
    registerAdvance(() => { playClick(); onComplete(); });
  }, [registerAdvance, onComplete]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto select-none cursor-pointer"
      onClick={() => { playClick(); onComplete(); }}>
      <div className="overflow-hidden rounded-lg border border-gray-600/30 shadow-2xl bg-black">
        <div className="bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-2 py-1 text-[9px] text-gray-600 flex items-center border-b border-gray-300/50">
          <span className="font-semibold">{config.branding.shortName} VM</span>
          <span className="mx-2">—</span>
          <span className="text-gray-400">Oracle VM VirtualBox</span>
          <div className="flex-1" />
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        </div>
        <div className="relative bg-black flex items-center justify-center"
          style={{ height: "clamp(320px, 50vh, 580px)" }}>
          {!imgErr ? (
            <img src={screenshot} alt={config.branding.name}
              className="w-full h-full object-contain"
              onError={() => setImgErr(true)} />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-[#1a1a2e] to-[#0a0a1a]">
              <div className="text-center text-white/40 text-sm">{config.branding.name} installer</div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 text-[10px] text-white/30 text-center">Click to begin installation</div>
    </motion.div>
  );
}
