import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { motion, AnimatePresence } from "framer-motion";
import { simulationMachine, SIM_SCENES } from "../machines/simulationMachine";
import { getOS } from "../data";
import { ToastProvider } from "../components/shared/Toast";
import ErrorBoundary from "../components/shared/ErrorBoundary";
import Showcase from "../components/shared/Showcase";
import Footer from "../components/Footer";
import DesktopShell, { type AppInfo } from "../components/shell/DesktopShell";
import FakeBrowser from "../components/scenes/FakeBrowser";
import FileManager from "../components/scenes/FileManager";
import FlashUSB from "../components/scenes/FlashUSB";
import UsbReinsert from "../components/scenes/UsbReinsert";
import Reboot from "../components/scenes/Reboot";
import BootMenu from "../components/scenes/BootMenu";
import LiveWelcome from "../components/scenes/LiveWelcome";
import LiveDesktop from "../components/scenes/LiveDesktop";
import Partition from "../components/scenes/Partition";
import Install from "../components/scenes/Install";
import ArchInstall from "../components/scenes/ArchInstall";
import CreateVM from "../components/scenes/CreateVM";
import MountISO from "../components/scenes/MountISO";
import VmBoot from "../components/scenes/VmBoot";
import VmClose from "../components/scenes/VmClose";
import Done from "../components/scenes/Done";
import { toggleMute, isMuted } from "../components/shared/sounds";

const SCENE_LABELS: Record<string, string> = {
  idle: "Start",
  searching: "Search & Download",
  downloading: "Locate ISO",
  flashing_usb: "Flash USB",
  usb_reinsert: "Insert USB",
  rebooting: "Reboot",
  boot_menu: "Boot Menu",
  partitioning: "Partition",
  live_welcome: "Live Welcome",
  live_desktop: "Live Desktop",
  create_vm: "Create VM",
  mount_iso: "Mount ISO",
  vm_boot: "Power On",
  installing: "Install",
  vm_close: "Close VM",
  complete: "Done",
};

const ACTIVE_APP: Record<string, AppInfo> = {
  searching: { name: "Browser", icon: "🌐" },
  downloading: { name: "Files", icon: "📁" },
  flashing_usb: { name: "USB Tool", icon: "🔌" },
  usb_reinsert: { name: "Setup", icon: "🔌" },
  rebooting: { name: "System", icon: "⏻" },
  boot_menu: { name: "Boot Menu", icon: "💻" },
  live_welcome: { name: "Installer", icon: "💿" },
  live_desktop: { name: "Live Session", icon: "🖥️" },
  partitioning: { name: "Installer", icon: "🧩" },
  create_vm: { name: "VirtualBox", icon: "💻" },
  mount_iso: { name: "VirtualBox", icon: "💿" },
  vm_boot: { name: "VirtualBox", icon: "▶" },
  installing: { name: "Installer", icon: "🧩" },
  vm_close: { name: "VirtualBox", icon: "💻" },
  complete: { name: "Done", icon: "🎉" },
};

const FULLSCREEN_SCENES = new Set(["rebooting", "boot_menu", "live_welcome", "live_desktop"]);

const STATUS_TEXT: Record<string, string> = {
  searching: "Searching for the official download page…",
  downloading: "Locating the ISO file in your Downloads folder…",
  flashing_usb: "Flashing the ISO image to your USB drive…",
  usb_reinsert: "Insert the USB into the target machine…",
  rebooting: "Restarting and entering BIOS…",
  boot_menu: "Select a boot device from the menu…",
  live_welcome: "Choose between trying or installing…",
  live_desktop: "Exploring the live desktop environment…",
  partitioning: "Allocating disk space for the new OS…",
  create_vm: "Setting up a new virtual machine…",
  mount_iso: "Attaching the installation ISO…",
  vm_boot: "Powering on the virtual machine…",
  installing: "Installing the operating system…",
  vm_close: "Closing the virtual machine…",
  complete: "Installation complete!",
};

const VM_ONLY = new Set(["create_vm", "mount_iso", "vm_boot"]);
const PHYSICAL_ONLY = new Set(["flashing_usb", "usb_reinsert", "rebooting", "boot_menu"]);

const SCENE_CONTEXT: Record<string, string> = {
  searching: "Use the browser to find the official download page for your OS.",
  downloading: "Locate the ISO file you just downloaded in your file manager.",
  flashing_usb: "Write the ISO image to a USB drive using a flashing tool.",
  usb_reinsert: "Remove the USB, then plug it back into the target machine.",
  rebooting: "Restart the computer and enter the BIOS/UEFI setup.",
  boot_menu: "Select the USB drive from the boot device menu to start the installer.",
  live_welcome: "Choose whether to try the OS live or install it directly.",
  live_desktop: "Explore the live desktop — everything runs from the USB.",
  partitioning: "Resize your existing partition and allocate space for the new OS.",
  create_vm: "Configure a new virtual machine with the right settings.",
  mount_iso: "Attach the downloaded ISO as a virtual CD/DVD drive.",
  vm_boot: "Power on the VM and boot from the attached ISO.",
  installing: "Follow the installer wizard to set up your new operating system.",
  vm_close: "Shut down the VM now that installation is complete.",
  complete: "Congratulations — your new OS is ready to use!",
};

export default function SimulationPage() {
  const { os, path } = useParams();
  const config = getOS(os);

  const [state, send] = useMachine(simulationMachine);
  const [showcase, setShowcase] = useState(() => {
    return !sessionStorage.getItem("showcase_seen");
  });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [muted, setMuted] = useState(() => isMuted());
  const [presentationMode, setPresentationMode] = useState(false);
  const [sceneLabelKey, setSceneLabelKey] = useState(0);
  const [sceneLabelVisible, setSceneLabelVisible] = useState(false);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = String(state.value);
  const speed = state.context.speed;

  const STORAGE_KEY = "os-sim-progress";

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.osId && data.path && data.state && data.state !== "idle" && data.state !== "complete") {
          if (data.osId === os && data.path === path) {
            // Machine state can't be directly restored with XState v5
          }
        }
      } catch { /* ignore corrupt data */ }
    }
  }, [os, path]);

  useEffect(() => {
    const current = String(state.value);
    console.log(`[SimPage] STATE → ${current}`);
    if (current !== "idle") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          osId: config?.id ?? null,
          path: path,
          state: current,
          timestamp: Date.now(),
        })
      );
    }
    if (current === "complete") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.value, config, path]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "?" || (e.key === "/" && !e.ctrlKey && !e.metaKey)) {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        e.preventDefault();
        setShowShortcuts((p) => !p);
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
      }
      if (e.key === "m" || e.key === "M") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        const now = toggleMute();
        setMuted(now);
      }
      if (e.key === "s" || e.key === "S") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        send({ type: "SET_SPEED", speed: speed === "fast" ? "normal" : "fast" });
      }
      if (e.key === "Enter") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "BUTTON")) return;
        const s = String(state.value);
        console.log("[SimPage] Enter pressed in state:", s);
        if (s === "searching") send({ type: "SEARCH_DONE" });
        else if (s === "downloading") send({ type: "DOWNLOAD_DONE" });
        else if (s === "flashing_usb") send({ type: "FLASH_DONE" });
        else if (s === "usb_reinsert") send({ type: "USB_INSERTED" });
        else if (s === "rebooting") send({ type: "REBOOT_DONE" });
        else if (s === "partitioning") send({ type: "PARTITION_DONE" });
        else if (s === "live_welcome") send({ type: "LIVE_INSTALL" });
        else if (s === "live_desktop") send({ type: "LIVE_INSTALL" });
        else if (s === "create_vm") send({ type: "VM_CREATED" });
        else if (s === "mount_iso") send({ type: "ISO_MOUNTED" });
        else if (s === "vm_boot") send({ type: "VM_POWERED_ON" });
        else if (s === "vm_close") send({ type: "VM_CLOSED" });
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [speed, send, state.value]);

  useEffect(() => {
    if (config && path && state.matches("idle")) {
      send({ type: "START", osId: config.id, path: path as never });
    }
  }, [config, path]);

  // Show scene context label when scene changes
  useEffect(() => {
    if (current === "idle" || current === "complete") {
      setSceneLabelVisible(false);
      return;
    }
    setSceneLabelKey((k) => k + 1);
    setSceneLabelVisible(true);
    const t = setTimeout(() => setSceneLabelVisible(false), 3500);
    return () => clearTimeout(t);
  }, [current]);

  // Presentation mode: auto-advance every 8 seconds
  useEffect(() => {
    if (presentationMode && current !== "idle" && current !== "complete") {
      autoAdvanceRef.current = setInterval(() => {
        const s = String(state.value);
        if (s === "searching") send({ type: "SEARCH_DONE" });
        else if (s === "downloading") send({ type: "DOWNLOAD_DONE" });
        else if (s === "flashing_usb") send({ type: "FLASH_DONE" });
        else if (s === "usb_reinsert") send({ type: "USB_INSERTED" });
        else if (s === "rebooting") send({ type: "REBOOT_DONE" });
        else if (s === "partitioning") send({ type: "PARTITION_DONE" });
        else if (s === "live_welcome") send({ type: "LIVE_INSTALL" });
        else if (s === "live_desktop") send({ type: "LIVE_INSTALL" });
        else if (s === "create_vm") send({ type: "VM_CREATED" });
        else if (s === "mount_iso") send({ type: "ISO_MOUNTED" });
        else if (s === "vm_boot") send({ type: "VM_POWERED_ON" });
        else if (s === "vm_close") send({ type: "VM_CLOSED" });
      }, 8000);
    }
    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [presentationMode, state.value, send, current]);

  // Exit presentation mode on Escape
  useEffect(() => {
    if (!presentationMode) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPresentationMode(false);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presentationMode]);

  if (!config) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-white/60">Unknown OS: {os}</p>
        <Link to="/" className="btn-ghost">
          ← Back to home
        </Link>
      </div>
    );
  }

  const currentIndex = (SIM_SCENES as readonly string[]).indexOf(current);
  const cfg = config;
  const activeApp = ACTIVE_APP[current] ?? { name: "OS Simulator", icon: "💿" };
  const isFullscreen = FULLSCREEN_SCENES.has(current);
  const isVm = path === "vm";

  function renderScene() {
    console.log(`[SimPage] renderScene called — state="${current}", path="${path}"`);
    switch (current) {
      case "idle":
        return null;
      case "searching":
        return (
          <FakeBrowser
            config={cfg}
            speed={speed}
            onComplete={() => { console.log("[SimPage] SEARCH_DONE"); send({ type: "SEARCH_DONE" }); }}
          />
        );
      case "downloading":
        return <FileManager config={cfg} onComplete={() => { console.log("[SimPage] DOWNLOAD_DONE"); send({ type: "DOWNLOAD_DONE" }); }} />;
      case "flashing_usb":
        return (
          <FlashUSB config={cfg} speed={speed} onComplete={() => { console.log("[SimPage] FLASH_DONE send"); send({ type: "FLASH_DONE" }); }} />
        );
      case "usb_reinsert":
        console.log("[SimPage] Rendering usb_reinsert scene");
        return (
          <UsbReinsert onComplete={() => { console.log("[SimPage] USB_INSERTED send"); send({ type: "USB_INSERTED" }); }} />
        );
      case "rebooting":
        return (
          <Reboot speed={speed} onComplete={() => send({ type: "REBOOT_DONE" })} />
        );
      case "boot_menu":
        return (
          <BootMenu
            onComplete={() => send({ type: path === "live-usb" ? "LIVE_TRY" : "BOOT_SELECTED" })}
          />
        );
      case "live_welcome":
        return (
          <LiveWelcome
            config={cfg}
            onTry={() => send({ type: "LIVE_TRY" })}
            onInstall={() => send({ type: "LIVE_INSTALL" })}
          />
        );
      case "live_desktop":
        return (
          <LiveDesktop
            config={cfg}
            onInstallClick={() => send({ type: "LIVE_INSTALL" })}
          />
        );
      case "partitioning":
        return (
          <Partition onComplete={() => send({ type: "PARTITION_DONE" })} />
        );
      case "create_vm":
        return (
          <CreateVM config={cfg} onComplete={() => send({ type: "VM_CREATED" })} />
        );
      case "mount_iso":
        return (
          <MountISO config={cfg} onComplete={() => send({ type: "ISO_MOUNTED" })} />
        );
      case "vm_boot":
        return (
          <VmBoot
            config={cfg}
            speed={speed}
            onComplete={() => send({ type: "VM_POWERED_ON" })}
          />
        );
      case "installing":
        if (cfg.id === "arch") {
          return (
            <ArchInstall config={cfg} speed={speed} onComplete={() => send({ type: "INSTALL_DONE" })} />
          );
        }
        return (
          <Install config={cfg} speed={speed} onComplete={() => send({ type: "INSTALL_DONE" })} />
        );
      case "vm_close":
        return (
          <VmClose config={cfg} onComplete={() => send({ type: "VM_CLOSED" })} />
        );
      case "complete":
        return (
          <Done
            config={cfg}
            path={path ?? ""}
          />
        );
      default:
        console.warn(`[SimPage] UNKNOWN state: "${current}" — no scene to render`);
        return (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <div className="text-3xl mb-3">⚠️</div>
            <div className="text-sm">Unknown state: {current}</div>
            <div className="text-xs mt-1 text-white/20">Check console for details</div>
          </div>
        );
    }
  }

  function handleShowcaseDismiss() {
    sessionStorage.setItem("showcase_seen", "1");
    setShowcase(false);
  }

  const visibleScenes = SIM_SCENES.filter((s) => {
    if (s === "idle") return false;
    if (isVm) {
      if (PHYSICAL_ONLY.has(s)) return false;
      if (s === "partitioning") return false;
      if (s === "live_welcome" || s === "live_desktop") return false;
      return true;
    }
    if (VM_ONLY.has(s)) return false;
    if (s === "vm_close") return false;
    if (s === "partitioning" && path !== "dual-boot") return false;
    if (s === "live_welcome" && path !== "live-usb") return false;
    if (s === "live_desktop" && path !== "live-usb") return false;
    return true;
  });

  return (
    <ToastProvider>
      {showcase && <Showcase onDismiss={handleShowcaseDismiss} />}

      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl max-w-sm w-full"
            >
              <h3 className="text-lg font-bold text-white/90 mb-4">⌨ Keyboard shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Show this overlay</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">?</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Continue / Skip scene</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">Enter ↵</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Toggle speed run</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">S</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Toggle sound (mute/unmute)</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">M</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Close overlay</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">Esc</kbd>
                </div>
              </div>
              <p className="mt-4 text-xs text-white/30 text-center">
                Press <kbd className="font-mono text-white/50">?</kbd> or <kbd className="font-mono text-white/50">Esc</kbd> to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
      </div>
      <div className="dot-grid" aria-hidden />
      <svg className="noise-overlay" aria-hidden>
        <filter id="noise-sim">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-sim)" />
      </svg>

      <svg className="constellation-layer" aria-hidden viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <circle cx="150" cy="100" r="1.5" fill="#7c5cff" opacity="0.5" />
        <circle cx="400" cy="80" r="2" fill="#06b6d4" opacity="0.4" />
        <circle cx="650" cy="150" r="1.5" fill="#a855f7" opacity="0.4" />
        <circle cx="250" cy="300" r="1.8" fill="#7c5cff" opacity="0.3" />
        <circle cx="550" cy="350" r="2" fill="#06b6d4" opacity="0.3" />
        <circle cx="100" cy="450" r="1.5" fill="#a855f7" opacity="0.3" />
        <circle cx="700" cy="480" r="1.8" fill="#7c5cff" opacity="0.3" />
        <circle cx="400" cy="500" r="1.5" fill="#06b6d4" opacity="0.25" />
        <line x1="150" y1="100" x2="400" y2="80" stroke="#7c5cff" strokeWidth="0.4" opacity="0.12" />
        <line x1="400" y1="80" x2="650" y2="150" stroke="#06b6d4" strokeWidth="0.4" opacity="0.1" />
        <line x1="250" y1="300" x2="550" y2="350" stroke="#a855f7" strokeWidth="0.3" opacity="0.08" />
        <line x1="100" y1="450" x2="400" y2="500" stroke="#7c5cff" strokeWidth="0.3" opacity="0.08" />
        <line x1="550" y1="350" x2="700" y2="480" stroke="#06b6d4" strokeWidth="0.3" opacity="0.06" />
      </svg>

      <div className="vignette-overlay" aria-hidden />

      <div className="min-h-full flex flex-col relative z-0">
        <header className="mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] px-4 sm:px-6 py-3 sm:py-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xs sm:text-sm text-white/60 hover:text-white">
              ← OS Install Simulator
            </Link>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <button
                onClick={() => {
                  const now = toggleMute();
                  setMuted(now);
                }}
                className={`rounded-full border px-2.5 sm:px-3 py-1 text-xs sm:text-sm transition-colors ${
                  muted
                    ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
                title={muted ? "Unmute sounds (M)" : "Mute sounds (M)"}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <button
                onClick={() => {
                  setPresentationMode((p) => {
                    const next = !p;
                    if (next) {
                      document.documentElement.requestFullscreen?.().catch(() => {});
                    } else {
                      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                    }
                    return next;
                  });
                }}
                className={`rounded-full border px-2.5 sm:px-3 py-1 text-xs sm:text-sm transition-colors ${
                  presentationMode
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
                title="Presentation mode (fullscreen + auto-advance)"
              >
                🎬 present
              </button>
              <button
                onClick={() =>
                  send({ type: "SET_SPEED", speed: speed === "fast" ? "normal" : "fast" })
                }
                className={`rounded-full border px-2.5 sm:px-3 py-1 text-xs sm:text-sm transition-colors ${
                  speed === "fast"
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
                title="Speed run mode (S)"
              >
                ⏭ speed run
              </button>
              <button
                onClick={() => setShowShortcuts(true)}
                className="rounded-full border border-white/10 px-2 sm:px-2.5 py-1 text-xs sm:text-sm text-white/40 hover:text-white/70 transition-colors"
                title="Keyboard shortcuts (?)"
              >
                ?
              </button>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">{cfg.branding.logo}</span>
                <span className="font-semibold text-xs sm:text-sm">{cfg.branding.shortName}</span>
                <span className="text-white/40 hidden sm:inline">· {path}</span>
              </div>
            </div>
          </div>

          {/* Progress indicator — only shows scenes relevant to the current path */}
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-1">
            {visibleScenes.map((s) => {
              const idx = (SIM_SCENES as readonly string[]).indexOf(s);
              const active = idx === currentIndex;
              const done = idx < currentIndex;
              return (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm ${
                      active
                        ? "bg-accent text-white"
                        : done
                          ? "bg-white/10 text-white/70"
                          : "bg-white/5 text-white/35"
                    }`}
                  >
                    <span
                      className={`h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full ${
                        active ? "bg-white" : done ? "bg-emerald-400" : "bg-white/30"
                      }`}
                    />
                    <span className="hidden sm:inline">{SCENE_LABELS[s]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-1.5 sm:mt-2 min-h-[1rem] sm:min-h-[1.25rem] text-xs sm:text-sm text-white/40" key={`status-${current}`}>
            {STATUS_TEXT[current] ?? ""}
          </div>
        </header>

        {isFullscreen ? (
          <div className="flex-1" key={current}>
            <ErrorBoundary label={current}>
              {renderScene()}
            </ErrorBoundary>
          </div>
        ) : (
          <main className="mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] flex-1 px-3 sm:px-6 pb-6 sm:pb-8">
            <DesktopShell activeApp={activeApp}>
              <div className="w-full max-w-5xl" key={current}>
                <ErrorBoundary label={current}>
                  {renderScene()}
                </ErrorBoundary>
              </div>
            </DesktopShell>
          </main>
        )}

        <div className="px-4 sm:px-6 pb-3 sm:pb-4 text-center text-xs sm:text-sm text-white/30">
          Simulation only — no files are downloaded or executed.
        </div>

        {/* Scene context label */}
        <AnimatePresence>
          {sceneLabelVisible && (
            <motion.div
              key={sceneLabelKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-lg w-11/12"
            >
              <div className="glass rounded-xl p-4 text-center border border-white/10 shadow-lg shadow-black/20">
                <p className="text-sm text-white/80">{SCENE_CONTEXT[current]}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </ToastProvider>
  );
}
