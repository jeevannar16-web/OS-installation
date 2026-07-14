import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playUsbConnect, playSuccess } from "../shared/sounds";

type OpenApp = "files" | "editor" | "settings" | "browser" | null;

const REPO_URL = "https://github.com/jeevannar16-web/OS-installation";

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(t);
  }, []);
  return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ── Desktop PC Back Panel with USB Ports ────────────────────── */
function DesktopBack3D() {
  return (
    <div className="relative" style={{ perspective: "900px" }}>
      <motion.div
        initial={{ rotateY: 18, rotateX: 5, scale: 0.9 }}
        animate={{ rotateY: 0, rotateX: 3, scale: 1 }}
        transition={{ type: "spring", stiffness: 60, damping: 16, delay: 0.1 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* PC Tower — back panel */}
        <div className="relative w-[200px] sm:w-[260px] md:w-[300px]">
          {/* Tower body */}
          <div className="relative rounded-xl bg-gradient-to-b from-gray-800 to-gray-900 p-3 shadow-2xl border border-white/5">
            {/* Back panel plate */}
            <div className="relative rounded-lg bg-gradient-to-b from-gray-700/80 to-gray-800/90 p-4 border border-white/5">
              {/* Power supply fan grille */}
              <div className="mb-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full border-2 border-white/10 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="text-[8px] text-white/20"
                  >
                    ✕
                  </motion.div>
                </div>
                <div className="text-[6px] text-white/20 font-mono">PSU FAN</div>
              </div>

              {/* Motherboard I/O shield */}
              <div className="rounded bg-gray-900/80 border border-white/5 p-2 mb-3">
                <div className="text-[5px] text-white/20 mb-1.5 font-mono">REAR I/O</div>
                {/* USB ports - top row */}
                <div className="flex gap-1.5 mb-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-3 w-4 rounded-sm border border-white/15 bg-gray-950/80 flex items-center justify-center"
                    >
                      <div className="h-1 w-2 rounded-[1px] bg-white/10" />
                    </div>
                  ))}
                </div>
                {/* USB ports - bottom row (the target!) */}
                <div className="flex gap-1.5 mb-1.5">
                  {[4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-3 w-4 rounded-sm border border-white/15 bg-gray-950/80 flex items-center justify-center"
                    >
                      <div className="h-1 w-2 rounded-[1px] bg-white/10" />
                    </div>
                  ))}
                  <div className="flex-1" />
                  {/* Ethernet port */}
                  <div className="h-3 w-5 rounded-sm border border-white/10 bg-gray-950/60" />
                </div>
                {/* Audio jacks */}
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500/40 border border-green-500/20" />
                  <div className="h-2 w-2 rounded-full bg-pink-500/40 border border-pink-500/20" />
                  <div className="h-2 w-2 rounded-full bg-blue-500/40 border border-blue-500/20" />
                </div>
              </div>

              {/* Expansion slots */}
              <div className="space-y-1">
                <div className="h-2 rounded bg-gray-900/60 border border-white/5" />
                <div className="h-2 rounded bg-gray-900/60 border border-white/5" />
                <div className="h-2 rounded bg-gray-900/60 border border-white/5" />
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <div className="text-[6px] text-white/15 font-mono">DESKTOP PC — BACK PANEL</div>
              </div>
            </div>
          </div>

          {/* Stand */}
          <div className="mx-auto w-12 h-3 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b" />
          <div className="mx-auto w-20 h-1.5 bg-gradient-to-b from-gray-700 to-gray-600 rounded-b-lg shadow-lg" />
        </div>
      </motion.div>
    </div>
  );
}

/* ── USB Drive with insertion arm ────────────────────────────── */
function UsbDriveInsertable({ config, inserted }: { config: OSConfig; inserted: boolean }) {
  return (
    <motion.div
      initial={{ x: 80, y: 0, rotate: 0, opacity: 0 }}
      animate={
        inserted
          ? { x: 0, y: 0, rotate: 0, opacity: 1 }
          : { x: 80, y: 0, rotate: 0, opacity: 1 }
      }
      transition={
        inserted
          ? { type: "spring", stiffness: 120, damping: 14 }
          : { delay: 0.8, duration: 0.4 }
      }
      style={{ perspective: "600px", transformStyle: "preserve-3d" }}
    >
      <div className="relative">
        {/* USB body */}
        <div className="relative w-20 h-9 sm:w-24 sm:h-10 rounded-md bg-gradient-to-r from-gray-400 to-gray-300 shadow-lg border border-gray-500/30 flex items-center">
          {/* Metal connector */}
          <div className="absolute -left-3 top-1 bottom-1 w-4 rounded-l-sm bg-gradient-to-r from-gray-200 to-gray-300 border border-gray-400/50 shadow-inner">
            {/* Internal contacts */}
            <div className="absolute inset-0.5 flex flex-col justify-center gap-[2px]">
              <div className="h-[1px] bg-yellow-500/30" />
              <div className="h-[1px] bg-yellow-500/30" />
            </div>
          </div>
          {/* Label area */}
          <div className="ml-3 text-center flex-1">
            <div className="text-[6px] sm:text-[7px] font-bold text-gray-700">INSTALLER</div>
            <div className="text-[5px] sm:text-[6px] text-gray-600">{config.branding.shortName}</div>
          </div>
          {/* LED */}
          <motion.div
            animate={inserted ? { opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] } : { opacity: 0.3 }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-400"
            style={{ boxShadow: inserted ? "0 0 8px rgba(52,211,153,0.8)" : "none" }}
          />
          {/* Grip ridges */}
          <div className="absolute right-6 sm:right-7 top-1 bottom-1 w-[1px] bg-white/10" />
          <div className="absolute right-8 sm:right-9 top-1 bottom-1 w-[1px] bg-white/10" />
        </div>
        {/* Insertion arrow */}
        {!inserted && (
          <motion.div
            animate={{ x: [-4, 4, -4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute -left-8 top-1/2 -translate-y-1/2 text-lg text-white/30"
          >
            ←
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Full USB Insertion Scene (Desktop) ──────────────────────── */
function UsbInsertionDesktop({ config }: { config: OSConfig }) {
  const [phase, setPhase] = useState<"approach" | "inserted" | "boot">("approach");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("inserted"), 2200);
    const t2 = setTimeout(() => {
      playUsbConnect();
    }, 2400);
    const t3 = setTimeout(() => {
      setPhase("boot");
      playSuccess();
    }, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center gap-4 sm:gap-6">
        {/* USB drive */}
        <UsbDriveInsertable config={config} inserted={phase !== "approach"} />

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "approach" ? 0.4 : 0 }}
          className="text-2xl text-white/20"
        >
          →
        </motion.div>

        {/* Desktop PC back */}
        <DesktopBack3D />
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        {phase === "approach" && (
          <motion.div
            key="approach"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-sm text-white/50"
          >
            Inserting bootable USB into port…
          </motion.div>
        )}
        {phase === "inserted" && (
          <motion.div
            key="inserted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-sm text-emerald-400"
          >
            <span className="text-lg">✓</span> USB connected — booting from drive
          </motion.div>
        )}
        {phase === "boot" && (
          <motion.div
            key="boot"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-accent-soft font-medium"
          >
            {config.branding.name} is ready to use!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Laptop with USB Side Port ───────────────────────────────── */
function LaptopSidePort3D({ config }: { config: OSConfig }) {
  return (
    <div className="relative" style={{ perspective: "800px" }}>
      <motion.div
        initial={{ rotateX: 15, rotateY: -10, scale: 0.85 }}
        animate={{ rotateX: 6, rotateY: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 70, damping: 16, delay: 0.2 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Screen half */}
        <div className="relative mx-auto w-[200px] sm:w-[260px] md:w-[320px] rounded-t-lg bg-gradient-to-b from-gray-800 to-gray-900 p-1.5 pb-0.5">
          <div
            className="aspect-[16/9] rounded-t-sm overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, ${config.branding.surface}, #0a0a1a)` }}
          >
            <div className="absolute inset-0" style={{
              background: `radial-gradient(circle at 50% 50%, ${config.branding.accent}25 0%, transparent 60%)`
            }} />
            {/* Window */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute inset-3 sm:inset-4 rounded bg-white/5 border border-white/10 p-2 flex flex-col"
            >
              <div className="flex items-center gap-1 mb-1">
                <div className="h-1 w-1 rounded-full bg-red-400/70" />
                <div className="h-1 w-1 rounded-full bg-yellow-400/70" />
                <div className="h-1 w-1 rounded-full bg-green-400/70" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-2xl sm:text-3xl"
                >
                  {config.branding.logo}
                </motion.div>
              </div>
              <div className="text-[5px] sm:text-[7px] text-white/40 text-center font-semibold">{config.branding.name} Desktop</div>
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
        {/* Keyboard base with side USB port */}
        <div className="relative mx-auto">
          <div className="relative w-[220px] sm:w-[280px] md:w-[340px] h-2.5 sm:h-3 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-lg shadow-xl">
            <div className="absolute inset-x-4 top-0.5 h-0.5 bg-gray-600 rounded" />
            {/* Right side USB port */}
            <div className="absolute -right-1 top-0 bottom-0 w-2 bg-gray-700 rounded-r-sm border border-white/5">
              <div className="absolute inset-0.5 bg-gray-950/60 rounded-sm flex items-center justify-center">
                <div className="h-[2px] w-1 bg-white/10 rounded" />
              </div>
            </div>
          </div>
          {/* Side profile thickness */}
          <div className="absolute -right-1 top-0 h-2.5 sm:h-3 w-1 bg-gray-600 rounded-r" />
        </div>
      </motion.div>
    </div>
  );
}

/* ── Full USB Insertion Scene (Laptop) ───────────────────────── */
function UsbInsertionLaptop({ config }: { config: OSConfig }) {
  const [phase, setPhase] = useState<"approach" | "inserted" | "boot">("approach");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("inserted"), 2200);
    const t2 = setTimeout(() => {
      playUsbConnect();
    }, 2400);
    const t3 = setTimeout(() => {
      setPhase("boot");
      playSuccess();
    }, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* USB drive - approaches from right */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={
            phase !== "approach"
              ? { x: 0, opacity: 1 }
              : { x: 60, opacity: 1 }
          }
          transition={{ type: "spring", stiffness: 120, damping: 14, delay: phase === "approach" ? 0.8 : 0 }}
        >
          <div className="relative">
            <div className="relative w-20 h-9 sm:w-24 sm:h-10 rounded-md bg-gradient-to-r from-gray-400 to-gray-300 shadow-lg border border-gray-500/30 flex items-center">
              <div className="absolute -left-3 top-1 bottom-1 w-4 rounded-l-sm bg-gradient-to-r from-gray-200 to-gray-300 border border-gray-400/50" />
              <div className="ml-3 text-center flex-1">
                <div className="text-[6px] sm:text-[7px] font-bold text-gray-700">INSTALLER</div>
                <div className="text-[5px] sm:text-[6px] text-gray-600">{config.branding.shortName}</div>
              </div>
              <motion.div
                animate={phase !== "approach" ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.3 }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-400"
                style={{ boxShadow: phase !== "approach" ? "0 0 8px rgba(52,211,153,0.8)" : "none" }}
              />
            </div>
            {phase === "approach" && (
              <motion.div
                animate={{ x: [-4, 4, -4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -left-6 top-1/2 -translate-y-1/2 text-sm text-white/30"
              >
                ←
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Laptop */}
        <LaptopSidePort3D config={config} />
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        {phase === "approach" && (
          <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-white/50">
            Inserting USB into laptop port…
          </motion.div>
        )}
        {phase === "inserted" && (
          <motion.div key="i" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm text-emerald-400">
            <span className="text-lg">✓</span> USB connected — booting from drive
          </motion.div>
        )}
        {phase === "boot" && (
          <motion.div key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-accent-soft font-medium">
            {config.branding.name} live environment loaded!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── VM Window with boot animation ───────────────────────────── */
function VmWindow3D({ config }: { config: OSConfig }) {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative" style={{ perspective: "800px" }}>
      <motion.div
        initial={{ rotateY: -10, rotateX: 5, scale: 0.85 }}
        animate={{ rotateY: 0, rotateX: 3, scale: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.2 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Host window frame */}
        <div className="rounded-xl bg-gradient-to-b from-gray-700 to-gray-800 p-1.5 shadow-2xl border border-white/5">
          {/* Title bar */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-t-lg">
            <div className="h-2 w-2 rounded-full bg-red-400/70" />
            <div className="h-2 w-2 rounded-full bg-yellow-400/70" />
            <div className="h-2 w-2 rounded-full bg-green-400/70" />
            <span className="ml-2 text-[7px] sm:text-[8px] text-white/30 font-mono">VirtualBox — {config.branding.name}</span>
          </div>
          {/* VM screen */}
          <div
            className="relative aspect-[16/10] rounded-b-lg overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${config.branding.surface}, #0a0a1a)` }}
          >
            <div className="absolute inset-0" style={{
              background: `radial-gradient(circle at 50% 50%, ${config.branding.accent}20 0%, transparent 50%)`
            }} />
            {/* Boot sequence */}
            <AnimatePresence mode="wait">
              {!booted ? (
                <motion.div key="boot" exit={{ opacity: 0 }} className="absolute inset-4 flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="text-2xl sm:text-3xl mb-2"
                  >
                    💿
                  </motion.div>
                  <div className="text-[8px] sm:text-[10px] text-white/40 font-mono">Loading…</div>
                </motion.div>
              ) : (
                <motion.div
                  key="desktop"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-4 flex flex-col items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="text-3xl sm:text-4xl mb-2"
                  >
                    {config.branding.logo}
                  </motion.div>
                  <div className="text-[8px] sm:text-[10px] text-white/70 font-semibold">{config.branding.name}</div>
                  <div className="text-[5px] sm:text-[6px] text-white/30 mt-1">Running in VirtualBox</div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-br from-white/4 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Achievement Badge ───────────────────────────────────────── */
function AchievementBadge({
  icon,
  label,
  delay,
}: {
  icon: string;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.08, y: -2 }}
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 sm:px-4 sm:py-2 cursor-default"
    >
      <span className="text-base sm:text-lg">{icon}</span>
      <span className="text-[10px] sm:text-xs text-white/60">{label}</span>
    </motion.div>
  );
}

/* ── Interactive Checklist ────────────────────────────────────── */
function StepChecklist({ path }: { path: string }) {
  const steps = [
    { label: "Downloaded ISO", done: true },
    { label: "Flashed bootable USB", done: true },
    { label: "Entered BIOS / Boot Menu", done: true },
    ...(path === "dual-boot" ? [{ label: "Partitioned disk", done: true }] : []),
    ...(path === "live-usb" ? [{ label: "Tried live environment", done: true }] : []),
    { label: "Inserted USB into port", done: true },
    { label: "Installed operating system", done: true },
    { label: "Booted into new OS", done: true },
  ];

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] sm:text-xs uppercase tracking-widest text-white/30 mb-2">
        What you completed
      </div>
      {steps.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }}
          className="flex items-center gap-2 text-xs sm:text-sm"
        >
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400 shrink-0">
            ✓
          </div>
          <span className="text-white/60">{s.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Main Done Component ─────────────────────────────────────── */
export default function Done({
  config,
  path,
}: {
  config: OSConfig;
  path: string;
}) {
  const navigate = useNavigate();
  const [showDesktop, setShowDesktop] = useState(false);
  const [openApp, setOpenApp] = useState<OpenApp>(null);
  const clock = useClock();

  useEffect(() => {
    const t = setTimeout(() => setShowDesktop(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const desktopIcons = [
    { id: "files" as const, icon: "📁", label: "Files" },
    { id: "browser" as const, icon: "🌐", label: "Browser" },
    { id: "settings" as const, icon: "⚙️", label: "Settings" },
    { id: "editor" as const, icon: "📄", label: "Editor" },
  ];

  const hardwareScene = (() => {
    switch (path) {
      case "vm":
        return <VmWindow3D config={config} />;
      case "live-usb":
        return <UsbInsertionLaptop config={config} />;
      case "dual-boot":
      default:
        return <UsbInsertionDesktop config={config} />;
    }
  })();

  const achievements = [
    { icon: "🔥", label: "First install" },
    { icon: path === "dual-boot" ? "🔀" : path === "vm" ? "🖥️" : "💿", label: path === "dual-boot" ? "Dual-boot pro" : path === "vm" ? "Virtual master" : "Live explorer" },
    { icon: "🛡️", label: "Zero risk taken" },
    { icon: "⚡", label: "No data lost" },
  ];

  const links = [
    { name: "Ubuntu", url: "https://ubuntu.com/download/desktop" },
    { name: "Windows", url: "https://microsoft.com/software-download/windows11" },
    { name: "Arch", url: "https://archlinux.org/download/" },
    { name: "Debian", url: "https://www.debian.org/distrib/" },
    { name: "Fedora", url: "https://fedoraproject.org/workstation/download" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 space-y-8">
      {/* ── Hero: 3D scene + headline ── */}
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm uppercase tracking-widest text-white/30"
        >
          Installation Complete
        </motion.div>

        {/* 3D Hardware Scene — animated USB insertion */}
        <div className="py-4 sm:py-6 flex justify-center overflow-hidden">
          {hardwareScene}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl sm:text-2xl md:text-3xl font-bold"
        >
          <span className="bg-gradient-to-r from-accent-soft to-accent bg-clip-text text-transparent">
            {config.completion.headline}
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm sm:text-base text-white/50 max-w-md mx-auto"
        >
          {config.completion.sub}
        </motion.p>
      </div>

      {/* ── Two-column: checklist + achievements ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5"
        >
          <StepChecklist path={path} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5"
        >
          <div className="text-[10px] sm:text-xs uppercase tracking-widest text-white/30 mb-3">
            Achievements unlocked
          </div>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a, i) => (
              <AchievementBadge key={i} icon={a.icon} label={a.label} delay={0.8 + i * 0.15} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Interactive Desktop Preview ── */}
      {showDesktop && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 overflow-hidden"
        >
          <div
            className="relative aspect-[16/7] sm:aspect-[16/6] overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${config.branding.surface} 0%, #0a0a1a 100%)`,
            }}
          >
            <div className="absolute inset-0" style={{
              background: `radial-gradient(circle at 30% 40%, ${config.branding.accent}20 0%, transparent 50%),
                           radial-gradient(circle at 70% 60%, ${config.branding.accent}10 0%, transparent 40%)`
            }} />

            {/* Desktop icons */}
            <div className="absolute inset-4 sm:inset-6 grid grid-cols-4 gap-3 sm:gap-4 content-start max-w-xs">
              {desktopIcons.map((d, i) => (
                <motion.button
                  key={d.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1, type: "spring" }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { playClick(); setOpenApp(openApp === d.id ? null : d.id); }}
                  className="flex flex-col items-center gap-1 rounded-lg p-2 sm:p-3 text-center hover:bg-white/10 transition-colors"
                >
                  <span className="text-2xl sm:text-3xl">{d.icon}</span>
                  <span className="text-[8px] sm:text-[10px] text-white/60">{d.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Popovers */}
            <AnimatePresence>
              {openApp === "files" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute left-4 sm:left-6 top-4 sm:top-6 z-30 w-56 sm:w-64 rounded-xl bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10 overflow-hidden"
                >
                  <div className="bg-[#252536] px-3 py-1.5 text-[8px] sm:text-[9px] text-white/40">Files — Home</div>
                  <div className="grid grid-cols-3 gap-1.5 p-2">
                    {["Documents", "Downloads", "Music", "Pictures", "Videos", "Desktop"].map((f) => (
                      <div key={f} className="flex flex-col items-center gap-0.5 rounded p-1.5 hover:bg-white/10 cursor-pointer">
                        <span className="text-lg sm:text-xl">📁</span>
                        <span className="text-[7px] sm:text-[8px] text-white/50">{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setOpenApp(null)} className="w-full border-t border-white/10 py-1 text-[8px] text-white/30 hover:text-white/50">Close</button>
                </motion.div>
              )}
              {openApp === "browser" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute left-4 sm:left-6 top-4 sm:top-6 z-30 w-60 sm:w-72 rounded-xl bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10 overflow-hidden"
                >
                  <div className="bg-[#252536] px-3 py-1.5 text-[8px] sm:text-[9px] text-white/40 flex items-center gap-1">
                    <span className="text-white/20">🔒</span> github.com
                  </div>
                  <div className="p-3">
                    <a href={REPO_URL} target="_blank" rel="noopener noreferrer"
                      className="block rounded-lg bg-white/5 border border-white/10 p-3 text-center text-[9px] sm:text-[10px] text-white/60 hover:bg-white/10 transition-colors"
                    >
                      ⭐ Star on GitHub — OS-installation
                    </a>
                  </div>
                  <button onClick={() => setOpenApp(null)} className="w-full border-t border-white/10 py-1 text-[8px] text-white/30 hover:text-white/50">Close</button>
                </motion.div>
              )}
              {openApp === "settings" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute left-4 sm:left-6 top-4 sm:top-6 z-30 w-48 sm:w-56 rounded-xl bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10 overflow-hidden"
                >
                  <div className="bg-[#252536] px-3 py-1.5 text-[8px] sm:text-[9px] text-white/40">Settings</div>
                  <div className="p-1.5">
                    {["Wi-Fi", "Display", "Sound", "About"].map((s) => (
                      <div key={s} className="rounded px-2 py-1 text-[8px] sm:text-[9px] text-white/50 hover:bg-white/5 cursor-pointer">{s}</div>
                    ))}
                  </div>
                  <button onClick={() => setOpenApp(null)} className="w-full border-t border-white/10 py-1 text-[8px] text-white/30 hover:text-white/50">Close</button>
                </motion.div>
              )}
              {openApp === "editor" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute left-4 sm:left-6 top-4 sm:top-6 z-30 w-56 sm:w-64 rounded-xl bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10 overflow-hidden"
                >
                  <div className="bg-[#252536] px-3 py-1.5 text-[8px] sm:text-[9px] text-white/40">Text Editor</div>
                  <div className="p-2 font-mono text-[7px] sm:text-[8px] text-white/40 leading-relaxed">
                    <div className="text-white/60"># Welcome to {config.branding.name}!</div>
                    <div className="mt-0.5">Installation complete.</div>
                    <div className="mt-0.5 animate-pulse text-accent">▌</div>
                  </div>
                  <button onClick={() => setOpenApp(null)} className="w-full border-t border-white/10 py-1 text-[8px] text-white/30 hover:text-white/50">Close</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Taskbar */}
            <div className="absolute bottom-0 inset-x-0 h-7 sm:h-8 bg-black/60 border-t border-white/10 flex items-center px-3 sm:px-4 justify-between backdrop-blur">
              <span className="text-[9px] sm:text-[10px] text-white/60 font-semibold">{config.branding.logo} {config.branding.shortName}</span>
              <span className="text-[8px] sm:text-[9px] text-white/40 font-mono">{clock}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Download links ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="space-y-3"
      >
        <div className="text-center text-[10px] sm:text-xs uppercase tracking-widest text-white/30">
          Try it for real
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-white/5 border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              {link.name} →
            </a>
          ))}
        </div>
      </motion.div>

      {/* ── GitHub CTA ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
      >
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors">
          ⭐ Star on GitHub
        </a>
        <a href={`${REPO_URL}/fork`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors">
          🍴 Fork
        </a>
        <a href="https://github.com/jeevannar16-web" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors">
          👤 Follow
        </a>
      </motion.div>

      {/* ── Start Over ── */}
      <div className="flex justify-center pb-4">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { playClick(); navigate("/"); }}
          className="rounded-xl border border-white/10 bg-white/5 px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white/70 hover:bg-white/10 transition-colors"
        >
          🔄 Start Over
        </motion.button>
      </div>
    </div>
  );
}
