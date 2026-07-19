import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick, playSuccess } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type WizardPhase = "boot" | "wizard" | "installing" | "remove_media" | "done";

const LANGUAGES = [
  "English", "Español", "Français", "Deutsch", "Português (Brasil)",
  "Italiano", "中文 (简体)", "日本語", "한국어", "Русский",
];

const KEYBOARD_LAYOUTS = [
  "English (US)", "English (UK)", "English (India)", "Español (Latinoamérica)",
  "Français", "Deutsch", "Italiano", "Português (Brasil)", "Dvorak", "Colemak",
];

function Field({ label, value, onChange, placeholder, type, autoFocus, light }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean; light?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className={`block text-xs mb-1 font-medium ${light ? "text-white/70" : "text-gray-700"}`}>{label}</label>
      <input type={type || "text"} value={value} onChange={e => { playKeyClick(); onChange(e.target.value); }}
        placeholder={placeholder || ""} autoFocus={autoFocus}
        className={`w-full border rounded px-3 py-2 text-sm outline-none transition-colors ${
          light
            ? "border-white/20 bg-white/10 text-white placeholder-white/30 focus:border-white/40"
            : "border-gray-300 bg-white text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        }`} />
    </div>
  );
}

export default function Install({ config, speed, onComplete, path }: {
  config: OSConfig; speed: "normal" | "fast"; onComplete: () => void; path?: string;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const isWindows = config.id === "windows";
  const accent = config.branding.accent;
  const surface = config.branding.surface;
  const osName = config.branding.name;
  const isDark = config.id === "zorin";
  const [phase, setPhase] = useState<WizardPhase>(isWindows ? "installing" : "boot");
  const [bootSplash, setBootSplash] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [installType, setInstallType] = useState<string>(path === "vm" ? "erase" : "erase");
  const [progress, setProgress] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);
  const [fileIdx, setFileIdx] = useState(0);
  const [restartPhase, setRestartPhase] = useState<"countdown" | "done">("countdown");
  const [selectedLang, setSelectedLang] = useState("");
  const [selectedKb, setSelectedKb] = useState("");

  const wizard = config.wizard;
  const hasPartition = installType === "something";
  const allSteps = hasPartition
    ? [...wizard.slice(0, wizard.findIndex(s => s.kind === "disk") + 1), { kind: "partition" as const, title: "Partition disks" }, ...wizard.slice(wizard.findIndex(s => s.kind === "disk") + 1)]
    : wizard;
  const currentStep = allSteps[stepIdx];

  const installDuration = speed === "fast" ? 2000 : 12000;

  useEffect(() => {
    if (phase === "installing") registerAdvance(() => onComplete());
  }, [phase, registerAdvance, onComplete]);

  useEffect(() => {
    if (phase !== "installing") return;
    setProgress(0); setFileIdx(0);
    const start = performance.now();
    let raf = 0;
    const files = config.installFiles;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / installDuration) * 100);
      setProgress(pct);
      setFileIdx(Math.min(files.length - 1, Math.floor((pct / 100) * files.length)));
      if (pct < 100) raf = requestAnimationFrame(tick);
      else { setShowSparkle(true); setTimeout(() => setShowSparkle(false), 1500); setPhase(isWindows ? "done" : "remove_media"); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, installDuration, config.installFiles]);

  useEffect(() => {
    if (bootSplash) {
      const t = setTimeout(() => { setBootSplash(false); setPhase("wizard"); }, speed === "fast" ? 800 : 2000);
      return () => clearTimeout(t);
    }
  }, [bootSplash, speed]);

  useEffect(() => {
    if (phase === "done" && restartPhase === "countdown") {
      const t = setTimeout(() => setRestartPhase("done"), speed === "fast" ? 2000 : 4000);
      return () => clearTimeout(t);
    }
  }, [phase, restartPhase, speed]);

  function canAdvance(): boolean {
    switch (currentStep?.kind) {
      case "language": return !!selectedLang;
      case "keyboard": return !!selectedKb;
      case "account": return !!(values["username"] || "").trim() && !!(values["password"] || "").trim();
      default: return true;
    }
  }

  function handleNext() {
    if (phase === "done") { playSuccess(); onComplete(); return; }
    if (phase === "boot") { playClick(); setBootSplash(true); return; }
    if (phase === "remove_media") { playClick(); setPhase("done"); return; }
    if (!canAdvance()) return;
    playClick();
    if (stepIdx >= allSteps.length - 1) { setPhase("installing"); return; }
    if (currentStep?.kind === "confirm") { setPhase("installing"); return; }
    setStepIdx(p => p + 1);
  }

  function handleBack() {
    if (stepIdx <= 0) return;
    playClick();
    setStepIdx(p => p - 1);
  }

  function renderStepContent() {
    if (!currentStep) return null;
    switch (currentStep.kind) {
      case "language": {
        const opts = "options" in currentStep ? currentStep.options : LANGUAGES;
        return (
          <div>
            <h2 className={`text-base font-semibold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>{currentStep.title}</h2>
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
              {opts.map(l => (
                <button key={l} onClick={() => { playClick(); setSelectedLang(l); }}
                  className={`rounded px-3 py-1.5 text-xs transition-all ${
                    selectedLang === l
                      ? "text-white font-semibold shadow-sm"
                      : isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  style={selectedLang === l ? { background: accent } : {}}>{l}</button>
              ))}
            </div>
          </div>
        );
      }
      case "keyboard": {
        const layouts = "layouts" in currentStep ? currentStep.layouts : KEYBOARD_LAYOUTS;
        return (
          <div>
            <h2 className={`text-base font-semibold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>{currentStep.title}</h2>
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
              {layouts.map(k => (
                <button key={k} onClick={() => { playClick(); setSelectedKb(k); }}
                  className={`rounded px-3 py-1.5 text-xs transition-all ${
                    selectedKb === k
                      ? "text-white font-semibold shadow-sm"
                      : isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  style={selectedKb === k ? { background: accent } : {}}>{k}</button>
              ))}
            </div>
          </div>
        );
      }
      case "network": {
        const nets = "interfaces" in currentStep ? currentStep.interfaces : [];
        return (
          <div>
            <h2 className={`text-base font-semibold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>{currentStep.title}</h2>
            <div className="space-y-1.5">
              {nets.map(n => (
                <button key={n.id} onClick={() => { playClick(); setValues(p => ({...p, network: n.id})); }}
                  className={`block text-xs text-left w-full py-2 px-3 rounded transition-all ${
                    values["network"] === n.id
                      ? "text-white font-semibold" : isDark ? "text-white/60 hover:text-white/80 hover:bg-white/5" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  style={values["network"] === n.id ? { background: accent } : {}}>
                  <span className="mr-2">{n.signal && n.signal >= 4 ? "📶" : n.signal ? "📡" : "🔗"}</span>
                  {n.label}
                </button>
              ))}
              <button onClick={() => { playClick(); setValues(p => ({...p, network: "skip"})); }}
                className={`block text-xs text-left w-full py-2 px-3 rounded transition-all ${
                  values["network"] === "skip" ? "text-white font-semibold" : isDark ? "text-white/40 hover:text-white/60" : "text-gray-500 hover:text-gray-700"
                }`}
                style={values["network"] === "skip" ? { background: accent } : {}}>I don't want to connect to a network</button>
            </div>
          </div>
        );
      }
      case "timezone": {
        const zones = "zones" in currentStep ? currentStep.zones : [];
        return (
          <div>
            <h2 className={`text-base font-semibold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>{currentStep.title}</h2>
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
              {zones.map(tz => (
                <button key={tz} onClick={() => { playClick(); setValues(p => ({...p, timezone: tz})); }}
                  className={`rounded px-3 py-1.5 text-xs transition-all ${
                    values["timezone"] === tz
                      ? "text-white font-semibold shadow-sm"
                      : isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  style={values["timezone"] === tz ? { background: accent } : {}}>{tz}</button>
              ))}
            </div>
          </div>
        );
      }
      case "disk": {
        const choices = "choices" in currentStep ? currentStep.choices : [];
        return (
          <div>
            <h2 className={`text-base font-semibold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>{currentStep.title}</h2>
            <div className="space-y-2">
              {choices.filter(opt => path !== "vm" || opt.id === "erase").map(opt => (
                <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                  className={`w-full text-left border-2 rounded-lg p-3 transition-all ${
                    installType === opt.id
                      ? "border-blue-500 bg-blue-50" : isDark ? "border-white/15 hover:border-white/30 bg-white/5" : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <div className="text-sm font-medium" style={{ color: isDark ? "#fff" : "#1f2937" }}>{opt.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#6b7280" }}>{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>
        );
      }
      case "account": {
        const prompts = "prompts" in currentStep ? currentStep.prompts : [];
        return (
          <div>
            <h2 className={`text-base font-semibold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>{currentStep.title}</h2>
            {prompts.map((p, i) => (
              <Field key={i} label={p.label} value={values[p.label] || ""}
                onChange={v => setValues(prev => ({...prev, [p.label]: v}))}
                placeholder={p.placeholder} type={p.secret ? "password" : "text"}
                autoFocus={i === 0} light={isDark} />
            ))}
          </div>
        );
      }
      case "confirm":
        return (
          <div>
            <h2 className={`text-base font-semibold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>{currentStep.title}</h2>
            <p className={`text-xs mb-4 ${isDark ? "text-white/50" : "text-gray-600"}`}>{"body" in currentStep ? currentStep.body : "Review your choices before proceeding."}</p>
            <div className={`border rounded-lg p-3 space-y-1.5 ${isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
              {[
                ["Language", selectedLang || "English"],
                ["Keyboard", selectedKb || "English (US)"],
                ["Network", values["network"] === "skip" ? "Skipped" : values["network"] || "Wired"],
                ["Install", installType === "erase" ? "Erase disk" : installType === "alongside" ? "Dual boot" : "Manual"],
                ["Timezone", values["timezone"] || "UTC"],
                ["Name", values["Your name"] || "user"],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-4 text-xs">
                  <span style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#888", minWidth: 80 }}>{l}</span>
                  <span className="font-medium" style={{ color: isDark ? "#fff" : "#1f2937" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "partition":
        return (
          <div>
            <h2 className={`text-base font-semibold mb-3 ${isDark ? "text-white" : "text-gray-800"}`}>Partition disks</h2>
            <p className={`text-xs mb-3 ${isDark ? "text-white/50" : "text-gray-600"}`}>Configure disk partitions manually.</p>
            <div className={`border rounded-lg divide-y ${isDark ? "border-white/10 divide-white/10" : "border-gray-200 divide-gray-200"}`}>
              {["/dev/sda1  ext4  30 GB  /", "/dev/sda2  swap  8 GB  [swap]", "/dev/sda3  ext4  162 GB  /home"].map((row, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs font-mono"
                  style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#4b5563" }}>
                  <span>{row}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { playClick(); }}
              className="mt-2 text-xs font-medium px-3 py-1.5 rounded border border-dashed transition-all"
              style={{ color: accent, borderColor: `${accent}40` }}>
              + Add partition
            </button>
          </div>
        );
      default:
        return <p className={`text-xs ${isDark ? "text-white/50" : "text-gray-500"}`}>Unknown step</p>;
    }
  }

  // ─── BOOT ───
  if (phase === "boot") {
    if (bootSplash) {
      return (
        <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
          <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden border border-white/10" style={{ background: surface }}>
            <div className="flex flex-col items-center gap-4">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                <svg width="60" height="60" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="15" stroke={accent} strokeWidth="1.5" fill="none" />
                  <circle cx="16" cy="5.5" r="2.5" fill={accent} />
                  <circle cx="7" cy="20.5" r="2.5" fill={accent} />
                  <circle cx="25" cy="20.5" r="2.5" fill={accent} />
                </svg>
              </motion.div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="h-2 w-2 rounded-full" style={{ background: accent }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
              <div className="text-xs text-white/40 font-mono">Starting installer…</div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${surface}, ${surface}dd)` }}>
          <div className="text-center space-y-5">
            <div className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: accent }}>{osName}</div>
            <h1 className="text-2xl font-bold text-white">Install {osName}</h1>
            <p className="text-xs text-white/50 max-w-xs mx-auto">Try before installing, or start the installation.</p>
            <div className="space-y-2 max-w-[180px] mx-auto">
              <button onClick={() => { playClick(); setBootSplash(true); }}
                className="w-full rounded-lg py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all"
                style={{ background: accent }}>
                Install {osName}
              </button>
              <button onClick={() => { playClick(); setBootSplash(true); }}
                className="w-full rounded-lg border border-white/20 bg-white/5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-all">
                Try {osName}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── INSTALLING ───
  if (phase === "installing") {
    if (isWindows) {
      return (
        <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
          <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10"
            style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #0d1117 40%, #0a0a0f 100%)" }}>
            <div className="absolute top-[18%] inset-x-0 flex justify-center">
              <div className="grid grid-cols-2 gap-px">
                <div className="w-3 h-3 bg-[#0078d4]" style={{ borderTopLeftRadius: "1px" }} />
                <div className="w-3 h-3 bg-[#0078d4]" style={{ borderTopRightRadius: "1px" }} />
                <div className="w-3 h-3 bg-[#0078d4]" style={{ borderBottomLeftRadius: "1px" }} />
                <div className="w-3 h-3 bg-[#0078d4]" style={{ borderBottomRightRadius: "1px" }} />
              </div>
            </div>
            <div className="absolute top-[26%] inset-x-0 flex justify-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div key={i} className="h-1 w-1 rounded-full bg-white/50"
                  animate={{ opacity: [0.15, 0.8, 0.15] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }} />
              ))}
            </div>
            <div className="absolute top-[32%] inset-x-0 text-center">
              <p className="text-xs text-white/60 font-light tracking-wide">Copying Windows files</p>
              <p className="text-[9px] text-white/25 font-mono mt-1">{Math.floor(progress)}%</p>
              {fileIdx < config.installFiles.length && (
                <p className="text-[8px] text-white/15 font-mono mt-2 max-w-[200px] mx-auto truncate">
                  {config.installFiles[fileIdx]}
                </p>
              )}
            </div>
            <div className="absolute bottom-0 inset-x-0 h-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div className="h-full" style={{ background: "#0078d4" }}
                animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <SparkleBurst trigger={showSparkle} />
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${surface}, #000)` }}>
          <div className="text-center space-y-4 max-w-xs">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="w-10 h-10 mx-auto rounded-full border-2 border-t-transparent"
              style={{ borderColor: `${accent}40`, borderTopColor: accent }} />
            <p className="text-sm text-white/80 font-medium">Installing {osName}…</p>
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: accent }}
                animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
            </div>
            <p className="text-[10px] text-white/30 font-mono">{Math.floor(progress)}%</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── REMOVE MEDIA ───
  if (phase === "remove_media") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10" style={{ background: surface }}>
          <div className="text-center space-y-4">
            <div className="text-lg font-bold text-white">Installation Complete</div>
            <p className="text-xs text-white/50">Please remove the installation media, then click Restart.</p>
            <button onClick={() => { playClick(); setPhase("done"); }}
              className="rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all"
              style={{ background: accent }}>
              Restart Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── DONE ───
  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${surface}, #000)` }}>
          <div className="text-center space-y-4">
            {restartPhase === "done" ? (
              <>
                <div className="text-lg font-bold text-white">Restart to {osName}</div>
                <p className="text-xs text-white/50">Your new system is ready.</p>
                <button onClick={() => { playSuccess(); onComplete(); }}
                  className="rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all"
                  style={{ background: accent }}>
                  Restart Now
                </button>
              </>
            ) : (
              <div className="text-sm text-white/40 font-mono">Restarting…</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── WIZARD ───
  const bg = isDark ? "#1e1e24" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const mutedColor = isDark ? "rgba(255,255,255,0.4)" : "#6b7280";

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
      <div className="flex-1 flex items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${surface}, ${surface}dd)`, borderRadius: "1rem" }}>
        <div className="w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ background: bg, border: `1px solid ${border}`, maxHeight: "92%" }}>
          <div className="px-5 py-3 border-b shrink-0 flex items-center justify-between" style={{ borderColor: border }}>
            <span className="text-xs font-semibold tracking-wider" style={{ color: accent }}>{osName}</span>
            <div className="flex items-center gap-1">
              {allSteps.map((s, i) => (
                <div key={s.kind} className={`h-1.5 rounded-full transition-all ${i <= stepIdx ? "w-3" : "w-1.5"}`}
                  style={{ background: i <= stepIdx ? accent : isDark ? "rgba(255,255,255,0.15)" : "#d1d5db" }} />
              ))}
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            <div className={`w-40 shrink-0 p-3 border-r hidden sm:block ${isDark ? "bg-[#25252b] border-white/5" : "bg-gray-50 border-gray-200"}`}>
              <div className={`text-[7px] font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-white/30" : "text-gray-400"}`}>Steps</div>
              <div className="space-y-0.5">
                {allSteps.map((s, i) => (
                  <div key={s.kind} className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] transition-all ${
                    i === stepIdx
                      ? isDark ? "bg-white/10 text-white" : "bg-blue-50 text-blue-700 font-medium"
                      : isDark ? "text-white/40" : "text-gray-500"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${i <= stepIdx ? "opacity-100" : "opacity-30"}`}
                      style={{ background: i <= stepIdx ? accent : isDark ? "#fff" : "#9ca3af" }} />
                    <span className="truncate">{s.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <AnimatePresence mode="wait">
                  <motion.div key={stepIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t shrink-0" style={{ borderColor: border }}>
                <button onClick={handleBack} disabled={stepIdx === 0}
                  className="text-xs font-medium px-4 py-1.5 rounded transition-all disabled:opacity-30"
                  style={{ color: mutedColor }}>
                  Back
                </button>
                <button onClick={handleNext} disabled={!canAdvance()}
                  className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-40 shadow-sm hover:brightness-110 transition-all"
                  style={{ background: accent }}>
                  {currentStep?.kind === "confirm" || (stepIdx >= allSteps.length - 1) ? "Install Now" : "Continue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
