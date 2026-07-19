import { useRef, useEffect, useState, type ReactNode, type CSSProperties } from "react";

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

  const defaultInputStyle: CSSProperties = globalInput ? {
    left: "18%",
    top: "30%",
    width: "55%",
    height: "7%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "Segoe UI, system-ui, sans-serif",
    caretColor: "#fff",
    ...(globalInput.style || {}),
  } : {};

  return (
    <div className={`absolute inset-0 ${className}`}>
      <img src={src} alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false} />

      <button onClick={toggleFs}
        className="absolute top-2 right-2 z-30 w-7 h-7 flex items-center justify-center rounded-md bg-black/40 text-white/70 hover:bg-black/60 hover:text-white transition-all text-xs"
        title={fs ? "Exit fullscreen" : "Fullscreen"}>
        ⛶
      </button>

      {zones.map(z => (
        <div key={z.id} onClick={z.onClick}
          className="absolute z-10"
          style={{
            left: `${z.x}%`, top: `${z.y}%`,
            width: `${z.w}%`, height: `${z.h}%`,
            cursor: "pointer",
          }} />
      ))}

      {globalInput && (
        <input ref={inputRef} type={globalInput.type || "text"}
          value={globalInput.value} onChange={e => globalInput.onChange(e.target.value)}
          placeholder={globalInput.placeholder || ""}
          className="absolute z-20 cursor-text"
          style={defaultInputStyle} />
      )}

      <div className="absolute bottom-1.5 left-1.5 z-20 text-[7px] text-white/20 font-mono select-none pointer-events-none">
        Tab↵ Enter⏎ Esc↩
      </div>

      {children}
    </div>
  );
}
