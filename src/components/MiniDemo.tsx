import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DemoPhase = "search" | "download" | "drag" | "boot";

const PHASE_DURATIONS: Record<DemoPhase, number> = {
  search: 3000,
  download: 2500,
  drag: 2500,
  boot: 2000,
};

const PHASE_ORDER: DemoPhase[] = ["search", "download", "drag", "boot"];

function SearchPhase() {
  const [typed, setTyped] = useState("");
  const fullText = "download ubuntu";

  useEffect(() => {
    setTyped("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTyped(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
        <span className="text-emerald-400 text-xs">🔒</span>
        <span className="text-xs text-white/30">search.example.com</span>
        <span className="text-xs text-white/70 font-mono">{typed}<span className="animate-pulse text-accent">|</span></span>
      </div>
      <div className="space-y-1.5">
        <div className="rounded bg-white/5 px-2 py-1">
          <div className="text-[9px] text-white/30">ubuntu.com/download/desktop</div>
          <div className="text-[10px] text-accent font-medium">Download Ubuntu Desktop</div>
        </div>
        <div className="rounded bg-white/[0.02] px-2 py-1 opacity-40">
          <div className="text-[9px] text-white/20">fosshub.com/ubuntu</div>
          <div className="text-[10px] text-white/50">Ubuntu download (64-bit)</div>
        </div>
      </div>
    </div>
  );
}

function DownloadPhase() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    setPct(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / 2200) * 100);
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-white/50 text-center">Downloading ubuntu-24.04.1-desktop-amd64.iso</div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-accent"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>
      <div className="flex justify-between text-[9px] text-white/30">
        <span>{Math.floor(pct)}%</span>
        <span>5.9 GB</span>
      </div>
    </div>
  );
}

function DragPhase() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="flex items-center justify-center gap-6 py-2">
      <motion.div
        animate={
          step >= 1
            ? { x: 60, y: -10, scale: 0.9, rotate: -3 }
            : { y: [0, -3, 0] }
        }
        transition={step >= 1 ? { duration: 0.8, ease: "easeInOut" } : { repeat: Infinity, duration: 1.5 }}
        className="text-2xl"
      >
        💿
      </motion.div>
      <div className="text-white/15 text-sm">→</div>
      <motion.div
        animate={step >= 2 ? { scale: 1.1, borderColor: "rgba(124,92,255,0.6)" } : { scale: 1 }}
        className="flex h-12 w-16 items-center justify-center rounded-lg border-2 border-dashed border-white/20 text-sm"
      >
        🔌
      </motion.div>
    </div>
  );
}

function BootPhase() {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    setSelected(0);
    const t1 = setTimeout(() => setSelected(1), 500);
    const t2 = setTimeout(() => setSelected(0), 1200);
    const t3 = setTimeout(() => setSelected(1), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const entries = [
    { label: "UEFI: Generic Flash Disk 8.0", color: selected === 1 ? "bg-white/15 text-white" : "text-white/40" },
    { label: "Windows Boot Manager", color: selected === 0 ? "bg-white/15 text-white" : "text-white/40" },
    { label: "Network Boot: Realtek PXE", color: "text-white/30" },
  ];

  return (
    <div className="space-y-0.5">
      <div className="text-[10px] text-white/50 font-mono mb-1">BOOT MENU</div>
      {entries.map((e, i) => (
        <div
          key={i}
          className={`rounded px-2 py-1 text-[10px] font-mono transition-colors duration-200 ${e.color}`}
        >
          {selected === i && <span className="mr-1 text-white/30">▶</span>}
          {e.label}
        </div>
      ))}
    </div>
  );
}

const PHASES: { key: DemoPhase; label: string; Component: React.FC }[] = [
  { key: "search", label: "Search for your ISO", Component: SearchPhase },
  { key: "download", label: "Download the image", Component: DownloadPhase },
  { key: "drag", label: "Flash to USB", Component: DragPhase },
  { key: "boot", label: "Boot from USB", Component: BootPhase },
];

export default function MiniDemo() {
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    const phase = PHASE_ORDER[phaseIdx];
    const timeout = setTimeout(() => {
      setPhaseIdx((p) => (p + 1) % PHASE_ORDER.length);
    }, PHASE_DURATIONS[phase]);
    return () => clearTimeout(timeout);
  }, [phaseIdx]);

  const current = PHASES[phaseIdx];

  return (
    <div className="w-full max-w-sm">
      <div className="relative overflow-hidden rounded-xl bg-[#0e0e18] ring-1 ring-white/10 shadow-2xl">
        {/* Ambient glow */}
        <div className="absolute -inset-4 bg-accent/5 blur-2xl pointer-events-none" />

        {/* Tab strip */}
        <div className="relative flex items-center gap-1.5 bg-[#1a1a28] px-3 pt-2">
          <div className="flex items-center gap-1.5 rounded-t-md bg-[#252536] px-3 py-1.5">
            <span className="text-[10px]">🐧</span>
            <span className="text-[10px] text-white/60 max-w-[100px] truncate">ubuntu.com</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative h-[200px] overflow-hidden bg-[#0e0e18] p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <current.Component />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Phase indicator */}
        <div className="relative flex items-center gap-1.5 bg-[#1a1a28] px-3 py-2">
          {PHASES.map((p, i) => (
            <div key={p.key} className="flex items-center gap-1.5">
              <div
                className={`h-1 w-6 rounded-full transition-colors duration-300 ${
                  i === phaseIdx ? "bg-accent" : i < phaseIdx ? "bg-white/20" : "bg-white/5"
                }`}
              />
            </div>
          ))}
          <span className="ml-auto text-[9px] text-white/30">{current.label}</span>
        </div>
      </div>
    </div>
  );
}
