import { useEffect, useState } from "react";
import { useSceneAdvance } from "../shared/SceneAdvance";

const ENTRIES = [
  { label: "Ubuntu", sub: "Kernel 6.8.0-41-generic" },
  { label: "Advanced options for Ubuntu", sub: "" },
  { label: "Windows Boot Manager", sub: "On /dev/sda1" },
  { label: "UEFI Firmware Settings", sub: "" },
];

export default function GrubMenu({ onComplete }: { onComplete: () => void }) {
  const { register: registerAdvance } = useSceneAdvance();
  const [selected, setSelected] = useState(0);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    registerAdvance(() => onComplete());
  }, [registerAdvance, onComplete]);

  // Keyboard navigation
  useEffect(() => {
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
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selected, onComplete]);

  // Countdown
  useEffect(() => {
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
  }, [onComplete]);

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
