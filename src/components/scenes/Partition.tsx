import { useCallback, useRef, useState } from "react";
import { Tooltip } from "../shared/InteractiveEffects";

const TOTAL_GB = 500;
const MIN_NEW_GB = 20;

export default function Partition({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [newGB, setNewGB] = useState(80);
  const existingGB = TOTAL_GB - newGB;
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const pct = (newGB / TOTAL_GB) * 100;
  const canConfirm = newGB >= MIN_NEW_GB;

  const handleMove = useCallback(
    (clientX: number) => {
      if (!barRef.current || !dragging.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const gb = Math.round(ratio * TOTAL_GB);
      setNewGB(Math.max(0, Math.min(TOTAL_GB - 10, gb)));
    },
    []
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleMove(e.clientX);
    },
    [handleMove]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => handleMove(e.clientX),
    [handleMove]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="text-center">
        <div className="text-sm uppercase tracking-widest text-white/40">Disk Partitioning</div>
        <h2 className="mt-1 text-xl font-bold text-white">Allocate disk space</h2>
        <p className="mt-2 text-sm text-white/50">
          Drag the divider to allocate space for the new OS installation.
        </p>
        <Tooltip text="Click and drag left/right to resize the partition">
          <span className="mt-1 inline-block text-xs text-accent/60 cursor-help border-b border-dashed border-accent/30">
            💡 Drag the bar below
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
          className="relative h-12 w-full cursor-col-resize select-none overflow-hidden rounded-lg ring-1 ring-white/10"
        >
          {/* Existing OS portion */}
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-center bg-[#3b82f6]/40 text-xs font-medium text-white/80"
            style={{ width: `${100 - pct}%` }}
          >
            {existingGB > 40 && `Windows — ${existingGB} GB`}
          </div>

          {/* New OS portion */}
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-center text-xs font-medium text-white/80"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, rgba(124, 92, 255, 0.5), rgba(124, 92, 255, 0.3))`,
            }}
          >
            {newGB > 30 && `New Install — ${newGB} GB`}
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
          <span>Existing OS: {existingGB} GB</span>
          <span>New Install: {newGB} GB</span>
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
