import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PATHS, OS_LIST } from "../data";
import type { InstallPath } from "../data/types";
import Footer from "../components/Footer";
import MiniDemo from "../components/MiniDemo";
import BootSequence from "../components/BootSequence";

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
          className="text-3xl"
          animate={hovered ? { scale: 1.15, rotate: -5 } : { scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {p.icon}
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
            ✓
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
        className="text-5xl"
        style={{
          filter: disabled
            ? "grayscale(1) opacity(0.4)"
            : `drop-shadow(0 0 20px ${o.branding.accent}88)`,
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
            ✓
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ── Floating decorative icons ───────────────────────────────── */
const FLOAT_ICONS = [
  { icon: "💿", top: "12%", left: "5%", dur: "7s", delay: "0s", op: 0.12, fy: "-14px", fr: "8deg" },
  { icon: "🔌", top: "25%", right: "3%", dur: "9s", delay: "-2s", op: 0.10, fy: "-10px", fr: "-5deg" },
  { icon: "💻", top: "55%", left: "2%", dur: "8s", delay: "-4s", op: 0.08, fy: "-16px", fr: "6deg" },
  { icon: "🐧", top: "70%", right: "6%", dur: "10s", delay: "-1s", op: 0.10, fy: "-12px", fr: "-7deg" },
  { icon: "⚡", top: "40%", left: "8%", dur: "6s", delay: "-3s", op: 0.09, fy: "-8px", fr: "4deg" },
  { icon: "🔧", top: "80%", left: "12%", dur: "11s", delay: "-5s", op: 0.07, fy: "-18px", fr: "-3deg" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [path, setPath] = useState<InstallPath | null>(null);
  const [os, setOs] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  const canStart = path && os;
  const selectedOS = os ? OS_LIST.find((x) => x.id === os) : null;
  const selectedPath = path ? PATHS.find((x) => x.id === path) : null;

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

      {/* ── Constellation network mid-layer ── */}
      <svg className="constellation-layer" aria-hidden viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        {/* Nodes */}
        <circle cx="120" cy="80" r="2" fill="#7c5cff" opacity="0.6" />
        <circle cx="300" cy="150" r="1.5" fill="#06b6d4" opacity="0.5" />
        <circle cx="520" cy="60" r="2" fill="#a855f7" opacity="0.4" />
        <circle cx="680" cy="200" r="1.5" fill="#7c5cff" opacity="0.5" />
        <circle cx="200" cy="350" r="1.8" fill="#06b6d4" opacity="0.3" />
        <circle cx="450" cy="300" r="2" fill="#a855f7" opacity="0.4" />
        <circle cx="700" cy="420" r="1.5" fill="#7c5cff" opacity="0.3" />
        <circle cx="100" cy="500" r="1.8" fill="#06b6d4" opacity="0.4" />
        <circle cx="550" cy="500" r="2" fill="#a855f7" opacity="0.3" />
        <circle cx="350" cy="450" r="1.5" fill="#7c5cff" opacity="0.4" />
        {/* Edges */}
        <line x1="120" y1="80" x2="300" y2="150" stroke="#7c5cff" strokeWidth="0.5" opacity="0.15" />
        <line x1="300" y1="150" x2="520" y2="60" stroke="#06b6d4" strokeWidth="0.5" opacity="0.12" />
        <line x1="520" y1="60" x2="680" y2="200" stroke="#a855f7" strokeWidth="0.5" opacity="0.1" />
        <line x1="300" y1="150" x2="450" y2="300" stroke="#7c5cff" strokeWidth="0.4" opacity="0.12" />
        <line x1="200" y1="350" x2="450" y2="300" stroke="#06b6d4" strokeWidth="0.4" opacity="0.1" />
        <line x1="450" y1="300" x2="700" y2="420" stroke="#a855f7" strokeWidth="0.4" opacity="0.08" />
        <line x1="100" y1="500" x2="350" y2="450" stroke="#7c5cff" strokeWidth="0.4" opacity="0.1" />
        <line x1="350" y1="450" x2="550" y2="500" stroke="#06b6d4" strokeWidth="0.4" opacity="0.1" />
        <line x1="200" y1="350" x2="100" y2="500" stroke="#a855f7" strokeWidth="0.3" opacity="0.08" />
        <line x1="680" y1="200" x2="700" y2="420" stroke="#7c5cff" strokeWidth="0.3" opacity="0.08" />
      </svg>

      {/* ── Radial vignette ── */}
      <div className="vignette-overlay" aria-hidden />

      {/* ── Floating decorative icons (hidden on mobile) ── */}
      <div className="hidden lg:block" aria-hidden>
        {FLOAT_ICONS.map((fi, i) => (
          <div
            key={i}
            className="float-icon text-2xl"
            style={{
              top: fi.top,
              left: fi.left,
              right: fi.right,
              ["--dur" as string]: fi.dur,
              ["--delay" as string]: fi.delay,
              ["--op" as string]: fi.op,
              ["--fy" as string]: fi.fy,
              ["--fr" as string]: fi.fr,
            }}
          >
            {fi.icon}
          </div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="relative z-0">
        {/* Header */}
        <header className="mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-semibold">
            <span className="text-xl">💿</span>
            <span className="text-white/90">OS Install Simulator</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
            Practice · Don't risk
          </span>
        </header>

        {/* ── Hero Section ── */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-10 pb-16">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-xs text-white/50 font-medium"
              >
                Interactive · Realistic · 100% safe
              </motion.span>
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
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            {OS_LIST.map((o) => (
              <OSCard
                key={o.id}
                o={o}
                active={os === o.id}
                onClick={() => setOs(o.id)}
              />
            ))}
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
    </div>
  );
}
