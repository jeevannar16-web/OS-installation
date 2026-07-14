import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { playKeyClick } from "../shared/sounds";

const ENTRIES = [
  { id: "usb", label: "UEFI: Generic Flash Disk 8.0, Partition 1", correct: true },
  { id: "hdd", label: "Windows Boot Manager (Samsung SSD 980 PRO)", correct: false },
  { id: "net", label: "Network Boot: Realtek PXE B01 D00", correct: false },
  { id: "cd", label: "UEFI: CD/DVD Drive", correct: false },
];

export default function BootMenu({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [selected, setSelected] = useState(0);
  const [wrongFakeout, setWrongFakeout] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (wrongFakeout) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        playKeyClick();
        setSelected((p) => (p > 0 ? p - 1 : ENTRIES.length - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        playKeyClick();
        setSelected((p) => (p < ENTRIES.length - 1 ? p + 1 : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        playKeyClick();
        selectEntry(selected);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, wrongFakeout]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  function selectEntry(idx: number) {
    if (wrongFakeout) return;
    const entry = ENTRIES[idx];
    if (entry.correct) {
      onComplete();
    } else {
      setWrongFakeout(true);
      setTimeout(() => setWrongFakeout(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a1a] font-mono">
      {/* Fake-out overlay */}
      {wrongFakeout && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a1a]"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="text-3xl mb-3">🪟</div>
            <div className="text-sm text-white/60">Loading normal Windows…</div>
            <div className="mt-2 text-xs text-white/30">
              (Wrong selection — returning to menu)
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Title */}
      <div className="mb-6 sm:mb-8 text-center px-4">
        <div className="text-base sm:text-lg font-bold text-white/90 tracking-wider">
          BOOT MENU
        </div>
        <div className="mt-1 text-xs text-white/40">
          Select a boot device and press Enter
        </div>
      </div>

      {/* Boot entries */}
      <div className="w-full max-w-xl space-y-1 px-4">
        {ENTRIES.map((entry, i) => (
          <button
            key={entry.id}
            onClick={() => {
              setSelected(i);
              selectEntry(i);
            }}
            onMouseEnter={() => {
              if (!wrongFakeout) {
                playKeyClick();
                setSelected(i);
              }
            }}
            className={`w-full rounded px-4 py-3 text-left text-sm transition-colors ${
              selected === i
                ? "bg-white/15 text-white font-medium"
                : "text-white/60 hover:bg-white/5"
            }`}
          >
            <span className="mr-3 text-white/30">{selected === i ? "▶" : " "}</span>
            {entry.label}
            {entry.correct && (
              <span className="ml-2 text-[10px] text-emerald-400/60">(USB)</span>
            )}
          </button>
        ))}
      </div>

      {/* Footer bar */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 text-xs text-white/40">
        <span>↑↓ Select</span>
        <span>↵ Boot</span>
      </div>
    </div>
  );
}
