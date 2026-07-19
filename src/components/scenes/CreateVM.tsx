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

          <div className="flex-1 relative bg-[#2a2a2b] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={current.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }} className="absolute inset-0">
                <img src={current.img} alt={current.label}
                  className="absolute inset-0 w-full h-full object-cover" />

                {/* Step dots — top-right of content area */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full pointer-events-none">
                  {STEPS.map((s, i) => (
                    <div key={s.key} className={`h-1.5 rounded-full ${i <= stepIdx ? "w-3" : "w-1.5"}`}
                      style={{ background: i <= stepIdx ? accent : "rgba(255,255,255,0.25)" }} />
                  ))}
                </div>

                {/* === Hotspots — invisible overlays at the exact position of VirtualBox controls === */}

                {current.key === "overview" && (
                  <button onClick={next}
                    className="absolute z-10 cursor-pointer"
                    style={{
                      top: "62%", left: "35%", width: "32%", height: "35%",
                      background: "transparent",
                    }} />
                )}

                {current.key === "name" && (
                  <>
                    <input value={vmName} onChange={e => { setVmName(e.target.value); playKeyClick(); }}
                      className="absolute z-10 bg-transparent outline-none text-gray-800"
                      style={{
                        top: "25%", left: "38%", width: "40%", height: "6%",
                        fontSize: "11px", border: "none", padding: "0",
                      }} />
                    <button onClick={() => { playClick(); setIsoSelected(true); }}
                      className="absolute z-10 cursor-pointer bg-transparent"
                      style={{
                        top: "42%", left: "38%", width: "28%", height: "5%",
                      }} />
                    <button onClick={() => { if (!isoSelected) return; playClick(); next(); }}
                      className="absolute z-10 cursor-pointer bg-transparent"
                      style={{
                        top: "77%", left: "62%", width: "15%", height: "6%",
                      }} />
                  </>
                )}

                {current.key === "memory" && (
                  <>
                    <div className="absolute z-10 cursor-pointer bg-transparent"
                      style={{ top: "26%", left: "40%", width: "40%", height: "16%" }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        setMemory(Math.round(1024 + pct * (8192 - 1024)));
                      }} />
                    <div className="absolute z-10 pointer-events-none text-gray-800 text-[9px] font-medium"
                      style={{ top: "30%", left: "42%" }}>
                      {memory} MB
                    </div>
                    <div className="absolute z-10 cursor-pointer bg-transparent"
                      style={{ top: "44%", left: "40%", width: "40%", height: "16%" }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        setCpus(Math.max(1, Math.min(8, Math.round(1 + pct * 7))));
                      }} />
                    <div className="absolute z-10 pointer-events-none text-gray-800 text-[9px] font-medium"
                      style={{ top: "48%", left: "42%" }}>
                      {cpus} CPU
                    </div>
                    <button onClick={next}
                      className="absolute z-10 cursor-pointer bg-transparent"
                      style={{ top: "77%", left: "62%", width: "15%", height: "6%" }} />
                  </>
                )}

                {current.key === "disk" && (
                  <>
                    <div className="absolute z-10 cursor-pointer bg-transparent"
                      style={{ top: "34%", left: "40%", width: "40%", height: "16%" }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        setDiskSize(Math.round(10 + pct * 90));
                      }} />
                    <div className="absolute z-10 pointer-events-none text-gray-800 text-[9px] font-medium"
                      style={{ top: "38%", left: "42%" }}>
                      {diskSize} GB
                    </div>
                    <button onClick={next}
                      className="absolute z-10 cursor-pointer bg-transparent"
                      style={{ top: "77%", left: "62%", width: "15%", height: "6%" }} />
                  </>
                )}

                {current.key === "summary" && (
                  <button onClick={next}
                    className="absolute z-10 cursor-pointer bg-transparent"
                    style={{ top: "77%", left: "62%", width: "15%", height: "6%" }} />
                )}
              </motion.div>
            </AnimatePresence>
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
