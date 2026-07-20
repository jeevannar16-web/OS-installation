import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick, playKeyClick, playSuccess } from "../shared/sounds";
import type { OSConfig } from "../../data/types";

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

const STEP_NUMS: Step[] = ["name", "hardware", "disk", "summary"];
const STEP_LABELS: Record<Step, string> = {
  name: "Name and operating system",
  hardware: "Hardware",
  disk: "Virtual hard disk",
  summary: "Summary",
};

export default function CreateVM({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
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
  const [preAllocFull, setPreAllocFull] = useState(false);

  const currentIdx = STEP_NUMS.indexOf(step);

  const machineFolder = useMemo(() => `${MACHINES_FOLDER}/${vmName}`, [vmName]);

  function handleNext() {
    if (step === "summary") { playSuccess(); onComplete(); return; }
    playClick();
    setStep(STEP_NUMS[currentIdx + 1]);
  }

  function handleBack() {
    if (currentIdx <= 0) return;
    playClick();
    setStep(STEP_NUMS[currentIdx - 1]);
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col rounded-2xl border border-gray-600/30 shadow-2xl font-sans overflow-hidden select-none"
        style={{ background: "linear-gradient(180deg, #3c3c3c 0%, #323232 100%)" }}>
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-3 py-1.5 shrink-0">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>
          <div className="flex items-center gap-1.5 mx-auto text-[10px] text-gray-600 font-semibold">
            <span className="text-[11px] text-[#4a8cff]">⬡</span>
            <span>Oracle VM VirtualBox Manager</span>
          </div>
          <div className="flex gap-1">
            <div className="h-2.5 w-3 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2.5 w-3 rounded-sm bg-gray-300 border border-gray-400/50" />
            <div className="h-2.5 w-3 rounded-sm bg-gray-300 border border-gray-400/50" />
          </div>
        </div>

        {/* Menu bar */}
        <div className="flex items-center gap-2 bg-[#f0f0f0] px-2 py-1 border-b border-gray-300/60 shrink-0">
          {["Machine", "Help"].map(m => (
            <span key={m} className="text-[9px] text-gray-500 px-2 py-0.5 hover:bg-gray-200 rounded cursor-default font-medium">{m}</span>
          ))}
          <div className="flex-1" />
          <span className="text-[8px] text-gray-400">VirtualBox 7.0.18</span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* VM List sidebar */}
          <div className="w-44 bg-[#f5f5f5] border-r border-gray-300/40 p-2 hidden sm:flex sm:flex-col shrink-0">
            <div className="text-[8px] text-gray-500 uppercase tracking-wider font-bold mb-1.5 px-1">Virtual Machines</div>
            <div className="rounded-md bg-gradient-to-r from-[#4a8cff]/10 to-transparent border border-[#4a8cff]/30 px-2 py-2 text-[9px] font-semibold text-gray-700 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm" />
              <span className="truncate">{config.branding.shortName}</span>
            </div>
            <div className="mt-1 text-[8px] text-gray-400 px-2 py-1">Powered Off</div>
          </div>

          {/* Wizard content */}
          <div className="flex-1 bg-[#f0f0f0] flex flex-col overflow-hidden">
            {/* Step indicator bar (real VBox 7.0 style) */}
            <div className="flex items-center gap-0 px-6 pt-4 pb-2 bg-white border-b border-gray-200/60 shrink-0">
              {STEP_NUMS.map((s, i) => {
                const isActive = i === currentIdx;
                const isPast = i < currentIdx;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 ${i > 0 ? "ml-2" : ""}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isActive ? "bg-[#4a8cff] text-white shadow-sm" :
                        isPast ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                      }`}>
                        {isPast ? "✓" : i + 1}
                      </div>
                      <span className={`text-[10px] font-semibold whitespace-nowrap ${
                        isActive ? "text-[#4a8cff]" : isPast ? "text-green-600" : "text-gray-400"
                      }`}>{STEP_LABELS[s]}</span>
                    </div>
                    {i < STEP_NUMS.length - 1 && (
                      <div className={`w-8 h-px mx-1 ${isPast ? "bg-green-300" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}>
                    {step === "name" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Name:</label>
                          <input type="text" value={vmName} onChange={e => { playKeyClick(); setVmName(e.target.value); }} autoFocus
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff] focus:ring-1 focus:ring-[#4a8cff] transition-colors" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Machine Folder:</label>
                          <div className="flex items-center gap-1">
                            <input type="text" value={machineFolder} readOnly
                              className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs text-gray-500 bg-gray-100 outline-none font-mono" />
                            <button className="px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-500 text-xs transition-all">📁</button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">ISO Image:</label>
                          <div className="flex items-center gap-1">
                            <select value={osVersion} onChange={() => { playClick(); }}
                              className="flex-1 border border-gray-300 rounded px-3 py-2 text-xs text-gray-400 bg-white outline-none cursor-pointer">
                              <option value="">Not selected</option>
                              <option value={osVersion}>{config.iso.filename} ({config.iso.size})</option>
                            </select>
                            <button className="px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-100 text-gray-500 text-xs transition-all">📂</button>
                          </div>
                          <p className="text-[9px] text-gray-400 mt-1">Select an ISO file to install from (optional).</p>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Type:</label>
                            <select value={osType} onChange={e => { playClick(); setOsType(e.target.value); setOsVersion(OS_VERSION_OPTIONS[e.target.value][0]); }}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff] cursor-pointer">
                              {OS_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Version:</label>
                            <select value={osVersion} onChange={e => { playClick(); setOsVersion(e.target.value); }}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff] cursor-pointer">
                              {OS_VERSION_OPTIONS[osType]?.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked onChange={() => { playClick(); }}
                            className="accent-[#4a8cff] w-4 h-4" />
                          <span className="text-[11px] text-gray-500">Skip Unattended Installation</span>
                        </label>
                      </div>
                    )}

                    {step === "hardware" && (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Memory size: <span className="text-gray-800 ml-1">{memoryMB >= 1024 ? `${(memoryMB / 1024).toFixed(1)} GB` : `${memoryMB} MB`}</span>
                          </label>
                          <input type="range" min={512} max={16384} step={256} value={memoryMB}
                            onChange={e => setMemoryMB(Number(e.target.value))}
                            className="w-full accent-[#4a8cff] h-2" />
                          <div className="flex justify-between text-[9px] text-gray-400 px-1 mt-0.5">
                            <span>512 MB</span>
                            <span>16 GB</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            Recommended: {config.vmConfig.defaultMemoryMB >= 1024 ? `${config.vmConfig.defaultMemoryMB / 1024} GB` : `${config.vmConfig.defaultMemoryMB} MB`}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Processors: <span className="text-gray-800 ml-1">{cpuCores} CPU{cpuCores > 1 ? "s" : ""}</span>
                          </label>
                          <input type="range" min={1} max={8} step={1} value={cpuCores}
                            onChange={e => setCpuCores(Number(e.target.value))}
                            className="w-full accent-[#4a8cff] h-2" />
                          <div className="flex justify-between text-[9px] text-gray-400 px-1 mt-0.5">
                            <span>1 CPU</span>
                            <span>8 CPUs</span>
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer mt-2">
                          <input type="checkbox" checked={enableEFI} onChange={() => { playClick(); setEnableEFI(!enableEFI); }}
                            className="accent-[#4a8cff] w-4 h-4" />
                          <span className="text-[11px] text-gray-500">Enable EFI (special OSes only)</span>
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
                            <div className="text-[11px] text-gray-500 mt-0.5">A dynamically allocated VDI file will be created in the machine folder.</div>
                          </div>
                        </label>
                        <label className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          !createDisk ? "border-[#4a8cff] bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                        }`}>
                          <input type="radio" name="disk" checked={!createDisk} onChange={() => setCreateDisk(false)}
                            className="accent-[#4a8cff] mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-800">Use an existing virtual hard disk file</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">Attach a pre-existing disk image (VDI, VHD, VMDK).</div>
                          </div>
                        </label>

                        {createDisk && (
                          <div className="space-y-4 pl-1">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Disk size: <span className="text-gray-800 ml-1">{diskGB} GB</span>
                              </label>
                              <input type="range" min={4} max={256} step={1} value={diskGB}
                                onChange={e => setDiskGB(Number(e.target.value))}
                                className="w-full accent-[#4a8cff] h-2" />
                              <div className="flex justify-between text-[9px] text-gray-400 px-1 mt-0.5">
                                <span>4 GB</span>
                                <span>256 GB</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Hard disk file type:</label>
                                <select value={diskType} onChange={e => { playClick(); setDiskType(e.target.value as any); }}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff] cursor-pointer">
                                  <option value="VDI">VDI (VirtualBox Disk Image)</option>
                                  <option value="VHD">VHD (Virtual Hard Disk)</option>
                                  <option value="VMDK">VMDK (Virtual Machine Disk)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Storage on physical disk:</label>
                                <select value={diskAlloc} onChange={e => { playClick(); setDiskAlloc(e.target.value as any); }}
                                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-[#4a8cff] cursor-pointer">
                                  <option value="dyn">Dynamically allocated</option>
                                  <option value="fixed">Fixed size</option>
                                </select>
                              </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={preAllocFull} onChange={() => { playClick(); setPreAllocFull(!preAllocFull); }}
                                className="accent-[#4a8cff] w-4 h-4" />
                              <span className="text-[11px] text-gray-500">Pre-allocate Full Size</span>
                            </label>

                            <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-[11px] text-green-800/70 leading-relaxed">
                              The virtual hard disk file will be created at:<br />
                              <span className="font-mono text-[10px]">{machineFolder}/{vmName}.{diskType.toLowerCase()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {step === "summary" && (
                      <div className="space-y-4">
                        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                          {[
                            ["Name", vmName],
                            ["Machine Folder", machineFolder],
                            ["ISO Image", config.iso.filename],
                            ["Type", osType],
                            ["Version", osVersion],
                            ["Memory", memoryMB >= 1024 ? `${(memoryMB / 1024).toFixed(1)} GB` : `${memoryMB} MB`],
                            ["Processors", `${cpuCores} CPU${cpuCores > 1 ? "s" : ""}`],
                            ["EFI", enableEFI ? "Enabled" : "Disabled"],
                            ["Disk type", createDisk ? `${diskType} (${diskAlloc === "dyn" ? "Dynamically allocated" : "Fixed size"})` : "Existing file"],
                            ["Disk size", createDisk ? `${diskGB} GB` : "N/A"],
                            ["Pre-allocate", preAllocFull ? "Full size" : "No"],
                          ].map(([l, v]) => (
                            <div key={l} className="flex justify-between px-4 py-2.5 text-sm">
                              <span className="text-gray-500">{l}</span>
                              <span className="text-gray-800 font-semibold max-w-[50%] text-right truncate">{v}</span>
                            </div>
                          ))}
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-[11px] text-blue-800/70">
                          Once created, you can change VM settings later from the VirtualBox Manager.
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <button onClick={handleBack} disabled={currentIdx === 0}
                    className="text-sm font-medium px-5 py-2 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-30 transition-all">
                    Back
                  </button>
                  <button onClick={handleNext}
                    className="rounded-lg px-6 py-2 text-sm font-bold text-white shadow-sm hover:brightness-110 transition-all disabled:opacity-40"
                    style={{ background: "#4a8cff" }}>
                    {step === "summary" ? "Finish" : "Continue"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-[#2a2a2a] border-t border-gray-600/40 px-3 py-1 flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
            <span className="text-[8px] text-gray-400">{STEP_LABELS[step]}</span>
          </div>
          <div className="flex-1" />
          <span className="text-[8px] text-gray-500">Step {currentIdx + 1} / {STEP_NUMS.length}</span>
        </div>
      </div>
    </div>
  );
}
