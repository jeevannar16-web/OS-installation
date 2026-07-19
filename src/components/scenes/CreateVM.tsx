import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick, playKeyClick, playSuccess } from "../shared/sounds";
import type { OSConfig } from "../../data/types";

type Step = "name" | "memory" | "disk" | "summary";

const STEPS: { key: Step; label: string }[] = [
  { key: "name", label: "Name and Operating System" },
  { key: "memory", label: "Memory size" },
  { key: "disk", label: "Hard disk" },
  { key: "summary", label: "Summary" },
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

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-gray-600/30 bg-[#3c3c3c] shadow-2xl flex flex-col">
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

        <div className="flex items-center gap-1.5 bg-[#f0f0f0] px-2 py-1.5 border-b border-gray-300/60">
          <button className="flex items-center gap-1 px-2.5 py-1 rounded text-[8px] font-medium bg-[#4a8cff] text-white shadow-sm">
            <span>⭐</span><span>New</span>
          </button>
          {["Settings", "Discard", "Start"].map(btn => (
            <button key={btn}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[8px] text-gray-600 hover:bg-gray-200 font-medium">
              <span>{btn === "Settings" ? "⚙️" : btn === "Discard" ? "🗑️" : "▶️"}</span><span>{btn}</span>
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[7px] text-gray-400">VirtualBox 7.0.18</span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-40 bg-[#f5f5f5] border-r border-gray-300/40 p-2 hidden sm:block">
            <div className="text-[7px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Virtual Machines</div>
            <div className="rounded bg-gradient-to-r from-[#4a8cff]/10 to-transparent border border-[#4a8cff]/30 px-2 py-1.5 text-[8px] font-medium text-gray-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{config.branding.shortName} VM</span>
            </div>
            <div className="mt-1 text-[7px] text-gray-400 px-2 py-1">Powered Off</div>
          </div>

          <div className="flex-1 relative bg-[#f0f0f0] overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div key={current.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }} className="flex-1 flex flex-col p-4">

                {/* Step indicator — VirtualBox wizard style */}
                <div className="flex items-center gap-2 mb-4 text-[10px] font-medium text-gray-500 border-b border-gray-300/60 pb-2">
                  {STEPS.map((s, i) => (
                    <div key={s.key} className="flex items-center gap-1">
                      <span className={`${i === stepIdx ? "text-[#4a8cff]" : i < stepIdx ? "text-green-600" : "text-gray-400"}`}>
                        {i < stepIdx ? "✓" : i + 1}
                      </span>
                      <span className={`${i === stepIdx ? "text-gray-800 font-semibold" : "text-gray-400"}`}>{s.label}</span>
                      {i < STEPS.length - 1 && <span className="text-gray-300 mx-1">→</span>}
                    </div>
                  ))}
                </div>

                {/* Wizard content — pure HTML matching VirtualBox style */}
                <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
                  {current.key === "name" && (
                    <div>
                      <div className="mb-5">
                        <label className="block text-xs text-gray-700 mb-1 font-medium">Name</label>
                        <input value={vmName} onChange={e => { setVmName(e.target.value); playKeyClick(); }}
                          className="w-full border border-[#7f9db9] bg-white px-2 py-1 text-xs text-gray-800 outline-none"
                          style={{ boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.1)" }} />
                      </div>
                      <div className="mb-5">
                        <label className="block text-xs text-gray-700 mb-1 font-medium">ISO Image</label>
                        <div className="flex gap-1">
                          <input readOnly value={isoSelected ? config.iso.filename : ""}
                            placeholder="(empty)"
                            className="flex-1 border border-[#7f9db9] bg-white px-2 py-1 text-xs text-gray-600 outline-none"
                            style={{ boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.1)" }} />
                          <button onClick={() => { playClick(); setIsoSelected(true); }}
                            className="border border-[#7f9db9] bg-[#e8e8e8] px-2 py-1 text-xs text-gray-700 active:border-[#0078d4]"
                            style={{ boxShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}>
                            Browse...
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {current.key === "memory" && (
                    <div>
                      <div className="mb-5">
                        <label className="block text-xs text-gray-700 mb-1 font-medium">Base Memory (MB)</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min={1024} max={8192} step={256} value={memory}
                            onChange={e => setMemory(Number(e.target.value))}
                            className="flex-1 h-1.5" style={{ accentColor: accent }} />
                          <input type="number" value={memory} min={1024} max={8192} step={256}
                            onChange={e => setMemory(Number(e.target.value))}
                            className="w-20 border border-[#7f9db9] bg-white px-1 py-0.5 text-xs text-gray-800 text-right outline-none"
                            style={{ boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.1)" }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                          <span>1 GB</span><span>8 GB</span>
                        </div>
                      </div>
                      <div className="mb-5">
                        <label className="block text-xs text-gray-700 mb-1 font-medium">Processors</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min={1} max={8} step={1} value={cpus}
                            onChange={e => setCpus(Number(e.target.value))}
                            className="flex-1 h-1.5" style={{ accentColor: accent }} />
                          <input type="number" value={cpus} min={1} max={8} step={1}
                            onChange={e => setCpus(Number(e.target.value))}
                            className="w-20 border border-[#7f9db9] bg-white px-1 py-0.5 text-xs text-gray-800 text-right outline-none"
                            style={{ boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.1)" }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                          <span>1</span><span>8</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {current.key === "disk" && (
                    <div>
                      <div className="mb-5">
                        <label className="block text-xs text-gray-700 mb-1 font-medium">Disk Size (GB)</label>
                        <div className="flex items-center gap-3">
                          <input type="range" min={10} max={100} step={5} value={diskSize}
                            onChange={e => setDiskSize(Number(e.target.value))}
                            className="flex-1 h-1.5" style={{ accentColor: accent }} />
                          <input type="number" value={diskSize} min={10} max={100} step={5}
                            onChange={e => setDiskSize(Number(e.target.value))}
                            className="w-20 border border-[#7f9db9] bg-white px-1 py-0.5 text-xs text-gray-800 text-right outline-none"
                            style={{ boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.1)" }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                          <span>10 GB</span><span>100 GB</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-gray-500 leading-relaxed">
                        A virtual hard disk file will be created at the selected size.
                        The file will grow as you add data (dynamic allocation).
                      </p>
                    </div>
                  )}

                  {current.key === "summary" && (
                    <div className="border border-[#7f9db9] bg-white p-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Virtual machine settings</div>
                      <div className="space-y-1.5 text-[10px]">
                        {[["Name", vmName], ["Memory", `${memory} MB`], ["CPU", `${cpus} cores`],
                          ["Disk", `${diskSize} GB VDI (dynamic)`],
                          ["ISO", config.iso.filename.length > 30 ? config.iso.filename.slice(0, 28) + "…" : config.iso.filename],
                        ].map(([l, v]) => (
                          <div key={l} className="flex">
                            <span className="text-gray-500 w-16">{l}</span>
                            <span className="text-gray-800 font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom action buttons — VirtualBox style */}
            <div className="border-t border-gray-300/60 bg-[#f0f0f0] px-3 py-2 flex items-center justify-end gap-2">
              <button onClick={() => { if (stepIdx > 0) { playClick(); setStepIdx(p => p - 1); } }}
                className={`px-3 py-1 text-[10px] border border-[#7f9db9] bg-[#e8e8e8] text-gray-700 ${stepIdx === 0 ? "opacity-30" : "active:border-[#0078d4]"}`}
                style={{ boxShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}
                disabled={stepIdx === 0}>
                &lt; Back
              </button>
              <button onClick={next}
                className="px-3 py-1 text-[10px] border border-[#7f9db9] bg-[#e8e8e8] text-gray-700 active:border-[#0078d4]"
                style={{ boxShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}>
                {isLast ? "Create" : "Next >"}
              </button>
              <button onClick={() => { playClick(); onComplete(); }}
                className="px-3 py-1 text-[10px] border border-[#7f9db9] bg-[#e8e8e8] text-gray-700 active:border-[#0078d4]"
                style={{ boxShadow: "1px 1px 2px rgba(0,0,0,0.15)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>

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
