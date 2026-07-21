import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playSuccess } from "../shared/sounds";

type Cat = "general" | "system" | "display" | "storage" | "audio" | "network" | "usb" | "shared_folders";

const CATEGORIES: { id: Cat; label: string; icon: string }[] = [
  { id: "general", label: "General", icon: "⚙" },
  { id: "system", label: "System", icon: "🖥" },
  { id: "display", label: "Display", icon: "🖵" },
  { id: "storage", label: "Storage", icon: "💾" },
  { id: "audio", label: "Audio", icon: "🔊" },
  { id: "network", label: "Network", icon: "🌐" },
  { id: "usb", label: "USB", icon: "🔌" },
  { id: "shared_folders", label: "Shared Folders", icon: "📁" },
];

const SLOT_OPTIONS = [
  "IDE Primary Master", "IDE Primary Slave", "IDE Secondary Master", "IDE Secondary Slave",
  "SATA Port 0", "SATA Port 1", "SATA Port 2", "SATA Port 3",
];

const ADAPTER_TYPES = ["Intel PRO/1000 MT Desktop (82540EM)", "Intel PRO/1000 T Server (82543GC)", "Paravirtualized Network (virtio-net)"];

export default function MountISO({ config, onComplete }: { config: OSConfig; onComplete: () => void }) {
  const [phase, setPhase] = useState<"settings" | "browsing" | "attached">("settings");
  const [activeCat, setActiveCat] = useState<Cat>("storage");

  function handleBrowseClick() {
    if (phase !== "settings") return;
    playClick();
    setPhase("browsing");
    setTimeout(() => { setPhase("attached"); playSuccess(); }, 1400);
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-gray-600/30 shadow-2xl flex flex-col font-sans select-none"
        style={{ background: "linear-gradient(180deg, #3c3c3c 0%, #323232 100%)" }}>
        {/* ─── VirtualBox Manager ─── */}
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

        {/* ─── Modal: VM Settings ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a24] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden border border-white/[0.08] max-h-full">
            {/* Dialog title bar */}
            <div className="flex items-center gap-2 bg-gradient-to-b from-[#2a2a3a] to-[#1e1e2e] px-4 py-2.5 border-b border-white/[0.06] shrink-0">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
              </div>
              <span className="flex-1 text-center text-[11px] text-white/70 font-bold">{config.branding.shortName} — Settings</span>
              <span className="text-white/30 text-xs cursor-default hover:text-white/50">✕</span>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Category sidebar */}
              <div className="w-36 sm:w-40 bg-[#14141e] border-r border-white/[0.06] p-2 overflow-y-auto shrink-0">
                {CATEGORIES.map(cat => (
                  <div key={cat.id} onClick={() => { playClick(); setActiveCat(cat.id); }}
                    className={`flex items-center gap-2 text-[10px] px-2.5 py-1.5 rounded mb-0.5 font-semibold transition-all cursor-pointer ${
                      cat.id === activeCat ? "bg-[#4a8cff] text-white" : "text-white/40 hover:bg-white/[0.08]"
                    }`}>
                    <span className="text-[11px]">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                ))}
              </div>

              {/* Content panel */}
              <div className="flex-1 bg-[#1a1a24] overflow-y-auto p-4 sm:p-5">
                <AnimatePresence mode="wait">
                  <motion.div key={activeCat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                    {activeCat === "storage" && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-white/70">Storage Devices</h3>
                        {/* Storage Tree */}
                        <div className="border border-white/[0.08] rounded-lg divide-y divide-white/[0.06]">
                          <div className="p-3 bg-white/[0.04]">
                            <div className="flex items-center gap-1 text-[10px] text-white/40 font-semibold mb-1">
                              <span className="text-white/30 text-[8px]">▶</span> Controller: IDE
                            </div>
                            <div className="ml-4 pl-3 border-l-2 border-white/[0.1] space-y-1">
                              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] transition-all ${
                                phase === "attached" ? "bg-[#1e3a5f]/60 text-blue-300 font-medium" : "bg-white/[0.06] text-white/50"
                              }`}>
                                <span className="text-[11px]">💿</span>
                                <span>{phase === "attached" ? config.iso.filename : "Empty"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="flex items-center gap-1 text-[10px] text-white/40 font-semibold mb-1">
                              <span className="text-white/30 text-[8px]">▶</span> Controller: SATA
                            </div>
                            <div className="ml-4 pl-3 border-l-2 border-white/[0.1] space-y-1">
                              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-white/[0.06] text-[10px] text-white/50">
                                <span className="text-[11px]">💾</span>
                                <span>{config.branding.shortName}.vdi</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Attributes */}
                        <div className="border border-white/[0.08] rounded-lg p-3">
                          <h4 className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-2">Attributes</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] text-white/40 font-semibold mb-1">Slot:</label>
                              <select className="w-full border border-white/[0.12] rounded px-2 py-1.5 text-[11px] text-white/80 bg-white/[0.06] outline-none focus:border-[#4a8cff] cursor-pointer">
                                {SLOT_OPTIONS.map(s => <option key={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] text-white/40 font-semibold mb-1">Live CD/DVD:</label>
                              <input type="checkbox" defaultChecked className="accent-[#4a8cff] mt-1.5 w-4 h-4 cursor-pointer" />
                            </div>
                          </div>
                          {phase === "settings" && (
                            <button onClick={handleBrowseClick}
                              className="mt-3 text-[10px] text-[#4a8cff] hover:underline font-medium">
                              Choose a disk file…
                            </button>
                          )}
                          {phase === "attached" && (
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-green-300 bg-green-900/30 border border-green-700/40 rounded px-3 py-2">
                              <span>✓</span> {config.iso.filename} mounted
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="text-[9px] text-white/30 font-mono">Information: ATAPI — {config.iso.size}</div>
                      </div>
                    )}

                    {activeCat === "general" && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-white/70">General</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] text-white/40 font-semibold mb-1">Name:</label>
                            <input type="text" value={config.branding.shortName + " VM"} readOnly
                              className="w-full border border-white/[0.12] rounded px-3 py-2 text-xs text-white/60 bg-white/[0.04] outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/40 font-semibold mb-1">Operating System:</label>
                            <input type="text" value={`${config.vmConfig.osType} — ${config.vmConfig.osVersion}`} readOnly
                              className="w-full border border-white/[0.12] rounded px-3 py-2 text-xs text-white/60 bg-white/[0.04] outline-none" />
                          </div>
                          <div>
                            <label className="block text-[10px] text-white/40 font-semibold mb-1">Machine Folder:</label>
                            <input type="text" value={`/home/user/VirtualBox VMs/${config.branding.shortName} VM`} readOnly
                              className="w-full border border-white/[0.12] rounded px-3 py-2 text-xs text-white/60 bg-white/[0.04] outline-none" />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeCat === "system" && (
                      <div className="space-y-5">
                        <h3 className="text-xs font-bold text-white/70">System</h3>
                        <div>
                          <h4 className="text-[10px] font-semibold text-white/50 mb-2">Motherboard</h4>
                          <div className="space-y-3 pl-2">
                            <div>
                              <label className="block text-[9px] text-white/40 mb-1">Base Memory:</label>
                              <div className="flex items-center gap-3">
                                <input type="range" min={512} max={16384} step={256} defaultValue={config.vmConfig.defaultMemoryMB}
                                  className="flex-1 accent-[#4a8cff] h-2" />
                                <span className="text-[10px] font-semibold text-white/70 min-w-[14px]">{config.vmConfig.defaultMemoryMB} MB</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-[10px]">
                              <span className="text-white/40">Boot Order:</span>
                              <span className="text-white/70">Floppy, Optical, Hard Disk</span>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" defaultChecked={config.id === "windows"} className="accent-[#4a8cff] w-4 h-4" />
                              <span className="text-[10px] text-white/40">Enable EFI</span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-semibold text-white/50 mb-2">Processor</h4>
                          <div className="space-y-3 pl-2">
                            <div>
                              <label className="block text-[9px] text-white/40 mb-1">CPU Cores:</label>
                              <div className="flex items-center gap-3">
                                <input type="range" min={1} max={8} defaultValue={2}
                                  className="flex-1 accent-[#4a8cff] h-2" />
                                <span className="text-[10px] font-semibold text-white/70">2 CPUs</span>
                              </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" defaultChecked className="accent-[#4a8cff] w-4 h-4" />
                              <span className="text-[10px] text-white/40">Enable PAE/NX</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeCat === "display" && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-white/70">Display</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[9px] text-white/40 mb-1">Video Memory:</label>
                            <div className="flex items-center gap-3">
                              <input type="range" min={16} max={256} step={8} defaultValue={128}
                                className="flex-1 accent-[#4a8cff] h-2" />
                              <span className="text-[10px] font-semibold text-white/70 min-w-[16px]">128 MB</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] text-white/40 mb-1">Monitor Count:</label>
                            <select className="border border-white/[0.12] rounded px-2 py-1.5 text-[11px] text-white/80 bg-white/[0.06] outline-none focus:border-[#4a8cff] cursor-pointer">
                              <option>1</option><option>2</option><option>3</option><option>4</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] text-white/40 mb-1">Graphics Controller:</label>
                            <select className="border border-white/[0.12] rounded px-2 py-1.5 text-[11px] text-white/80 bg-white/[0.06] outline-none focus:border-[#4a8cff] cursor-pointer">
                              <option>VMSVGA</option><option>VBoxSVGA</option><option>VBoxVGA</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" defaultChecked className="accent-[#4a8cff] w-4 h-4" />
                              <span className="text-[10px] text-white/40">Enable 3D Acceleration</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="accent-[#4a8cff] w-4 h-4" />
                              <span className="text-[10px] text-white/40">Enable 2D Video Acceleration</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeCat === "audio" && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-white/70">Audio</h3>
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                          <input type="checkbox" defaultChecked className="accent-[#4a8cff] w-4 h-4" />
                          <span className="text-[10px] text-white/40">Enable Audio</span>
                        </label>
                        <div className="space-y-3 pl-2">
                          <div>
                            <label className="block text-[9px] text-white/40 mb-1">Host Audio Driver:</label>
                            <select className="border border-white/[0.12] rounded px-2 py-1.5 text-[11px] text-white/80 bg-white/[0.06] outline-none focus:border-[#4a8cff] cursor-pointer">
                              <option>Default</option><option>PulseAudio</option><option>ALSA</option><option>OSS</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] text-white/40 mb-1">Audio Controller:</label>
                            <select className="border border-white/[0.12] rounded px-2 py-1.5 text-[11px] text-white/80 bg-white/[0.06] outline-none focus:border-[#4a8cff] cursor-pointer">
                              <option>ICH AC97</option><option>SoundBlaster 16</option><option>Intel HD Audio</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeCat === "network" && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-white/70">Network</h3>
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                          <input type="checkbox" defaultChecked className="accent-[#4a8cff] w-4 h-4" />
                          <span className="text-[10px] text-white/40">Enable Network Adapter</span>
                        </label>
                        <div className="space-y-3 pl-2">
                          <div>
                            <label className="block text-[9px] text-white/40 mb-1">Attached to:</label>
                            <select className="border border-white/[0.12] rounded px-2 py-1.5 text-[11px] text-white/80 bg-white/[0.06] outline-none focus:border-[#4a8cff] cursor-pointer">
                              <option>NAT</option><option>Bridged Adapter</option><option>Internal Network</option><option>Host-Only Adapter</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] text-white/40 mb-1">Adapter Type:</label>
                            <select className="w-full border border-white/[0.12] rounded px-2 py-1.5 text-[11px] text-white/80 bg-white/[0.06] outline-none focus:border-[#4a8cff] cursor-pointer">
                              {ADAPTER_TYPES.map(a => <option key={a}>{a}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] text-white/40 mb-1">MAC Address:</label>
                            <input type="text" value="08:00:27:3A:5C:91" readOnly
                              className="border border-white/[0.12] rounded px-2 py-1.5 text-[10px] text-white/50 bg-white/[0.04] font-mono outline-none w-32" />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeCat === "usb" && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-white/70">USB</h3>
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                          <input type="checkbox" defaultChecked className="accent-[#4a8cff] w-4 h-4" />
                          <span className="text-[10px] text-white/40">Enable USB Controller</span>
                        </label>
                        <div className="space-y-2 pl-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="usb" defaultChecked className="accent-[#4a8cff] w-4 h-4" />
                            <span className="text-[10px] text-white/40">USB 1.1 (OHCI)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="usb" className="accent-[#4a8cff] w-4 h-4" />
                            <span className="text-[10px] text-white/40">USB 2.0 (EHCI)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="usb" className="accent-[#4a8cff] w-4 h-4" />
                            <span className="text-[10px] text-white/40">USB 3.0 (xHCI)</span>
                          </label>
                        </div>
                        <div className="border border-dashed border-white/[0.1] rounded-lg p-4 text-center text-[9px] text-white/30">
                          No USB filters configured. Use the + button to add filters.
                        </div>
                      </div>
                    )}

                    {activeCat === "shared_folders" && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-white/70">Shared Folders</h3>
                        <div className="border border-white/[0.08] rounded-lg overflow-hidden">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="bg-white/[0.04] text-white/40 text-[9px] uppercase tracking-wider">
                                <th className="text-left px-3 py-2 font-semibold">Name</th>
                                <th className="text-left px-3 py-2 font-semibold">Path</th>
                                <th className="text-center px-3 py-2 font-semibold">Auto-mount</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="hover:bg-white/[0.04]">
                                <td className="px-3 py-2 text-white/70 font-medium">Downloads</td>
                                <td className="px-3 py-2 text-white/40 font-mono">/home/user/Downloads</td>
                                <td className="px-3 py-2 text-center text-green-400">✓</td>
                              </tr>
                              <tr className="hover:bg-white/[0.04]">
                                <td className="px-3 py-2 text-white/70 font-medium">Documents</td>
                                <td className="px-3 py-2 text-white/40 font-mono">/home/user/Documents</td>
                                <td className="px-3 py-2 text-center" />
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="flex gap-1">
                          <button className="text-[9px] bg-[#4a8cff] text-white px-2 py-1 rounded font-medium hover:brightness-110">＋ Add</button>
                          <button className="text-[9px] bg-white/[0.08] text-white/40 px-2 py-1 rounded font-medium hover:bg-white/[0.12]">✏ Edit</button>
                          <button className="text-[9px] bg-white/[0.08] text-white/40 px-2 py-1 rounded font-medium hover:bg-white/[0.12]">− Remove</button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/[0.06] bg-[#14141e] shrink-0">
              <button onClick={() => { playClick(); onComplete(); }}
                className="text-xs font-medium px-4 py-1.5 rounded text-white/50 hover:bg-white/[0.08] transition-all">
                Cancel
              </button>
              {phase === "attached" && (
                <button onClick={() => { playClick(); onComplete(); }}
                  className="rounded-lg px-6 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition-all"
                  style={{ background: "#4a8cff" }}>
                  OK
                </button>
              )}
              {phase !== "attached" && (
                <button onClick={() => { playClick(); onComplete(); }}
                  className="rounded-lg px-6 py-1.5 text-xs font-bold text-white shadow-sm hover:brightness-110 transition-all"
                  style={{ background: "#4a8cff" }}>
                  OK
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Browsing overlay */}
        <AnimatePresence>
          {phase === "browsing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-[#1a1a24] rounded-xl shadow-2xl p-5 max-w-sm w-full border border-white/[0.08]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📂</span>
                  <h3 className="text-sm font-bold text-white/80">Select optical disk image</h3>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <span>💿</span>
                    <span className="font-semibold">{config.iso.filename}</span>
                    <span className="text-white/30 ml-auto text-xs">{config.iso.size}</span>
                  </div>
                  <div className="text-[10px] text-white/30 mt-1 ml-7 font-mono">/home/user/Downloads</div>
                </div>
                <motion.div className="h-1.5 rounded-full bg-[#1e3a5f]/60 overflow-hidden mb-3">
                  <motion.div className="h-full bg-[#4a8cff]" initial={{ width: "0%" }}
                    animate={{ width: "100%" }} transition={{ duration: 1.2, ease: "easeInOut" }} />
                </motion.div>
                <div className="flex justify-end">
                  <button disabled className="text-xs font-bold bg-white/[0.08] text-white/30 px-5 py-2 rounded-lg">Attaching…</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
