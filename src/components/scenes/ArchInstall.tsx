import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

/* ═══════════════════════════════════════════════════════════════════
   ARCHINSTALL WIZARD STEPS
   Real screenshots mapped to each step of the archinstall guided
   installer as shown in the YouTube reference videos.
   ═══════════════════════════════════════════════════════════════════ */
type WizardPhase = "boot" | "live" | "wizard" | "installing" | "done";

type WizardStep = {
  title: string;
  description: string;
  /** Background screenshot — real archinstall TUI image */
  image: string;
  /** What the user should click/select */
  action: string;
  /** Correct input(s) that advance the step */
  commands: string[];
};

const WIZARD_STEPS: WizardStep[] = [
  {
    title: "Run archinstall",
    description: "Launch the guided installer from the live terminal",
    image: "/images/arch/08-live-login.png",
    action: "Type archinstall and press Enter",
    commands: ["archinstall"],
  },
  {
    title: "Archinstall — Main Menu",
    description: "The guided installer TUI presents all configuration options. Work through them top to bottom.",
    image: "/images/arch/09-archinstall-menu.png",
    action: "Select Locales (first option) → Enter",
    commands: ["locales", "select locales", "enter locales", "set locales"],
  },
  {
    title: "Locales — Language & Keyboard",
    description: "Set your keyboard layout and locale. For most users, defaults (English, us, en_US, UTF-8) are fine.",
    image: "/images/arch/03-wizard.png",
    action: "Keep defaults → Back to main menu",
    commands: ["back", "done", "confirm"],
  },
  {
    title: "Mirrors — Package Sources",
    description: "Select a mirror region close to you for fast package downloads.",
    image: "/images/arch/04-mirror-region.png",
    action: "Select your region (e.g. Worldwild) → Back",
    commands: ["back", "done", "select", "confirm"],
  },
  {
    title: "Disk Configuration",
    description: "Choose how to partition the disk. 'Best effort' is easiest — let archinstall handle it.",
    image: "/images/arch/06-best-effort.png",
    action: "Select 'Best effort' → Choose drive → ext4",
    commands: ["best effort", "select disk", "choose disk", "confirm"],
  },
  {
    title: "Filesystem & Swap",
    description: "Pick ext4 (most common) or btrfs. Enable swap for better memory management.",
    image: "/images/arch/07-filesystem.png",
    action: "Select ext4 → Enable swap → Back",
    commands: ["ext4", "btrfs", "swap", "confirm", "back"],
  },
  {
    title: "Bootloader",
    description: "GRUB is recommended for most setups, especially dual-boot. systemd-boot is lighter.",
    image: "/images/arch/05-optional-repos.png",
    action: "Select GRUB → Back to main menu",
    commands: ["grub", "select grub", "back", "confirm"],
  },
  {
    title: "Hostname",
    description: "Set the network name for your machine. 'archlinux' is the default.",
    image: "/images/arch/11-hostname.png",
    action: "Type archlinux → Enter",
    commands: ["archlinux", "enter", "confirm"],
  },
  {
    title: "Root Password",
    description: "Set the root (superuser) password. You'll need this for admin tasks.",
    image: "/images/arch/11-user-password.png",
    action: "Enter password → Confirm",
    commands: ["password", "confirm", "set password", "enter"],
  },
  {
    title: "User Account",
    description: "Create a regular user account. Add sudo privileges so you can run admin commands.",
    image: "/images/arch/12-user-accounts.png",
    action: "Add user → Set username & password → Sudo: yes → Confirm and exit",
    commands: ["add user", "create user", "confirm and exit", "done"],
  },
  {
    title: "Profile — Desktop Environment",
    description: "Choose a desktop environment. KDE Plasma, GNOME, and XFCE are popular choices.",
    image: "/images/arch/12-desktop-profile.png",
    action: "Select Profile → Type: Desktop → Choose DE (e.g. KDE Plasma)",
    commands: ["desktop", "kde", "gnome", "xfce", "profile", "select"],
  },
  {
    title: "Graphics Driver & Audio",
    description: "Select open-source graphics drivers and PipeWire for audio (modern default).",
    image: "/images/arch/13-network-config.png",
    action: "Graphics: All open-source → Audio: PipeWire → Back",
    commands: ["open source", "pipewire", "back", "confirm"],
  },
  {
    title: "Network Configuration",
    description: "Use NetworkManager — it handles WiFi and Ethernet automatically.",
    image: "/images/arch/14-confirm-install.png",
    action: "Select NetworkManager → Back",
    commands: ["networkmanager", "network manager", "back", "confirm"],
  },
  {
    title: "Timezone & NTP",
    description: "Set your timezone and enable automatic time sync (NTP).",
    image: "/images/arch/10-select-kernels.png",
    action: "Set timezone → NTP: True → Back",
    commands: ["timezone", "ntp", "back", "confirm", "true"],
  },
  {
    title: "Review & Install",
    description: "Review all options. Everything looks good? Hit Install to begin.",
    image: "/images/arch/09-archinstall-menu.png",
    action: "Select 'Install' at the bottom → Confirm",
    commands: ["install", "confirm", "yes", "begin"],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function ArchInstall({
  config: _config,
  speed,
  onComplete,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [phase, setPhase] = useState<WizardPhase>("boot");
  const [stepIdx, setStepIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState(0);

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
      }, speed === "fast" ? 200 : 500);
    } else {
      setError(`Try: "${currentStep.commands[0]}"`);
      setIsProcessing(false);
      setInputValue("");
    }
  }

  function handleAutoComplete() {
    if (!currentStep || isProcessing) return;
    playClick();
    setError(null);
    setInputValue("");
    setTimeout(() => {
      setStepIdx((p) => p + 1);
      setCompletedSteps((p) => p + 1);
    }, speed === "fast" ? 150 : 400);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "Enter" && phase === "boot") || (e.key === "Enter" && phase === "live")) {
        e.preventDefault();
        if (phase === "boot") setPhase("live");
        else setPhase("wizard");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  /* ═══════════════════════════════════════════════════════════════
     BOOT — Arch Linux boot menu (real screenshot)
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "boot") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black">
          <img src="/images/arch/07-boot-menu.png" alt="Arch Linux boot menu"
            className="absolute inset-0 w-full h-full object-contain bg-[#111]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/60 to-transparent pt-24 pb-4 px-6 flex items-end">
            <div className="max-w-md mx-auto space-y-3 text-center w-full">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <p className="text-xs text-white/50 mb-1">
                  Arch Linux boot menu from the live USB
                </p>
                <p className="text-[10px] text-white/30 mb-3">
                  Select <strong className="text-[#1793D1]">Boot Arch Linux (x86_64)</strong> and press Enter
                </p>
                <button onClick={() => { playClick(); setPhase("live"); }}
                  className="rounded-lg bg-[#1793D1] px-6 py-3 text-sm font-bold text-white hover:bg-[#1380b8] transition-all hover:scale-[1.02] shadow-lg shadow-[#1793D1]/30">
                  Boot Arch Linux →
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     LIVE — First login into live environment
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "live") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black">
          <img src="/images/arch/08-live-login.png" alt="Arch Linux live login"
            className="absolute inset-0 w-full h-full object-contain bg-[#111]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/60 to-transparent pt-24 pb-4 px-6 flex items-end">
            <div className="max-w-md mx-auto space-y-3 text-center w-full">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <p className="text-xs text-white/50 mb-1">
                  You're logged in as <strong className="text-white/80">root</strong> in the live environment
                </p>
                <p className="text-[10px] text-white/30 mb-3">
                  Check internet with <code className="text-[#1793D1]">ping -c 3 archlinux.org</code>, then launch the installer
                </p>
                <button onClick={() => { playClick(); setPhase("wizard"); }}
                  className="rounded-lg bg-[#1793D1] px-6 py-3 text-sm font-bold text-white hover:bg-[#1380b8] transition-all hover:scale-[1.02] shadow-lg shadow-[#1793D1]/30">
                  Run archinstall →
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     INSTALLING — Progress animation
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "installing") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-[#111]">
          <img src="/images/arch/15-install-progress.png" alt="Installing Arch Linux"
            className="absolute inset-0 w-full h-full object-contain opacity-30" />
          <div className="absolute inset-0 bg-[#12121a]/80 flex items-center justify-center">
            <div className="text-center space-y-6 px-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="text-4xl">🏹</div>
                <h2 className="text-xl font-bold text-[#1793D1]">Installing Arch Linux...</h2>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  Packages are being downloaded and configured. This takes a few minutes.
                </p>
                {/* Progress bar */}
                <div className="max-w-xs mx-auto h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-[#1793D1]"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: speed === "fast" ? 1.2 : 2.8, ease: "easeInOut" }} />
                </div>
                {/* Terminal output lines */}
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

  /* ═══════════════════════════════════════════════════════════════
     DONE — Installation complete
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-[#111]">
          <img src="/images/arch/16-install-complete.png" alt="Arch Linux install complete"
            className="absolute inset-0 w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 bg-black/60 backdrop-blur-sm rounded-2xl p-8 border border-[#1793D1]/20">
              <SparkleBurst trigger={true} />
              <div className="text-3xl">🏹</div>
              <h2 className="text-lg font-bold text-[#1793D1]">Arch Linux installed!</h2>
              <p className="text-xs text-white/50 max-w-xs mx-auto">
                You completed the archinstall guided installer. Welcome to Arch.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     WIZARD — Step-by-step archinstall with real TUI screenshots
     ═══════════════════════════════════════════════════════════════ */
  if (!currentStep) return null;

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black">
        {/* Real archinstall TUI screenshot background */}
        <AnimatePresence mode="wait">
          <motion.img
            key={stepIdx}
            src={currentStep.image}
            alt={currentStep.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full object-contain bg-[#111]"
          />
        </AnimatePresence>

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/40 to-transparent" />

        {/* Step progress indicator */}
        <div className="absolute top-3 left-4 right-4 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full rounded-full bg-[#1793D1]"
              animate={{ width: `${(completedSteps / WIZARD_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }} />
          </div>
          <span className="text-[10px] text-white/40 font-mono">{completedSteps + 1}/{WIZARD_STEPS.length}</span>
        </div>

        {/* Bottom interactive panel */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 flex items-end">
          <div className="w-full space-y-3">
            {/* Step info */}
            <AnimatePresence mode="wait">
              <motion.div key={stepIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-[#1793D1] font-bold px-1.5 py-0.5 rounded bg-[#1793D1]/10 border border-[#1793D1]/20">
                    STEP {completedSteps + 1}
                  </span>
                  <span className="text-xs font-bold text-white/80">{currentStep.title}</span>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed">{currentStep.description}</p>
              </motion.div>
            </AnimatePresence>

            {/* Input row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0c0c0c]/90 px-3 py-2.5">
                <span className="text-[#1793D1] font-mono text-sm">$</span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); playKeyClick(); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  placeholder={currentStep.action}
                  className="flex-1 bg-transparent text-white/90 outline-none font-mono text-sm placeholder:text-white/20"
                  autoComplete="off" spellCheck={false}
                />
              </div>
              <button onClick={handleSubmit}
                className="rounded-lg bg-[#1793D1] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1380b8] transition-all shrink-0">
                ↵
              </button>
              <button onClick={handleAutoComplete}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-[11px] text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                ⏩ Auto
              </button>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-[10px] text-amber-400/70 font-mono">
                  💡 {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
