import { type ReactNode } from "react";

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cursor?: string;
  onClick: () => void;
}

export default function HotspotLayer({
  src,
  alt,
  hotspots,
  className = "",
  children,
}: {
  src: string;
  alt: string;
  hotspots: Hotspot[];
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-5xl flex flex-col ${className}`}
      style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <img src={src} alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false} />
        {hotspots.map((h) => (
          <div key={h.id}
            onClick={h.onClick}
            className="absolute z-10"
            style={{
              left: `${h.x}%`,
              top: `${h.y}%`,
              width: `${h.w}%`,
              height: `${h.h}%`,
              cursor: h.cursor || "pointer",
            }}
          />
        ))}
        {children}
      </div>
    </div>
  );
}
