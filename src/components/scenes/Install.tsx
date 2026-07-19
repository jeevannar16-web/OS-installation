import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

function getBootImg(osId: string): string {
  if (osId === "zorin") return "/images/zorin/03-installer-welcome.png";
  if (osId === "mint") return "/images/mint/03-language-select.png";
  if (osId === "arch") return "/images/arch/01-welcome-page.png";
  if (osId === "windows") return "/images/win11-setup/01-setup-language.webp";
  return "/images/ubuntu/01-try-or-install.png";
}

function getInstallProgressImg(osId: string): string {
  if (osId === "zorin") return "/images/zorin/11-installer.png";
  if (osId === "mint") return "/images/mint/10-installing.png";
  if (osId === "arch") return "/images/arch/15-install-progress.png";
  if (osId === "windows") return "/images/win11-setup/08-clean-install.webp";
  return "/images/ubuntu/10-progress.png";
}

function getRestartImg(osId: string): string {
  if (osId === "mint") return "/images/mint/11-install-complete.png";
  if (osId === "arch") return "/images/arch/16-install-complete.png";
  if (osId === "zorin") return "/images/zorin/11-installer.png";
  if (osId === "windows") return "/images/win11-setup/19-oobe-edge.webp";
  return "/images/ubuntu/11-restart.png";
}

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
  install_type: "/images/zorin/10-welcome-menu.png",
  partition: "/images/zorin/11-installer.png",
  install_option: "/images/zorin/08-appearance-layouts.png",
  third_party: "/images/zorin/06-kernel-flatpak.png",
  app_selection: "/images/zorin/05-version-check.png",
  timezone: "/images/zorin/04-activities-overview.png",
  create_user: "/images/zorin/09-files-manager.png",
  review: "/images/zorin/07-apt-update.png",
};

const MINT_STEP_IMG: Record<InstallerStep, string> = {
  language: "/images/mint/18-mint-install-language.webp",
  keyboard: "/images/mint/19-mint-keyboard.webp",
  network: "/images/mint/17-mint-setup.png",
  install_type: "/images/mint/24-mint-install-dualboot.webp",
  partition: "/images/mint/22-mint-partition.webp",
  install_option: "/images/mint/16-mint-boot-menu.png",
  third_party: "/images/mint/20-mint-codecs.webp",
  app_selection: "/images/mint/14-update-manager.png",
  timezone: "/images/mint/25-mint-region.webp",
  create_user: "/images/mint/26-mint-account.webp",
  review: "/images/mint/27-mint-complete.webp",
};

function getStepImg(osId: string, step: InstallerStep): string {
  if (osId === "zorin") return ZORIN_STEP_IMG[step];
  if (osId === "mint") return MINT_STEP_IMG[step];
  return STEP_IMG[step];
}



const LANGUAGES = [
  "English", "Español", "Français", "Deutsch", "Português (Brasil)",
  "Italiano", "中文 (简体)", "日本語", "한국어", "Русский",
];

const KEYBOARD_LAYOUTS = [
  "English (US)", "English (UK)", "English (India)", "Español (Latinoamérica)",
  "Français", "Deutsch", "Italiano", "Português (Brasil)", "Dvorak", "Colemak",
];

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
  const [elapsed, setElapsed] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);
  const [fileIdx, setFileIdx] = useState(0);
  const [restartPhase, setRestartPhase] = useState<"countdown" | "done">("countdown");
  type PartitionEntry = { device: string; type: string; fs: string; sizeGB: number; mount: string; flags: string[] };
  const FILESYSTEMS = ["ext4", "xfs", "btrfs", "f2fs", "swap", "FAT32", "NTFS"];
  const MOUNT_POINTS = ["/", "/boot", "/boot/efi", "/home", "/var", "/tmp", "[swap]", "none"];
  const DEFAULT_PARTITIONS: PartitionEntry[] = [
    { device: "/dev/sda1", type: "EFI System", fs: "FAT32", sizeGB: 0.5, mount: "/boot/efi", flags: ["boot", "esp"] },
    { device: "/dev/sda2", type: "Microsoft reserved", fs: "", sizeGB: 0.1, mount: "", flags: [] },
    { device: "/dev/sda3", type: "Basic Data", fs: "NTFS", sizeGB: 450, mount: "/mnt/windows", flags: [] },
    { device: "/dev/sda4", type: "Linux swap", fs: "swap", sizeGB: 8, mount: "[swap]", flags: [] },
  ];
  const [partitions, setPartitions] = useState<PartitionEntry[]>(DEFAULT_PARTITIONS);
  const [showPartForm, setShowPartForm] = useState(false);
  const [editPartIdx, setEditPartIdx] = useState<number | null>(null);
  const [partForm, setPartForm] = useState({ sizeGB: 50, fs: "ext4", mount: "/" });

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
      case "language": return !!values["language"];
      case "keyboard": return !!values["keyboard"];
      case "create_user": return !!(values["username"] || "").trim() && !!(values["password"] || "").trim();
      case "partition": return partitions.some((p) => p.fs === "ext4" && p.mount === "/");
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

  function setVal(field: string, val: string) { setValues((p) => ({ ...p, [field]: val })); }

  // ─── Boot phase ───
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
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
          <img src={getBootImg(config.id)} alt={`Try or Install ${osName}`}
            className="absolute inset-0 w-full h-full object-cover" style={{ background: surface }} />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/[0.02] pointer-events-none" />

          <div className="absolute bottom-3 left-3 right-3 z-10 max-w-xs mx-auto space-y-2">
            <button onClick={() => { playClick(); setBootSplash(true); }}
              className="w-full rounded-lg py-2.5 text-sm font-bold text-white shadow-lg"
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
    );
  }

  // ─── Installing phase ───
  if (phase === "installing") {
    if (isWindows) {
      return (
        <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
          <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black flex items-center justify-center">
            <div className="text-center space-y-6">
              {/* Blue Windows logo */}
              <div className="flex gap-1 justify-center">
                <div className="w-5 h-5 bg-[#0078d4] rounded-sm" />
                <div className="w-5 h-5 bg-[#0078d4] rounded-sm" />
                <div className="w-5 h-5 bg-[#0078d4] rounded-sm" />
                <div className="w-5 h-5 bg-[#0078d4] rounded-sm" />
              </div>
              {/* Spinning dots */}
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-white/60"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
              <div className="text-sm text-white/70 font-light">
                Copying your Windows files … {Math.floor(progress)}%
              </div>
              <div className="text-[10px] text-white/30 font-mono max-w-xs mx-auto leading-relaxed">
                {fileIdx < config.installFiles.length ? config.installFiles[fileIdx] : "Finalizing installation..."}
              </div>
            </div>
            {/* Bottom progress bar */}
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-white/10">
              <motion.div className="h-full bg-[#0078d4]"
                animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
            </div>
          </div>
        </div>
      );
    }
    const installImg = getInstallProgressImg(config.id);
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <SparkleBurst trigger={showSparkle} />
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
          <img src={installImg} alt={`Installing ${osName}`}
            className="absolute inset-0 w-full h-full object-cover" />

          {/* Progress info floats on the install screenshot */}
          <div className="absolute bottom-0 inset-x-0 z-10">
            <div className="px-4 pb-3 pt-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="max-w-lg mx-auto">
                <div className="flex justify-between text-[9px] text-white/40 font-mono mb-1">
                  <span>{Math.floor(progress)}%</span>
                  <span>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div className="h-full rounded-full" style={{ background: accent }}
                    animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
                </div>
                <div className="mt-1 h-8 overflow-hidden text-[9px] text-white/40 font-mono">
                  {config.installFiles.slice(Math.max(0, fileIdx - 1), fileIdx + 1).map((file, i) => {
                    const isCurrent = Math.max(0, fileIdx - 1) + i === fileIdx;
                    return <div key={i} className={`truncate ${isCurrent ? "text-white/70" : "opacity-40"}`}>{isCurrent && "▸ "}{file}</div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Remove media ───
  if (phase === "remove_media") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0" style={{ background: surface }}>
          <img src={getRestartImg(config.id)} alt="Restart needed"
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 right-4 z-10 max-w-xs mx-auto">
            <button onClick={() => { playClick(); setPhase("done"); }}
              className="w-full rounded-lg py-2.5 text-sm font-bold text-white shadow-lg"
              style={{ background: accent }}>
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Done ───
  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
          <img src={getRestartImg(config.id)} alt="Restart"
            className="absolute inset-0 w-full h-full object-cover" />
          {restartPhase === "done" ? (
            <div className="absolute bottom-4 left-4 right-4 z-10 max-w-xs mx-auto">
              <button onClick={() => { playSuccess(); onComplete(); }}
                className="w-full rounded-lg py-2.5 text-sm font-bold text-white shadow-lg"
                style={{ background: accent }}>
                Restart Now →
              </button>
            </div>
          ) : (
            <div className="absolute bottom-4 left-4 right-4 z-10 text-center">
              <div className="text-xs text-white/40 font-mono">Restarting…</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // WIZARD — Screenshot fills the frame, fields sit IN the image via bottom overlay
  // ══════════════════════════════════════════════════════════════
  function renderWizard() {
    const formContent = () => {
      switch (step) {
        case "language":
          return (
            <>
              <div className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: accent }}>Select your language</div>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto mb-2">
                {LANGUAGES.map((lang) => (
                  <button key={lang} onClick={() => { playClick(); setVal("language", lang); }}
                    className={`rounded px-2 py-1 text-[11px] transition-all ${
                      values["language"] === lang ? "text-white font-semibold" : "text-white/50 hover:text-white/80"
                    }`} style={values["language"] === lang ? { background: accent } : {}}>{lang}</button>
                ))}
              </div>
              <button onClick={() => { if (!canAdvance()) return; playClick(); handleNext(); }} disabled={!canAdvance()}
                className="rounded px-3 py-1 text-[10px] font-semibold text-white disabled:opacity-30"
                style={{ background: accent }}>Next</button>
            </>
          );
        case "keyboard":
          return (
            <>
              <div className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: accent }}>Keyboard layout</div>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto mb-2">
                {KEYBOARD_LAYOUTS.map((layout) => (
                  <button key={layout} onClick={() => { playClick(); setVal("keyboard", layout); }}
                    className={`rounded px-2 py-1 text-[11px] transition-all ${
                      values["keyboard"] === layout ? "text-white font-semibold" : "text-white/50 hover:text-white/80"
                    }`} style={values["keyboard"] === layout ? { background: accent } : {}}>{layout}</button>
                ))}
              </div>
              <button onClick={() => { if (!canAdvance()) return; playClick(); handleNext(); }} disabled={!canAdvance()}
                className="rounded px-3 py-1 text-[10px] font-semibold text-white disabled:opacity-30"
                style={{ background: accent }}>Next</button>
            </>
          );
        case "network":
          return (
            <>
              <div className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: accent }}>Connect to network</div>
              <div className="space-y-1 mb-2">
                {[{ id: "wifi", label: "HomeWiFi", icon: "📶" }, { id: "ethernet", label: "Wired Ethernet", icon: "🔌" }].map((n) => (
                  <button key={n.id} onClick={() => { playClick(); setVal("network", n.id); }}
                    className={`block text-[11px] transition-all ${
                      values["network"] === n.id ? "text-white font-semibold" : "text-white/50 hover:text-white/80"
                    }`}>
                    <span>{n.icon}</span> <span>{n.label}</span>
                  </button>
                ))}
                <button onClick={() => { playClick(); setVal("network", "skip"); }}
                  className={`block text-[11px] transition-all ${
                    values["network"] === "skip" ? "text-white font-semibold" : "text-white/40 hover:text-white/60"
                  }`}>Skip for now</button>
              </div>
              <button onClick={() => { if (!canAdvance()) return; playClick(); handleNext(); }} disabled={!canAdvance()}
                className="rounded px-3 py-1 text-[10px] font-semibold text-white disabled:opacity-30"
                style={{ background: accent }}>Next</button>
            </>
          );
        case "install_type":
          return (
            <>
              <div className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: accent }}>Type of installation</div>
              <div className="space-y-1 mb-2">
                {[
                  { id: "erase", label: `Erase disk and install ${osName}` },
                  { id: "alongside", label: `Install ${osName} alongside existing OS` },
                  { id: "something", label: "Something else (manual partitioning)" },
                ].filter(opt => path !== "vm" || opt.id === "erase").map((opt) => (
                  <button key={opt.id} onClick={() => { playClick(); setInstallType(opt.id); }}
                    className={`block text-[11px] text-left transition-all ${
                      installType === opt.id ? "text-white font-semibold" : "text-white/50 hover:text-white/80"
                    }`}>{opt.label}</button>
                ))}
              </div>
              <button onClick={() => { if (installType === "something") { setStep(STEP_ORDER[currentIdx + 1]); } else { playClick(); handleNext(); } }}
                className="rounded px-3 py-1 text-[10px] font-semibold text-white"
                style={{ background: accent }}>Next</button>
            </>
          );
        case "install_option":
          return (
            <>
              <div className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: accent }}>Installation method</div>
              <div className="flex gap-2 mb-2">
                {[
                  { id: "interactive", label: "Interactive", desc: "Walk through each step" },
                  { id: "automated", label: "Automated", desc: "Use a preseed file" },
                ].map((opt) => (
                  <button key={opt.id} onClick={() => { playClick(); setVal("install_option", opt.id); }}
                    className={`text-left transition-all ${values["install_option"] === opt.id ? "text-white" : "text-white/50 hover:text-white/80"}`}>
                    <div className="text-[11px] font-semibold">{opt.label}</div>
                    <div className="text-[9px] text-white/30">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => { playClick(); handleNext(); }}
                className="rounded px-3 py-1 text-[10px] font-semibold text-white"
                style={{ background: accent }}>Next</button>
            </>
          );
        case "third_party":
          return (
            <>
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" defaultChecked style={{ accentColor: accent }} />
                <span className="text-[11px] text-white/70">Install third-party software for graphics and Wi-Fi</span>
              </label>
              <button onClick={() => { playClick(); handleNext(); }}
                className="rounded px-3 py-1 text-[10px] font-semibold text-white"
                style={{ background: accent }}>Next</button>
            </>
          );
        case "app_selection":
          return (
            <>
              <div className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: accent }}>Applications to install</div>
              <div className="flex gap-2 mb-2">
                {[
                  { id: "normal", label: "Normal", desc: "Office, browser, games, media player" },
                  { id: "minimal", label: "Minimal", desc: "Browser and basic utilities" },
                ].map((opt) => (
                  <button key={opt.id} onClick={() => { playClick(); setVal("apps", opt.id); }}
                    className={`text-left transition-all ${values["apps"] === opt.id ? "text-white" : "text-white/50 hover:text-white/80"}`}>
                    <div className="text-[11px] font-semibold">{opt.label}</div>
                    <div className="text-[9px] text-white/40">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => { playClick(); handleNext(); }}
                className="rounded px-3 py-1 text-[10px] font-semibold text-white"
                style={{ background: accent }}>Next</button>
            </>
          );
        case "timezone":
          return (
            <>
              <div className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: accent }}>Select your timezone</div>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto mb-2">
                {["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
                  "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney",
                ].map((tz) => (
                  <button key={tz} onClick={() => { playClick(); setVal("timezone", tz); }}
                    className={`rounded px-2 py-1 text-[11px] transition-all ${
                      values["timezone"] === tz ? "text-white font-semibold" : "text-white/50 hover:text-white/80"
                    }`} style={values["timezone"] === tz ? { background: accent } : {}}>{tz}</button>
                ))}
              </div>
              <button onClick={() => { if (!canAdvance()) return; playClick(); handleNext(); }} disabled={!canAdvance()}
                className="rounded px-3 py-1 text-[10px] font-semibold text-white disabled:opacity-30"
                style={{ background: accent }}>Next</button>
            </>
          );
        case "create_user":
          return (
            <>
              <div className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: accent }}>Who are you?</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { key: "name", placeholder: "Your name" },
                  { key: "computer_name", placeholder: "Computer name" },
                  { key: "username", placeholder: "Username" },
                  { key: "password", placeholder: "Password", secret: true },
                ].map((f) => (
                  <input key={f.key} type={f.secret ? "password" : "text"}
                    value={values[f.key] ?? ""} placeholder={f.placeholder}
                    onChange={(e) => { setVal(f.key, e.target.value); playKeyClick(); }}
                    className="border-b border-white/20 bg-transparent px-1 py-0.5 text-[11px] text-white/90 outline-none placeholder:text-white/30 transition-colors w-[120px]" />
                ))}
              </div>
              <button onClick={() => { if (!canAdvance()) return; playClick(); handleNext(); }} disabled={!canAdvance()}
                className="rounded px-3 py-1 text-[10px] font-semibold text-white disabled:opacity-30"
                style={{ background: accent }}>Next</button>
            </>
          );
        case "review":
          return (
            <>
              <div className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: accent }}>Ready to install</div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mb-1">
                {[
                  ["Language", values["language"] ?? "English"],
                  ["Keyboard", values["keyboard"] ?? "English (US)"],
                  ["Network", values["network"] === "skip" ? "Skipped" : values["network"] ?? "HomeWiFi"],
                  ["Install type", installType === "erase" ? "Erase disk" : installType === "alongside" ? "Dual boot" : "Manual"],
                  ["Timezone", values["timezone"] ?? "UTC"],
                  ["Username", values["username"] ?? "user"],
                ].map(([l, v]) => (
                  <div key={l} className="text-[10px]">
                    <span className="text-white/40">{l}: </span>
                    <span className="text-white/70 font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-white/40 mb-1">The changes listed above will be written to disk.</p>
              <button onClick={() => { playClick(); setPhase("installing"); }}
                className="rounded px-3 py-1.5 text-[10px] font-semibold text-white"
                style={{ background: accent }}>Install Now</button>
            </>
          );
        case "partition":
          return (
            <>
              <div className="text-[10px] font-semibold tracking-wider mb-1" style={{ color: accent }}>Manual Partitioning</div>
              <div className="space-y-0.5 max-h-36 overflow-y-auto mb-1">
                {partitions.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <span className="font-mono text-white/60">{p.device}</span>
                    <span className="text-white/30">{p.sizeGB} GB</span>
                    {p.mount && <span className="font-mono text-white/50">{p.mount}</span>}
                    <button onClick={() => { playClick(); setPartForm({ sizeGB: p.sizeGB, fs: p.fs || "ext4", mount: p.mount || "/" }); setEditPartIdx(i); setShowPartForm(true); }}
                      className="text-white/40 hover:text-white/80">Edit</button>
                    <button onClick={() => { playClick(); setPartitions(prev => prev.filter((_, j) => j !== i)); }}
                      className="text-red-400/60 hover:text-red-400">Del</button>
                  </div>
                ))}
                <button onClick={() => { playClick(); setEditPartIdx(null); setPartForm({ sizeGB: 50, fs: "ext4", mount: "/" }); setShowPartForm(true); }}
                  className="text-[10px] text-white/40 hover:text-white/80"
                  style={{ color: accent }}>+ Add partition</button>
              </div>
              {showPartForm && (
                <div className="flex flex-wrap gap-2 mb-1">
                  <div>
                    <label className="text-[8px] text-white/40 block">Size (GB)</label>
                    <input type="number" min={1} max={500}
                      value={partForm.sizeGB} onChange={(e) => setPartForm(p => ({ ...p, sizeGB: Number(e.target.value) }))}
                      className="w-16 border-b border-white/20 bg-transparent px-1 text-[10px] text-white/90 outline-none" />
                  </div>
                  <div>
                    <label className="text-[8px] text-white/40 block">FS</label>
                    <select value={partForm.fs} onChange={(e) => setPartForm(p => ({ ...p, fs: e.target.value }))}
                      className="border-b border-white/20 bg-transparent px-1 text-[10px] text-white/90 outline-none">
                      {FILESYSTEMS.map(fs => <option key={fs} value={fs}>{fs}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] text-white/40 block">Mount</label>
                    <select value={partForm.mount} onChange={(e) => setPartForm(p => ({ ...p, mount: e.target.value }))}
                      className="border-b border-white/20 bg-transparent px-1 text-[10px] text-white/90 outline-none">
                      {MOUNT_POINTS.map(mp => <option key={mp} value={mp}>{mp}</option>)}
                    </select>
                  </div>
                  <button onClick={() => { playClick(); setShowPartForm(false); setEditPartIdx(null); }}
                    className="text-[9px] text-white/50">Cancel</button>
                  <button onClick={() => {
                    playClick();
                    const np: PartitionEntry = {
                      device: `/dev/sda${partitions.length + 1}`,
                      type: partForm.mount === "/" ? "Linux filesystem" : partForm.mount === "[swap]" ? "Linux swap" : "Linux filesystem",
                      fs: partForm.fs, sizeGB: partForm.sizeGB, mount: partForm.mount,
                      flags: partForm.mount === "/" ? ["root"] : partForm.mount === "/boot" ? ["boot"] : [],
                    };
                    if (editPartIdx !== null) setPartitions(prev => prev.map((p, i) => (i === editPartIdx ? np : p)));
                    else setPartitions(prev => [...prev, np]);
                    setShowPartForm(false); setEditPartIdx(null);
                  }} disabled={partForm.sizeGB < 1}
                    className="rounded px-2 py-0.5 text-[9px] font-semibold text-white disabled:opacity-40"
                    style={{ background: accent }}>
                    {editPartIdx !== null ? "Save" : "Create"}
                  </button>
                </div>
              )}
              <button onClick={() => { if (!canAdvance()) return; playClick(); handleNext(); }} disabled={!canAdvance()}
                className="rounded px-3 py-1 text-[10px] font-semibold text-white disabled:opacity-30"
                style={{ background: accent }}>Next</button>
            </>
          );
      }
    };

    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="absolute inset-0">
              <img src={getStepImg(config.id, step)} alt={step}
                className="absolute inset-0 w-full h-full object-cover" style={{ background: surface }} />
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full">
            {STEP_ORDER.map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${i <= currentIdx ? "w-3" : "w-1.5"}`}
                style={{ background: i <= currentIdx ? accent : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>

          {/* Interactive elements on the image */}
          <div className="absolute bottom-2 left-2 right-2 z-10">
            <motion.div key={step} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}>
              {formContent()}
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return renderWizard();
}
