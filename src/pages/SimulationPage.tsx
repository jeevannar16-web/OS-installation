import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { simulationMachine, SIM_SCENES } from "../machines/simulationMachine";
import { getOS } from "../data";
import Footer from "../components/Footer";

/** Maps a machine state to the event that advances it (used by the placeholder stepper). */
const NEXT_EVENT: Record<string, string> = {
  searching: "SEARCH_DONE",
  downloading: "DOWNLOAD_DONE",
  flashing_usb: "FLASH_DONE",
  rebooting: "REBOOT_DONE",
  boot_menu: "BOOT_SELECTED",
  partitioning: "PARTITION_DONE",
  installing: "INSTALL_DONE",
};

export default function SimulationPage() {
  const { os, path } = useParams();
  const navigate = useNavigate();
  const config = getOS(os);

  const [state, send] = useMachine(simulationMachine);

  // Kick off the simulation when the route resolves.
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

  const current = state.value as string;
  const progress = (SIM_SCENES as readonly string[]).indexOf(current);

  return (
    <div className="min-h-full flex flex-col">
      <header className="mx-auto w-full max-w-4xl px-6 py-6 flex items-center justify-between">
        <Link to="/" className="text-sm text-white/60 hover:text-white">
          ← OS Install Simulator
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">{config.branding.logo}</span>
          <span className="font-semibold">{config.branding.shortName}</span>
          <span className="text-white/40">· {path}</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 flex-1">
        <div className="glass rounded-2xl p-8">
          <div className="text-xs uppercase tracking-widest text-white/40">
            Scene {Math.max(progress, 1)} / {SIM_SCENES.length - 1}
          </div>
          <h1 className="text-2xl font-bold mt-2 capitalize">{current.replace("_", " ")}</h1>
          <p className="text-white/55 mt-3">
            Full interactive scenes for this state arrive in the next build step. The XState
            machine is wired and advancing correctly.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              className="btn-primary"
              disabled={current === "complete"}
              onClick={() =>
                send({ type: NEXT_EVENT[current] as never } as never)
              }
            >
              {current === "complete" ? "Done ✓" : "Advance scene →"}
            </button>
            <button className="btn-ghost" onClick={() => send({ type: "RESET" })}>
              Restart
            </button>
            <button className="btn-ghost" onClick={() => navigate("/")}>
              Exit
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
