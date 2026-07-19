import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playSuccess } from "../shared/sounds";
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

type HotspotDef = { id: string; x: number; y: number; w: number; h: number; onClick: () => void };

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
  const [showSparkle, setShowSparkle] = useState(false);
  const [fileIdx, setFileIdx] = useState(0);
  const [restartPhase, setRestartPhase] = useState<"countdown" | "done">("countdown");
  const [wizardAction, setWizardAction] = useState<"idle" | "clicked">("idle");

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
      case "partition": return true;
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

  function getBootHotspots(): HotspotDef[] {
    if (isWindows || bootSplash) return [];
    return [
      { id: "install", x: 20, y: 62, w: 25, h: 10, onClick: () => { playClick(); setBootSplash(true); } },
      { id: "try", x: 20, y: 75, w: 25, h: 10, onClick: () => { playClick(); setBootSplash(true); } },
    ];
  }

  function getWizardHotspots(): HotspotDef[] {
    const base: HotspotDef[] = [
      { id: "next", x: 65, y: 82, w: 18, h: 9, onClick: handleNext },
    ];
    if (currentIdx > 0) {
      base.push({
        id: "back", x: 15, y: 82, w: 18, h: 9,
        onClick: () => { if (currentIdx > 0) { playClick(); setStep(STEP_ORDER[currentIdx - 1]); } },
      });
    }
    return base;
  }

  function getRemoveMediaHotspots(): HotspotDef[] {
    return [
      { id: "restart", x: 30, y: 70, w: 40, h: 10, onClick: () => { playClick(); setPhase("done"); } },
    ];
  }

  function getDoneHotspots(): HotspotDef[] {
    if (restartPhase !== "done") return [];
    return [
      { id: "restart", x: 30, y: 70, w: 40, h: 10, onClick: () => { playSuccess(); onComplete(); } },
    ];
  }

  function renderHotspotPhase(src: string, hotspots: HotspotDef[]) {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
          <img src={src} alt=""
            className="absolute inset-0 w-full h-full object-cover" />
          {hotspots.map(h => (
            <div key={h.id} onClick={h.onClick}
              className="absolute z-10"
              style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%`, cursor: "pointer" }} />
          ))}
          {phase === "boot" && bootSplash && (
            <div className="absolute inset-0 z-20 bg-black flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                  <svg width="60" height="60" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="15" stroke={accent} strokeWidth="1.5" fill="none" />
                    <circle cx="16" cy="5.5" r="2.5" fill={accent} />
                    <circle cx="7" cy="20.5" r="2.5" fill={accent} />
                    <circle cx="25" cy="20.5" r="2.5" fill={accent} />
                  </svg>
                </motion.div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="h-2 w-2 rounded-full"
                      style={{ background: accent }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                  ))}
                </div>
                <div className="text-xs text-white/40 font-mono">Starting installer…</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Boot phase ───
  if (phase === "boot") {
    return renderHotspotPhase(getBootImg(config.id), getBootHotspots());
  }

  // ─── Installing phase ───
  if (phase === "installing") {
    if (isWindows) {
      return (
        <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
          <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10"
            style={{ background: "linear-gradient(180deg, #0a0a0f 0%, #0d1117 40%, #0a0a0f 100%)" }}>
            <div className="absolute top-[18%] inset-x-0 flex justify-center">
              <div className="grid grid-cols-2 gap-px">
                <div className="w-3 h-3 bg-[#0078d4]" style={{ borderTopLeftRadius: "1px" }} />
                <div className="w-3 h-3 bg-[#0078d4]" style={{ borderTopRightRadius: "1px" }} />
                <div className="w-3 h-3 bg-[#0078d4]" style={{ borderBottomLeftRadius: "1px" }} />
                <div className="w-3 h-3 bg-[#0078d4]" style={{ borderBottomRightRadius: "1px" }} />
              </div>
            </div>
            <div className="absolute top-[26%] inset-x-0 flex justify-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div key={i} className="h-1 w-1 rounded-full bg-white/50"
                  animate={{ opacity: [0.15, 0.8, 0.15] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }} />
              ))}
            </div>
            <div className="absolute top-[32%] inset-x-0 text-center">
              <p className="text-xs text-white/60 font-light tracking-wide">Copying Windows files</p>
              <p className="text-[9px] text-white/25 font-mono mt-1">{Math.floor(progress)}%</p>
              {fileIdx < config.installFiles.length && (
                <p className="text-[8px] text-white/15 font-mono mt-2 max-w-[200px] mx-auto truncate">
                  {config.installFiles[fileIdx]}
                </p>
              )}
            </div>
            <div className="absolute bottom-0 inset-x-0 h-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div className="h-full" style={{ background: "#0078d4" }}
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
        </div>
      </div>
    );
  }

  // ─── Remove media ───
  if (phase === "remove_media") {
    return renderHotspotPhase(getRestartImg(config.id), getRemoveMediaHotspots());
  }

  // ─── Done ───
  if (phase === "done") {
    return renderHotspotPhase(getRestartImg(config.id), getDoneHotspots());
  }

  // ══════════════════════════════════════════════════════════════
  // WIZARD — Screenshot fills the frame, hotspots over buttons
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <AnimatePresence mode="wait">
          <motion.img key={step} src={getStepImg(config.id, step)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ background: surface }} />
        </AnimatePresence>

        {/* Step dots */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full">
          {STEP_ORDER.map((s, i) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${i <= currentIdx ? "w-3" : "w-1.5"}`}
              style={{ background: i <= currentIdx ? accent : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>

        {/* Navigation hotspots */}
        {getWizardHotspots().map(h => (
          <div key={h.id} onClick={h.onClick}
            className="absolute z-10"
            style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%`, cursor: "pointer" }} />
        ))}

        {/* Main content interaction hotspot */}
        <div onClick={() => {
          if (wizardAction === "idle") {
            setWizardAction("clicked");
            playClick();
            switch (step) {
              case "language": {
                const idx = LANGUAGES.indexOf(values["language"] || "");
                setVal("language", LANGUAGES[(idx + 1) % LANGUAGES.length]);
                break;
              }
              case "keyboard": {
                const idx = KEYBOARD_LAYOUTS.indexOf(values["keyboard"] || "");
                setVal("keyboard", KEYBOARD_LAYOUTS[(idx + 1) % KEYBOARD_LAYOUTS.length]);
                break;
              }
              case "network":
                setVal("network", values["network"] === "wifi" ? "ethernet" : values["network"] === "ethernet" ? "skip" : "wifi");
                break;
              case "install_type":
                setInstallType(installType === "erase" ? "something" : "erase");
                break;
              case "third_party":
                setVal("third_party", values["third_party"] === "yes" ? "no" : "yes");
                break;
              case "timezone": {
                const tzs = ["UTC", "America/New_York", "Europe/London", "Asia/Kolkata", "Asia/Tokyo"];
                const idx = tzs.indexOf(values["timezone"] || "");
                setVal("timezone", tzs[(idx + 1) % tzs.length]);
                break;
              }
              case "review":
                break;
            }
            setTimeout(() => setWizardAction("idle"), 200);
          }
        }}
          className="absolute z-10"
          style={{ left: step === "create_user" ? "0" : "10%", top: "10%", width: step === "create_user" ? "0" : "80%", height: "65%", cursor: "pointer" }} />

        {/* Invisible inputs for create_user step */}
        {step === "create_user" && (
          <>
            <input value={values["name"] ?? ""} onChange={e => { setVal("name", e.target.value); playClick(); }}
              placeholder="Your name" autoFocus
              className="absolute z-10 bg-transparent border-none outline-none cursor-text"
              style={{ left: "18%", top: "26%", width: "35%", height: "6%", color: "#fff", fontSize: "13px", fontFamily: "system-ui, sans-serif" }} />
            <input value={values["computer_name"] ?? ""} onChange={e => setVal("computer_name", e.target.value)}
              placeholder="Computer name"
              className="absolute z-10 bg-transparent border-none outline-none cursor-text"
              style={{ left: "18%", top: "37%", width: "35%", height: "6%", color: "#fff", fontSize: "13px", fontFamily: "system-ui, sans-serif" }} />
            <input value={values["username"] ?? ""} onChange={e => { setVal("username", e.target.value); playClick(); }}
              placeholder="Username"
              className="absolute z-10 bg-transparent border-none outline-none cursor-text"
              style={{ left: "18%", top: "48%", width: "35%", height: "6%", color: "#fff", fontSize: "13px", fontFamily: "system-ui, sans-serif" }} />
            <input value={values["password"] ?? ""} onChange={e => setVal("password", e.target.value)}
              type="password" placeholder="Password"
              className="absolute z-10 bg-transparent border-none outline-none cursor-text"
              style={{ left: "18%", top: "59%", width: "35%", height: "6%", color: "#fff", fontSize: "13px", fontFamily: "system-ui, sans-serif" }} />
          </>
        )}

        {/* Invisible inputs for partition step */}
        {step === "partition" && (
          <input value={values["partition_size"] ?? "50"} onChange={e => setVal("partition_size", e.target.value)}
            placeholder="Size (GB)"
            className="absolute z-10 bg-transparent border-none outline-none cursor-text"
            style={{ left: "18%", top: "35%", width: "20%", height: "6%", color: "#fff", fontSize: "13px", fontFamily: "monospace" }} />
        )}
      </div>
    </div>
  );
}
