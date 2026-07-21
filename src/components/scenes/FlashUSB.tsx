import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { useToast } from "../shared/Toast";
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
   RUFUS — Real Win32 desktop app UI
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
      {/* ── Windows title bar ── */}
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

      {/* ── Rufus green header ── */}
      <div className="bg-gradient-to-b from-[#5ba06c] to-[#4a8c5c] px-4 py-2.5 flex items-center gap-3">
        <img src="/images/flash-tools/rufus.jpg" alt="Rufus" className="h-8 w-8 rounded" />
        <div>
          <div className="text-white font-bold text-sm">Rufus</div>
          <div className="text-white/70 text-[10px]">FreeDOS / ISO Image</div>
        </div>
      </div>

      {/* ── Main form area ── */}
      <div className="bg-[#f0f0f0] px-4 py-3 space-y-2" style={{ borderTop: "1px solid #ccc" }}>
        {/* Device */}
        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Device</label>
          <select
            value={device}
            onChange={(e) => { playClick(); setDevice(e.target.value); }}
            className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-[11px] text-gray-800 focus:outline-none focus:border-[#0078d4]"
          >
            {USB_DEVICES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>

        {/* Boot selection */}
        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Boot selection</label>
          <div className="flex-1 flex items-center gap-1">
            <button
              onClick={() => setPickerOpen(true)}
              className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-2 py-0.5 text-left text-[11px] text-gray-800 hover:bg-gray-50 truncate"
            >
              {isoFile ?? "Disk or ISO image"}
            </button>
            <button
              onClick={() => setPickerOpen(true)}
              className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-3 py-0.5 text-[11px] text-gray-800 hover:bg-[#d5d5d5] active:bg-[#c8c8c8] font-semibold shrink-0"
            >
              SELECT
            </button>
          </div>
        </div>

        {tooSmall && (
          <div className="rounded-sm border border-amber-400 bg-amber-50 px-2 py-1 text-[10px] text-amber-800">
            ⚠️ ISO ({config.iso.size}) may not fit on {selected!.sizeGB} GB drive.
          </div>
        )}

        {/* Partition scheme */}
        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Partition scheme</label>
          <div className="relative flex-1">
            <button
              onClick={() => setPartitionSchemeOpen(!partitionSchemeOpen)}
              className="w-full rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-left text-[11px] text-gray-800 hover:bg-gray-50"
            >
              {partitionScheme === "GPT" ? "GPT — UEFI" : "MBR — BIOS (Legacy)"} ▾
            </button>
            {partitionSchemeOpen && (
              <div className="absolute z-10 top-full mt-0.5 left-0 w-full bg-white border border-[#7a9bb5] shadow-md rounded-sm">
                {(["GPT", "MBR"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      playClick();
                      setPartitionScheme(v);
                      setRufusPartitionScheme(v);
                      setPartitionSchemeOpen(false);
                    }}
                    className={`w-full text-left px-2 py-0.5 text-[11px] hover:bg-[#0078d4] hover:text-white ${partitionScheme === v ? "bg-[#0078d4] text-white" : "text-gray-800"}`}
                  >
                    {v === "GPT" ? "GPT — UEFI" : "MBR — BIOS (Legacy)"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Target system */}
        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Target system</label>
          <div className="flex-1 rounded-sm border border-[#ccc] bg-[#e8e8e8] px-1.5 py-0.5 text-[11px] text-gray-600">
            {partitionScheme === "GPT" ? "UEFI: Non CSM" : "BIOS (or UEFI-CSM)"}
          </div>
        </div>

        {/* Volume label */}
        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Volume label</label>
          <input
            type="text"
            defaultValue={config.iso.filename.replace(/\.iso$/i, "").replace(/[-_]/g, " ").substring(0, 20)}
            className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-[11px] text-gray-800 focus:outline-none focus:border-[#0078d4]"
          />
        </div>

        {/* File system */}
        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">File system</label>
          <select className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-[11px] text-gray-800 focus:outline-none">
            <option>NTFS (Default)</option>
            <option>FAT32</option>
            <option>exFAT</option>
            <option>UDF</option>
          </select>
        </div>

        {/* Cluster size */}
        <div className="flex items-center gap-2">
          <label className="w-28 text-[11px] text-gray-700 shrink-0">Cluster size</label>
          <select className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-[11px] text-gray-800 focus:outline-none">
            <option>Default allocation size</option>
            <option>512 bytes</option>
            <option>1024 bytes</option>
            <option>2048 bytes</option>
            <option>4096 bytes</option>
            <option>8192 bytes</option>
            <option>16 kilobytes</option>
            <option>32 kilobytes</option>
            <option>64 kilobytes</option>
          </select>
        </div>

        {/* Quick format checkbox */}
        <div className="flex items-center gap-2 pl-28">
          <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#4a8c5c] w-3 h-3" />
            Quick format
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="accent-[#4a8c5c] w-3 h-3" />
            Create extended label and icon files
          </label>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {(rufusPhase === "flashing" || rufusPhase === "done") && (
        <div className="bg-[#f0f0f0] px-4 py-1.5">
          <div className="h-3.5 w-full overflow-hidden rounded-sm bg-white border border-[#b0b0b0]">
            <div
              className="h-full rounded-sm transition-all duration-100"
              style={{
                width: `${progress}%`,
                background: rufusPhase === "done"
                  ? "linear-gradient(to bottom, #7ec87e, #5ba05b)"
                  : "linear-gradient(to bottom, #7ec87e, #4a8c5c)",
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
            <span>{rufusPhase === "done" ? "Ready" : `${Math.floor(progress)}%`}</span>
            <span>{rufusPhase === "done" ? "Done." : ""}</span>
          </div>
        </div>
      )}

      {/* ── Log window during flashing ── */}
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

      {/* ── Bottom buttons + status bar ── */}
      <div className="bg-[#f0f0f0] px-4 py-2 flex items-center justify-between" style={{ borderTop: "1px solid #ccc" }}>
        <div className="flex items-center gap-2">
          {rufusPhase === "idle" && (
            <button
              disabled={!isoFile || !device || !!tooSmall}
              onClick={() => { if (isoFile && device && !tooSmall) { playClick(); setRufusPhase("flashing"); } }}
              className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-5 py-1 text-[11px] font-semibold text-gray-800 hover:bg-[#d5d5d5] active:bg-[#c8c8c8] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              START
            </button>
          )}
          {rufusPhase === "done" && (
            <button
              onClick={() => { playClick(); onComplete(); }}
              className="rounded-sm bg-[#4a8c5c] border border-[#3d7a4e] px-5 py-1 text-[11px] font-bold text-white hover:bg-[#3d7a4e]"
            >
              ✓ Flash Complete — Continue →
            </button>
          )}
          <button className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-5 py-1 text-[11px] text-gray-800 hover:bg-[#d5d5d5]">
            CLOSE
          </button>
        </div>
      </div>

      {/* ── Windows status bar ── */}
      <div className="bg-[#f0f0f0] border-t border-[#ccc] px-3 py-0.5 text-[10px] text-gray-500">
        {rufusPhase === "done"
          ? `1 device found — ${config.iso.filename} ready`
          : rufusPhase === "flashing"
            ? `Writing… ${Math.floor(progress)}%`
            : "1 device found"
        }
      </div>

      <FilePickerModal open={pickerOpen} title="Select ISO image"
        files={[{ name: config.iso.filename, icon: "💿", size: config.iso.size }]}
        onSelect={(n) => { playClick(); setIsoFile(n); setRufusPhase("idle"); }}
        onClose={() => setPickerOpen(false)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   VENTOY — Real Ventoy2Disk Win32 app UI
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
      else {
        playSuccess();
        if (phase === "installing") setPhase("copying");
        else setPhase("done");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "done") {
      registerAdvance(() => onComplete());
    }
  }, [phase, registerAdvance, onComplete]);

  const tabs = [
    { id: "ventoy" as const, label: "Ventoy" },
    { id: "option" as const, label: "Option" },
    { id: "configure" as const, label: "Configure" },
    { id: "donate" as const, label: "Donate" },
  ];

  return (
    <div className="mx-auto w-full max-w-xl rounded-lg overflow-hidden shadow-2xl shadow-black/50" style={{ border: "1px solid #888" }}>
      {/* ── Windows title bar ── */}
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

      {/* ── Tabs ── */}
      <div className="bg-[#e8e8e8] px-2 pt-1.5 flex gap-0 border-b border-[#999]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { playClick(); setActiveTab(t.id); }}
            className={`px-4 py-1 text-[11px] font-medium border border-b-0 rounded-t-sm ${
              activeTab === t.id
                ? "bg-white border-[#999] text-gray-800 relative z-10 -mb-px"
                : "bg-[#d4d4d4] border-transparent text-gray-600 hover:bg-[#dcdcdc]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content area ── */}
      <div className="bg-white px-4 py-3 space-y-3">
        {activeTab === "ventoy" && (
          <>
            {/* Device info */}
            <div className="flex items-center gap-2">
              <img src="/images/flash-tools/ventoy.png" alt="" className="h-5 w-5" />
              <span className="text-[11px] font-semibold text-gray-800">
                Ventoy2Disk
              </span>
            </div>

            {/* Device selector */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-gray-600 shrink-0">Device:</label>
              <select className="flex-1 rounded-sm border border-[#7a9bb5] bg-white px-1.5 py-0.5 text-[11px] text-gray-800">
                {USB_DEVICES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>

            {/* Check device checkbox */}
            <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#28a745] w-3 h-3" />
              Check device in list
            </label>

            {/* Install / Update buttons */}
            <div className="flex items-center gap-3 pt-1">
              {(phase === "idle" || phase === "confirming") && (
                <>
                  <button
                    onClick={() => {
                      if (phase === "idle") {
                        playClick();
                        setPhase("confirming");
                      } else {
                        playClick();
                        setPhase("installing");
                      }
                    }}
                    className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-6 py-1.5 text-[11px] font-semibold text-gray-800 hover:bg-[#d5d5d5] active:bg-[#c8c8c8]"
                  >
                    Install
                  </button>
                  <button
                    onClick={() => { playClick(); setPhase("confirming"); }}
                    className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-6 py-1.5 text-[11px] text-gray-800 hover:bg-[#d5d5d5] active:bg-[#c8c8c8]"
                  >
                    Update
                  </button>
                </>
              )}
            </div>

            {/* Confirmation dialog */}
            {phase === "confirming" && (
              <div className="rounded border border-amber-300 bg-amber-50 p-3 space-y-2">
                <div className="text-[11px] text-gray-800 font-semibold">⚠️ Warning</div>
                <div className="text-[10px] text-gray-600">
                  The device will be formatted and all data will be destroyed. Continue?
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { playClick(); setPhase("idle"); }}
                    className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-4 py-0.5 text-[10px] text-gray-800 hover:bg-[#d5d5d5]"
                  >
                    No
                  </button>
                  <button
                    onClick={() => { playClick(); setPhase("installing"); }}
                    className="rounded-sm bg-[#e1e1e1] border border-[#adadad] px-4 py-0.5 text-[10px] text-gray-800 hover:bg-[#d5d5d5]"
                  >
                    Yes
                  </button>
                </div>
              </div>
            )}

            {/* Progress bar */}
            {(phase === "installing" || phase === "copying") && (
              <div className="space-y-1">
                <div className="text-[10px] text-gray-600">
                  {phase === "installing" ? "Installing Ventoy to USB drive…" : "Ventoy installed. Copy ISO files to USB."}
                </div>
                <div className="h-3 w-full overflow-hidden rounded-sm bg-white border border-[#b0b0b0]">
                  <div
                    className="h-full rounded-sm transition-all duration-100"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(to bottom, #5bc0de, #28a745)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Done */}
            {phase === "done" && (
              <div className="space-y-2">
                <div className="text-[11px] text-green-700 font-semibold">✓ Ventoy installed successfully!</div>
                <button
                  onClick={() => { playClick(); onComplete(); }}
                  className="w-full rounded-sm bg-[#4a8c5c] border border-[#3d7a4e] py-1.5 text-[11px] font-bold text-white hover:bg-[#3d7a4e]"
                >
                  ✓ Continue →
                </button>
              </div>
            )}

            {/* ISO copy area (shown after install) */}
            {phase === "copying" && (
              <div className="space-y-2">
                <div className="text-[10px] text-gray-500">Drag your ISO file to the USB drive:</div>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-xl">💿</span>
                    <span className="text-[8px] text-gray-500 text-center leading-tight px-1 break-all max-w-[60px]">{config.iso.filename.substring(0, 15)}</span>
                  </div>
                  <div className="text-xl text-gray-400">→</div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setOverDrop(true); }}
                    onDragLeave={() => setOverDrop(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setOverDrop(false);
                      playUsbConnect();
                      setCopiedFile(true);
                      setProgress(0);
                    }}
                    className={`w-32 h-16 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors cursor-pointer ${
                      overDrop ? "border-[#28a745] bg-green-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"
                    }`}
                  >
                    <span className="text-[10px] text-gray-500">{overDrop ? "Release" : "Drop ISO here"}</span>
                  </div>
                </div>
                {copiedFile && (
                  <div className="h-3 w-full overflow-hidden rounded-sm bg-white border border-[#b0b0b0]">
                    <div
                      className="h-full rounded-sm bg-[#28a745] transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Ventoy info (default tab content) */}
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
            <label className="flex items-center gap-2 text-[11px] text-gray-700 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#28a745] w-3 h-3" />
              Secure Boot Support
            </label>
            <label className="flex items-center gap-2 text-[11px] text-gray-700 cursor-pointer">
              <input type="checkbox" className="accent-[#28a745] w-3 h-3" />
              Partition Style — MBR
            </label>
            <label className="flex items-center gap-2 text-[11px] text-gray-700 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-[#28a745] w-3 h-3" />
              Longest Path (increase max ISO path length)
            </label>
            <div className="text-[10px] text-gray-500 pt-2">Note: Options only apply during Install (not Update).</div>
          </div>
        )}

        {activeTab === "configure" && (
          <div className="py-4 text-center text-[11px] text-gray-500">
            <div className="text-lg mb-2">⚙️</div>
            No additional configuration required for basic use.
          </div>
        )}

        {activeTab === "donate" && (
          <div className="py-4 text-center text-[11px] text-gray-500">
            <div className="text-lg mb-2">❤️</div>
            Ventoy is free and open source. If you find it useful, consider supporting the developer.
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BALENA ETCHER — Real Electron dark UI
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

  useEffect(() => {
    if (etcherPhase === "done") {
      registerAdvance(() => onComplete());
    }
  }, [etcherPhase, registerAdvance, onComplete]);

  const canFlash = selectedFile && selectedTarget;

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl shadow-black/50" style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #12121a 100%)" }}>
      {/* ── Title bar ── */}
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

      {/* ── Main content ── */}
      <div className="px-6 py-8">
        {/* ── Three-step flow (idle state) ── */}
        {etcherPhase !== "flashing" && etcherPhase !== "done" && (
          <>
            <div className="flex items-center gap-4">
              {/* Step 1: Flash from file */}
              <button
                onClick={() => setPickerOpen(true)}
                className={`flex-1 rounded-xl p-5 text-center transition-all border ${
                  selectedFile
                    ? "border-emerald-500/40 bg-emerald-500/[0.08]"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20"
                }`}
              >
                <div className={`text-3xl mb-2 ${selectedFile ? "text-emerald-400" : "text-white/40"}`}>
                  {selectedFile ? "✓" : "📁"}
                </div>
                <div className="text-[11px] font-semibold text-white/80">
                  {selectedFile ? "Flash from file" : "Flash from file"}
                </div>
                {selectedFile && (
                  <div className="mt-1.5 text-[10px] text-emerald-400/80 truncate">{selectedFile}</div>
                )}
                {!selectedFile && (
                  <div className="mt-1 text-[10px] text-white/30">Select an image to flash</div>
                )}
              </button>

              {/* Arrow */}
              <div className="text-white/15 text-xl">›</div>

              {/* Step 2: Select target */}
              <button
                onClick={() => { if (selectedFile) setEtcherPhase("pick_target"); }}
                disabled={!selectedFile}
                className={`flex-1 rounded-xl p-5 text-center transition-all border ${
                  !selectedFile
                    ? "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed"
                    : selectedTarget
                      ? "border-emerald-500/40 bg-emerald-500/[0.08]"
                      : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20"
                }`}
              >
                <div className={`text-3xl mb-2 ${selectedTarget ? "text-emerald-400" : "text-white/40"}`}>
                  {selectedTarget ? "✓" : "🎯"}
                </div>
                <div className="text-[11px] font-semibold text-white/80">Select target</div>
                {selectedTarget && (
                  <div className="mt-1.5 text-[10px] text-emerald-400/80">
                    {USB_DEVICES.find((d) => d.id === selectedTarget)?.short}
                  </div>
                )}
                {!selectedTarget && (
                  <div className="mt-1 text-[10px] text-white/30">Select a drive to flash to</div>
                )}
              </button>

              {/* Arrow */}
              <div className="text-white/15 text-xl">›</div>

              {/* Step 3: Flash! */}
              <button
                onClick={() => { if (canFlash) { playClick(); setEtcherPhase("flashing"); } }}
                disabled={!canFlash}
                className={`flex-1 rounded-xl p-5 text-center transition-all border ${
                  !canFlash
                    ? "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed"
                    : "border-[#6c5ce7]/40 bg-[#6c5ce7]/[0.1] hover:bg-[#6c5ce7]/[0.2] hover:border-[#6c5ce7]/60 cursor-pointer"
                }`}
              >
                <div className={`text-3xl mb-2 ${canFlash ? "text-[#6c5ce7]" : "text-white/40"}`}>⚡</div>
                <div className="text-[11px] font-semibold text-white/80">Flash!</div>
                <div className="mt-1 text-[10px] text-white/30">
                  {canFlash ? "Ready to flash" : "Complete steps 1 & 2 first"}
                </div>
              </button>
            </div>

            {/* Speed selector hint */}
            <div className="mt-6 text-center text-[10px] text-white/20">
              balenaEtcher — {config.iso.filename}
            </div>
          </>
        )}

        {/* ── Pick target overlay ── */}
        {etcherPhase === "pick_target" && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-white/50 mb-2">Select target drive:</div>
            {USB_DEVICES.map((d) => (
              <button
                key={d.id}
                onClick={() => { playClick(); setSelectedTarget(d.id); setEtcherPhase("pick_file"); }}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                  selectedTarget === d.id
                    ? "border-[#6c5ce7] bg-[#6c5ce7]/20 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🔌</span>
                  <span className="font-medium">{d.label}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Flashing progress ── */}
        {etcherPhase === "flashing" && (
          <div className="flex flex-col items-center py-8 space-y-6">
            {/* Circular progress */}
            <div className="relative h-40 w-40">
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="8" />
                <circle
                  cx="80" cy="80" r="70" fill="none" stroke="#6c5ce7" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-100"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-white">{Math.floor(progress)}%</div>
                <div className="text-[10px] text-white/40 mt-1">Flashing…</div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-white/80">{config.iso.filename}</div>
              <div className="text-[10px] text-white/40 mt-0.5">
                → {USB_DEVICES.find((d) => d.id === selectedTarget)?.label}
              </div>
            </div>

            {/* Etcher reference image */}
            <img
              src="/images/flash-tools/etcher.jpg"
              alt="BalenaEtcher"
              className="h-16 w-auto rounded-lg opacity-30"
            />
          </div>
        )}

        {/* ── Done ── */}
        {etcherPhase === "done" && (
          <div className="flex flex-col items-center py-8 space-y-6">
            <div className="h-24 w-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
              <span className="text-4xl text-emerald-400">✓</span>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white">Flash complete!</div>
              <div className="text-sm text-white/50 mt-1">{config.iso.filename}</div>
            </div>
            <button
              onClick={() => { playClick(); onComplete(); }}
              className="rounded-xl bg-emerald-500 px-8 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition-colors"
            >
              ✓ Continue →
            </button>
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
  const [tool, setTool] = useState<"plug_in" | "select" | "rufus" | "ventoy" | "balena" | "unsupported">("select");
  const [overPort, setOverPort] = useState(false);
  const toast = useToast();

  const handleUsbDrop = useCallback(() => {
    setOverPort(false);
    playUsbConnect();
    toast("USB Drive (E:) connected", "🔌");
    setTimeout(() => setTool("select"), 600);
  }, [toast]);

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl space-y-4">
      {/* ═══ PHASE 1: Plug in USB ═══ */}
      {tool === "plug_in" && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#2a2218] via-[#1e1812] to-[#151010]">
          <div className="relative z-10 p-8 lg:p-10">
            <div className="text-center mb-6">
              <div className="text-xs lg:text-sm uppercase tracking-widest text-amber-300/40 font-medium">Step 1</div>
              <h2 className="mt-2 text-xl lg:text-2xl xl:text-3xl font-bold text-white text-center">Plug in your USB drive</h2>
              <p className="mt-2 text-sm lg:text-base text-white/40 text-center">Drag the USB stick onto the computer port.</p>
            </div>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-24 py-8">
              <motion.div draggable onDragStart={() => {}} onDragEnd={() => {}}
                animate={{ y: [0, -6, 0] }}
                transition={{ y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } }}
                whileDrag={{ scale: 1.08, rotate: -8 }}
                className="cursor-grab active:cursor-grabbing select-none">
                <svg viewBox="0 0 60 120" className="w-16 h-28 drop-shadow-lg" fill="none">
                  <rect x="8" y="30" width="44" height="80" rx="4" fill="#3a3a42" stroke="#555" strokeWidth="1.5" />
                  <rect x="16" y="6" width="28" height="28" rx="2" fill="#b0b0b0" stroke="#999" strokeWidth="1" />
                  <rect x="22" y="14" width="4" height="2" rx="0.5" fill="#b87333" />
                  <rect x="22" y="19" width="4" height="2" rx="0.5" fill="#b87333" />
                  <rect x="34" y="14" width="4" height="2" rx="0.5" fill="#b87333" />
                  <rect x="34" y="19" width="4" height="2" rx="0.5" fill="#b87333" />
                  <circle cx="30" cy="42" r="3" fill="#22c55e"><animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.5s" repeatCount="indefinite" /></circle>
                  <rect x="14" y="55" width="32" height="16" rx="2" fill="rgba(0,0,0,0.2)" />
                  <text x="30" y="65" textAnchor="middle" fontSize="6" fontWeight="bold" fill="rgba(255,255,255,0.3)">USB</text>
                </svg>
                <div className="text-center mt-2 text-xs lg:text-sm text-amber-200/40">drag me →</div>
              </motion.div>

              <div onDragOver={(e) => { e.preventDefault(); setOverPort(true); }}
                onDragLeave={() => setOverPort(false)}
                onDrop={(e) => { e.preventDefault(); handleUsbDrop(); }}>
                <div className="relative">
                  {overPort && <div className="absolute -inset-6 rounded-2xl bg-accent/20 blur-xl pointer-events-none" />}
                  <svg viewBox="0 0 120 160" className="w-28 h-36" fill="none">
                    <rect x="10" y="5" width="100" height="150" rx="6" fill="#222226" stroke="#444" strokeWidth="1.5" />
                    <rect x="16" y="10" width="88" height="140" rx="3" fill="#1a1a1e" />
                    <circle cx="60" cy="20" r="4" fill="none" stroke="#555" strokeWidth="1" />
                    <circle cx="60" cy="20" r="1.5" fill="#22c55e" />
                    <rect x="30" y="95" width="24" height="8" rx="1.5" fill="#111" stroke={overPort ? "#7c5cff" : "#333"} strokeWidth={overPort ? "1.5" : "0.8"} />
                    <rect x="66" y="95" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
                    <rect x="30" y="108" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
                    <rect x="66" y="108" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
                    <text x="60" y="70" textAnchor="middle" fontSize="7" fill="#333" fontWeight="bold">DESKTOP PC</text>
                  </svg>
                </div>
                <div className="text-center mt-2">
                  <div className={`text-xs font-medium ${overPort ? "text-accent" : "text-white/30"}`}>{overPort ? "Release to connect" : "Drop USB here"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ PHASE 2: Choose tool ═══ */}
      {tool === "select" && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="text-sm lg:text-base uppercase tracking-widest text-white/40">Step 2</div>
            <h2 className="mt-1 text-xl lg:text-2xl xl:text-3xl font-bold text-white text-center">Choose your flashing tool</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {config.flashers.map((t) => {
              const ok = SUPPORTED_TOOLS.has(t.id);
              const isRufus = t.id === "rufus";
              const isVentoy = t.id === "ventoy";
              const isEtcher = t.id === "balena";
              return (
                <button key={t.id} onClick={() => { playClick(); setTool(ok ? (t.id as typeof tool) : "unsupported"); }}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 lg:p-6 text-center transition-all hover:bg-white/10 group">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
                    {isRufus && <img src="/images/flash-tools/rufus.jpg" alt="Rufus" className="w-full h-full object-cover" />}
                    {isVentoy && <img src="/images/flash-tools/ventoy.png" alt="Ventoy" className="w-full h-full object-cover" />}
                    {isEtcher && <img src="/images/flash-tools/etcher.jpg" alt="BalenaEtcher" className="w-full h-full object-cover" />}
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

      {/* ═══ PHASE 3: Tool UI ═══ */}
      {tool === "rufus" && (
        <div className="space-y-4">
          <button onClick={() => { playClick(); setTool("select"); }} className="text-sm text-white/50 hover:text-white">← Back to tools</button>
          <RufusTool config={config} speed={speed} onComplete={onComplete} setRufusPartitionScheme={setRufusPartitionScheme} />
        </div>
      )}
      {tool === "ventoy" && (
        <div className="space-y-4">
          <button onClick={() => { playClick(); setTool("select"); }} className="text-sm text-white/50 hover:text-white">← Back to tools</button>
          <VentoyTool config={config} speed={speed} onComplete={onComplete} />
        </div>
      )}
      {tool === "balena" && (
        <div className="space-y-4">
          <button onClick={() => { playClick(); setTool("select"); }} className="text-sm text-white/50 hover:text-white">← Back to tools</button>
          <EtcherTool config={config} speed={speed} onComplete={onComplete} />
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
