import { useRef, useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Zone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  onClick: () => void;
}

export default function SceneShell({
  src,
  alt,
  zones,
  children,
  globalInput,
  className = "",
}: {
  src: string;
  alt: string;
  zones: Zone[];
  children?: ReactNode;
  globalInput?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    style?: CSSProperties;
  };
  className?: string;
}) {
  const [fs, setFs] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function onFsChange() { setFs(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (globalInput) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [globalInput]);

  function toggleFs() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function handleZoneClick(z: Zone, e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    setClickPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setClickPos(null), 400);
    z.onClick();
  }

  const inputPos = globalInput?.style || {};

  return (
    <div className={`absolute inset-0 ${className}`}>
      <img src={src} alt={alt}
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false} />

      <button onClick={toggleFs}
        className="absolute top-2 right-2 z-30 w-7 h-7 flex items-center justify-center rounded-md bg-black/40 text-white/70 hover:bg-black/60 hover:text-white transition-all text-xs"
        title={fs ? "Exit fullscreen" : "Fullscreen"}>
        ⛶
      </button>

      {zones.map(z => (
        <div key={z.id} onClick={e => handleZoneClick(z, e)}
          className="absolute z-10"
          style={{
            left: `${z.x}%`, top: `${z.y}%`,
            width: `${z.w}%`, height: `${z.h}%`,
            cursor: "pointer",
          }} />
      ))}

      {/* Click ripple feedback */}
      <AnimatePresence>
        {clickPos && (
          <motion.div
            initial={{ opacity: 0.6, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute z-20 w-12 h-12 rounded-full bg-white/30 pointer-events-none"
            style={{ left: clickPos.x - 24, top: clickPos.y - 24 }} />
        )}
      </AnimatePresence>

      {globalInput && (
        <input ref={inputRef} type={globalInput.type || "text"}
          value={globalInput.value} onChange={e => globalInput.onChange(e.target.value)}
          placeholder={globalInput.placeholder || ""}
          className="absolute z-20 cursor-text"
          style={{
            left: "18%", top: "32%", width: "50%", height: "7%",
            background: "transparent", border: "none", outline: "none",
            color: "#fff", fontSize: "14px", fontFamily: "Segoe UI, system-ui, sans-serif",
            caretColor: "#fff",
            ...inputPos,
          }} />
      )}

      {children}
    </div>
  );
}
