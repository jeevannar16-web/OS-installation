import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { motion, AnimatePresence } from "framer-motion";
import { simulationMachine, SIM_SCENES } from "../machines/simulationMachine";
import { getOS } from "../data";
import { ToastProvider } from "../components/shared/Toast";
import Footer from "../components/Footer";
import DesktopShell, { type AppInfo } from "../components/shell/DesktopShell";
import FakeBrowser from "../components/scenes/FakeBrowser";
import FileManager from "../components/scenes/FileManager";
import FlashUSB from "../components/scenes/FlashUSB";
import Reboot from "../components/scenes/Reboot";
import BootMenu from "../components/scenes/BootMenu";
import Partition from "../components/scenes/Partition";
import Install from "../components/scenes/Install";
import Done from "../components/scenes/Done";

const SCENE_LABELS: Record<string, string> = {
  idle: "Start",
  searching: "Search & Download",
  downloading: "Locate ISO",
  flashing_usb: "Flash USB",
  rebooting: "Reboot",
  boot_menu: "Boot Menu",
  partitioning: "Partition",
  installing: "Install",
  complete: "Done",
};

const ACTIVE_APP: Record<string, AppInfo> = {
  searching: { name: "Browser", icon: "🌐" },
  downloading: { name: "Files", icon: "📁" },
  flashing_usb: { name: "USB Tool", icon: "🔌" },
  rebooting: { name: "System", icon: "⏻" },
  boot_menu: { name: "Boot Menu", icon: "💻" },
  partitioning: { name: "Installer", icon: "🧩" },
  installing: { name: "Installer", icon: "🧩" },
  complete: { name: "Done", icon: "🎉" },
};

/** Scenes that render fullscreen without the desktop shell. */
const FULLSCREEN_SCENES = new Set(["rebooting", "boot_menu"]);

export default function SimulationPage() {
  const { os, path } = useParams();
  const config = getOS(os);

  const [state, send] = useMachine(simulationMachine);

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
          <FlashUSB
            config={cfg}
            speed={speed}
            onComplete={() => send({ type: "FLASH_DONE" })}
          />
        );
      case "rebooting":
        return (
          <Reboot
            speed={speed}
            onComplete={() => send({ type: "REBOOT_DONE" })}
          />
        );
      case "boot_menu":
        return (
          <BootMenu
            onComplete={() => send({ type: path === "live-usb" ? "LIVE_DONE" : "BOOT_SELECTED" })}
          />
        );
      case "partitioning":
        return (
          <Partition
            onComplete={() => send({ type: "PARTITION_DONE" })}
          />
        );
      case "installing":
        return (
          <Install
            config={cfg}
            speed={speed}
            onComplete={() => send({ type: "INSTALL_DONE" })}
          />
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

  return (
    <ToastProvider>
      <div className="min-h-full flex flex-col">
        {/* Header — always visible */}
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
                title="Speed run mode (off by default)"
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

          {/* Progress indicator — always visible */}
          <div className="mt-4 flex flex-wrap items-center gap-1">
            {SIM_SCENES.filter((s) => {
              if (s === "idle") return false;
              if (s === "partitioning" && path !== "dual-boot") return false;
              return true;
            }).map((s) => {
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
          Simulation only — no files are downloaded or executed. For the real thing, use the
          official links at the end.
        </div>

        <Footer />
      </div>
    </ToastProvider>
  );
}
