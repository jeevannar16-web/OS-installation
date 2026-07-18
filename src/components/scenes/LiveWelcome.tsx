import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";

const OS_LIVE_IMG: Record<string, string> = {
  ubuntu: "/images/ubuntu/01-try-or-install.png",
  zorin: "/images/zorin/02-live-desktop.png",
  mint: "/images/mint/02-live-desktop.png",
  arch: "/images/arch/01-welcome-page.png",
  windows: "/images/win11-setup/01-setup-language.webp",
};

export default function LiveWelcome({ config, onTry, onInstall }: {
  config: OSConfig; onTry: () => void; onInstall: () => void;
}) {
  const bgImg = OS_LIVE_IMG[config.id] || OS_LIVE_IMG.ubuntu;
  const osName = config.branding.name;
  const accent = config.branding.accent;

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 bg-black">
        <img src={bgImg} alt={`${osName} Try or Install`}
          className="absolute inset-0 w-full h-full object-cover" draggable={false} />

        {/* Inline try/install card */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-xl border border-white/15 bg-[#1e1e1e]/95 backdrop-blur-sm shadow-2xl w-72 text-center overflow-hidden">
            <div className="p-5">
              <div className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: accent }}>
                {osName}
              </div>
              <p className="text-xs text-white/50 mb-4">Try {osName} without installing, or start the installation.</p>
              <div className="space-y-2">
                <button onClick={() => { playClick(); onInstall(); }}
                  className="w-full rounded-lg py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02]"
                  style={{ background: accent }}>
                  Install {osName}
                </button>
                <button onClick={() => { playClick(); onTry(); }}
                  className="w-full rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-all">
                  Try {osName}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
