import { useEffect, useState } from "react";
import type { OSConfig } from "../../data/types";
import { playSuccess, playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";


const SUPPORTED_TOOLS = new Set(["rufus", "ventoy", "balena"]);

/* ── Shared progress hook ── */
function useFlashProgress(phase: string, dur: number, onDone: () => void) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (phase !== "flashing") return;
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / dur) * 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
      else { playSuccess(); onDone(); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  return progress;
}

/* ═══════════════════════════════════════════════════════════════
   TOOL BASE — screenshot-based tool UI with progress overlay
   ═══════════════════════════════════════════════════════════════ */
function ToolScreenshot({
  image,
  name,
  config,
  speed,
  onComplete,
}: {
  image: string;
  name: string;
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [phase, setPhase] = useState<"idle" | "flashing" | "done">("idle");
  const dur = speed === "fast" ? 1500 : 4000;
  const progress = useFlashProgress(phase, dur, () => setPhase("done"));

  useEffect(() => {
    if (phase === "done") registerAdvance(() => onComplete());
  }, [phase, registerAdvance, onComplete]);

  return (
    <div className="mx-auto w-full max-w-3xl rounded-lg overflow-hidden shadow-2xl shadow-black/50 relative">
      <img src={image} alt={name} className="w-full h-auto" />

      {/* Overlay for flashing */}
      {phase === "flashing" && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4">
          <div className="w-64 h-3 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400 transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
          <div className="text-white text-lg font-bold">{Math.floor(progress)}%</div>
        </div>
      )}

      {/* Done overlay */}
      {phase === "done" && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center">
            <span className="text-3xl text-emerald-400">✓</span>
          </div>
          <div className="text-white text-lg font-bold">Flash Complete!</div>
          <button
            onClick={() => { playClick(); onComplete(); }}
            className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition-colors"
          >
            Continue →
          </button>
        </div>
      )}

      {/* START button overlay */}
      {phase === "idle" && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex justify-center">
          <button
            onClick={() => { playClick(); setPhase("flashing"); }}
            className="rounded-lg bg-accent px-8 py-2.5 text-sm font-bold text-white hover:bg-accent-soft transition-colors shadow-lg"
          >
            START — Flash {config.iso.filename}
          </button>
        </div>
      )}
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════════
   MAIN FlashUSB COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function FlashUSB({
  config,
  speed,
  onComplete,
  setRufusPartitionScheme,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
  setRufusPartitionScheme: (v: "GPT" | "MBR") => void;
}) {
  const [tool, setTool] = useState<"select" | "rufus" | "ventoy" | "balena" | "unsupported">("select");

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl space-y-4">
      {tool === "select" && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="text-sm lg:text-base uppercase tracking-widest text-white/40">Step 1</div>
            <h2 className="mt-1 text-xl lg:text-2xl xl:text-3xl font-bold text-white text-center">Choose your flashing tool</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {config.flashers.map((t) => {
              const ok = SUPPORTED_TOOLS.has(t.id);
              const isRufus = t.id === "rufus";
              const isVentoy = t.id === "ventoy";
              const isEtcher = t.id === "balena";
              return (
                <button key={t.id} onClick={() => { playClick(); setTool(t.id === "rufus" || t.id === "ventoy" || t.id === "balena" ? t.id : "unsupported"); }}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 lg:p-6 text-center transition-all hover:bg-white/10 group">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
                    {isRufus && <img src="/images/flash-tools/rufus.jpg" alt="Rufus" className="w-full h-full object-cover" />}
                    {isVentoy && <img src="/images/flash-tools/ventoy.png" alt="Ventoy" className="w-full h-full object-cover" />}
                    {isEtcher && <img src="/images/flash-tools/etcher.jpg" alt="BalenaEtcher" className="w-full h-full object-cover" />}
                    {!isRufus && !isVentoy && !isEtcher && <div className="w-full h-full flex items-center justify-center text-2xl bg-white/5">🔧</div>}
                  </div>
                  <div className="text-sm lg:text-base font-bold text-white/90">{t.name}</div>
                  <div className="mt-1 text-xs lg:text-sm text-white/50">{t.note}</div>
                  {!ok && <div className="mt-2 text-xs lg:text-sm text-amber-400/80 font-medium">Coming soon</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ PHASE 3: Tool UI ═══ */}
      {tool === "rufus" && (
        <div className="space-y-4">
          <button onClick={() => { playClick(); setTool("select"); }} className="text-sm text-white/50 hover:text-white">← Back to tools</button>
          <ToolScreenshot image="/images/flash-tools/rufus-screenshot.png" name="Rufus" config={config} speed={speed} onComplete={() => { setRufusPartitionScheme("GPT"); onComplete(); }} />
        </div>
      )}
      {tool === "ventoy" && (
        <div className="space-y-4">
          <button onClick={() => { playClick(); setTool("select"); }} className="text-sm text-white/50 hover:text-white">← Back to tools</button>
          <ToolScreenshot image="/images/flash-tools/ventoy-screenshot.png" name="Ventoy" config={config} speed={speed} onComplete={onComplete} />
        </div>
      )}
      {tool === "balena" && (
        <div className="space-y-4">
          <button onClick={() => { playClick(); setTool("select"); }} className="text-sm text-white/50 hover:text-white">← Back to tools</button>
          <ToolScreenshot image="/images/flash-tools/etcher-screenshot.png" name="balenaEtcher" config={config} speed={speed} onComplete={onComplete} />
        </div>
      )}
      {tool === "unsupported" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <div className="text-lg font-semibold text-amber-300">Tool not yet supported</div>
          <p className="mt-2 text-sm text-white/50">Please use <strong>Rufus</strong>, <strong>Ventoy</strong>, or <strong>BalenaEtcher</strong>.</p>
          <button onClick={() => { playClick(); setTool("select"); }} className="mt-4 rounded-lg bg-white/10 px-5 py-2 text-sm font-medium text-white hover:bg-white/15">← Choose a different tool</button>
        </div>
      )}
    </div>
  );
}
