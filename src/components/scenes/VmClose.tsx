import { useEffect } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { useSceneAdvance } from "../shared/SceneAdvance";

export default function VmClose({
  config,
  onComplete,
}: {
  config: OSConfig;
  onComplete: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();

  useEffect(() => {
    registerAdvance(() => onComplete());
  }, [registerAdvance, onComplete]);

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black">
        {/* Real Ubuntu running in VirtualBox screenshot */}
        <img src="/images/virtualbox/12-ubuntu-running.jpg" alt={`${config.branding.name} running in VirtualBox`}
          className="absolute inset-0 w-full h-full object-cover bg-[#2a2a2b]" />

        {/* Success overlay */}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-3 bg-black/60 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-3xl">🎉</div>
            <h2 className="text-lg font-bold text-white">Installation complete!</h2>
            <p className="text-xs text-white/50 max-w-xs mx-auto">
              {config.branding.name} is now installed and running inside VirtualBox.
            </p>
            <p className="text-[10px] text-white/30">
              Close the VM window or click <strong className="text-white/50">Next →</strong> to continue.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between border-t border-white/10 bg-[#1a1a24] px-4 py-2.5 rounded-b-2xl shrink-0">
        <div className="text-xs text-white/30">✓ {config.branding.name} installed successfully in VirtualBox</div>
        <button onClick={onComplete}
          className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/80 transition-colors">
          Close VM →
        </button>
      </div>
    </div>
  );
}
