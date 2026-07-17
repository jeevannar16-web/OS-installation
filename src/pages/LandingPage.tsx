import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, ArrowLeftRight, Usb, Check, Search, Info, ArrowRight } from "lucide-react";
import { PATHS, OS_LIST } from "../data";
import type { InstallPath } from "../data/types";
import Footer from "../components/Footer";
import MiniDemo from "../components/MiniDemo";
import BootSequence from "../components/BootSequence";
import ThemePicker from "../components/shared/ThemePicker";

const TYPING_TEXTS = [
  "before you actually do it",
  "without risking your PC",
  "and build confidence",
  "step-by-step",
];

function TypingEffect() {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    const currentText = TYPING_TEXTS[textIndex];

    const typeSpeed = isDeleting ? 30 : 50;
    const pauseSpeed = 2000;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setText(currentText.slice(0, charIndex + 1));
          setCharIndex((prev) => prev + 1);
        } else {
          setTimeout(() => setIsDeleting(true), pauseSpeed);
        }
      } else {
        if (charIndex > 0) {
          setText(currentText.slice(0, charIndex - 1));
          setCharIndex((prev) => prev - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % TYPING_TEXTS.length);
        }
      }
    }, typeSpeed);

    return () => clearTimeout(timer);
  }, [textIndex, charIndex, isDeleting]);

  return (
    <span className="gradient-text-animated font-extrabold inline-block min-w-[200px]">
      {text}
      <span className="inline-block w-1 h-[1em] bg-gradient-to-r from-[#7c5cff] via-[#06b6d4] to-[#a855f7] ml-1 align-middle animate-pulse" />
    </span>
  );
}

/* ── Staggered entrance variants ─────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

/* ── Path Card ───────────────────────────────────────────────── */
const PATH_ICONS: Record<string, React.ReactNode> = {
  vm: <Monitor size={28} strokeWidth={1.5} />,
  "dual-boot": <ArrowLeftRight size={28} strokeWidth={1.5} />,
  "live-usb": <Usb size={28} strokeWidth={1.5} />,
};

function PathCard({
  p,
  active,
  onClick,
}: {
  p: (typeof PATHS)[number];
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      variants={item}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`glass rounded-2xl p-6 text-left transition-all relative overflow-hidden ${
        active
          ? "ring-2 ring-accent shadow-[0_0_50px_-10px] shadow-accent bg-accent/[0.06]"
          : "hover:border-white/[0.12]"
      }`}
    >
      {/* Active glow backdrop */}
      {active && (
        <motion.div
          layoutId="path-glow"
          className="absolute inset-0 rounded-2xl bg-accent/[0.06] pointer-events-none"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <div className="relative h-10 overflow-hidden">
        <motion.div
          className="text-accent"
          animate={hovered ? { scale: 1.15, rotate: -5 } : { scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {PATH_ICONS[p.id]}
        </motion.div>
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -right-2 top-0 text-[10px]"
            >
              {p.id === "dual-boot" && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="font-mono text-white/50"
                >
                  ▶ USB Boot
                </motion.div>
              )}
              {p.id === "live-usb" && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="font-mono text-white/50"
                >
                  Try / Install
                </motion.div>
              )}
              {p.id === "vm" && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="font-mono text-white/50"
                >
                  ▶ Power On
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-3 font-semibold text-lg">{p.name}</div>
      <div className="text-accent-soft text-xs uppercase tracking-wide mt-1">
        {p.tagline}
      </div>
      <p className="mt-3 text-sm text-white/50 leading-relaxed">{p.description}</p>

      {/* Active checkmark badge */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="absolute top-3 right-3 h-6 w-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-accent/30"
          >
            <Check size={14} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ── OS Card ─────────────────────────────────────────────────── */
function OSCard({
  o,
  active,
  onClick,
}: {
  o: (typeof OS_LIST)[number];
  active: boolean;
  onClick: () => void;
}) {
  const disabled = !!o.stub;

  return (
    <motion.button
      variants={item}
      onClick={() => !disabled && onClick()}
      whileHover={!disabled ? { y: -6, scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`glass rounded-2xl p-6 flex flex-col items-center text-center transition-all relative overflow-hidden ${
        disabled
          ? "opacity-50 cursor-not-allowed grayscale-[0.3]"
          : `hover:border-white/[0.14] ${active ? "ring-2 ring-accent bg-accent/[0.08]" : ""}`
      }`}
    >
      <motion.div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold"
        style={{
          background: disabled
            ? "rgba(255,255,255,0.05)"
            : `${o.branding.accent}20`,
          color: disabled ? "rgba(255,255,255,0.2)" : o.branding.accent,
          border: `1px solid ${disabled ? "rgba(255,255,255,0.05)" : `${o.branding.accent}30`}`,
        }}
        animate={
          !disabled
            ? {
                y: active ? [0, -4, 0] : [0, -2, 0],
                rotate: active ? [0, -2, 2, -2, 0] : 0,
              }
            : {}
        }
        transition={{
          duration: active ? 1.2 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {o.branding.logo}
      </motion.div>
      <div className="mt-4 font-semibold text-sm">{o.branding.name}</div>

      {/* Coming soon ribbon */}
      {disabled && (
        <div className="ribbon-wrap absolute inset-0">
          <div className="ribbon">Soon</div>
        </div>
      )}

      {/* Active checkmark badge */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 90 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="absolute top-3 right-3 h-6 w-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-accent/30"
          >
            <Check size={14} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [path, setPath] = useState<InstallPath | null>(null);
  const [os, setOs] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const canStart = path && os;
  const selectedOS = os ? OS_LIST.find((x) => x.id === os) : null;
  const selectedPath = path ? PATHS.find((x) => x.id === path) : null;

  const filteredOS = OS_LIST.filter((o) =>
    o.branding.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.branding.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Parallax tilt on hero demo card
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTiltX(x * 6);
      setTiltY(-y * 6);
    },
    []
  );
  const handleMouseLeave = useCallback(() => {
    setTiltX(0);
    setTiltY(0);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBootReady = useCallback((_ready?: boolean) => {}, []);

  function start() {
    if (!path || !os) return;
    navigate(`/${os}/${path}`);
  }

  const ctaLabel = canStart
    ? `Start ${selectedOS?.branding.shortName} — ${selectedPath?.name} →`
    : "Select a path and an OS to begin";

  return (
    <div className="min-h-full flex flex-col relative overflow-hidden">
      {/* Boot sequence overlay */}
      <BootSequence onReady={handleBootReady} />

      {/* ── Aurora background ── */}
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
      </div>

      {/* ── Dot grid ── */}
      <div className="dot-grid" aria-hidden />

      {/* ── SVG noise texture ── */}
      <svg className="noise-overlay" aria-hidden>
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* ── Radial vignette ── */}
      <div className="vignette-overlay" aria-hidden />

      {/* ── Main content ── */}
      <div className="relative z-0">
        {/* Header */}
        <header className="mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-semibold">
            <span className="text-white/90 tracking-tight text-lg">OS Install Simulator</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowHelp(true)}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white/80 transition-colors">
              <Info size={14} /> How it works
            </button>
            <ThemePicker />
            <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium hidden sm:block">
              Practice · Don't risk
            </span>
          </div>
        </header>

        {/* ── Hero Section ── */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-10 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 18 }}
                className="flex items-center gap-5 mx-auto lg:mx-0 mb-8 w-fit relative"
              >
                {/* Glow ring behind icon */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#7c5cff]/20 via-[#06b6d4]/10 to-[#a855f7]/20 blur-2xl animate-pulse pointer-events-none" />
                <div className="relative flex-shrink-0">
                  <img
                    src="/logo.svg"
                    alt="OS Install Simulator"
                    className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 drop-shadow-[0_0_50px_rgba(124,92,255,0.5)]"
                  />
                  {/* Spinning orbit ring */}
                  <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] animate-spin" style={{ animationDuration: "8s" }} viewBox="0 0 100 100">
                    <ellipse cx="50" cy="50" rx="48" ry="48" fill="none" stroke="url(#orbitGrad)" strokeWidth="1.5" strokeDasharray="8 12" />
                    <defs>
                      <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c5cff" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="flex flex-col items-start relative">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none">
                    <span className="bg-gradient-to-r from-white via-[#e0e0ff] to-[#c8b8ff] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(124,92,255,0.3)]">
                      OS Install
                    </span>
                  </span>
                  <span className="text-[10px] sm:text-xs tracking-[0.4em] uppercase font-bold bg-gradient-to-r from-[#7c5cff] via-[#06b6d4] to-[#a855f7] bg-clip-text text-transparent">
                    Simulator
                  </span>
                  {/* Decorative line */}
                  <div className="mt-1.5 h-0.5 w-full bg-gradient-to-r from-[#7c5cff] via-[#06b6d4] to-[#a855f7] rounded-full opacity-60" />
                </div>
              </motion.div>
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs text-white/50 font-medium"
              >
                Interactive · Realistic · 100% safe
              </motion.span>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 flex flex-wrap gap-2 justify-center lg:justify-start"
              >
                {["BIOS setup", "USB flashing", "Disk partitioning", "OS installer", "Desktop setup"].map((step) => (
                  <span key={step} className="flex items-center gap-1 rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] text-white/40">
                    <ArrowRight size={8} className="text-accent" />{step}
                  </span>
                ))}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 20 }}
                className="mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] tracking-tight"
              >
                Practice installing an OS
                <br />
                <TypingEffect />
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="mt-6 text-white/50 text-lg max-w-lg leading-relaxed mx-auto lg:mx-0"
              >
                Watch and interact with a convincingly real simulation — search &amp; download the ISO,
                flash a USB, survive the BIOS menu, and run the installer. No real hardware, no risk.
              </motion.p>
            </div>

            {/* Live mini-demo with parallax tilt */}
            <motion.div
              ref={heroRef}
              initial={{ opacity: 0, scale: 0.94, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 160, damping: 18 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative"
              style={{
                transform: `perspective(800px) rotateY(${tiltX}deg) rotateX(${tiltY}deg)`,
                transition: "transform 0.15s ease-out",
              }}
            >
              {/* Glow behind card */}
              <div className="absolute -inset-8 rounded-3xl bg-accent/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <MiniDemo />
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Path Selection ── */}
        <section className="mx-auto w-full max-w-6xl px-6 mt-8">
          <div className="section-label mb-5">
            Step 1 — Choose how you'll install
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-3"
          >
            {PATHS.map((p) => (
              <PathCard
                key={p.id}
                p={p}
                active={path === p.id}
                onClick={() => setPath(p.id)}
              />
            ))}
          </motion.div>
        </section>

        {/* ── OS Selection ── */}
        <section className="mx-auto w-full max-w-6xl px-6 mt-14">
          <div className="section-label mb-5">
            Step 2 — Pick an operating system
          </div>
          <div className="mb-4 relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" placeholder="Search OS..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-xs text-white/80 outline-none focus:border-accent placeholder:text-white/25 transition-colors" />
          </div>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            {filteredOS.map((o) => (
              <OSCard
                key={o.id}
                o={o}
                active={os === o.id}
                onClick={() => setOs(o.id)}
              />
            ))}
            {filteredOS.length === 0 && (
              <div className="col-span-full text-center py-8 text-white/30 text-sm">
                No OS found matching "{searchQuery}"
              </div>
            )}
          </motion.div>
        </section>

        {/* ── CTA Button ── */}
        <section className="mx-auto w-full max-w-6xl px-6 mt-12 mb-4">
          <motion.button
            whileTap={canStart ? { scale: 0.96 } : {}}
            disabled={!canStart}
            onClick={start}
            className={`relative w-full sm:w-auto text-base font-semibold rounded-xl px-8 py-3.5 transition-all duration-500 ${
              canStart
                ? "bg-accent text-white shadow-[0_0_40px_-8px] shadow-accent hover:shadow-[0_0_50px_-6px] hover:shadow-accent cursor-pointer sheen-sweep"
                : "bg-white/[0.03] text-white/25 border border-white/[0.06] cursor-not-allowed"
            }`}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={ctaLabel}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                {ctaLabel}
              </motion.span>
            </AnimatePresence>
          </motion.button>
          {!canStart && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-sm text-white/30"
            >
              Pick one install method above and one operating system.
            </motion.p>
          )}
        </section>

        <div className="flex-1" />
        <Footer />
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowHelp(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white/90">How it works</h2>
                <button onClick={() => setShowHelp(false)} className="text-white/40 hover:text-white/70 text-xl">×</button>
              </div>
              <div className="space-y-4">
                {[
                  { icon: "1️⃣", title: "Choose your path", desc: "Pick Virtual Machine (safest), Dual Boot (real hardware), or Live USB (try without installing)." },
                  { icon: "2️⃣", title: "Pick an OS", desc: "Select Ubuntu, Windows, Arch, or others. Some are coming soon." },
                  { icon: "3️⃣", title: "Follow the steps", desc: "Search for the ISO, flash a USB, enter BIOS, partition disks, and run the installer — just like on real hardware." },
                  { icon: "4️⃣", title: "Learn as you go", desc: "Each step has speaker notes (press B) and a scene navigator (press N) to jump around. Use S for speed mode." },
                ].map((s) => (
                  <div key={s.title} className="flex gap-3">
                    <span className="text-lg shrink-0">{s.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white/80">{s.title}</div>
                      <div className="text-xs text-white/40 mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="text-xs font-semibold text-white/60 mb-2">Keyboard shortcuts</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {[
                      ["Enter / Next", "Advance to next step"],
                      ["Backspace", "Go back"],
                      ["N", "Scene navigator"],
                      ["B", "Speaker notes"],
                      ["S", "Speed mode"],
                      ["T", "Change theme"],
                      ["F", "Fullscreen"],
                    ].map(([key, desc]) => (
                      <div key={key} className="flex items-center gap-2">
                        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/60">{key}</kbd>
                        <span className="text-white/40">{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowHelp(false)}
                className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                Got it, let's start
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
