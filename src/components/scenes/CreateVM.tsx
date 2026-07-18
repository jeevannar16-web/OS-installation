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

export default function CreateVM({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [vmName, setVmName] = useState(`${config.branding.shortName} VM`);
  const [memory, setMemory] = useState(config.vmConfig.defaultMemoryMB);
  const [cpus, setCpus] = useState(2);
  const [diskSize, setDiskSize] = useState(config.vmConfig.defaultDiskGB);
  const [isoSelected, setIsoSelected] = useState(false);
  const [showIsoPicker, setShowIsoPicker] = useState(false);
  const [popup, setPopup] = useState<Step | "finish" | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [stepAnim, setStepAnim] = useState<"idle" | "hover">("idle");

  const current = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;
  const accent = config.branding.accent;

  function next() {
    if (isLast) { playSuccess(); onComplete(); }
    else { playClick(); setStepIdx(p => p + 1); setStepAnim("idle"); }
  }

  const stepIndicators: { key: Step; label: string }[] = [
    { key: "overview", label: "VM Name & OS" },
    { key: "name", label: "ISO Selection" },
    { key: "memory", label: "Resources" },
    { key: "disk", label: "Storage" },
    { key: "summary", label: "Finish" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      {/* Oracle VM VirtualBox Manager window */}
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-gray-600/30 bg-[#3c3c3c] shadow-2xl flex flex-col">
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-3 py-1.5 select-none rounded-t-2xl">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <div className="flex items-center gap-2 mx-auto text-[9px] text-gray-600 font-medium">
            <span>Oracle VM VirtualBox Manager</span>
          </div>
          <div className="flex gap-1">
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2 w-2.5 rounded-sm bg-gray-300 border border-gray-400/50" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5 bg-[#f0f0f0] px-2 py-1.5 border-b border-gray-300/60">
          {[
            { label: "New", icon: "⭐", accent: true, action: () => { playClick(); if (current.key === "overview") setPopup("overview"); } },
            { label: "Settings", icon: "⚙️", accent: false },
            { label: "Discard", icon: "🗑️", accent: false },
            { label: "Start", icon: "▶️", accent: false },
          ].map((btn) => (
            <button key={btn.label} onClick={btn.action}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[8px] transition-colors font-medium ${
                btn.accent
                  ? "bg-[#4a8cff] text-white hover:bg-[#3a7bef] shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}>
              <span>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[7px] text-gray-400">VirtualBox 7.0.18</span>
        </div>

        {/* Main content area with VM list */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - VM list */}
          <div className="w-40 bg-[#f5f5f5] border-r border-gray-300/40 p-2 hidden sm:block">
            <div className="text-[7px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Virtual Machines</div>
            <div className="rounded bg-gradient-to-r from-[#4a8cff]/10 to-transparent border border-[#4a8cff]/30 px-2 py-1.5 text-[8px] font-medium text-gray-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{config.branding.shortName} VM</span>
            </div>
            <div className="mt-1 text-[7px] text-gray-400 px-2 py-1">Powered Off</div>
          </div>

          {/* Right content area with screenshot */}
          <div className="flex-1 relative bg-[#2a2a2b] overflow-hidden cursor-pointer"
            onClick={() => {
              if (current.key === "summary") { setPopup("finish"); return; }
              if (current.key === "name") { setShowInput(true); return; }
              if (current.key === "overview") { setPopup("overview"); return; }
              if (current.key === "memory") { setPopup("memory"); return; }
              if (current.key === "disk") { setPopup("disk"); return; }
            }}
            onMouseEnter={() => setStepAnim("hover")}
            onMouseLeave={() => setStepAnim("idle")}>
            <AnimatePresence mode="wait">
              <motion.div key={current.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} className="absolute inset-0">
                <img src={current.img} alt={current.label}
                  className="absolute inset-0 w-full h-full object-cover" />

                {/* Step indicator overlay */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  {stepIndicators.map((s, i) => (
                    <div key={s.key} className="flex items-center gap-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        i === stepIdx ? "bg-white" : i < stepIdx ? "bg-emerald-400" : "bg-white/20"
                      }`} />
                      {i < stepIndicators.length - 1 && (
                        <div className={`h-px w-2 ${
                          i < stepIdx ? "bg-emerald-400/50" : "bg-white/10"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Navigation hint */}
                <motion.div
                  animate={{ opacity: stepAnim === "hover" ? 1 : 0 }}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-white/70 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none whitespace-nowrap">
                  {current.key === "overview" ? "Click to create new VM" :
                   current.key === "summary" ? "Click to finish" :
                   "Click to configure this step"}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-[#2a2a2a] border-t border-gray-600/40 px-2 py-0.5 flex items-center gap-2 rounded-b-2xl">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
            <span className="text-[7px] text-gray-400">{current.label}</span>
          </div>
          <div className="flex-1" />
          <span className="text-[7px] text-gray-500">Step {stepIdx + 1} of {STEPS.length}</span>
        </div>
      </div>

      {/* Popups */}
      <AnimatePresence>
        {popup === "overview" && (
          <FloatingBox onClose={() => setPopup(null)}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>Create a Virtual Machine</div>
            <p className="text-xs text-white/60 mb-3">Click <strong className="text-white/80">New</strong> in the VirtualBox toolbar to create a new VM.</p>
            <button onClick={() => { playClick(); setPopup(null); next(); }}
              className="w-full rounded-lg py-2 text-xs font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: accent }}>+ New Virtual Machine</button>
          </FloatingBox>
        )}

        {popup === "memory" && (
          <SliderBox title="Allocate memory & CPU" accent={accent}
            onClose={() => setPopup(null)}
            onDone={() => { playClick(); setPopup(null); next(); }}>
            <div className="mb-2">
              <div className="text-[10px] text-white/50 mb-1">Base Memory: <span className="text-white/80">{memory} MB ({(memory / 1024).toFixed(1)} GB)</span></div>
              <input type="range" min={1024} max={8192} step={256} value={memory}
                onChange={(e) => setMemory(Number(e.target.value))}
                className="w-full" style={{ accentColor: accent }} />
            </div>
            <div>
              <div className="text-[10px] text-white/50 mb-1">Processors: <span className="text-white/80">{cpus} CPU</span></div>
              <input type="range" min={1} max={8} step={1} value={cpus}
                onChange={(e) => setCpus(Number(e.target.value))}
                className="w-full" style={{ accentColor: accent }} />
            </div>
          </SliderBox>
        )}

        {popup === "disk" && (
          <SliderBox title="Virtual hard disk size" accent={accent}
            onClose={() => setPopup(null)}
            onDone={() => { playClick(); setPopup(null); next(); }}>
            <div className="text-[10px] text-white/50 mb-1">Disk size: <span className="text-white/80">{diskSize} GB</span></div>
            <input type="range" min={10} max={100} step={5} value={diskSize}
              onChange={(e) => setDiskSize(Number(e.target.value))}
              className="w-full" style={{ accentColor: accent }} />
          </SliderBox>
        )}

        {popup === "finish" && (
          <FloatingBox onClose={() => setPopup(null)}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>Ready to create</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1 text-[10px] mb-3">
              {[
                ["Name", vmName],
                ["Memory", `${memory} MB (${(memory / 1024).toFixed(1)} GB)`],
                ["CPU", `${cpus} cores`],
                ["Disk", `${diskSize} GB VDI`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-white/40">{l}</span>
                  <span className="text-white/70 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { playClick(); setPopup(null); next(); }}
              className="w-full rounded-lg py-2 text-xs font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: accent }}>Finish →</button>
          </FloatingBox>
        )}
      </AnimatePresence>

      {/* Name input */}
      <AnimatePresence>
        {showInput && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowInput(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl border border-white/15 bg-[#1e1e1e] p-4 shadow-2xl w-72">
              <div className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-2">VM Name & ISO</div>
              <input value={vmName} onChange={(e) => { setVmName(e.target.value); playKeyClick(); }}
                autoFocus placeholder="Name your VM"
                className="w-full rounded-lg border border-white/20 bg-[#2a2a2b] px-3 py-2 text-sm text-white outline-none mb-2" />
              <button onClick={() => { playClick(); setShowIsoPicker(true); }}
                className={`w-full rounded-lg border px-3 py-2 text-xs text-left transition-all ${
                  isoSelected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/20 bg-[#1e1e1e] text-white/50 hover:bg-white/10"
                }`}>
                {isoSelected ? `✓ ${config.iso.filename}` : "📁 Select ISO image..."}
              </button>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { playClick(); setShowInput(false); }}
                  className="flex-1 rounded-lg border border-white/15 py-1.5 text-xs text-white/60 hover:bg-white/[0.03]">Cancel</button>
                <button onClick={() => {
                  playClick();
                  if (!isoSelected) return;
                  setShowInput(false);
                  next();
                }} disabled={!isoSelected}
                  className="flex-1 rounded-lg py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-40"
                  style={{ background: accent }}>Continue</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ISO picker */}
      <AnimatePresence>
        {showIsoPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIsoPicker(false)}>
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
              <motion.div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full"
                  initial={{ width: 0 }} animate={{ width: "100%" }}
                  transition={{ duration: 1.4, ease: "easeInOut" }}
                  style={{ background: accent }} />
              </motion.div>
              <div className="text-center mt-2">
                <button onClick={() => { playClick(); setShowIsoPicker(false); setIsoSelected(true); }}
                  className="rounded-lg text-[10px] text-white/40 hover:text-white/70 transition-colors">Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FloatingBox({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl border border-white/15 bg-[#1e1e1e] p-4 shadow-2xl w-72">
        {children}
      </motion.div>
    </motion.div>
  );
}

function SliderBox({ title, accent, onClose, onDone, children }: {
  title: string; accent: string; onClose: () => void; onDone: () => void; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-xl border border-white/15 bg-[#1e1e1e] p-4 shadow-2xl w-72">
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: accent }}>{title}</div>
        {children}
        <button onClick={onDone}
          className="mt-2 w-full rounded-lg py-1.5 text-xs font-semibold text-white transition-colors"
          style={{ background: accent }}>Continue</button>
      </motion.div>
    </motion.div>
  );
}
