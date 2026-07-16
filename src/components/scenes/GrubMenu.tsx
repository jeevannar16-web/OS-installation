import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSceneAdvance } from "../shared/SceneAdvance";

const ENTRIES = [
  { label: "Ubuntu", sub: "Kernel 6.8.0-41-generic" },
  { label: "Advanced options for Ubuntu", sub: "" },
  { label: "Windows Boot Manager", sub: "On /dev/sda1" },
  { label: "UEFI Firmware Settings", sub: "" },
];

type Phase = "menu" | "windows_booting" | "windows_desktop";

export default function GrubMenu({ onComplete }: { onComplete: () => void }) {
  const { register: registerAdvance } = useSceneAdvance();
  const [selected, setSelected] = useState(0);
  const [countdown, setCountdown] = useState(10);
  const [phase, setPhase] = useState<Phase>("menu");

  useEffect(() => {
    registerAdvance(() => {
      if (phase === "menu") onComplete();
    });
  }, [registerAdvance, onComplete, phase]);

  // Keyboard navigation
  useEffect(() => {
    if (phase !== "menu") return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => (s > 0 ? s - 1 : ENTRIES.length - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => (s < ENTRIES.length - 1 ? s + 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selected === 0) onComplete();
        else if (selected === 2) setPhase("windows_booting");
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, onComplete, phase]);

  // Countdown
  useEffect(() => {
    if (phase !== "menu") return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onComplete, phase]);

  // Windows booting phase
  useEffect(() => {
    if (phase === "windows_booting") {
      const t = setTimeout(() => setPhase("windows_desktop"), 2500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === "windows_booting") {
    return (
      <div className="rounded-2xl border border-white/10 bg-black p-8 text-center shadow-2xl backdrop-blur-xl w-full max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="text-6xl">🪟</div>
          <div className="text-white/80 text-lg font-semibold">Windows 11</div>
          <div className="flex justify-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="h-1 w-1 rounded-full bg-white/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
          <div className="text-xs text-white/30 font-mono">Loading Windows…</div>
        </motion.div>
      </div>
    );
  }

  if (phase === "windows_desktop") {
    return (
      <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl w-full max-w-2xl mx-auto">
        {/* Windows desktop */}
        <div
          className="relative h-[400px]"
          style={{ background: "linear-gradient(135deg, #0078D4, #005a9e, #003f7f)" }}
        >
          {/* Desktop icons */}
          <div className="absolute inset-0 p-6">
            <div className="grid grid-cols-2 gap-3 w-fit">
              {[
                { icon: "📁", label: "File Explorer" },
                { icon: "🌐", label: "Microsoft Edge" },
                { icon: "⚙️", label: "Settings" },
                { icon: "🗑️", label: "Recycle Bin" },
              ].map((d) => (
                <div key={d.label} className="flex flex-col items-center gap-1 rounded p-2 hover:bg-white/10 cursor-pointer">
                  <span className="text-2xl">{d.icon}</span>
                  <span className="text-[10px] text-white/80 bg-black/30 px-1 rounded">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Windows taskbar */}
          <div className="absolute bottom-0 inset-x-0 h-10 bg-black/80 border-t border-white/10 flex items-center px-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="text-lg">🪟</span>
              <span className="text-xs text-white/70 font-semibold">Windows 11</span>
            </div>
            <div className="ml-auto text-xs text-white/40 font-mono">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          {/* Booted into Windows notice */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 rounded-lg px-4 py-2 backdrop-blur border border-white/10">
            <div className="text-xs text-white/70 text-center">
              ✅ You booted into <span className="font-bold text-white/90">Windows 11</span> from GRUB!
              <br />
              <span className="text-white/40">This confirms dual-boot is working.</span>
            </div>
          </div>
        </div>

        {/* Back to GRUB button */}
        <div className="bg-[#1a1a2e] p-4 text-center">
          <button
            onClick={() => setPhase("menu")}
            className="rounded-xl bg-white/10 border border-white/10 px-6 py-3 text-sm font-bold text-white/80 hover:bg-white/20 transition-colors"
          >
            🔄 Restart to GRUB menu
          </button>
        </div>
      </div>
    );
  }

  // GRUB menu phase
  return (
    <div className="rounded-2xl border border-white/10 bg-black/80 p-6 font-mono text-sm shadow-2xl backdrop-blur-xl w-full max-w-2xl mx-auto">
      {/* GRUB header */}
      <div className="border-b border-white/10 pb-3 mb-4">
        <div className="text-white/60 text-xs mb-2">GNU GRUB version 2.12</div>
        <div className="text-white/40 text-xs leading-relaxed">
          Use the ↑ and ↓ keys to select which entry is highlighted.
          <br />
          Press enter to boot the selected OS, 'e' to edit the commands
          <br />
          before booting, or 'c' for a command-line.
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-1 mb-4">
        {ENTRIES.map((entry, i) => (
          <div
            key={i}
            onClick={() => {
              setSelected(i);
              if (i === 0) onComplete();
              else if (i === 2) setPhase("windows_booting");
            }}
            className={`rounded px-3 py-2 cursor-pointer transition-colors ${
              i === selected
                ? "bg-white/90 text-black"
                : "text-white/70 hover:bg-white/10"
            }`}
          >
            <div className="font-bold">{entry.label}</div>
            {entry.sub && (
              <div
                className={`text-xs mt-0.5 ${
                  i === selected ? "text-black/60" : "text-white/30"
                }`}
              >
                {entry.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Countdown */}
      <div className="border-t border-white/10 pt-3 text-center">
        <span className="text-white/40 text-xs">
          The highlighted entry will be executed automatically in{" "}
          <span className="text-white/70 font-bold">{countdown}</span> seconds.
        </span>
      </div>
    </div>
  );
}
