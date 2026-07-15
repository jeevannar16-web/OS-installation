import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../shared/Toast";
import { playUsbConnect } from "../shared/sounds";

function UsbStickSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="8" y="30" width="44" height="80" rx="4" fill="url(#usbBody)" stroke="#555" strokeWidth="1.5" />
      {/* Metallic connector */}
      <rect x="16" y="6" width="28" height="28" rx="2" fill="url(#usbMetal)" stroke="#999" strokeWidth="1" />
      {/* Connector contacts */}
      <rect x="22" y="14" width="4" height="2" rx="0.5" fill="#b87333" />
      <rect x="22" y="19" width="4" height="2" rx="0.5" fill="#b87333" />
      <rect x="34" y="14" width="4" height="2" rx="0.5" fill="#b87333" />
      <rect x="34" y="19" width="4" height="2" rx="0.5" fill="#b87333" />
      {/* LED */}
      <circle cx="30" cy="42" r="3" fill="#22c55e" opacity="0.9">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.5s" repeatCount="indefinite" />
      </circle>
      {/* Brand text area */}
      <rect x="14" y="55" width="32" height="16" rx="2" fill="rgba(0,0,0,0.2)" />
      <text x="30" y="65" textAnchor="middle" fontSize="6" fontWeight="bold" fill="rgba(255,255,255,0.3)">USB</text>
      {/* Grip lines */}
      <line x1="14" y1="80" x2="46" y2="80" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <line x1="14" y1="84" x2="46" y2="84" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      <line x1="14" y1="88" x2="46" y2="88" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
      {/* Keyring hole */}
      <circle cx="30" cy="102" r="4" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      <defs>
        <linearGradient id="usbBody" x1="8" y1="30" x2="52" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4a4a52" />
          <stop offset="0.5" stopColor="#2a2a30" />
          <stop offset="1" stopColor="#1a1a20" />
        </linearGradient>
        <linearGradient id="usbMetal" x1="16" y1="6" x2="44" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c0c0c0" />
          <stop offset="0.5" stopColor="#a0a0a0" />
          <stop offset="1" stopColor="#808080" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PcTower({ glowing }: { glowing: boolean }) {
  return (
    <div className="relative">
      {/* Glow effect when dragging over */}
      {glowing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -inset-6 rounded-2xl bg-accent/20 blur-xl pointer-events-none"
        />
      )}
      <svg viewBox="0 0 120 160" className="w-28 h-36" fill="none">
        {/* Tower body */}
        <rect x="10" y="5" width="100" height="150" rx="6" fill="url(#towerBody)" stroke="#444" strokeWidth="1.5" />
        {/* Front panel */}
        <rect x="16" y="10" width="88" height="140" rx="3" fill="#1a1a1e" />
        {/* Power button */}
        <circle cx="60" cy="20" r="4" fill="none" stroke="#555" strokeWidth="1" />
        <circle cx="60" cy="20" r="1.5" fill="#22c55e" />
        {/* USB ports */}
        <rect x="30" y="95" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8"
          className={glowing ? "" : ""}
        />
        {glowing && (
          <rect x="30" y="95" width="24" height="8" rx="1.5" fill="none" stroke="#7c5cff" strokeWidth="1.5" opacity="0.8">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.8s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" values="1;2;1" dur="0.8s" repeatCount="indefinite" />
          </rect>
        )}
        <rect x="66" y="95" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
        {/* Second row USB */}
        <rect x="30" y="108" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
        <rect x="66" y="108" width="24" height="8" rx="1.5" fill="#111" stroke="#333" strokeWidth="0.8" />
        {/* Ventilation */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="24" y1={125 + i * 5} x2="96" y2={125 + i * 5} stroke="#222" strokeWidth="1" />
        ))}
        {/* Brand */}
        <text x="60" y="70" textAnchor="middle" fontSize="7" fill="#333" fontWeight="bold">DESKTOP PC</text>
        {/* Monitor icon above */}
        <rect x="35" y="-5" width="50" height="3" rx="1" fill="#333" />
        <defs>
          <linearGradient id="towerBody" x1="10" y1="5" x2="110" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2a2a2e" />
            <stop offset="1" stopColor="#1a1a1e" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function UsbReinsert({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"drag" | "spring" | "feedback" | "done">("drag");
  const [overPort, setOverPort] = useState(false);
  const toast = useToast();

  const handleDrop = useCallback(() => {
    setPhase("spring");
    playUsbConnect();
    // Physical connection animation, then OS-level feedback
    setTimeout(() => setPhase("feedback"), 800);
    setTimeout(() => {
      toast("USB Drive inserted — removable disk detected", "🔌");
    }, 1200);
    setTimeout(() => setPhase("done"), 2000);
    setTimeout(() => onComplete(), 2200);
  }, [onComplete, toast]);

  return (
    <div className="mx-auto w-full max-w-4xl">
        {phase !== "done" ? (
          <motion.div
            key="insert"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative overflow-hidden rounded-2xl"
          >
            {/* Physical desk backdrop */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#2a2218] via-[#1e1812] to-[#151010] rounded-2xl" />
            <div className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,220,160,0.1) 3px, rgba(255,220,160,0.1) 4px), repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,220,160,0.05) 8px, rgba(255,220,160,0.05) 9px)"
              }}
            />

            <div className="relative z-10 p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="text-xs uppercase tracking-widest text-amber-300/40 font-medium">Physical Setup</div>
                <h2 className="mt-2 text-xl font-bold text-white">
                  Insert the USB into the target PC
                </h2>
                <p className="mt-2 text-sm text-white/40">
                  The USB was safely ejected. Now plug it into the machine you're installing on.
                </p>
              </div>

              {/* Desk scene */}
              <div className="relative flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-24 py-8">
                {/* USB Stick */}
                {phase === "drag" && (
                  <motion.div
                    draggable
                    onDragStart={() => {}}
                    onDragEnd={() => { if (!overPort) setOverPort(false); }}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } }}
                    whileDrag={{ scale: 1.08, rotate: -8, zIndex: 50, filter: "drop-shadow(0 8px 24px rgba(124,92,255,0.4))" }}
                    className="cursor-grab active:cursor-grabbing select-none"
                  >
                    <UsbStickSvg className="w-16 h-28 drop-shadow-lg" />
                    <div className="text-center mt-2 text-[10px] text-amber-200/40">drag me →</div>
                  </motion.div>
                )}

                {/* Spring animation — USB snaps into port */}
                {phase === "spring" && (
                  <motion.div
                    initial={{ x: -60, y: 0, rotate: -8, scale: 1.08 }}
                    animate={{ x: 0, y: 0, rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <UsbStickSvg className="w-16 h-28 drop-shadow-lg" />
                  </motion.div>
                )}

                {/* Feedback flash */}
                {phase === "feedback" && (
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    <UsbStickSvg className="w-16 h-28 drop-shadow-lg opacity-70" />
                  </motion.div>
                )}

                {/* PC Tower */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setOverPort(true); }}
                  onDragLeave={() => setOverPort(false)}
                  onDrop={(e) => { e.preventDefault(); setOverPort(false); handleDrop(); }}
                >
                  <PcTower glowing={overPort} />
                  <div className="text-center mt-2">
                    <div className={`text-xs font-medium ${overPort ? "text-accent" : "text-white/30"}`}>
                      {overPort ? "Release to insert" : "Drop USB here"}
                    </div>
                  </div>
                </div>

                {/* Connection line */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
                  {overPort && (
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 0.3 }}
                      className="w-24 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent origin-left"
                    />
                  )}
                </div>
              </div>

              {/* Hint */}
              <AnimatePresence>
                {overPort && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-sm text-accent font-medium"
                  >
                    ⚡ Release to connect
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 12 }}
              className="text-5xl"
            >
              ✓
            </motion.div>
            <div className="text-lg font-bold text-emerald-400">USB inserted!</div>
            <div className="text-sm text-white/50">Ready to reboot into the installer.</div>
          </motion.div>
        )}
    </div>
  );
}
