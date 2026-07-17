import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

export default function LiveWelcome({
  config,
  onTry,
  onInstall,
}: {
  config: OSConfig;
  onTry: () => void;
  onInstall: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();

  useEffect(() => {
    registerAdvance(() => onInstall());
  }, [registerAdvance, onInstall]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#12121a]">
      {/* Real Ubuntu Try or Install screenshot as full background */}
      <img
        src="/images/ubuntu/01-try-or-install.png"
        alt="Ubuntu Try or Install screen"
        className="w-full h-auto object-contain"
        draggable={false}
      />

      {/* Transparent clickable overlay on the two buttons */}
      <div className="absolute inset-0 flex items-end justify-center pb-[18%] sm:pb-[16%] md:pb-[14%]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex gap-4 sm:gap-6"
        >
          {/* Try Ubuntu button — overlay on left side of the real UI */}
          <button
            onClick={() => {
              playClick();
              onTry();
            }}
            className="group relative rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm px-5 py-3 sm:px-7 sm:py-4 text-left transition-all hover:bg-black/60 hover:border-white/30 hover:scale-[1.03]"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
              <div className="text-sm sm:text-base font-bold text-white">Try Ubuntu</div>
            </div>
            <div className="mt-1 text-xs text-white/50 group-hover:text-white/70 transition-colors">
              Use without installing
            </div>
          </button>

          {/* Install Ubuntu button — overlay on right side of the real UI */}
          <button
            onClick={() => {
              playClick();
              onInstall();
            }}
            className="group relative rounded-xl px-5 py-3 sm:px-7 sm:py-4 text-left text-white transition-all hover:scale-[1.03]"
            style={{ background: config.branding.accent }}
          >
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
              <div className="text-sm sm:text-base font-bold">Install Ubuntu</div>
            </div>
            <div className="mt-1 text-xs text-white/70 group-hover:text-white/90 transition-colors">
              Install alongside your current OS
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
