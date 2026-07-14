import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type RebootPhase = "fade_out" | "post" | "memory" | "prompt" | "missed" | "done";

export default function Reboot({
  speed,
  onComplete,
}: {
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<RebootPhase>("fade_out");
  const [memCount, setMemCount] = useState(0);
  const [countdown, setCountdown] = useState(3);

  const fadeDur = speed === "fast" ? 400 : 800;
  const postDur = speed === "fast" ? 600 : 1500;
  const memDur = speed === "fast" ? 500 : 1200;

  // Fade out desktop
  useEffect(() => {
    const t = setTimeout(() => setPhase("post"), fadeDur);
    return () => clearTimeout(t);
  }, [fadeDur]);

  // POST screen
  useEffect(() => {
    if (phase !== "post") return;
    const t = setTimeout(() => setPhase("memory"), postDur);
    return () => clearTimeout(t);
  }, [phase, postDur]);

  // Memory count
  useEffect(() => {
    if (phase !== "memory") return;
    const target = 16384;
    const step = target / (memDur / 30);
    const interval = setInterval(() => {
      setMemCount((prev) => {
        const next = prev + step;
        if (next >= target) {
          clearInterval(interval);
          setTimeout(() => setPhase("prompt"), 200);
          return target;
        }
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [phase, memDur]);

  // Countdown
  useEffect(() => {
    if (phase !== "prompt") return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => setPhase("missed"), 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Key handler for F12
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "F12" && phase === "prompt") {
        e.preventDefault();
        setPhase("done");
        onComplete();
      }
    },
    [phase, onComplete]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <AnimatePresence mode="wait">
        {/* Fade-out: just black */}
        {phase === "fade_out" && (
          <motion.div
            key="fade"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: fadeDur / 1000 }}
            className="absolute inset-0 bg-black"
          />
        )}

        {/* POST screen */}
        {phase === "post" && (
          <motion.div
            key="post"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="text-5xl">💻</div>
            <div className="text-sm font-bold tracking-widest text-white/70">
              MOTHERBOARD MANUFACTURER
            </div>
            <div className="text-xs text-white/40">Initializing hardware…</div>
          </motion.div>
        )}

        {/* Memory count */}
        {phase === "memory" && (
          <motion.div
            key="memory"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-mono text-sm text-white/70"
          >
            <div>Memory Test: {Math.floor(memCount)} MB OK</div>
            <div className="mt-2 h-1 w-48 overflow-hidden rounded bg-white/10">
              <motion.div
                className="h-full bg-emerald-500"
                animate={{ width: `${(memCount / 16384) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        {/* Boot prompt with F12 */}
        {phase === "prompt" && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="text-5xl">💻</div>
            <div className="font-mono text-center space-y-1">
              <div className="text-sm text-white/70">
                Press <span className="font-bold text-white">F2</span> to enter Setup,{" "}
                <span className="font-bold text-white">F12</span> for Boot Menu
              </div>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-xs text-white/40"
              >
                {countdown}s remaining
              </motion.div>
            </div>
            <button
              onClick={() => {
                setPhase("done");
                onComplete();
              }}
              className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              Press F12 (or click here)
            </button>
          </motion.div>
        )}

        {/* Missed: fake boot into Windows */}
        {phase === "missed" && (
          <motion.div
            key="missed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="text-4xl mb-3">🪟</div>
              <div className="text-sm text-white/60">Booting to Windows Boot Manager…</div>
              <div className="mt-2 text-xs text-white/40">
                (This is the wrong boot device — you need to catch F12!)
              </div>
            </motion.div>
            <button
              onClick={() => {
                setCountdown(3);
                setMemCount(0);
                setPhase("post");
              }}
              className="rounded-xl bg-white/10 border border-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
            >
              🔄 Reboot Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
