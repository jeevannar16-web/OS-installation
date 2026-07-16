import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";

export default function FileManager({
  config,
  onComplete,
}: {
  config: OSConfig;
  onComplete: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [over, setOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [contextMenu]);

  return (
    <div
      className="mx-auto w-full max-w-4xl lg:max-w-5xl"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="overflow-hidden rounded-xl bg-[#1e1e1e] shadow-2xl ring-1 ring-white/10">
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-[#323234] px-3 py-2">
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto rounded-md bg-[#1e1e1e] px-4 py-0.5 text-xs text-white/60">
            Files — Downloads
          </div>
        </div>

        <div className="flex h-[460px] lg:h-[560px] xl:h-[640px]">
          {/* Sidebar */}
          <div className="w-44 shrink-0 border-r border-white/10 bg-[#2a2a2b] p-3 text-sm">
            {[
              { icon: "📁", label: "Home", active: false },
              { icon: "↓", label: "Downloads", active: true },
              { icon: "📄", label: "Documents", active: false },
              { icon: "🖼", label: "Pictures", active: false },
              { icon: "♪", label: "Music", active: false },
              { icon: "✕", label: "Trash", active: false },
            ].map((s) => (
              <div
                key={s.label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                  s.active ? "bg-accent/30 text-white" : "text-white/60"
                }`}
              >
                <span className="w-4 text-center text-xs opacity-60">{s.icon}</span>
                {s.label}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="flex flex-1 flex-col relative">
            {/* Breadcrumb / toolbar */}
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-sm text-white/70">
              <span>‹</span>
              <span>›</span>
              <span className="rounded bg-white/10 px-2 py-0.5">Home / Downloads</span>
            </div>

            <div className="flex flex-1 gap-4 p-5">
              {/* File grid */}
              <div className="flex flex-1 flex-col">
                <div className="mb-2 text-xs uppercase tracking-wide text-white/40">
                  Downloads
                </div>
                <div className="flex flex-wrap content-start gap-4">
                  {/* The downloaded ISO — right-clickable */}
                  <motion.div
                    draggable
                    onDragStart={() => setDragging(true)}
                    onDragEnd={() => {
                      setDragging(false);
                      setOver(false);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY });
                    }}
                    whileHover={{ y: -2 }}
                    className="flex w-24 cursor-grab flex-col items-center gap-1 active:cursor-grabbing"
                  >
                    <div
                      className="flex h-20 w-20 items-center justify-center rounded-lg text-3xl font-bold shadow-lg"
                      style={{ background: `${config.branding.accent}22`, border: `1px solid ${config.branding.accent}55`, color: config.branding.accent }}
                    >
                      {config.branding.logo}
                    </div>
                    <div className="w-24 break-words text-center text-xs text-white/80">
                      {config.iso.filename}
                    </div>
                    <div className="text-[10px] sm:text-xs text-white/40">{config.iso.size}</div>
                  </motion.div>
                </div>

                {dragging && (
                  <div className="mt-3 text-sm text-accent-soft">
                    Good — now drop it onto the flashing tool on the right →
                  </div>
                )}
              </div>

              {/* Drop target / bridge to scene 3 */}
              <div className="flex w-60 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/20 p-4 text-center">
                <motion.div
                  animate={over ? { scale: 1.1 } : { scale: 1 }}
                  className="text-2xl font-bold text-white/40"
                >
                  USB
                </motion.div>
                <div className="text-sm font-semibold text-white/80">USB Flashing Tool</div>
                <div className="text-xs text-white/50">
                  Drag the .iso here, or right-click it and choose "Open in flashing tool".
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(true);
                  }}
                  onDragLeave={() => setOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setOver(false);
                    setDragging(false);
                    onComplete();
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    over ? "bg-accent text-white" : "bg-white/5 text-white/70"
                  }`}
                >
                  {over ? "Release to load ISO" : "Drop zone"}
                </div>
                <button className="btn-primary w-full text-sm" onClick={onComplete}>
                  Open in flashing tool →
                </button>
              </div>
            </div>

            {/* Right-click context menu */}
            <AnimatePresence>
              {contextMenu && (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  style={{ left: contextMenu.x, top: contextMenu.y }}
                  className="absolute z-50 w-52 rounded-lg border border-white/10 bg-[#2a2a2b] shadow-xl py-1"
                >
                  <button
                    onClick={() => {
                      setContextMenu(null);
                      onComplete();
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-white/80 hover:bg-accent/30 hover:text-white transition-colors"
                  >
                    Open in flashing tool
                  </button>
                  <div className="mx-2 my-1 h-px bg-white/10" />
                  <button
                    onClick={() => setContextMenu(null)}
                    className="w-full text-left px-3 py-1.5 text-sm text-white/50 hover:bg-white/5 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setContextMenu(null)}
                    className="w-full text-left px-3 py-1.5 text-sm text-white/50 hover:bg-white/5 transition-colors"
                  >
                    Properties
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-white/50">
        Right-click the ISO and choose "Open in flashing tool" to continue — or drag and drop it.
      </div>
    </div>
  );
}
