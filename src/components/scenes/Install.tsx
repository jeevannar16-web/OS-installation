import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick, playSuccess } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type WizardPhase = "boot" | "wizard" | "installing" | "remove_media" | "done";

type InstallerStep =
  | "language"
  | "keyboard"
  | "network"
  | "install_type"
  | "partition"
  | "install_option"
  | "third_party"
  | "app_selection"
  | "timezone"
  | "create_user"
  | "review";

// Real Ubuntu 24.04 installer order — partition step is conditional
const STEP_ORDER_BASE: InstallerStep[] = [
  "language", "keyboard", "network", "install_type", "install_option",
  "third_party", "app_selection", "timezone", "create_user", "review",
];

// Mint installer has fewer steps (no install_option, no app_selection)
const STEP_ORDER_MINT: InstallerStep[] = [
  "language", "keyboard", "network", "third_party", "install_type",
  "timezone", "create_user", "review",
];

// Zorin installer — even simpler (no install_option, no third_party, no app_selection)
const STEP_ORDER_ZORIN: InstallerStep[] = [
  "language", "keyboard", "network", "install_type",
  "timezone", "create_user", "review",
];

function getStepOrder(osId: string): InstallerStep[] {
  if (osId === "mint") return STEP_ORDER_MINT;
  if (osId === "zorin") return STEP_ORDER_ZORIN;
  return STEP_ORDER_BASE;
}

const SIDEBAR_LABELS: Record<InstallerStep, string> = {
  language: "Language",
  keyboard: "Keyboard",
  network: "Network",
  install_type: "Install Type",
  partition: "Partitions",
  install_option: "Installation Method",
  third_party: "Third-Party",
  app_selection: "Applications",
  timezone: "Timezone",
  create_user: "Create User",
  review: "Summary",
};

// OS-specific boot and install progress images
function getBootImg(osId: string): string {
  if (osId === "zorin") return "/images/zorin/03-installer-welcome.png";
  if (osId === "mint") return "/images/mint/03-language-select.png";
  return "/images/ubuntu/01-try-or-install.png";
}

function getInstallProgressImg(osId: string): string {
  if (osId === "zorin") return "/images/zorin/11-installer.png";
  if (osId === "mint") return "/images/mint/10-installing.png";
  return "/images/ubuntu/10-progress.png";
}

function getRestartImg(osId: string): string {
  if (osId === "mint") return "/images/mint/11-install-complete.png";
  return "/images/ubuntu/11-restart.png";
}

function getPartImg(osId: string, mount: string): string {
  if (osId === "mint") {
    if (mount === "/") return "/images/mint/23-mint-create-partition.webp";
    return "/images/mint/22-mint-partition.webp";
  }
  if (osId === "zorin") return "/images/zorin/11-installer.png";
  if (mount === "/boot") return "/images/ubuntu/17-boot-partition.png";
  if (mount === "/home") return "/images/ubuntu/19-home-partition.webp";
  if (mount === "[swap]") return "/images/ubuntu/20-swap-partition.webp";
  return "/images/ubuntu/18-root-partition.webp";
}

// Fixed: 05 = install type (erase/alongside), 07 = install method (interactive/auto)
const STEP_IMG: Record<InstallerStep, string> = {
  language: "/images/ubuntu/02-language.png",
  keyboard: "/images/ubuntu/03-keyboard.webp",
  network: "/images/ubuntu/04-network.webp",
  install_type: "/images/ubuntu/05-install-option.webp",
  partition: "/images/ubuntu/16-manual-partition.webp",
  install_option: "/images/ubuntu/07-install-type.webp",
  third_party: "/images/ubuntu/06-third-party.webp",
  app_selection: "/images/ubuntu/21-app-selection.webp",
  timezone: "/images/ubuntu/23-timezone.png",
  create_user: "/images/ubuntu/08-create-user.webp",
  review: "/images/ubuntu/09-review.png",
};

const ZORIN_STEP_IMG: Record<InstallerStep, string> = {
  language: "/images/zorin/03-installer-welcome.png",
  keyboard: "/images/zorin/03-installer-welcome.png",
  network: "/images/zorin/03-installer-welcome.png",
  install_type: "/images/zorin/11-installer.png",
  partition: "/images/zorin/11-installer.png",
  install_option: "/images/zorin/11-installer.png",
  third_party: "/images/zorin/11-installer.png",
  app_selection: "/images/zorin/11-installer.png",
  timezone: "/images/zorin/11-installer.png",
  create_user: "/images/zorin/11-installer.png",
  review: "/images/zorin/11-installer.png",
};

const MINT_STEP_IMG: Record<InstallerStep, string> = {
  language: "/images/mint/18-mint-install-language.webp",
  keyboard: "/images/mint/19-mint-keyboard.webp",
  network: "/images/mint/21-mint-something-else.webp",
  install_type: "/images/mint/06-installation-type.png",
  partition: "/images/mint/22-mint-partition.webp",
  install_option: "/images/mint/21-mint-something-else.webp",
  third_party: "/images/mint/05-multimedia-codecs.png",
  app_selection: "/images/mint/06-installation-type.png",
  timezone: "/images/mint/08-timezone.png",
  create_user: "/images/mint/09-user-creation.png",
  review: "/images/mint/10-installing.png",
};

function getStepImg(osId: string, step: InstallerStep): string {
  if (osId === "zorin") return ZORIN_STEP_IMG[step];
  if (osId === "mint") return MINT_STEP_IMG[step];
  return STEP_IMG[step];
}

function getAccent(osId: string): string {
  if (osId === "zorin") return "#15A66E";
  if (osId === "mint") return "#88C999";
  return "#E95420";
}

function getSurface(osId: string): string {
  if (osId === "windows") return "#002060";
  if (osId === "zorin") return "#1a1a2e";
  if (osId === "mint") return "#1a1a2e";
  return "#2c001e";
}

function getOSName(osId: string): string {
  if (osId === "windows") return "Windows 11";
  if (osId === "zorin") return "Zorin OS";
  if (osId === "mint") return "Linux Mint";
  return "Ubuntu";
}

const LANGUAGES = [
  "English", "Español", "Français", "Deutsch", "Português (Brasil)",
  "Italiano", "中文 (简体)", "日本語", "한국어", "Русский",
];

const KEYBOARD_LAYOUTS = [
  "English (US)", "English (UK)", "English (India)", "Español (Latinoamérica)",
  "Français", "Deutsch", "Italiano", "Português (Brasil)", "Dvorak", "Colemak",
];

// Real installer feature slides shown during installation
const INSTALL_SLIDES = [
  { title: "Fast and secure", body: "Boots in seconds and keeps your data safe with built-in firewall and disk encryption." },
  { title: "Productive out of the box", body: "Office suite, email client, web browser, and media player — all pre-installed." },
  { title: "Software Centre", body: "Thousands of free applications available at your fingertips." },
  { title: "Customise your desktop", body: "Themes, fonts, dock position, widgets — make it yours." },
  { title: "Built-in security", body: "Automatic updates, firewall, and full-disk encryption keep you safe." },
];

function Sidebar({ current, stepOrder, accent }: { current: InstallerStep; stepOrder: InstallerStep[]; accent: string }) {
  const idx = stepOrder.indexOf(current);
  return (
    <div className="hidden md:flex w-48 lg:w-56 shrink-0 flex-col border-r border-white/10 bg-[#1a1a24] p-3 gap-0.5">
      {stepOrder.map((s, i) => (
        <div key={s} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
          s === current ? `bg-[${accent}]/10 text-[${accent}] font-semibold`
          : i < idx ? "text-white/40" : "text-white/25"
        }`} style={s === current ? { background: `${accent}10`, color: accent } : {}}>
          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
            i < idx || s === current ? "text-white" : "bg-white/10 text-white/30"
          }`} style={i < idx || s === current ? { background: accent } : {}}>{i < idx ? "✓" : i + 1}</div>
          <span className="truncate">{SIDEBAR_LABELS[s]}</span>
        </div>
      ))}
    </div>
  );
}

function StepNav({ onBack, onNext, nextLabel, nextDisabled, showBack, accent }: {
  onBack: () => void; onNext: () => void; nextLabel: string; nextDisabled?: boolean; showBack?: boolean; accent: string;
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
        className={`rounded-lg px-5 py-2 text-xs font-semibold transition-colors text-white ${
          nextDisabled ? "bg-white/10 text-white/30 cursor-not-allowed" : "hover:opacity-90"
        }`} style={!nextDisabled ? { background: accent } : {}}>{nextLabel}</button>
    </div>
  );
}

export default function Install({ config, speed, onComplete, path }: {
  config: OSConfig; speed: "normal" | "fast"; onComplete: () => void; path?: string;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const isWindows = config.id === "windows";
  const accent = getAccent(config.id);
  const surface = getSurface(config.id);
  const osName = getOSName(config.id);
  const [phase, setPhase] = useState<WizardPhase>(isWindows ? "installing" : "boot");
  const [bootSplash, setBootSplash] = useState(false);
  const [step, setStep] = useState<InstallerStep>("language");
  const [values, setValues] = useState<Record<string, string>>({});
  const [installType, setInstallType] = useState<string>(path === "vm" ? "erase" : "erase");
  const [installMethod, setInstallMethod] = useState<string>("interactive");
  const [thirdParty, setThirdParty] = useState(true);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);
  const [fileIdx, setFileIdx] = useState(0);
  const [restartPhase, setRestartPhase] = useState<"countdown" | "done">("countdown");

  // Partition editor state (shown when installType === "something")
  type PartitionEntry = { device: string; type: string; fs: string; sizeGB: number; mount: string; flags: string[] };
  const TOTAL_GB = 500;
  const FILESYSTEMS = ["ext4", "xfs", "btrfs", "f2fs", "swap", "FAT32", "NTFS"];
  const MOUNT_POINTS = ["/", "/boot", "/boot/efi", "/home", "/var", "/tmp", "[swap]", "none"];
  const DEFAULT_PARTITIONS: PartitionEntry[] = [
    { device: "/dev/sda1", type: "EFI System", fs: "FAT32", sizeGB: 0.5, mount: "/boot/efi", flags: ["boot", "esp"] },
    { device: "/dev/sda2", type: "Microsoft reserved", fs: "", sizeGB: 0.1, mount: "", flags: [] },
    { device: "/dev/sda3", type: "Basic Data", fs: "NTFS", sizeGB: 450, mount: "/mnt/windows", flags: [] },
    { device: "/dev/sda4", type: "Linux swap", fs: "swap", sizeGB: 8, mount: "[swap]", flags: [] },
  ];
  const [partitions, setPartitions] = useState<PartitionEntry[]>(DEFAULT_PARTITIONS);
  const [showPartDialog, setShowPartDialog] = useState(false);
  const [editPartIdx, setEditPartIdx] = useState<number | null>(null);
  const [partForm, setPartForm] = useState({ sizeGB: 50, fs: "ext4", mount: "/" });

  const usedGB = partitions.reduce((sum, p) => sum + p.sizeGB, 0);
  const freeGB = Math.max(0, TOTAL_GB - usedGB);
  const canConfirmPart = partitions.some((p) => p.fs === "ext4" && p.mount === "/");

  // Dynamic step order: insert partition step after install_type when "something else" is selected
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

  // Installing phase — real progress
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
      else { setShowSparkle(true); setTimeout(() => setShowSparkle(false), 1500); setPhase("remove_media"); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, installDuration, config.installFiles]);

  // Slide rotation during install
  useEffect(() => {
    if (phase !== "installing") return;
    const iv = setInterval(() => {
      setSlideIdx((p) => (p + 1) % INSTALL_SLIDES.length);
      setTipIdx((p) => (p + 1) % config.installTips.length);
    }, speed === "fast" ? 600 : 3000);
    return () => clearInterval(iv);
  }, [phase, config.installTips.length, speed]);

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
      case "language": return !!values["language"];
      case "keyboard": return !!values["keyboard"];
      case "create_user": return !!(values["username"] || "").trim() && !!(values["password"] || "").trim();
      case "partition": return canConfirmPart;
      default: return true;
    }
  }

  function handleNext() {
    if (phase === "done") { playSuccess(); onComplete(); return; }
    if (phase === "boot") { playClick(); setPhase("wizard"); return; }
    if (phase === "remove_media") { playClick(); setPhase("done"); return; }
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
     BOOT — "Try or Install Ubuntu" screen with real screenshot
     User clicks "Install Ubuntu" to begin the wizard
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "boot") {
    if (bootSplash) {
      return (
        <div className="mx-auto w-full max-w-5xl flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
          style={{ height: "min(600px, 70vh)", background: surface }}>
          <div className="flex flex-col items-center gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="15" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="16" cy="5.5" r="2.5" fill="white" />
                <circle cx="7" cy="20.5" r="2.5" fill="white" />
                <circle cx="25" cy="20.5" r="2.5" fill="white" />
              </svg>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div key={i}
                  className="h-2 w-2 rounded-full bg-white/60"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </motion.div>
            <div className="text-xs text-white/40 font-mono">Loading installer…</div>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black">
          <img src={getBootImg(config.id)} alt={`Try or Install ${osName}`}
            className="absolute inset-0 w-full h-full object-cover" style={{ background: surface }} />

          <div className="absolute inset-x-0 bottom-0">
            <div className="bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/60 to-transparent pt-24 pb-4 px-6">
              <div className="max-w-md mx-auto space-y-3 text-center">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <p className="text-xs text-white/50 mb-3">
                    Select your language and click <strong className="text-white/80">Install {osName}</strong> to begin.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => { playClick(); setBootSplash(true); }}
                      className="rounded-lg px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg"
                      style={{ background: accent, boxShadow: `0 10px 25px -5px ${accent}40` }}>
                      Install {osName}
                    </button>
                    <button onClick={() => { playClick(); setBootSplash(true); }}
                      className="rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-medium text-white/70 hover:bg-white/15 transition-all hover:scale-[1.02]">
                      Try {osName}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     INSTALLING — Real Ubuntu installer progress screen
     Shows the actual progress screenshot with real-time file copy
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "installing") {
    const installImg = isWindows ? "/images/win11-setup/08-clean-install.webp" : getInstallProgressImg(config.id);
    return (
      <div className="mx-auto w-full max-w-5xl">
        <SparkleBurst trigger={showSparkle} />
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
          <img src={installImg} alt={`Installing ${osName}`} className="w-full h-full object-cover" />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/80 to-transparent pt-24 pb-5 px-6">
            <div className="max-w-lg mx-auto space-y-3">
              <div className="text-center">
                <h3 className="text-sm font-bold text-white">Installing {osName}</h3>
                <p className="text-[11px] text-white/50 mt-0.5">{config.installTips[tipIdx]}</p>
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: accent }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.15 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/40 font-mono">
                  <span>{Math.floor(progress)}% complete</span>
                  <span className="text-white/25">{isWindows ? config.installTips[tipIdx] : INSTALL_SLIDES[slideIdx].title}</span>
                  <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
                </div>
              </div>

              {!isWindows && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                  <div className="text-xs font-semibold text-white/70 mb-0.5">{INSTALL_SLIDES[slideIdx].title}</div>
                  <div className="text-[10px] text-white/35 leading-relaxed">{INSTALL_SLIDES[slideIdx].body}</div>
                </div>
              )}

              <div className="h-14 overflow-hidden rounded border border-white/10 bg-black/40 p-2 font-mono text-[9px] text-white/40">
                {config.installFiles.slice(Math.max(0, fileIdx - 3), fileIdx + 1).map((file, i) => {
                  const actualIdx = Math.max(0, fileIdx - 3) + i;
                  const isCurrent = actualIdx === fileIdx;
                  return (
                    <div key={fileIdx - 3 + i} className={`truncate leading-relaxed ${isCurrent ? "text-white/70" : "opacity-40"}`}
                      style={isCurrent ? { color: accent } : {}}>
                      {isCurrent && "▸ "}{file}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     REMOVE MEDIA — Prompt to remove USB before restart
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "remove_media") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0" style={{ background: surface }}>
          <img src={getRestartImg(config.id)} alt="Restart needed"
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/40 to-transparent pt-24 pb-6 px-6 flex items-end">
            <div className="max-w-md mx-auto space-y-3 text-center w-full">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-black/60 backdrop-blur-sm rounded-xl p-5 border border-white/10 space-y-3">
                  <div className="text-2xl">🔌</div>
                  <h3 className="text-sm font-bold text-white">Remove installation media</h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Unplug the USB drive or eject the installation media, then press <strong className="text-white/70">Continue</strong> to restart.
                  </p>
                  <button onClick={() => { playClick(); setPhase("done"); }}
                    className="rounded-lg px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg"
                    style={{ background: accent, boxShadow: `0 10px 25px -5px ${accent}40` }}>
                    Continue →
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     RESTART — Real restart screen
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
          <img src={getRestartImg(config.id)} alt="Restart" className="w-full h-auto object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center space-y-4 bg-black/60 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <SparkleBurst trigger={showSparkle} />
              <div className="text-3xl">🎉</div>
              <h2 className="text-lg font-bold text-white">Installation complete!</h2>
              <p className="text-xs text-white/50 max-w-xs mx-auto">
                Remove the installation media and restart your computer.
              </p>
              {restartPhase === "done" ? (
                <button onClick={() => { playSuccess(); onComplete(); }}
                  className="rounded-lg px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-colors shadow-lg"
                  style={{ background: accent, boxShadow: `0 10px 25px -5px ${accent}30` }}>
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
     WIZARD STEPS — Real screenshot background + interactive overlay
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 flex overflow-hidden rounded-t-2xl border border-white/10 border-b-0">
        <Sidebar current={step} stepOrder={STEP_ORDER} accent={accent} />
        <div className="flex-1 relative overflow-hidden bg-black">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="absolute inset-0">

              <img src={getStepImg(config.id, step)} alt={SIDEBAR_LABELS[step]}
                className="absolute inset-0 w-full h-full object-cover" style={{ background: surface }} />

              <div className="absolute inset-x-0 bottom-0">
                <div className="bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/60 to-transparent pt-16 pb-4 px-6">
                  <div className="max-w-md mx-auto space-y-3">

                    {step === "language" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Select your language</div>
                        <div className="flex flex-wrap gap-1.5">
                          {LANGUAGES.map((lang) => (
                            <button key={lang} onClick={() => { playClick(); setVal("language", lang); }}
                              className={`rounded-md px-3 py-1.5 text-[11px] transition-all ${
                                values["language"] === lang
                                  ? "text-white font-semibold shadow-lg"
                                  : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                              }`} style={values["language"] === lang ? { background: accent, boxShadow: `0 4px 12px ${accent}40` } : {}}>{lang}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Keyboard selector ── */}
                    {step === "keyboard" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Keyboard layout</div>
                        <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto">
                          {KEYBOARD_LAYOUTS.map((layout) => (
                            <button key={layout} onClick={() => { playClick(); setVal("keyboard", layout); }}
                              className={`rounded-md px-3 py-1.5 text-[11px] text-left transition-all ${
                                values["keyboard"] === layout
                                  ? "text-white font-semibold"
                                  : "bg-white/10 text-white/70 hover:bg-white/15"
                              }`} style={values["keyboard"] === layout ? { background: accent, boxShadow: `0 4px 12px ${accent}40` } : {}}>{layout}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Network selector ── */}
                    {step === "network" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Connect to network</div>
                        <div className="space-y-1">
                          {[{ id: "wifi-home", label: "HomeWiFi", icon: "📶" },
                            { id: "wifi-5g", label: "Neighbor_5G", icon: "📶" },
                            { id: "ethernet", label: "Wired Ethernet", icon: "🔌" },
                          ].map((n) => (
                            <button key={n.id} onClick={() => { playClick(); setVal("network", n.id); }}
                              className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-[11px] transition-all ${
                                values["network"] === n.id
                                  ? "text-white"
                                  : "bg-white/10 text-white/70 hover:bg-white/15"
                              }`} style={values["network"] === n.id ? { background: accent } : {}}>
                              <span>{n.icon}</span><span className="font-medium">{n.label}</span>
                            </button>
                          ))}
                          <button onClick={() => { playClick(); setVal("network", "skip"); }}
                            className={`w-full rounded-md px-3 py-2 text-[11px] transition-all ${
                              values["network"] === "skip" ? "text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                            }`} style={values["network"] === "skip" ? { background: accent } : {}}>I don't want to connect now</button>
                        </div>
                      </div>
                    )}

                    {/* ── Install type (Erase / Alongside / Manual) — image 05 ── */}
                    {step === "install_type" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Type of installation</div>
                        {path === "vm" ? (
                          /* VM path: only Erase disk makes sense (virtual disk) */
                          <>
                            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-[10px] text-emerald-300">
                              ✓ In a VM, "Erase disk" only affects the virtual disk — your host OS is safe.
                            </div>
                            <button onClick={() => { playClick(); setInstallType("erase"); }}
                              className="w-full rounded-md px-3 py-2 text-[11px] text-left font-medium text-white shadow-lg"
                              style={{ background: accent, boxShadow: `0 4px 12px ${accent}40` }}>
                              Erase disk and install {getOSName(config.id)}
                            </button>
                          </>
                        ) : (
                          /* Dual-boot / physical: show all options */
                          [
                            { id: "erase", label: `Erase disk and install ${getOSName(config.id)}` },
                            { id: "alongside", label: `Install ${getOSName(config.id)} alongside existing OS` },
                            { id: "something", label: "Something else (manual partitioning)" },
                          ].map((opt) => (
                            <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                              className={`w-full rounded-md px-3 py-2 text-[11px] text-left font-medium transition-all ${
                                installType === opt.id
                                  ? "text-white shadow-lg"
                                  : "bg-white/10 text-white/70 hover:bg-white/15"
                              }`} style={installType === opt.id ? { background: accent, boxShadow: `0 4px 12px ${accent}40` } : {}}>{opt.label}</button>
                          ))
                        )}
                      </div>
                    )}

                    {/* ── Manual partition editor (shown when "Something else" is selected) ── */}
                    {step === "partition" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Manual partitioning</div>

                        {/* Disk visual bar */}
                        <div className="space-y-1">
                          <div className="text-[10px] font-medium text-white/50">/dev/sda — {TOTAL_GB} GB</div>
                          <div className="flex h-6 w-full overflow-hidden rounded border border-white/10 bg-white/[0.06]">
                            {partitions.map((p, i) => {
                              const pct = (p.sizeGB / TOTAL_GB) * 100;
                              const colors: Record<string, string> = {
                                FAT32: "bg-blue-200", NTFS: "bg-blue-300", ext4: "bg-emerald-300",
                                swap: "bg-amber-200", xfs: "bg-purple-200", btrfs: "bg-cyan-200", f2fs: "bg-teal-200",
                              };
                              return (
                                <div key={i} className={`${colors[p.fs] || "bg-white/10"} flex items-center justify-center text-[8px] font-medium text-white/80 border-r border-white/50 overflow-hidden`}
                                  style={{ width: `${pct}%` }} title={`${p.device} — ${p.fs} — ${p.sizeGB} GB — ${p.mount}`}>
                                  {pct > 5 && <span className="truncate px-0.5">{p.mount || p.fs}</span>}
                                </div>
                              );
                            })}
                            {freeGB > 0 && (
                              <div className="flex items-center justify-center text-[8px] font-medium text-white/40 border-r border-white/50 border-dashed"
                                style={{ width: `${(freeGB / TOTAL_GB) * 100}%` }}>
                                {freeGB > 10 && <span className="truncate px-0.5">Free</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Partition table */}
                        <div className="rounded border border-white/10 overflow-hidden bg-[#12121a]/80 max-h-[120px] overflow-y-auto">
                          <table className="w-full text-[9px]">
                            <thead>
                              <tr className="bg-white/[0.03] border-b border-white/10 text-left text-[8px] font-medium text-white/50 uppercase">
                                <th className="px-2 py-1">Device</th>
                                <th className="px-2 py-1">FS</th>
                                <th className="px-2 py-1">Size</th>
                                <th className="px-2 py-1">Mount</th>
                                <th className="px-2 py-1 text-right">Act</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {partitions.map((p, i) => (
                                <tr key={i} className={`${p.mount === "/" ? "bg-emerald-500/5" : ""} hover:bg-white/[0.05]`}>
                                  <td className="px-2 py-0.5 font-mono text-white/60">{p.device}</td>
                                  <td className="px-2 py-0.5">{p.fs ? <span className="rounded bg-white/[0.06] px-1 text-[8px] text-white/60">{p.fs}</span> : "—"}</td>
                                  <td className="px-2 py-0.5 text-white/60">{p.sizeGB} GB</td>
                                  <td className="px-2 py-0.5">
                                    {p.mount ? <span className={`font-mono ${p.mount === "/" ? "text-emerald-400 font-semibold" : "text-white/60"}`}>{p.mount}</span> : "—"}
                                  </td>
                                  <td className="px-2 py-0.5 text-right">
                                    <button onClick={() => { playClick(); setEditPartIdx(i); setPartForm({ sizeGB: p.sizeGB, fs: p.fs || "ext4", mount: p.mount || "/" }); setShowPartDialog(true); }}
                                      className="rounded px-1 text-[8px] text-white/50 hover:text-white/80">Edit</button>
                                    <button onClick={() => { playClick(); setPartitions((prev) => prev.filter((_, j) => j !== i)); }}
                                      className="rounded px-1 text-[8px] text-white/40 hover:text-red-500">Del</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Add partition + confirm */}
                        <div className="flex items-center justify-between">
                          <button disabled={freeGB < 1} onClick={() => { playClick(); setEditPartIdx(null); setPartForm({ sizeGB: Math.min(50, Math.floor(freeGB)), fs: "ext4", mount: "/" }); setShowPartDialog(true); }}
                            className={`rounded border px-2 py-1 text-[10px] font-medium transition-colors ${
                              freeGB >= 1 ? "text-white/60 hover:bg-white/10" : "border-white/10 text-white/30 cursor-not-allowed"
                            }`} style={freeGB >= 1 ? { borderColor: `${accent}50`, background: `${accent}08` } : {}}>+ Add partition</button>
                          {!canConfirmPart && (
                            <div className="text-[9px] text-amber-400">Need ext4 mounted at /</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Install method (Interactive / Automated) — image 07 ── */}
                    {step === "install_option" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Installation method</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "interactive", label: "Interactive installation", desc: "Walk through each step" },
                            { id: "automated", label: "Automated installation", desc: "Use a preseed file" },
                          ].map((opt) => (
                            <button key={opt.id} onClick={() => { playClick(); setInstallMethod(opt.id); }}
                              className={`rounded-lg border p-3 text-left transition-all ${
                                installMethod === opt.id
                                  ? "border-white/20 text-white"
                                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                              }`} style={installMethod === opt.id ? { borderColor: accent, background: `${accent}15` } : {}}>
                              <div className="text-[11px] font-semibold">{opt.label}</div>
                              <div className="text-[9px] text-white/30 mt-0.5">{opt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Third party ── */}
                    {step === "third_party" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Additional software</div>
                        <label className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 cursor-pointer hover:bg-white/15 transition-all">
                          <input type="checkbox" checked={thirdParty} onChange={() => setThirdParty(!thirdParty)} style={{ accentColor: accent }} />
                          <span className="text-[11px] text-white/80">Install third-party software for graphics and Wi-Fi</span>
                        </label>
                        <label className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 cursor-pointer hover:bg-white/15 transition-all">
                          <input type="checkbox" defaultChecked style={{ accentColor: accent }} />
                          <span className="text-[11px] text-white/80">Download and install support for additional media formats</span>
                        </label>
                      </div>
                    )}

                    {/* ── App selection (Normal / Minimal) — image 21 ── */}
                    {step === "app_selection" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Applications to install</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "normal", label: "Normal installation", desc: "Web browser, utilities, office software, games, media player" },
                            { id: "minimal", label: "Minimal installation", desc: "Web browser and basic utilities" },
                          ].map((opt) => (
                            <button key={opt.id} onClick={() => { playClick(); setVal("apps", opt.id); }}
                              className={`rounded-lg border p-3 text-left transition-all ${
                                values["apps"] === opt.id
                                  ? "border-white/20 text-white"
                                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                              }`} style={values["apps"] === opt.id ? { borderColor: accent, background: `${accent}15` } : {}}>
                              <div className="text-[11px] font-semibold">{opt.label}</div>
                              <div className="text-[9px] text-white/30 mt-0.5">{opt.desc}</div>
                            </button>
                          ))}
                        </div>
                        <label className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 cursor-pointer hover:bg-white/15 transition-all">
                          <input type="checkbox" defaultChecked style={{ accentColor: accent }} />
                          <span className="text-[11px] text-white/80">Download and install third-party codecs</span>
                        </label>
                      </div>
                    )}

                    {/* ── Timezone selector — image 23 ── */}
                    {step === "timezone" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Select your timezone</div>
                        <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto">
                          {["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
                            "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney",
                          ].map((tz) => (
                            <button key={tz} onClick={() => { playClick(); setVal("timezone", tz); }}
                              className={`rounded-md px-3 py-1.5 text-[11px] text-left transition-all ${
                                values["timezone"] === tz
                                  ? "text-white font-semibold"
                                  : "bg-white/10 text-white/70 hover:bg-white/15"
                              }`} style={values["timezone"] === tz ? { background: accent } : {}}>{tz}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Create user — image 08 ── */}
                    {step === "create_user" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Who are you?</div>
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
                              className="rounded-md bg-white/10 border border-white/10 px-3 py-2 text-[11px] text-white/90 outline-none placeholder:text-white/25 transition-colors" style={{ borderColor: undefined }} />
                          ))}
                        </div>
                        <label className="flex items-center gap-1.5 text-[10px] text-white/40 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-3 h-3" style={{ accentColor: accent }} />Log in automatically
                        </label>
                      </div>
                    )}

                    {/* ── Review / Summary — image 09 ── */}
                    {step === "review" && (
                      <div className="space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>Ready to install</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-white/5 rounded-lg p-3 border border-white/10">
                          {[
                            ["Language", values["language"] ?? "English"],
                            ["Keyboard", values["keyboard"] ?? "English (US)"],
                            ["Network", values["network"] === "skip" ? "Skipped" : values["network"] ?? "HomeWiFi"],
                            ["Install type", installType === "erase" ? "Erase disk" : installType === "alongside" ? "Dual boot" : "Manual"],
                            ["Method", installMethod === "interactive" ? "Interactive" : "Automated"],
                            ["Third-party", thirdParty ? "Yes" : "No"],
                            ["Apps", values["apps"] === "minimal" ? "Minimal" : "Normal"],
                            ["Timezone", values["timezone"] ?? "UTC"],
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
        nextDisabled={!canAdvance()} showBack={currentIdx > 0} accent={accent} />

      {/* ── Partition create/edit dialog ── */}
      <AnimatePresence>
        {showPartDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPartDialog(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-white/10 bg-[#12121a] p-5 shadow-2xl">
              <div className="rounded-lg overflow-hidden mb-4 border border-white/10">
                <img src={getPartImg(config.id, partForm.mount)} alt="Partition type" className="w-full h-24 object-cover" />
              </div>
              <h3 className="text-sm font-bold text-white/90 mb-3">{editPartIdx !== null ? "Edit partition" : "Create partition"}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-white/60 mb-1">Size (GB)</label>
                  <input type="number" min={1} max={Math.floor(freeGB + (editPartIdx !== null ? partitions[editPartIdx].sizeGB : 0))}
                    value={partForm.sizeGB} onChange={(e) => setPartForm((p) => ({ ...p, sizeGB: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/90 outline-none bg-[#1a1a24]" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-white/60 mb-1">Filesystem</label>
                  <select value={partForm.fs} onChange={(e) => setPartForm((p) => ({ ...p, fs: e.target.value }))}
                    className="w-full rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/90 outline-none bg-[#1a1a24]">
                    {FILESYSTEMS.map((fs) => <option key={fs} value={fs}>{fs}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-white/60 mb-1">Mount point</label>
                  <select value={partForm.mount} onChange={(e) => setPartForm((p) => ({ ...p, mount: e.target.value }))}
                    className="w-full rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/90 outline-none bg-[#1a1a24]">
                    {MOUNT_POINTS.map((mp) => <option key={mp} value={mp}>{mp}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => { playClick(); setShowPartDialog(false); setEditPartIdx(null); }}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/[0.03] transition-colors">Cancel</button>
                <button onClick={() => {
                  playClick();
                  const np: PartitionEntry = {
                    device: `/dev/sda${partitions.length + 1}`,
                    type: partForm.mount === "/" ? "Linux filesystem" : partForm.mount === "[swap]" ? "Linux swap" : "Linux filesystem",
                    fs: partForm.fs, sizeGB: partForm.sizeGB, mount: partForm.mount,
                    flags: partForm.mount === "/" ? ["root"] : partForm.mount === "/boot" ? ["boot"] : [],
                  };
                  if (editPartIdx !== null) setPartitions((prev) => prev.map((p, i) => (i === editPartIdx ? np : p)));
                  else setPartitions((prev) => [...prev, np]);
                  setShowPartDialog(false); setEditPartIdx(null);
                }} disabled={partForm.sizeGB < 1}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-40"
                  style={{ background: accent }}>
                  {editPartIdx !== null ? "Save" : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
