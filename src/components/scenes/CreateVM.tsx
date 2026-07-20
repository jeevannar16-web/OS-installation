import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick, playSuccess } from "../shared/sounds";
import type { OSConfig } from "../../data/types";
import { useSceneAdvance } from "../shared/SceneAdvance";

type Step = "name" | "hardware" | "disk" | "summary";

const MACHINES_FOLDER = "/home/user/VirtualBox VMs";

const OS_TYPE_OPTIONS = ["Linux", "Microsoft Windows", "Mac OS X", "BSD", "Solaris", "Other"];

const OS_VERSION_OPTIONS: Record<string, string[]> = {
  "Linux": [
    "Ubuntu (64-bit)", "Ubuntu (32-bit)", "Debian (64-bit)", "Debian (32-bit)",
    "Fedora (64-bit)", "Red Hat (64-bit)", "Arch Linux (64-bit)", "Linux Mint (64-bit)",
    "Zorin (64-bit)", "Manjaro (64-bit)", "openSUSE (64-bit)", "Other Linux (64-bit)",
  ],
  "Microsoft Windows": [
    "Windows 11 (64-bit)", "Windows 10 (64-bit)", "Windows 8.1 (64-bit)",
    "Windows 8 (64-bit)", "Windows 7 (64-bit)", "Windows Vista (64-bit)",
    "Windows XP (32-bit)", "Windows 2000",
  ],
  "Mac OS X": ["macOS 14 Sonoma", "macOS 13 Ventura", "macOS 12 Monterey", "macOS 11 Big Sur"],
  "BSD": ["FreeBSD (64-bit)", "OpenBSD (64-bit)", "NetBSD (64-bit)"],
  "Solaris": ["Solaris 11 (64-bit)", "Oracle Solaris 10"],
  "Other": ["Other (64-bit)", "Other (32-bit)", "MS-DOS", "IBM OS/2"],
};

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: "name", label: "Name and operating system", num: 1 },
  { key: "hardware", label: "Hardware", num: 2 },
  { key: "disk", label: "Virtual hard disk", num: 3 },
  { key: "summary", label: "Summary", num: 4 },
];

export default function CreateVM({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  useSceneAdvance();
  const [step, setStep] = useState<Step>("name");
  const [vmName, setVmName] = useState(config.branding.shortName + " VM");
  const [osType, setOsType] = useState(config.vmConfig.osType);
  const [osVersion, setOsVersion] = useState(config.vmConfig.osVersion);
  const [memoryMB, setMemoryMB] = useState(config.vmConfig.defaultMemoryMB);
  const [cpuCores, setCpuCores] = useState(2);
  const [enableEFI, setEnableEFI] = useState(config.id === "windows");
  const [diskGB, setDiskGB] = useState(config.vmConfig.defaultDiskGB);
  const [createDisk, setCreateDisk] = useState(true);
  const [diskType, setDiskType] = useState<"VDI" | "VHD" | "VMDK">("VDI");
  const [diskAlloc, setDiskAlloc] = useState<"dyn" | "fixed">("dyn");

  const currentIdx = STEPS.findIndex(s => s.key === step);
  const machineFolder = useMemo(() => `${MACHINES_FOLDER}/${vmName}`, [vmName]);

  function handleNext() {
    if (step === "summary") { playSuccess(); onComplete(); return; }
    playClick();
    setStep(STEPS[currentIdx + 1].key);
  }

  function handleBack() {
    if (currentIdx <= 0) return;
    playClick();
    setStep(STEPS[currentIdx - 1].key);
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 select-none">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Title bar */}
        <div className="flex items-center bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-4 py-2 border-b border-gray-200 shrink-0">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <span className="flex-1 text-center text-[11px] text-gray-600 font-bold tracking-tight">Create Virtual Machine</span>
          <span className="text-gray-400 text-xs cursor-default hover:text-gray-600">✕</span>
        </div>

        <div className="flex flex-1 min-h-[360px]">
          {/* Left sidebar — step indicator */}
          <div className="w-44 bg-[#f5f5f5] border-r border-gray-200 p-4 shrink-0">
            {STEPS.map((s, i) => {
              const isActive = i === currentIdx;
              const isPast = i < currentIdx;
              return (
                <div key={s.key} className="flex items-start gap-3 mb-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-all ${
                    isActive ? "bg-[#4a8cff] text-white shadow-sm" :
                    isPast ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}>{isPast ? "✓" : s.num}</div>
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-semibold leading-tight ${
                      isActive ? "text-[#4a8cff]" : isPast ? "text-green-700" : "text-gray-400"
                    }`}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right — content */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 p-5 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.12 }}>
                  {step === "name" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Name:</label>
                        <input type="text" value={vmName} onChange={e => setVmName(e.target.value)} autoFocus
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff] focus:ring-1 focus:ring-[#4a8cff] transition-colors" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Machine Folder:</label>
                        <div className="flex items-center gap-1">
                          <input type="text" value={machineFolder} readOnly
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-[11px] text-gray-500 bg-gray-50 outline-none font-mono" />
                          <button className="px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-500 text-xs transition-all">📁</button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">ISO Image:</label>
                        <div className="flex items-center gap-1">
                          <select value={osVersion} onChange={() => { playClick(); }}
                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-[11px] text-gray-800 bg-white outline-none cursor-pointer">
                            <option value="">Not selected</option>
                            <option value={osVersion}>{config.iso.filename} ({config.iso.size})</option>
                          </select>
                          <button className="px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-500 text-xs transition-all">📂</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Type:</label>
                          <select value={osType} onChange={e => { playClick(); setOsType(e.target.value); setOsVersion(OS_VERSION_OPTIONS[e.target.value][0]); }}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff] cursor-pointer">
                            {OS_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Version:</label>
                          <select value={osVersion} onChange={e => { playClick(); setOsVersion(e.target.value); }}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff] cursor-pointer">
                            {OS_VERSION_OPTIONS[osType]?.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked onChange={() => { playClick(); }}
                          className="accent-[#4a8cff] w-4 h-4" />
                        <span className="text-[10px] text-gray-500">Skip Unattended Installation</span>
                      </label>
                    </div>
                  )}

                  {step === "hardware" && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Base Memory: <span className="text-gray-800 ml-1">{memoryMB >= 1024 ? `${(memoryMB / 1024).toFixed(1)} GB` : `${memoryMB} MB`}</span>
                        </label>
                        <input type="range" min={512} max={16384} step={256} value={memoryMB}
                          onChange={e => setMemoryMB(Number(e.target.value))}
                          className="w-full accent-[#4a8cff] h-2" />
                        <div className="flex justify-between text-[9px] text-gray-400 px-1 mt-0.5">
                          <span>512 MB</span><span>16 GB</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          Processors: <span className="text-gray-800 ml-1">{cpuCores} CPU{cpuCores > 1 ? "s" : ""}</span>
                        </label>
                        <input type="range" min={1} max={8} step={1} value={cpuCores}
                          onChange={e => setCpuCores(Number(e.target.value))}
                          className="w-full accent-[#4a8cff] h-2" />
                        <div className="flex justify-between text-[9px] text-gray-400 px-1 mt-0.5">
                          <span>1 CPU</span><span>8 CPUs</span>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={enableEFI} onChange={() => { playClick(); setEnableEFI(!enableEFI); }}
                          className="accent-[#4a8cff] w-4 h-4" />
                        <span className="text-[10px] text-gray-500">Enable EFI (special OSes only)</span>
                      </label>
                    </div>
                  )}

                  {step === "disk" && (
                    <div className="space-y-4">
                      <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        createDisk ? "border-[#4a8cff] bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                      }`}>
                        <input type="radio" name="disk" checked={createDisk} onChange={() => setCreateDisk(true)}
                          className="accent-[#4a8cff] mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-800">Create a virtual hard disk now</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">A dynamically allocated VDI file will be created in the machine folder.</div>
                        </div>
                      </label>
                      <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        !createDisk ? "border-[#4a8cff] bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                      }`}>
                        <input type="radio" name="disk" checked={!createDisk} onChange={() => setCreateDisk(false)}
                          className="accent-[#4a8cff] mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-800">Use an existing virtual hard disk file</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">Attach a pre-existing disk image (VDI, VHD, VMDK).</div>
                        </div>
                      </label>

                      {createDisk && (
                        <div className="space-y-4 pl-1">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Disk size: <span className="text-gray-800 ml-1">{diskGB} GB</span>
                            </label>
                            <input type="range" min={4} max={256} step={1} value={diskGB}
                              onChange={e => setDiskGB(Number(e.target.value))}
                              className="w-full accent-[#4a8cff] h-2" />
                            <div className="flex justify-between text-[9px] text-gray-400 px-1 mt-0.5">
                              <span>4 GB</span><span>256 GB</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Hard disk file type:</label>
                              <select value={diskType} onChange={e => { playClick(); setDiskType(e.target.value as any); }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff] cursor-pointer">
                                <option value="VDI">VDI (VirtualBox Disk Image)</option>
                                <option value="VHD">VHD (Virtual Hard Disk)</option>
                                <option value="VMDK">VMDK (Virtual Machine Disk)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Storage on physical disk:</label>
                              <select value={diskAlloc} onChange={e => { playClick(); setDiskAlloc(e.target.value as any); }}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff] cursor-pointer">
                                <option value="dyn">Dynamically allocated</option>
                                <option value="fixed">Fixed size</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step === "summary" && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {[
                          ["Name", vmName],
                          ["Machine Folder", machineFolder],
                          ["ISO Image", config.iso.filename],
                          ["Type / Version", `${osType} - ${osVersion}`],
                          ["Memory", memoryMB >= 1024 ? `${(memoryMB / 1024).toFixed(1)} GB` : `${memoryMB} MB`],
                          ["Processors", `${cpuCores} CPU${cpuCores > 1 ? "s" : ""}`],
                          ["EFI", enableEFI ? "Enabled" : "Disabled"],
                          ["Disk", createDisk ? `${diskGB} GB ${diskType} (${diskAlloc === "dyn" ? "Dynamic" : "Fixed"})` : "Existing file"],
                        ].map(([l, v]) => (
                          <div key={l} className="flex justify-between px-4 py-2 text-xs">
                            <span className="text-gray-500">{l}</span>
                            <span className="text-gray-800 font-semibold ml-4 text-right truncate max-w-[55%]">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[10px] text-amber-800/70">
                        Once created, you can change VM settings later from the Manager.
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
              <button onClick={handleBack} disabled={currentIdx === 0}
                className="text-xs font-medium px-4 py-1.5 rounded text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-all">
                Back
              </button>
              <button onClick={handleNext}
                className="rounded-lg px-5 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-40"
                style={{ background: "#4a8cff" }}>
                {step === "summary" ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
