import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";

/**
 * 3D hardware scene shown after installation completes.
 * Uses CSS perspective transforms to create depth.
 * Each path (vm, dual-boot, live-usb) shows different hardware.
 */

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

/* ── 3D Monitor ─────────────────────────────────────────────── */
function Monitor3D({ config }: { config: OSConfig }) {
  return (
    <div className="relative" style={{ perspective: "800px" }}>
      <motion.div
        initial={{ rotateX: 12, rotateY: -8, scale: 0.85 }}
        animate={{ rotateX: 4, rotateY: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.2 }}
        className="relative"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Monitor bezel */}
        <div className="relative mx-auto w-[280px] sm:w-[340px] md:w-[400px] rounded-xl bg-gradient-to-b from-gray-700 to-gray-900 p-2 shadow-2xl">
          {/* Screen */}
          <div
            className="relative aspect-[16/10] overflow-hidden rounded-lg"
            style={{ background: `linear-gradient(135deg, ${config.branding.surface}, #0a0a1a)` }}
          >
            {/* Desktop wallpaper */}
            <div className="absolute inset-0" style={{
              background: `radial-gradient(circle at 30% 40%, ${config.branding.accent}30 0%, transparent 50%),
                           radial-gradient(circle at 70% 60%, ${config.branding.accent}15 0%, transparent 40%),
                           linear-gradient(135deg, ${config.branding.surface} 0%, #0a0a1a 100%)`
            }} />

            {/* Desktop icons */}
            <div className="absolute inset-3 grid grid-cols-3 gap-2 content-start">
              {["📁", "🌐", "⚙️"].map((icon, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                  className="flex flex-col items-center gap-0.5 rounded p-1 hover:bg-white/10 cursor-pointer"
                >
                  <span className="text-lg sm:text-xl">{icon}</span>
                  <span className="text-[6px] sm:text-[7px] text-white/50">App</span>
                </motion.div>
              ))}
            </div>

            {/* Terminal window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.2, type: "spring" }}
              className="absolute left-4 right-4 top-10 sm:top-12 sm:left-6 sm:right-6 rounded-md overflow-hidden shadow-xl"
            >
              <div className="bg-white/5 border-b border-white/10 px-2 py-0.5 flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400/70" />
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-400/70" />
                <div className="h-1.5 w-1.5 rounded-full bg-green-400/70" />
                <span className="ml-1 text-[5px] sm:text-[6px] text-white/25 font-mono">Terminal</span>
              </div>
              <div className="bg-black/60 p-1.5 sm:p-2 font-mono text-[5px] sm:text-[7px] leading-relaxed">
                <div className="text-emerald-400">$ neofetch</div>
                <div className="text-white/50">OS: {config.branding.name}</div>
                <div className="text-white/40">Kernel: 6.9.7-arch1-1</div>
                <div className="text-accent">Shell: bash 5.2</div>
                <div className="text-cyan-400">$ <span className="animate-pulse">_</span></div>
              </div>
            </motion.div>

            {/* Taskbar */}
            <div className="absolute bottom-0 inset-x-0 h-4 sm:h-5 bg-black/50 border-t border-white/10 flex items-center px-2 justify-between">
              <span className="text-[5px] sm:text-[7px] text-white/50 font-semibold">{config.branding.logo} {config.branding.shortName}</span>
              <span className="text-[4px] sm:text-[6px] text-white/30 font-mono">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            {/* Screen glare */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Monitor stand */}
        <div className="mx-auto w-16 h-6 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b" />
        <div className="mx-auto w-24 h-2 bg-gradient-to-b from-gray-700 to-gray-600 rounded-b-lg shadow-lg" />
      </motion.div>
    </div>
  );
}

/* ── 3D USB Drive ────────────────────────────────────────────── */
function UsbDrive3D({ config }: { config: OSConfig }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 30, x: 40 }}
      animate={{ opacity: 1, rotateY: 0, x: 0 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
      style={{ perspective: "600px", transformStyle: "preserve-3d" }}
    >
      <div className="relative w-16 h-8 sm:w-20 sm:h-10 rounded-md bg-gradient-to-r from-gray-400 to-gray-300 shadow-lg border border-gray-500/30 flex items-center">
        {/* USB connector */}
        <div className="absolute -left-2 top-1 bottom-1 w-3 rounded-l bg-gradient-to-r from-gray-300 to-gray-200 border border-gray-400/50" />
        {/* Label */}
        <div className="ml-3 text-center flex-1">
          <div className="text-[5px] sm:text-[6px] font-bold text-gray-700">USB</div>
          <div className="text-[4px] sm:text-[5px] text-gray-600">{config.branding.shortName}</div>
        </div>
        {/* LED */}
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-400"
          style={{ boxShadow: "0 0 6px rgba(52,211,153,0.6)" }}
        />
      </div>
    </motion.div>
  );
}

/* ── 3D Laptop ───────────────────────────────────────────────── */
function Laptop3D({ config }: { config: OSConfig }) {
  return (
    <div className="relative" style={{ perspective: "700px" }}>
      <motion.div
        initial={{ rotateX: 15, scale: 0.85 }}
        animate={{ rotateX: 5, scale: 1 }}
        transition={{ type: "spring", stiffness: 80, damping: 18, delay: 0.3 }}
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
        {/* Keyboard base */}
        <div className="relative mx-auto w-[220px] sm:w-[280px] md:w-[340px] h-2.5 sm:h-3 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-lg shadow-xl">
          <div className="absolute inset-x-4 top-0.5 h-0.5 bg-gray-600 rounded" />
        </div>
      </motion.div>
    </div>
  );
}

/* ── 3D VM Window ────────────────────────────────────────────── */
function VmWindow3D({ config }: { config: OSConfig }) {
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
            {/* OS content */}
            <div className="absolute inset-4 flex flex-col items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="text-3xl sm:text-4xl mb-2"
              >
                {config.branding.logo}
              </motion.div>
              <div className="text-[8px] sm:text-[10px] text-white/70 font-semibold">{config.branding.name}</div>
              <div className="text-[5px] sm:text-[6px] text-white/30 mt-1">Running in VirtualBox</div>
            </div>
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
    const t = setTimeout(() => setShowDesktop(true), 1800);
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
        return (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Laptop3D config={config} />
            <UsbDrive3D config={config} />
          </div>
        );
      case "dual-boot":
      default:
        return (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Monitor3D config={config} />
            <UsbDrive3D config={config} />
          </div>
        );
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

        {/* 3D Hardware Scene */}
        <div className="py-4 sm:py-6 flex justify-center">
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
        {/* Checklist */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5"
        >
          <StepChecklist path={path} />
        </motion.div>

        {/* Achievements */}
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
