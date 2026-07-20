import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

const OFFICIAL_CONSOLE = "/images/vbox/vm-vista-running.png";
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

  useEffect(() => {
    registerAdvance(() => { playClick(); onComplete(); });
  }, [registerAdvance, onComplete]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="w-full flex items-center justify-center cursor-pointer select-none"
      onClick={() => { playClick(); onComplete(); }}>
      {!imgErr ? (
        <img src={OFFICIAL_CONSOLE} alt="Oracle VM VirtualBox Console"
          className="w-full max-w-5xl rounded-lg shadow-2xl border border-gray-600/30"
          onError={() => setImgErr(true)} />
      ) : (
        <img src={VM_SCREENSHOTS[config.id] || VM_SCREENSHOTS.ubuntu}
          alt={config.branding.name}
          className="w-full max-w-5xl rounded-lg shadow-2xl border border-gray-600/30"
          style={{ maxHeight: "clamp(400px, 70vh, 700px)" }}
          onError={() => setImgErr(true)} />
      )}
    </motion.div>
  );
}
