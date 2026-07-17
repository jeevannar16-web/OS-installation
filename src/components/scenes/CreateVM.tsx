import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

type Step = "overview" | "name" | "memory" | "disk" | "summary";

const VM_STEPS: { key: Step; label: string; img: string }[] = [
  { key: "overview", label: "VirtualBox Manager", img: "/images/virtualbox/01-new-vm-wizard.jpg" },
  { key: "name", label: "Name and Operating System", img: "/images/virtualbox/02-name-vm.jpg" },
  { key: "memory", label: "Memory and CPU", img: "/images/virtualbox/03-allocate-resources.jpg" },
  { key: "disk", label: "Hard Disk", img: "/images/virtualbox/04-allocate-disk.jpg" },
  { key: "summary", label: "Summary", img: "/images/virtualbox/01-new-vm-wizard.jpg" },
];

export default function CreateVM({
  config,
  onComplete,
}: {
  config: OSConfig;
  onComplete: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [step, setStep] = useState(0);
  const [vmName, setVmName] = useState(`${config.branding.shortName} VM`);
  const [memory, setMemory] = useState(config.vmConfig.defaultMemoryMB);
  const [cpus, setCpus] = useState(2);
  const [diskSize, setDiskSize] = useState(config.vmConfig.defaultDiskGB);
  const [isoSelected, setIsoSelected] = useState(false);
  const [showIsoPicker, setShowIsoPicker] = useState(false);

  const current = VM_STEPS[step];

  useEffect(() => {
    if (step === VM_STEPS.length - 1) {
      registerAdvance(() => onComplete());
    }
  }, [step, registerAdvance, onComplete]);

  function next() {
    playClick();
    if (step < VM_STEPS.length - 1) setStep(step + 1);
    else onComplete();
  }

  function prev() {
    playClick();
    if (step > 0) setStep(step - 1);
  }

  function handleSelectIso() {
    playClick();
    setShowIsoPicker(true);
    setTimeout(() => { setShowIsoPicker(false); setIsoSelected(true); }, 1500);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black">
        <AnimatePresence mode="wait">
          <motion.div key={current.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="absolute inset-0">

            {/* Real VirtualBox screenshot as full background */}
            <img src={current.img} alt={current.label}
              className="absolute inset-0 w-full h-full object-contain bg-[#2a2a2b]" />

            {/* Interactive overlay */}
            <div className="absolute inset-x-0 bottom-0">
              <div className="bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/60 to-transparent pt-20 pb-4 px-6">
                <div className="max-w-lg mx-auto space-y-3">

                  {/* Step 0: Overview — Click New */}
                  {current.key === "overview" && (
                    <div className="space-y-2">
                      <div className="text-[10px] text-accent font-semibold uppercase tracking-wider">Create a new virtual machine</div>
                      <p className="text-xs text-white/60">Click the <strong className="text-white/80">New</strong> button in the toolbar to start the wizard.</p>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        VirtualBox 7.0 is installed and ready
                      </div>
                    </div>
                  )}

                  {/* Step 1: Name + ISO selection */}
                  {current.key === "name" && (
                    <div className="space-y-3">
                      <div className="text-[10px] text-accent font-semibold uppercase tracking-wider">Name your virtual machine</div>
                      <div>
                        <label className="mb-1 block text-[10px] text-white/50">Name:</label>
                        <input value={vmName} onChange={(e) => setVmName(e.target.value)}
                          className="w-full rounded-lg border border-white/20 bg-[#1e1e1e] px-3 py-2 text-xs text-white outline-none focus:border-accent" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[10px] text-white/50">Type:</label>
                          <select className="w-full rounded-lg border border-white/20 bg-[#1e1e1e] px-3 py-2 text-xs text-white outline-none">
                            <option>{config.vmConfig.osType}</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] text-white/50">Version:</label>
                          <select className="w-full rounded-lg border border-white/20 bg-[#1e1e1e] px-3 py-2 text-xs text-white outline-none">
                            <option>{config.vmConfig.osVersion}</option>
                          </select>
                        </div>
                      </div>
                      {/* ISO selection */}
                      <div>
                        <label className="mb-1 block text-[10px] text-white/50">ISO Image:</label>
                        <button onClick={handleSelectIso} disabled={isoSelected}
                          className={`w-full rounded-lg border px-3 py-2 text-xs text-left transition-all ${
                            isoSelected
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-white/20 bg-[#1e1e1e] text-white/50 hover:bg-white/10"
                          }`}>
                          {isoSelected ? `✓ ${config.iso.filename}` : "📁 Click to select ISO file..."}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Memory + CPU */}
                  {current.key === "memory" && (
                    <div className="space-y-3">
                      <div className="text-[10px] text-accent font-semibold uppercase tracking-wider">Allocate hardware resources</div>
                      <div>
                        <label className="mb-1 block text-[10px] text-white/50">Base Memory: <span className="text-white/80">{memory} MB ({(memory / 1024).toFixed(1)} GB)</span></label>
                        <input type="range" min={1024} max={8192} step={256} value={memory}
                          onChange={(e) => setMemory(Number(e.target.value))} className="w-full accent-accent" />
                        <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
                          <span>1 GB</span>
                          <span className={memory >= 4096 ? "text-emerald-400" : "text-amber-400"}>
                            {memory >= 4096 ? "✓ Recommended" : "⚠ Below minimum"}
                          </span>
                          <span>8 GB</span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-white/50">Processors: <span className="text-white/80">{cpus} CPU</span></label>
                        <input type="range" min={1} max={8} step={1} value={cpus}
                          onChange={(e) => setCpus(Number(e.target.value))} className="w-full accent-accent" />
                        <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
                          <span>1</span>
                          <span className={cpus >= 2 ? "text-emerald-400" : "text-amber-400"}>
                            {cpus >= 2 ? "✓ Good" : "⚠ Too low"}
                          </span>
                          <span>8</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {[{ r: 2048, c: 2 }, { r: 4096, c: 2 }, { r: 4096, c: 4 }].map((p) => (
                          <button key={`${p.r}-${p.c}`} onClick={() => { setMemory(p.r); setCpus(p.c); playClick(); }}
                            className={`rounded-full border px-3 py-1 text-[10px] transition-colors ${
                              memory === p.r && cpus === p.c
                                ? "border-accent bg-accent/20 text-white" : "border-white/10 text-white/50 hover:text-white"
                            }`}>{p.r / 1024} GB / {p.c} CPU</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Hard Disk */}
                  {current.key === "disk" && (
                    <div className="space-y-3">
                      <div className="text-[10px] text-accent font-semibold uppercase tracking-wider">Virtual Hard Disk</div>
                      <div className="space-y-1.5">
                        {[
                          { id: "create", label: "Create a virtual hard disk now", checked: true },
                          { id: "existing", label: "Use an existing virtual hard disk file", checked: false },
                          { id: "none", label: "Do not add a virtual hard disk", checked: false },
                        ].map((opt) => (
                          <label key={opt.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all cursor-pointer ${
                            opt.checked ? "border-accent/30 bg-accent/5 text-white" : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                          }`}>
                            <input type="radio" name="disk" defaultChecked={opt.checked} className="accent-accent" readOnly />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] text-white/50">Disk size: <span className="text-white/80">{diskSize} GB</span></label>
                        <input type="range" min={10} max={100} step={5} value={diskSize}
                          onChange={(e) => setDiskSize(Number(e.target.value))} className="w-full accent-accent" />
                        <div className="flex justify-between text-[10px] text-white/30 mt-0.5">
                          <span>10 GB</span>
                          <span className={diskSize >= 25 ? "text-emerald-400" : "text-amber-400"}>
                            {diskSize >= 25 ? "✓ Good for most installs" : "⚠ Might be tight"}
                          </span>
                          <span>100 GB</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Summary */}
                  {current.key === "summary" && (
                    <div className="space-y-2">
                      <div className="text-[10px] text-accent font-semibold uppercase tracking-wider">Ready to create</div>
                      <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-1 text-xs">
                        {[
                          ["Name", vmName],
                          ["Type", `${config.vmConfig.osType} / ${config.vmConfig.osVersion}`],
                          ["Memory", `${memory} MB (${(memory / 1024).toFixed(1)} GB)`],
                          ["CPU", `${cpus} cores`],
                          ["Disk", `Create ${diskSize} GB VDI`],
                          ["Graphics", "VMSVGA + 128 MB VRAM"],
                          ["Network", "NAT"],
                        ].map(([l, v]) => (
                          <div key={l} className="flex justify-between">
                            <span className="text-white/40">{l}</span>
                            <span className="text-white/80">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-300">
                        <span>✓</span> Virtual machine is ready to be created. Click <strong>Finish</strong>.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ISO file picker overlay */}
        {showIsoPicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="rounded-xl bg-[#1e1e1e] border border-white/10 p-4 shadow-2xl w-80">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                <span className="text-sm">📂</span>
                <span className="text-xs text-white/60">Select ISO disk image…</span>
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
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between border-t border-white/10 bg-[#1a1a24] px-4 py-2.5 rounded-b-2xl shrink-0">
        <button onClick={prev} disabled={step === 0}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/10 transition-colors disabled:opacity-30">
          ← Back
        </button>
        <div className="flex items-center gap-1.5">
          {VM_STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? "bg-accent w-4" : "bg-white/15 w-1.5"}`} />
          ))}
        </div>
        <button onClick={next} className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/80 transition-colors">
          {step === VM_STEPS.length - 1 ? "Finish" : "Next"} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
