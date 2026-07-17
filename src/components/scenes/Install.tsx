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
  | "review";

const STEP_ORDER: InstallerStep[] = [
  "try_or_install", "language", "keyboard", "network", "install_option",
  "third_party", "install_type", "create_user", "review",
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
};

const STEP_IMG: Record<InstallerStep, string> = {
  try_or_install: "/images/ubuntu/01-try-or-install.png",
  language: "/images/ubuntu/02-language.png",
  keyboard: "/images/ubuntu/03-keyboard.webp",
  network: "/images/ubuntu/04-network.webp",
  install_option: "/images/ubuntu/05-install-option.webp",
  third_party: "/images/ubuntu/06-third-party.webp",
  install_type: "/images/ubuntu/07-install-type.webp",
  create_user: "/images/ubuntu/08-create-user.webp",
  review: "/images/ubuntu/09-review.png",
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
];

function Sidebar({ current }: { current: InstallerStep }) {
  const idx = STEP_ORDER.indexOf(current);
  return (
    <div className="hidden md:flex w-48 lg:w-56 shrink-0 flex-col border-r border-white/10 bg-[#1a1a24] p-3 gap-0.5">
      {STEP_ORDER.map((s, i) => (
        <div key={s} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
          s === current ? "bg-[#E95420]/10 text-[#E95420] font-semibold"
          : i < idx ? "text-white/40" : "text-white/25"
        }`}>
          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            i < idx || s === current ? "bg-[#E95420] text-white" : "bg-white/10 text-white/30"
          }`}>{i < idx ? "✓" : i + 1}</div>
          <span className="truncate">{SIDEBAR_LABELS[s]}</span>
        </div>
      ))}
    </div>
  );
}

function StepNav({ onBack, onNext, nextLabel, nextDisabled, showBack }: {
  onBack: () => void; onNext: () => void; nextLabel: string; nextDisabled?: boolean; showBack?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-t border-white/10 bg-[#1a1a24] px-4 py-2.5 shrink-0">
      {showBack !== false ? (
        <button onClick={() => { playClick(); onBack(); }}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/10 transition-colors">
          ← Back
        </button>
      ) : <div />}
      <button disabled={nextDisabled} onClick={() => { playClick(); onNext(); }}
        className={`rounded-lg px-5 py-2 text-xs font-semibold transition-colors ${
          nextDisabled ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-[#E95420] text-white hover:bg-[#c7441a]"
        }`}>{nextLabel}</button>
    </div>
  );
}

export default function Install({ config, speed, onComplete }: {
  config: OSConfig; speed: "normal" | "fast"; onComplete: () => void;
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
    setProgress(0); setFileIdx(0); setElapsed(0);
    const start = performance.now();
    let raf = 0;
    const files = config.installFiles;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / installDuration) * 100);
      setProgress(pct);
      setElapsed(Math.floor((now - start) / 1000));
      setFileIdx(Math.min(files.length - 1, Math.floor((pct / 100) * files.length)));
      if (pct < 100) raf = requestAnimationFrame(tick);
      else { setShowSparkle(true); setTimeout(() => setShowSparkle(false), 1500); setStep("review" as never); setPhase("done"); }
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
    if (phase === "done" && restartPhase === "countdown") {
      const t = setTimeout(() => setRestartPhase("done"), speed === "fast" ? 2000 : 4000);
      return () => clearTimeout(t);
    }
  }, [phase, restartPhase, speed]);

  function canAdvance(): boolean {
    switch (step) {
      case "language": return !!values["language"];
      case "keyboard": return !!values["keyboard"];
      case "create_user": return !!(values["username"] || "").trim() && !!(values["password"] || "").trim();
      default: return true;
    }
  }

  function handleNext() {
    if (phase === "done") { playSuccess(); onComplete(); return; }
    if (!canAdvance()) return;
    playClick();
    if (step === "review") { setPhase("installing"); return; }
    const nextIdx = currentIdx + 1;
    if (nextIdx < STEP_ORDER.length) setStep(STEP_ORDER[nextIdx]);
  }

  function handleBack() {
    playClick();
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) setStep(STEP_ORDER[prevIdx]);
  }

  function setVal(field: string, val: string) { setValues((p) => ({ ...p, [field]: val })); }

  /* ═══════════════════════════════════════════════════════════════
     INSTALLING — Full screenshot background + progress overlay
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "installing") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <SparkleBurst trigger={showSparkle} />
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
          <img src="/images/ubuntu/10-progress.png" alt="Installing Ubuntu" className="w-full h-auto" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-20 pb-6 px-6 space-y-4">
            <div className="max-w-lg mx-auto space-y-3">
              <div className="text-center">
                <h3 className="text-base font-bold text-white">Installing Ubuntu 24.04 LTS…</h3>
                <p className="text-[11px] text-white/50 mt-0.5">{config.installTips[tipIdx]}</p>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
                <motion.div className="h-full rounded-full bg-[#E95420]" animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
              </div>
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>{Math.floor(progress)}%</span>
                <span>{SLIDES[slideIdx].title}</span>
                <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
              </div>
              <div className="h-16 overflow-hidden rounded border border-white/10 bg-black/50 p-2 font-mono text-[9px] text-white/50">
                {config.installFiles.slice(0, fileIdx + 1).map((file, i) => (
                  <div key={i} className={`truncate leading-relaxed ${i === fileIdx ? "text-[#E95420]" : "opacity-40"}`}>
                    {i === fileIdx && "▸ "}{file}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     RESTART — Full screenshot background
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
          <img src="/images/ubuntu/11-restart.png" alt="Restart" className="w-full h-auto" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center space-y-4 bg-black/60 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <SparkleBurst trigger={showSparkle} />
              <div className="text-3xl">🎉</div>
              <h2 className="text-lg font-bold text-white">Installation complete!</h2>
              <p className="text-xs text-white/50 max-w-xs mx-auto">Remove the installation media and restart your computer.</p>
              {restartPhase === "done" ? (
                <button onClick={() => { playSuccess(); onComplete(); }}
                  className="rounded-lg bg-[#E95420] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#c7441a] transition-colors shadow-lg shadow-[#E95420]/20">
                  Restart Now →
                </button>
              ) : (
                <div className="text-xs text-white/40 font-mono">Restarting…</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     WIZARD STEPS — Full screenshot background + overlay controls
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 flex overflow-hidden rounded-t-2xl border border-white/10 border-b-0">
        <Sidebar current={step} />
        <div className="flex-1 relative overflow-hidden bg-black">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="absolute inset-0">

              {/* Full background screenshot */}
              <img src={STEP_IMG[step]} alt={SIDEBAR_LABELS[step]}
                className="absolute inset-0 w-full h-full object-contain bg-[#1a1a24]" />

              {/* Interactive overlay — transparent, positioned at the bottom */}
              <div className="absolute inset-x-0 bottom-0">
                <div className="bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/60 to-transparent pt-16 pb-4 px-6">
                  <div className="max-w-md mx-auto space-y-3">

                    {/* ── Language selector ── */}
                    {step === "language" && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-[#E95420] font-semibold uppercase tracking-wider">Select your language</div>
                        <div className="flex flex-wrap gap-1.5">
                          {LANGUAGES.map((lang) => (
                            <button key={lang} onClick={() => { playClick(); setVal("language", lang); }}
                              className={`rounded-md px-3 py-1.5 text-[11px] transition-all ${
                                values["language"] === lang
                                  ? "bg-[#E95420] text-white font-semibold shadow-lg shadow-[#E95420]/30"
                                  : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                              }`}>{lang}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Keyboard selector ── */}
                    {step === "keyboard" && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-[#E95420] font-semibold uppercase tracking-wider">Keyboard layout</div>
                        <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto">
                          {KEYBOARD_LAYOUTS.map((layout) => (
                            <button key={layout} onClick={() => { playClick(); setVal("keyboard", layout); }}
                              className={`rounded-md px-3 py-1.5 text-[11px] text-left transition-all ${
                                values["keyboard"] === layout
                                  ? "bg-[#E95420] text-white font-semibold"
                                  : "bg-white/10 text-white/70 hover:bg-white/15"
                              }`}>{layout}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Network selector ── */}
                    {step === "network" && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-[#E95420] font-semibold uppercase tracking-wider">Connect to network</div>
                        <div className="space-y-1">
                          {[{ id: "wifi-home", label: "HomeWiFi", icon: "📶" },
                            { id: "wifi-5g", label: "Neighbor_5G", icon: "📶" },
                            { id: "ethernet", label: "Wired Ethernet", icon: "🔌" },
                          ].map((n) => (
                            <button key={n.id} onClick={() => { playClick(); setVal("network", n.id); }}
                              className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-[11px] transition-all ${
                                values["network"] === n.id
                                  ? "bg-[#E95420] text-white"
                                  : "bg-white/10 text-white/70 hover:bg-white/15"
                              }`}>
                              <span>{n.icon}</span><span className="font-medium">{n.label}</span>
                            </button>
                          ))}
                          <button onClick={() => { playClick(); setVal("network", "skip"); }}
                            className={`w-full rounded-md px-3 py-2 text-[11px] transition-all ${
                              values["network"] === "skip" ? "bg-[#E95420] text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                            }`}>I don't want to connect now</button>
                        </div>
                      </div>
                    )}

                    {/* ── Install option ── */}
                    {step === "install_option" && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-[#E95420] font-semibold uppercase tracking-wider">What would you like to do?</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "interactive", label: "Interactive installation", icon: "📋" },
                            { id: "automated", label: "Automated installation", icon: "🤖" },
                          ].map((opt) => (
                            <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                              className={`rounded-lg border p-3 text-left transition-all ${
                                installType === opt.id
                                  ? "border-[#E95420] bg-[#E95420]/10 text-white"
                                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                              }`}>
                              <span className="text-lg">{opt.icon}</span>
                              <div className="text-[11px] font-semibold mt-1">{opt.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Third party ── */}
                    {step === "third_party" && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-[#E95420] font-semibold uppercase tracking-wider">Additional software</div>
                        <label className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 cursor-pointer hover:bg-white/15 transition-all">
                          <input type="checkbox" checked={thirdParty} onChange={() => setThirdParty(!thirdParty)} className="accent-[#E95420]" />
                          <span className="text-[11px] text-white/80">Install third-party software for graphics and Wi-Fi</span>
                        </label>
                        <label className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 cursor-pointer hover:bg-white/15 transition-all">
                          <input type="checkbox" defaultChecked className="accent-[#E95420]" />
                          <span className="text-[11px] text-white/80">Download additional media formats</span>
                        </label>
                      </div>
                    )}

                    {/* ── Install type ── */}
                    {step === "install_type" && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-[#E95420] font-semibold uppercase tracking-wider">Type of installation</div>
                        {[
                          { id: "erase", label: "Erase disk and install Ubuntu" },
                          { id: "alongside", label: "Install alongside existing OS" },
                          { id: "manual", label: "Something else (manual)" },
                        ].map((opt) => (
                          <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                            className={`w-full rounded-md px-3 py-2 text-[11px] text-left font-medium transition-all ${
                              installType === opt.id
                                ? "bg-[#E95420] text-white shadow-lg shadow-[#E95420]/20"
                                : "bg-white/10 text-white/70 hover:bg-white/15"
                            }`}>{opt.label}</button>
                        ))}
                      </div>
                    )}

                    {/* ── Create user ── */}
                    {step === "create_user" && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-[#E95420] font-semibold uppercase tracking-wider">Who are you?</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: "name", placeholder: "Your name" },
                            { key: "computer_name", placeholder: "Computer name" },
                            { key: "username", placeholder: "Username" },
                            { key: "password", placeholder: "Password", secret: true },
                          ].map((f) => (
                            <input key={f.key} type={f.secret ? "password" : "text"}
                              value={values[f.key] ?? ""} placeholder={f.placeholder}
                              onChange={(e) => { setVal(f.key, e.target.value); playKeyClick(); }}
                              className="rounded-md bg-white/10 border border-white/10 px-3 py-2 text-[11px] text-white/90 outline-none focus:border-[#E95420] placeholder:text-white/25 transition-colors" />
                          ))}
                        </div>
                        <label className="flex items-center gap-1.5 text-[10px] text-white/40 cursor-pointer">
                          <input type="checkbox" defaultChecked className="accent-[#E95420] w-3 h-3" />Log in automatically
                        </label>
                      </div>
                    )}

                    {/* ── Try or Install (no controls, just show the image) ── */}
                    {step === "try_or_install" && (
                      <div className="text-center text-[11px] text-white/30">The real Ubuntu boot menu — press Enter to continue</div>
                    )}

                    {/* ── Review ── */}
                    {step === "review" && (
                      <div className="space-y-2">
                        <div className="text-[10px] text-[#E95420] font-semibold uppercase tracking-wider">Ready to install</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-white/5 rounded-lg p-3 border border-white/10">
                          {[
                            ["Language", values["language"] ?? "English"],
                            ["Keyboard", values["keyboard"] ?? "English (US)"],
                            ["Network", values["network"] === "skip" ? "Skipped" : values["network"] ?? "HomeWiFi"],
                            ["Install type", installType === "erase" ? "Erase disk" : installType === "alongside" ? "Dual boot" : "Manual"],
                            ["Third-party", thirdParty ? "Yes" : "No"],
                            ["Username", values["username"] ?? "user"],
                          ].map(([l, v]) => (
                            <div key={l} className="flex justify-between text-[10px]">
                              <span className="text-white/40">{l}</span>
                              <span className="text-white/70 font-medium">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <StepNav onBack={handleBack} onNext={handleNext}
        nextLabel={step === "review" ? "Install now →" : "Next →"}
        nextDisabled={!canAdvance()} showBack={currentIdx > 0} />
    </div>
  );
}
