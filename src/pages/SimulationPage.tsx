import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { motion, AnimatePresence } from "framer-motion";
import { simulationMachine, SIM_SCENES } from "../machines/simulationMachine";
import { getOS } from "../data";
import { ToastProvider } from "../components/shared/Toast";
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

export default function SimulationPage() {
  const { os, path } = useParams();
  const config = getOS(os);

  const [state, send] = useMachine(simulationMachine);
  const [showcase, setShowcase] = useState(() => {
    return !sessionStorage.getItem("showcase_seen");
  });
  const [showShortcuts, setShowShortcuts] = useState(false);

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
    switch (current) {
      case "searching":
        return (
          <FakeBrowser
            config={cfg}
            speed={speed}
            onComplete={() => send({ type: "SEARCH_DONE" })}
          />
        );
      case "downloading":
        return <FileManager config={cfg} onComplete={() => send({ type: "DOWNLOAD_DONE" })} />;
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
        return (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <div className="text-3xl mb-3">⏳</div>
            <div className="text-sm">Loading next step…</div>
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
              <h3 className="text-lg font-bold text-white/90 mb-4">⌨ Keyboard Shortcuts</h3>
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
        <header className="mx-auto w-full max-w-5xl px-6 py-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-sm text-white/60 hover:text-white">
              ← OS Install Simulator
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <button
                onClick={() =>
                  send({ type: "SET_SPEED", speed: speed === "fast" ? "normal" : "fast" })
                }
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
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
                className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/40 hover:text-white/70 transition-colors"
                title="Keyboard shortcuts (?)"
              >
                ?
              </button>
              <div className="flex items-center gap-2">
                <span className="text-lg">{cfg.branding.logo}</span>
                <span className="font-semibold">{cfg.branding.shortName}</span>
                <span className="text-white/40">· {path}</span>
              </div>
            </div>
          </div>

          {/* Progress indicator — only shows scenes relevant to the current path */}
          <div className="mt-4 flex flex-wrap items-center gap-1">
            {visibleScenes.map((s) => {
              const idx = (SIM_SCENES as readonly string[]).indexOf(s);
              const active = idx === currentIndex;
              const done = idx < currentIndex;
              return (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
                      active
                        ? "bg-accent text-white"
                        : done
                          ? "bg-white/10 text-white/70"
                          : "bg-white/5 text-white/35"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-white" : done ? "bg-emerald-400" : "bg-white/30"
                      }`}
                    />
                    {SCENE_LABELS[s]}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 min-h-[1.25rem] text-xs text-white/40" key={`status-${current}`}>
            {STATUS_TEXT[current] ?? ""}
          </div>
        </header>

        {isFullscreen ? (
          <div className="flex-1" key={current}>
            {renderScene()}
          </div>
        ) : (
          <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-8">
            <DesktopShell activeApp={activeApp}>
              <div className="w-full max-w-4xl" key={current}>
                {renderScene()}
              </div>
            </DesktopShell>
          </main>
        )}

        <div className="px-6 pb-4 text-center text-[11px] text-white/30">
          Simulation only — no files are downloaded or executed.
        </div>

        <Footer />
      </div>
    </ToastProvider>
  );
}
