import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

const VM_SCREENSHOTS: Record<string, string> = {
  ubuntu: "/images/vm/ubuntu/installer.jpg",
  windows: "/images/vm/windows/installer.jpg",
  fedora: "/images/vm/fedora/installer.jpg",
  mint: "/images/vm/mint/installer.jpg",
  zorin: "/images/vm/zorin/installer.jpg",
  debian: "/images/vm/debian/installer.jpg",
};

const MENU_ITEMS = [
  { label: "File", items: ["Close VM", "Take Snapshot", "Exit"] },
  { label: "Machine", items: ["Pause", "Reset", "ACPI Shutdown", "Insert Guest Additions CD"] },
  { label: "View", items: ["Full-screen Mode", "Scale Mode", "Auto-resize Guest Display"] },
  { label: "Devices", items: ["Optical Drives", "USB", "Shared Folders", "Network"] },
  { label: "Help", items: ["About VirtualBox"] },
];

function OsFallback({ osId }: { osId: string }) {
  switch (osId) {
    case "windows":
      return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-[#1a2b6b] to-[#0d1b4a]">
          <div className="text-5xl mb-4 text-white/90 font-bold tracking-tight" style={{ fontFamily: "'Segoe UI',sans-serif" }}>Windows</div>
          <div className="text-[10px] text-blue-200/60 mb-8 tracking-widest uppercase">Setup</div>
          <div className="bg-white/10 backdrop-blur rounded-lg px-8 py-4 border border-white/20 text-center">
            <div className="text-blue-200 text-xs mb-2">Language to install</div>
            <div className="bg-white/20 rounded px-4 py-1 text-white text-[11px] mb-3">English (United States)</div>
            <div className="flex gap-2 justify-center">
              <span className="bg-blue-600 text-white text-[10px] px-6 py-1.5 rounded">Install now</span>
              <span className="bg-white/10 text-blue-200 text-[10px] px-4 py-1.5 rounded border border-white/20">Repair your computer</span>
            </div>
          </div>
          <div className="mt-6 text-[8px] text-blue-300/40">© Microsoft Corporation. All rights reserved.</div>
        </div>
      );
    case "debian":
      return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-[#d63333] to-[#8a1a1a]">
          <div className="text-white font-bold text-3xl mb-1 tracking-tight">Debian</div>
          <div className="text-rose-200/60 text-[9px] mb-4">GNU/Linux 12 · installer</div>
          <div className="bg-white/10 backdrop-blur rounded px-6 py-3 border border-white/20 text-center max-w-[240px]">
            <div className="text-rose-100 text-[10px] mb-2">Select a language</div>
            <div className="bg-white/20 rounded px-3 py-0.5 text-white text-[10px] mb-2">English</div>
            <div className="bg-rose-600 text-white text-[10px] px-5 py-1 rounded inline-block">Continue</div>
          </div>
          <div className="mt-4 flex gap-1">
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <div className="w-2 h-2 rounded-full bg-white/60" />
            <div className="w-2 h-2 rounded-full bg-white/30" />
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function VmBoot({
  config,
  speed,
  onComplete,
  vtEnabled: _vtEnabled,
  onEnableVT: _onEnableVT,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
  vtEnabled?: boolean;
  onEnableVT?: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [poweredOn, setPoweredOn] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const screenshot = VM_SCREENSHOTS[config.id] || VM_SCREENSHOTS.ubuntu;

  useEffect(() => {
    const t = setTimeout(() => setPoweredOn(true), speed === "fast" ? 300 : 1000);
    return () => clearTimeout(t);
  }, [speed]);

  useEffect(() => {
    if (poweredOn) {
      registerAdvance(() => { playClick(); onComplete(); });
    }
  }, [poweredOn, registerAdvance, onComplete]);

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl">
      <div className="overflow-hidden rounded-xl border border-gray-600/40 shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-3 py-1.5 select-none">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <div className="flex items-center gap-2 mx-auto text-[9px] sm:text-[10px] text-gray-600 font-medium">
            <span className="text-[11px] text-[#4a8cff]">⬡</span>
            <span>Oracle VM VirtualBox</span>
            <span className="hidden sm:inline">—</span>
            <span className="hidden sm:inline">{config.branding.shortName} VM [Running]</span>
          </div>
          <div className="flex gap-1">
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
          </div>
        </div>

        {/* Menu bar */}
        <div className="flex items-center bg-[#f5f5f5] border-b border-gray-300/60 select-none">
          {MENU_ITEMS.map(m => (
            <div key={m.label} className="relative"
              onMouseEnter={() => setMenuOpen(m.label)}
              onMouseLeave={() => setMenuOpen(null)}>
              <span className={`inline-block text-[7px] sm:text-[8px] px-2 py-[1px] cursor-default ${
                menuOpen === m.label ? "bg-gray-200 text-gray-700" : "text-gray-600 hover:bg-gray-200"
              }`}>{m.label}</span>
              {menuOpen === m.label && (
                <div className="absolute top-full left-0 z-30 bg-white border border-gray-200 rounded shadow-lg py-1 min-w-[160px]">
                  {m.items.map((item, i) => (
                    <div key={i} className="text-[9px] px-3 py-1.5 text-gray-600 hover:bg-gray-100 cursor-default whitespace-nowrap">{item}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="flex-1" />
          <span className="text-[6px] sm:text-[7px] text-gray-400 px-2">{config.branding.shortName} VM</span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 bg-[#fafafa] px-2 py-1 border-b border-gray-200/60 select-none">
          {[["▶", "Start"], ["⏸", "Pause"], ["⏹", "Reset"], ["✕", "Close"]].map(([icon, label]) => (
            <button key={label}
              className="flex items-center gap-0.5 text-[8px] sm:text-[9px] text-gray-500 px-1.5 sm:px-2 py-0.5 rounded hover:bg-gray-200 transition-all">
              <span className="text-[9px] sm:text-[10px]">{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[6px] sm:text-[7px] text-gray-400 font-mono">Running</span>
        </div>

        {/* VM Display */}
        <div className="relative h-[340px] sm:h-[400px] lg:h-[500px] xl:h-[580px] flex items-center justify-center overflow-hidden bg-black select-none">
          <AnimatePresence mode="wait">
            {!poweredOn && (
              <motion.div key="off" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl sm:text-5xl mb-3 text-gray-600">⬡</motion.div>
                <div className="text-xs sm:text-sm text-white/30">Click ▶ Start to power on</div>
              </motion.div>
            )}

            {poweredOn && (
              <motion.div key="screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black cursor-pointer"
                onClick={() => { playClick(); onComplete(); }}>
                {!imageError && (
                  <img src={screenshot} alt={`${config.branding.name} VM`}
                    className="w-full h-full object-contain"
                    onError={() => setImageError(true)} />
                )}
                {imageError && (
                  <div className="w-full h-full">
                    <OsFallback osId={config.id} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 bg-[#2a2a2a] border-t border-gray-600/40 px-3 py-1 select-none">
          <div className={`h-1.5 w-1.5 rounded-full ${poweredOn ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
          <span className="text-[6px] sm:text-[7px] text-gray-400 font-mono">
            {poweredOn ? "Running" : "Powered Off"}
          </span>
          <span className="text-[5px] sm:text-[6px] text-gray-600">|</span>
          <span className="text-[5px] sm:text-[6px] text-gray-500 font-mono">
            {config.vmConfig.defaultMemoryMB} MB | {config.vmConfig.defaultDiskGB} GB | 1 CPU
          </span>
          <div className="flex-1" />
          <span className="text-[5px] sm:text-[6px] text-gray-500 font-mono">
            {poweredOn ? "Display: 1920x1080" : ""}
          </span>
        </div>
      </div>

      {poweredOn && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-white/50">
          Click the VM screen to begin installation.
        </motion.div>
      )}
    </div>
  );
}
