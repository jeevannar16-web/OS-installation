import { useCallback, useRef, useState, useEffect } from "react";
import { Tooltip } from "../shared/InteractiveEffects";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

const TOTAL_GB = 500;
const MIN_NEW_GB = 20;

export default function Partition({
  onComplete,
  diskShrunk,
  onRebootWindows,
}: {
  onComplete: () => void;
  diskShrunk: boolean;
  onRebootWindows: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [newGB, setNewGB] = useState(diskShrunk ? 30 : 80);
  const existingGB = TOTAL_GB - newGB;
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pct = (newGB / TOTAL_GB) * 100;
  const canConfirm = newGB >= MIN_NEW_GB;

  useEffect(() => {
    if (diskShrunk && canConfirm) {
      registerAdvance(() => onComplete());
    }
  }, [diskShrunk, canConfirm, registerAdvance, onComplete]);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!barRef.current || !dragging.current || !diskShrunk) return;
      const rect = barRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const gb = Math.round(ratio * TOTAL_GB);
      // Limit to max 30 GB if they only shrunk 30 GB in Disk Management
      const maxAlloc = 30;
      setNewGB(Math.max(0, Math.min(maxAlloc, gb)));
    },
    [diskShrunk]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!diskShrunk) return;
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleMove(e.clientX);
    },
    [handleMove, diskShrunk]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => handleMove(e.clientX),
    [handleMove]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  if (!diskShrunk) {
    return (
      <div className="mx-auto w-full max-w-xl border border-red-500/20 bg-red-500/5 p-6 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-bold text-red-400">No Unallocated Space Found</h2>
        <p className="text-sm text-white/70 leading-relaxed">
          The Linux installer cannot find any free space to partition. You must shrink your primary Windows partition (C: drive) in Disk Management *before* launching the installer.
        </p>
        <div className="pt-2">
          <button
            onClick={() => {
              playClick();
              onRebootWindows();
            }}
            className="rounded-lg bg-red-600 hover:bg-red-700 px-6 py-3 text-xs font-bold text-white transition-colors min-h-[48px]"
          >
            🔌 Reboot into Windows (Reset Simulator)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-4xl space-y-6">
      <div className="text-center">
        <div className="text-sm sm:text-base uppercase tracking-widest text-white/40">Disk Partitioning</div>
        <h2 className="mt-1 text-xl sm:text-2xl lg:text-3xl font-bold text-white">Allocate disk space</h2>
        <p className="mt-2 text-sm sm:text-base text-white/50">
          Detected <span className="font-semibold text-emerald-400">30.00 GB of Unallocated Space</span> created in Windows Disk Management!
        </p>
        <Tooltip text="Click and drag left/right to adjust how much of the unallocated space to use">
          <span className="mt-1 inline-block text-xs text-accent/80 cursor-help border-b border-dashed border-accent/30 font-semibold">
            💡 Adjust partition allocation below
          </span>
        </Tooltip>
      </div>

      {/* Partition bar */}
      <div className="space-y-2">
        <div
          ref={barRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative h-12 lg:h-16 w-full cursor-col-resize select-none overflow-hidden rounded-lg ring-1 ring-white/10 bg-[#141416]"
        >
          {/* Existing OS portion */}
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-center bg-[#3b82f6]/30 text-xs font-medium text-white/80"
            style={{ width: `${100 - pct}%` }}
          >
            {existingGB > 40 && `Windows Partition — ${existingGB} GB`}
          </div>

          {/* New OS portion */}
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-center text-xs font-medium text-white/80"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, rgba(12, 175, 96, 0.4), rgba(16, 185, 129, 0.2))`,
            }}
          >
            {newGB > 10 && `New Install — ${newGB} GB`}
          </div>

          {/* Divider handle */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
            style={{ left: `${100 - pct}%`, transform: "translateX(-50%)" }}
          >
            <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-md" />
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-white/50">
          <span>Windows: {existingGB} GB</span>
          <span>New Install: {newGB} GB (Max 30 GB unallocated)</span>
        </div>
      </div>

      {/* Partition table preview */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="bg-white/10 px-4 py-2 text-xs font-bold text-white/70 uppercase tracking-wider">
          Proposed Partition Layout — /dev/sda
        </div>
        <div className="divide-y divide-white/5">
          {/* EFI */}
          <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs">
            <span className="text-white/50 font-mono">/dev/sda1</span>
            <span className="text-white/70 font-semibold">EFI System</span>
            <span className="text-white/40">FAT32</span>
            <span className="text-white/40">512 MB</span>
            <span className="text-white/30">/boot/efi</span>
          </div>
          {/* Windows */}
          <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs">
            <span className="text-white/50 font-mono">/dev/sda2</span>
            <span className="text-blue-400 font-semibold">Windows (C:)</span>
            <span className="text-white/40">NTFS</span>
            <span className="text-white/40">{existingGB} GB</span>
            <span className="text-white/30">/mnt/windows</span>
          </div>
          {/* Swap */}
          <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs">
            <span className="text-white/50 font-mono">/dev/sda3</span>
            <span className="text-amber-400 font-semibold">swap</span>
            <span className="text-white/40">swap</span>
            <span className="text-white/40">{Math.min(4, Math.floor(newGB * 0.15))} GB</span>
            <span className="text-white/30">[swap]</span>
          </div>
          {/* Root */}
          <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs bg-emerald-500/5">
            <span className="text-white/50 font-mono">/dev/sda4</span>
            <span className="text-emerald-400 font-semibold">Linux Root</span>
            <span className="text-white/40">ext4</span>
            <span className="text-white/40">{newGB - Math.min(4, Math.floor(newGB * 0.15))} GB</span>
            <span className="text-white/30">/</span>
          </div>
        </div>
      </div>

      {/* Confirm */}
      <div className="flex flex-col items-center gap-2">
        {!canConfirm && (
          <div className="text-xs text-amber-400/80">
            Minimum {MIN_NEW_GB} GB required for installation (currently {newGB} GB)
          </div>
        )}
        <button
          disabled={!canConfirm}
          onClick={() => onComplete()}
          className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Install alongside ({newGB} GB allocated) →
        </button>
      </div>
    </div>
  );
}
