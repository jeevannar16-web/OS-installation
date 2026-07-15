import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { useToast } from "../shared/Toast";
import FilePickerModal from "../shared/FilePickerModal";
import { playUsbConnect, playSuccess, playClick } from "../shared/sounds";
import { SparkleBurst, Tooltip, PulseHint } from "../shared/InteractiveEffects";

type Phase = "plug_in" | "tool_select" | "rufus" | "ventoy" | "balena" | "unsupported";

const SUPPORTED_TOOLS = new Set(["rufus", "ventoy", "balena"]);

type RufusPhase = "idle" | "selecting_iso" | "ready" | "flashing" | "done";
type VentoyPhase = "idle" | "installing" | "copying" | "done";
type EtcherPhase = "pick_file" | "pick_target" | "flashing" | "done";

const USB_DEVICES = [
  { id: "usb-e", label: "(E:) USB Drive — 32 GB", short: "USB Drive (E:)", sizeGB: 32 },
  { id: "usb-f", label: "(F:) USB Drive — 16 GB", short: "USB Drive (F:)", sizeGB: 16 },
];

function parseSizeGB(sizeStr: string): number {
  const match = sizeStr.match(/([\d.]+)\s*GB/i);
  return match ? parseFloat(match[1]) : 0;
}

function formatLogLine(line: string): { text: string; color?: string } {
  if (line.startsWith("ERROR")) return { text: line, color: "text-red-400" };
  if (line.includes("✓") || line.includes("done") || line.includes("Complete"))
    return { text: line, color: "text-emerald-400" };
  return { text: line, color: "text-white/70" };
}

function RufusTool({
  config,
  speed,
  onFlashDone,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onFlashDone: () => void;
}) {
  const [device, setDevice] = useState(USB_DEVICES[0].id);
  const [isoFile, setIsoFile] = useState<string | null>(null);
  const [partScheme, setPartScheme] = useState("gpt");
  const [fileSys, setFileSys] = useState("ntfs");
  const [rufusPhase, setRufusPhase] = useState<RufusPhase>("idle");
  const [logLines, setLogLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const duration = speed === "fast" ? 1800 : 6000;

  const logSequence = [
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
    let logIdx = 0;
    const logInterval = setInterval(() => {
      if (logIdx < logSequence.length) {
        setLogLines((prev) => [...prev, logSequence[logIdx]]);
        logIdx++;
      }
    }, duration / logSequence.length);

    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        clearInterval(logInterval);
        playSuccess();
        setTimeout(() => {
          setRufusPhase("done");
          onFlashDone();
        }, 400);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(logInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rufusPhase]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  const selectedDevice = USB_DEVICES.find((d) => d.id === device);
  const isoSizeGB = isoFile ? parseSizeGB(config.iso.size) : 0;
  const tooSmall = selectedDevice && isoSizeGB > 0 && isoSizeGB > selectedDevice.sizeGB;

  return (
    <div className="w-full">
      <div className="rounded-xl bg-[#f0f0f0] ring-1 ring-black/10 overflow-hidden">
        {/* Rufus green header */}
        <div className="flex items-center gap-2 bg-[#4a8c5c] px-3 py-2 text-xs text-white">
          <span className="font-bold text-sm">Rufus</span>
          <span className="text-white/70">v4.5.2180</span>
        </div>

        <div className="bg-[#f5f5f5] p-4 space-y-3">
          {/* Device dropdown */}
          <div className="flex items-center gap-3">
            <label className="w-20 sm:w-28 text-xs font-semibold text-gray-600">Device</label>
            <select
              value={device}
              onChange={(e) => { playClick(); setDevice(e.target.value); }}
              className="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800"
            >
              {USB_DEVICES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Boot selection */}
          <div className="flex items-center gap-3">
            <label className="w-20 sm:w-28 text-xs font-semibold text-gray-600">Boot selection</label>
            <button
              onClick={() => setPickerOpen(true)}
              className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
            >
              {isoFile ?? "Click SELECT to choose an ISO…"}
            </button>
            <button
              onClick={() => setPickerOpen(true)}
              className="rounded bg-[#4a8c5c] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#3d7a4e]"
            >
              SELECT
            </button>
          </div>

          {/* File size warning */}
          {tooSmall && (
            <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              ⚠️ ISO ({config.iso.size}) may not fit on the selected drive ({selectedDevice.sizeGB} GB). Consider using a larger USB drive.
            </div>
          )}

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-[#4a8c5c] hover:underline"
          >
            {showAdvanced ? "▼ Hide" : "▶ Show"} advanced drive properties
          </button>

          {showAdvanced && (
            <div className="space-y-2 rounded border border-gray-200 bg-white/50 p-3">
              <div className="flex items-center gap-3">
                <label className="w-20 sm:w-28 text-xs font-semibold text-gray-600">Partition scheme</label>
                <select
                  value={partScheme}
                  onChange={(e) => setPartScheme(e.target.value)}
                  className="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800"
                >
                  <option value="gpt">GPT — UEFI</option>
                  <option value="mbr">MBR — BIOS</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="w-20 sm:w-28 text-xs font-semibold text-gray-600">File system</label>
                <select
                  value={fileSys}
                  onChange={(e) => setFileSys(e.target.value)}
                  className="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800"
                >
                  <option value="ntfs">NTFS</option>
                  <option value="fat32">FAT32</option>
                  <option value="exfat">exFAT</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="w-20 sm:w-28 text-xs font-semibold text-gray-600">Cluster size</label>
                <select className="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800">
                  <option>Default allocation size</option>
                  <option>512 bytes</option>
                  <option>1024 bytes</option>
                  <option>4096 bytes</option>
                </select>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {(rufusPhase === "flashing" || rufusPhase === "done") && (
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
                <motion.div
                  className="h-full rounded bg-[#4a8c5c]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>{rufusPhase === "done" ? "✓ Complete" : `${Math.floor(progress)}%`}</span>
                <span>{config.iso.size}</span>
              </div>
            </div>
          )}

          {/* Log pane */}
          {rufusPhase === "flashing" && (
            <div
              ref={logRef}
              className="h-36 overflow-y-auto rounded border border-gray-200 bg-black p-2 font-mono text-[10px] leading-relaxed"
            >
              {logLines.map((line, i) => {
                const fmt = formatLogLine(line);
                return (
                  <div key={i} className={fmt.color ?? "text-white/70"}>
                    {fmt.text}
                  </div>
                );
              })}
              <span className="animate-pulse text-[#4a8c5c]">▌</span>
            </div>
          )}

          {/* START button with dropdown arrow */}
          {rufusPhase !== "flashing" && rufusPhase !== "done" && (
            <div className="flex">
              <button
                disabled={!isoFile || !device || !!tooSmall}
                onClick={() => {
                  if (isoFile && device && !tooSmall) {
                    playClick();
                    setRufusPhase("flashing");
                  }
                }}
                className="flex-1 rounded py-2 text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#4a8c5c] hover:bg-[#3d7a4e]"
              >
                START
              </button>
              <button
                disabled={!isoFile || !device}
                className="rounded-r border-l border-gray-300 bg-[#4a8c5c] px-2 text-white hover:bg-[#3d7a4e] text-xs"
              >
                ▼
              </button>
            </div>
          )}

          {/* Flash complete banner — replaces START button */}
          {rufusPhase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-emerald-50 border border-emerald-300 p-3 text-center"
            >
              <div className="text-sm font-bold text-emerald-700">✓ Flash Complete</div>
              <div className="text-xs text-emerald-600 mt-1">
                {config.iso.filename} has been written to the USB drive successfully.
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <FilePickerModal
        open={pickerOpen}
        title="Select ISO image"
        files={[{ name: config.iso.filename, icon: "💿", size: config.iso.size }]}
        onSelect={(name) => {
          playClick();
          setIsoFile(name);
          setRufusPhase("ready");
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}

function VentoyTool({
  config,
  speed,
  onFlashDone,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onFlashDone: () => void;
}) {
  const [ventoyPhase, setVentoyPhase] = useState<VentoyPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [over, setOver] = useState(false);

  const installDuration = speed === "fast" ? 800 : 2500;
  const copyDuration = speed === "fast" ? 600 : 1800;

  useEffect(() => {
    if (ventoyPhase !== "installing" && ventoyPhase !== "copying") return;
    const dur = ventoyPhase === "installing" ? installDuration : copyDuration;
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / dur) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        playSuccess();
        setTimeout(() => {
          if (ventoyPhase === "installing") setVentoyPhase("copying");
          else {
            setVentoyPhase("done");
            onFlashDone();
          }
        }, 300);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventoyPhase]);

  return (
    <div className="rounded-xl bg-[#1a1a2e] ring-1 ring-white/10 overflow-hidden p-5 space-y-4">
      <div className="flex items-center gap-2 text-white/90 text-sm font-semibold">
        <span className="text-lg">📦</span> Ventoy
      </div>

      {ventoyPhase === "idle" && (
        <button
          onClick={() => { playClick(); setVentoyPhase("installing"); }}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-white hover:bg-accent-soft transition-colors"
        >
          Install Ventoy to USB
        </button>
      )}

      {ventoyPhase === "installing" && (
        <div className="space-y-2">
          <div className="text-xs text-white/60">Installing Ventoy to USB drive…</div>
          <div className="h-2 w-full overflow-hidden rounded bg-white/10">
            <motion.div
              className="h-full rounded bg-accent"
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {ventoyPhase === "copying" && (
        <div className="space-y-3">
          <div className="text-xs text-white/50">
            Ventoy is installed — just copy the ISO. No reformat needed.
          </div>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <motion.div
              draggable
              onDragStart={() => setDragging(true)}
              onDragEnd={() => { setDragging(false); setOver(false); }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95, rotate: -2 }}
              className="flex w-24 cursor-grab flex-col items-center gap-1 active:cursor-grabbing"
            >
              <div
                className="flex h-16 w-16 items-center justify-center rounded-lg text-3xl shadow-lg"
                style={{
                  background: `${config.branding.accent}22`,
                  border: `1px solid ${config.branding.accent}55`,
                }}
              >
                💿
              </div>
              <div className="w-24 break-words text-center text-[10px] text-white/70">
                {config.iso.filename}
              </div>
            </motion.div>

            <motion.div
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                setDragging(false);
                setProgress(0);
                playUsbConnect();
                setVentoyPhase("copying");
                setTimeout(() => {
                  playSuccess();
                  setVentoyPhase("done");
                }, copyDuration);
              }}
              animate={over ? { scale: 1.05, boxShadow: "0 0 20px rgba(124,92,255,0.3)" } : { scale: 1 }}
              className={`flex h-24 w-40 items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                over
                  ? "border-accent bg-accent/20"
                  : "border-white/20 bg-white/5"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl">🔌</div>
                <div className="text-[10px] text-white/50 mt-1">
                  {over ? "Release to copy" : "Drop ISO here"}
                </div>
              </div>
            </motion.div>
          </div>

          {dragging && (
            <div className="text-xs text-accent-soft">
              Drag the ISO onto the USB drive →
            </div>
          )}

          {ventoyPhase === "copying" && (
            <div className="h-2 w-full overflow-hidden rounded bg-white/10">
              <motion.div
                className="h-full rounded bg-emerald-500"
                animate={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {ventoyPhase === "done" && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center space-y-2">
          <div className="text-emerald-400 text-sm font-bold">✓ ISO copied to Ventoy USB</div>
          <div className="text-xs text-white/40">Your bootable USB is ready to go.</div>
        </div>
      )}
    </div>
  );
}

function EtcherTool({
  config,
  speed,
  onFlashDone,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onFlashDone: () => void;
}) {
  const [etcherPhase, setEtcherPhase] = useState<EtcherPhase>("pick_file");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);

  const flashDuration = speed === "fast" ? 1200 : 4000;

  useEffect(() => {
    if (etcherPhase !== "flashing") return;
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / flashDuration) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        playSuccess();
        setTimeout(() => {
          setEtcherPhase("done");
          onFlashDone();
        }, 400);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etcherPhase]);

  const steps = [
    { label: "Flash from file", done: !!selectedFile, onClick: () => setPickerOpen(true), icon: "📁" },
    { label: "Select target", done: !!selectedTarget, onClick: () => { if (selectedFile) setEtcherPhase("pick_target"); }, icon: "🎯", disabled: !selectedFile },
    { label: "Flash!", done: false, onClick: () => { if (selectedFile && selectedTarget) { playClick(); setEtcherPhase("flashing"); } }, icon: "⚡", disabled: !selectedFile || !selectedTarget },
  ];

  return (
    <div className="rounded-xl bg-[#1a1a2e] ring-1 ring-white/10 overflow-hidden p-5 space-y-4">
      <div className="flex items-center gap-2 text-white/90 text-sm font-semibold">
        <span className="text-lg">⚗️</span> BalenaEtcher
      </div>

      <div className="flex gap-3">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => { if (!s.disabled) playClick(); s.onClick(); }}
            disabled={s.disabled}
            className={`flex-1 rounded-xl border p-3 text-center text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              s.done
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            <div className="text-xl mb-1">{s.icon}</div>
            {s.done ? "✓ " : ""}{s.label}
          </button>
        ))}
      </div>

      {etcherPhase === "pick_target" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="text-xs text-white/50">Select target drive:</div>
          {USB_DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => { playClick(); setSelectedTarget(d.id); setEtcherPhase("pick_file"); }}
              className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                selectedTarget === d.id
                  ? "border-accent bg-accent/20 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🔌</span>
                <span className="font-medium">{d.label}</span>
              </div>
            </button>
          ))}
        </motion.div>
      )}

      {etcherPhase === "flashing" && (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="4" />
              <circle
                cx="24" cy="24" r="20" fill="none" stroke="#6c5ce7" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
              {Math.floor(progress)}%
            </div>
          </div>
          <div>
            <div className="text-sm text-white/80">Flashing…</div>
            <div className="text-xs text-white/40">{config.iso.filename}</div>
          </div>
        </div>
      )}

      {etcherPhase === "done" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xl text-white">✓</div>
          <div>
            <div className="text-sm font-bold text-emerald-400">Flash Complete!</div>
            <div className="text-xs text-white/50">Your USB is ready to boot.</div>
          </div>
        </motion.div>
      )}

      <FilePickerModal
        open={pickerOpen}
        title="Select image to flash"
        files={[{ name: config.iso.filename, icon: "💿", size: config.iso.size }]}
        onSelect={(name) => { playClick(); setSelectedFile(name); setEtcherPhase("pick_file"); }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}

export default function FlashUSB({
  config,
  speed,
  onComplete,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("plug_in");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [ejected, setEjected] = useState(false);
  const [usbConnected, setUsbConnected] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [overPort, setOverPort] = useState(false);
  const [flashComplete, setFlashComplete] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const toast = useToast();

  const handleUsbDrop = useCallback(() => {
    setDragging(false);
    setOverPort(false);
    setUsbConnected(true);
    playUsbConnect();
    toast("USB Drive (E:) — Removable Disk connected", "🔌");
    setTimeout(() => setPhase("tool_select"), 800);
  }, [toast]);

  useEffect(() => {
    if (flashComplete) {
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 1500);
    }
  }, [flashComplete]);

  const tools = config.flashers;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <SparkleBurst trigger={showSparkle} />
      <AnimatePresence mode="wait">
        {/* PHASE 1: USB Plug-in — realistic desk scene */}
        {phase === "plug_in" && (
          <motion.div
            key="plug_in"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative overflow-hidden rounded-2xl"
          >
            {/* Physical desk backdrop */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#2a2218] via-[#1e1812] to-[#151010] rounded-2xl" />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,220,160,0.1) 3px, rgba(255,220,160,0.1) 4px), repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,220,160,0.05) 8px, rgba(255,220,160,0.05) 9px)"
              }}
            />

            <div className="relative z-10 p-8">
              <div className="text-center mb-8">
                <div className="text-xs uppercase tracking-widest text-amber-300/40 font-medium">Step 1</div>
                <h2 className="mt-2 text-xl font-bold text-white">Plug in your USB drive</h2>
                <p className="mt-2 text-sm text-white/40">
                  Drag the USB stick onto the computer port to connect it.
                </p>
              </div>

              <div className="relative flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-24 py-8">
                {/* USB Stick with realistic SVG */}
                <Tooltip text="Grab and drag me to the port →">
                  <motion.div
                    draggable
                    onDragStart={() => setDragging(true)}
                    onDragEnd={() => { if (!overPort) setDragging(false); }}
                    animate={
                      dragging
                        ? { scale: 1.08, rotate: -8 }
                        : { scale: 1, rotate: 0, y: [0, -6, 0] }
                    }
                    transition={
                      dragging
                        ? { type: "spring", stiffness: 300, damping: 15 }
                        : { y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } }
                    }
                    whileDrag={{ filter: "drop-shadow(0 8px 24px rgba(124,92,255,0.4))" }}
                    className="cursor-grab active:cursor-grabbing select-none"
                  >
                    <svg viewBox="0 0 60 120" className="w-16 h-28 drop-shadow-lg" fill="none">
                      <rect x="8" y="30" width="44" height="80" rx="4" fill="url(#usbBodyFlash)" stroke="#555" strokeWidth="1.5" />
                      <rect x="16" y="6" width="28" height="28" rx="2" fill="url(#usbMetalFlash)" stroke="#999" strokeWidth="1" />
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
                        <linearGradient id="usbBodyFlash" x1="8" y1="30" x2="52" y2="110" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stopColor="#4a4a52" />
                          <stop offset="0.5" stopColor="#2a2a30" />
                          <stop offset="1" stopColor="#1a1a20" />
                        </linearGradient>
                        <linearGradient id="usbMetalFlash" x1="16" y1="6" x2="44" y2="34" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stopColor="#c0c0c0" />
                          <stop offset="0.5" stopColor="#a0a0a0" />
                          <stop offset="1" stopColor="#808080" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="text-center mt-2 text-[10px] text-amber-200/40">drag me →</div>
                  </motion.div>
                </Tooltip>

                {/* PC Tower with USB port */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setOverPort(true); }}
                  onDragLeave={() => setOverPort(false)}
                  onDrop={(e) => { e.preventDefault(); handleUsbDrop(); }}
                >
                  <div className="relative">
                    {overPort && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute -inset-6 rounded-2xl bg-accent/20 blur-xl pointer-events-none"
                      />
                    )}
                    <svg viewBox="0 0 120 160" className="w-28 h-36" fill="none">
                      <rect x="10" y="5" width="100" height="150" rx="6" fill="url(#towerBodyFlash)" stroke="#444" strokeWidth="1.5" />
                      <rect x="16" y="10" width="88" height="140" rx="3" fill="#1a1a1e" />
                      <circle cx="60" cy="20" r="4" fill="none" stroke="#555" strokeWidth="1" />
                      <circle cx="60" cy="20" r="1.5" fill="#22c55e" />
                      {/* USB port — glows when dragging over */}
                      <rect x="30" y="95" width="24" height="8" rx="1.5" fill="#111" stroke={overPort ? "#7c5cff" : "#333"} strokeWidth={overPort ? "1.5" : "0.8"} />
                      {overPort && (
                        <>
                          <rect x="30" y="95" width="24" height="8" rx="1.5" fill="none" stroke="#7c5cff" strokeWidth="1.5">
                            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.8s" repeatCount="indefinite" />
                          </rect>
                          <rect x="28" y="93" width="28" height="12" rx="2" fill="none" stroke="#7c5cff" strokeWidth="1" opacity="0.4">
                            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="0.6s" repeatCount="indefinite" />
                          </rect>
                        </>
                      )}
                      <rect x="66" y="95" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
                      <rect x="30" y="108" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
                      <rect x="66" y="108" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line key={i} x1="24" y1={125 + i * 5} x2="96" y2={125 + i * 5} stroke="#222" strokeWidth="1" />
                      ))}
                      <text x="60" y="70" textAnchor="middle" fontSize="7" fill="#333" fontWeight="bold">DESKTOP PC</text>
                      <defs>
                        <linearGradient id="towerBodyFlash" x1="10" y1="5" x2="110" y2="155" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stopColor="#2a2a2e" />
                          <stop offset="1" stopColor="#1a1a1e" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="text-center mt-2">
                    <div className={`text-xs font-medium ${overPort ? "text-accent" : "text-white/30"}`}>
                      {overPort ? "Release to connect" : "Drop USB here"}
                    </div>
                  </div>
                </div>

                {/* Connection line indicator */}
                {overPort && (
                  <motion.div
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 0.4 }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent origin-left pointer-events-none hidden sm:block"
                  />
                )}
              </div>

              <AnimatePresence>
                {usbConnected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm text-emerald-400 font-medium"
                  >
                    ✓ USB drive connected!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: Tool Selection */}
        {phase === "tool_select" && (
          <motion.div
            key="tool_select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="text-sm uppercase tracking-widest text-white/40">Step 2</div>
              <h2 className="mt-1 text-xl font-bold text-white">Choose your flashing tool</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tools.map((t) => {
                const supported = SUPPORTED_TOOLS.has(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      playClick();
                      setSelectedTool(t.id);
                      setPhase(supported ? (t.id as Phase) : "unsupported");
                    }}
                    className={`rounded-xl border p-4 text-center transition-all hover:bg-white/10 ${
                      selectedTool === t.id
                        ? "border-accent bg-accent/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {t.id === "rufus" ? "🟢" : t.id === "ventoy" ? "📦" : t.id === "balena" ? "⚗️" : "🔧"}
                    </div>
                    <div className="text-sm font-bold text-white/90">{t.name}</div>
                    <div className="mt-1 text-xs text-white/50">{t.note}</div>
                    {!supported && (
                      <div className="mt-2 text-[10px] text-amber-400/80 font-medium">Coming soon</div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* PHASE 3: Tool UIs */}
        {(phase === "rufus" || phase === "ventoy" || phase === "balena" || phase === "unsupported") && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <button
              onClick={() => { playClick(); setPhase("tool_select"); setSelectedTool(null); }}
              className="text-sm text-white/50 hover:text-white flex items-center gap-1"
            >
              ← Back to tools
            </button>

            {phase === "rufus" && <RufusTool config={config} speed={speed} onFlashDone={() => setFlashComplete(true)} />}
            {phase === "ventoy" && <VentoyTool config={config} speed={speed} onFlashDone={() => setFlashComplete(true)} />}
            {phase === "balena" && <EtcherTool config={config} speed={speed} onFlashDone={() => setFlashComplete(true)} />}
            {phase === "unsupported" && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
                <div className="text-3xl mb-3">⚠️</div>
                <div className="text-lg font-semibold text-amber-300">Tool not yet supported</div>
                <p className="mt-2 text-sm text-white/50 max-w-md mx-auto">
                  <strong>{selectedTool && tools.find((t) => t.id === selectedTool)?.name}</strong> isn't
                  implemented in this simulator yet. Please use <strong>Rufus</strong>,{' '}
                  <strong>Ventoy</strong>, or <strong>BalenaEtcher</strong> to continue.
                </p>
                <button
                  onClick={() => { playClick(); setPhase("tool_select"); setSelectedTool(null); }}
                  className="mt-4 rounded-lg bg-white/10 px-5 py-2 text-sm font-medium text-white hover:bg-white/15 transition-colors"
                >
                  ← Choose a different tool
                </button>
              </div>
            )}

            {/* Safely Eject — only show after flashing is complete */}
            {flashComplete && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 text-center space-y-3">
                  <div className="text-sm font-semibold text-white/80">
                    ✅ USB drive is ready — one last step
                  </div>
                  <p className="text-xs text-white/40">
                    Safely eject the USB drive before plugging it into the target machine.
                  </p>
                  {ejected ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-sm text-emerald-400 font-medium"
                    >
                      ✓ Safe to Remove Hardware
                    </motion.div>
                  ) : (
                    <PulseHint>
                      <button
                        onClick={() => {
                          playClick();
                          setEjected(true);
                          toast("Safe to Remove Hardware", "✅");
                          setTimeout(() => onComplete(), 1200);
                        }}
                        className="rounded-xl bg-accent px-8 py-3 text-sm font-bold text-white hover:bg-accent-soft transition-colors shadow-lg shadow-accent/20"
                      >
                        ⏏️ Safely Eject USB
                      </button>
                    </PulseHint>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
