import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick, playSuccess } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type WizardPhase = "boot" | "wizard" | "installing" | "remove_media" | "done";

type InstallerStep =
  | "language" | "keyboard" | "network" | "install_type" | "partition"
  | "install_option" | "third_party" | "app_selection" | "timezone" | "create_user" | "review";

const STEP_ORDER_BASE: InstallerStep[] = [
  "language", "keyboard", "network", "install_type", "install_option",
  "third_party", "app_selection", "timezone", "create_user", "review",
];

const STEP_ORDER_MINT: InstallerStep[] = [
  "language", "keyboard", "network", "third_party", "install_type",
  "timezone", "create_user", "review",
];

const STEP_ORDER_ZORIN: InstallerStep[] = [
  "language", "keyboard", "network", "install_type",
  "timezone", "create_user", "review",
];

function getStepOrder(osId: string): InstallerStep[] {
  if (osId === "mint") return STEP_ORDER_MINT;
  if (osId === "zorin") return STEP_ORDER_ZORIN;
  return STEP_ORDER_BASE;
}

const LANGUAGES = [
  "English", "Español", "Français", "Deutsch", "Português (Brasil)",
  "Italiano", "中文 (简体)", "日本語", "한국어", "Русский",
];

const KEYBOARD_LAYOUTS = [
  "English (US)", "English (UK)", "English (India)", "Español (Latinoamérica)",
  "Français", "Deutsch", "Italiano", "Português (Brasil)", "Dvorak", "Colemak",
];

function Field({ label, value, onChange, placeholder, type, autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-gray-700 mb-1 font-medium">{label}</label>
      <input type={type || "text"} value={value} onChange={e => { playKeyClick(); onChange(e.target.value); }}
        placeholder={placeholder || ""} autoFocus={autoFocus}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
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
  const [phase, setPhase] = useState<WizardPhase>(isWindows ? "installing" : "boot");
  const [bootSplash, setBootSplash] = useState(false);
  const [step, setStep] = useState<InstallerStep>("language");
  const [values, setValues] = useState<Record<string, string>>({});
  const [installType, setInstallType] = useState<string>(path === "vm" ? "erase" : "erase");
  const [progress, setProgress] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);
  const [fileIdx, setFileIdx] = useState(0);
  const [restartPhase, setRestartPhase] = useState<"countdown" | "done">("countdown");
  const [selectedLang, setSelectedLang] = useState("");
  const [selectedKb, setSelectedKb] = useState("");

  const baseOrder = getStepOrder(config.id);
  const STEP_ORDER: InstallerStep[] = installType === "something"
    ? [...baseOrder.slice(0, baseOrder.indexOf("install_type") + 1), "partition", ...baseOrder.slice(baseOrder.indexOf("install_type") + 1)]
    : baseOrder;

  const installDuration = speed === "fast" ? 2000 : 12000;
  const currentIdx = STEP_ORDER.indexOf(step);

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
    switch (step) {
      case "language": return !!selectedLang;
      case "keyboard": return !!selectedKb;
      case "create_user": return !!(values["username"] || "").trim() && !!(values["password"] || "").trim();
      case "partition": return true;
      default: return true;
    }
  }

  function handleNext() {
    if (phase === "done") { playSuccess(); onComplete(); return; }
    if (phase === "boot") { playClick(); setBootSplash(true); return; }
    if (phase === "remove_media") { playClick(); setPhase("done"); return; }
    if (!canAdvance()) return;
    playClick();
    if (step === "review") { setPhase("installing"); return; }
    const nextIdx = currentIdx + 1;
    if (nextIdx < STEP_ORDER.length) setStep(STEP_ORDER[nextIdx]);
  }

  function handleBack() {
    if (currentIdx <= 0) return;
    playClick();
    setStep(STEP_ORDER[currentIdx - 1]);
  }

  const isZorinLike = config.id === "zorin" || config.id === "mint";

  function renderWizardStep() {
    const content = () => {
      switch (step) {
        case "language":
          return (
            <div>
              <h2 className={`text-base font-semibold mb-3 ${isZorinLike ? "text-white" : "text-gray-800"}`}>Language</h2>
              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
                {LANGUAGES.map(l => (
                  <button key={l} onClick={() => { playClick(); setSelectedLang(l); }}
                    className={`rounded px-3 py-1.5 text-xs transition-all ${
                      selectedLang === l
                        ? "text-white font-semibold shadow-sm"
                        : isZorinLike ? "text-white/60 hover:text-white/80 hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    style={selectedLang === l ? { background: accent } : {}}>{l}</button>
                ))}
              </div>
            </div>
          );
        case "keyboard":
          return (
            <div>
              <h2 className={`text-base font-semibold mb-3 ${isZorinLike ? "text-white" : "text-gray-800"}`}>Keyboard layout</h2>
              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
                {KEYBOARD_LAYOUTS.map(k => (
                  <button key={k} onClick={() => { playClick(); setSelectedKb(k); }}
                    className={`rounded px-3 py-1.5 text-xs transition-all ${
                      selectedKb === k
                        ? "text-white font-semibold shadow-sm"
                        : isZorinLike ? "text-white/60 hover:text-white/80 hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    style={selectedKb === k ? { background: accent } : {}}>{k}</button>
                ))}
              </div>
            </div>
          );
        case "network":
          return (
            <div>
              <h2 className={`text-base font-semibold mb-3 ${isZorinLike ? "text-white" : "text-gray-800"}`}>Network</h2>
              <div className="space-y-1.5">
                {[{ id: "wifi", label: "Connect to Wi-Fi" }, { id: "ethernet", label: "Use wired connection" }, { id: "skip", label: "I don't want to connect" }].map(n => (
                  <button key={n.id} onClick={() => { playClick(); setValues(p => ({...p, network: n.id})); }}
                    className={`block text-xs text-left w-full py-2 px-3 rounded transition-all ${
                      values["network"] === n.id
                        ? "text-white font-semibold" : isZorinLike ? "text-white/60 hover:text-white/80" : "text-gray-600 hover:text-gray-900"
                    }`}
                    style={values["network"] === n.id ? { background: accent } : {}}>{n.label}</button>
                ))}
              </div>
            </div>
          );
        case "install_type":
          return (
            <div>
              <h2 className={`text-base font-semibold mb-3 ${isZorinLike ? "text-white" : "text-gray-800"}`}>Installation type</h2>
              <div className="space-y-2">
                {[
                  { id: "erase", label: `Erase disk and install ${osName}`, desc: "Simple, recommended for most users" },
                  { id: "alongside", label: `Install alongside existing OS`, desc: "Dual boot" },
                  { id: "something", label: "Manual partitioning", desc: "Advanced users" },
                ].filter(opt => path !== "vm" || opt.id === "erase").map(opt => (
                  <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                    className={`w-full text-left border-2 rounded-lg p-3 transition-all ${
                      installType === opt.id
                        ? "border-blue-500 bg-blue-50" : isZorinLike ? "border-white/10 hover:border-white/30 bg-white/5" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className="text-sm font-medium" style={{ color: isZorinLike ? "#fff" : "#333" }}>{opt.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: isZorinLike ? "rgba(255,255,255,0.5)" : "#888" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        case "third_party":
          return (
            <div>
              <h2 className={`text-base font-semibold mb-3 ${isZorinLike ? "text-white" : "text-gray-800"}`}>Updates & software</h2>
              <label className="flex items-center gap-3 py-2 cursor-pointer">
                <input type="checkbox" checked={values["third_party"] === "yes"} onChange={() => { playClick(); setValues(p => ({...p, third_party: p["third_party"] === "yes" ? "no" : "yes"})); }}
                  className="w-4 h-4 accent-blue-600 cursor-pointer" />
                <span className="text-xs" style={{ color: isZorinLike ? "rgba(255,255,255,0.8)" : "#555" }}>Install third-party software for graphics, Wi-Fi and media codecs</span>
              </label>
              <label className="flex items-center gap-3 py-2 cursor-pointer">
                <input type="checkbox" checked={values["updates"] === "yes"} onChange={() => { playClick(); setValues(p => ({...p, updates: p["updates"] === "yes" ? "no" : "yes"})); }}
                  className="w-4 h-4 accent-blue-600 cursor-pointer" />
                <span className="text-xs" style={{ color: isZorinLike ? "rgba(255,255,255,0.8)" : "#555" }}>Download updates while installing</span>
              </label>
            </div>
          );
        case "app_selection":
          return (
            <div>
              <h2 className={`text-base font-semibold mb-3 ${isZorinLike ? "text-white" : "text-gray-800"}`}>App selection</h2>
              <div className="space-y-2">
                {[
                  { id: "normal", label: "Normal installation", desc: "Office suite, browser, games, media player" },
                  { id: "minimal", label: "Minimal installation", desc: "Browser and basic utilities" },
                ].map(opt => (
                  <button key={opt.id} onClick={() => { playClick(); setValues(p => ({...p, apps: opt.id})); }}
                    className={`w-full text-left border-2 rounded-lg p-3 transition-all ${
                      values["apps"] === opt.id
                        ? "border-blue-500 bg-blue-50" : isZorinLike ? "border-white/10 hover:border-white/30 bg-white/5" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className="text-sm font-medium" style={{ color: isZorinLike ? "#fff" : "#333" }}>{opt.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: isZorinLike ? "rgba(255,255,255,0.5)" : "#888" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        case "install_option":
          return (
            <div>
              <h2 className={`text-base font-semibold mb-3 ${isZorinLike ? "text-white" : "text-gray-800"}`}>Installation method</h2>
              <div className="space-y-2">
                {[
                  { id: "interactive", label: "Interactive installation", desc: "Walk through each step" },
                  { id: "automated", label: "Automated installation", desc: "Use a preconfigured setup file" },
                ].map(opt => (
                  <button key={opt.id} onClick={() => { playClick(); setValues(p => ({...p, install_option: opt.id})); }}
                    className={`w-full text-left border-2 rounded-lg p-3 transition-all ${
                      values["install_option"] === opt.id
                        ? "border-blue-500 bg-blue-50" : isZorinLike ? "border-white/10 hover:border-white/30 bg-white/5" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className="text-sm font-medium" style={{ color: isZorinLike ? "#fff" : "#333" }}>{opt.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: isZorinLike ? "rgba(255,255,255,0.5)" : "#888" }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        case "timezone":
          return (
            <div>
              <h2 className={`text-base font-semibold mb-3 ${isZorinLike ? "text-white" : "text-gray-800"}`}>Timezone</h2>
              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
                {["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
                  "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney",
                  "Pacific/Auckland", "Africa/Cairo", "America/Sao_Paulo",
                ].map(tz => (
                  <button key={tz} onClick={() => { playClick(); setValues(p => ({...p, timezone: tz})); }}
                    className={`rounded px-3 py-1.5 text-xs transition-all ${
                      values["timezone"] === tz
                        ? "text-white font-semibold shadow-sm"
                        : isZorinLike ? "text-white/60 hover:text-white/80 hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                    style={values["timezone"] === tz ? { background: accent } : {}}>{tz}</button>
                ))}
              </div>
            </div>
          );
        case "create_user":
          return (
            <div>
              <h2 className={`text-base font-semibold mb-3 ${isZorinLike ? "text-white" : "text-gray-800"}`}>Create account</h2>
              <Field label="Your name" value={values["name"] || ""} onChange={v => setValues(p => ({...p, name: v}))} autoFocus />
              <Field label="Computer name" value={values["computer_name"] || ""} onChange={v => setValues(p => ({...p, computer_name: v}))} placeholder="e.g. my-laptop" />
              <Field label="Username" value={values["username"] || ""} onChange={v => setValues(p => ({...p, username: v}))} />
              <Field label="Password" value={values["password"] || ""} onChange={v => setValues(p => ({...p, password: v}))} type="password" />
            </div>
          );
        case "review":
          return (
            <div>
              <h2 className={`text-base font-semibold mb-3 ${isZorinLike ? "text-white" : "text-gray-800"}`}>Ready to install</h2>
              <div className={`border rounded-lg p-3 space-y-1.5 ${isZorinLike ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
                {[
                  ["Language", selectedLang || "English"],
                  ["Keyboard", selectedKb || "English (US)"],
                  ["Network", values["network"] === "skip" ? "Skipped" : values["network"] || "Wired"],
                  ["Install", installType === "erase" ? "Erase disk" : installType === "alongside" ? "Dual boot" : "Manual"],
                  ["Timezone", values["timezone"] || "UTC"],
                  ["Name", values["name"] || "user"],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-4 text-xs">
                    <span style={{ color: isZorinLike ? "rgba(255,255,255,0.5)" : "#888", minWidth: 80 }}>{l}</span>
                    <span className="font-medium" style={{ color: isZorinLike ? "#fff" : "#333" }}>{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: isZorinLike ? "rgba(255,255,255,0.4)" : "#999" }}>The changes listed above will be written to disk. Click Install to start.</p>
            </div>
          );
        case "partition":
          return (
            <div>
              <h2 className={`text-base font-semibold mb-3 ${isZorinLike ? "text-white" : "text-gray-800"}`}>Partition disks</h2>
              <p className="text-xs mb-3" style={{ color: isZorinLike ? "rgba(255,255,255,0.5)" : "#888" }}>Configure disk partitions manually.</p>
              <div className={`border rounded-lg divide-y ${isZorinLike ? "border-white/10 divide-white/10" : "border-gray-200 divide-gray-200"}`}>
                {["/dev/sda1  ext4  30 GB  /", "/dev/sda2  swap  8 GB  [swap]", "/dev/sda3  ext4  162 GB  /home"].map((row, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs font-mono"
                    style={{ color: isZorinLike ? "rgba(255,255,255,0.7)" : "#666" }}>
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
      }
    };

    const isZorin = config.id === "zorin";
    const dialogBg = isZorin ? "#1e1e24" : "#ffffff";

    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center p-4"
          style={{ background: `linear-gradient(135deg, ${surface}, ${surface}dd)`, borderRadius: "1rem" }}>
          <div className="w-full max-w-xl rounded-xl shadow-2xl flex flex-col overflow-hidden"
            style={{ background: dialogBg, border: `1px solid ${isZorin ? "rgba(255,255,255,0.08)" : "#e0e0e0"}`, maxHeight: "90%" }}>
            {/* Header with step indicator */}
            <div className="px-5 py-3 border-b shrink-0" style={{ borderColor: isZorin ? "rgba(255,255,255,0.08)" : "#e0e0e0" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider" style={{ color: accent }}>{osName}</span>
                <div className="flex items-center gap-1">
                  {STEP_ORDER.map((s, i) => (
                    <div key={s} className={`h-1.5 rounded-full transition-all ${i <= currentIdx ? "w-3" : "w-1.5"}`}
                      style={{ background: i <= currentIdx ? accent : isZorin ? "rgba(255,255,255,0.15)" : "#ddd" }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 flex-1 overflow-y-auto min-h-0">
              <motion.div key={step} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                {content()}
              </motion.div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t shrink-0" style={{ borderColor: isZorin ? "rgba(255,255,255,0.08)" : "#e0e0e0" }}>
              <button onClick={handleBack} disabled={currentIdx === 0}
                className="text-xs font-medium px-4 py-1.5 rounded transition-all disabled:opacity-30"
                style={{ color: isZorin ? "rgba(255,255,255,0.5)" : "#666" }}>
                Back
              </button>
              <button onClick={handleNext} disabled={!canAdvance()}
                className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-40 shadow-sm hover:brightness-110 transition-all"
                style={{ background: accent }}>
                {step === "review" ? "Install Now" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Boot phase ───
  if (phase === "boot") {
    if (bootSplash) {
      return (
        <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
          <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden border border-white/10"
            style={{ background: surface }}>
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

  // ─── Installing phase ───
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

  // ─── Remove media ───
  if (phase === "remove_media") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10"
          style={{ background: surface }}>
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

  // ─── Done ───
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
              <>
                <div className="text-sm text-white/40 font-mono">Restarting…</div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Wizard ───
  return renderWizardStep();
}
