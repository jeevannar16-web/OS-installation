import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick, playKeyClick, playSuccess } from "../shared/sounds";
import type { OSConfig } from "../../data/types";

type Step = "overview" | "name" | "memory" | "disk" | "summary";

const STEPS: { key: Step; label: string; img: string }[] = [
  { key: "overview", label: "Create Virtual Machine", img: "/images/virtualbox/01-new-vm-wizard.jpg" },
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

  const current = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;
  const accent = config.branding.accent;

  function next() {
    if (isLast) { playSuccess(); onComplete(); }
    else { playClick(); setStepIdx(p => p + 1); }
  }

  const stepIndicators: { key: Step; label: string }[] = [
    { key: "overview", label: "Name & OS" },
    { key: "name", label: "ISO" },
    { key: "memory", label: "Resources" },
    { key: "disk", label: "Storage" },
    { key: "summary", label: "Finish" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
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
          <button
            onClick={() => stepIdx === 0 ? next() : (playClick(), setStepIdx(0))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[8px] transition-colors font-medium ${
              stepIdx === 0
                ? "bg-[#4a8cff] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-200"
            }`}>
            <span>⭐</span>
            <span>New</span>
          </button>
          {["Settings", "Discard", "Start"].map(btn => (
            <button key={btn}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[8px] text-gray-600 hover:bg-gray-200 font-medium">
              <span>{btn === "Settings" ? "⚙️" : btn === "Discard" ? "🗑️" : "▶️"}</span>
              <span>{btn}</span>
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[7px] text-gray-400">VirtualBox 7.0.18</span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* VM list sidebar */}
          <div className="w-40 bg-[#f5f5f5] border-r border-gray-300/40 p-2 hidden sm:block">
            <div className="text-[7px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Virtual Machines</div>
            <div className="rounded bg-gradient-to-r from-[#4a8cff]/10 to-transparent border border-[#4a8cff]/30 px-2 py-1.5 text-[8px] font-medium text-gray-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{config.branding.shortName} VM</span>
            </div>
            <div className="mt-1 text-[7px] text-gray-400 px-2 py-1">Powered Off</div>
          </div>

          {/* Content area */}
          <div className="flex-1 relative bg-[#2a2a2b] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={current.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} className="absolute inset-0">
                <img src={current.img} alt={current.label}
                  className="absolute inset-0 w-full h-full object-cover" />

                {/* Step indicator */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  {stepIndicators.map((s, i) => (
                    <div key={s.key} className="flex items-center gap-1">
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        i === stepIdx ? "bg-white" : i < stepIdx ? "bg-emerald-400" : "bg-white/20"
                      }`} />
                      {i < stepIndicators.length - 1 && (
                        <div className={`h-px w-2 ${i < stepIdx ? "bg-emerald-400/50" : "bg-white/10"}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom overlay — fields sit IN the screenshot, not as a separate card */}
                <div className="absolute bottom-0 inset-x-0 z-10"
                  style={{
                    background: `linear-gradient(to top, ${config.branding.surface} 0%, ${config.branding.surface}dd 50%, transparent 100%)`,
                  }}>
                  <div className="px-4 pt-10 pb-3 max-w-sm mx-auto">
                    {current.key === "overview" && (
                      <div>
                        <div className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: accent }}>
                          Create a Virtual Machine
                        </div>
                        <p className="text-xs text-white/50 mb-3 leading-relaxed">
                          Press the <strong className="text-white/80">New</strong> button (⭐) in the toolbar above to create a new virtual machine.
                        </p>
                        <button onClick={next}
                          className="w-full rounded-lg py-2 text-xs font-bold text-white transition-all hover:scale-[1.02]"
                          style={{ background: accent }}>
                          + New Virtual Machine
                        </button>
                      </div>
                    )}

                    {current.key === "name" && (
                      <div>
                        <div className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: accent }}>
                          VM Name & ISO
                        </div>
                        <div className="mb-2">
                          <label className="text-[9px] text-white/40 block mb-1">Name:</label>
                          <input value={vmName} onChange={e => { setVmName(e.target.value); playKeyClick(); }}
                            autoFocus placeholder="Enter a name for the VM"
                            className="w-full rounded-lg border border-white/20 bg-[#2a2a2b] px-3 py-2 text-xs text-white outline-none placeholder:text-white/30" />
                        </div>
                        <div className="mb-3">
                          <label className="text-[9px] text-white/40 block mb-1">ISO Image:</label>
                          <button onClick={() => { playClick(); setIsoSelected(true); }}
                            className={`w-full rounded-lg border px-3 py-2 text-[10px] text-left transition-all ${
                              isoSelected
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-white/20 bg-[#2a2a2b] text-white/50 hover:bg-white/10"
                            }`}>
                            {isoSelected ? `✓ ${config.iso.filename}` : "📁 Select ISO image..."}
                          </button>
                        </div>
                        <button onClick={() => { if (!isoSelected) return; playClick(); next(); }}
                          disabled={!isoSelected}
                          className="w-full rounded-lg py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-40"
                          style={{ background: accent }}>
                          Next: Resources →
                        </button>
                      </div>
                    )}

                    {current.key === "memory" && (
                      <div>
                        <div className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: accent }}>
                          Memory & CPU
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-[9px] mb-1">
                            <span className="text-white/40">Base Memory:</span>
                            <span className="text-white/80 font-medium">{memory} MB</span>
                          </div>
                          <input type="range" min={1024} max={8192} step={256} value={memory}
                            onChange={e => setMemory(Number(e.target.value))}
                            className="w-full h-1.5" style={{ accentColor: accent }} />
                          <div className="flex justify-between text-[7px] text-white/20 mt-0.5">
                            <span>1 GB</span><span>8 GB</span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-[9px] mb-1">
                            <span className="text-white/40">Processors:</span>
                            <span className="text-white/80 font-medium">{cpus} CPU</span>
                          </div>
                          <input type="range" min={1} max={8} step={1} value={cpus}
                            onChange={e => setCpus(Number(e.target.value))}
                            className="w-full h-1.5" style={{ accentColor: accent }} />
                          <div className="flex justify-between text-[7px] text-white/20 mt-0.5">
                            <span>1</span><span>8</span>
                          </div>
                        </div>
                        <button onClick={next}
                          className="w-full rounded-lg py-1.5 text-xs font-semibold text-white"
                          style={{ background: accent }}>
                          Next: Storage →
                        </button>
                      </div>
                    )}

                    {current.key === "disk" && (
                      <div>
                        <div className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: accent }}>
                          Virtual Hard Disk
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-[9px] mb-1">
                            <span className="text-white/40">Disk Size:</span>
                            <span className="text-white/80 font-medium">{diskSize} GB</span>
                          </div>
                          <input type="range" min={10} max={100} step={5} value={diskSize}
                            onChange={e => setDiskSize(Number(e.target.value))}
                            className="w-full h-1.5" style={{ accentColor: accent }} />
                          <div className="flex justify-between text-[7px] text-white/20 mt-0.5">
                            <span>10 GB</span><span>100 GB</span>
                          </div>
                        </div>
                        <button onClick={next}
                          className="w-full rounded-lg py-1.5 text-xs font-semibold text-white"
                          style={{ background: accent }}>
                          Next: Summary →
                        </button>
                      </div>
                    )}

                    {current.key === "summary" && (
                      <div>
                        <div className="text-[10px] font-semibold tracking-wider mb-2" style={{ color: accent }}>
                          Ready to create
                        </div>
                        <div className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-1.5 text-[10px] mb-3">
                          {[["Name", vmName], ["Memory", `${memory} MB`], ["CPU", `${cpus} cores`],
                            ["Disk", `${diskSize} GB VDI`],
                            ["ISO", config.iso.filename.length > 22 ? config.iso.filename.slice(0, 22) + "…" : config.iso.filename],
                          ].map(([l, v]) => (
                            <div key={l} className="flex justify-between">
                              <span className="text-white/40">{l}</span>
                              <span className="text-white/70 font-medium">{v}</span>
                            </div>
                          ))}
                        </div>
                        <button onClick={next}
                          className="w-full rounded-lg py-2 text-xs font-bold text-white transition-all hover:scale-[1.02]"
                          style={{ background: accent }}>
                          Finish →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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
          <span className="text-[7px] text-gray-500">Step {stepIdx + 1} / {STEPS.length}</span>
        </div>
      </div>
    </div>
  );
}
