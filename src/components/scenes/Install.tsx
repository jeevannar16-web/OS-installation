import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick, playSuccess } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";
import OsIcon from "../shared/OsIcon";

type WizardPhase = "boot" | "wizard" | "installing" | "remove_media" | "done";

const LANGUAGES = [
  "English", "Español", "Français", "Deutsch", "Português (Brasil)",
  "Italiano", "中文 (简体)", "日本語", "한국어", "Русский",
];

const KEYBOARD_LAYOUTS = [
  "English (US)", "English (UK)", "English (India)", "Español (Latinoamérica)",
  "Français", "Deutsch", "Italiano", "Português (Brasil)", "Dvorak", "Colemak",
];

const SLIDES: { title: string; body: string; icon: string }[] = [
  { title: "Fast and feature-rich", body: "The desktop experience is packed with productivity tools, developer environments, and built-in apps for everyday use.", icon: "🚀" },
  { title: "Great for developers", body: "Built-in terminal, package manager, and support for all major programming languages and frameworks.", icon: "💻" },
  { title: "Full productivity suite", body: "Includes LibreOffice, Thunderbird, Firefox, and thousands of free apps in the software center.", icon: "📝" },
  { title: "Gaming ready", body: "Steam, Lutris, and Proton bring thousands of Windows games to your desktop.", icon: "🎮" },
  { title: "Accessibility built-in", body: "Screen reader, magnifier, high-contrast themes, and on-screen keyboard are included out of the box.", icon: "♿" },
];

const OS_WELCOME_STYLES: Record<string, { gradient: string; }> = {
  ubuntu: { gradient: "linear-gradient(135deg, #2c001e 0%, #481c34 40%, #1a1a2e 100%)" },
  zorin: { gradient: "linear-gradient(135deg, #0a2647 0%, #0c6cf5 40%, #144272 100%)" },
  mint: { gradient: "linear-gradient(135deg, #0d2818 0%, #3c8d2f 40%, #0a1f12 100%)" },
  debian: { gradient: "linear-gradient(135deg, #1a0000 0%, #6b0000 40%, #0d0000 100%)" },
  fedora: { gradient: "linear-gradient(135deg, #1a1a2e 0%, #2b5797 40%, #16213e 100%)" },
  arch: { gradient: "linear-gradient(135deg, #0a0a1a 0%, #1793d1 40%, #0a0a1a 100%)" },
};

function Field({ label, value, onChange, placeholder, type, autoFocus }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs mb-1 font-medium text-white/70">{label}</label>
      <input type={type || "text"} value={value} onChange={e => { playKeyClick(); onChange(e.target.value); }}
        placeholder={placeholder || ""} autoFocus={autoFocus}
        className="w-full border border-white/20 bg-white/10 rounded px-3 py-2 text-sm text-white outline-none placeholder-white/30 focus:border-white/40 transition-colors" />
    </div>
  );
}

const ACCOUNT_KEY_MAP: Record<string, string> = {
  "Your name": "name",
  "Your computer's name": "computer_name",
  "Pick a username": "username",
  "Choose a password": "password",
  "Full name": "name",
  "Username": "username",
  "Password": "password",
};

const UBIQUITY_ICONS: Record<string, string> = {
  language: "🌐",
  keyboard: "⌨️",
  network: "📶",
  timezone: "🌍",
  disk: "💾",
  account: "👤",
  confirm: "✅",
  partition: "🔧",
  updates: "📦",
};

export default function Install({ config, speed, onComplete, path }: {
  config: OSConfig; speed: "normal" | "fast"; onComplete: () => void; path?: string;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const isWindows = config.id === "windows";
  const isUbuntu = config.id === "ubuntu";
  const accent = config.branding.accent;
  const surface = config.branding.surface;
  const osName = config.branding.name;
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
  const [slideIdx, setSlideIdx] = useState(0);
  const [installExtended, setInstallExtended] = useState(true);
  const [installThirdParty, setInstallThirdParty] = useState(true);

  const wizard = config.wizard;
  const hasPartition = installType === "something";
  const allSteps = hasPartition
    ? [...wizard.slice(0, wizard.findIndex(s => s.kind === "disk") + 1), { kind: "partition" as const, title: "Partition disks" }, ...wizard.slice(wizard.findIndex(s => s.kind === "disk") + 1)]
    : wizard;
  const currentStep = allSteps[stepIdx];
  const welcomeStyle = OS_WELCOME_STYLES[config.id] || { gradient: `linear-gradient(135deg, ${surface}, #000)` };

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
      else { setShowSparkle(true); setTimeout(() => setShowSparkle(false), 1500); setPhase("remove_media"); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, installDuration, config.installFiles]);

  useEffect(() => {
    if (phase !== "installing" || isWindows) return;
    const t = setInterval(() => setSlideIdx(p => (p + 1) % SLIDES.length), 3000);
    return () => clearInterval(t);
  }, [phase, isWindows]);

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

  function setAccountValue(label: string, val: string) {
    setValues(p => ({...p, [ACCOUNT_KEY_MAP[label] || label]: val}));
  }

  function canAdvance(): boolean {
    switch (currentStep?.kind) {
      case "language": return !!selectedLang;
      case "keyboard": return !!selectedKb;
      case "account": {
        const prompts = "prompts" in currentStep ? currentStep.prompts : [];
        const hasPassword = prompts.some(p => p.secret && !!((values[ACCOUNT_KEY_MAP[p.label] || p.label] || "").trim()));
        const hasUser = prompts.some(p => !p.secret && !!((values[ACCOUNT_KEY_MAP[p.label] || p.label] || "").trim()));
        return hasPassword && hasUser;
      }
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

  // ─── SUBIQUITY (Ubuntu 24.04) STEP RENDERER ───
  function renderSubiquityStep(step: typeof currentStep) {
    if (!step) return null;
    switch (step.kind) {
      case "language": {
        const opts = "options" in step ? step.options : LANGUAGES;
        return (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white mb-1">Welcome</h2>
            <p className="text-[11px] text-white/50 mb-5">Choose your language to begin the installation.</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xs mx-auto">
              {opts.map(l => (
                <button key={l} onClick={() => { playClick(); setSelectedLang(l); }}
                  className={`rounded-lg px-4 py-2 text-sm transition-all ${
                    selectedLang === l
                      ? "text-white font-semibold shadow-sm ring-1 ring-white/20"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedLang === l ? { background: "#E95420" } : {}}>
                  <span className="mr-1.5">{l === "English" ? "🇬🇧" : l === "Español" ? "🇪🇸" : l === "Français" ? "🇫🇷" : l === "Deutsch" ? "🇩🇪" : "🌐"}</span>
                  {l}
                </button>
              ))}
            </div>
          </div>
        );
      }
      case "keyboard": {
        const layouts = "layouts" in step ? step.layouts : KEYBOARD_LAYOUTS;
        return (
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white mb-1">Keyboard layout</h2>
            <p className="text-[11px] text-white/50 mb-5">Select your keyboard layout.</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xs mx-auto">
              {layouts.map(k => (
                <button key={k} onClick={() => { playClick(); setSelectedKb(k); }}
                  className={`rounded-lg px-4 py-2 text-sm transition-all ${
                    selectedKb === k
                      ? "text-white font-semibold shadow-sm ring-1 ring-white/20"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedKb === k ? { background: "#E95420" } : {}}>{k}</button>
              ))}
            </div>
            <p className="text-[10px] text-white/30 mt-4 italic">⌨️ Type here to test your layout</p>
          </div>
        );
      }
      case "network": {
        const nets = "interfaces" in step ? step.interfaces : [];
        return (
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-lg font-semibold text-white mb-1">Connect to the internet?</h2>
            <p className="text-[11px] text-white/50 mb-5">Updates and third-party software may be downloaded.</p>
            <div className="space-y-2">
              {nets.map(n => (
                <button key={n.id} onClick={() => { playClick(); setValues(p => ({...p, network: n.id})); }}
                  className={`w-full text-left rounded-lg px-4 py-3 text-sm transition-all flex items-center gap-3 ${
                    values["network"] === n.id ? "text-white font-semibold ring-1 ring-white/20" : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                  style={values["network"] === n.id ? { background: "#E95420" } : {}}>
                  <span className="text-lg">{n.signal && n.signal >= 4 ? "📶" : n.signal ? "📡" : "🔗"}</span>
                  <span className="flex-1">{n.label}</span>
                  <span className="text-[10px] text-white/30">{n.signal}/5</span>
                </button>
              ))}
              <button onClick={() => { playClick(); setValues(p => ({...p, network: "skip"})); }}
                className={`w-full text-center rounded-lg px-4 py-2.5 text-sm transition-all ${
                  values["network"] === "skip" ? "text-white font-semibold ring-1 ring-white/20" : "text-white/40 hover:text-white/60"
                }`}
                style={values["network"] === "skip" ? { background: "#E95420" } : {}}>I don't want to connect to the internet</button>
            </div>
          </div>
        );
      }
      case "updates": {
        return (
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-lg font-semibold text-white mb-1">Installation options</h2>
            <p className="text-[11px] text-white/50 mb-5">What apps would you like to install to start with?</p>
            <div className="space-y-3 mb-5">
              <button onClick={() => { playClick(); setInstallExtended(false); }}
                className={`w-full text-left rounded-xl p-4 transition-all ${
                  !installExtended ? "ring-2 ring-[#E95420] bg-[#E95420]/10" : "border border-white/15 hover:border-white/30 bg-white/5"
                }`}>
                <div className="text-sm font-medium text-white">Default selection</div>
                <div className="text-[10px] text-white/50 mt-1">Web browser, utilities, office software, media players and games.</div>
              </button>
              <button onClick={() => { playClick(); setInstallExtended(true); }}
                className={`w-full text-left rounded-xl p-4 transition-all ${
                  installExtended ? "ring-2 ring-[#E95420] bg-[#E95420]/10" : "border border-white/15 hover:border-white/30 bg-white/5"
                }`}>
                <div className="text-sm font-medium text-white">Extended selection</div>
                <div className="text-[10px] text-white/50 mt-1">Includes additional desktop tools, utilities and a wide range of applications.</div>
              </button>
            </div>
            <div className="space-y-2 text-left">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={installThirdParty} onChange={() => { playClick(); setInstallThirdParty(!installThirdParty); }}
                  className="accent-[#E95420] w-4 h-4" />
                <span className="text-[11px] text-white/70">Install third-party software for graphics and Wi-Fi hardware</span>
              </label>
            </div>
          </div>
        );
      }
      case "disk": {
        const choices = "choices" in step ? step.choices : [];
        return (
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-lg font-semibold text-white mb-1">Installation type</h2>
            <p className="text-[11px] text-white/50 mb-5">How do you want to install Ubuntu?</p>
            <div className="space-y-2">
              {choices.filter(opt => path !== "vm" || opt.id === "erase").map(opt => (
                <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                  className={`w-full text-left rounded-xl p-4 transition-all ${
                    installType === opt.id ? "ring-2 ring-[#E95420] bg-[#E95420]/10" : "border border-white/15 hover:border-white/30 bg-white/5"
                  }`}>
                  <div className="text-sm font-medium text-white">{opt.label}</div>
                  <div className="text-[10px] text-white/50 mt-1">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>
        );
      }
      case "account":
        return (
          <div className="max-w-sm mx-auto">
            <h2 className="text-lg font-semibold text-white mb-1 text-center">Who are you?</h2>
            <p className="text-[11px] text-white/50 mb-5 text-center">Create a user account for daily use of Ubuntu.</p>
            {("prompts" in step ? step.prompts : []).map((p, i) => (
              <Field key={i} label={p.label} value={values[ACCOUNT_KEY_MAP[p.label] || p.label] || ""}
                onChange={v => setAccountValue(p.label, v)}
                placeholder={p.placeholder} type={p.secret ? "password" : "text"} autoFocus={i === 0} />
            ))}
          </div>
        );
      case "timezone": {
        const zones = "zones" in step ? step.zones : [];
        return (
          <div className="text-center max-w-sm mx-auto">
            <h2 className="text-lg font-semibold text-white mb-1">Where are you?</h2>
            <p className="text-[11px] text-white/50 mb-5">Select your timezone.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {zones.map(tz => (
                <button key={tz} onClick={() => { playClick(); setValues(p => ({...p, timezone: tz})); }}
                  className={`rounded-lg px-4 py-2 text-xs transition-all ${
                    values["timezone"] === tz ? "text-white font-semibold ring-1 ring-white/20" : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                  style={values["timezone"] === tz ? { background: "#E95420" } : {}}>{tz}</button>
              ))}
            </div>
          </div>
        );
      }
      case "confirm":
        return (
          <div className="max-w-sm mx-auto">
            <h2 className="text-lg font-semibold text-white mb-1 text-center">Ready to install</h2>
            <p className="text-[11px] text-white/50 mb-4 text-center">Review your choices before proceeding.</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
              {[
                ["Language", selectedLang || "English"],
                ["Keyboard", selectedKb || "English (US)"],
                ["Network", values["network"] === "skip" ? "Skipped" : values["network"] || "Wired"],
                ["Install", installExtended ? "Extended" : "Default"],
                ["Third-party", installThirdParty ? "Yes" : "No"],
                ["Type", installType === "erase" ? "Erase disk" : installType === "alongside" ? "Dual boot" : "Manual"],
                ["Location", values["timezone"] || "UTC"],
                ["Name", values["name"] || "user"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between gap-2">
                  <span className="text-white/50">{l}</span>
                  <span className="text-white/90 font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "partition":
        return (
          <div className="max-w-sm mx-auto">
            <h2 className="text-lg font-semibold text-white mb-1 text-center">Partition disks</h2>
            <p className="text-[11px] text-white/50 mb-3 text-center">Configure disk partitions manually.</p>
            <div className="border border-white/10 divide-y divide-white/10 rounded-lg">
              {["/dev/sda1  ext4  30 GB  /", "/dev/sda2  swap  8 GB", "/dev/sda3  ext4  162 GB  /home"].map((row, i) => (
                <div key={i} className="flex items-center px-3 py-2 text-xs font-mono text-white/60">{row}</div>
              ))}
            </div>
            <button className="mt-2 text-xs font-medium px-3 py-1 rounded border border-dashed border-white/20 text-white/50 hover:text-white">+ Add partition</button>
          </div>
        );
      default:
        return <p className="text-xs text-white/50 text-center">Unknown step</p>;
    }
  }

  // ─── UBIQUITY (Zorin/Mint) STEP RENDERER ───
  function renderUbiquityStep(step: typeof currentStep) {
    if (!step) return null;
    switch (step.kind) {
      case "language": {
        const opts = "options" in step ? step.options : LANGUAGES;
        return (
          <div>
            <h2 className="text-base font-semibold mb-1 text-white">{step.title}</h2>
            <p className="text-xs mb-3 text-white/50">Choose your language.</p>
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
              {opts.map(l => (
                <button key={l} onClick={() => { playClick(); setSelectedLang(l); }}
                  className={`rounded px-3 py-1.5 text-xs transition-all ${
                    selectedLang === l ? "text-white font-semibold shadow-sm ring-1 ring-white/20" : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedLang === l ? { background: accent } : {}}>
                  <span className="mr-1">{l === "English" ? "🇬🇧" : l === "Español" ? "🇪🇸" : l === "Français" ? "🇫🇷" : l === "Deutsch" ? "🇩🇪" : "🌐"}</span>
                  {l}
                </button>
              ))}
            </div>
          </div>
        );
      }
      case "keyboard": {
        const layouts = "layouts" in step ? step.layouts : KEYBOARD_LAYOUTS;
        return (
          <div>
            <h2 className="text-base font-semibold mb-1 text-white">{step.title}</h2>
            <p className="text-xs mb-3 text-white/50">Select your keyboard layout.</p>
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
              {layouts.map(k => (
                <button key={k} onClick={() => { playClick(); setSelectedKb(k); }}
                  className={`rounded px-3 py-1.5 text-xs transition-all ${
                    selectedKb === k ? "text-white font-semibold shadow-sm ring-1 ring-white/20" : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedKb === k ? { background: accent } : {}}>{k}</button>
              ))}
            </div>
          </div>
        );
      }
      case "network": {
        const nets = "interfaces" in step ? step.interfaces : [];
        return (
          <div>
            <h2 className="text-base font-semibold mb-1 text-white">{step.title}</h2>
            <p className="text-xs mb-3 text-white/50">Updates and third-party software may be downloaded.</p>
            <div className="space-y-1.5">
              {nets.map(n => (
                <button key={n.id} onClick={() => { playClick(); setValues(p => ({...p, network: n.id})); }}
                  className={`block text-xs text-left w-full py-2.5 px-3 rounded transition-all flex items-center gap-2 ${
                    values["network"] === n.id ? "text-white font-semibold ring-1 ring-white/20" : "text-white/60 hover:text-white/80 hover:bg-white/5"
                  }`}
                  style={values["network"] === n.id ? { background: accent } : {}}>
                  <span>{n.signal && n.signal >= 4 ? "📶" : n.signal ? "📡" : "🔗"}</span>
                  <span className="flex-1">{n.label}</span>
                </button>
              ))}
              <button onClick={() => { playClick(); setValues(p => ({...p, network: "skip"})); }}
                className={`block text-xs text-left w-full py-2 px-3 rounded transition-all ${values["network"] === "skip" ? "text-white font-semibold ring-1 ring-white/20" : "text-white/40 hover:text-white/60"}`}
                style={values["network"] === "skip" ? { background: accent } : {}}>I don't want to connect to a network</button>
            </div>
          </div>
        );
      }
      case "updates": {
        return (
          <div>
            <h2 className="text-base font-semibold mb-1 text-white">{step.title}</h2>
            <p className="text-xs mb-3 text-white/50">What apps would you like to install to start with?</p>
            <div className="space-y-2 mb-4">
              <button onClick={() => { playClick(); setInstallExtended(false); }}
                className={`w-full text-left rounded-lg p-3 transition-all ${
                  !installExtended ? "ring-1 ring-white/20" : "border border-white/15 hover:border-white/30 bg-white/5"
                }`}
                style={!installExtended ? { background: `${accent}15` } : {}}>
                <div className="text-sm font-medium text-white">Normal installation</div>
                <div className="text-[10px] text-white/50 mt-0.5">Web browser, utilities, office software, media players.</div>
              </button>
              <button onClick={() => { playClick(); setInstallExtended(true); }}
                className={`w-full text-left rounded-lg p-3 transition-all ${
                  installExtended ? "ring-1 ring-white/20" : "border border-white/15 hover:border-white/30 bg-white/5"
                }`}
                style={installExtended ? { background: `${accent}15` } : {}}>
                <div className="text-sm font-medium text-white">Full installation</div>
                <div className="text-[10px] text-white/50 mt-0.5">Includes a full set of desktop tools and utilities.</div>
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={installThirdParty} onChange={() => { playClick(); setInstallThirdParty(!installThirdParty); }}
                  className="w-4 h-4 accent-current cursor-pointer" style={{ accentColor: accent }} />
                <span className="text-[11px] text-white/70">Download updates while installing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={installThirdParty} onChange={() => { playClick(); setInstallThirdParty(!installThirdParty); }}
                  className="w-4 h-4 accent-current cursor-pointer" style={{ accentColor: accent }} />
                <span className="text-[11px] text-white/70">Install third-party software for graphics and Wi-Fi</span>
              </label>
            </div>
          </div>
        );
      }
      case "timezone": {
        const zones = "zones" in step ? step.zones : [];
        return (
          <div>
            <h2 className="text-base font-semibold mb-1 text-white">{step.title}</h2>
            <p className="text-xs mb-3 text-white/50">Select your timezone.</p>
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
              {zones.map(tz => (
                <button key={tz} onClick={() => { playClick(); setValues(p => ({...p, timezone: tz})); }}
                  className={`rounded px-3 py-1.5 text-xs transition-all ${values["timezone"] === tz ? "text-white font-semibold shadow-sm ring-1 ring-white/20" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                  style={values["timezone"] === tz ? { background: accent } : {}}>{tz}</button>
              ))}
            </div>
          </div>
        );
      }
      case "disk": {
        const choices = "choices" in step ? step.choices : [];
        return (
          <div>
            <h2 className="text-base font-semibold mb-1 text-white">{step.title}</h2>
            <p className="text-xs mb-3 text-white/50">Choose how you want to install the system.</p>
            <div className="space-y-2">
              {choices.filter(opt => path !== "vm" || opt.id === "erase").map(opt => (
                <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                  className={`w-full text-left border-2 rounded-lg p-3 transition-all ${
                    installType === opt.id ? "ring-1 ring-white/20" : "border-white/15 hover:border-white/30 bg-white/5"
                  }`}
                  style={installType === opt.id ? { borderColor: accent, background: `${accent}15` } : {}}>
                  <div className="text-sm font-medium text-white">{opt.label}</div>
                  <div className="text-xs mt-0.5 text-white/50">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>
        );
      }
      case "account": {
        const prompts = "prompts" in step ? step.prompts : [];
        return (
          <div>
            <h2 className="text-base font-semibold mb-1 text-white">{step.title}</h2>
            <p className="text-xs mb-3 text-white/50">Create a user account for daily use of {osName}.</p>
            {prompts.map((p, i) => (
              <Field key={i} label={p.label} value={values[ACCOUNT_KEY_MAP[p.label] || p.label] || ""}
                onChange={v => setAccountValue(p.label, v)}
                placeholder={p.placeholder} type={p.secret ? "password" : "text"} autoFocus={i === 0} />
            ))}
          </div>
        );
      }
      case "confirm":
        return (
          <div>
            <h2 className="text-base font-semibold mb-1 text-white">{step.title}</h2>
            <p className="text-xs mb-3 text-white/50">{"body" in step ? step.body : "Review your choices."}</p>
            <div className="border border-white/10 bg-white/5 rounded-lg p-3 space-y-1.5">
              {[
                ["Language", selectedLang || "English"],
                ["Keyboard", selectedKb || "English (US)"],
                ["Network", values["network"] === "skip" ? "Skipped" : values["network"] || "Wired"],
                ["Install", installExtended ? "Full" : "Normal"],
                ["Type", installType === "erase" ? "Erase disk" : installType === "alongside" ? "Dual boot" : "Manual"],
                ["Timezone", values["timezone"] || "UTC"],
                ["Name", values["name"] || "user"],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-4 text-xs"><span className="text-white/40" style={{ minWidth: 80 }}>{l}</span><span className="font-medium text-white">{v}</span></div>
              ))}
            </div>
          </div>
        );
      case "partition":
        return (
          <div>
            <h2 className="text-base font-semibold mb-1 text-white">Partition disks</h2>
            <p className="text-xs mb-3 text-white/50">Configure disk partitions manually.</p>
            <div className="border border-white/10 divide-y divide-white/10 rounded-lg">
              {["/dev/sda1  ext4  30 GB  /", "/dev/sda2  swap  8 GB", "/dev/sda3  ext4  162 GB  /home"].map((row, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-white/70"><span>{row}</span></div>
              ))}
            </div>
            <button className="mt-2 text-xs font-medium px-3 py-1.5 rounded border border-dashed" style={{ color: accent, borderColor: `${accent}40` }}>+ Add partition</button>
          </div>
        );
      default:
        return <p className="text-xs text-white/50">Unknown step</p>;
    }
  }

  // ─── BOOT SPLASH ───
  if (phase === "boot" && bootSplash) {
    return (
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden border border-white/10" style={{ background: surface }}>
          <div className="flex flex-col items-center gap-4">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <OsIcon osId={config.id} accent={accent} size={48} />
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

  // ─── WELCOME ───
  if (phase === "boot") {
    return (
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden border border-white/10 relative"
          style={{ background: welcomeStyle.gradient }}>
          <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 50% 30%, ${accent} 0%, transparent 60%)` }} />
          <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-8 flex flex-col items-center text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-4">
              <OsIcon osId={config.id} accent={accent} size={56} />
            </motion.div>
            <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {isUbuntu ? "Try or Install Ubuntu" :
               config.id === "mint" ? "Linux Mint" :
               config.id === "zorin" ? "Zorin OS" : osName}
            </motion.h1>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-sm text-white/60 mb-6 max-w-md">
              {isUbuntu ? "You can try Ubuntu without making any changes to your computer, or start the installation right away." :
               "You can try it before installing, or install it on your computer."}
            </motion.p>
            <div className="flex items-center gap-3 mb-6">
              <motion.button onClick={handleNext} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all"
                style={{ background: accent }}>Install {osName}</motion.button>
              <motion.button onClick={handleNext} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                className="rounded-lg border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white/80 hover:bg-white/20 transition-all">
                Try {osName}
              </motion.button>
            </div>
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex items-center gap-2 text-[10px] text-white/40">
              <select onChange={e => { playClick(); setSelectedLang(e.target.value); }} value={selectedLang}
                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white/70 text-[10px] outline-none">
                <option value="">Language</option>
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ─── INSTALLING ───
  if (phase === "installing") {
    const slide = SLIDES[slideIdx];
    return (
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <SparkleBurst trigger={showSparkle} />
        <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 flex flex-col"
          style={{ background: `linear-gradient(180deg, ${surface}, #000)` }}>
          <div className="flex-1 flex flex-col lg:flex-row items-stretch">
            <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
              <AnimatePresence mode="wait">
                <motion.div key={slideIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="text-center lg:text-left max-w-md">
                  <div className="text-4xl mb-3">{slide.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{slide.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{slide.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="lg:w-64 shrink-0 flex flex-col items-center justify-center p-6 lg:p-8 lg:border-l border-white/10 gap-3">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="w-10 h-10 rounded-full border-2 border-t-transparent"
                style={{ borderColor: `${accent}40`, borderTopColor: accent }} />
              <p className="text-sm text-white/70 font-medium">Installing {osName}…</p>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: accent }}
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
              </div>
              <p className="text-[10px] text-white/30 font-mono">{Math.floor(progress)}%</p>
              {fileIdx < config.installFiles.length && (
                <p className="text-[8px] text-white/20 text-center max-w-[160px] truncate">{config.installFiles[fileIdx]}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── REMOVE MEDIA ───
  if (phase === "remove_media") {
    return (
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${surface}, #000)` }}>
          <div className="text-center space-y-5">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><OsIcon osId={config.id} accent={accent} size={56} /></motion.div>
            <div>
              <h2 className="text-xl font-bold text-white">Installation Complete</h2>
              <p className="text-xs text-white/50 mt-1">You may now restart your computer.</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2 text-[10px] text-yellow-400/80 max-w-[260px] mx-auto">
              Please remove the installation media before restarting.
            </div>
            <button onClick={() => { playClick(); setPhase("done"); }}
              className="rounded-lg px-8 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all"
              style={{ background: accent }}>Restart Now</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── DONE ───
  if (phase === "done") {
    return (
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${surface}, #000)` }}>
          <div className="text-center space-y-4">
            {restartPhase === "done" ? (
              <>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><OsIcon osId={config.id} accent={accent} size={56} /></motion.div>
                <h2 className="text-lg font-bold text-white">Welcome to {osName}</h2>
                <p className="text-xs text-white/50 max-w-xs mx-auto">Your new system is ready. Please restart to begin.</p>
                <button onClick={() => { playSuccess(); onComplete(); }}
                  className="rounded-lg px-8 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all"
                  style={{ background: accent }}>Restart Now</button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-8 h-8 rounded-full border-2 border-t-transparent"
                  style={{ borderColor: `${accent}40`, borderTopColor: accent }} />
                <div className="text-sm text-white/40 font-mono">Restarting…</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── WIZARD ───
  if (isUbuntu) {
    // Subiquity-style: full dark background, centered dialog
    return (
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, #1a1a2e 0%, #2c001e 50%, #0d0d1a 100%)` }}>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1">
            {allSteps.map((s, i) => (
              <div key={s.kind} className={`h-1 rounded-full transition-all ${i <= stepIdx ? "w-4" : "w-2"}`}
                style={{ background: i <= stepIdx ? "#E95420" : "rgba(255,255,255,0.15)" }} />
            ))}
          </div>
          <div className="bg-[#1e1e28]/90 backdrop-blur border border-white/10 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <AnimatePresence mode="wait">
              <motion.div key={stepIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                {renderSubiquityStep(currentStep)}
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
              <button onClick={handleBack} disabled={stepIdx === 0}
                className="text-xs font-medium px-4 py-1.5 rounded transition-all disabled:opacity-30 text-white/40 hover:text-white/70">Back</button>
              <button onClick={handleNext} disabled={!canAdvance()}
                className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-40 shadow-sm hover:brightness-110 transition-all"
                style={{ background: "#E95420" }}>
                {currentStep?.kind === "confirm" || (stepIdx >= allSteps.length - 1) ? "Install" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ubiquity-style: sidebar + dialog (Zorin, Mint, Debian, Fedora)
  return (
    <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
      <div className="flex-1 flex items-center justify-center p-4"
        style={{ background: `linear-gradient(135deg, ${surface}, ${surface}dd)`, borderRadius: "1rem" }}>
        <div className="w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ background: "#1e1e24", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "92%" }}>
          <div className="px-5 py-3 border-b shrink-0 flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <OsIcon osId={config.id} accent={accent} size={16} />
            <span className="text-xs font-semibold tracking-wider" style={{ color: accent }}>{osName}</span>
            <span className="text-[9px] text-white/25 ml-auto">Step {stepIdx + 1} of {allSteps.length}</span>
          </div>

          <div className="flex flex-1 min-h-0">
            <div className="w-44 shrink-0 p-4 border-r border-white/5 bg-[#25252b] hidden sm:flex flex-col gap-1">
              {allSteps.map((s, i) => {
                const isActive = i === stepIdx;
                const isDone = i < stepIdx;
                return (
                  <div key={s.kind} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] transition-all ${
                    isActive ? "text-white shadow-sm" : isDone ? "text-white/50" : "text-white/30"
                  }`} style={isActive ? { background: `${accent}20` } : {}}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all ${
                      isDone || isActive ? "text-white" : "text-white/30 bg-white/10"
                    }`} style={isDone || isActive ? { background: accent } : {}}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <span className="truncate font-medium">{s.title}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{UBIQUITY_ICONS[currentStep?.kind || ""] || "📋"}</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={stepIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                    {renderUbiquityStep(currentStep)}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between px-6 py-3 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <button onClick={handleBack} disabled={stepIdx === 0}
                  className="text-xs font-medium px-4 py-1.5 rounded transition-all disabled:opacity-30 text-white/40 hover:text-white/70">Back</button>
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
