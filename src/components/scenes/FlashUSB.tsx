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

/* ─── Rufus ─── */
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [partitionScheme, setPartitionScheme] = useState<"GPT" | "MBR">("GPT");
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
    <div className="rounded-xl bg-[#f0f0f0] ring-1 ring-black/10 overflow-hidden">
      <div className="flex items-center gap-2 bg-[#4a8c5c] px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm text-white">
        <img src="/images/rufus-real.jpg" alt="Rufus" className="h-5 lg:h-6 w-auto rounded-sm opacity-80" />
        <span className="font-bold text-sm lg:text-base">Rufus</span>
        <span className="text-white/70">v4.5.2180</span>
      </div>
      <div className="bg-[#f5f5f5] p-4 lg:p-6 space-y-3">
        <div className="flex items-center gap-3">
          <label className="w-20 sm:w-28 text-xs lg:text-sm font-semibold text-gray-600">Device</label>
          <select value={device} onChange={(e) => { playClick(); setDevice(e.target.value); }}
            className="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800">
            {USB_DEVICES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-20 sm:w-28 text-xs font-semibold text-gray-600">Boot selection</label>
          <button onClick={() => setPickerOpen(true)}
            className="flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50">
            {isoFile ?? "Click SELECT to choose an ISO…"}
          </button>
          <button onClick={() => setPickerOpen(true)}
            className="rounded bg-[#4a8c5c] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#3d7a4e]">SELECT</button>
        </div>
        {tooSmall && (
          <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ⚠️ ISO ({config.iso.size}) may not fit on {selected!.sizeGB} GB drive.
          </div>
        )}
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs text-[#4a8c5c] hover:underline">
          {showAdvanced ? "▼ Hide" : "▶ Show"} advanced drive properties
        </button>
        {showAdvanced && (
          <div className="space-y-2 rounded border border-gray-200 bg-white/50 p-3">
            <div className="flex items-center gap-3">
              <label className="w-20 sm:w-28 text-xs font-semibold text-gray-600">Partition scheme</label>
              <select
                value={partitionScheme}
                onChange={(e) => {
                  playClick();
                  const val = e.target.value as "GPT" | "MBR";
                  setPartitionScheme(val);
                  setRufusPartitionScheme(val);
                }}
                className="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800"
              >
                <option value="GPT">GPT — UEFI</option>
                <option value="MBR">MBR — BIOS (Legacy)</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="w-20 sm:w-28 text-xs font-semibold text-gray-600">File system</label>
              <select className="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800">
                <option>NTFS</option><option>FAT32</option><option>exFAT</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="w-20 sm:w-28 text-xs font-semibold text-gray-600">Cluster size</label>
              <select className="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800">
                <option>Default allocation size</option><option>512 bytes</option><option>4096 bytes</option>
              </select>
            </div>
          </div>
        )}
        {(rufusPhase === "flashing" || rufusPhase === "done") && (
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
              <div className="h-full rounded bg-[#4a8c5c] transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs lg:text-sm text-gray-500">
              <span>{rufusPhase === "done" ? "✓ Complete" : `${Math.floor(progress)}%`}</span>
              <span>{config.iso.size}</span>
            </div>
          </div>
        )}
        {rufusPhase === "flashing" && (
          <div ref={logRef} className="h-36 lg:h-48 overflow-y-auto rounded border border-gray-200 bg-black p-2 font-mono text-xs lg:text-sm leading-relaxed">
            {logLines.filter(Boolean).map((l, i) => (
              <div key={i} className={l.startsWith("ERROR") ? "text-red-400" : (l.includes("✓") || l.includes("Done")) ? "text-emerald-400" : "text-white/70"}>{l}</div>
            ))}
            <span className="animate-pulse text-[#4a8c5c]">▌</span>
          </div>
        )}
        {rufusPhase === "idle" && (
          <button disabled={!isoFile || !device || !!tooSmall} onClick={() => { if (isoFile && device && !tooSmall) { playClick(); setRufusPhase("flashing"); } }}
            className="w-full rounded py-2 text-sm font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[#4a8c5c] hover:bg-[#3d7a4e]">
            START
          </button>
        )}
        {rufusPhase === "done" && (
          <button onClick={() => { console.log("[FlashUSB] Rufus onComplete clicked"); playClick(); onComplete(); }}
            className="w-full rounded-lg bg-[#4a8c5c] py-3 text-sm font-bold text-white hover:bg-[#3d7a4e] transition-colors shadow-lg shadow-[#4a8c5c]/20">
            ✓ Flash Complete — Continue →
          </button>
        )}
      </div>
      <FilePickerModal open={pickerOpen} title="Select ISO image"
        files={[{ name: config.iso.filename, icon: "💿", size: config.iso.size }]}
        onSelect={(n) => { playClick(); setIsoFile(n); setRufusPhase("idle"); }}
        onClose={() => setPickerOpen(false)} />
    </div>
  );
}

/* ─── Ventoy ─── */
function VentoyTool({ config, speed, onComplete }: { config: OSConfig; speed: "normal" | "fast"; onComplete: () => void }) {
  const { register: registerAdvance } = useSceneAdvance();
  const [phase, setPhase] = useState<"idle" | "installing" | "copying" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [over, setOver] = useState(false);
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

  return (
    <div className="rounded-xl bg-[#1a1a2e] ring-1 ring-white/10 overflow-hidden p-5 space-y-4">
      <div className="flex items-center gap-2 text-white/90 text-sm font-semibold"><span className="text-lg">📦</span> Ventoy</div>
      {phase === "idle" && (
        <button onClick={() => { playClick(); setPhase("installing"); }}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-white hover:bg-accent-soft transition-colors">Install Ventoy to USB</button>
      )}
      {phase === "installing" && (
        <div className="space-y-2">
          <div className="text-xs text-white/60">Installing Ventoy to USB drive…</div>
          <div className="h-2 w-full overflow-hidden rounded bg-white/10">
            <div className="h-full rounded bg-accent transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {phase === "copying" && (
        <div className="space-y-3">
          <div className="text-xs text-white/50">Ventoy is installed — just copy the ISO.</div>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex w-24 flex-col items-center gap-1">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg text-3xl shadow-lg" style={{ background: `${config.branding.accent}22`, border: `1px solid ${config.branding.accent}55` }}>💿</div>
              <div className="w-24 break-words text-center text-xs lg:text-sm text-white/70">{config.iso.filename}</div>
            </div>
            <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); setProgress(0); playUsbConnect(); setPhase("copying"); }}
              className={`flex h-24 w-40 items-center justify-center rounded-xl border-2 border-dashed transition-colors ${over ? "border-accent bg-accent/20" : "border-white/20 bg-white/5"}`}>
              <div className="text-center"><div className="text-2xl">🔌</div><div className="text-xs lg:text-sm text-white/50 mt-1">{over ? "Release to copy" : "Drop ISO here"}</div></div>
            </div>
          </div>
          {phase === "copying" && (
            <div className="h-2 w-full overflow-hidden rounded bg-white/10">
              <div className="h-full rounded bg-emerald-500 transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}
      {phase === "done" && (
        <button onClick={() => { console.log("[FlashUSB] Ventoy onComplete clicked"); playClick(); onComplete(); }}
          className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
          ✓ ISO copied — Continue →
        </button>
      )}
    </div>
  );
}

/* ─── BalenaEtcher ─── */
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

  const steps = [
    { label: "Flash from file", done: !!selectedFile, onClick: () => setPickerOpen(true), icon: "📁" },
    { label: "Select target", done: !!selectedTarget, onClick: () => { if (selectedFile) setEtcherPhase("pick_target"); }, icon: "🎯", disabled: !selectedFile },
    { label: "Flash!", done: false, onClick: () => { if (selectedFile && selectedTarget) { playClick(); setEtcherPhase("flashing"); } }, icon: "⚡", disabled: !selectedFile || !selectedTarget },
  ];

  return (
    <div className="rounded-xl bg-[#1a1a2e] ring-1 ring-white/10 overflow-hidden p-5 space-y-4">
      <div className="flex items-center gap-2 text-white/90 text-sm font-semibold"><span className="text-lg">⚗️</span> BalenaEtcher</div>
      <div className="flex gap-3">
        {steps.map((s, i) => (
          <button key={i} onClick={() => { if (!s.disabled) playClick(); s.onClick(); }} disabled={s.disabled}
            className={`flex-1 rounded-xl border p-3 text-center text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${s.done ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}>
            <div className="text-xl mb-1">{s.icon}</div>{s.done ? "✓ " : ""}{s.label}
          </button>
        ))}
      </div>
      {etcherPhase === "pick_target" && (
        <div className="space-y-2">
          <div className="text-xs text-white/50">Select target drive:</div>
          {USB_DEVICES.map((d) => (
            <button key={d.id} onClick={() => { playClick(); setSelectedTarget(d.id); setEtcherPhase("pick_file"); }}
              className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${selectedTarget === d.id ? "border-accent bg-accent/20 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}>
              <div className="flex items-center gap-2"><span>🔌</span><span className="font-medium">{d.label}</span></div>
            </button>
          ))}
        </div>
      )}
      {etcherPhase === "flashing" && (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12">
            <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="white" strokeOpacity="0.1" strokeWidth="4" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="#6c5ce7" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs lg:text-sm font-bold text-white">{Math.floor(progress)}%</div>
          </div>
          <div><div className="text-sm text-white/80">Flashing…</div><div className="text-xs text-white/40">{config.iso.filename}</div></div>
        </div>
      )}
      {etcherPhase === "done" && (
        <button onClick={() => { console.log("[FlashUSB] Etcher onComplete clicked"); playClick(); onComplete(); }}
          className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
          ✓ Flash Complete — Continue →
        </button>
      )}
      <FilePickerModal open={pickerOpen} title="Select image to flash"
        files={[{ name: config.iso.filename, icon: "💿", size: config.iso.size }]}
        onSelect={(n) => { playClick(); setSelectedFile(n); setEtcherPhase("pick_file"); }}
        onClose={() => setPickerOpen(false)} />
    </div>
  );
}

/* ─── Main FlashUSB Component ─── */
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
  const [tool, setTool] = useState<"plug_in" | "select" | "rufus" | "ventoy" | "balena" | "unsupported">("plug_in");
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
              <h2 className="mt-2 text-xl lg:text-2xl xl:text-3xl font-bold text-white">Plug in your USB drive</h2>
              <p className="mt-2 text-sm lg:text-base text-white/40">Drag the USB stick onto the computer port.</p>
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
            <h2 className="mt-1 text-xl lg:text-2xl xl:text-3xl font-bold text-white">Choose your flashing tool</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {config.flashers.map((t) => {
              const ok = SUPPORTED_TOOLS.has(t.id);
              return (
                <button key={t.id} onClick={() => { playClick(); setTool(ok ? (t.id as typeof tool) : "unsupported"); }}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 lg:p-6 text-center transition-all hover:bg-white/10">
                  <div className="text-2xl lg:text-4xl mb-2">{t.id === "rufus" ? "🟢" : t.id === "ventoy" ? "📦" : t.id === "balena" ? "⚗️" : "🔧"}</div>
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
