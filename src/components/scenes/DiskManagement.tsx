import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playClick, playSuccess } from "../shared/sounds";
import { PulseHint } from "../shared/InteractiveEffects";

export default function DiskManagement({
  onComplete,
  setDiskShrunk,
}: {
  onComplete: () => void;
  setDiskShrunk: (v: boolean) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "shrinking" | "shrunk">("idle");
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [showModal, setShowModal] = useState(false);
  const [shrinkAmount, setShrinkAmount] = useState("30720"); // 30 GB in MB
  const [progress, setProgress] = useState(0);

  const cDriveRef = useRef<HTMLDivElement>(null);

  function handleRightClick(e: React.MouseEvent) {
    e.preventDefault();
    if (phase !== "idle") return;
    playClick();
    
    // Get mouse position relative to container
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setShowContextMenu(true);
  }

  // Close context menu when clicking outside
  useEffect(() => {
    function close() {
      setShowContextMenu(false);
    }
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  function handleShrinkClick() {
    playClick();
    setShowContextMenu(false);
    setShowModal(true);
  }

  function executeShrink() {
    playClick();
    setShowModal(false);
    setPhase("shrinking");
    setProgress(0);

    const duration = 2500;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        playSuccess();
        setPhase("shrunk");
        setDiskShrunk(true);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Windows Disk Management</h2>
        <p className="mt-2 text-sm text-white/50">
          Before rebooting into Linux, you must shrink your existing Windows partition to create space.
        </p>
        <PulseHint>
          <span className="mt-1 inline-block text-xs text-accent/85 font-semibold">
            👉 Right-click the (C:) drive volume box below to shrink it.
          </span>
        </PulseHint>
      </div>

      <div className="relative rounded-xl border border-white/10 bg-[#1c1c1f] p-4 shadow-2xl select-none min-h-[380px]">
        {/* Window Title Bar */}
        <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span>💾</span>
            <span className="font-semibold text-white/70">Disk Management</span>
          </div>
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          </div>
        </div>

        {/* Table View */}
        <div className="mb-6 overflow-hidden rounded border border-white/10 bg-[#141416] text-[11px] sm:text-xs">
          <table className="w-full text-left text-white/80">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-white/40">
                <th className="px-3 py-1.5 font-medium">Volume</th>
                <th className="px-3 py-1.5 font-medium">Layout</th>
                <th className="px-3 py-1.5 font-medium">Type</th>
                <th className="px-3 py-1.5 font-medium">File System</th>
                <th className="px-3 py-1.5 font-medium">Status</th>
                <th className="px-3 py-1.5 font-medium">Capacity</th>
                <th className="px-3 py-1.5 font-medium">Free Space</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="px-3 py-1.5">System Reserved</td>
                <td className="px-3 py-1.5">Simple</td>
                <td className="px-3 py-1.5">Basic</td>
                <td className="px-3 py-1.5">NTFS</td>
                <td className="px-3 py-1.5 text-emerald-400">Healthy (Active)</td>
                <td className="px-3 py-1.5">500 MB</td>
                <td className="px-3 py-1.5">120 MB</td>
              </tr>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <td className="px-3 py-1.5 font-semibold text-white">(C:)</td>
                <td className="px-3 py-1.5">Simple</td>
                <td className="px-3 py-1.5">Basic</td>
                <td className="px-3 py-1.5">NTFS</td>
                <td className="px-3 py-1.5 text-emerald-400">Healthy (Boot, Page File)</td>
                <td className="px-3 py-1.5">{phase === "shrunk" ? "435.00 GB" : "465.00 GB"}</td>
                <td className="px-3 py-1.5">{phase === "shrunk" ? "370.00 GB" : "400.00 GB"}</td>
              </tr>
              {phase === "shrunk" && (
                <tr className="border-b border-white/5">
                  <td className="px-3 py-1.5 text-white/40">Unallocated</td>
                  <td className="px-3 py-1.5">Simple</td>
                  <td className="px-3 py-1.5">Basic</td>
                  <td className="px-3 py-1.5">—</td>
                  <td className="px-3 py-1.5 text-white/30">Unallocated</td>
                  <td className="px-3 py-1.5">30.00 GB</td>
                  <td className="px-3 py-1.5">30.00 GB</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Graphical Block View */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-white/60">Disk 0 Basic (GPT) - 465.50 GB</div>
          
          <div className="flex h-24 sm:h-28 w-full border border-white/20 bg-white/5 overflow-hidden relative">
            {/* System Reserved Block */}
            <div className="w-12 h-full flex flex-col justify-between p-2 border-r border-white/20 bg-white/5 text-[9px] text-white/50">
              <span className="font-semibold leading-tight">System Reserved</span>
              <span>500 MB</span>
            </div>

            {/* C: Drive Block */}
            <div
              ref={cDriveRef}
              onContextMenu={handleRightClick}
              className={`h-full flex-1 flex flex-col justify-between p-3 cursor-context-menu transition-colors relative ${
                phase === "idle"
                  ? "bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 hover:border-blue-500/50"
                  : "bg-blue-600/10 border-blue-500/20"
              }`}
            >
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">(C:)</span>
                <span className="text-[10px] text-white/50">NTFS (Healthy)</span>
              </div>
              <span className="text-xs text-white/60">{phase === "shrunk" ? "435.00 GB" : "465.00 GB"}</span>

              {phase === "shrinking" && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-3">
                  <div className="text-xs text-white mb-2 font-semibold">Shrinking volume…</div>
                  <div className="h-1.5 w-full max-w-[150px] overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Unallocated block */}
            {phase === "shrunk" && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "80px" }}
                className="h-full border-l border-white/20 bg-black/60 flex flex-col justify-between p-3 text-[10px] text-white/60 relative overflow-hidden"
              >
                <div className="h-1.5 w-full bg-black/80 absolute top-0 inset-x-0" />
                <div className="flex flex-col mt-2">
                  <span className="font-bold text-white/90">Unallocated</span>
                </div>
                <span>30.00 GB</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Custom Context Menu */}
        <AnimatePresence>
          {showContextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ top: menuPos.y, left: menuPos.x }}
              className="absolute z-20 w-44 rounded-lg border border-white/10 bg-[#252528] p-1 shadow-xl text-xs text-white"
            >
              <button disabled className="w-full text-left px-3 py-1.5 text-white/30 rounded cursor-not-allowed">Open</button>
              <button disabled className="w-full text-left px-3 py-1.5 text-white/30 rounded cursor-not-allowed">Mark Partition as Active</button>
              <div className="h-px bg-white/5 my-1" />
              <button
                onClick={handleShrinkClick}
                className="w-full text-left px-3 py-1.5 hover:bg-accent rounded text-white font-medium transition-colors"
              >
                Shrink Volume...
              </button>
              <button disabled className="w-full text-left px-3 py-1.5 text-white/30 rounded cursor-not-allowed">Extend Volume...</button>
              <div className="h-px bg-white/5 my-1" />
              <button disabled className="w-full text-left px-3 py-1.5 text-white/30 rounded cursor-not-allowed">Format...</button>
              <button disabled className="w-full text-left px-3 py-1.5 text-white/30 rounded cursor-not-allowed">Delete Volume...</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shrink Dialog Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md rounded-xl border border-white/10 bg-[#2b2b2e] p-5 shadow-2xl text-white space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-sm font-bold">Shrink C:</h3>
                  <button onClick={() => { playClick(); setShowModal(false); }} className="text-white/40 hover:text-white text-sm font-bold">✕</button>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-white/70">
                  <div className="flex justify-between">
                    <span>Total size before shrink in MB:</span>
                    <span className="font-mono text-white">476160</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Size of available shrink space in MB:</span>
                    <span className="font-mono text-white">409600</span>
                  </div>
                  
                  <div className="h-px bg-white/5 my-2" />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/95 font-semibold">Enter the amount of space to shrink in MB:</label>
                    <input
                      type="number"
                      value={shrinkAmount}
                      onChange={(e) => setShrinkAmount(e.target.value)}
                      className="w-full rounded bg-white/5 border border-white/10 px-3 py-2 text-sm text-white font-mono outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => { playClick(); setShowModal(false); }}
                    className="rounded px-4 py-2 text-xs border border-white/10 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeShrink}
                    className="rounded bg-accent hover:bg-accent-soft px-4 py-2 text-xs font-bold text-white shadow-lg shadow-accent/25"
                  >
                    Shrink
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {phase === "shrunk" && (
        <div className="flex justify-center">
          <button
            onClick={() => { playClick(); onComplete(); }}
            className="btn-primary"
          >
            Reboot PC & Enter Boot Menu →
          </button>
        </div>
      )}
    </div>
  );
}
