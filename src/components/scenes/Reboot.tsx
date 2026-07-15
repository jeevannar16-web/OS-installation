import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { getRandomBios } from "../../data/bios";
import { playPostBeep, playKeyClick, playSuccess } from "../shared/sounds";
import { Tooltip, PulseHint } from "../shared/InteractiveEffects";

type RebootPhase = "flicker" | "fade_out" | "post" | "memory" | "prompt" | "missed" | "done";

export default function Reboot({
  speed,
  onComplete,
}: {
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const bios = useMemo(() => getRandomBios(), []);
  const [phase, setPhase] = useState<RebootPhase>("flicker");
  const [memCount, setMemCount] = useState(0);
  const [countdown, setCountdown] = useState(3);

  const flickerDur = 200;
  const fadeDur = speed === "fast" ? 300 : 600;
  const postDur = speed === "fast" ? 400 : bios.postDelay;
  const memDur = speed === "fast" ? 400 : 1000;

  useEffect(() => {
    const t = setTimeout(() => setPhase("fade_out"), flickerDur);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "fade_out") return;
    const t = setTimeout(() => {
      setPhase("post");
      playPostBeep();
    }, fadeDur);
    return () => clearTimeout(t);
  }, [phase, fadeDur]);

  useEffect(() => {
    if (phase !== "post") return;
    const t = setTimeout(() => setPhase("memory"), postDur);
    return () => clearTimeout(t);
  }, [phase, postDur]);

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

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "F12" && phase === "prompt") {
        e.preventDefault();
        playKeyClick();
        setPhase("done");
        playSuccess();
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
      {phase === "flicker" && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.2, 0.8, 0.1, 0.9, 0] }}
          transition={{ duration: flickerDur / 1000 }}
          className="absolute inset-0 bg-white"
        />
      )}

      {phase === "fade_out" && (
        <div className="absolute inset-0 bg-black opacity-0" />
      )}

      {phase === "post" && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl">{bios.logo}</div>
          <div className="text-xs sm:text-sm lg:text-base font-bold tracking-widest text-white/70">
            {bios.name}
          </div>
          <div className="text-[10px] sm:text-xs lg:text-sm text-white/40">{bios.memLabel}</div>
          <div className="mt-2 text-xs sm:text-sm text-white/30">Initializing hardware…</div>
        </div>
      )}

      {phase === "memory" && (
        <div className="font-mono text-sm text-white/70">
          <div>Memory Test: {Math.floor(memCount)} MB OK</div>
          <div className="mt-2 h-1 w-48 overflow-hidden rounded bg-white/10">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-30"
              style={{ width: `${(memCount / 16384) * 100}%` }}
            />
          </div>
        </div>
      )}

      {phase === "prompt" && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl">{bios.logo}</div>
          <div className="font-mono text-center space-y-1">
            <div className="text-sm sm:text-base lg:text-lg text-white/70">
              Press <span className="font-bold text-white">F2</span> to enter Setup,{" "}
              <span className="font-bold text-white">F12</span> for Boot Menu
            </div>
            <div className="text-xs sm:text-sm lg:text-base text-white/40">
              {countdown}s remaining
            </div>
          </div>
          <PulseHint>
            <Tooltip text="Press F12 key or click to enter boot menu — you have 3 seconds!">
              <button
                onClick={() => {
                  playKeyClick();
                  setPhase("done");
                  playSuccess();
                  onComplete();
                }}
                className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                Press F12 (or click here)
              </button>
            </Tooltip>
          </PulseHint>
        </div>
      )}

      {phase === "missed" && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl lg:text-5xl mb-3">🪟</div>
            <div className="text-sm sm:text-base lg:text-lg text-white/60">Booting to Windows Boot Manager…</div>
            <div className="mt-2 text-xs sm:text-sm lg:text-base text-white/40">
              (Wrong boot device — you need to catch F12!)
            </div>
          </div>
          <button
            onClick={() => {
              setCountdown(3);
              setMemCount(0);
              setPhase("post");
              playPostBeep();
            }}
            className="rounded-xl bg-white/10 border border-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
          >
            🔄 Reboot Again
          </button>
        </div>
      )}
    </div>
  );
}
