import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

const OS_LIVE_IMG: Record<string, string> = {
  ubuntu: "/images/ubuntu/01-try-or-install.png",
  zorin: "/images/zorin/02-live-desktop.png",
  mint: "/images/mint/02-live-desktop.png",
  arch: "/images/arch/08-live-login.png",
  windows: "/images/win11-setup/01-setup-language.webp",
};

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
  const osName = config.branding.name;
  const bgImg = OS_LIVE_IMG[config.id] || OS_LIVE_IMG.ubuntu;

  useEffect(() => {
    registerAdvance(() => onInstall());
  }, [registerAdvance, onInstall]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#12121a]">
      <img
        src={bgImg}
        alt={`${osName} Try or Install screen`}
        className="w-full h-80 object-cover"
        draggable={false}
      />

      <div className="absolute inset-0 flex items-end justify-center pb-[18%] sm:pb-[16%] md:pb-[14%]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex gap-4 sm:gap-6"
        >
          <button
            onClick={() => { playClick(); onTry(); }}
            className="group relative rounded-xl border border-white/20 bg-black/40 backdrop-blur-sm px-5 py-3 sm:px-7 sm:py-4 text-left transition-all hover:bg-black/60 hover:border-white/30 hover:scale-[1.03]"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
              <div className="text-sm sm:text-base font-bold text-white">Try {osName}</div>
            </div>
            <div className="mt-1 text-xs text-white/50 group-hover:text-white/70 transition-colors">
              Use without installing
            </div>
          </button>

          <button
            onClick={() => { playClick(); onInstall(); }}
            className="group relative rounded-xl px-5 py-3 sm:px-7 sm:py-4 text-left text-white transition-all hover:scale-[1.03]"
            style={{ background: config.branding.accent }}
          >
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
              <div className="text-sm sm:text-base font-bold">Install {osName}</div>
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
