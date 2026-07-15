import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";

type Phase = "off" | "bios" | "loading" | "menu";

const BIOS_LINES = [
  "VirtualBox BIOS Version 7.0",
  "Copyright (C) 2004-2024 Oracle Corporation",
  "",
  "Intel(R) Core(TM) i7 CPU @ 3.40GHz",
  "Memory Test: 2048 MB OK",
  "",
  `Detecting Primary Master... ${"{CD-ROM}"}`,
  `  VirtualBox CD-ROM`,
  "Detecting Primary Master... VBOX HARDDISK",
  `  ${"{25 GB}"}`,
  "",
  "Press F12 to select boot device.",
];

export default function VmBoot({
  config,
  speed,
  onComplete,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("off");
  const [biosLine, setBiosLine] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const bootOptions = [
    { label: `Install ${config.branding.name}`, icon: "💿" },
    { label: "Check disk for errors", icon: "🔍" },
    { label: "Boot from local disk", icon: "💾" },
    { label: "BIOS Setup (F2)", icon: "🔧" },
  ];

  // Auto-transition from OFF → BIOS on mount
  useEffect(() => {
    const timer = setTimeout(() => setPhase("bios"), speed === "fast" ? 200 : 600);
    return () => clearTimeout(timer);
  }, [speed]);

  // BIOS text scroll
  useEffect(() => {
    if (phase !== "bios") return;
    const delay = speed === "fast" ? 40 : 150;
    if (biosLine < BIOS_LINES.length) {
      const t = setTimeout(() => setBiosLine(biosLine + 1), delay);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setPhase("loading"), speed === "fast" ? 300 : 800);
      return () => clearTimeout(t);
    }
  }, [phase, biosLine, speed]);

  // Loading spinner → menu
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setTimeout(() => setPhase("menu"), speed === "fast" ? 500 : 1500);
    return () => clearTimeout(t);
  }, [phase, speed]);

  // Keyboard nav in menu
  useEffect(() => {
    if (phase !== "menu") return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, bootOptions.length - 1));
        playClick();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
        playClick();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIdx === 0) {
          playClick();
          onComplete();
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, selectedIdx, onComplete, bootOptions.length]);

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl">
      {/* VM Window */}
      <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-[#323234] px-3 py-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex items-center gap-2 mx-auto text-xs text-white/50">
            <span>VirtualBox</span>
            <span>—</span>
            <span>{config.branding.shortName} VM [Running]</span>
          </div>
        </div>

        {/* Screen */}
        <div
          className="relative flex h-[420px] lg:h-[520px] xl:h-[600px] items-center justify-center overflow-hidden"
          style={{
            background:
              phase === "off"
                ? "#000"
                : phase === "menu"
                  ? `linear-gradient(180deg, ${config.branding.surface} 0%, #0a0a1a 100%)`
                  : "#000",
          }}
        >
          <AnimatePresence mode="wait">
            {phase === "off" && (
              <motion.div
                key="off"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="text-5xl mb-3">{config.branding.logo}</div>
                <div className="text-xs text-white/30">Click ▶ Start to power on</div>
              </motion.div>
            )}

            {phase === "bios" && (
              <motion.div
                key="bios"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full p-6 font-mono text-xs leading-relaxed"
              >
                {BIOS_LINES.slice(0, biosLine).map((line, i) => (
                  <div key={i} className={line ? "text-emerald-300" : "h-3"}>
                    {line}
                  </div>
                ))}
                {biosLine < BIOS_LINES.length && (
                  <span className="inline-block h-3 w-2 animate-pulse bg-emerald-300" />
                )}
              </motion.div>
            )}

            {phase === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="inline-block text-4xl"
                >
                  💿
                </motion.div>
                <div className="mt-3 text-sm text-white/50">Loading boot menu…</div>
              </motion.div>
            )}

            {phase === "menu" && (
              <motion.div
                key="menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full px-8 py-6"
              >
                <div className="mb-4 text-center">
                  <div className="text-lg font-bold text-white/90">{config.branding.name} Boot Menu</div>
                  <div className="text-xs text-white/40">Use ↑↓ arrows and Enter to select</div>
                </div>
                <div className="space-y-1">
                  {bootOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedIdx(i);
                        if (i === 0) { playClick(); onComplete(); }
                      }}
                      onMouseEnter={() => setSelectedIdx(i)}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                        i === selectedIdx
                          ? "bg-white/15 text-white font-semibold ring-1 ring-white/20"
                          : "text-white/60 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span>{opt.label}</span>
                      {i === selectedIdx && (
                        <span className="ml-auto text-accent text-xs">▶ selected</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center text-xs lg:text-sm text-white/30">
                  ↑↓ Navigate &nbsp;│&nbsp; Enter Select &nbsp;│&nbsp; F12 Boot Menu
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {phase === "menu" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-sm text-white/50"
        >
          Select <span className="text-accent">Install {config.branding.name}</span> and press Enter to begin installation.
        </motion.div>
      )}
    </div>
  );
}
