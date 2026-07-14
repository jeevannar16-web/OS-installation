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
  installing: "Installing the operating system…",
  vm_close: "Closing the virtual machine…",
  complete: "Installation complete!",
};

const REPO_URL = "https://github.com/jeevannar16-web/OS-installation";

export default function SimulationPage() {
  const { os, path } = useParams();
  const config = getOS(os);

  const [state, send] = useMachine(simulationMachine);
  const [showcase, setShowcase] = useState(() => {
    return !sessionStorage.getItem("showcase_seen");
  });

  useEffect(() => {
    if (config && path && state.matches("idle")) {
      send({ type: "START", osId: config.id, path: path as never });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const current = String(state.value);
  const currentIndex = (SIM_SCENES as readonly string[]).indexOf(current);
  const speed = state.context.speed;
  const cfg = config;
  const activeApp = ACTIVE_APP[current] ?? { name: "OS Simulator", icon: "💿" };
  const isFullscreen = FULLSCREEN_SCENES.has(current);

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
          <FlashUSB config={cfg} speed={speed} onComplete={() => send({ type: "FLASH_DONE" })} />
        );
      case "usb_reinsert":
        return (
          <UsbReinsert onComplete={() => send({ type: "USB_INSERTED" })} />
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
      case "installing":
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
            onComplete={() => send({ type: "RESET" })}
          />
        );
      default:
        return null;
    }
  }

  function handleShowcaseDismiss() {
    sessionStorage.setItem("showcase_seen", "1");
    setShowcase(false);
  }

  // Filter scenes based on path
  const visibleScenes = SIM_SCENES.filter((s) => {
    if (s === "idle") return false;
    if (s === "partitioning" && path !== "dual-boot") return false;
    if (s === "live_welcome" && path !== "live-usb") return false;
    if (s === "live_desktop" && path !== "live-usb") return false;
    if (s === "vm_close" && path !== "vm") return false;
    return true;
  });

  return (
    <ToastProvider>
      {showcase && <Showcase onDismiss={handleShowcaseDismiss} />}

      <div className="min-h-full flex flex-col">
        {/* Header */}
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
                title="Speed run mode"
              >
                ⏭ speed run
              </button>
              <div className="flex items-center gap-2">
                <span className="text-lg">{cfg.branding.logo}</span>
                <span className="font-semibold">{cfg.branding.shortName}</span>
                <span className="text-white/40">· {path}</span>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
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

          {/* What's happening now */}
          <div className="mt-2 min-h-[1.25rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-white/40"
              >
                {STATUS_TEXT[current] ?? ""}
              </motion.div>
            </AnimatePresence>
          </div>
        </header>

        {/* Main content */}
        {isFullscreen ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {renderScene()}
            </motion.div>
          </AnimatePresence>
        ) : (
          <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-8">
            <DesktopShell activeApp={activeApp}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-4xl"
                >
                  {renderScene()}
                </motion.div>
              </AnimatePresence>
            </DesktopShell>
          </main>
        )}

        <div className="px-6 pb-2 text-center text-[11px] text-white/30">
          Simulation only — no files are downloaded or executed.
        </div>

        {/* Persistent GitHub footer */}
        <div className="flex justify-center gap-2 pb-4">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
          >
            ⭐ Star on GitHub
          </a>
          <span className="text-white/10">·</span>
          <a
            href="https://github.com/jeevannar16-web"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
          >
            Follow @jeevannar16-web
          </a>
        </div>

        <Footer />
      </div>
    </ToastProvider>
  );
}
