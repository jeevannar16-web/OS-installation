import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import FilePickerModal from "../shared/FilePickerModal";
import { playUsbConnect, playSuccess, playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";


const SUPPORTED_TOOLS = new Set(["rufus", "ventoy", "balena"]);

const USB_DEVICES = [
  { id: "usb-e", label: "(E:) USB Drive — 32 GB", short: "USB Drive (E:)", sizeGB: 32 },
  { id: "usb-f", label: "(F:) USB Drive — 16 GB", short: "USB Drive (F:)", sizeGB: 16 },
];

function parseSizeGB(s: string) {
  const m = s.match(/([\d.]+)\s*GB/i);
  return m ? parseFloat(m[1]) : 0;
}

/* ═══════════════════════════════════════════════════════════════
   RUFUS — Interactive Win32-style UI
   ═══════════════════════════════════════════════════════════════ */
function RufusTool({
  config,
  speed,
  onComplete,
  setRufusPartitionScheme,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
  setRufusPartitionScheme: (v: "GPT" | "MBR") => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [device, setDevice] = useState(USB_DEVICES[0].id);
  const [isoFile, setIsoFile] = useState<string | null>(null);
  const [rufusPhase, setRufusPhase] = useState<"idle" | "flashing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [partitionScheme, setPartitionScheme] = useState<"GPT" | "MBR">("GPT");
  const [partitionSchemeOpen, setPartitionSchemeOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const dur = speed === "fast" ? 1800 : 6000;

  const logs = [
    "Rufus v4.5.2180 — Detected device: Generic Flash Disk 8.0",
    `Using ISO: ${config.iso.filename}`,
    "Formatting: NTFS (Quick)…",
    "✓ File system created.",
    "Copying ISO files…",
    `  → ${config.iso.filename} (${config.iso.size})`,
    "Writing master boot record…",
    "Installing Syslinux bootloader…",
    "Finalizing…",
    "✓ Done. Device is ready.",
  ];

  useEffect(() => {
    if (rufusPhase !== "flashing") return;
    setLogLines([]);
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    let idx = 0;
    const iv = setInterval(() => {
      if (idx < logs.length) {
        const entry = logs[idx];
        idx++;
        setLogLines((p) => [...p, entry]);
      }
    }, dur / logs.length);
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / dur) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        clearInterval(iv);
        playSuccess();
        setRufusPhase("done");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rufusPhase]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logLines]);

  useEffect(() => {
    if (rufusPhase === "done") {
      registerAdvance(() => onComplete());
    }
  }, [rufusPhase, registerAdvance, onComplete]);

  const selected = USB_DEVICES.find((d) => d.id === device);
  const isoGB = isoFile ? parseSizeGB(config.iso.size) : 0;
  const tooSmall = selected && isoGB > 0 && isoGB > selected.sizeGB;

  return (
    <div className="mx-auto w-full max-w-2xl rounded-lg overflow-hidden shadow-2xl shadow-black/50" style={{ border: "1px solid #555" }}>
      {/* Windows title bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#0054a6] to-[#0078d4] px-2 py-1 select-none">
        <div className="flex items-center gap-2">
          <img src="/images/flash-tools/rufus.jpg" alt="" className="h-4 w-4 rounded-sm" />
          <span className="text-[11px] text-white font-medium">Rufus v4.5.2180</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button className="w-6 h-5 flex items-center justify-center text-white/80 hover:bg-white/10 text-[10px]">─</button>
          <button className="w-6 h-5 flex items-center justify-center text-white/80 hover:bg-white/10 text-[10px]">□</button>
          <button className="w-6 h-5 flex items-center justify-center text-white/80 hover:bg-red-500 text-[10px]">✕</button>
        </div>
      </div>

      {/* Rufus green header */}
      <div className="bg-gradient-to-b from-[#5ba06c] to-[#4a8c5c] px-4 py-2.5 flex items-center gap-3">
        <img src="/images/flash-tools/rufus.jpg" alt="Rufus" className="h-8 w-8 rounded" />
        <div>
          <div className="text-white font-bold text-sm">Rufus</div>
          <div className="text-white/70 text-[10px]">FreeDOS / ISO Image</div>
        </div>
      </div>

      {/* Main form area */}
      <div className="bg-[#f0f0f0] px-4 py-3 space-y-2" style={{ borderTop: "1px solid #ccc" }}>
        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Device</label>
          <select value={device} onChange={(e) => { playClick(); setDevice(e.target.value); }}
            className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-[11px] text-gray-800 focus:outline-none focus:border-[#0078d4]">
            {USB_DEVICES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Boot selection</label>
          <div className="flex-1 flex items-center gap-1">
            <button onClick={() => setPickerOpen(true)}
              className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-2 py-0.5 text-left text-[11px] text-gray-800 hover:bg-gray-50 truncate">
              {isoFile ?? "Disk or ISO image"}
            </button>
            <button onClick={() => setPickerOpen(true)}
              className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-3 py-0.5 text-[11px] text-gray-800 hover:bg-[#d5d5d5] active:bg-[#c8c8c8] font-semibold shrink-0">
              SELECT
            </button>
          </div>
        </div>

        {tooSmall && (
          <div className="rounded-sm border border-amber-400 bg-amber-50 px-2 py-1 text-[10px] text-amber-800">
            ⚠️ ISO ({config.iso.size}) may not fit on {selected!.sizeGB} GB drive.
          </div>
        )}

        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Partition scheme</label>
          <div className="relative flex-1">
            <button onClick={() => setPartitionSchemeOpen(!partitionSchemeOpen)}
              className="w-full rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-left text-[11px] text-gray-800 hover:bg-gray-50">
              {partitionScheme === "GPT" ? "GPT — UEFI" : "MBR — BIOS (Legacy)"} ▾
            </button>
            {partitionSchemeOpen && (
              <div className="absolute z-10 top-full mt-0.5 left-0 w-full bg-white border border-[#7a9bb5] shadow-md rounded-sm">
                {(["GPT", "MBR"] as const).map((v) => (
                  <button key={v} onClick={() => { playClick(); setPartitionScheme(v); setRufusPartitionScheme(v); setPartitionSchemeOpen(false); }}
                    className={`w-full text-left px-2 py-0.5 text-[11px] hover:bg-[#0078d4] hover:text-white ${partitionScheme === v ? "bg-[#0078d4] text-white" : "text-gray-800"}`}>
                    {v === "GPT" ? "GPT — UEFI" : "MBR — BIOS (Legacy)"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Target system</label>
          <div className="flex-1 rounded-sm border border-[#ccc] bg-[#e8e8e8] px-1.5 py-0.5 text-[11px] text-gray-600">
            {partitionScheme === "GPT" ? "UEFI: Non CSM" : "BIOS (or UEFI-CSM)"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Volume label</label>
          <input type="text" defaultValue={config.iso.filename.replace(/\.iso$/i, "").replace(/[-_]/g, " ").substring(0, 20)}
            className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-[11px] text-gray-800 focus:outline-none focus:border-[#0078d4]" />
        </div>

        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">File system</label>
          <select className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-[11px] text-gray-800 focus:outline-none">
            <option>NTFS (Default)</option>
            <option>FAT32</option>
            <option>exFAT</option>
            <option>UDF</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Cluster size</label>
          <select className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-[11px] text-gray-800 focus:outline-none">
            <option>Default allocation size</option>
            <option>512 bytes</option><option>1024 bytes</option><option>2048 bytes</option>
            <option>4096 bytes</option><option>8192 bytes</option><option>16 kilobytes</option>
            <option>32 kilobytes</option><option>64 kilobytes</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pl-28">
          <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#4a8c5c] w-3 h-3" /> Quick format
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#4a8c5c] w-3 h-3" /> Create extended label and icon files
          </label>
        </div>
      </div>

      {/* Progress bar */}
      {(rufusPhase === "flashing" || rufusPhase === "done") && (
        <div className="bg-[#f0f0f0] px-4 py-1.5">
          <div className="h-3.5 w-full overflow-hidden rounded-sm bg-white border border-[#b0b0b0]">
            <div className="h-full rounded-sm transition-all duration-100" style={{
              width: `${progress}%`,
              background: rufusPhase === "done" ? "linear-gradient(to bottom, #7ec87e, #5ba05b)" : "linear-gradient(to bottom, #7ec87e, #4a8c5c)",
            }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
            <span>{rufusPhase === "done" ? "Ready" : `${Math.floor(progress)}%`}</span>
            <span>{rufusPhase === "done" ? "Done." : ""}</span>
          </div>
        </div>
      )}

      {/* Log window during flashing */}
      {rufusPhase === "flashing" && (
        <div ref={logRef} className="h-32 overflow-y-auto bg-[#f0f0f0] px-4 pb-1">
          <div className="rounded-sm border border-[#b0b0b0] bg-white p-1.5 font-mono text-[10px] leading-tight min-h-[4rem]">
            {logLines.filter(Boolean).map((l, i) => (
              <div key={i} className={l.startsWith("ERROR") ? "text-red-600" : l.includes("✓") || l.includes("Done") ? "text-green-700" : "text-gray-800"}>
                {l}
              </div>
            ))}
            <span className="animate-pulse text-[#4a8c5c]">▌</span>
          </div>
        </div>
      )}

      {/* Bottom buttons + status bar */}
      <div className="bg-[#f0f0f0] px-4 py-2 flex items-center justify-between" style={{ borderTop: "1px solid #ccc" }}>
        <div className="flex items-center gap-2">
          {rufusPhase === "idle" && (
            <button disabled={!isoFile || !device || !!tooSmall}
              onClick={() => { if (isoFile && device && !tooSmall) { playClick(); setRufusPhase("flashing"); } }}
              className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-5 py-1 text-[11px] font-semibold text-gray-800 hover:bg-[#d5d5d5] active:bg-[#c8c8c8] disabled:opacity-40 disabled:cursor-not-allowed">
              START
            </button>
          )}
          {rufusPhase === "done" && (
            <button onClick={() => { playClick(); onComplete(); }}
              className="rounded-sm bg-[#4a8c5c] border border-[#3d7a4e] px-5 py-1 text-[11px] font-bold text-white hover:bg-[#3d7a4e]">
              ✓ Flash Complete — Continue →
            </button>
          )}
          <button className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-5 py-1 text-[11px] text-gray-800 hover:bg-[#d5d5d5]">
            CLOSE
          </button>
        </div>
      </div>

      <div className="bg-[#f0f0f0] border-t border-[#ccc] px-3 py-0.5 text-[10px] text-gray-500">
        {rufusPhase === "done" ? `1 device found — ${config.iso.filename} ready`
          : rufusPhase === "flashing" ? `Writing… ${Math.floor(progress)}%` : "1 device found"}
      </div>

      <FilePickerModal open={pickerOpen} title="Select ISO image"
        files={[{ name: config.iso.filename, icon: "💿", size: config.iso.size }]}
        onSelect={(n) => { playClick(); setIsoFile(n); setRufusPhase("idle"); }}
        onClose={() => setPickerOpen(false)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VENTOY — Interactive Win32-style UI
   ═══════════════════════════════════════════════════════════════ */
function VentoyTool({ config, speed, onComplete }: { config: OSConfig; speed: "normal" | "fast"; onComplete: () => void }) {
  const { register: registerAdvance } = useSceneAdvance();
  const [phase, setPhase] = useState<"idle" | "confirming" | "installing" | "copying" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"ventoy" | "option" | "configure" | "donate">("ventoy");
  const [copiedFile, setCopiedFile] = useState(false);
  const [overDrop, setOverDrop] = useState(false);
  const installDur = speed === "fast" ? 800 : 2500;
  const copyDur = speed === "fast" ? 600 : 1800;

  useEffect(() => {
    if (phase !== "installing" && phase !== "copying") return;
    const dur = phase === "installing" ? installDur : copyDur;
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / dur) * 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
      else { playSuccess(); if (phase === "installing") setPhase("copying"); else setPhase("done"); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => { if (phase === "done") registerAdvance(() => onComplete()); }, [phase, registerAdvance, onComplete]);

  const tabs = [
    { id: "ventoy" as const, label: "Ventoy" },
    { id: "option" as const, label: "Option" },
    { id: "configure" as const, label: "Configure" },
    { id: "donate" as const, label: "Donate" },
  ];

  return (
    <div className="mx-auto w-full max-w-xl rounded-lg overflow-hidden shadow-2xl shadow-black/50" style={{ border: "1px solid #888" }}>
      <div className="flex items-center justify-between bg-gradient-to-r from-[#0054a6] to-[#0078d4] px-2 py-1 select-none">
        <div className="flex items-center gap-2">
          <img src="/images/flash-tools/ventoy.png" alt="" className="h-4 w-4 rounded-sm" />
          <span className="text-[11px] text-white font-medium">Ventoy2Disk (USB) — {USB_DEVICES[0].short}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button className="w-6 h-5 flex items-center justify-center text-white/80 hover:bg-white/10 text-[10px]">─</button>
          <button className="w-6 h-5 flex items-center justify-center text-white/80 hover:bg-white/10 text-[10px]">□</button>
          <button className="w-6 h-5 flex items-center justify-center text-white/80 hover:bg-red-500 text-[10px]">✕</button>
        </div>
      </div>

      <div className="bg-[#e8e8e8] px-2 pt-1.5 flex gap-0 border-b border-[#999]">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { playClick(); setActiveTab(t.id); }}
            className={`px-4 py-1 text-[11px] font-medium border border-b-0 rounded-t-sm ${
              activeTab === t.id ? "bg-white border-[#999] text-gray-800 relative z-10 -mb-px" : "bg-[#d4d4d4] border-transparent text-gray-600 hover:bg-[#dcdcdc]"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white px-4 py-3 space-y-3">
        {activeTab === "ventoy" && (
          <>
            <div className="flex items-center gap-2">
              <img src="/images/flash-tools/ventoy.png" alt="" className="h-5 w-5" />
              <span className="text-[11px] font-semibold text-gray-800">Ventoy2Disk</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] text-gray-600 shrink-0">Device:</label>
              <select className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-[11px] text-gray-800">
                {USB_DEVICES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#28a745] w-3 h-3" /> Check device in list
            </label>

            <div className="flex items-center gap-3 pt-1">
              {(phase === "idle" || phase === "confirming") && (
                <>
                  <button onClick={() => { if (phase === "idle") { playClick(); setPhase("confirming"); } else { playClick(); setPhase("installing"); } }}
                    className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-6 py-1.5 text-[11px] font-semibold text-gray-800 hover:bg-[#d5d5d5] active:bg-[#c8c8c8]">
                    Install
                  </button>
                  <button onClick={() => { playClick(); setPhase("confirming"); }}
                    className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-6 py-1.5 text-[11px] text-gray-800 hover:bg-[#d5d5d5]">
                    Update
                  </button>
                </>
              )}
            </div>

            {phase === "confirming" && (
              <div className="rounded border border-amber-300 bg-amber-50 p-3 space-y-2">
                <div className="text-[11px] text-gray-800 font-semibold">⚠️ Warning</div>
                <div className="text-[10px] text-gray-600">The device will be formatted and all data will be destroyed. Continue?</div>
                <div className="flex gap-2">
                  <button onClick={() => { playClick(); setPhase("idle"); }} className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-4 py-0.5 text-[10px] text-gray-800 hover:bg-[#d5d5d5]">No</button>
                  <button onClick={() => { playClick(); setPhase("installing"); }} className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-4 py-0.5 text-[10px] text-gray-800 hover:bg-[#d5d5d5]">Yes</button>
                </div>
              </div>
            )}

            {(phase === "installing" || phase === "copying") && (
              <div className="space-y-1">
                <div className="text-[10px] text-gray-600">{phase === "installing" ? "Installing Ventoy to USB drive…" : "Ventoy installed. Copy ISO files to USB."}</div>
                <div className="h-3 w-full overflow-hidden rounded-sm bg-white border border-[#b0b0b0]">
                  <div className="h-full rounded-sm transition-all duration-100" style={{ width: `${progress}%`, background: "linear-gradient(to bottom, #5bc0de, #28a745)" }} />
                </div>
              </div>
            )}

            {phase === "done" && (
              <div className="space-y-2">
                <div className="text-[11px] text-green-700 font-semibold">✓ Ventoy installed successfully!</div>
                <button onClick={() => { playClick(); onComplete(); }} className="w-full rounded-sm bg-[#4a8c5c] border border-[#3d7a4e] py-1.5 text-[11px] font-bold text-white hover:bg-[#3d7a4e]">✓ Continue →</button>
              </div>
            )}

            {phase === "copying" && (
              <div className="space-y-2">
                <div className="text-[10px] text-gray-500">Drag your ISO file to the USB drive:</div>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-xl">💿</span>
                    <span className="text-[8px] text-gray-500 text-center leading-tight px-1 break-all max-w-[60px]">{config.iso.filename.substring(0, 15)}</span>
                  </div>
                  <div className="text-xl text-gray-400">→</div>
                  <div onDragOver={(e) => { e.preventDefault(); setOverDrop(true); }} onDragLeave={() => setOverDrop(false)}
                    onDrop={(e) => { e.preventDefault(); setOverDrop(false); playUsbConnect(); setCopiedFile(true); setProgress(0); }}
                    className={`w-32 h-16 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors cursor-pointer ${overDrop ? "border-[#28a745] bg-green-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"}`}>
                    <span className="text-[10px] text-gray-500">{overDrop ? "Release" : "Drop ISO here"}</span>
                  </div>
                </div>
                {copiedFile && (
                  <div className="h-3 w-full overflow-hidden rounded-sm bg-white border border-[#b0b0b0]">
                    <div className="h-full rounded-sm bg-[#28a745] transition-all duration-100" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            )}

            {phase === "idle" && (
              <div className="mt-3 rounded border border-gray-200 p-2 font-mono text-[9px] text-gray-600 leading-relaxed bg-gray-50 whitespace-pre-wrap max-h-28 overflow-y-auto">
{`Ventoy2Disk 2.1 (r2140)
=====================================
Ventoy:  2.1.0000.00
License: GNU GPL v3
=====================================
Ventoy is an open source tool to create bootable USB drive for ISO/WIM/IMG/VHD(x)/EFI files.
With Ventoy, you don't need to format the disk again and again, you just need to copy the ISO/WIM/IMG files to the USB drive and boot directly.

Copyright (c) 2020-2024 Aventoy Technology`}
              </div>
            )}
          </>
        )}

        {activeTab === "option" && (
          <div className="space-y-2 py-2">
            <label className="flex items-center gap-2 text-[11px] text-gray-700 cursor-pointer"><input type="checkbox" defaultChecked className="accent-[#28a745] w-3 h-3" /> Secure Boot Support</label>
            <label className="flex items-center gap-2 text-[11px] text-gray-700 cursor-pointer"><input type="checkbox" className="accent-[#28a745] w-3 h-3" /> Partition Style — MBR</label>
            <label className="flex items-center gap-2 text-[11px] text-gray-700 cursor-pointer"><input type="checkbox" defaultChecked className="accent-[#28a745] w-3 h-3" /> Longest Path (increase max ISO path length)</label>
            <div className="text-[10px] text-gray-500 pt-2">Note: Options only apply during Install (not Update).</div>
          </div>
        )}
        {activeTab === "configure" && <div className="py-4 text-center text-[11px] text-gray-500"><div className="text-lg mb-2">⚙️</div>No additional configuration required for basic use.</div>}
        {activeTab === "donate" && <div className="py-4 text-center text-[11px] text-gray-500"><div className="text-lg mb-2">❤️</div>Ventoy is free and open source. If you find it useful, consider supporting the developer.</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BALENA ETCHER — Interactive dark Electron-style UI
   ═══════════════════════════════════════════════════════════════ */
function EtcherTool({ config, speed, onComplete }: { config: OSConfig; speed: "normal" | "fast"; onComplete: () => void }) {
  const { register: registerAdvance } = useSceneAdvance();
  const [etcherPhase, setEtcherPhase] = useState<"pick_file" | "pick_target" | "flashing" | "done">("pick_file");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const flashDur = speed === "fast" ? 1200 : 4000;

  useEffect(() => {
    if (etcherPhase !== "flashing") return;
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / flashDur) * 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
      else { playSuccess(); setEtcherPhase("done"); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etcherPhase]);

  useEffect(() => { if (etcherPhase === "done") registerAdvance(() => onComplete()); }, [etcherPhase, registerAdvance, onComplete]);

  const canFlash = selectedFile && selectedTarget;

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl shadow-black/50" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #12121a 100%)" }}>
      <div className="flex items-center justify-between bg-[#0d0d14] px-4 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <img src="/images/flash-tools/etcher.jpg" alt="" className="h-4 w-4 rounded" />
          <span className="text-[11px] text-white/70 font-medium">balenaEtcher</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
      </div>

      <div className="px-6 py-8">
        {etcherPhase !== "flashing" && etcherPhase !== "done" && (
          <>
            <div className="flex items-center gap-4">
              <button onClick={() => setPickerOpen(true)}
                className={`flex-1 rounded-xl p-5 text-center transition-all border ${selectedFile ? "border-emerald-500/40 bg-emerald-500/[0.08]" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20"}`}>
                <div className={`text-3xl mb-2 ${selectedFile ? "text-emerald-400" : "text-white/40"}`}>{selectedFile ? "✓" : "📁"}</div>
                <div className="text-[11px] font-semibold text-white/80">Flash from file</div>
                {selectedFile ? <div className="mt-1.5 text-[10px] text-emerald-400/80 truncate">{selectedFile}</div> : <div className="mt-1 text-[10px] text-white/30">Select an image to flash</div>}
              </button>
              <div className="text-white/15 text-xl">›</div>
              <button onClick={() => { if (selectedFile) setEtcherPhase("pick_target"); }} disabled={!selectedFile}
                className={`flex-1 rounded-xl p-5 text-center transition-all border ${!selectedFile ? "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed" : selectedTarget ? "border-emerald-500/40 bg-emerald-500/[0.08]" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20"}`}>
                <div className={`text-3xl mb-2 ${selectedTarget ? "text-emerald-400" : "text-white/40"}`}>{selectedTarget ? "✓" : "🎯"}</div>
                <div className="text-[11px] font-semibold text-white/80">Select target</div>
                {selectedTarget ? <div className="mt-1.5 text-[10px] text-emerald-400/80">{USB_DEVICES.find((d) => d.id === selectedTarget)?.short}</div> : <div className="mt-1 text-[10px] text-white/30">Select a drive to flash to</div>}
              </button>
              <div className="text-white/15 text-xl">›</div>
              <button onClick={() => { if (canFlash) { playClick(); setEtcherPhase("flashing"); } }} disabled={!canFlash}
                className={`flex-1 rounded-xl p-5 text-center transition-all border ${!canFlash ? "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed" : "border-[#6c5ce7]/40 bg-[#6c5ce7]/[0.1] hover:bg-[#6c5ce7]/[0.2] hover:border-[#6c5ce7]/60 cursor-pointer"}`}>
                <div className={`text-3xl mb-2 ${canFlash ? "text-[#6c5ce7]" : "text-white/40"}`}>⚡</div>
                <div className="text-[11px] font-semibold text-white/80">Flash!</div>
                <div className="mt-1 text-[10px] text-white/30">{canFlash ? "Ready to flash" : "Complete steps 1 & 2 first"}</div>
              </button>
            </div>
            <div className="mt-6 text-center text-[10px] text-white/20">balenaEtcher — {config.iso.filename}</div>
          </>
        )}

        {etcherPhase === "pick_target" && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-white/50 mb-2">Select target drive:</div>
            {USB_DEVICES.map((d) => (
              <button key={d.id} onClick={() => { playClick(); setSelectedTarget(d.id); setEtcherPhase("pick_file"); }}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${selectedTarget === d.id ? "border-[#6c5ce7] bg-[#6c5ce7]/20 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}>
                <div className="flex items-center gap-2"><span>🔌</span><span className="font-medium">{d.label}</span></div>
              </button>
            ))}
          </div>
        )}

        {etcherPhase === "flashing" && (
          <div className="flex flex-col items-center py-8 space-y-6">
            <div className="relative h-40 w-40">
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="8" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="#6c5ce7" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 70}`} strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
                  strokeLinecap="round" className="transition-all duration-100" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-white">{Math.floor(progress)}%</div>
                <div className="text-[10px] text-white/40 mt-1">Flashing…</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-white/80">{config.iso.filename}</div>
              <div className="text-[10px] text-white/40 mt-0.5">→ {USB_DEVICES.find((d) => d.id === selectedTarget)?.label}</div>
            </div>
          </div>
        )}

        {etcherPhase === "done" && (
          <div className="flex flex-col items-center py-8 space-y-6">
            <div className="h-24 w-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
              <span className="text-4xl text-emerald-400">✓</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white">Flash complete!</div>
              <div className="text-sm text-white/50 mt-1">{config.iso.filename}</div>
            </div>
            <button onClick={() => { playClick(); onComplete(); }} className="rounded-xl bg-emerald-500 px-8 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition-colors">✓ Continue →</button>
          </div>
        )}
      </div>

      <FilePickerModal open={pickerOpen} title="Select image to flash"
        files={[{ name: config.iso.filename, icon: "💿", size: config.iso.size }]}
        onSelect={(n) => { playClick(); setSelectedFile(n); setEtcherPhase("pick_file"); }}
        onClose={() => setPickerOpen(false)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   USB STICK & PC TOWER SVGs
   ═══════════════════════════════════════════════════════════════ */
function UsbStickSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="30" width="44" height="80" rx="4" fill="url(#plugUsbBody)" stroke="#555" strokeWidth="1.5" />
      <rect x="16" y="6" width="28" height="28" rx="2" fill="url(#plugUsbMetal)" stroke="#999" strokeWidth="1" />
      <rect x="22" y="14" width="4" height="2" rx="0.5" fill="#b87333" />
      <rect x="22" y="19" width="4" height="2" rx="0.5" fill="#b87333" />
      <rect x="34" y="14" width="4" height="2" rx="0.5" fill="#b87333" />
      <rect x="34" y="19" width="4" height="2" rx="0.5" fill="#b87333" />
      <circle cx="30" cy="42" r="3" fill="#22c55e" opacity="0.9">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <rect x="14" y="55" width="32" height="16" rx="2" fill="rgba(0,0,0,0.2)" />
      <text x="30" y="65" textAnchor="middle" fontSize="6" fontWeight="bold" fill="rgba(255,255,255,0.3)">USB</text>
      <line x1="14" y1="80" x2="46" y2="80" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <line x1="14" y1="84" x2="46" y2="84" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <line x1="14" y1="88" x2="46" y2="88" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <circle cx="30" cy="102" r="4" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <defs>
        <linearGradient id="plugUsbBody" x1="8" y1="30" x2="52" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4a4a52" />
          <stop offset="0.5" stopColor="#2a2a30" />
          <stop offset="1" stopColor="#1a1a20" />
        </linearGradient>
        <linearGradient id="plugUsbMetal" x1="16" y1="6" x2="44" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c0c0c0" />
          <stop offset="0.5" stopColor="#a0a0a0" />
          <stop offset="1" stopColor="#808080" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PcTower({ glowing }: { glowing: boolean }) {
  return (
    <div className="relative">
      {glowing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -inset-6 rounded-2xl bg-accent/20 blur-xl pointer-events-none"
        />
      )}
      <svg viewBox="0 0 120 160" className="w-28 h-36 sm:w-36 sm:h-44 lg:w-44 lg:h-52 xl:w-52 xl:h-60" fill="none">
        <rect x="10" y="5" width="100" height="150" rx="6" fill="url(#plugTowerBody)" stroke="#444" strokeWidth="1.5" />
        <rect x="16" y="10" width="88" height="140" rx="3" fill="#1a1a1e" />
        <circle cx="60" cy="20" r="4" fill="none" stroke="#555" strokeWidth="1" />
        <circle cx="60" cy="20" r="1.5" fill="#22c55e" />
        <rect x="30" y="95" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
        {glowing && (
          <rect x="30" y="95" width="24" height="8" rx="1.5" fill="none" stroke="#7c5cff" strokeWidth="1.5" opacity="0.8">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" values="1;2;1" dur="0.8s" repeatCount="indefinite" />
          </rect>
        )}
        <rect x="66" y="95" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
        <rect x="30" y="108" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
        <rect x="66" y="108" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="24" y1={125 + i * 5} x2="96" y2={125 + i * 5} stroke="#222" strokeWidth="1" />
        ))}
        <text x="60" y="70" textAnchor="middle" fontSize="7" fill="#333" fontWeight="bold">DESKTOP PC</text>
        <rect x="35" y="-5" width="50" height="3" rx="1" fill="#333" />
        <defs>
          <linearGradient id="plugTowerBody" x1="10" y1="5" x2="110" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2a2a2e" />
            <stop offset="1" stopColor="#1a1a1e" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN FlashUSB COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function FlashUSB({
  config,
  speed,
  onComplete,
  setRufusPartitionScheme,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
  setRufusPartitionScheme: (v: "GPT" | "MBR") => void;
}) {
  const [phase, setPhase] = useState<"plug_in" | "tool_select" | "eject" | "reinsert">("plug_in");
  const [tool, setTool] = useState<"select" | "rufus" | "ventoy" | "balena" | "unsupported">("select");
  const [overPort, setOverPort] = useState(false);
  const [ejectPhase, setEjectPhase] = useState<"idle" | "ejecting" | "done">("idle");

  const handlePlugIn = useCallback(() => {
    setOverPort(false);
    playUsbConnect();
    setPhase("tool_select");
  }, []);

  const handleFlashDone = useCallback(() => {
    setPhase("eject");
  }, []);

  if (phase === "plug_in") {
    return (
      <div data-no-auto-advance className="mx-auto w-full max-w-4xl lg:max-w-5xl relative">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-[#2a2218] via-[#1e1812] to-[#151010] rounded-2xl" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,220,160,0.1) 3px, rgba(255,220,160,0.1) 4px), repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,220,160,0.05) 8px, rgba(255,220,160,0.05) 9px)"
            }}
          />
          <div className="relative z-10 p-8 lg:p-10">
            <div className="text-center mb-8">
              <div className="text-xs lg:text-sm uppercase tracking-widest text-amber-300/40 font-medium">Step 1</div>
              <h2 className="mt-2 text-xl lg:text-2xl xl:text-3xl font-bold text-white">
                Plug a USB drive into your computer
              </h2>
              <p className="mt-2 text-sm lg:text-base text-white/40">
                You need a USB drive with at least {config.iso.size} of space to flash the ISO onto.
              </p>
            </div>

            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-24 py-8">
              <motion.div
                draggable
                onDragStart={() => {}}
                onDragEnd={() => { if (!overPort) setOverPort(false); }}
                animate={{ y: [0, -6, 0] }}
                transition={{ y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } }}
                whileDrag={{ scale: 1.08, rotate: -8, zIndex: 50, filter: "drop-shadow(0 8px 24px rgba(124,92,255,0.4))" }}
                className="cursor-grab active:cursor-grabbing select-none"
              >
                <UsbStickSvg className="w-20 h-32 sm:w-24 sm:h-40 lg:w-28 lg:h-48 xl:w-32 xl:h-56 drop-shadow-lg" />
                <div className="text-center mt-2 text-xs lg:text-sm xl:text-base text-amber-200/40 font-semibold">drag me →</div>
              </motion.div>

              <div
                onDragOver={(e) => { e.preventDefault(); setOverPort(true); }}
                onDragLeave={() => setOverPort(false)}
                onDrop={(e) => { e.preventDefault(); handlePlugIn(); }}
              >
                <PcTower glowing={overPort} />
                <div className="text-center mt-2">
                  <div className={`text-xs font-medium ${overPort ? "text-accent" : "text-white/30"}`}>
                    {overPort ? "Release to insert" : "Drop USB here"}
                  </div>
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
                {overPort && (
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 0.3 }}
                    className="w-24 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent origin-left"
                  />
                )}
              </div>
            </div>

            {overPort && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-sm text-accent font-medium"
              >
                Release to connect
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "eject") {
    return (
      <div data-no-auto-advance className="mx-auto w-full max-w-lg relative">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a24] via-[#12121a] to-[#0a0a10] rounded-2xl" />
          <div className="relative z-10 p-8 lg:p-10">
            <div className="text-center mb-6">
              <div className="text-xs lg:text-sm uppercase tracking-widest text-amber-300/40 font-medium">Step 3 — Safely Eject</div>
              <h2 className="mt-2 text-xl lg:text-2xl font-bold text-white">
                Safely remove the USB drive
              </h2>
              <p className="mt-2 text-sm text-white/40">
                Before unplugging, you must safely eject the USB through the system tray. This ensures all cached write operations are flushed to the drive and prevents file system corruption. On Windows, click the "Safely Remove Hardware" icon in the notification area and select "Eject".
              </p>
            </div>

            <div className="flex flex-col items-center gap-6 py-4">
              {/* System tray eject icon */}
              <motion.div
                animate={ejectPhase === "ejecting" ? { x: [0, 0, -60], opacity: [1, 1, 0], scale: [1, 1.1, 0.8] } : {}}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="relative"
              >
                <div className="w-28 h-28 rounded-2xl border border-white/10 bg-white/[0.04] flex items-center justify-center">
                  <svg viewBox="0 0 60 120" className="w-16 h-32" fill="none">
                    <rect x="8" y="30" width="44" height="80" rx="4" fill="url(#ejectUsbBody)" stroke="#555" strokeWidth="1" />
                    <rect x="16" y="6" width="28" height="28" rx="2" fill="url(#ejectUsbMetal)" stroke="#999" strokeWidth="1" />
                    <circle cx="30" cy="42" r="3" fill={ejectPhase === "done" ? "transparent" : "#22c55e"} opacity="0.9" />
                    {ejectPhase === "done" && (
                      <circle cx="30" cy="42" r="3" fill="#ef4444" opacity="0.6">
                        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <rect x="14" y="55" width="32" height="16" rx="2" fill="rgba(0,0,0,0.2)" />
                    <text x="30" y="65" textAnchor="middle" fontSize="6" fontWeight="bold" fill="rgba(255,255,255,0.3)">USB</text>
                    <defs>
                      <linearGradient id="ejectUsbBody" x1="8" y1="30" x2="52" y2="110" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#4a4a52" /><stop offset="1" stopColor="#1a1a20" />
                      </linearGradient>
                      <linearGradient id="ejectUsbMetal" x1="16" y1="6" x2="44" y2="34" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#c0c0c0" /><stop offset="1" stopColor="#808080" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </motion.div>

              {/* Windows-style safe eject popup */}
              <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg">
                    {ejectPhase === "done" ? "✓" : "💾"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white/90">Safely Remove Hardware</div>
                    <div className="text-[11px] text-white/50 truncate">
                      {ejectPhase === "idle" ? "USB Drive (E:) — Generic Flash Disk" : ejectPhase === "ejecting" ? "Stopping device…" : "'USB Drive' can now be safely removed"}
                    </div>
                  </div>
                </div>

                {ejectPhase === "idle" && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { playClick(); setEjectPhase("ejecting"); setTimeout(() => { playUsbConnect(); setEjectPhase("done"); }, 1200); }}
                      className="flex-1 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                      Eject
                    </button>
                    <button onClick={() => { playClick(); onComplete(); }}
                      className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors">
                      Skip
                    </button>
                  </div>
                )}

                {ejectPhase === "ejecting" && (
                  <div className="pt-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.2, ease: "easeInOut" }}
                        className="h-full rounded-full bg-amber-400" />
                    </div>
                    <div className="mt-1 text-[10px] text-amber-400/60">Safely removing hardware…</div>
                  </div>
                )}

                {ejectPhase === "done" && (
                  <div className="pt-1">
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                      'USB Drive (E:)' has been safely ejected. All data has been flushed and it is now safe to unplug the device from your computer.
                    </div>
                    <button onClick={() => { playClick(); setPhase("reinsert"); }}
                      className="mt-2 w-full rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-colors">
                      Continue →
                    </button>
                  </div>
                )}
              </div>

              {/* System tray indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className={`h-2 w-2 rounded-full ${ejectPhase === "done" ? "bg-red-400" : "bg-emerald-400"}`} />
                <span className="text-[10px] text-white/40">
                  {ejectPhase === "idle" ? "USB Drive (E:) — Connected" : ejectPhase === "ejecting" ? "Stopping device — do not unplug yet…" : "Safe to remove hardware"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "reinsert") {
    return (
      <div data-no-auto-advance className="mx-auto w-full max-w-4xl lg:max-w-5xl relative">
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a2420] via-[#121a16] to-[#0a100e] rounded-2xl" />
          <div className="relative z-10 p-8 lg:p-10">
            <div className="text-center mb-8">
              <div className="text-xs lg:text-sm uppercase tracking-widest text-emerald-300/40 font-medium">Step 4 — Reconnect</div>
              <h2 className="mt-2 text-xl lg:text-2xl xl:text-3xl font-bold text-white">
                Reconnect the USB drive
              </h2>
              <p className="mt-2 text-sm lg:text-base text-white/40">
                Now plug the USB back into your computer. Windows will detect it as a bootable removable device. The ISO has been written successfully and your USB drive is now ready to boot the installer on any compatible system.
              </p>
            </div>

            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-24 py-8">
              <motion.div
                draggable
                onDragStart={() => {}}
                onDragEnd={() => { if (!overPort) setOverPort(false); }}
                animate={{ y: [0, -6, 0] }}
                transition={{ y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } }}
                whileDrag={{ scale: 1.08, rotate: -8, zIndex: 50, filter: "drop-shadow(0 8px 24px rgba(16,185,129,0.4))" }}
                className="cursor-grab active:cursor-grabbing select-none"
              >
                <UsbStickSvg className="w-20 h-32 sm:w-24 sm:h-40 lg:w-28 lg:h-48 xl:w-32 xl:h-56 drop-shadow-lg" />
                <div className="text-center mt-2 text-xs lg:text-sm xl:text-base text-emerald-200/40 font-semibold">reconnect →</div>
              </motion.div>

              <div
                onDragOver={(e) => { e.preventDefault(); setOverPort(true); }}
                onDragLeave={() => setOverPort(false)}
                onDrop={(e) => { e.preventDefault(); setOverPort(false); playUsbConnect(); onComplete(); }}
              >
                <PcTower glowing={overPort} />
                <div className="text-center mt-2">
                  <div className={`text-xs font-medium ${overPort ? "text-emerald-400" : "text-white/30"}`}>
                    {overPort ? "Release to connect bootable USB" : "Drag USB to the PC"}
                  </div>
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
                {overPort && (
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 0.3 }}
                    className="w-24 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent origin-left"
                  />
                )}
              </div>
            </div>

            {overPort && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-sm text-emerald-400 font-medium"
              >
                Release to connect
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl space-y-4">
      {tool === "select" && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="text-xs lg:text-sm uppercase tracking-widest text-amber-300/40 font-medium">Step 2</div>
            <h2 className="mt-1 text-xl lg:text-2xl xl:text-3xl font-bold text-white text-center">Choose your flashing tool</h2>
            <p className="mt-2 text-sm text-white/40 text-center">Select a tool to write the ISO to your USB drive.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {config.flashers.map((t) => {
              const ok = SUPPORTED_TOOLS.has(t.id);
              const isRufus = t.id === "rufus";
              const isVentoy = t.id === "ventoy";
              const isEtcher = t.id === "balena";
              return (
                <button key={t.id} onClick={() => { playClick(); setTool(t.id === "rufus" || t.id === "ventoy" || t.id === "balena" ? t.id : "unsupported"); }}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 lg:p-6 text-center transition-all hover:bg-white/10 group">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
                    {isRufus && <img src="/images/flash-tools/rufus-screenshot.png" alt="Rufus" className="w-full h-full object-cover" />}
                    {isVentoy && <img src="/images/flash-tools/ventoy-screenshot.png" alt="Ventoy" className="w-full h-full object-cover" />}
                    {isEtcher && <img src="/images/flash-tools/etcher-screenshot.png" alt="BalenaEtcher" className="w-full h-full object-cover" />}
                    {!isRufus && !isVentoy && !isEtcher && <div className="w-full h-full flex items-center justify-center text-2xl bg-white/5">🔧</div>}
                  </div>
                  <div className="text-sm lg:text-base font-bold text-white/90">{t.name}</div>
                  <div className="mt-1 text-xs lg:text-sm text-white/50">{t.note}</div>
                  {!ok && <div className="mt-2 text-xs lg:text-sm text-amber-400/80 font-medium">Coming soon</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tool === "rufus" && (
        <div className="space-y-4">
          <button onClick={() => { playClick(); setTool("select"); }} className="text-sm text-white/50 hover:text-white">← Back to tools</button>
          <RufusTool config={config} speed={speed} onComplete={handleFlashDone} setRufusPartitionScheme={setRufusPartitionScheme} />
        </div>
      )}
      {tool === "ventoy" && (
        <div className="space-y-4">
          <button onClick={() => { playClick(); setTool("select"); }} className="text-sm text-white/50 hover:text-white">← Back to tools</button>
          <VentoyTool config={config} speed={speed} onComplete={handleFlashDone} />
        </div>
      )}
      {tool === "balena" && (
        <div className="space-y-4">
          <button onClick={() => { playClick(); setTool("select"); }} className="text-sm text-white/50 hover:text-white">← Back to tools</button>
          <EtcherTool config={config} speed={speed} onComplete={handleFlashDone} />
        </div>
      )}
      {tool === "unsupported" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <div className="text-lg font-semibold text-amber-300">Tool not yet supported</div>
          <p className="mt-2 text-sm text-white/50">Please use <strong>Rufus</strong>, <strong>Ventoy</strong>, or <strong>BalenaEtcher</strong>.</p>
          <button onClick={() => { playClick(); setTool("select"); }} className="mt-4 rounded-lg bg-white/10 px-5 py-2 text-sm font-medium text-white hover:bg-white/15">← Choose a different tool</button>
        </div>
      )}
    </div>
  );
}
