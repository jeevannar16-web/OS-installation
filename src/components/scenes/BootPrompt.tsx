import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function BootPrompt({
  onComplete,
  onError,
}: {
  onComplete: () => void;
  onError: () => void;
}) {
  const [dots, setDots] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setElapsed((e) => {
        if (e >= 5) {
          clearInterval(iv);
          onError();
          return e;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [onError]);

  useEffect(() => {
    const iv = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      e.preventDefault();
      onComplete();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onComplete]);

  return (
    <div className="mx-auto w-full max-w-4xl" tabIndex={0}>
      {/* Monitor frame */}
      <div className="rounded-2xl overflow-hidden ring-2 ring-white/10 shadow-[0_0_60px_-15px_rgba(0,0,0,0.8)]">
        {/* Bezel */}
        <div className="bg-[#1a1a1a] px-6 py-3 flex items-center gap-3 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-[10px] text-white/20 font-mono tracking-wider">POST — SanDisk Ultra Flair 16GB</span>
        </div>

        {/* Screen */}
        <div className="bg-black min-h-[360px] flex flex-col items-center justify-center p-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            {/* Device label */}
            <div className="font-mono text-white/40 text-sm tracking-wide">
              SanDisk Ultra Flair 16GB
            </div>

            {/* Main prompt */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-mono text-white text-xl sm:text-2xl font-medium tracking-wide"
            >
              Press any key to boot from USB{dots}
            </motion.div>

            {/* Countdown */}
            <div className="h-8 flex items-center justify-center">
              {5 - elapsed > 0 ? (
                <div className="space-y-2">
                  <div className="text-white/30 text-sm font-mono">
                    Waiting for input... ({5 - elapsed}s remaining)
                  </div>
                  {/* Countdown bar */}
                  <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mx-auto">
                    <motion.div
                      className="h-full bg-white/30 rounded-full"
                      initial={{ width: "100%" }}
                      animate={{ width: `${((5 - elapsed) / 5) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-base font-mono font-medium"
                >
                  No key pressed — boot device skipped
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hint */}
      <div className="mt-4 text-center text-xs text-white/25 font-mono">
        Press any key to continue booting from USB
      </div>
    </div>
  );
}
