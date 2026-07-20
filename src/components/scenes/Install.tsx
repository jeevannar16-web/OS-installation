import { useEffect, useRef, useState } from "react";
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

const ACCOUNT_KEY_MAP: Record<string, string> = {
  "Your name": "name", "Your computer's name": "computer_name", "Pick a username": "username",
  "Choose a password": "password", "Confirm your password": "confirm_password", "Full name": "name",
  "Username": "username", "Password": "password", "Set your username": "username", "Enter a password": "password",
};

function Field({ label, value, onChange, placeholder, type, autoFocus, accent }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoFocus?: boolean; accent?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</label>
      <input type={type || "text"} value={value} onChange={e => { playKeyClick(); onChange(e.target.value); }}
        placeholder={placeholder || ""} autoFocus={autoFocus}
        className="w-full rounded-lg px-4 py-3 text-base placeholder-white/30 transition-all outline-none"
        style={{ border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "#fff" }}
        onFocus={e => { e.target.style.borderColor = accent || "rgba(255,255,255,0.4)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.background = "rgba(255,255,255,0.07)"; }} />
    </div>
  );
}

const STEP_ICONS_LIGHT: Record<string, string> = {
  language: "🌐", keyboard: "⌨️", network: "📶", timezone: "🌍", disk: "💾", account: "👤", confirm: "✅", partition: "🔧", updates: "📦",
};

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
  const [installExtended, setInstallExtended] = useState(true);
  const [installThirdParty, setInstallThirdParty] = useState(true);
  const [installCodecs, setInstallCodecs] = useState(true);
  const [logLines, setLogLines] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

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
      else { setShowSparkle(true); setTimeout(() => setShowSparkle(false), 1500); setPhase("remove_media"); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, installDuration, config.installFiles]);

  useEffect(() => {
    if (phase !== "installing") { setLogLines([]); return; }
    const steps = [
      "Starting installation process...",
      "Preparing target disk...",
      `Creating ext4 filesystem on /dev/sda... [OK]`,
      `Installing base system: ${osName} core...`,
      ...config.installFiles.slice(0, 8).map(f => `  Extracting ${f.replace(/^…\s*/, "").substring(0, 50)}...`),
      "Configuring package manager...",
      `  Setting up apt sources for ${osName}... done.`,
      "Installing linux kernel...",
      "  vmlinuz-6.8.0-41-generic: OK",
      "  initrd.img-6.8.0-41-generic: OK",
      "Installing system packages...",
      "  libc6 (2.35-0ubuntu3.8): OK",
      "  systemd (255.4-1): OK",
      "  network-manager (1.48.0-1): OK",
      "  grub-pc (2.12-1): OK",
      "  desktop-base: OK",
      `  ${osName.toLowerCase()}-desktop: OK`,
      "  language-pack-en: OK",
      "Configuring GRUB boot loader...",
      "  Installing for i386-pc platform.",
      "  grub-install: info: Installing to /dev/sda... done.",
      "  update-grub: Generating grub configuration file...",
      "    Found linux image: /boot/vmlinuz-6.8.0-41-generic",
      "    Found initrd image: /boot/initrd.img-6.8.0-41-generic",
      "Configuring networking...",
      "  NetworkManager: [OK]",
      "Setting up user accounts...",
      `  Creating user '${["user", "admin", osName.toLowerCase(), "live"].sort(() => Math.random() - 0.5)[0]}'... done.`,
      "Configuring console-setup...",
      "  Setting keyboard layout... [OK]",
      "Configuring locales...",
      "  en_US.UTF-8: generated",
      "Installing language packs...",
      "  Language pack support: complete",
      "Running post-installation hooks...",
      "  update-initramfs: Generating /boot/initrd.img-6.8.0-41-generic",
      "  Cleaning up temporary files... done.",
      `Installation of ${osName} complete.`,
      "Preparing for first boot...",
    ];
    let i = 0;
    const interval = speed === "fast" ? 30 : 100;
    const t = setInterval(() => {
      if (i < steps.length) {
        setLogLines(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[i]}`]);
        i++;
      } else {
        clearInterval(t);
      }
    }, interval);
    return () => clearInterval(t);
  }, [phase, speed, config.installFiles, osName]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines]);

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

  // ─── SUBIQUITY STEP CONTENT (Ubuntu) ───
  function renderSubiquityStep(step: typeof currentStep) {
    if (!step) return null;
    const a = "#E95420";
    switch (step.kind) {
      case "language": {
        const opts = "options" in step ? step.options : LANGUAGES;
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome</h2>
            <p className="text-sm text-white/50 mb-6">Choose your language to begin the installation.</p>
            <div className="grid grid-cols-2 gap-2">
              {opts.map(l => (
                <button key={l} onClick={() => { playClick(); setSelectedLang(l); }}
                  className={`rounded-lg px-4 py-3 text-sm text-left transition-all flex items-center gap-2 ${
                    selectedLang === l ? "text-white font-semibold shadow-sm ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedLang === l ? { background: a } : {}}>
                  <span className="text-lg">{l === "English" ? "🇬🇧" : l === "Español" ? "🇪🇸" : l === "Français" ? "🇫🇷" : l === "Deutsch" ? "🇩🇪" : "🌐"}</span>
                  <span>{l}</span>
                </button>
              ))}
            </div>
          </div>
        );
      }
      case "keyboard": {
        const layouts = "layouts" in step ? step.layouts : KEYBOARD_LAYOUTS;
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Keyboard layout</h2>
            <p className="text-sm text-white/50 mb-6">Select your keyboard layout.</p>
            <div className="grid grid-cols-2 gap-2">
              {layouts.map(k => (
                <button key={k} onClick={() => { playClick(); setSelectedKb(k); }}
                  className={`rounded-lg px-4 py-3 text-sm transition-all ${
                    selectedKb === k ? "text-white font-semibold shadow-sm ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedKb === k ? { background: a } : {}}>{k}</button>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-4 italic">⌨️ Type here to test your layout</p>
          </div>
        );
      }
      case "network": {
        const nets = "interfaces" in step ? step.interfaces : [];
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Connect to the internet?</h2>
            <p className="text-sm text-white/50 mb-6">Updates and third-party software may be downloaded.</p>
            <div className="space-y-2">
              {nets.map(n => (
                <button key={n.id} onClick={() => { playClick(); setValues(p => ({...p, network: n.id})); }}
                  className={`w-full text-left rounded-lg px-4 py-3 text-sm transition-all flex items-center gap-3 ${
                    values["network"] === n.id ? "text-white font-semibold ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10 bg-white/5"
                  }`}
                  style={values["network"] === n.id ? { background: a } : {}}>
                  <span className="text-xl">{n.signal && n.signal >= 4 ? "📶" : n.signal ? "📡" : "🔗"}</span>
                  <span className="flex-1 font-medium">{n.label}</span>
                </button>
              ))}
              <button onClick={() => { playClick(); setValues(p => ({...p, network: "skip"})); }}
                className={`w-full text-center rounded-lg px-4 py-3 text-sm transition-all ${
                  values["network"] === "skip" ? "text-white font-semibold ring-1 ring-white/20" : "text-white/40 hover:text-white/60"
                }`}
                style={values["network"] === "skip" ? { background: a } : {}}>I don't want to connect to the internet</button>
            </div>
          </div>
        );
      }
      case "updates": {
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Installation options</h2>
            <p className="text-sm text-white/50 mb-6">What apps would you like to install to start with?</p>
            <div className="space-y-3 mb-6">
              {[
                { id: false, label: "Default selection", desc: "Web browser, utilities, office software, media players and games." },
                { id: true, label: "Extended selection", desc: "Includes additional desktop tools, utilities and a wide range of applications." },
              ].map(opt => (
                <button key={String(opt.id)} onClick={() => { playClick(); setInstallExtended(opt.id); }}
                  className={`w-full text-left rounded-xl p-4 transition-all ${
                    installExtended === opt.id ? "border-2" : "border border-white/15 hover:border-white/30 bg-white/5"
                  }`}
                  style={installExtended === opt.id ? { borderColor: a, background: `${a}15` } : {}}>
                  <div className="text-base font-medium text-white">{opt.label}</div>
                  <div className="text-xs text-white/50 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={installThirdParty} onChange={() => { playClick(); setInstallThirdParty(!installThirdParty); }}
                className="w-5 h-5 accent-[#E95420]" />
              <span className="text-sm text-white/60">Install third-party software for graphics and Wi-Fi hardware</span>
            </label>
          </div>
        );
      }
      case "disk": {
        const choices = "choices" in step ? step.choices : [];
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Installation type</h2>
            <p className="text-sm text-white/50 mb-6">How do you want to install Ubuntu?</p>
            <div className="space-y-2">
              {choices.filter(opt => path !== "vm" || opt.id === "erase").map(opt => (
                <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                  className={`w-full text-left rounded-xl p-4 transition-all ${
                    installType === opt.id ? "border-2" : "border border-white/15 hover:border-white/30 bg-white/5"
                  }`}
                  style={installType === opt.id ? { borderColor: a, background: `${a}15` } : {}}>
                  <div className="text-base font-medium text-white">{opt.label}</div>
                  <div className="text-xs text-white/50 mt-1">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>
        );
      }
      case "account":
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Who are you?</h2>
            <p className="text-sm text-white/50 mb-6">Create a user account.</p>
            {("prompts" in step ? step.prompts : []).map((p, i) => (
              <Field key={i} label={p.label} value={values[ACCOUNT_KEY_MAP[p.label] || p.label] || ""}
                onChange={v => setAccountValue(p.label, v)} placeholder={p.placeholder}
                type={p.secret ? "password" : "text"} autoFocus={i === 0} accent={a} />
            ))}
          </div>
        );
      case "timezone": {
        const zones = "zones" in step ? step.zones : [];
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Where are you?</h2>
            <p className="text-sm text-white/50 mb-6">Select your timezone.</p>
            <div className="grid grid-cols-2 gap-2">
              {zones.map(tz => (
                <button key={tz} onClick={() => { playClick(); setValues(p => ({...p, timezone: tz})); }}
                  className={`rounded-lg px-4 py-3 text-sm transition-all ${
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
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Ready to install</h2>
            <p className="text-sm text-white/50 mb-4">Review your choices before proceeding.</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
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
                <div key={l} className="flex justify-between items-center">
                  <span className="text-sm text-white/40">{l}</span>
                  <span className="text-sm text-white/80 font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "partition":
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Partition disks</h2>
            <p className="text-sm text-white/50 mb-4">Configure disk partitions manually.</p>
            <div className="border border-white/10 divide-y divide-white/10 rounded-xl">
              {["/dev/sda1  ext4  30 GB  /", "/dev/sda2  swap  8 GB", "/dev/sda3  ext4  162 GB  /home"].map((row, i) => (
                <div key={i} className="flex items-center px-4 py-3 text-sm font-mono text-white/60">{row}</div>
              ))}
            </div>
            <button className="mt-3 text-sm font-medium px-4 py-2 rounded-lg border border-dashed border-white/20 text-white/50 hover:text-white transition-all">+ Add partition</button>
          </div>
        );
      default: return null;
    }
  }

  // ─── UBIQUITY STEP CONTENT (Zorin, Mint) ───
  function renderUbiquityStep(step: typeof currentStep) {
    if (!step) return null;
    const a = accent;
    const isMint = config.id === "mint";
    switch (step.kind) {
      case "language": {
        const opts = "options" in step ? step.options : LANGUAGES;
        return (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-5">Choose your language.</p>
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-2">
              {opts.map(l => (
                <button key={l} onClick={() => { playClick(); setSelectedLang(l); }}
                  className={`rounded-lg px-4 py-3 text-sm text-left transition-all flex items-center gap-2 ${
                    selectedLang === l ? "text-white font-semibold ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedLang === l ? { background: a } : {}}>
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
        const activeKb = selectedKb || available[0];
        return (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-5">Choose your keyboard layout.</p>
            <div className="flex gap-4 mb-4">
              <div className="w-1/2">
                <p className="text-xs font-medium mb-2 text-white/40 uppercase tracking-wider">Region</p>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {families.map(f => (
                    <button key={f} onClick={() => { playClick(); setSelectedKbFamily(f); setSelectedKb(""); }}
                      className={`block w-full text-left rounded-lg px-3 py-2 text-sm transition-all ${
                        chosenFamily === f ? "text-white font-medium" : "text-white/50 hover:text-white/80"
                      }`}
                      style={chosenFamily === f ? { background: `${a}20` } : {}}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="w-1/2">
                <p className="text-xs font-medium mb-2 text-white/40 uppercase tracking-wider">Variant</p>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {available.map(k => (
                    <button key={k} onClick={() => { playClick(); setSelectedKb(k); }}
                      className={`block w-full text-left rounded-lg px-3 py-2 text-sm transition-all ${
                        activeKb === k ? "text-white font-medium" : "text-white/50 hover:text-white/80"
                      }`}
                      style={activeKb === k ? { background: a } : {}}>{k}</button>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs italic text-white/25">⌨️ Type here to test your layout</p>
          </div>
        );
      }
      case "network": {
        const nets = "interfaces" in step ? step.interfaces : [];
        return (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-5">Updates and third-party software may be downloaded.</p>
            <div className="space-y-2">
              {nets.map(n => (
                <button key={n.id} onClick={() => { playClick(); setValues(p => ({...p, network: n.id})); }}
                  className={`w-full text-left rounded-lg px-4 py-3 text-sm transition-all flex items-center gap-3 ${
                    values["network"] === n.id ? "text-white font-semibold ring-1 ring-white/20" : "text-white/50 hover:text-white/80 bg-white/5"
                  }`}
                  style={values["network"] === n.id ? { background: a } : {}}>
                  <span className="text-lg">{n.signal && n.signal >= 4 ? "📶" : n.signal ? "📡" : "🔗"}</span>
                  <span className="flex-1">{n.label}</span>
                </button>
              ))}
              <button onClick={() => { playClick(); setValues(p => ({...p, network: "skip"})); }}
                className={`w-full text-center rounded-lg px-4 py-3 text-sm transition-all ${values["network"] === "skip" ? "text-white font-semibold ring-1 ring-white/20" : "text-white/40 hover:text-white/60"}`}
                style={values["network"] === "skip" ? { background: a } : {}}>I don't want to connect to a network</button>
            </div>
          </div>
        );
      }
      case "updates": {
        return (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-5">
              {isMint ? "Install multimedia codecs and choose what to install." : "Choose what apps to install and whether to get updates."}
            </p>
            {isMint && (
              <label className="flex items-center gap-3 mb-5 p-4 rounded-xl cursor-pointer" style={{ background: `${a}15`, border: `1.5px solid ${a}30` }}>
                <input type="checkbox" checked={installCodecs} onChange={() => { playClick(); setInstallCodecs(!installCodecs); }}
                  className="w-5 h-5" style={{ accentColor: a }} />
                <div>
                  <div className="text-base font-medium text-white">Install multimedia codecs</div>
                  <div className="text-xs text-white/50 mt-0.5">MP3, MP4, AVI, Flash, and more</div>
                </div>
              </label>
            )}
            <div className="space-y-3 mb-5">
              {[
                { id: false, label: isMint ? "Start from scratch" : "Normal installation", desc: "Web browser, utilities, office software, media players." },
                { id: true, label: "Full installation", desc: "Includes a full set of desktop tools and utilities." },
              ].map(opt => (
                <button key={String(opt.id)} onClick={() => { playClick(); setInstallExtended(opt.id); }}
                  className={`w-full text-left rounded-xl p-4 transition-all ${
                    installExtended === opt.id ? "ring-1 ring-white/20" : "border border-white/15 hover:border-white/30 bg-white/5"
                  }`}
                  style={installExtended === opt.id ? { background: `${a}20` } : {}}>
                  <div className="text-base font-medium text-white">{opt.label}</div>
                  <div className="text-xs text-white/50 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {["Download updates while installing", "Install third-party software for graphics and Wi-Fi"].map((label, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={i === 0 ? installThirdParty : installThirdParty}
                    onChange={() => { playClick(); setInstallThirdParty(!installThirdParty); }}
                    className="w-5 h-5" style={{ accentColor: a }} />
                  <span className="text-sm text-white/60">{label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      }
      case "timezone": {
        const zones = "zones" in step ? step.zones : [];
        return (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-5">Select your timezone. (Click on the map or choose from the list.)</p>
            <div className="relative mb-4 rounded-xl overflow-hidden" style={{ background: `${a}15`, height: 140 }}>
              <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30 pointer-events-none select-none">🌍</div>
              {zones.map(tz => {
                const pos = ({
                  "UTC (London)": "30% 43%", "EST (New York)": "32% 22%", "CST (Chicago)": "36% 18%",
                  "MST (Denver)": "38% 14%", "PST (Los Angeles)": "35% 8%",
                  "IST (Mumbai)": "40% 62%", "JST (Tokyo)": "35% 78%", "AEST (Sydney)": "60% 82%",
                })[tz] || "40% 40%";
                return (
                  <button key={tz} onClick={() => { playClick(); setValues(p => ({...p, timezone: tz})); }}
                    className={`absolute text-[9px] px-2 py-1 rounded font-medium transition-all z-10 ${
                      values["timezone"] === tz ? "text-white shadow-sm ring-1 ring-white/20" : "text-white/50 hover:text-white/80"
                    }`}
                    style={{ top: pos.split(" ")[0], left: pos.split(" ")[1], ...(values["timezone"] === tz ? { background: a } : {}) }}>
                    {tz.includes("(") ? tz.split("(")[1].replace(")", "") : tz}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {zones.map(tz => (
                <button key={tz} onClick={() => { playClick(); setValues(p => ({...p, timezone: tz})); }}
                  className={`rounded-lg px-4 py-2 text-sm transition-all ${values["timezone"] === tz ? "text-white font-semibold" : "text-white/50 hover:text-white hover:bg-white/10"}`}
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
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-5">Choose how you want to install the system.</p>
            <div className="space-y-2">
              {choices.filter(opt => path !== "vm" || opt.id === "erase").map(opt => (
                <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                  className={`w-full text-left border-2 rounded-xl p-4 transition-all ${
                    installType === opt.id ? "" : "border-white/15 hover:border-white/30 bg-white/5"
                  }`}
                  style={installType === opt.id ? { borderColor: a, background: `${a}15` } : {}}>
                  <div className="text-base font-medium text-white">{opt.label}</div>
                  <div className="text-sm mt-1 text-white/50">{opt.hint}</div>
                </button>
              ))}
            </div>
            {isMint && installType === "erase" && (
              <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: `${a}12`, border: `1px solid ${a}25` }}>
                <p className="text-white/70">⚠️ The disk will be erased and formatted. All data will be lost.</p>
              </div>
            )}
          </div>
        );
      }
      case "account": {
        const prompts = "prompts" in step ? step.prompts : [];
        return (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-5">Create a user account for daily use of {osName}.</p>
            <div className="max-w-md">
              {prompts.map((p, i) => (
                <Field key={i} label={p.label} value={values[ACCOUNT_KEY_MAP[p.label] || p.label] || ""}
                  onChange={v => setAccountValue(p.label, v)} placeholder={p.placeholder}
                  type={p.secret ? "password" : "text"} autoFocus={i === 0} accent={a} />
              ))}
            </div>
          </div>
        );
      }
      case "confirm":
        return (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-4">{"body" in step ? step.body : "Review your choices."}</p>
            <div className="border border-white/10 bg-white/5 rounded-xl p-5 space-y-3 max-w-md">
              {[
                ["Language", selectedLang || "English"],
                ["Keyboard", selectedKb || "English (US)"],
                ["Network", values["network"] === "skip" ? "Skipped" : values["network"] || "Wired"],
                ["Install", installExtended ? "Full" : "Normal"],
                ["Type", installType === "erase" ? "Erase disk" : installType === "alongside" ? "Dual boot" : "Manual"],
                ["Timezone", values["timezone"] || "UTC"],
                ["Name", values["name"] || "user"],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-4 text-sm"><span className="text-white/40" style={{ minWidth: 100 }}>{l}</span><span className="font-medium text-white">{v}</span></div>
              ))}
            </div>
          </div>
        );
      case "partition":
        return (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Partition disks</h2>
            <p className="text-sm text-white/50 mb-4">Configure disk partitions manually.</p>
            <div className="border border-white/10 divide-y divide-white/10 rounded-xl max-w-md">
              {["/dev/sda1  ext4  30 GB  /", "/dev/sda2  swap  8 GB", "/dev/sda3  ext4  162 GB  /home"].map((row, i) => (
                <div key={i} className="flex items-center px-4 py-3 text-sm font-mono text-white/60">{row}</div>
              ))}
            </div>
            <button className="mt-3 text-sm font-medium px-4 py-2 rounded-lg border border-dashed"
              style={{ color: a, borderColor: `${a}40` }}>+ Add partition</button>
          </div>
        );
      default: return null;
    }
  }

  // ─── SIMPLE STEPS (Fedora, Debian) ───
  function renderSimpleStep(step: typeof currentStep) {
    if (!step) return null;
    const a = accent;
    const isDebian = config.id === "debian";
    switch (step.kind) {
      case "language": {
        const opts = "options" in step ? step.options : LANGUAGES;
        return (
          <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-5">Select a language:</p>
            <div className="space-y-1">
              {opts.map(l => (
                <button key={l} onClick={() => { playClick(); setSelectedLang(l); }}
                  className={`block w-full text-left rounded-lg px-4 py-3 text-sm transition-all ${
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
          <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-5">Choose your keyboard layout:</p>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {layouts.map(k => (
                <button key={k} onClick={() => { playClick(); setSelectedKb(k); }}
                  className={`block w-full text-left rounded-lg px-4 py-3 text-sm transition-all ${
                    selectedKb === k ? "text-white font-semibold ring-1 ring-white/20" : "text-white/50 hover:text-white hover:bg-white/10"
                  }`}
                  style={selectedKb === k ? { background: a } : {}}>{k}</button>
              ))}
            </div>
            {isDebian && <p className="text-xs mt-4 italic text-white/30">Press Tab to move between items, Space to select.</p>}
          </div>
        );
      }
      case "disk": {
        const choices = "choices" in step ? step.choices : [];
        return (
          <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-5">Choose how to partition the disk:</p>
            <div className="space-y-2">
              {choices.filter(opt => path !== "vm" || opt.id === "erase" || opt.id === "auto" || opt.id === "guided").map(opt => (
                <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                  className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                    installType === opt.id ? "" : "border-white/15 hover:border-white/30"
                  }`}
                  style={installType === opt.id ? { borderColor: a, background: `${a}15` } : {}}>
                  <div className="text-base font-medium text-white">{opt.label}</div>
                  <div className="text-sm mt-1 text-white/50">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>
        );
      }
      case "account": {
        const prompts = "prompts" in step ? step.prompts : [];
        return (
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-5">Create a user account:</p>
            {prompts.map((p, i) => (
              <Field key={i} label={p.label} value={values[ACCOUNT_KEY_MAP[p.label] || p.label] || ""}
                onChange={v => setAccountValue(p.label, v)} placeholder={p.placeholder}
                type={p.secret ? "password" : "text"} autoFocus={i === 0} accent={a} />
            ))}
          </div>
        );
      }
      case "confirm":
        return (
          <div className="max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm text-white/50 mb-4">{"body" in step ? step.body : "Ready to install."}</p>
            <div className="border border-white/10 bg-white/5 rounded-xl p-5 space-y-3">
              {[
                ["Language", selectedLang || "English"],
                ["Keyboard", selectedKb || "English (US)"],
                ["Type", installType === "erase" ? "Erase disk" : installType === "auto" ? "Auto" : "Manual"],
                ["User", values["name"] || "user"],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-4 text-sm"><span className="text-white/40" style={{ minWidth: 100 }}>{l}</span><span className="font-medium text-white">{v}</span></div>
              ))}
            </div>
            {isDebian && (
              <p className="text-sm mt-4" style={{ color: "rgba(255,200,100,0.6)" }}>⚠️ Installing GRUB boot loader to disk.</p>
            )}
          </div>
        );
      default: return null;
    }
  }

  // ─── FULL-SCREEN PHASES ───
  // ─── BOOT SPLASH ───
  if (phase === "boot" && bootSplash) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden border border-white/10" style={{ background: config.branding.surface }}>
          <div className="flex flex-col items-center gap-5">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <OsIcon osId={config.id} accent={accent} size={64} />
            </motion.div>
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="h-3 w-3 rounded-full" style={{ background: accent }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
            <div className="text-sm text-white/40 font-mono">Starting installer…</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── WELCOME ───
  if (phase === "boot") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden border border-white/10 relative"
          style={{ background: `linear-gradient(135deg, ${config.branding.surface}, #000)` }}>
          <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 50% 30%, ${accent} 0%, transparent 60%)` }} />
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-5">
              <OsIcon osId={config.id} accent={accent} size={72} />
            </motion.div>
            <motion.h1 initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {isUbuntu ? "Try or Install Ubuntu" :
               config.id === "mint" ? "Linux Mint 22" :
               config.id === "zorin" ? "Zorin OS 17" :
               config.id === "fedora" ? "Fedora Workstation 41" :
               config.id === "debian" ? "Debian 12 GNU/Linux" : osName}
            </motion.h1>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="text-base text-white/60 mb-8 max-w-lg">
              {isUbuntu ? "You can try Ubuntu without making any changes to your computer, or start the installation right away." :
               "You can try it before installing, or install it on your computer."}
            </motion.p>
            <div className="flex items-center gap-4 mb-6">
              <motion.button onClick={handleNext} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="rounded-xl px-8 py-3 text-base font-bold text-white shadow-lg hover:brightness-110 transition-all"
                style={{ background: accent }}>Install {osName}</motion.button>
              <motion.button onClick={handleNext} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                className="rounded-xl border border-white/20 bg-white/10 px-8 py-3 text-base font-medium text-white/80 hover:bg-white/20 transition-all">
                Try {config.id === "mint" ? "Linux Mint" : config.id === "zorin" ? "Zorin OS" : osName}
              </motion.button>
            </div>
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
              className="flex items-center gap-2 text-xs text-white/40">
              <select onChange={e => { playClick(); setSelectedLang(e.target.value); }} value={selectedLang}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white/70 text-sm outline-none cursor-pointer">
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
    return (
      <div className="flex-1 flex flex-col">
        <SparkleBurst trigger={showSparkle} />
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-white/10"
          style={{ background: `linear-gradient(180deg, ${config.branding.surface}, #000)` }}>
          {/* Terminal-like install output */}
          <div className="flex-1 flex flex-col lg:flex-row items-stretch min-h-0">
            <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold" style={{ color: `${accent}cc` }}>
                <span className="text-sm">{isUbuntu ? "⬢" : config.id === "mint" ? "⬢" : "▶"}</span>
                <span>{osName} Installer</span>
                <span className="text-white/20 ml-auto text-[10px] font-mono">{Math.floor(progress)}%</span>
              </div>
              <div className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed bg-black/30 rounded-xl p-4 border border-white/5" style={{ scrollbarWidth: "thin" }}>
                {logLines.length === 0 ? (
                  <div className="text-white/30 animate-pulse">Preparing installation...</div>
                ) : (
                  logLines.map((line, i) => {
                    const isOk = line.includes("[OK]") || line.includes("done.") || line.includes("complete") || line.includes("generated");
                    const isWarn = line.includes("warning") || line.includes("info:");
                    const isFile = line.includes("Extracting") || line.includes("vmlinuz") || line.includes("initrd");
                    const isHeader = line.includes("Installing") || line.includes("Configuring") || line.includes("Starting") || line.includes("Setting") || line.includes("Running");
                    return (
                      <div key={i} className={`mb-0.5 ${
                        isOk ? "text-green-400" : isWarn ? "text-yellow-400" : isFile ? "text-blue-300" : isHeader ? "text-white/80 font-semibold" : "text-white/50"
                      }`}>
                        {line}
                      </div>
                    );
                  })
                )}
                <div ref={logEndRef} />
              </div>
            </div>
            <div className="lg:w-64 shrink-0 flex flex-col items-center justify-center p-6 lg:p-8 lg:border-l border-white/10 gap-3 bg-black/20">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="w-14 h-14 rounded-full border-[3px] border-t-transparent"
                style={{ borderColor: `${accent}30`, borderTopColor: accent }} />
              <p className="text-sm text-white/70 font-medium">Installing {osName}…</p>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: accent }}
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
              </div>
              <div className="flex items-center gap-2 text-xs text-white/30 font-mono">
                <span className={`inline-block w-2 h-2 rounded-full ${progress < 100 ? "bg-green-400 animate-pulse" : "bg-green-500"}`} />
                {Math.floor(progress)}%
              </div>
              {fileIdx < config.installFiles.length && (
                <div className="text-[9px] text-white/20 max-w-[180px] truncate text-center">{config.installFiles[fileIdx]}</div>
              )}
              {progress >= 100 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="text-xs text-green-400 font-semibold bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                  ✓ Installation complete
                </motion.div>
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
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${config.branding.surface}, #000)` }}>
          <div className="text-center space-y-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><OsIcon osId={config.id} accent={accent} size={72} /></motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white">Installation Complete</h2>
              <p className="text-sm text-white/50 mt-2">You may now restart your computer.</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-5 py-3 text-sm text-yellow-400/80 max-w-sm mx-auto">
              Please remove the installation media before restarting.
            </div>
            <button onClick={() => { playClick(); setPhase("done"); }}
              className="rounded-xl px-10 py-3 text-base font-bold text-white shadow-lg hover:brightness-110 transition-all"
              style={{ background: accent }}>Restart Now</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── DONE ───
  if (phase === "done") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10"
          style={{ background: `linear-gradient(135deg, ${config.branding.surface}, #000)` }}>
          <div className="text-center space-y-5">
            {restartPhase === "done" ? (
              <>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><OsIcon osId={config.id} accent={accent} size={72} /></motion.div>
                <h2 className="text-2xl font-bold text-white">Welcome to {osName}</h2>
                <p className="text-sm text-white/50 max-w-sm mx-auto">Your new system is ready. Please restart to begin.</p>
                <button onClick={() => { playSuccess(); onComplete(); }}
                  className="rounded-xl px-10 py-3 text-base font-bold text-white shadow-lg hover:brightness-110 transition-all"
                  style={{ background: accent }}>Restart Now</button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="w-10 h-10 rounded-full border-[3px] border-t-transparent"
                  style={{ borderColor: `${accent}40`, borderTopColor: accent }} />
                <div className="text-base text-white/40 font-mono">Restarting…</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================================================================
  // FULL-SCREEN INSTALLER WIZARDS — each OS has its own distinct layout
  // ==================================================================

  // ─── UBUNTU SUBIQUITY: Full dark aubergine with left sidebar ───
  if (isUbuntu) {
    const a = "#E95420";
    return (
      <div className="flex-1 flex flex-col" style={{ borderRadius: "1rem", overflow: "hidden" }}>
        <div className="flex-1 flex" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2c001e 50%, #0d0d1a 100%)" }}>
          {/* Sidebar */}
          <div className="w-56 shrink-0 flex flex-col p-6" style={{ background: "rgba(0,0,0,0.3)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-8">
              <OsIcon osId="ubuntu" accent={a} size={24} />
              <div>
                <div className="text-sm font-bold text-white">Ubuntu</div>
                <div className="text-[10px] font-semibold tracking-wider" style={{ color: a }}>24.04 LTS</div>
              </div>
            </div>
            <div className="flex-1 space-y-0.5">
              {allSteps.map((s, i) => {
                const isActive = i === stepIdx;
                const isDone = i < stepIdx;
                return (
                  <div key={s.kind}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive ? "bg-white/10" : isDone ? "opacity-60" : "opacity-40"
                    }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isDone ? "" : isActive ? "" : "bg-white/10"
                    }`}
                      style={isDone || isActive ? { background: a } : {}}>
                      {isDone ? (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <span className="text-white font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className={`font-medium ${isActive ? "text-white" : "text-white/60"}`}>{s.title}</span>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 text-[10px] text-white/20 text-center">
              Installing Ubuntu 24.04 LTS
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto px-10 py-8">
              <AnimatePresence mode="wait">
                <motion.div key={stepIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  {renderSubiquityStep(currentStep)}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between px-10 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={handleBack} disabled={stepIdx === 0}
                className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-30"
                style={{ color: stepIdx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}
                onMouseOver={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                onMouseOut={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>Back</button>
              <button onClick={handleNext} disabled={!canAdvance()}
                className="rounded-xl px-8 py-2.5 text-sm font-bold text-white disabled:opacity-40 shadow-lg hover:brightness-110 transition-all"
                style={{ background: a }}>
                {currentStep?.kind === "confirm" || (stepIdx >= allSteps.length - 1) ? "Install" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── ZORIN OS: Full blue with sidebar ───
  if (config.id === "zorin") {
    const a = config.branding.accent;
    return (
      <div className="flex-1 flex flex-col" style={{ borderRadius: "1rem", overflow: "hidden" }}>
        <div className="flex-1 flex" style={{ background: "linear-gradient(180deg, #0a1628 0%, #0f2440 100%)" }}>
          <div className="w-56 shrink-0 flex flex-col p-6" style={{ background: "rgba(0,0,0,0.25)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-8">
              <OsIcon osId="zorin" accent={a} size={24} />
              <div className="text-lg font-bold text-white">Zorin OS</div>
            </div>
            <div className="flex-1 space-y-1">
              {allSteps.map((s, i) => {
                const isActive = i === stepIdx;
                const isDone = i < stepIdx;
                return (
                  <div key={s.kind}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive ? "" : isDone ? "opacity-55" : "opacity-35"
                    }`}
                    style={isActive ? { background: `${a}15` } : {}}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isDone || isActive ? "" : "bg-white/10"
                    }`} style={isDone || isActive ? { background: a } : {}}>
                      {isDone ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <span className="text-white font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className={`font-medium ${isActive ? "text-white" : "text-white/60"}`}>{s.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto px-10 py-8">
              <AnimatePresence mode="wait">
                <motion.div key={stepIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  {renderUbiquityStep(currentStep)}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between px-10 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={handleBack} disabled={stepIdx === 0}
                className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-30"
                style={{ color: stepIdx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}
                onMouseOver={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                onMouseOut={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>Back</button>
              <button onClick={handleNext} disabled={!canAdvance()}
                className="rounded-xl px-8 py-2.5 text-sm font-bold text-white disabled:opacity-40 shadow-lg hover:brightness-110 transition-all"
                style={{ background: a }}>
                {currentStep?.kind === "confirm" || (stepIdx >= allSteps.length - 1) ? "Install Now" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MINT: Full green with emoji sidebar ───
  if (config.id === "mint") {
    const a = config.branding.accent;
    return (
      <div className="flex-1 flex flex-col" style={{ borderRadius: "1rem", overflow: "hidden" }}>
        <div className="flex-1 flex" style={{ background: "linear-gradient(180deg, #0a1a0a 0%, #0d2818 100%)" }}>
          <div className="w-56 shrink-0 flex flex-col p-6" style={{ background: "rgba(0,0,0,0.25)", borderRight: "1px solid rgba(136,201,153,0.08)" }}>
            <div className="flex items-center gap-3 mb-8">
              <OsIcon osId="mint" accent={a} size={24} />
              <div className="text-lg font-bold text-white">Linux Mint</div>
            </div>
            <div className="flex-1 space-y-1">
              {allSteps.map((s, i) => {
                const isActive = i === stepIdx;
                const isDone = i < stepIdx;
                return (
                  <div key={s.kind}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive ? "bg-white/8" : isDone ? "opacity-55" : "opacity-35"
                    }`}
                    style={isActive ? { background: `${a}15` } : {}}>
                    <span className="text-lg shrink-0">{STEP_ICONS_LIGHT[s.kind] || "•"}</span>
                    <span className={`font-medium ${isActive ? "text-white" : "text-white/60"}`}>{s.title}</span>
                    {isDone && <span className="ml-auto text-xs" style={{ color: a }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto px-10 py-8">
              <AnimatePresence mode="wait">
                <motion.div key={stepIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  {renderUbiquityStep(currentStep)}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between px-10 py-4" style={{ borderTop: "1px solid rgba(136,201,153,0.08)" }}>
              <button onClick={handleBack} disabled={stepIdx === 0}
                className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-30"
                style={{ color: stepIdx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}
                onMouseOver={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                onMouseOut={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>Back</button>
              <button onClick={handleNext} disabled={!canAdvance()}
                className="rounded-xl px-8 py-2.5 text-sm font-bold text-white disabled:opacity-40 shadow-lg hover:brightness-110 transition-all"
                style={{ background: a }}>
                {currentStep?.kind === "confirm" || (stepIdx >= allSteps.length - 1) ? "Install Now" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── FEDORA: Blue-gray full-width centered content ───
  if (config.id === "fedora") {
    const a = config.branding.accent;
    return (
      <div className="flex-1 flex flex-col" style={{ borderRadius: "1rem", overflow: "hidden" }}>
        <div className="flex-1 flex flex-col items-center" style={{ background: "linear-gradient(180deg, #0d1117 0%, #161b22 100%)" }}>
          <div className="w-full max-w-2xl flex-1 flex flex-col px-6 py-8">
            <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <OsIcon osId="fedora" accent={a} size={24} />
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: a }}>Fedora Workstation 41</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div key={stepIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  {renderSimpleStep(currentStep)}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={handleBack} disabled={stepIdx === 0}
                className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-30"
                style={{ color: stepIdx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}
                onMouseOver={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                onMouseOut={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>Back</button>
              <button onClick={handleNext} disabled={!canAdvance()}
                className="rounded-xl px-8 py-2.5 text-sm font-bold text-white disabled:opacity-40 shadow-lg hover:brightness-110 transition-all"
                style={{ background: a }}>
                {currentStep?.kind === "confirm" || (stepIdx >= allSteps.length - 1) ? "Begin Installation" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── DEBIAN: Dark red full-width centered content ───
  if (config.id === "debian") {
    const a = config.branding.accent;
    return (
      <div className="flex-1 flex flex-col" style={{ borderRadius: "1rem", overflow: "hidden" }}>
        <div className="flex-1 flex flex-col items-center" style={{ background: "linear-gradient(180deg, #0d0000 0%, #1a0000 100%)" }}>
          <div className="w-full max-w-2xl flex-1 flex flex-col px-6 py-8">
            <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: "1px solid rgba(168,0,48,0.15)" }}>
              <OsIcon osId="debian" accent={a} size={24} />
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: a }}>Debian 12 GNU/Linux</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div key={stepIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                  {renderSimpleStep(currentStep)}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid rgba(168,0,48,0.15)" }}>
              <button onClick={handleBack} disabled={stepIdx === 0}
                className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-30"
                style={{ color: stepIdx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)" }}
                onMouseOver={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                onMouseOut={e => { if (stepIdx > 0) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>Back</button>
              <button onClick={handleNext} disabled={!canAdvance()}
                className="rounded-xl px-8 py-2.5 text-sm font-bold text-white disabled:opacity-40 shadow-lg hover:brightness-110 transition-all"
                style={{ background: a }}>
                {currentStep?.kind === "confirm" || (stepIdx >= allSteps.length - 1) ? "Finish" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── FALLBACK for unknown OS ───
  return <div className="flex-1 flex items-center justify-center text-white/50">Installer not available</div>;
}
