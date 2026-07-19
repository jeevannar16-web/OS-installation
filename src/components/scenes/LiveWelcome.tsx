import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useState } from "react";

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
  const [phase, setPhase] = useState<"idle" | "install" | "try">("idle");

  const hotspots = phase === "idle" ? [
    { id: "install", x: 5, y: 12, w: 22, h: 14, onClick: () => { playClick(); setPhase("install"); setTimeout(() => onInstall(), 400); } },
    { id: "try", x: 5, y: 28, w: 22, h: 14, onClick: () => { playClick(); setPhase("try"); setTimeout(() => onTry(), 400); } },
  ] : [];

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <AnimatePresence>
          <motion.img key={bgImg} src={bgImg} alt={config.branding.name}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        </AnimatePresence>
        {hotspots.map(h => (
          <div key={h.id} onClick={h.onClick}
            className="absolute z-10"
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%`, cursor: "pointer" }} />
        ))}
        {phase !== "idle" && (
          <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="text-white/80 text-sm font-medium">
                {phase === "install" ? "Starting installer…" : "Exploring desktop…"}
              </motion.div>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-white/60"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
