import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick, playKeyClick, playSuccess } from "../shared/sounds";
import type { OSConfig } from "../../data/types";

type Step = "overview" | "name" | "memory" | "disk" | "summary";

const STEPS: { key: Step; label: string; img: string }[] = [
  { key: "overview", label: "VirtualBox Manager", img: "/images/virtualbox/01-new-vm-wizard.jpg" },
  { key: "name", label: "Name and Operating System", img: "/images/virtualbox/02-name-vm.jpg" },
  { key: "memory", label: "Memory and CPU", img: "/images/virtualbox/03-allocate-resources.jpg" },
  { key: "disk", label: "Hard Disk", img: "/images/virtualbox/04-allocate-disk.jpg" },
  { key: "summary", label: "Summary", img: "/images/virtualbox/06-start-vm.jpg" },
];

type Area = { top: number; left: number; width: number; height: number };

function ClickArea({ area, onClick, hint }: { area: Area; onClick: () => void; hint?: string }) {
  return (
    <div
      className="absolute z-10 cursor-pointer rounded border-2 border-transparent transition-all duration-200 hover:border-white/40 hover:bg-white/[0.08] group"
      style={{ top: `${area.top}%`, left: `${area.left}%`, width: `${area.width}%`, height: `${area.height}%` }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {hint && (
        <div className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-black shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
          {hint}
        </div>
      )}
    </div>
  );
}

export default function CreateVM({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [vmName, setVmName] = useState(`${config.branding.shortName} VM`);
  const [memory, setMemory] = useState(config.vmConfig.defaultMemoryMB);
  const [cpus, setCpus] = useState(2);
  const [diskSize, setDiskSize] = useState(config.vmConfig.defaultDiskGB);
  const [isoSelected, setIsoSelected] = useState(false);
  const [showIsoPicker, setShowIsoPicker] = useState(false);
  const [showInput, setShowInput] = useState<"name" | null>(null);
  const [showSlider, setShowSlider] = useState<"memory" | "cpu" | "disk" | null>(null);

  const current = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;
  const accent = config.branding.accent;

  function next() {
    if (isLast) { playSuccess(); onComplete(); }
    else { playClick(); setStepIdx(p => p + 1); }
  }

  function handleSelectIso() {
    setShowIsoPicker(true);
    setTimeout(() => { setShowIsoPicker(false); setIsoSelected(true); playSuccess(); }, 1500);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-[#2a2a2b]">
        <AnimatePresence mode="wait">
          <motion.div key={current.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="absolute inset-0">

            <img src={current.img} alt={current.label}
              className="absolute inset-0 w-full h-full object-cover" />

            {/* Step 0: VBox main window — "New" button in toolbar */}
            {current.key === "overview" && (
              <ClickArea area={{ top: 8.5, left: 1.8, width: 5.5, height: 4.5 }}
                onClick={next} hint="New (Ctrl+N)" />
            )}

            {/* Step 1: Create VM — name, ISO selector, Continue button */}
            {current.key === "name" && (
              <>
                <ClickArea area={{ top: 15, left: 27, width: 32, height: 3.5 }}
                  onClick={() => setShowInput("name")} hint="Click to name VM" />
                <ClickArea area={{ top: 29, left: 27, width: 18, height: 4 }}
                  onClick={handleSelectIso} hint={isoSelected ? "✓ ISO selected" : "Select ISO image"} />
                <ClickArea area={{ top: 76, left: 64, width: 13, height: 5 }}
                  onClick={() => isoSelected && next()} hint={isoSelected ? "Continue" : "Select ISO first"} />
              </>
            )}

            {/* Step 2: Memory + CPU */}
            {current.key === "memory" && (
              <>
                <ClickArea area={{ top: 14, left: 24, width: 38, height: 5 }}
                  onClick={() => setShowSlider("memory")} hint={`${memory} MB`} />
                <ClickArea area={{ top: 26, left: 24, width: 38, height: 5 }}
                  onClick={() => setShowSlider("cpu")} hint={`${cpus} CPU`} />
                <ClickArea area={{ top: 76, left: 64, width: 13, height: 5 }}
                  onClick={() => memory >= 2048 && next()} hint="Continue" />
              </>
            )}

            {/* Step 3: Hard disk */}
            {current.key === "disk" && (
              <>
                <ClickArea area={{ top: 17, left: 24, width: 38, height: 5 }}
                  onClick={() => setShowSlider("disk")} hint={`${diskSize} GB`} />
                <ClickArea area={{ top: 76, left: 64, width: 13, height: 5 }}
                  onClick={next} hint="Create" />
              </>
            )}

            {/* Step 4: Summary — Finish button */}
            {current.key === "summary" && (
              <ClickArea area={{ top: 76, left: 64, width: 13, height: 5 }}
                onClick={next} hint="Finish" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* ISO picker */}
        <AnimatePresence>
          {showIsoPicker && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="rounded-xl bg-[#1e1e1e] border border-white/10 p-4 shadow-2xl w-80">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                  <span className="text-lg text-white/60">📂</span>
                  <span className="text-xs text-white/60 font-medium">Select ISO image…</span>
                </div>
                <div className="rounded-lg bg-[#2a2a2b] p-3 text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="inline-block text-2xl">💿</motion.div>
                  <div className="mt-2 text-xs text-white/50">Browsing Downloads…</div>
                  <div className="mt-1 text-[10px] text-white/30 font-mono">{config.iso.filename}</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Name popup */}
        <AnimatePresence>
          {showInput === "name" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => setShowInput(null)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl border border-white/15 bg-[#1e1e1e] p-4 shadow-2xl w-72">
                <div className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-2">Virtual Machine Name</div>
                <input value={vmName} onChange={(e) => { setVmName(e.target.value); playKeyClick(); }}
                  autoFocus
                  className="w-full rounded-lg border border-white/20 bg-[#2a2a2b] px-3 py-2 text-sm text-white outline-none focus:border-accent"
                  onKeyDown={(e) => e.key === "Enter" && setShowInput(null)} />
                <button onClick={() => { playClick(); setShowInput(null); }}
                  className="mt-2 w-full rounded-lg py-1.5 text-xs font-semibold text-white transition-colors"
                  style={{ background: accent }}>OK</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slider popups */}
        <AnimatePresence>
          {showSlider === "memory" && (
            <SliderPopup title="Memory" value={memory} min={1024} max={8192} step={256}
              onChange={setMemory} onClose={() => setShowSlider(null)}
              label={`${memory} MB (${(memory / 1024).toFixed(1)} GB)`} accent={accent} />
          )}
          {showSlider === "cpu" && (
            <SliderPopup title="Processors" value={cpus} min={1} max={8} step={1}
              onChange={setCpus} onClose={() => setShowSlider(null)}
              label={`${cpus} CPU core${cpus > 1 ? "s" : ""}`} accent={accent} />
          )}
          {showSlider === "disk" && (
            <SliderPopup title="Disk Size" value={diskSize} min={10} max={100} step={5}
              onChange={setDiskSize} onClose={() => setShowSlider(null)}
              label={`${diskSize} GB`} accent={accent} />
          )}
        </AnimatePresence>

        {/* Step dots */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i <= stepIdx ? "w-3.5" : "w-1.5"}`}
              style={{ background: i <= stepIdx ? accent : "rgba(255,255,255,0.15)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SliderPopup({ title, value, min, max, step, onChange, onClose, label, accent }: {
  title: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; onClose: () => void; label: string; accent: string;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl border border-white/15 bg-[#1e1e1e] p-4 shadow-2xl w-72">
        <div className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-2">{title}</div>
        <div className="text-xs text-white/80 text-center mb-2">{label}</div>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full" style={{ accentColor: accent }} />
        <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
          <span>{min >= 1024 ? `${min / 1024} GB` : min >= 10 ? `${min} GB` : `${min}`}</span>
          <span>{max >= 1024 ? `${max / 1024} GB` : max >= 10 ? `${max} GB` : `${max}`}</span>
        </div>
        <button onClick={() => { playClick(); onClose(); }}
          className="mt-2 w-full rounded-lg py-1.5 text-xs font-semibold text-white transition-colors"
          style={{ background: accent }}>OK</button>
      </motion.div>
    </motion.div>
  );
}
