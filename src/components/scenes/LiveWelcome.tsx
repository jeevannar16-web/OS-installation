import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [showPopup, setShowPopup] = useState(false);
  const bgImg = OS_LIVE_IMG[config.id] || OS_LIVE_IMG.ubuntu;
  const osName = config.branding.name;

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 bg-black cursor-pointer"
        onClick={() => { playClick(); setShowPopup(true); }}>
        <img src={bgImg} alt={`${osName} Try or Install`}
          className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/50 bg-black/40 px-3 py-1 rounded-full pointer-events-none">
          Click anywhere to begin
        </div>

        <AnimatePresence>
          {showPopup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => setShowPopup(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl border border-white/15 bg-[#1e1e1e] p-5 shadow-2xl w-72 text-center">
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: config.branding.accent }}>
                  {osName}
                </div>
                <p className="text-xs text-white/50 mb-4">Try {osName} without installing, or start the installation.</p>
                <div className="space-y-2">
                  <button onClick={() => { playClick(); setShowPopup(false); onInstall(); }}
                    className="w-full rounded-lg py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02]"
                    style={{ background: config.branding.accent }}>
                    Install {osName}
                  </button>
                  <button onClick={() => { playClick(); setShowPopup(false); onTry(); }}
                    className="w-full rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-all">
                    Try {osName}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
