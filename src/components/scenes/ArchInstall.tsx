import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type WizardPhase = "boot" | "live" | "wizard" | "installing" | "done";

type WizardStep = {
  title: string;
  description: string;
  image: string;
  action: string;
  commands: string[];
};

const WIZARD_STEPS: WizardStep[] = [
  {
    title: "Run archinstall",
    description: "Launch the guided installer from the live terminal",
    image: "/images/arch/01-welcome-page.png",
    action: "Type archinstall and press Enter",
    commands: ["archinstall"],
  },
  {
    title: "Archinstall — Main Menu",
    description: "The guided installer TUI presents all configuration options. Work through them top to bottom.",
    image: "/images/arch/09-archinstall-menu.png",
    action: "Select Locales → Enter",
    commands: ["locales", "select locales", "enter"],
  },
  {
    title: "Locales — Language & Keyboard",
    description: "Set your keyboard layout and locale. Defaults (English, us, UTF-8) are fine.",
    image: "/images/arch/03-wizard.png",
    action: "Keep defaults → Back to main menu",
    commands: ["back", "done", "confirm"],
  },
  {
    title: "Mirrors — Package Sources",
    description: "Select a mirror region close to you for fast package downloads.",
    image: "/images/arch/04-mirror-region.png",
    action: "Select your region → Back",
    commands: ["back", "done", "select", "confirm"],
  },
  {
    title: "Disk Configuration",
    description: "Choose how to partition the disk. 'Best effort' is easiest.",
    image: "/images/arch/06-best-effort.png",
    action: "Select 'Best effort' → Choose drive → ext4",
    commands: ["best effort", "select disk", "confirm"],
  },
  {
    title: "Filesystem & Swap",
    description: "Pick ext4 (most common) or btrfs. Enable swap for better memory management.",
    image: "/images/arch/07-filesystem.png",
    action: "Select ext4 → Enable swap → Back",
    commands: ["ext4", "btrfs", "swap", "confirm", "back"],
  },
  {
    title: "Disk Partitioning",
    description: "Review the partition layout. Confirm to continue.",
    image: "/images/arch/08-disk-partitioning.png",
    action: "Review partitions → Confirm",
    commands: ["confirm", "continue", "yes", "done"],
  },
  {
    title: "Bootloader",
    description: "GRUB is recommended for most setups, especially dual-boot.",
    image: "/images/arch/10-select-kernels.png",
    action: "Select GRUB → Back to main menu",
    commands: ["grub", "select grub", "back", "confirm"],
  },
  {
    title: "Hostname",
    description: "Set the network name for your machine.",
    image: "/images/arch/11-hostname.png",
    action: "Type archlinux → Enter",
    commands: ["archlinux", "enter", "confirm"],
  },
  {
    title: "Root Password",
    description: "Set the root (superuser) password.",
    image: "/images/arch/11-user-password.png",
    action: "Enter password → Confirm",
    commands: ["password", "confirm", "enter"],
  },
  {
    title: "User Account",
    description: "Create a regular user account with sudo privileges.",
    image: "/images/arch/12-user-accounts.png",
    action: "Add user → Set username & password → Confirm",
    commands: ["add user", "create user", "done"],
  },
  {
    title: "Profile — Desktop Environment",
    description: "Choose a desktop environment. KDE Plasma, GNOME, or XFCE.",
    image: "/images/arch/12-desktop-profile.png",
    action: "Select Profile → Type: Desktop → Pick one",
    commands: ["desktop", "kde", "gnome", "xfce", "profile", "select"],
  },
  {
    title: "Graphics Driver & Audio",
    description: "Select open-source graphics drivers and PipeWire for audio.",
    image: "/images/arch/05-optional-repos.png",
    action: "Graphics: All open-source → Audio: PipeWire → Back",
    commands: ["open source", "pipewire", "back", "confirm"],
  },
  {
    title: "Network Configuration",
    description: "Use NetworkManager for automatic WiFi and Ethernet.",
    image: "/images/arch/13-network-config.png",
    action: "Select NetworkManager → Back",
    commands: ["networkmanager", "network manager", "back", "confirm"],
  },
  {
    title: "Timezone & NTP",
    description: "Set your timezone and enable automatic time sync.",
    image: "/images/arch/10-disk-config.png",
    action: "Set timezone → NTP: True → Back",
    commands: ["timezone", "ntp", "back", "confirm", "true"],
  },
  {
    title: "Review & Install",
    description: "Review all options. Hit Install to begin.",
    image: "/images/arch/14-confirm-install.png",
    action: "Select 'Install' → Confirm",
    commands: ["install", "confirm", "yes", "begin"],
  },
];

export default function ArchInstall({ config, speed, onComplete }: {
  config: OSConfig; speed: "normal" | "fast"; onComplete: () => void;
}) {
  const { branding } = config;
  const accent = branding.accent;
  const osName = branding.name;
  const { register: registerAdvance } = useSceneAdvance();
  const [phase, setPhase] = useState<WizardPhase>("boot");
  const [stepIdx, setStepIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [showPopup, setShowPopup] = useState<"boot" | "live" | "wizard" | null>(null);

  const currentStep = WIZARD_STEPS[stepIdx];
  const isWizardComplete = stepIdx >= WIZARD_STEPS.length;

  useEffect(() => {
    if (phase === "wizard" || phase === "live") registerAdvance(() => onComplete());
  }, [phase, registerAdvance, onComplete]);

  useEffect(() => {
    if (isWizardComplete && phase === "wizard") {
      const t = setTimeout(() => setPhase("installing"), speed === "fast" ? 300 : 800);
      return () => clearTimeout(t);
    }
  }, [isWizardComplete, phase, speed]);

  useEffect(() => {
    if (phase === "installing") {
      const t = setTimeout(() => setPhase("done"), speed === "fast" ? 1500 : 3000);
      return () => clearTimeout(t);
    }
  }, [phase, speed]);

  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(() => onComplete(), speed === "fast" ? 800 : 2000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete, speed]);

  function handleSubmit() {
    if (!currentStep || isProcessing) return;
    const cmd = inputValue.trim().toLowerCase();
    if (!cmd) return;
    setIsProcessing(true);
    playClick();
    const isCorrect = currentStep.commands.some((c) => cmd.includes(c));
    if (isCorrect) {
      setError(null);
      setInputValue("");
      setTimeout(() => {
        setStepIdx((p) => p + 1);
        setCompletedSteps((p) => p + 1);
        setIsProcessing(false);
      }, speed === "fast" ? 150 : 400);
    } else {
      setError(`Try: "${currentStep.commands[0]}"`);
      setInputValue("");
      setIsProcessing(false);
    }
  }

  // ─── Boot phase ───
  if (phase === "boot") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black cursor-pointer"
          onClick={() => setShowPopup("boot")}>
          <img src="/images/arch/07-boot-menu.png" alt={`${osName} boot menu`}
            className="absolute inset-0 w-full h-full object-cover bg-[#111]" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/50 bg-black/40 px-3 py-1 rounded-full pointer-events-none">
            Click anywhere to boot
          </div>
          <AnimatePresence>
            {showPopup === "boot" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onClick={() => setShowPopup(null)}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-xl border border-white/15 bg-[#1e1e1e] p-4 shadow-2xl w-72 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: accent }}>{osName} Live USB</div>
                  <p className="text-xs text-white/60 mb-3">Boot into the live environment to begin installation.</p>
                  <button onClick={() => { playClick(); setPhase("live"); setShowPopup(null); }}
                    className="w-full rounded-lg px-4 py-2 text-sm font-bold text-white transition-all hover:scale-[1.02] shadow-lg"
                    style={{ background: accent, boxShadow: `0 10px 15px -3px ${accent}4d` }}>
                    Boot {osName} →
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ─── Live phase ───
  if (phase === "live") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black cursor-pointer"
          onClick={() => setShowPopup("live")}>
          <img src="/images/arch/08-live-login.png" alt={`${osName} live login`}
            className="absolute inset-0 w-full h-full object-cover bg-[#111]" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/50 bg-black/40 px-3 py-1 rounded-full pointer-events-none">
            Click anywhere to launch installer
          </div>
          <AnimatePresence>
            {showPopup === "live" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onClick={() => setShowPopup(null)}>
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-xl border border-white/15 bg-[#1e1e1e] p-4 shadow-2xl w-72 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: accent }}>Live Environment</div>
                  <p className="text-xs text-white/60 mb-3">You're logged in as root. Check internet, then run archinstall.</p>
                  <button onClick={() => { playClick(); setPhase("wizard"); setShowPopup(null); }}
                    className="w-full rounded-lg px-4 py-2 text-sm font-bold text-white transition-all hover:scale-[1.02] shadow-lg"
                    style={{ background: accent, boxShadow: `0 10px 15px -3px ${accent}4d` }}>
                    Run archinstall →
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ─── Installing ───
  if (phase === "installing") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
          <img src="/images/arch/15-install-progress.png" alt={`Installing ${osName}`}
            className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-[#12121a]/80 flex items-center justify-center">
            <div className="text-center space-y-6 px-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="text-4xl">🏹</div>
                <h2 className="text-xl font-bold" style={{ color: accent }}>Installing {osName}...</h2>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  Packages are being downloaded and configured. This takes a few minutes.
                </p>
                <div className="max-w-xs mx-auto h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: accent }}
                    initial={{ width: "0%" }} animate={{ width: "100%" }}
                    transition={{ duration: speed === "fast" ? 1.2 : 2.8, ease: "easeInOut" }} />
                </div>
                <div className="font-mono text-[10px] text-white/25 space-y-1 max-w-md mx-auto text-left">
                  {[":: Synchronizing package databases...", ":: Downloading core packages...", ":: Installing base system...", ":: Configuring bootloader..."].map((line, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * (speed === "fast" ? 0.2 : 0.6) }}>
                      {line}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Done ───
  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
          <img src="/images/arch/16-install-complete.png" alt={`${osName} install complete`}
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 bg-black/60 backdrop-blur-sm rounded-2xl p-8" style={{ borderColor: `${accent}33`, borderWidth: 1 }}>
              <SparkleBurst trigger={true} />
              <div className="text-3xl">🏹</div>
              <h2 className="text-lg font-bold" style={{ color: accent }}>{osName} installed!</h2>
              <p className="text-xs text-white/50 max-w-xs mx-auto">
                You completed the archinstall guided installer. Welcome to {osName}.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // WIZARD — Full-bleed TUI screenshot, clickable with terminal input popup
  // ══════════════════════════════════════════════════════════════
  if (!currentStep) return null;

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black cursor-pointer"
        onClick={() => setShowPopup("wizard")}>
        <AnimatePresence mode="wait">
          <motion.img key={stepIdx} src={currentStep.image} alt={currentStep.title}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full object-cover bg-[#111]" />
        </AnimatePresence>

        <div className="absolute top-3 left-4 right-4 flex items-center gap-3 pointer-events-none">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: accent }}
              animate={{ width: `${(completedSteps / WIZARD_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }} />
          </div>
          <span className="text-[10px] text-white/40 font-mono">{completedSteps + 1}/{WIZARD_STEPS.length}</span>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/50 bg-black/40 px-3 py-1 rounded-full pointer-events-none">
          Click to type command
        </div>

        <AnimatePresence>
          {showPopup === "wizard" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => setShowPopup(null)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl border border-white/15 bg-[#1e1e1e] p-4 shadow-2xl w-80">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border" style={{ color: accent, background: `${accent}1a`, borderColor: `${accent}33` }}>
                    STEP {completedSteps + 1}
                  </span>
                  <span className="text-xs font-bold text-white/80">{currentStep.title}</span>
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed mb-3">{currentStep.description}</p>

                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0c0c0c] px-3 py-2">
                  <span className="font-mono text-sm" style={{ color: accent }}>$</span>
                  <input type="text" value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); playKeyClick(); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
                    placeholder={currentStep.action}
                    className="flex-1 bg-transparent text-white/90 outline-none font-mono text-xs placeholder:text-white/20"
                    autoFocus autoComplete="off" spellCheck={false} />
                  <button onClick={() => { handleSubmit(); }}
                    className="rounded px-2.5 py-1 text-[11px] font-bold text-white shrink-0"
                    style={{ background: accent }}>
                    ↵
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-[10px] text-amber-400/70 font-mono">
                        💡 {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button onClick={() => {
                    playClick();
                    if (!currentStep) return;
                    setIsProcessing(true);
                    setTimeout(() => {
                      setStepIdx((p) => p + 1);
                      setCompletedSteps((p) => p + 1);
                      setIsProcessing(false);
                      setShowPopup(null);
                    }, speed === "fast" ? 150 : 400);
                  }} disabled={isProcessing}
                    className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/40 hover:text-white hover:bg-white/10 transition-colors ml-auto">
                    ⏩ Auto
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
