import { useEffect } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

const OS_VM_IMG: Record<string, string> = {
  ubuntu: "/images/virtualbox/12-ubuntu-running.jpg",
  arch: "/images/virtualbox/12-ubuntu-running.jpg",
  windows: "/images/virtualbox/11-vbox-windows.jpg",
  zorin: "/images/virtualbox/12-ubuntu-running.jpg",
  mint: "/images/virtualbox/12-ubuntu-running.jpg",
};

export default function VmClose({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const { register: registerAdvance } = useSceneAdvance();

  useEffect(() => {
    registerAdvance(() => onComplete());
  }, [registerAdvance, onComplete]);

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black cursor-pointer" onClick={() => { playClick(); onComplete(); }}>
        <img src={OS_VM_IMG[config.id] || OS_VM_IMG.ubuntu} alt={`${config.branding.name} running in VirtualBox`}
          className="absolute inset-0 w-full h-full object-cover bg-[#2a2a2b]" />

        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
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
