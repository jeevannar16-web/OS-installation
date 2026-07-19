import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick, playSuccess } from "../shared/sounds";
import SceneShell from "../shared/SceneShell";
import type { OSConfig } from "../../data/types";

type Step = "name" | "memory" | "disk" | "summary";

const STEPS: { key: Step; label: string; img: string }[] = [
  { key: "name", label: "Name and operating system", img: "/images/virtualbox/02-name-vm.jpg" },
  { key: "memory", label: "Memory size", img: "/images/virtualbox/03-allocate-resources.jpg" },
  { key: "disk", label: "Hard disk", img: "/images/virtualbox/04-allocate-disk.jpg" },
  { key: "summary", label: "Summary", img: "/images/virtualbox/01-new-vm-wizard.jpg" },
];

export default function CreateVM({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [vmName, setVmName] = useState("");

  const current = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const zones = [
    { id: "next", x: 45, y: 65, w: 22, h: 18,
      onClick: () => { if (isLast) { playSuccess(); onComplete(); } else { playClick(); setStepIdx(p => p + 1); } } },
    { id: "back", x: 18, y: 65, w: 22, h: 18,
      onClick: () => { if (stepIdx > 0) { playClick(); setStepIdx(p => p - 1); } } },
    { id: "cancel", x: 70, y: 65, w: 18, h: 18,
      onClick: () => { playClick(); onComplete(); } },
    { id: "interact", x: 15, y: 10, w: 70, h: 50,
      onClick: () => { playClick(); } },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-gray-600/30 bg-[#3c3c3c] shadow-2xl flex flex-col">
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-3 py-1.5 select-none rounded-t-2xl font-sans">
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

        <div className="flex items-center gap-1.5 bg-[#f0f0f0] px-2 py-1.5 border-b border-gray-300/60 font-sans">
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
          <div className="w-40 bg-[#f5f5f5] border-r border-gray-300/40 p-2 hidden sm:block font-sans">
            <div className="text-[7px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Virtual Machines</div>
            <div className="rounded bg-gradient-to-r from-[#4a8cff]/10 to-transparent border border-[#4a8cff]/30 px-2 py-1.5 text-[8px] font-medium text-gray-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{config.branding.shortName} VM</span>
            </div>
            <div className="mt-1 text-[7px] text-gray-400 px-2 py-1">Powered Off</div>
          </div>

          <div className="flex-1 relative bg-[#f0f0f0] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={current.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }} className="absolute inset-0">
                <SceneShell src={current.img} alt={current.label}
                  zones={zones}
                  globalInput={current.key === "name" ? { value: vmName, onChange: setVmName, placeholder: "VM Name" } : undefined} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-[#2a2a2a] border-t border-gray-600/40 px-2 py-0.5 flex items-center gap-2 rounded-b-2xl font-sans">
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
