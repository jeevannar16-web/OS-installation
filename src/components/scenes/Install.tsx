import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type WizardPhase = "wizard" | "installing" | "done";

type InstallerStep =
  | "welcome"
  | "accessibility"
  | "keyboard"
  | "network"
  | "installer_update"
  | "install_type"
  | "optimise"
  | "disk"
  | "account"
  | "timezone"
  | "ready"
  | "progress"
  | "complete";

const STEP_ORDER: InstallerStep[] = [
  "welcome",
  "accessibility",
  "keyboard",
  "network",
  "installer_update",
  "install_type",
  "optimise",
  "disk",
  "account",
  "timezone",
  "ready",
];

const SIDEBAR_LABELS: Record<InstallerStep, string> = {
  welcome: "Welcome",
  accessibility: "Accessibility",
  keyboard: "Keyboard",
  network: "Network",
  installer_update: "Installer Update",
  install_type: "Install Type",
  optimise: "Optimise",
  disk: "Disk Setup",
  account: "Account",
  timezone: "Timezone",
  ready: "Ready",
  progress: "Installing",
  complete: "Complete",
};

const SLIDES = [
  { title: "Fast and secure", body: "Ubuntu boots in seconds and keeps your data safe with built-in firewall and disk encryption." },
  { title: "Productive out of the box", body: "Office suite, email client, web browser, and media player — all pre-installed." },
  { title: "Software Centre", body: "Thousands of free applications available at your fingertips." },
  { title: "Customise your desktop", body: "Themes, fonts, dock position, widgets — make it yours." },
  { title: "Built-in security", body: "Automatic updates, firewall, and full-disk encryption keep you safe." },
  { title: "Community support", body: "Millions of users and developers ready to help on askubuntu.com." },
];

const TIMEZONE_LIST = [
  "UTC (London)", "EST (New York)", "CST (Chicago)", "MST (Denver)",
  "PST (Los Angeles)", "IST (Mumbai)", "JST (Tokyo)", "AEST (Sydney)",
  "CET (Paris)", "MSK (Moscow)",
];

const LANGUAGES = [
  "English", "Español", "Français", "Deutsch", "Português (Brasil)",
  "Italiano", "中文 (简体)", "日本語", "한국어", "Русский",
];

const KEYBOARD_LAYOUTS = [
  "English (US)", "English (UK)", "English (India)", "Español (Latinoamérica)",
  "Français", "Deutsch", "Italiano", "Português (Brasil)", "Dvorak", "Colemak",
];

function Sidebar({ current }: { current: InstallerStep }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <div className="hidden md:flex w-52 lg:w-60 flex-col border-r border-white/10 bg-white/[0.03] p-4 gap-1">
      {STEP_ORDER.map((step, i) => (
        <div
          key={step}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            step === current
              ? "bg-[#E95420]/10 text-[#E95420] font-semibold"
              : i < idx
                ? "text-white/50"
                : "text-white/30"
          }`}
        >
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              i < idx || step === current ? "bg-[#E95420] text-white" : "bg-white/10 text-white/30"
            }`}
          >
            {i < idx ? "✓" : i + 1}
          </div>
          <span className="truncate">{SIDEBAR_LABELS[step]}</span>
        </div>
      ))}
    </div>
  );
}

function StepNav({
  onBack, onNext, nextLabel, nextDisabled, showBack,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.03] px-6 py-3">
      {showBack !== false ? (
        <button
          onClick={() => { playClick(); onBack(); }}
          className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors"
        >
          ← Back
        </button>
      ) : <div />}
      <button
        disabled={nextDisabled}
        onClick={() => { playClick(); onNext(); }}
        className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
          nextDisabled
            ? "bg-white/10 text-white/30 cursor-not-allowed"
            : "bg-[#E95420] text-white hover:bg-[#c7441a]"
        }`}
      >
        {nextLabel}
      </button>
    </div>
  );
}

export default function Install({
  config,
  speed,
  onComplete,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [phase, setPhase] = useState<WizardPhase>("wizard");
  const [step, setStep] = useState<InstallerStep>("welcome");
  const [values, setValues] = useState<Record<string, string>>({});
  const [accessibility, setAccessibility] = useState({ highContrast: false, largeText: false, screenReader: false, animationReduce: false, colorFilter: "none" });
  const [installType, setInstallType] = useState<string>("");
  const [optimise, setOptimise] = useState({ thirdParty: true, codecs: true });
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);
  const [fileIdx, setFileIdx] = useState(0);

  const installDuration = speed === "fast" ? 2000 : 12000;
  const currentIdx = STEP_ORDER.indexOf(step);

  useEffect(() => {
    if (phase === "installing") registerAdvance(() => onComplete());
  }, [phase, registerAdvance, onComplete]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, step, values, installType]);

  useEffect(() => {
    if (phase !== "installing") return;
    setProgress(0);
    setFileIdx(0);
    setElapsed(0);
    const start = performance.now();
    let raf = 0;
    const files = config.installFiles;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / installDuration) * 100);
      setProgress(pct);
      setElapsed(Math.floor((now - start) / 1000));
      setFileIdx(Math.min(files.length - 1, Math.floor((pct / 100) * files.length)));
      if (pct < 100) raf = requestAnimationFrame(tick);
      else {
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 1500);
        setTimeout(() => onComplete(), 600);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, installDuration, onComplete, config.installFiles]);

  useEffect(() => {
    if (phase !== "installing") return;
    const iv = setInterval(() => {
      setSlideIdx((p) => (p + 1) % SLIDES.length);
      setTipIdx((p) => (p + 1) % config.installTips.length);
    }, speed === "fast" ? 600 : 3000);
    return () => clearInterval(iv);
  }, [phase, config.installTips.length, speed]);

  function canAdvance(): boolean {
    switch (step) {
      case "welcome": return !!values["language"];
      case "keyboard": return !!values["keyboard"];
      case "network": return !!values["network"];
      case "disk": return !!installType;
      case "account": return !!(values["name"] || "").trim() && !!(values["username"] || "").trim() && !!(values["password"] || "").trim();
      case "timezone": return !!values["timezone"];
      default: return true;
    }
  }

  function handleNext() {
    if (!canAdvance()) return;
    playClick();
    if (step === "ready") {
      setPhase("installing");
    } else {
      const nextIdx = currentIdx + 1;
      if (nextIdx < STEP_ORDER.length) setStep(STEP_ORDER[nextIdx]);
    }
  }

  function handleBack() {
    playClick();
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) setStep(STEP_ORDER[prevIdx]);
  }

  function setVal(field: string, val: string) {
    setValues((p) => ({ ...p, [field]: val }));
  }

  if (phase === "installing" || phase === "done") {
    return (
      <div className="mx-auto w-full max-w-3xl lg:max-w-4xl">
        <SparkleBurst trigger={showSparkle} />
        <div className="rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl overflow-hidden">
          <div className="bg-[#E95420] px-6 py-4 text-white font-semibold text-lg">
            Installing Ubuntu…
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-[#E95420]/10 flex items-center justify-center">
                <div className="text-3xl font-bold text-[#E95420]">U</div>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white/90">{config.installTips[tipIdx]}</h2>
                <p className="text-sm text-white/50 mt-0.5">{SLIDES[slideIdx].title}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-[#E95420]"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/40">
                <span>{Math.floor(progress)}%</span>
                <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} elapsed</span>
              </div>
            </div>

            <div className="h-24 overflow-hidden rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-xs text-white/50">
              {config.installFiles.slice(0, fileIdx + 1).map((file, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: i === fileIdx ? 1 : 0.4 }} className="leading-relaxed truncate">
                  {i === fileIdx && <span className="text-[#E95420] mr-1">▸</span>}
                  {file}
                </motion.div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={slideIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl bg-[#E95420]/5 border border-[#E95420]/10 p-4"
              >
                <h3 className="font-semibold text-white/80 text-sm">{SLIDES[slideIdx].title}</h3>
                <p className="text-xs text-white/40 mt-1">{SLIDES[slideIdx].body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl">
      <div className="rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px] lg:min-h-[600px]">
        <Sidebar current={step} />
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-6 lg:p-8 overflow-y-auto"
            >
              {step === "welcome" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#E95420] flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">U</span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white/90">Welcome to Ubuntu</h1>
                      <p className="text-sm text-white/50">Try or install Ubuntu {config.downloadPage.versions?.[0] ?? "24.04 LTS"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Choose your language</label>
                    <div className="grid grid-cols-2 gap-1 max-h-[280px] overflow-y-auto">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => { playClick(); setVal("language", lang); }}
                          className={`rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            values["language"] === lang
                              ? "bg-[#E95420]/10 text-[#E95420] ring-1 ring-[#E95420]/40 font-medium"
                              : "text-white/60 hover:bg-white/5"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === "accessibility" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white/90">Accessibility</h2>
                  <p className="text-sm text-white/50">Make Ubuntu easier to see, hear, and use.</p>
                  <div className="space-y-3">
                    {[
                      { key: "highContrast", label: "High Contrast", desc: "Increase contrast for easier reading" },
                      { key: "largeText", label: "Large Text", desc: "Increase the size of text and controls" },
                      { key: "screenReader", label: "Screen Reader", desc: "Read screen content aloud with Orca" },
                      { key: "animationReduce", label: "Reduce Animations", desc: "Minimise motion in the interface" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { playClick(); setAccessibility((p) => ({ ...p, [opt.key]: !(p as Record<string, unknown>)[opt.key] })); }}
                        className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                          (accessibility as Record<string, unknown>)[opt.key]
                            ? "border-[#E95420]/40 bg-[#E95420]/5"
                            : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium text-white/80">{opt.label}</div>
                          <div className="text-xs text-white/40 mt-0.5">{opt.desc}</div>
                        </div>
                        <div className={`h-5 w-10 rounded-full transition-colors relative ${
                          (accessibility as Record<string, unknown>)[opt.key] ? "bg-[#E95420]" : "bg-white/15"
                        }`}>
                          <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            (accessibility as Record<string, unknown>)[opt.key] ? "translate-x-5" : "translate-x-0.5"
                          }`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "keyboard" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white/90">Keyboard layout</h2>
                  <p className="text-sm text-white/50">Choose the layout that matches your keyboard.</p>
                  <div className="max-h-[320px] overflow-y-auto space-y-1">
                    {KEYBOARD_LAYOUTS.map((layout) => (
                      <button
                        key={layout}
                        onClick={() => { playClick(); setVal("keyboard", layout); }}
                        className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                          values["keyboard"] === layout
                            ? "bg-[#E95420]/10 text-[#E95420] ring-1 ring-[#E95420]/40 font-medium"
                            : "text-white/60 hover:bg-white/5"
                        }`}
                      >
                        {layout}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "network" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white/90">Connect to a network</h2>
                  <p className="text-sm text-white/50">Get online to download updates during installation.</p>
                  <div className="space-y-1">
                    {[
                      { id: "wifi-home", label: "HomeWiFi", signal: 4 },
                      { id: "wifi-neighbors", label: "Neighbor_5G", signal: 3 },
                      { id: "ethernet", label: "Wired Ethernet", signal: 5 },
                    ].map((iface) => (
                      <button
                        key={iface.id}
                        onClick={() => { playClick(); setVal("network", iface.id); }}
                        className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                          values["network"] === iface.id
                            ? "bg-[#E95420]/10 text-[#E95420] ring-1 ring-[#E95420]/40"
                            : "text-white/60 hover:bg-white/5"
                        }`}
                      >
                        <span className="text-lg">{iface.id.startsWith("wifi") ? "📶" : "🔌"}</span>
                        <span className="flex-1 font-medium">{iface.label}</span>
                        <div className="flex items-end gap-0.5">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`w-1 rounded-sm ${i <= iface.signal ? "bg-[#E95420]" : "bg-white/15"}`} style={{ height: `${4 + i * 3}px` }} />
                          ))}
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={() => { playClick(); setVal("network", "skip"); }}
                      className={`w-full rounded-lg px-4 py-3 text-left text-sm transition-colors ${
                        values["network"] === "skip" ? "bg-[#E95420]/10 text-[#E95420] ring-1 ring-[#E95420]/40" : "text-white/40 hover:bg-white/5"
                      }`}
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              )}

              {step === "installer_update" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white/90">Installer update available</h2>
                  <p className="text-sm text-white/50">An update to the installer is available. It is recommended that you update before continuing.</p>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-amber-400 text-lg">⚠</span>
                      <div>
                        <div className="text-sm font-medium text-amber-300">Update recommended</div>
                        <div className="text-xs text-amber-400/70 mt-1">The updated installer includes bug fixes and improved hardware support.</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { playClick(); setVal("installerUpdate", "skip"); }}
                      className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 transition-colors">
                      Skip
                    </button>
                    <button onClick={() => { playClick(); setVal("installerUpdate", "update"); }}
                      className="rounded-lg bg-[#E95420] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c7441a] transition-colors">
                      Update now
                    </button>
                  </div>
                </div>
              )}

              {step === "install_type" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white/90">Installation type</h2>
                  <p className="text-sm text-white/50">How would you like to install Ubuntu?</p>
                  <div className="space-y-3">
                    {[
                      { id: "interactive", label: "Interactive installation", desc: "Go through the full setup wizard with all options." },
                      { id: "automated", label: "Automated installation", desc: "Use a preseed file for unattended installation." },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { playClick(); setInstallType(opt.id); }}
                        className={`w-full rounded-xl border px-5 py-4 text-left transition-colors ${
                          installType === opt.id
                            ? "border-[#E95420] bg-[#E95420]/5 ring-1 ring-[#E95420]/30"
                            : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <div className="text-sm font-semibold text-white/80">{opt.label}</div>
                        <div className="text-xs text-white/40 mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "optimise" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white/90">Optimise your computer</h2>
                  <p className="text-sm text-white/50">Choose what to install alongside the base system.</p>
                  <div className="space-y-3">
                    {[
                      { key: "thirdParty", label: "Install third-party software for graphics and Wi-Fi hardware", desc: "Proprietary drivers for NVIDIA, Broadcom, etc." },
                      { key: "codecs", label: "Download and install support for additional media formats", desc: "MP3, MP4, and other restricted formats" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { playClick(); setOptimise((p) => ({ ...p, [opt.key]: !p[opt.key as keyof typeof p] })); }}
                        className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                          optimise[opt.key as keyof typeof optimise]
                            ? "border-[#E95420]/40 bg-[#E95420]/5"
                            : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex-1 pr-4">
                          <div className="text-sm font-medium text-white/80">{opt.label}</div>
                          <div className="text-xs text-white/40 mt-0.5">{opt.desc}</div>
                        </div>
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                          optimise[opt.key as keyof typeof optimise] ? "border-[#E95420] bg-[#E95420]" : "border-white/20"
                        }`}>
                          {optimise[opt.key as keyof typeof optimise] && (
                            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "disk" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white/90">Type of installation</h2>
                  <p className="text-sm text-white/50">Select how Ubuntu should be installed on this disk.</p>
                  <div className="space-y-3">
                    {[
                      { id: "erase", label: "Erase disk and install Ubuntu", desc: "Deletes all data on the disk and installs a fresh copy of Ubuntu. Best for VMs or dedicated installs." },
                      { id: "alongside", label: "Install Ubuntu alongside them", desc: "Dual-boot alongside existing operating systems. Ubuntu will share the disk." },
                      { id: "manual", label: "Manual installation", desc: "Create or modify partitions manually. For advanced users." },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { playClick(); setVal("disk", opt.id); setInstallType(opt.id); }}
                        className={`w-full rounded-xl border px-5 py-4 text-left transition-colors ${
                          values["disk"] === opt.id
                            ? "border-[#E95420] bg-[#E95420]/5 ring-1 ring-[#E95420]/30"
                            : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <div className="text-sm font-semibold text-white/80">{opt.label}</div>
                        <div className="text-xs text-white/40 mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-xs font-medium text-white/50 mb-1">Detected disks</div>
                    <div className="text-xs text-white/40">/dev/sda — 500 GB WDC WD5000</div>
                  </div>
                </div>
              )}

              {step === "account" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white/90">Who are you?</h2>
                  <p className="text-sm text-white/50">Tell us a bit about yourself to set up your account.</p>
                  <div className="space-y-4">
                    {[
                      { key: "name", label: "Your name", placeholder: "Ada Lovelace" },
                      { key: "computer_name", label: "Your computer's name", placeholder: "ada-ubuntu" },
                      { key: "username", label: "Pick a username", placeholder: "ada" },
                      { key: "password", label: "Choose a password", placeholder: "••••••••", secret: true },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-medium text-white/50 mb-1">{field.label}</label>
                        <input
                          type={field.secret ? "password" : "text"}
                          value={values[field.key] ?? ""}
                          onChange={(e) => { setVal(field.key, e.target.value); playKeyClick(); }}
                          placeholder={field.placeholder}
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/90 outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420]/30 transition-colors placeholder:text-white/20"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Log in automatically
                  </div>
                </div>
              )}

              {step === "timezone" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white/90">Select your timezone</h2>
                  <p className="text-sm text-white/50">Choose your region to set the correct time.</p>
                  <div className="max-h-[300px] overflow-y-auto space-y-1">
                    {TIMEZONE_LIST.map((tz) => (
                      <button
                        key={tz}
                        onClick={() => { playClick(); setVal("timezone", tz); }}
                        className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                          values["timezone"] === tz
                            ? "bg-[#E95420]/10 text-[#E95420] ring-1 ring-[#E95420]/40 font-medium"
                            : "text-white/60 hover:bg-white/5"
                        }`}
                      >
                        <span className="mr-2">🌍</span>
                        {tz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "ready" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-white/90">Ready to install</h2>
                  <p className="text-sm text-white/50">Review your choices before installation begins.</p>
                  <div className="rounded-xl border border-white/10 divide-y divide-white/5">
                    {[
                      ["Language", values["language"] ?? "English"],
                      ["Keyboard", values["keyboard"] ?? "English (US)"],
                      ["Network", values["network"] === "skip" ? "Skipped" : values["network"] ?? "HomeWiFi"],
                      ["Installation type", installType === "erase" ? "Erase disk" : installType === "alongside" ? "Dual boot" : installType === "manual" ? "Manual" : "Interactive"],
                      ["Third-party software", optimise.thirdParty ? "Yes" : "No"],
                      ["Additional codecs", optimise.codecs ? "Yes" : "No"],
                      ["Name", values["name"] ?? "User"],
                      ["Computer name", values["computer_name"] ?? "ubuntu"],
                      ["Username", values["username"] ?? "user"],
                      ["Timezone", values["timezone"] ?? "UTC (London)"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="text-white/50">{label}</span>
                        <span className="font-medium text-white/80">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <StepNav
            onBack={handleBack}
            onNext={handleNext}
            nextLabel={step === "ready" ? "Install now →" : "Next →"}
            nextDisabled={!canAdvance()}
            showBack={currentIdx > 0}
          />
        </div>
      </div>
    </div>
  );
}
