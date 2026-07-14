import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Cinematic boot sequence that plays before the landing page is revealed.
 *
 * Phases:
 *   1. BIOS POST — black screen, white text, memory check
 *   2. GRUB bootloader — menu with countdown
 *   3. Linux boot log — scrolling dmesg-style text
 *   4. Splash screen — animated logo + loading bar
 *   5. Reveal — fades out, calls onReady()
 *
 * Shown on first visit only (sessionStorage gated).
 * User can skip at any time with the Skip button or Space/Enter.
 */

type Phase = "bios" | "grub" | "bootlog" | "splash" | "done";

const BIOS_LINES = [
  "BIOS Version 2.40.1287 (Copyright 2024)",
  "CPU: Intel Core i7-14700K @ 3.40GHz",
  "Memory Test: 32768 MB OK",
  "Detecting SATA drives...",
  "  SATA0: Samsung 980 PRO 1TB",
  "  SATA1: WDC WD40EZRX-00S4SB0",
  "Detecting USB devices...",
  "  USB: SanDisk Ultra Flair 16GB",
  "",
  "Press F2 for Setup, F12 for Boot Menu",
  "",
  "Initializing EFI... OK",
];

const GRUB_ENTRIES = [
  "> Arch Linux (6.9.7-arch1-1)",
  "  Ubuntu 24.04.1 LTS (6.8.0-40-generic)",
  "  Windows 11 (Boot Manager)",
  "",
  "Use ↑↓ to select, Enter to boot.",
];

const BOOT_LOG_LINES = [
  "[    0.000000] Linux version 6.9.7-arch1-1 (gcc version 14.1.0)",
  "[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-linux root=UUID=a1b2c3d4",
  "[    0.000000] BIOS-provided physical RAM map:",
  "[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable",
  "[    0.000000] NX (Execute Disable) protection: active",
  "[    0.000000] SMBIOS 3.3.0 present",
  "[    0.000000] DMI: OS-Simulator/VirtualBox, BIOS 2.40.1287",
  "[    0.004000] tsc: Fast TSC calibration using PMI",
  "[    0.008000] e820: update [mem 0x00000000-0x00000fff] usable ==> reserved",
  "[    0.012000] ACPI: RSDP 0x00000000000F0490 000024 (v02 VBOX  )",
  "[    0.016000] ACPI: ACPI table loaded successfully",
  "[    0.020000] zoneorder: zonesizeorder: 4096",
  "[    0.024000] Kernel command line: BOOT_IMAGE=/vmlinuz-linux",
  "[    0.100000] Calibrating delay loop... 6785.28 BogoMIPS (lpj=3392640)",
  "[    0.164000] CPU: 8 cores, 16 threads @ 3400 MHz",
  "[    0.228000] Memory: 32768MB available",
  "[    0.292000] VFS: Mounting root file system...",
  "[    0.356000] EXT4-fs (sda3): mounted filesystem with ordered data mode",
  "[    0.420000] systemd[1]: Set hostname to <archlinux>",
  "[    0.484000] systemd[1]: Started Journal Service.",
  "[    0.548000] systemd[1]: Starting Network Manager...",
  "[    0.612000] Bluetooth: hci0: Hardware setup complete",
  "[    0.676000] input: Power Button as /devices/LNXSYSTM:00",
  "[    0.740000] usb 1-1: New USB device found, idVendor=0781",
  "[    0.804000] sd 0:0:0:0: [sda] 1953525168 512-byte logical blocks",
  "[    0.868000] Console: switching to colour frame buffer device 192x56",
  "[    0.932000] fb0: EFI VGA framebuffer",
  "[    0.996000] Starting user session manager...",
  "[    1.060000] Arch Linux 6.9.7-arch1-1 (tty1)",
  "",
  "Welcome to Arch Linux!",
];

export default function BootSequence({ onReady }: { onReady: () => void }) {
  const [phase, setPhase] = useState<Phase>("bios");
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [grubCountdown, setGrubCountdown] = useState(5);
  const [splashProgress, setSplashProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef(false);

  // --- BIOS Phase ---
  useEffect(() => {
    if (phase !== "bios") return;
    let i = 0;
    const interval = setInterval(() => {
      if (skipRef.current) return clearInterval(interval);
      if (i < BIOS_LINES.length) {
        setVisibleLines((p) => [...p, BIOS_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (!skipRef.current) setPhase("grub");
        }, 800);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [phase]);

  // --- GRUB Phase ---
  useEffect(() => {
    if (phase !== "grub") return;
    setVisibleLines([]);
    let count = 5;
    const interval = setInterval(() => {
      if (skipRef.current) return clearInterval(interval);
      count--;
      setGrubCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setTimeout(() => {
          if (!skipRef.current) setPhase("bootlog");
        }, 300);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // --- Boot Log Phase ---
  useEffect(() => {
    if (phase !== "bootlog") return;
    setVisibleLines([]);
    let i = 0;
    const interval = setInterval(() => {
      if (skipRef.current) return clearInterval(interval);
      if (i < BOOT_LOG_LINES.length) {
        setVisibleLines((p) => [...p, BOOT_LOG_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (!skipRef.current) setPhase("splash");
        }, 400);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [phase]);

  // --- Splash Phase ---
  useEffect(() => {
    if (phase !== "splash") return;
    setVisibleLines([]);
    const duration = 2000;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / duration) * 100);
      setSplashProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
      else {
        setTimeout(() => {
          if (!skipRef.current) {
            setPhase("done");
            onReady();
          }
        }, 400);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, onReady]);

  // Auto-scroll terminal output
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

  function handleSkip() {
    skipRef.current = true;
    setPhase("done");
    onReady();
  }

  // Keyboard skip
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === " " || e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#000" }}
    >
      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="fixed top-6 right-6 z-50 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
      >
        Skip ⏭
      </button>

      {/* BIOS Phase */}
      <AnimatePresence mode="wait">
        {phase === "bios" && (
          <motion.div
            key="bios"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl px-8"
          >
            <div
              ref={containerRef}
              className="h-[400px] overflow-y-auto font-mono text-sm leading-relaxed"
            >
              {visibleLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`whitespace-pre ${
                    line.includes("OK") || line.includes("EFI")
                      ? "text-emerald-400"
                      : line.startsWith("Press")
                        ? "text-white/40"
                        : "text-white/70"
                  }`}
                >
                  {line}
                </motion.div>
              ))}
              <span className="inline-block h-4 w-2 animate-pulse bg-white/70" />
            </div>
          </motion.div>
        )}

        {/* GRUB Phase */}
        {phase === "grub" && (
          <motion.div
            key="grub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-xl px-8"
          >
            <div className="rounded-lg border border-white/20 bg-[#0a0a0a] p-6 shadow-2xl">
              <div className="mb-4 text-center text-xs text-white/30 font-mono uppercase tracking-widest">
                GRUB version 2.12
              </div>
              <div className="space-y-1 font-mono text-sm">
                {GRUB_ENTRIES.map((line, i) => (
                  <div
                    key={i}
                    className={`px-2 py-1 ${
                      line.startsWith(">")
                        ? "bg-accent/20 text-white"
                        : line.startsWith("Use")
                          ? "text-white/30 text-xs mt-3"
                          : "text-white/60"
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center text-xs text-white/40 font-mono">
                Booting in {grubCountdown}s...
              </div>
            </div>
          </motion.div>
        )}

        {/* Boot Log Phase */}
        {phase === "bootlog" && (
          <motion.div
            key="bootlog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl px-8"
          >
            <div
              ref={containerRef}
              className="h-[400px] overflow-y-auto font-mono text-xs leading-relaxed"
            >
              {visibleLines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -2 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`whitespace-pre ${
                    line.includes("OK") || line.includes("started")
                      ? "text-emerald-400"
                      : line.includes("Welcome")
                        ? "text-white font-bold"
                        : line.startsWith("[")
                          ? "text-white/50"
                          : "text-white/40"
                  }`}
                >
                  {line}
                </motion.div>
              ))}
              <span className="inline-block h-4 w-2 animate-pulse bg-white/50" />
            </div>
          </motion.div>
        )}

        {/* Splash Phase */}
        {phase === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Animated logo */}
            <motion.div
              animate={{
                filter: [
                  "drop-shadow(0 0 20px rgba(124,92,255,0.3))",
                  "drop-shadow(0 0 40px rgba(124,92,255,0.6))",
                  "drop-shadow(0 0 20px rgba(124,92,255,0.3))",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl"
            >
              💿
            </motion.div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white/90">OS Install Simulator</h2>
              <p className="mt-1 text-sm text-white/40">Loading environment...</p>
            </div>

            {/* Loading bar */}
            <div className="w-64 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-soft"
                animate={{ width: `${splashProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div className="text-xs text-white/30 font-mono">
              {Math.floor(splashProgress)}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
