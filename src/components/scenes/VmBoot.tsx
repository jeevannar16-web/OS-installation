import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playError } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";
import OsIcon from "../shared/OsIcon";

type Phase = "off" | "bios" | "vt_error" | "grub" | "windows_booting";

const BIOS_LINES = [
  "VirtualBox BIOS Version 7.0",
  "Copyright (C) 2004-2024 Oracle Corporation",
  "",
  "Intel(R) Core(TM) i7 CPU @ 3.40GHz",
  "Memory Test: 2048 MB OK",
  "",
  "Detecting Primary Master... {CD-ROM}",
  "  VirtualBox CD-ROM",
  "Detecting Primary Master... VBOX HARDDISK",
  "  {25 GB}",
  "",
  "Press F12 to select boot device.",
];

function getGrubEntries(config: OSConfig) {
  const osName = config.branding.name;
  const kernel = "6.8.0-41-generic";
  return [
    { label: `Try or Install ${osName}`, sub: `Kernel ${kernel}` },
    { label: `Advanced options for ${osName}`, sub: "" },
    { label: "Check the disk", sub: "(check installation media for defects)" },
    { label: "Test memory (memtest86+)", sub: "" },
    { label: "Boot from local disk", sub: "" },
  ];
}

export default function VmBoot({
  config,
  speed,
  onComplete,
  vtEnabled,
  onEnableVT,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
  vtEnabled: boolean;
  onEnableVT?: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [phase, setPhase] = useState<Phase>("off");
  const [biosLine, setBiosLine] = useState(0);
  const [grubSelected, setGrubSelected] = useState(0);
  const [countdown, setCountdown] = useState(10);
  const entries = getGrubEntries(config);

  useEffect(() => {
    const timer = setTimeout(() => setPhase("bios"), speed === "fast" ? 200 : 600);
    return () => clearTimeout(timer);
  }, [speed]);

  useEffect(() => {
    if (phase !== "bios") return;
    const delay = speed === "fast" ? 40 : 150;
    if (biosLine < BIOS_LINES.length) {
      const t = setTimeout(() => setBiosLine(biosLine + 1), delay);
      return () => clearTimeout(t);
    } else {
      if (!vtEnabled) {
        const t = setTimeout(() => { playError(); setPhase("vt_error"); }, 500);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("grub"), speed === "fast" ? 300 : 800);
      return () => clearTimeout(t);
    }
  }, [phase, biosLine, speed, vtEnabled]);

  useEffect(() => {
    if (phase === "grub") {
      registerAdvance(() => {
        playClick();
        onComplete();
      });
    }
  }, [phase, registerAdvance, onComplete]);

  useEffect(() => {
    if (phase !== "grub") return;
    if (countdown <= 0) { onComplete(); return; }
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [phase, countdown, onComplete]);

  useEffect(() => {
    if (phase !== "grub") return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setGrubSelected(i => Math.min(i + 1, entries.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setGrubSelected(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); onComplete(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, grubSelected, onComplete, entries.length]);

  useEffect(() => {
    if (phase === "windows_booting") {
      const t = setTimeout(() => onComplete(), 2000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl">
      {/* Oracle VM VirtualBox window */}
      <div className="overflow-hidden rounded-xl border border-gray-600/40 shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-3 py-1.5 select-none">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <div className="flex items-center gap-2 mx-auto text-[9px] sm:text-[10px] text-gray-600 font-medium">
            <span>Oracle VM VirtualBox</span>
            <span>—</span>
            <span>{config.branding.shortName} VM [Running]</span>
          </div>
          <div className="flex gap-1">
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
          </div>
        </div>

        {/* Menu bar */}
        <div className="flex items-center gap-2 bg-[#f5f5f5] px-2 py-[1px] border-b border-gray-300/60 text-[7px] sm:text-[8px] text-gray-600">
          {["File", "Machine", "View", "Devices", "Help"].map((m) => (
            <span key={m} className="hover:bg-gray-200 px-1 rounded cursor-default">{m}</span>
          ))}
          <div className="flex-1" />
          <span className="text-[6px] sm:text-[7px] text-gray-400">{config.branding.shortName} VM</span>
        </div>

        {/* VM Screen */}
        <div className="relative flex h-[400px] sm:h-[420px] lg:h-[520px] xl:h-[600px] items-center justify-center overflow-hidden bg-black">
          <AnimatePresence mode="wait">
            {phase === "off" && (
              <motion.div key="off" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <div className="mb-3"><OsIcon osId={config.id} accent={config.branding.accent} size={44} /></div>
                <div className="text-xs text-white/30">Click ▶ Start to power on</div>
              </motion.div>
            )}

            {phase === "bios" && (
              <motion.div key="bios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full h-full p-4 sm:p-6 font-mono text-[10px] sm:text-xs leading-relaxed overflow-y-auto">
                {BIOS_LINES.slice(0, biosLine).map((line, i) => (
                  <div key={i} className={line ? "text-emerald-300" : "h-3"}>{line}</div>
                ))}
                {biosLine < BIOS_LINES.length && (
                  <span className="inline-block h-3 w-2 animate-pulse bg-emerald-300" />
                )}
              </motion.div>
            )}

            {phase === "grub" && (
              <motion.div key="grub" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full h-full p-3 sm:p-6 font-mono text-[11px] sm:text-sm overflow-y-auto"
                style={{ background: "#0a0a0a" }}>
                <div className="border-b border-white/10 pb-2 sm:pb-3 mb-3 sm:mb-4">
                  <div className="text-white/60 text-[10px] sm:text-xs mb-1 sm:mb-2">GNU GRUB version 2.12</div>
                  <div className="text-white/40 text-[9px] sm:text-xs leading-relaxed hidden sm:block">
                    Use the ↑ and ↓ keys to select which entry is highlighted.
                    Press enter to boot the selected OS.
                  </div>
                </div>
                <div className="space-y-0.5 sm:space-y-1 mb-2 sm:mb-4">
                  {entries.map((entry, i) => (
                    <div key={i} onClick={() => { setGrubSelected(i); if (i === 0) onComplete(); }}
                      className={`rounded px-2 sm:px-3 py-1.5 sm:py-2 cursor-pointer transition-colors ${
                        i === grubSelected ? "bg-white/90 text-black" : "text-white/70 hover:bg-white/10"
                      }`}>
                      <div className="font-bold text-[11px] sm:text-sm">{entry.label}</div>
                      {entry.sub && (
                        <div className={`text-[9px] sm:text-xs mt-0.5 ${i === grubSelected ? "text-black/60" : "text-white/30"}`}>
                          {entry.sub}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-2 sm:pt-3 text-center">
                  <span className="text-white/40 text-[9px] sm:text-xs">
                    The highlighted entry will be executed automatically in{" "}
                    <span className="text-white/70 font-bold">{countdown}</span> seconds.
                  </span>
                </div>
              </motion.div>
            )}

            {phase === "windows_booting" && (
              <motion.div key="windows_booting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center space-y-4 sm:space-y-6">
                <div className="text-4xl sm:text-6xl">🪟</div>
                <div className="text-white/80 text-base sm:text-lg font-semibold">Windows 11</div>
                <div className="flex justify-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div key={i} className="h-1 w-1 rounded-full bg-white/60"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
                <div className="text-[10px] sm:text-xs text-white/30 font-mono">Loading Windows…</div>
              </motion.div>
            )}

            {phase === "vt_error" && (
              <motion.div key="vt_error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/60 p-3 sm:p-4">
                <div className="w-full max-w-md rounded-lg border border-red-500/30 bg-[#2b2b2e] p-4 sm:p-5 shadow-2xl space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 text-red-400 font-bold border-b border-white/10 pb-2 text-xs sm:text-sm">
                    <span>⚠️</span>
                    <span>VirtualBox - Critical Error</span>
                  </div>
                  <div className="space-y-2 text-[11px] sm:text-sm leading-relaxed text-white/80">
                    <p className="font-semibold text-white">VT-x/AMD-V hardware acceleration is not available on your system.</p>
                    <p className="text-white/60">Your guest OS will fail to boot because Virtualization is disabled.</p>
                    <p className="text-accent-soft text-[10px] sm:text-[11px] font-mono leading-tight bg-black/30 p-2 rounded">
                      Fix: Enter BIOS/UEFI Setup → CPU settings → Enable "Intel Virtualization Technology" (VT-x) or "SVM Mode".
                    </p>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={() => { playClick(); setPhase("off"); setBiosLine(0); setTimeout(() => setPhase("bios"), 200); }}
                      className="rounded bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium text-white/70 transition-colors">Cancel</button>
                    <button onClick={() => { playClick(); onEnableVT?.(); setPhase("off"); setBiosLine(0); setTimeout(() => setPhase("bios"), 200); }}
                      className="rounded bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white shadow-lg transition-colors">
                      ✓ Enable VT-x &amp; Retry</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status bar */}
          <div className="absolute bottom-0 inset-x-0 h-3 sm:h-3.5 bg-[#2a2a2a] border-t border-gray-600/40 flex items-center px-2 select-none">
            <div className="flex items-center gap-1">
              <div className={`h-1.5 w-1.5 rounded-full ${
                phase === "off" ? "bg-gray-500" :
                phase === "vt_error" ? "bg-red-400" :
                "bg-emerald-400 animate-pulse"
              }`} />
              <span className="text-[5px] sm:text-[6px] text-gray-400 font-mono">
                {phase === "off" ? "Powered Off" :
                 phase === "vt_error" ? "Error" :
                 phase === "grub" ? "GRUB Menu" :
                 phase === "windows_booting" ? "Booting..." :
                 "Booting..."}
              </span>
            </div>
            <div className="flex-1" />
            <span className="text-[5px] sm:text-[6px] text-gray-500 font-mono">1 CPU | {config.vmConfig.defaultMemoryMB} MB | {config.vmConfig.defaultDiskGB} GB</span>
          </div>
        </div>
      </div>

      {phase === "grub" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 sm:mt-4 text-center text-[11px] sm:text-sm text-white/50">
          Select <span className="text-accent">Try or Install {config.branding.name}</span> and press Enter to begin.
        </motion.div>
      )}
    </div>
  );
}
