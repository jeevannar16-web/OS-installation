import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useState } from "react";
import OsIcon from "../shared/OsIcon";

export default function LiveWelcome({ config, onTry, onInstall }: {
  config: OSConfig; onTry: () => void; onInstall: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "transition">("idle");
  const [transitionTo, setTransitionTo] = useState<"try" | "install" | null>(null);
  const isZorinLike = config.id === "zorin" || config.id === "mint";
  const surface = config.branding.surface;
  const accent = config.branding.accent;
  const name = config.branding.name;
  function handleAction(action: "try" | "install") {
    if (phase !== "idle") return;
    playClick();
    setTransitionTo(action);
    setPhase("transition");
    setTimeout(() => {
      if (action === "try") onTry();
      else onInstall();
    }, 600);
  }

  if (phase === "transition") {
    return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
      <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10"
        style={{ background: `linear-gradient(135deg, ${surface}, #000)` }}>
          <div className="flex flex-col items-center gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><OsIcon osId={config.id} accent={accent} size={40} /></motion.div>
            <div className="text-white/60 text-xs font-medium">
              {transitionTo === "install" ? `Starting ${name} installer…` : "Exploring desktop…"}
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-white/40"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${surface} 0%, #000 100%)` }}>
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `radial-gradient(circle at 25% 50%, ${accent} 0%, transparent 50%)` }} />
        <div className="relative text-center space-y-5 px-6 max-w-sm">
          <div className="flex justify-center gap-3 items-center">
            <OsIcon osId={config.id} accent={accent} size={36} />
            <div className="text-left">
              <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: accent }}>{name}</div>
              <div className="text-[9px] text-white/30">Live Session</div>
            </div>
          </div>

          <h1 className="text-xl font-bold text-white">Welcome to {name}</h1>
          <p className="text-xs text-white/50 leading-relaxed">
            {isZorinLike
              ? "Try the desktop without installing, or install it on your computer."
              : "Try before installing, or start the installation process."}
          </p>

          <div className="space-y-2.5 pt-2">
            <button onClick={() => handleAction("install")}
              className="w-full rounded-lg py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all"
              style={{ background: accent }}>
              Install {name}
            </button>
            <button onClick={() => handleAction("try")}
              className="w-full rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-all">
              Try {name}
            </button>
          </div>

          <div className="absolute top-3 right-3">
            <button className="text-white/30 hover:text-white/60 text-[9px] px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-all">
              Accessibility
            </button>
          </div>

          <div className="text-[8px] text-white/20 pt-1">
            {isZorinLike ? "Version 17.2" : "Version 24.04 LTS"}
          </div>
        </div>
      </div>
    </div>
  );
}
