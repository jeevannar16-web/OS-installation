import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick, playSuccess } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type WizardPhase = "wizard" | "installing" | "done";

type InstallerStep =
  | "try_or_install"
  | "language"
  | "keyboard"
  | "network"
  | "install_option"
  | "third_party"
  | "install_type"
  | "create_user"
  | "review"
  | "installing"
  | "restart"
  | "welcome_desktop"
  | "ubuntu_pro"
  | "finish";

const STEP_ORDER: InstallerStep[] = [
  "try_or_install",
  "language",
  "keyboard",
  "network",
  "install_option",
  "third_party",
  "install_type",
  "create_user",
  "review",
];

const SIDEBAR_LABELS: Record<InstallerStep, string> = {
  try_or_install: "Try or Install",
  language: "Language",
  keyboard: "Keyboard",
  network: "Network",
  install_option: "Install Option",
  third_party: "Third-Party",
  install_type: "Install Type",
  create_user: "Create User",
  review: "Review",
  installing: "Installing",
  restart: "Restart",
  welcome_desktop: "Welcome",
  ubuntu_pro: "Ubuntu Pro",
  finish: "Finish",
};

const LANGUAGES = [
  "English", "Español", "Français", "Deutsch", "Português (Brasil)",
  "Italiano", "中文 (简体)", "日本語", "한국어", "Русский",
];

const KEYBOARD_LAYOUTS = [
  "English (US)", "English (UK)", "English (India)", "Español (Latinoamérica)",
  "Français", "Deutsch", "Italiano", "Português (Brasil)", "Dvorak", "Colemak",
];

const SLIDES = [
  { title: "Fast and secure", body: "Ubuntu boots in seconds and keeps your data safe with built-in firewall and disk encryption." },
  { title: "Productive out of the box", body: "Office suite, email client, web browser, and media player — all pre-installed." },
  { title: "Software Centre", body: "Thousands of free applications available at your fingertips." },
  { title: "Customise your desktop", body: "Themes, fonts, dock position, widgets — make it yours." },
  { title: "Built-in security", body: "Automatic updates, firewall, and full-disk encryption keep you safe." },
  { title: "Community support", body: "Millions of users and developers ready to help on askubuntu.com." },
];

function Sidebar({ current }: { current: InstallerStep }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <div className="hidden md:flex w-52 lg:w-60 flex-col border-r border-white/10 bg-white/[0.03] p-4 gap-1">
      {STEP_ORDER.map((s, i) => (
        <div
          key={s}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            s === current ? "bg-[#E95420]/10 text-[#E95420] font-semibold"
            : i < idx ? "text-white/50"
            : "text-white/30"
          }`}
        >
          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              i < idx || s === current ? "bg-[#E95420] text-white" : "bg-white/10 text-white/30"
            }`}
          >
            {i < idx ? "✓" : i + 1}
          </div>
          <span className="truncate">{SIDEBAR_LABELS[s]}</span>
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
        <button onClick={() => { playClick(); onBack(); }}
          className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">
          ← Back
        </button>
      ) : <div />}
      <button disabled={nextDisabled} onClick={() => { playClick(); onNext(); }}
        className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors ${
          nextDisabled ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-[#E95420] text-white hover:bg-[#c7441a]"
        }`}>
        {nextLabel}
      </button>
    </div>
  );
}

function ScreenshotStep({ src, alt, children }: { src: string; alt: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black">
        <img src={src} alt={alt} className="w-full h-auto" loading="eager" />
        {children && (
          <div className="absolute inset-0 flex items-end justify-center p-4 bg-gradient-to-t from-black/60 to-transparent">
            <div className="w-full">{children}</div>
          </div>
        )}
      </div>
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
  const [step, setStep] = useState<InstallerStep>("try_or_install");
  const [values, setValues] = useState<Record<string, string>>({});
  const [installType, setInstallType] = useState<string>("erase");
  const [thirdParty, setThirdParty] = useState(true);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);
  const [fileIdx, setFileIdx] = useState(0);
  const [restartPhase, setRestartPhase] = useState<"countdown" | "done">("countdown");

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
        setStep("restart");
        setRestartPhase("countdown");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, installDuration, config.installFiles]);

  useEffect(() => {
    if (phase !== "installing") return;
    const iv = setInterval(() => {
      setSlideIdx((p) => (p + 1) % SLIDES.length);
      setTipIdx((p) => (p + 1) % config.installTips.length);
    }, speed === "fast" ? 600 : 3000);
    return () => clearInterval(iv);
  }, [phase, config.installTips.length, speed]);

  useEffect(() => {
    if (step === "restart" && restartPhase === "countdown") {
      const dur = speed === "fast" ? 2000 : 5000;
      const t = setTimeout(() => setRestartPhase("done"), dur);
      return () => clearTimeout(t);
    }
  }, [step, restartPhase, speed]);

  function canAdvance(): boolean {
    switch (step) {
      case "try_or_install": return true;
      case "language": return !!values["language"];
      case "keyboard": return !!values["keyboard"];
      case "network": return true;
      case "install_option": return true;
      case "third_party": return true;
      case "install_type": return !!installType;
      case "create_user": return !!(values["username"] || "").trim() && !!(values["password"] || "").trim();
      case "review": return true;
      default: return true;
    }
  }

  function handleNext() {
    if (!canAdvance()) return;
    playClick();

    if (step === "review") {
      setPhase("installing");
      setStep("installing");
      return;
    }
    if (step === "restart") {
      setStep("welcome_desktop");
      return;
    }
    if (step === "welcome_desktop") {
      setStep("ubuntu_pro");
      return;
    }
    if (step === "ubuntu_pro") {
      setStep("finish");
      return;
    }
    if (step === "finish") {
      playSuccess();
      onComplete();
      return;
    }

    const nextIdx = currentIdx + 1;
    if (nextIdx < STEP_ORDER.length) setStep(STEP_ORDER[nextIdx]);
  }

  function handleBack() {
    playClick();
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) setStep(STEP_ORDER[prevIdx]);
  }

  function setVal(field: string, val: string) {
    setValues((p) => ({ ...p, [field]: val }));
  }

  /* ── Installing / Progress phase ── */
  if (phase === "installing") {
    return (
      <div className="mx-auto w-full max-w-3xl lg:max-w-4xl">
        <SparkleBurst trigger={showSparkle} />
        <div className="rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl overflow-hidden">
          <div className="bg-[#E95420] px-6 py-4 text-white font-semibold text-lg">
            Installing Ubuntu 24.04 LTS…
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img src="/images/ubuntu/10-progress.png" alt="Installing Ubuntu" className="w-full h-auto" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full rounded-full bg-[#E95420]" animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
              </div>
              <div className="flex justify-between text-xs text-white/40">
                <span>{Math.floor(progress)}%</span>
                <span>{config.installTips[tipIdx]}</span>
                <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={slideIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-xl bg-[#E95420]/5 border border-[#E95420]/10 p-4">
                <h3 className="font-semibold text-white/80 text-sm">{SLIDES[slideIdx].title}</h3>
                <p className="text-xs text-white/40 mt-1">{SLIDES[slideIdx].body}</p>
              </motion.div>
            </AnimatePresence>
            <div className="h-20 overflow-hidden rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-xs text-white/50">
              {config.installFiles.slice(0, fileIdx + 1).map((file, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: i === fileIdx ? 1 : 0.4 }} className="leading-relaxed truncate">
                  {i === fileIdx && <span className="text-[#E95420] mr-1">▸</span>}
                  {file}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Restart phase ── */
  if (step === "restart") {
    return (
      <div className="mx-auto w-full max-w-3xl lg:max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl overflow-hidden">
          <ScreenshotStep src="/images/ubuntu/11-restart.png" alt="Restart system" />
          <div className="p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-white/90">Installation complete!</h2>
            <p className="text-sm text-white/50">Remove the installation media and press Enter to restart.</p>
            {restartPhase === "done" ? (
              <button onClick={() => { playClick(); setStep("welcome_desktop"); }}
                className="rounded-lg bg-[#E95420] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#c7441a] transition-colors">
                Restart Now →
              </button>
            ) : (
              <div className="text-sm text-white/40 font-mono">Restarting in a moment…</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Welcome Desktop (post-install) ── */
  if (step === "welcome_desktop") {
    return (
      <div className="mx-auto w-full max-w-3xl lg:max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl overflow-hidden">
          <ScreenshotStep src="/images/ubuntu/12-welcome-desktop.png" alt="Welcome to Ubuntu" />
          <div className="p-6 text-center">
            <p className="text-sm text-white/50 mb-4">Welcome to Ubuntu 24.04 LTS — your system is ready to use.</p>
            <button onClick={() => { playClick(); setStep("ubuntu_pro"); }}
              className="rounded-lg bg-[#E95420] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#c7441a] transition-colors">
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Ubuntu Pro ── */
  if (step === "ubuntu_pro") {
    return (
      <div className="mx-auto w-full max-w-3xl lg:max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl overflow-hidden">
          <ScreenshotStep src="/images/ubuntu/13-ubuntu-pro.png" alt="Ubuntu Pro" />
          <div className="p-6 flex items-center justify-between">
            <button onClick={() => { playClick(); setStep("welcome_desktop"); }}
              className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 transition-colors">
              ← Back
            </button>
            <button onClick={() => { playClick(); setStep("finish"); }}
              className="rounded-lg bg-[#E95420] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#c7441a] transition-colors">
              Skip for now →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Finish ── */
  if (step === "finish") {
    return (
      <div className="mx-auto w-full max-w-3xl lg:max-w-4xl">
        <div className="rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl overflow-hidden">
          <ScreenshotStep src="/images/ubuntu/14-finish.webp" alt="Finish" />
          <div className="p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-white/90">You're all set!</h2>
            <p className="text-sm text-white/50">Ubuntu 24.04 LTS is installed and ready. Click below to start using your new system.</p>
            <button onClick={() => { playClick(); playSuccess(); onComplete(); }}
              className="rounded-lg bg-[#E95420] px-8 py-3 text-sm font-bold text-white hover:bg-[#c7441a] transition-colors shadow-lg shadow-[#E95420]/20">
              ✓ Start Using Ubuntu →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Wizard steps ── */
  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl">
      <div className="rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px] lg:min-h-[600px]">
        <Sidebar current={step} />
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }} className="flex-1 p-6 lg:p-8 overflow-y-auto">

              {/* ── Step: Try or Install ── */}
              {step === "try_or_install" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white/90">Try or Install Ubuntu</h2>
                  <p className="text-sm text-white/50">Boot from the USB to start the installer.</p>
                  <ScreenshotStep src="/images/ubuntu/01-try-or-install.png" alt="Choose Try or Install Ubuntu" />
                </div>
              )}

              {/* ── Step: Language ── */}
              {step === "language" && (
                <div className="space-y-4">
                  <div className="flex gap-4 flex-col lg:flex-row">
                    <div className="flex-1 space-y-3">
                      <h2 className="text-xl font-bold text-white/90">Select your language</h2>
                      <div className="max-h-[320px] overflow-y-auto space-y-1">
                        {LANGUAGES.map((lang) => (
                          <button key={lang} onClick={() => { playClick(); setVal("language", lang); }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              values["language"] === lang
                                ? "bg-[#E95420]/10 text-[#E95420] ring-1 ring-[#E95420]/40 font-medium"
                                : "text-white/60 hover:bg-white/5"
                            }`}>
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img src="/images/ubuntu/02-language.png" alt="Language selection" className="w-full h-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step: Keyboard ── */}
              {step === "keyboard" && (
                <div className="space-y-4">
                  <div className="flex gap-4 flex-col lg:flex-row">
                    <div className="flex-1 space-y-3">
                      <h2 className="text-xl font-bold text-white/90">Keyboard layout</h2>
                      <div className="max-h-[320px] overflow-y-auto space-y-1">
                        {KEYBOARD_LAYOUTS.map((layout) => (
                          <button key={layout} onClick={() => { playClick(); setVal("keyboard", layout); }}
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              values["keyboard"] === layout
                                ? "bg-[#E95420]/10 text-[#E95420] ring-1 ring-[#E95420]/40 font-medium"
                                : "text-white/60 hover:bg-white/5"
                            }`}>
                            {layout}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img src="/images/ubuntu/03-keyboard.webp" alt="Keyboard layout" className="w-full h-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step: Network ── */}
              {step === "network" && (
                <div className="space-y-4">
                  <div className="flex gap-4 flex-col lg:flex-row">
                    <div className="flex-1 space-y-3">
                      <h2 className="text-xl font-bold text-white/90">Connect to a network</h2>
                      <p className="text-xs text-white/40">Get online to download updates during installation.</p>
                      <div className="space-y-1">
                        {[
                          { id: "wifi-home", label: "HomeWiFi", icon: "📶" },
                          { id: "wifi-neighbors", label: "Neighbor_5G", icon: "📶" },
                          { id: "ethernet", label: "Wired Ethernet", icon: "🔌" },
                        ].map((iface) => (
                          <button key={iface.id} onClick={() => { playClick(); setVal("network", iface.id); }}
                            className={`w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                              values["network"] === iface.id
                                ? "bg-[#E95420]/10 text-[#E95420] ring-1 ring-[#E95420]/40"
                                : "text-white/60 hover:bg-white/5"
                            }`}>
                            <span>{iface.icon}</span>
                            <span className="flex-1 font-medium">{iface.label}</span>
                          </button>
                        ))}
                        <button onClick={() => { playClick(); setVal("network", "skip"); }}
                          className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                            values["network"] === "skip" ? "bg-[#E95420]/10 text-[#E95420]" : "text-white/40 hover:bg-white/5"
                          }`}>
                          I don't want to connect now
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img src="/images/ubuntu/04-network.webp" alt="Network connection" className="w-full h-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step: Install Option ── */}
              {step === "install_option" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white/90">What would you like to do?</h2>
                  <div className="flex gap-4 flex-col lg:flex-row">
                    <div className="flex-1 space-y-3">
                      {[
                        { id: "interactive", label: "Interactive installation", desc: "Go through the setup wizard with all options.", icon: "📋" },
                        { id: "automated", label: "Automated installation", desc: "Use a preseed file for unattended installation.", icon: "🤖" },
                      ].map((opt) => (
                        <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                          className={`w-full rounded-xl border px-5 py-4 text-left transition-colors ${
                            installType === opt.id
                              ? "border-[#E95420] bg-[#E95420]/5 ring-1 ring-[#E95420]/30"
                              : "border-white/10 hover:bg-white/5"
                          }`}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{opt.icon}</span>
                            <div>
                              <div className="text-sm font-semibold text-white/80">{opt.label}</div>
                              <div className="text-xs text-white/40 mt-0.5">{opt.desc}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img src="/images/ubuntu/05-install-option.webp" alt="Install option" className="w-full h-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step: Third Party ── */}
              {step === "third_party" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white/90">Optimise your computer</h2>
                  <div className="flex gap-4 flex-col lg:flex-row">
                    <div className="flex-1 space-y-3">
                      {[
                        { key: "thirdParty", label: "Install third-party software for graphics and Wi-Fi hardware", desc: "Proprietary drivers for NVIDIA, Broadcom, etc." },
                        { key: "codecs", label: "Download and install support for additional media formats", desc: "MP3, MP4, and other restricted formats" },
                      ].map((opt) => (
                        <button key={opt.key} onClick={() => { playClick(); if (opt.key === "thirdParty") setThirdParty(!thirdParty); }}
                          className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                            (opt.key === "thirdParty" ? thirdParty : true)
                              ? "border-[#E95420]/40 bg-[#E95420]/5"
                              : "border-white/10 hover:bg-white/5"
                          }`}>
                          <div className="flex-1 pr-4">
                            <div className="text-sm font-medium text-white/80">{opt.label}</div>
                            <div className="text-xs text-white/40 mt-0.5">{opt.desc}</div>
                          </div>
                          <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                            (opt.key === "thirdParty" ? thirdParty : true) ? "border-[#E95420] bg-[#E95420]" : "border-white/20"
                          }`}>
                            {(opt.key === "thirdParty" ? thirdParty : true) && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img src="/images/ubuntu/06-third-party.webp" alt="Third-party software" className="w-full h-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step: Install Type ── */}
              {step === "install_type" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white/90">Type of installation</h2>
                  <div className="flex gap-4 flex-col lg:flex-row">
                    <div className="flex-1 space-y-3">
                      {[
                        { id: "erase", label: "Erase disk and install Ubuntu", desc: "Deletes all data and installs a fresh copy." },
                        { id: "alongside", label: "Install Ubuntu alongside them", desc: "Dual-boot with existing operating systems." },
                        { id: "manual", label: "Manual installation (advanced)", desc: "Create or modify partitions manually." },
                      ].map((opt) => (
                        <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                          className={`w-full rounded-xl border px-5 py-4 text-left transition-colors ${
                            installType === opt.id
                              ? "border-[#E95420] bg-[#E95420]/5 ring-1 ring-[#E95420]/30"
                              : "border-white/10 hover:bg-white/5"
                          }`}>
                          <div className="text-sm font-semibold text-white/80">{opt.label}</div>
                          <div className="text-xs text-white/40 mt-1">{opt.desc}</div>
                        </button>
                      ))}
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-xs font-medium text-white/50">Detected disk</div>
                        <div className="text-xs text-white/40">/dev/sda — 500 GB WDC WD5000</div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img src="/images/ubuntu/07-install-type.webp" alt="Installation type" className="w-full h-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step: Create User ── */}
              {step === "create_user" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white/90">Who are you?</h2>
                  <div className="flex gap-4 flex-col lg:flex-row">
                    <div className="flex-1 space-y-3">
                      {[
                        { key: "name", label: "Your name", placeholder: "Jeevan", type: "text" },
                        { key: "computer_name", label: "Your computer's name", placeholder: "jeevan-ubuntu", type: "text" },
                        { key: "username", label: "Pick a username", placeholder: "jeevan", type: "text" },
                        { key: "password", label: "Choose a password", placeholder: "••••••••", type: "password" },
                        { key: "confirm", label: "Confirm your password", placeholder: "••••••••", type: "password" },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs font-medium text-white/50 mb-1">{field.label}</label>
                          <input type={field.type} value={values[field.key] ?? ""} placeholder={field.placeholder}
                            onChange={(e) => { setVal(field.key, e.target.value); playKeyClick(); }}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/90 outline-none focus:border-[#E95420] focus:ring-1 focus:ring-[#E95420]/30 transition-colors placeholder:text-white/20" />
                        </div>
                      ))}
                      <label className="flex items-center gap-2 text-xs text-white/40 cursor-pointer">
                        <input type="checkbox" defaultChecked className="accent-[#E95420] w-3 h-3" />
                        Log in automatically
                      </label>
                    </div>
                    <div className="flex-1">
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img src="/images/ubuntu/08-create-user.webp" alt="Create user" className="w-full h-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step: Review ── */}
              {step === "review" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white/90">Review your choices</h2>
                  <div className="flex gap-4 flex-col lg:flex-row">
                    <div className="flex-1">
                      <div className="rounded-xl border border-white/10 divide-y divide-white/5">
                        {[
                          ["Language", values["language"] ?? "English"],
                          ["Keyboard", values["keyboard"] ?? "English (US)"],
                          ["Network", values["network"] === "skip" ? "Skipped" : values["network"] ?? "HomeWiFi"],
                          ["Installation type", installType === "erase" ? "Erase disk" : installType === "alongside" ? "Dual boot" : "Interactive"],
                          ["Third-party software", thirdParty ? "Yes" : "No"],
                          ["Username", values["username"] ?? "user"],
                          ["Computer name", values["computer_name"] ?? "ubuntu"],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                            <span className="text-white/50">{label}</span>
                            <span className="font-medium text-white/80">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img src="/images/ubuntu/09-review.png" alt="Review changes" className="w-full h-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <StepNav
            onBack={handleBack}
            onNext={handleNext}
            nextLabel={step === "review" ? "Install now →" : "Next →"}
            nextDisabled={!canAdvance()}
            showBack={currentIdx > 0}
          />
        </div>
      </div>
    </div>
  );
}
