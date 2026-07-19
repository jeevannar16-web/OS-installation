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
  const accent = config.branding.accent;

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <img src={bgImg} alt={config.branding.name}
          className="absolute inset-0 w-full h-full object-cover" draggable={false} />

        {/* Buttons on the desktop — no labels, no text, just the actions */}
        <div className="absolute bottom-4 left-4 right-4 z-10 max-w-xs mx-auto">
          <div className="space-y-2">
            <button onClick={() => { playClick(); onInstall(); }}
              className="w-full rounded-lg py-2.5 text-sm font-bold text-white shadow-lg"
              style={{ background: accent }}>
              Install {config.branding.shortName}
            </button>
            <button onClick={() => { playClick(); onTry(); }}
              className="w-full rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-all">
              Try {config.branding.shortName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
