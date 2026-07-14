import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Cinematic boot sequence overlay.
 *
 * This is a FIXED OVERLAY that sits on top of the landing page.
 * The landing page always renders underneath. When boot completes,
 * this overlay fades out and unmounts.
 *
 * Phases:
 *   1. BIOS POST — black screen, white text, memory check, blinking cursor
 *   2. GRUB bootloader — menu with countdown
 *   3. Boot log — fast-scrolling dmesg with color-coded lines
 *   4. Splash — animated SVG logo + particle background + loading bar
 *   5. Reveal — smooth fade out
 */

type Phase = "bios" | "grub" | "bootlog" | "splash" | "done";

/* ── BIOS text ─────────────────────────────────────────────────── */
const BIOS_LINES = [
  { text: "AMI BIOS (C)2024 American Megatrends Inc.", cls: "text-white/50" },
  { text: "BIOS Version: 2.40.1287", cls: "text-white/70" },
  { text: "", cls: "" },
  { text: "CPU: Intel(R) Core(TM) i7-14700K @ 3.40GHz", cls: "text-white/70" },
  { text: "Speed: 3400 MHz  Cores: 16  Threads: 24", cls: "text-white/50" },
  { text: "", cls: "" },
  { text: "Memory Test:  32768 MB .................. OK", cls: "text-emerald-400" },
  { text: "", cls: "" },
  { text: "SATA Port 0: Samsung SSD 980 PRO 1TB", cls: "text-white/50" },
  { text: "SATA Port 1: WDC WD40EZRX-00S4SB0 4TB", cls: "text-white/50" },
  { text: "USB Device:  SanDisk Ultra Flair 16GB", cls: "text-white/50" },
  { text: "", cls: "" },
  { text: "EFI: VGA BIOS detected (UEFI GOP available)", cls: "text-cyan-400/70" },
  { text: "", cls: "" },
  { text: "Press F2 for Setup  |  F12 for Boot Menu  |  F8 for Boot Options", cls: "text-white/30" },
  { text: "", cls: "" },
  { text: "Initializing EFI Boot Manager... OK", cls: "text-emerald-400" },
];

/* ── GRUB menu ─────────────────────────────────────────────────── */
const GRUB_ENTRIES = [
  { label: "Arch Linux  (6.9.7-arch1-1)", active: true },
  { label: "Ubuntu 24.04.1 LTS  (6.8.0-40-generic)", active: false },
  { label: "Windows Boot Manager  (on /dev/sda1)", active: false },
  { label: "Memory Test (memtest86+)", active: false },
];

/* ── Boot log ──────────────────────────────────────────────────── */
const BOOT_LOG = [
  { t: "[    0.000000] Linux version 6.9.7-arch1-1 (build@archlinux) (gcc 14.1.0)", c: "text-white/60" },
  { t: "[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-linux root=UUID=a1b2c3d4 rw quiet", c: "text-white/40" },
  { t: "[    0.000000] BIOS-provided physical RAM map:", c: "text-white/50" },
  { t: "[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable", c: "text-white/35" },
  { t: "[    0.000000] NX (Execute Disable) protection: active", c: "text-white/50" },
  { t: "[    0.001000] SMBIOS 3.3.0 present", c: "text-white/40" },
  { t: "[    0.002000] DMI: OS-Sim/VirtualBox, BIOS 2.40.1287", c: "text-white/40" },
  { t: "[    0.003000] tsc: Fast TSC calibration using PMI", c: "text-white/35" },
  { t: "[    0.010000] Calibrating delay loop... 6785.28 BogoMIPS (lpj=3392640)", c: "text-white/50" },
  { t: "[    0.020000] ACPI: All SSDT tables successfully acquired and loaded", c: "text-emerald-400/80" },
  { t: "[    0.035000] CPU: 8 package(s) x 2 core(s) x 2 thread(s) per core", c: "text-white/50" },
  { t: "[    0.050000] Memory: 32768MB available (3980868K kernel code)", c: "text-white/50" },
  { t: "[    0.080000] VFS: Mounted root (ext4 filesystem) on device 8:3.", c: "text-emerald-400/80" },
  { t: "[    0.120000] systemd[1]: Hostname set to <archlinux>.", c: "text-white/40" },
  { t: "[    0.150000] systemd[1]: Started Journal Service.", c: "text-emerald-400/80" },
  { t: "[    0.180000] systemd[1]: Starting Network Manager...", c: "text-cyan-400/60" },
  { t: "[    0.220000] Bluetooth: hci0: Hardware setup complete", c: "text-blue-400/60" },
  { t: "[    0.260000] input: Power Button as /devices/LNXSYSTM:00/LNXPWRBN:00", c: "text-white/40" },
  { t: "[    0.300000] usb 1-1: new SuperSpeed USB device (xhci) idVendor=0781", c: "text-white/40" },
  { t: "[    0.340000] sd 0:0:0:0: [sda] 1953525168 512-byte logical blocks", c: "text-white/50" },
  { t: "[    0.380000] EXT4-fs (sda3): re-mounted. Opts: (null)", c: "text-emerald-400/80" },
  { t: "[    0.420000] Console: switching to colour frame buffer device 200x56", c: "text-white/35" },
  { t: "[    0.450000] fb0: EFI VGA framebuffer device", c: "text-cyan-400/60" },
  { t: "[    0.480000] systemd[1]: Started User Login Management.", c: "text-emerald-400/80" },
  { t: "[    0.510000] systemd[1]: Reached target Graphical Interface.", c: "text-emerald-400/80" },
  { t: "[    0.530000] Arch Linux 6.9.7-arch1-1 (tty1)", c: "text-white font-bold" },
  { t: "", c: "" },
  { t: "login: loading graphical environment...", c: "text-white/60" },
];

/* ── Floating particles for splash ─────────────────────────────── */
function Particles() {
  const dots = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        dur: 3 + Math.random() * 4,
        delay: Math.random() * 3,
      })),
    [],
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full bg-accent/30"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
          animate={{ opacity: [0, 0.8, 0], y: [0, -60, -120] }}
          transition={{ duration: d.dur, repeat: Infinity, delay: d.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ── Scan lines overlay ────────────────────────────────────────── */
function ScanLines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
      }}
    />
  );
}

/* ── Animated SVG disc logo ────────────────────────────────────── */
function AnimatedLogo() {
  return (
    <div className="relative">
      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            "0 0 20px 8px rgba(124,92,255,0.2), inset 0 0 20px 8px rgba(124,92,255,0.1)",
            "0 0 40px 16px rgba(124,92,255,0.4), inset 0 0 40px 16px rgba(124,92,255,0.2)",
            "0 0 20px 8px rgba(124,92,255,0.2), inset 0 0 20px 8px rgba(124,92,255,0.1)",
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: 130, height: 130, top: -5, left: -5 }}
      />
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        className="relative z-10"
      >
        {/* Outer disc */}
        <motion.circle
          cx="60"
          cy="60"
          r="55"
          fill="none"
          stroke="url(#discGrad)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Inner ring */}
        <motion.circle
          cx="60"
          cy="60"
          r="38"
          fill="none"
          stroke="url(#discGrad)"
          strokeWidth="1"
          strokeDasharray="4 6"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "60px 60px" }}
        />
        {/* Center hole */}
        <circle cx="60" cy="60" r="8" fill="#0a0a0f" stroke="rgba(124,92,255,0.4)" strokeWidth="1" />
        {/* Data tracks */}
        {[20, 28, 46, 50].map((r, i) => (
          <motion.circle
            key={r}
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="rgba(124,92,255,0.12)"
            strokeWidth="0.5"
            strokeDasharray={`${3 + i} ${5 + i * 2}`}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "60px 60px" }}
          />
        ))}
        {/* Shimmer highlight */}
        <motion.ellipse
          cx="40"
          cy="40"
          rx="20"
          ry="10"
          fill="rgba(255,255,255,0.04)"
          animate={{ cx: [35, 80, 35], cy: [30, 85, 30] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <defs>
          <linearGradient id="discGrad" x1="0" y1="0" x2="120" y2="120">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */
export default function BootSequence({ onReady }: { onReady: () => void }) {
  const [phase, setPhase] = useState<Phase>("bios");
  const [visibleBiosLines, setVisibleBiosLines] = useState<number>(0);
  const [grubCountdown, setGrubCountdown] = useState(5);
  const [visibleLogLines, setVisibleLogLines] = useState<number>(0);
  const [splashProgress, setSplashProgress] = useState(0);
  const biosRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(false);

  const done = phase === "done";

  /* ── BIOS phase ──────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "bios" || skipRef.current) return;
    let idx = 0;
    const iv = setInterval(() => {
      if (skipRef.current) { clearInterval(iv); return; }
      idx++;
      setVisibleBiosLines(idx);
      if (idx >= BIOS_LINES.length) {
        clearInterval(iv);
        setTimeout(() => { if (!skipRef.current) setPhase("grub"); }, 1000);
      }
    }, 150);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (biosRef.current) biosRef.current.scrollTop = biosRef.current.scrollHeight;
  }, [visibleBiosLines]);

  /* ── GRUB phase ──────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "grub" || skipRef.current) return;
    let c = 5;
    const iv = setInterval(() => {
      if (skipRef.current) { clearInterval(iv); return; }
      c--;
      setGrubCountdown(c);
      if (c <= 0) {
        clearInterval(iv);
        setTimeout(() => { if (!skipRef.current) setPhase("bootlog"); }, 400);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  /* ── Boot log phase ──────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "bootlog" || skipRef.current) return;
    let idx = 0;
    const iv = setInterval(() => {
      if (skipRef.current) { clearInterval(iv); return; }
      idx++;
      setVisibleLogLines(idx);
      if (idx >= BOOT_LOG.length) {
        clearInterval(iv);
        setTimeout(() => { if (!skipRef.current) setPhase("splash"); }, 500);
      }
    }, 55);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [visibleLogLines]);

  /* ── Splash phase ────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "splash" || skipRef.current) return;
    const dur = 2500;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - t0) / dur) * 100);
      setSplashProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => { if (!skipRef.current) finish(); }, 600);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function finish() {
    skipRef.current = true;
    setPhase("done");
    onReady();
  }

  function handleSkip() {
    if (skipRef.current) return;
    finish();
  }

  /* ── Keyboard skip ───────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ([" ", "Enter", "Escape"].includes(e.key)) {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }); // no deps — always fresh

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="boot-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "#000" }}
        >
          {/* Scan lines on every phase */}
          <ScanLines />

          {/* Skip button */}
          <button
            onClick={handleSkip}
            className="fixed top-5 right-5 z-[110] rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/40 hover:text-white/80 hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            Skip ⏭
          </button>

          {/* Phase renderer */}
          <AnimatePresence mode="wait">
            {/* ── BIOS ──────────────────────────────────────────── */}
            {phase === "bios" && (
              <motion.div
                key="bios"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-2xl px-8"
              >
                <div ref={biosRef} className="h-[420px] overflow-y-auto font-mono text-sm leading-[1.7] pr-4">
                  {BIOS_LINES.slice(0, visibleBiosLines).map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.1 }}
                      className={`whitespace-pre ${line.cls}`}
                    >
                      {line.text || "\u00A0"}
                    </motion.div>
                  ))}
                  {/* Blinking cursor */}
                  {visibleBiosLines < BIOS_LINES.length && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.53, repeat: Infinity }}
                      className="inline-block w-2 h-[1.1em] bg-white/70 align-middle ml-0.5"
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* ── GRUB ─────────────────────────────────────────── */}
            {phase === "grub" && (
              <motion.div
                key="grub"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-lg px-8"
              >
                <div className="rounded-xl border border-white/15 bg-[#0a0a0f] p-0 shadow-2xl overflow-hidden">
                  {/* Header bar */}
                  <div className="bg-white/5 border-b border-white/10 px-5 py-3 flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                    <span className="ml-2 text-xs text-white/25 font-mono">GRUB 2.12</span>
                  </div>
                  {/* Entries */}
                  <div className="p-4 space-y-0.5 font-mono text-sm">
                    {GRUB_ENTRIES.map((e, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.12 }}
                        className={`px-3 py-1.5 rounded ${
                          e.active
                            ? "bg-accent/20 text-white border-l-2 border-accent"
                            : "text-white/50"
                        }`}
                      >
                        {e.active && <span className="text-accent mr-1.5">▸</span>}
                        {e.label}
                      </motion.div>
                    ))}
                  </div>
                  {/* Countdown */}
                  <div className="border-t border-white/10 px-5 py-2.5 flex items-center justify-between text-xs font-mono text-white/30">
                    <span>Use ↑↓ to select • Enter to boot</span>
                    <span className="text-white/50">Booting in {grubCountdown}s…</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Boot log ─────────────────────────────────────── */}
            {phase === "bootlog" && (
              <motion.div
                key="bootlog"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl px-8"
              >
                <div ref={logRef} className="h-[420px] overflow-y-auto font-mono text-xs leading-[1.6] pr-4">
                  {BOOT_LOG.slice(0, visibleLogLines).map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -3 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.05 }}
                      className={`whitespace-pre ${line.c}`}
                    >
                      {line.t || "\u00A0"}
                    </motion.div>
                  ))}
                  {visibleLogLines < BOOT_LOG.length && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.4, repeat: Infinity }}
                      className="inline-block w-1.5 h-3 bg-white/40 align-middle"
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Splash ───────────────────────────────────────── */}
            {phase === "splash" && (
              <motion.div
                key="splash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative flex flex-col items-center gap-8"
              >
                <Particles />

                {/* Logo */}
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 150, damping: 15 }}
                >
                  <AnimatedLogo />
                </motion.div>

                {/* Title */}
                <div className="text-center relative z-10">
                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold tracking-tight"
                  >
                    <span className="bg-gradient-to-r from-[#7c5cff] to-[#06b6d4] bg-clip-text text-transparent">
                      OS Install Simulator
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-2 text-sm text-white/35"
                  >
                    Loading environment…
                  </motion.p>
                </div>

                {/* Progress bar */}
                <motion.div
                  initial={{ opacity: 0, scaleX: 0.8 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.5 }}
                  className="relative z-10 w-72"
                >
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #7c5cff, #06b6d4)",
                        width: `${splashProgress}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-white/25">
                    <span>Initializing…</span>
                    <span>{Math.floor(splashProgress)}%</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
