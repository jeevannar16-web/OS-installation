import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { motion, AnimatePresence } from "framer-motion";
import { simulationMachine, SIM_SCENES } from "../machines/simulationMachine";
import { getOS } from "../data";
import Footer from "../components/Footer";
import FakeBrowser from "../components/scenes/FakeBrowser";
import FileManager from "../components/scenes/FileManager";

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

const NEXT_EVENT: Record<string, string> = {
  searching: "SEARCH_DONE",
  downloading: "DOWNLOAD_DONE",
  flashing_usb: "FLASH_DONE",
  rebooting: "REBOOT_DONE",
  boot_menu: "BOOT_SELECTED",
  partitioning: "PARTITION_DONE",
  installing: "INSTALL_DONE",
};

function Placeholder({ label, onNext }: { label: string; onNext?: () => void }) {
  return (
    <div className="glass rounded-2xl p-10 text-center">
      <div className="text-xs uppercase tracking-widest text-white/40">Scene</div>
      <h1 className="mt-2 text-2xl font-bold capitalize">{label.replace(/_/g, " ")}</h1>
      <p className="mt-3 text-white/55">
        This scene is coming in a later build step. The flow and state machine are already wired.
      </p>
      {onNext && (
        <button className="btn-primary mt-6" onClick={onNext}>
          Advance scene →
        </button>
      )}
    </div>
  );
}

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
  const nextEvent = NEXT_EVENT[current];
  const cfg = config;

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
      default:
        return (
          <Placeholder
            label={current}
            onNext={nextEvent ? () => send({ type: nextEvent as never }) : undefined}
          />
        );
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="mx-auto w-full max-w-4xl px-6 py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-white/60 hover:text-white">
            ← OS Install Simulator
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">{config.branding.logo}</span>
            <span className="font-semibold">{config.branding.shortName}</span>
            <span className="text-white/40">· {path}</span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-4 flex flex-wrap items-center gap-1">
          {SIM_SCENES.filter((s) => s !== "idle").map((s, i) => {
            const idx = i + 1;
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
                {idx < SIM_SCENES.length - 1 && <span className="text-white/20">›</span>}
              </div>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {renderScene()}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="px-6 pb-2 text-center text-[11px] text-white/30">
        Simulation only — no files are downloaded or executed. For the real thing, use the
        official links at the end.
      </div>

      <Footer />
    </div>
  );
}
