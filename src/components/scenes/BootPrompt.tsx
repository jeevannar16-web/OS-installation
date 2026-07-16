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

  // Countdown — if no keypress in ~5 seconds, boot fails
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

  // Animated dots
  useEffect(() => {
    const iv = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(iv);
  }, []);

  // Listen for any keypress
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      e.preventDefault();
      onComplete();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onComplete]);

  return (
    <div
      className="mx-auto w-full max-w-3xl bg-black rounded-lg overflow-hidden ring-1 ring-white/10 shadow-2xl"
      tabIndex={0}
    >
      <div className="min-h-[300px] flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="font-mono text-white text-sm leading-relaxed">
            <div className="mb-4">
              <span className="text-white/60">SanDisk Ultra Flair 16GB</span>
            </div>
            <div className="text-white text-base">
              Press any key to boot from USB{dots}
            </div>
            <div className="mt-6 text-white/30 text-xs">
              {5 - elapsed > 0 ? (
                <span>Waiting for input... ({5 - elapsed}s remaining)</span>
              ) : (
                <span className="text-red-400">No key pressed — boot device skipped</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
