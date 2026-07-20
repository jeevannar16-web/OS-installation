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

const ACCOUNT_KEY_MAP: Record<string, string> = {
  "Your name": "name",
  "Your computer's name": "computer_name",
  "Pick a username": "username",
  "Choose a password": "password",
  "Confirm your password": "confirm_password",
  "Full name": "name",
  "Username": "username",
  "Password": "password",
  "Set your username": "username",
  "Enter a password": "password",
};

interface WizardTheme {
  name: string;
  containerBg: string;
  dialogBg: string;
  sidebarBg?: string;
  dialogBorder?: string;
  headerFg?: string;
  subheaderFg?: string;
}

function wizardThemeFor(config: OSConfig): WizardTheme {
  const common: WizardTheme = {
    name: config.branding.name,
    containerBg: `linear-gradient(135deg, ${config.branding.surface}, #000)`,
    dialogBg: "#1e1e28",
    dialogBorder: "rgba(255,255,255,0.08)",
    headerFg: "#ffffff",
    subheaderFg: "rgba(255,255,255,0.5)",
  };
  switch (config.id) {
    case "ubuntu":
      return { ...common, containerBg: "linear-gradient(135deg, #1a1a2e 0%, #2c001e 50%, #0d0d1a 100%)", dialogBg: "#1e1e28", headerFg: "#ffffff" };
    case "zorin":
      return { ...common, containerBg: "linear-gradient(180deg, #0a1628 0%, #0f2440 100%)", dialogBg: "#1c2433", sidebarBg: "#151d2b", headerFg: "#e0e8f0", subheaderFg: "rgba(224,232,240,0.5)" };
    case "mint":
      return { ...common, containerBg: "linear-gradient(180deg, #0a1a0a 0%, #0d2818 100%)", dialogBg: "#1a2420", sidebarBg: "#151e1a", headerFg: "#d0edd8", subheaderFg: "rgba(208,237,216,0.5)" };
    case "fedora":
      return { ...common, containerBg: "linear-gradient(180deg, #0d1117 0%, #161b22 100%)", dialogBg: "#1c2128", sidebarBg: "#161b22", headerFg: "#e6edf3" };
    case "debian":
      return { ...common, containerBg: "linear-gradient(180deg, #0d0000 0%, #1a0000 100%)", dialogBg: "#160808", headerFg: "#f0d0d0", subheaderFg: "rgba(240,208,208,0.5)" };
    default:
      return common;
  }
}

function Field({ label, value, onChange, placeholder, type, autoFocus, accent }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean; accent?: string;
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs mb-1 font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</label>
      <input type={type || "text"} value={value} onChange={e => { playKeyClick(); onChange(e.target.value); }}
        placeholder={placeholder || ""} autoFocus={autoFocus}
        style={{ borderColor: `rgba(255,255,255,0.15)`, background: "rgba(255,255,255,0.06)", color: "#fff", outline: "none" }}
        className="w-full rounded px-3 py-2 text-sm placeholder-white/30 transition-colors focus:border-white/30"
        onFocus={e => { e.target.style.borderColor = accent || "rgba(255,255,255,0.3)"; }}
        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; }} />
    </div>
  );
}

export default function Install({ config, speed, onComplete, path }: {
  config: OSConfig; speed: "normal" | "fast"; onComplete: () => void; path?: string;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const isWindows = config.id === "windows";
  const isUbuntu = config.id === "ubuntu";
  const accent = config.branding.accent;
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
  const [selectedKbFamily, setSelectedKbFamily] = useState("");
  const [slideIdx, setSlideIdx] = useState(0);
  const [installExtended, setInstallExtended] = useState(true);
  const [installThirdParty, setInstallThirdParty] = useState(true);
  const [installCodecs, setInstallCodecs] = useState(true);

  const wizard = config.wizard;
  const hasPartition = installType === "something";
  const allSteps = hasPartition
    ? [...wizard.slice(0, wizard.findIndex(s => s.kind === "disk") + 1), { kind: "partition" as const, title: "Partition disks" }, ...wizard.slice(wizard.findIndex(s => s.kind === "disk") + 1)]
    : wizard;
  const currentStep = allSteps[stepIdx];
  const theme = wizardThemeFor(config);

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
      case "keyboard": return !!selectedKb || !!selectedKbFamily;
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

  // ─── SUBIQUITY STEPS (Ubuntu 24.04) ───
  function renderSubiquityStep(step: typeof currentStep) {
    if (!step) return null;
    const a = "#E95420";
    switch (step.kind) {
      case "language": {
        const opts = "options" in step ? step.options : LANGUAGES;
        return (
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <OsIcon osId="ubuntu" accent={a} size={28} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: a }}>Ubuntu 24.04 LTS</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Welcome</h2>
            <p className="text-xs text-white/50 mb-5">Choose your language to begin the installation.</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xs mx-auto">
              {opts.map(l => (
                <button key={l} onClick={() => { playClick(); setSelectedLang(l); }}
                  className={`rounded-lg px-4 py-2 text-sm transition-all ${
                    selectedLang === l ? "text-white font-semibold shadow-sm ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedLang === l ? { background: a } : {}}>
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
            <div className="flex items-center justify-center gap-3 mb-3">
              <OsIcon osId="ubuntu" accent={a} size={28} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: a }}>Ubuntu 24.04 LTS</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Keyboard layout</h2>
            <p className="text-xs text-white/50 mb-5">Select your keyboard layout.</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xs mx-auto">
              {layouts.map(k => (
                <button key={k} onClick={() => { playClick(); setSelectedKb(k); }}
                  className={`rounded-lg px-4 py-2 text-sm transition-all ${
                    selectedKb === k ? "text-white font-semibold shadow-sm ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedKb === k ? { background: a } : {}}>{k}</button>
              ))}
            </div>
            <p className="text-[10px] text-white/30 mt-4 italic">⌨️ Type here to test your layout</p>
          </div>
        );
      }
      case "network": {
        const nets = "interfaces" in step ? step.interfaces : [];
        return (
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <OsIcon osId="ubuntu" accent={a} size={28} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: a }}>Ubuntu 24.04 LTS</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1 text-center">Connect to the internet?</h2>
            <p className="text-xs text-white/50 mb-5 text-center">Updates and third-party software may be downloaded.</p>
            <div className="space-y-2">
              {nets.map(n => (
                <button key={n.id} onClick={() => { playClick(); setValues(p => ({...p, network: n.id})); }}
                  className={`w-full text-left rounded-lg px-4 py-3 text-sm transition-all flex items-center gap-3 ${
                    values["network"] === n.id ? "text-white font-semibold ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  style={values["network"] === n.id ? { background: a } : {}}>
                  <span className="text-lg">{n.signal && n.signal >= 4 ? "📶" : n.signal ? "📡" : "🔗"}</span>
                  <span className="flex-1">{n.label}</span>
                </button>
              ))}
              <button onClick={() => { playClick(); setValues(p => ({...p, network: "skip"})); }}
                className={`w-full text-center rounded-lg px-4 py-2.5 text-sm transition-all ${
                  values["network"] === "skip" ? "text-white font-semibold ring-1 ring-white/20" : "text-white/40 hover:text-white/60"
                }`}
                style={values["network"] === "skip" ? { background: a } : {}}>I don't want to connect to the internet</button>
            </div>
          </div>
        );
      }
      case "updates": {
        return (
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <OsIcon osId="ubuntu" accent={a} size={28} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: a }}>Ubuntu 24.04 LTS</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1 text-center">Installation options</h2>
            <p className="text-xs text-white/50 mb-5 text-center">What apps would you like to install to start with?</p>
            <div className="space-y-3 mb-5">
              <button onClick={() => { playClick(); setInstallExtended(false); }}
                className={`w-full text-left rounded-xl p-4 transition-all ${
                  !installExtended ? "border-2" : "border border-white/15 hover:border-white/30 bg-white/5"
                }`}
                style={!installExtended ? { background: `${a}15`, borderColor: a } : {}}>
                <div className="text-sm font-medium text-white">Default selection</div>
                <div className="text-[10px] text-white/50 mt-1">Web browser, utilities, office software, media players and games.</div>
              </button>
              <button onClick={() => { playClick(); setInstallExtended(true); }}
                className={`w-full text-left rounded-xl p-4 transition-all ${
                  installExtended ? "border-2" : "border border-white/15 hover:border-white/30 bg-white/5"
                }`}
                style={installExtended ? { background: `${a}15`, borderColor: a } : {}}>
                <div className="text-sm font-medium text-white">Extended selection</div>
                <div className="text-[10px] text-white/50 mt-1">Includes additional desktop tools, utilities and a wide range of applications.</div>
              </button>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={installThirdParty} onChange={() => { playClick(); setInstallThirdParty(!installThirdParty); }}
                className="accent-[#E95420] w-4 h-4" />
              <span className="text-xs text-white/60">Install third-party software for graphics and Wi-Fi hardware</span>
            </label>
          </div>
        );
      }
      case "disk": {
        const choices = "choices" in step ? step.choices : [];
        return (
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <OsIcon osId="ubuntu" accent={a} size={28} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: a }}>Ubuntu 24.04 LTS</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1 text-center">Installation type</h2>
            <p className="text-xs text-white/50 mb-5 text-center">How do you want to install Ubuntu?</p>
            <div className="space-y-2">
              {choices.filter(opt => path !== "vm" || opt.id === "erase").map(opt => (
                <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                  className={`w-full text-left rounded-xl p-4 transition-all ${
                    installType === opt.id ? "border-2" : "border border-white/15 hover:border-white/30 bg-white/5"
                  }`}
                  style={installType === opt.id ? { background: `${a}15`, borderColor: a } : {}}>
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
            <div className="flex items-center justify-center gap-3 mb-3">
              <OsIcon osId="ubuntu" accent={a} size={28} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: a }}>Ubuntu 24.04 LTS</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1 text-center">Who are you?</h2>
            <p className="text-xs text-white/50 mb-5 text-center">Create a user account.</p>
            {("prompts" in step ? step.prompts : []).map((p, i) => (
              <Field key={i} label={p.label} value={values[ACCOUNT_KEY_MAP[p.label] || p.label] || ""}
                onChange={v => setAccountValue(p.label, v)}
                placeholder={p.placeholder} type={p.secret ? "password" : "text"} autoFocus={i === 0} accent={a} />
            ))}
          </div>
        );
      case "timezone": {
        const zones = "zones" in step ? step.zones : [];
        return (
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <OsIcon osId="ubuntu" accent={a} size={28} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: a }}>Ubuntu 24.04 LTS</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1 text-center">Where are you?</h2>
            <p className="text-xs text-white/50 mb-5 text-center">Select your timezone.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {zones.map(tz => (
                <button key={tz} onClick={() => { playClick(); setValues(p => ({...p, timezone: tz})); }}
                  className={`rounded-lg px-4 py-2 text-xs transition-all ${
                    values["timezone"] === tz ? "text-white font-semibold ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  style={values["timezone"] === tz ? { background: a } : {}}>{tz}</button>
              ))}
            </div>
          </div>
        );
      }
      case "confirm":
        return (
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <OsIcon osId="ubuntu" accent={a} size={28} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: a }}>Ubuntu 24.04 LTS</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1 text-center">Ready to install</h2>
            <p className="text-xs text-white/50 mb-4 text-center">Review your choices before proceeding.</p>
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
                  <span className="text-white/40">{l}</span>
                  <span className="text-white/80 font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "partition":
        return (
          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <OsIcon osId="ubuntu" accent={a} size={28} />
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: a }}>Ubuntu 24.04 LTS</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1 text-center">Partition disks</h2>
            <p className="text-xs text-white/50 mb-3 text-center">Configure disk partitions manually.</p>
            <div className="border border-white/10 divide-y divide-white/10 rounded-lg">
              {["/dev/sda1  ext4  30 GB  /", "/dev/sda2  swap  8 GB", "/dev/sda3  ext4  162 GB  /home"].map((row, i) => (
                <div key={i} className="flex items-center px-3 py-2 text-xs font-mono text-white/60">{row}</div>
              ))}
            </div>
            <button className="mt-2 text-xs font-medium px-3 py-1 rounded border border-dashed border-white/20 text-white/50 hover:text-white">+ Add partition</button>
          </div>
        );
      default:
        return null;
    }
  }

  // ─── UBIQUITY STEPS (Zorin, Mint) ───
  function renderUbiquityStep(step: typeof currentStep) {
    if (!step) return null;
    const a = accent;
    const isMint = config.id === "mint";
    switch (step.kind) {
      case "language": {
        const opts = "options" in step ? step.options : LANGUAGES;
        return (
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-4" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Choose your language.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {opts.map(l => (
                <button key={l} onClick={() => { playClick(); setSelectedLang(l); }}
                  className={`rounded px-3 py-2 text-xs text-left transition-all flex items-center gap-1.5 ${
                    selectedLang === l ? "text-white font-semibold ring-1 ring-white/20" : "hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedLang === l ? { background: a } : { color: "rgba(255,255,255,0.6)" }}>
                  <span>{l === "English" ? "🇬🇧" : l === "Español" ? "🇪🇸" : l === "Français" ? "🇫🇷" : l === "Deutsch" ? "🇩🇪" : "🌐"}</span>
                  {l}
                </button>
              ))}
            </div>
          </div>
        );
      }
      case "keyboard": {
        const layouts = "layouts" in step ? step.layouts : KEYBOARD_LAYOUTS;
        const families = ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Other"];
        const variants: Record<string, string[]> = {
          English: ["English (US)", "English (UK)", "English (India)", "English (Australia)", "Dvorak", "Colemak"],
          Spanish: ["Español (Latinoamérica)", "Español (Spain)"],
          French: ["Français", "Français (Belgium)", "Français (Switzerland)"],
          German: ["Deutsch", "Deutsch (Austria)", "Deutsch (Switzerland)"],
          Italian: ["Italiano"],
          Portuguese: ["Português (Brasil)", "Português (Portugal)"],
          Other: ["Русский", "中文", "日本語", "한국어", "العربية"],
        };
        const chosenFamily = selectedKbFamily || "English";
        const available = variants[chosenFamily] || layouts;
        const useTwoColumn = isMint || config.id === "zorin";
        if (useTwoColumn) {
          const activeKb = selectedKb || available[0];
          return (
            <div>
              <h2 className="text-base font-semibold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
              <p className="text-xs mb-3" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Choose your keyboard layout.</p>
              <div className="flex gap-3 mb-3">
                <div className="w-1/2">
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Region</p>
                  <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                    {families.map(f => (
                      <button key={f} onClick={() => { playClick(); setSelectedKbFamily(f); setSelectedKb(""); }}
                        className={`block w-full text-left rounded px-2 py-1 text-[11px] transition-all ${
                          chosenFamily === f ? "text-white font-medium" : "text-white/50 hover:text-white/80"
                        }`}
                        style={chosenFamily === f ? { background: `${a}25` } : {}}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="w-1/2">
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Variant</p>
                  <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
                    {available.map(k => (
                      <button key={k} onClick={() => { playClick(); setSelectedKb(k); }}
                        className={`block w-full text-left rounded px-2 py-1 text-[11px] transition-all ${
                          activeKb === k ? "text-white font-medium" : "text-white/50 hover:text-white/80"
                        }`}
                        style={activeKb === k ? { background: a } : {}}>{k}</button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[10px] italic" style={{ color: "rgba(255,255,255,0.25)" }}>⌨️ Type here to test your layout</p>
            </div>
          );
        }
        return (
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-3" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Select your keyboard layout.</p>
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
              {layouts.map(k => (
                <button key={k} onClick={() => { playClick(); setSelectedKb(k); }}
                  className={`rounded px-3 py-1.5 text-xs transition-all ${
                    selectedKb === k ? "text-white font-semibold shadow-sm ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedKb === k ? { background: a } : {}}>{k}</button>
              ))}
            </div>
          </div>
        );
      }
      case "network": {
        const nets = "interfaces" in step ? step.interfaces : [];
        return (
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-3" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Updates and third-party software may be downloaded.</p>
            <div className="space-y-1.5">
              {nets.map(n => (
                <button key={n.id} onClick={() => { playClick(); setValues(p => ({...p, network: n.id})); }}
                  className={`block text-xs text-left w-full py-2.5 px-3 rounded transition-all flex items-center gap-2 ${
                    values["network"] === n.id ? "text-white font-semibold ring-1 ring-white/20" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                  style={values["network"] === n.id ? { background: a } : {}}>
                  <span>{n.signal && n.signal >= 4 ? "📶" : n.signal ? "📡" : "🔗"}</span>
                  <span className="flex-1">{n.label}</span>
                </button>
              ))}
              <button onClick={() => { playClick(); setValues(p => ({...p, network: "skip"})); }}
                className={`block text-xs text-left w-full py-2 px-3 rounded transition-all ${values["network"] === "skip" ? "text-white font-semibold ring-1 ring-white/20" : "text-white/40 hover:text-white/60"}`}
                style={values["network"] === "skip" ? { background: a } : {}}>I don't want to connect to a network</button>
            </div>
          </div>
        );
      }
      case "updates": {
        return (
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-3" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>
              {isMint ? "Install multimedia codecs and choose what to install." : "Choose what apps to install and whether to get updates."}
            </p>
            {isMint && (
              <label className="flex items-center gap-3 mb-4 p-3 rounded-lg cursor-pointer" style={{ background: `${a}15`, border: `1px solid ${a}30` }}>
                <input type="checkbox" checked={installCodecs} onChange={() => { playClick(); setInstallCodecs(!installCodecs); }}
                  className="w-4 h-4" style={{ accentColor: a }} />
                <div>
                  <div className="text-sm font-medium text-white">Install multimedia codecs</div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>MP3, MP4, AVI, Flash, and more</div>
                </div>
              </label>
            )}
            <div className="space-y-2 mb-4">
              <button onClick={() => { playClick(); setInstallExtended(false); }}
                className={`w-full text-left rounded-lg p-3 transition-all ${
                  !installExtended ? "ring-1 ring-white/20" : "border border-white/15 hover:border-white/30 bg-white/5"
                }`}
                style={!installExtended ? { background: `${a}20` } : {}}>
                <div className="text-sm font-medium text-white">{isMint ? "Start from scratch" : "Normal installation"}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Web browser, utilities, office software, media players.</div>
              </button>
              <button onClick={() => { playClick(); setInstallExtended(true); }}
                className={`w-full text-left rounded-lg p-3 transition-all ${
                  installExtended ? "ring-1 ring-white/20" : "border border-white/15 hover:border-white/30 bg-white/5"
                }`}
                style={installExtended ? { background: `${a}20` } : {}}>
                <div className="text-sm font-medium text-white">{isMint ? "Full installation" : "Full installation"}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Includes a full set of desktop tools and utilities.</div>
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={installThirdParty} onChange={() => { playClick(); setInstallThirdParty(!installThirdParty); }}
                  className="w-4 h-4" style={{ accentColor: a }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Download updates while installing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={installThirdParty} onChange={() => { playClick(); setInstallThirdParty(!installThirdParty); }}
                  className="w-4 h-4" style={{ accentColor: a }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Install third-party software for graphics and Wi-Fi</span>
              </label>
            </div>
          </div>
        );
      }
      case "timezone": {
        const zones = "zones" in step ? step.zones : [];
        return (
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-4" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Select your timezone. (Click on the map or choose from the list.)</p>
            <div className="relative mb-4 rounded-lg overflow-hidden" style={{ background: `${a}15`, height: 120 }}>
              <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-40 pointer-events-none">🌍</div>
              {zones.map(tz => (
                <button key={tz} onClick={() => { playClick(); setValues(p => ({...p, timezone: tz})); }}
                  className={`absolute text-[8px] px-1.5 py-0.5 rounded font-medium transition-all ${
                    values["timezone"] === tz ? "text-white shadow-sm ring-1 ring-white/20 z-10" : "text-white/50 hover:text-white/80"
                  }`}
                  style={{
                    ...(values["timezone"] === tz ? { background: a } : {}),
                    ...({
                      "UTC (London)": { top: "30%", left: "43%" },
                      "EST (New York)": { top: "32%", left: "22%" },
                      "CST (Chicago)": { top: "36%", left: "18%" },
                      "MST (Denver)": { top: "38%", left: "14%" },
                      "PST (Los Angeles)": { top: "35%", left: "8%" },
                      "IST (Mumbai)": { top: "40%", left: "62%" },
                      "JST (Tokyo)": { top: "35%", left: "78%" },
                      "AEST (Sydney)": { top: "60%", left: "82%" },
                    }[tz] || { top: "40%", left: "40%" })
                  }}>
                  {tz.includes("(") ? tz.split("(")[1].replace(")", "") : tz}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {zones.map(tz => (
                <button key={tz} onClick={() => { playClick(); setValues(p => ({...p, timezone: tz})); }}
                  className={`rounded px-3 py-1.5 text-[11px] transition-all ${values["timezone"] === tz ? "text-white font-semibold" : "text-white/50 hover:text-white hover:bg-white/10"}`}
                  style={values["timezone"] === tz ? { background: a } : {}}>{tz}</button>
              ))}
            </div>
          </div>
        );
      }
      case "disk": {
        const choices = "choices" in step ? step.choices : [];
        return (
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-3" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Choose how you want to install the system.</p>
            <div className="space-y-2">
              {choices.filter(opt => path !== "vm" || opt.id === "erase").map(opt => (
                <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                  className={`w-full text-left border-2 rounded-lg p-3 transition-all ${
                    installType === opt.id ? "" : "border-white/15 hover:border-white/30 bg-white/5"
                  }`}
                  style={installType === opt.id ? { borderColor: a, background: `${a}15` } : {}}>
                  <div className="text-sm font-medium text-white">{opt.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{opt.hint}</div>
                </button>
              ))}
            </div>
            {config.id === "mint" && installType === "erase" && (
              <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: `${a}12`, border: `1px solid ${a}25` }}>
                <p className="text-white/70">The disk will be erased and formatted. All data will be lost.</p>
              </div>
            )}
          </div>
        );
      }
      case "account": {
        const prompts = "prompts" in step ? step.prompts : [];
        return (
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-3" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Create a user account for daily use of {osName}.</p>
            {prompts.map((p, i) => (
              <Field key={i} label={p.label} value={values[ACCOUNT_KEY_MAP[p.label] || p.label] || ""}
                onChange={v => setAccountValue(p.label, v)}
                placeholder={p.placeholder} type={p.secret ? "password" : "text"} autoFocus={i === 0} accent={a} />
            ))}
          </div>
        );
      }
      case "confirm":
        return (
          <div>
            <h2 className="text-base font-semibold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-3" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>{"body" in step ? step.body : "Review your choices."}</p>
            <div className="border border-white/10 bg-white/5 rounded-lg p-3 space-y-1.5">
              {[
                ["Language", selectedLang || "English"],
                ["Keyboard", selectedKb || "English (US)"],
                ["Network", values["network"] === "skip" ? "Skipped" : values["network"] || "Wired"],
                ["Install", installExtended ? "Full" : "Normal"],
                ["Third-party", installThirdParty ? "Yes" : "No"],
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
            <h2 className="text-base font-semibold mb-1" style={{ color: theme.headerFg }}>Partition disks</h2>
            <p className="text-xs mb-3" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Configure disk partitions manually.</p>
            <div className="border border-white/10 divide-y divide-white/10 rounded-lg">
              {["/dev/sda1  ext4  30 GB  /", "/dev/sda2  swap  8 GB", "/dev/sda3  ext4  162 GB  /home"].map((row, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-white/60">{row}</div>
              ))}
            </div>
            <button className="mt-2 text-xs font-medium px-3 py-1.5 rounded border border-dashed"
              style={{ color: a, borderColor: `${a}40` }}>+ Add partition</button>
          </div>
        );
      default:
        return null;
    }
  }

  // ─── SIMPLE / FALLBACK STEPS (Fedora Anaconda, Debian) ───
  function renderSimpleStep(step: typeof currentStep) {
    if (!step) return null;
    const a = accent;
    const isDebian = config.id === "debian";
    switch (step.kind) {
      case "language": {
        const opts = "options" in step ? step.options : LANGUAGES;
        return (
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <OsIcon osId={config.id} accent={a} size={20} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: a }}>{osName} Installer</span>
            </div>
            <h2 className="text-base font-bold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-4" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Select a language:</p>
            <div className="space-y-0.5">
              {opts.map(l => (
                <button key={l} onClick={() => { playClick(); setSelectedLang(l); }}
                  className={`block w-full text-left rounded px-3 py-2 text-xs transition-all ${
                    selectedLang === l ? "text-white font-semibold ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedLang === l ? { background: a } : {}}>{l}</button>
              ))}
            </div>
          </div>
        );
      }
      case "keyboard": {
        const layouts = "layouts" in step ? step.layouts : KEYBOARD_LAYOUTS;
        return (
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <OsIcon osId={config.id} accent={a} size={20} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: a }}>{osName} Installer</span>
            </div>
            <h2 className="text-base font-bold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-4" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Choose your keyboard layout:</p>
            <div className="space-y-0.5 max-h-64 overflow-y-auto">
              {layouts.map(k => (
                <button key={k} onClick={() => { playClick(); setSelectedKb(k); }}
                  className={`block w-full text-left rounded px-3 py-2 text-xs transition-all ${
                    selectedKb === k ? "text-white font-semibold ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedKb === k ? { background: a } : {}}>{k}</button>
              ))}
            </div>
            {isDebian && <p className="text-[10px] mt-3 italic" style={{ color: "rgba(255,255,255,0.25)" }}>Press Tab to move between items, Space to select.</p>}
          </div>
        );
      }
      case "disk": {
        const choices = "choices" in step ? step.choices : [];
        return (
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <OsIcon osId={config.id} accent={a} size={20} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: a }}>{osName} Installer</span>
            </div>
            <h2 className="text-base font-bold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-4" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Choose how to partition the disk:</p>
            <div className="space-y-2">
              {choices.filter(opt => path !== "vm" || opt.id === "erase" || opt.id === "auto" || opt.id === "guided").map(opt => (
                <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                  className={`w-full text-left rounded-lg p-3 border-2 transition-all ${
                    installType === opt.id ? "" : "border-white/15 hover:border-white/30"
                  }`}
                  style={installType === opt.id ? { borderColor: a, background: `${a}15` } : {}}>
                  <div className="text-sm font-medium text-white">{opt.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{opt.hint}</div>
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
            <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <OsIcon osId={config.id} accent={a} size={20} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: a }}>{osName} Installer</span>
            </div>
            <h2 className="text-base font-bold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-3" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>Create a user account:</p>
            {prompts.map((p, i) => (
              <Field key={i} label={p.label} value={values[ACCOUNT_KEY_MAP[p.label] || p.label] || ""}
                onChange={v => setAccountValue(p.label, v)}
                placeholder={p.placeholder} type={p.secret ? "password" : "text"} autoFocus={i === 0} accent={a} />
            ))}
          </div>
        );
      }
      case "confirm":
        return (
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <OsIcon osId={config.id} accent={a} size={20} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: a }}>{osName} Installer</span>
            </div>
            <h2 className="text-base font-bold mb-1" style={{ color: theme.headerFg }}>{step.title}</h2>
            <p className="text-xs mb-3" style={{ color: theme.subheaderFg || "rgba(255,255,255,0.5)" }}>{"body" in step ? step.body : "Ready to install."}</p>
            <div className="border border-white/10 bg-white/5 rounded-lg p-3 space-y-1.5">
              {[
                ["Language", selectedLang || "English"],
                ["Keyboard", selectedKb || "English (US)"],
                ["Type", installType === "erase" ? "Erase disk" : installType === "auto" ? "Auto" : "Manual"],
                ["User", values["name"] || "user"],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-4 text-xs"><span className="text-white/40" style={{ minWidth: 80 }}>{l}</span><span className="font-medium text-white">{v}</span></div>
              ))}
            </div>
            {isDebian && (
              <p className="text-[10px] mt-3" style={{ color: "rgba(255,200,100,0.6)" }}>⚠️ Installing GRUB boot loader to disk.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  // ─── BOOT SPLASH ───
  if (phase === "boot" && bootSplash) {
    return (
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden border border-white/10" style={{ background: config.branding.surface }}>
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
    const isUbuntuStyle = isUbuntu;
    return (
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden border border-white/10 relative"
          style={{ background: `linear-gradient(135deg, ${config.branding.surface}, #000)` }}>
          <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 50% 30%, ${accent} 0%, transparent 60%)` }} />
          <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-8 flex flex-col items-center text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-4">
              <OsIcon osId={config.id} accent={accent} size={56} />
            </motion.div>
            <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {isUbuntuStyle ? "Try or Install Ubuntu" :
               config.id === "mint" ? "Linux Mint 22" :
               config.id === "zorin" ? "Zorin OS 17" :
               config.id === "fedora" ? "Fedora Workstation 41" :
               config.id === "debian" ? "Debian 12 GNU/Linux" : osName}
            </motion.h1>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-sm text-white/60 mb-6 max-w-md">
              {isUbuntuStyle ? "You can try Ubuntu without making any changes to your computer, or start the installation right away." :
               config.id === "mint" ? "You can try Linux Mint without making any changes to your computer, or install it directly." :
               "You can try it before installing, or install it on your computer."}
            </motion.p>
            <div className="flex items-center gap-3 mb-6">
              <motion.button onClick={handleNext} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all"
                style={{ background: accent }}>Install {osName}</motion.button>
              <motion.button onClick={handleNext} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                className="rounded-lg border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-medium text-white/80 hover:bg-white/20 transition-all">
                Try {config.id === "mint" ? "Linux Mint" : config.id === "zorin" ? "Zorin OS" : osName}
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
          style={{ background: `linear-gradient(180deg, ${config.branding.surface}, #000)` }}>
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
          style={{ background: `linear-gradient(135deg, ${config.branding.surface}, #000)` }}>
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
          style={{ background: `linear-gradient(135deg, ${config.branding.surface}, #000)` }}>
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
    // Subiquity-style: dark aubergine, centered card, step dots, orange accent
    const a = "#E95420";
    return (
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2c001e 50%, #0d0d1a 100%)" }}>
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 20%, rgba(233,84,32,0.08) 0%, transparent 60%)" }} />
          <div className="relative z-10 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6"
            style={{ background: `${theme.dialogBg}E0`, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-center gap-1.5 mb-5">
              {allSteps.map((s, i) => (
                <div key={s.kind} className={`h-1 rounded-full transition-all duration-300 ${i <= stepIdx ? "w-5" : "w-1.5"}`}
                  style={{ background: i <= stepIdx ? a : "rgba(255,255,255,0.12)" }} />
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={stepIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                {renderSubiquityStep(currentStep)}
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-between mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={handleBack} disabled={stepIdx === 0}
                className="text-xs font-medium px-4 py-1.5 rounded transition-all disabled:opacity-30"
                style={{ color: stepIdx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}
                onMouseOver={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                onMouseOut={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>Back</button>
              <button onClick={handleNext} disabled={!canAdvance()}
                className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-40 shadow-sm hover:brightness-110 transition-all"
                style={{ background: a }}>
                {currentStep?.kind === "confirm" || (stepIdx >= allSteps.length - 1) ? "Install" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Zorin Ubiquity: sidebar + content, themed
  if (config.id === "zorin") {
    const a = config.branding.accent;
    return (
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center p-4"
          style={{ background: "linear-gradient(180deg, #0a1628 0%, #0f2440 100%)", borderRadius: "1rem" }}>
          <div className="w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden"
            style={{ background: "#1c2433", border: "1px solid rgba(255,255,255,0.06)", maxHeight: "92%" }}>
            <div className="px-5 py-3 shrink-0 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <OsIcon osId="zorin" accent={a} size={18} />
              <span className="text-xs font-bold tracking-wider" style={{ color: a }}>Zorin OS</span>
              <span className="text-[9px] ml-auto" style={{ color: "rgba(255,255,255,0.2)" }}>Step {stepIdx + 1} of {allSteps.length}</span>
            </div>
            <div className="flex flex-1 min-h-0">
              <div className="w-40 shrink-0 p-3 flex flex-col gap-0.5" style={{ background: "#151d2b", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                {allSteps.map((s, i) => {
                  const isActive = i === stepIdx;
                  const isDone = i < stepIdx;
                  return (
                    <div key={s.kind}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[11px] transition-all ${
                        isActive ? "" : ""}`}
                      style={isActive ? { background: `${a}18` } : isDone ? { opacity: 0.6 } : { opacity: 0.35 }}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all ${
                        isDone ? "" : isActive ? "" : "bg-white/10"
                      }`}
                        style={isDone || isActive ? { background: a } : { background: "rgba(255,255,255,0.06)" }}>
                        {isDone ? (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <span className="text-white font-semibold">{i + 1}</span>
                        )}
                      </div>
                      <span className={`truncate font-medium ${isActive ? "text-white" : "text-white/70"}`}>
                        {s.title}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <AnimatePresence mode="wait">
                    <motion.div key={stepIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                      {renderUbiquityStep(currentStep)}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button onClick={handleBack} disabled={stepIdx === 0}
                    className="text-xs font-medium px-4 py-1.5 rounded transition-all disabled:opacity-30"
                    style={{ color: stepIdx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}
                    onMouseOver={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                    onMouseOut={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>Back</button>
                  <button onClick={handleNext} disabled={!canAdvance()}
                    className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-40 shadow-sm hover:brightness-110 transition-all"
                    style={{ background: a }}>
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

  // Mint Ubiquity: sidebar + content with green theme, distinct step icons
  if (config.id === "mint") {
    const a = config.branding.accent;
    return (
      <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
        <div className="flex-1 flex items-center justify-center p-4"
          style={{ background: "linear-gradient(180deg, #0a1a0a 0%, #0d2818 100%)", borderRadius: "1rem" }}>
          <div className="w-full max-w-2xl rounded-xl shadow-2xl flex flex-col overflow-hidden"
            style={{ background: "#1a2420", border: "1px solid rgba(136,201,153,0.12)", maxHeight: "92%" }}>
            <div className="px-5 py-3 shrink-0 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(136,201,153,0.08)" }}>
              <OsIcon osId="mint" accent={a} size={18} />
              <span className="text-xs font-bold tracking-wider" style={{ color: a }}>Linux Mint</span>
              <span className="text-[9px] ml-auto" style={{ color: "rgba(255,255,255,0.2)" }}>Step {stepIdx + 1} of {allSteps.length}</span>
            </div>
            <div className="flex flex-1 min-h-0">
              <div className="w-40 shrink-0 p-3 flex flex-col gap-1" style={{ background: "#151e1a", borderRight: "1px solid rgba(136,201,153,0.04)" }}>
                {allSteps.map((s, i) => {
                  const isActive = i === stepIdx;
                  const isDone = i < stepIdx;
                  const stepIcons: Record<string, string> = { language: "🌐", keyboard: "⌨️", network: "📶", timezone: "🌍", disk: "💾", account: "👤", confirm: "✅", partition: "🔧", updates: "📦" };
                  return (
                    <div key={s.kind}
                      className={`flex items-center gap-2 px-2 py-2 rounded text-[11px] transition-all ${
                        isActive ? "" : isDone ? "opacity-60" : "opacity-35"}`}
                      style={isActive ? { background: `${a}15` } : {}}>
                      <span className="text-[13px]">{stepIcons[s.kind] || "•"}</span>
                      <span className={`truncate font-medium ${isActive ? "text-white" : "text-white/70"}`}>{s.title}</span>
                      {isDone && <span className="ml-auto text-[9px]" style={{ color: a }}>✓</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <AnimatePresence mode="wait">
                    <motion.div key={stepIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                      {renderUbiquityStep(currentStep)}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderTop: "1px solid rgba(136,201,153,0.08)" }}>
                  <button onClick={handleBack} disabled={stepIdx === 0}
                    className="text-xs font-medium px-4 py-1.5 rounded transition-all disabled:opacity-30"
                    style={{ color: stepIdx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}
                    onMouseOver={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                    onMouseOut={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>Back</button>
                  <button onClick={handleNext} disabled={!canAdvance()}
                    className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-40 shadow-sm hover:brightness-110 transition-all"
                    style={{ background: a }}>
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

  // Fedora (Anaconda-style hub) / Debian (simple dialog)
  const isFedora = config.id === "fedora";
  const isDebian = config.id === "debian";
  const simpleTheme = isDebian
    ? { containerBg: "linear-gradient(180deg, #0d0000 0%, #1a0000 100%)", dialogBg: "#160808", borderColor: "rgba(168,0,48,0.15)" }
    : { containerBg: "linear-gradient(180deg, #0d1117 0%, #161b22 100%)", dialogBg: "#1c2128", borderColor: "rgba(60,110,180,0.15)" };

  return (
    <div className="mx-auto w-full flex flex-col" style={{ height: "min(700px, 90vh)" }}>
      <div className="flex-1 flex items-center justify-center p-4"
        style={{ background: simpleTheme.containerBg, borderRadius: "1rem" }}>
        <div className="w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{ background: simpleTheme.dialogBg, border: `1px solid ${simpleTheme.borderColor}`, maxHeight: "92%" }}>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <AnimatePresence mode="wait">
              <motion.div key={stepIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                {renderSimpleStep(currentStep)}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderTop: `1px solid ${simpleTheme.borderColor}` }}>
            <button onClick={handleBack} disabled={stepIdx === 0}
              className="text-xs font-medium px-4 py-1.5 rounded transition-all disabled:opacity-30"
              style={{ color: stepIdx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}
              onMouseOver={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
              onMouseOut={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>Back</button>
            <button onClick={handleNext} disabled={!canAdvance()}
              className="rounded-lg px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-40 shadow-sm hover:brightness-110 transition-all"
              style={{ background: accent }}>
              {currentStep?.kind === "confirm" || (stepIdx >= allSteps.length - 1) ? (isDebian ? "Finish" : isFedora ? "Begin Installation" : "Install") : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
