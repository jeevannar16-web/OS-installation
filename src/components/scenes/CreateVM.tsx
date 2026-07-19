import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick, playSuccess } from "../shared/sounds";
import type { OSConfig } from "../../data/types";

type Step = "name" | "memory" | "disk" | "summary";

export default function CreateVM({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [step, setStep] = useState<Step>("name");
  const [vmName, setVmName] = useState(config.branding.shortName + " VM");
  const [osType, setOsType] = useState(config.vmConfig.osType);
  const [osVersion, setOsVersion] = useState(config.vmConfig.osVersion);
  const [memoryMB, setMemoryMB] = useState(config.vmConfig.defaultMemoryMB);
  const [diskGB, setDiskGB] = useState(config.vmConfig.defaultDiskGB);
  const [createDisk, setCreateDisk] = useState(true);

  const steps: Step[] = ["name", "memory", "disk", "summary"];
  const currentIdx = steps.indexOf(step);

  const osTypeOptions = ["Linux", "Microsoft Windows", "Mac OS X", "BSD", "Solaris", "Other"];
  const osVersionOptions: Record<string, string[]> = {
    "Linux": ["Ubuntu (64-bit)", "Ubuntu (32-bit)", "Debian (64-bit)", "Fedora (64-bit)", "Red Hat (64-bit)", "Arch Linux (64-bit)", "Mint (64-bit)", "Zorin (64-bit)", "Other Linux (64-bit)"],
    "Microsoft Windows": ["Windows 11 (64-bit)", "Windows 10 (64-bit)", "Windows 8.1 (64-bit)", "Windows 7 (64-bit)", "Windows Vista", "Windows XP"],
    "Mac OS X": ["Mac OS X 10.15", "macOS 11 Big Sur", "macOS 12 Monterey", "macOS 13 Ventura"],
    "BSD": ["FreeBSD (64-bit)", "OpenBSD (64-bit)", "NetBSD (64-bit)"],
    "Solaris": ["Solaris 11 (64-bit)", "Oracle Solaris 10"],
    "Other": ["Other (64-bit)", "Other (32-bit)"],
  };

  function handleNext() {
    if (step === "summary") { playSuccess(); onComplete(); return; }
    playClick();
    const idx = steps.indexOf(step);
    setStep(steps[idx + 1]);
  }

  function handleBack() {
    if (currentIdx <= 0) return;
    playClick();
    setStep(steps[currentIdx - 1]);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-gray-600/30 bg-[#3c3c3c] shadow-2xl flex flex-col font-sans">
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
          {["Machine", "Help"].map(m => (
            <span key={m} className="text-[8px] text-gray-500 px-1.5 py-0.5 hover:bg-gray-200 rounded cursor-default">{m}</span>
          ))}
          <div className="flex-1" />
          <span className="text-[7px] text-gray-400">VirtualBox 7.0.18</span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-40 bg-[#f5f5f5] border-r border-gray-300/40 p-2 hidden sm:block">
            <div className="text-[7px] text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Virtual Machines</div>
            <div className="rounded bg-gradient-to-r from-[#4a8cff]/10 to-transparent border border-[#4a8cff]/30 px-2 py-1.5 text-[8px] font-medium text-gray-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>{config.branding.shortName}</span>
            </div>
            <div className="mt-1 text-[7px] text-gray-400 px-2 py-1">Powered Off</div>
          </div>

          <div className="flex-1 bg-[#f0f0f0] p-5 overflow-y-auto">
            <div className="max-w-lg mx-auto">
              <h2 className="text-sm font-semibold text-gray-800 mb-4">
                {step === "name" && "Create Virtual Machine"}
                {step === "memory" && "Memory size"}
                {step === "disk" && "Hard disk"}
                {step === "summary" && "Summary"}
              </h2>

              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                  {step === "name" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Name:</label>
                        <input type="text" value={vmName} onChange={e => { playClick(); setVmName(e.target.value); }}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff] focus:ring-1 focus:ring-[#4a8cff]" />
                        <p className="text-[9px] text-gray-400 mt-1">Enter a name for the virtual machine.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Type:</label>
                          <select value={osType} onChange={e => { setOsType(e.target.value); setOsVersion(osVersionOptions[e.target.value][0]); }}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff]">
                            {osTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Version:</label>
                          <select value={osVersion} onChange={e => setOsVersion(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff]">
                            {(osVersionOptions[osType] || []).map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === "memory" && (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500">Select the amount of RAM (megabytes) to allocate to the virtual machine.</p>
                      <div className="flex items-center gap-4">
                        <input type="range" min={512} max={16384} step={256} value={memoryMB}
                          onChange={e => setMemoryMB(Number(e.target.value))}
                          className="flex-1 accent-[#4a8cff]" />
                        <div className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-medium text-gray-800 min-w-[80px] text-center">
                          {memoryMB >= 1024 ? `${(memoryMB / 1024).toFixed(1)} GB` : `${memoryMB} MB`}
                        </div>
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-400 px-1">
                        <span>512 MB</span>
                        <span>16 GB</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Recommended: {config.vmConfig.defaultMemoryMB >= 1024 ? `${config.vmConfig.defaultMemoryMB / 1024} GB` : `${config.vmConfig.defaultMemoryMB} MB`}</p>
                    </div>
                  )}

                  {step === "disk" && (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500">Select a virtual hard disk for the machine.</p>
                      <label className="flex items-center gap-3 p-3 border-2 border-[#4a8cff] bg-blue-50/50 rounded-lg cursor-pointer">
                        <input type="radio" name="disk" checked={createDisk} onChange={() => setCreateDisk(true)}
                          className="accent-[#4a8cff]" />
                        <div>
                          <div className="text-sm font-medium text-gray-800">Create a virtual hard disk now</div>
                          <div className="text-[10px] text-gray-500">A dynamically allocated VDI file will be created.</div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                        <input type="radio" name="disk" checked={!createDisk} onChange={() => setCreateDisk(false)}
                          className="accent-[#4a8cff]" />
                        <div>
                          <div className="text-sm font-medium text-gray-800">Use an existing virtual hard disk file</div>
                          <div className="text-[10px] text-gray-500">Attach a pre-existing disk image.</div>
                        </div>
                      </label>
                      {createDisk && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Disk size:</label>
                          <div className="flex items-center gap-4">
                            <input type="range" min={4} max={256} step={1} value={diskGB}
                              onChange={e => setDiskGB(Number(e.target.value))}
                              className="flex-1 accent-[#4a8cff]" />
                            <div className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-medium text-gray-800 min-w-[70px] text-center">
                              {diskGB} GB
                            </div>
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-400 px-1 mt-1">
                            <span>4 GB</span>
                            <span>256 GB</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">Recommended: {config.vmConfig.defaultDiskGB} GB</p>
                        </div>
                      )}
                    </div>
                  )}

                  {step === "summary" && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">Review the configuration below before creating the VM.</p>
                      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {[
                          ["Name", vmName],
                          ["Type", osType],
                          ["Version", osVersion],
                          ["Memory", memoryMB >= 1024 ? `${(memoryMB / 1024).toFixed(1)} GB` : `${memoryMB} MB`],
                          ["Disk", createDisk ? `${diskGB} GB (new VDI)` : "Existing file"],
                        ].map(([l, v]) => (
                          <div key={l} className="flex justify-between px-4 py-2 text-xs">
                            <span className="text-gray-500">{l}</span>
                            <span className="text-gray-800 font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <button onClick={handleBack} disabled={currentIdx === 0}
                  className="text-xs font-medium px-4 py-1.5 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-all">
                  Back
                </button>
                <button onClick={handleNext}
                  className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110 transition-all"
                  style={{ background: "#4a8cff" }}>
                  {step === "summary" ? "Create" : "Continue"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#2a2a2a] border-t border-gray-600/40 px-2 py-0.5 flex items-center gap-2 rounded-b-2xl">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
            <span className="text-[7px] text-gray-400">
              {step === "name" && "Name and operating system"}
              {step === "memory" && "Memory size"}
              {step === "disk" && "Hard disk"}
              {step === "summary" && "Summary"}
            </span>
          </div>
          <div className="flex-1" />
          <span className="text-[7px] text-gray-500">Step {currentIdx + 1} / {steps.length}</span>
        </div>
      </div>
    </div>
  );
}
