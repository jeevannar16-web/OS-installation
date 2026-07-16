import { useEffect } from "react";
import { motion } from "framer-motion";
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
  const name = config.branding.name;

  useEffect(() => {
    registerAdvance(() => onInstall());
  }, [registerAdvance, onInstall]);

  return (
    <div
      className="flex min-h-[400px] sm:h-[680px] lg:h-[75vh] items-center justify-center rounded-2xl border border-white/10"
      style={{
        background: `linear-gradient(135deg, ${config.branding.surface} 0%, #0a0a1a 100%)`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 px-6 text-center"
      >
        <div className="text-6xl lg:text-7xl xl:text-8xl">{config.branding.logo}</div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white/90">Welcome to {name}</h1>
        <p className="max-w-md text-sm lg:text-base text-white/50">
          You've successfully booted from USB. Choose what you'd like to do:
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <button
            onClick={() => {
              playClick();
              onTry();
            }}
            className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 lg:px-10 lg:py-5 text-left transition-all hover:bg-white/15 hover:scale-[1.02]"
          >
            <div className="text-sm lg:text-base font-bold text-white">Try {name}</div>
            <div className="mt-1 text-xs lg:text-sm text-white/50">
              Use {name} without installing to your computer
            </div>
          </button>
          <button
            onClick={() => {
              playClick();
              onInstall();
            }}
            className="rounded-xl px-8 py-4 lg:px-10 lg:py-5 text-left text-white transition-all hover:scale-[1.02]"
            style={{ background: config.branding.accent }}
          >
            <div className="text-sm lg:text-base font-bold">Install {name}</div>
            <div className="mt-1 text-xs lg:text-sm text-white/70">
              Install {name} alongside (or instead of) your current OS
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
