import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, ArrowLeftRight, Usb, Check, Info, ChevronDown, Cpu, Lock } from "lucide-react";
import { PATHS, OS_LIST } from "../data";
import type { InstallPath } from "../data/types";
import Footer from "../components/Footer";
import BootSequence from "../components/BootSequence";
import ThemePicker from "../components/shared/ThemePicker";

const TYPING_TEXTS = [
  "before you actually do it",
  "without risking your PC",
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
    <span className="text-white/40 font-medium inline-block min-w-[140px]">
      {text}
      <span className="inline-block w-0.5 h-[0.9em] bg-accent ml-0.5 align-middle animate-pulse" />
    </span>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const PATH_ICONS: Record<string, React.ReactNode> = {
  vm: <Monitor size={16} strokeWidth={1.5} />,
  "dual-boot": <ArrowLeftRight size={16} strokeWidth={1.5} />,
  "live-usb": <Usb size={16} strokeWidth={1.5} />,
};

function PathCard({ p, active, onClick }: {
  p: (typeof PATHS)[number];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      variants={item}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all border ${
        active
          ? "border-accent/40 bg-accent/[0.08] shadow-[0_0_20px_-8px] shadow-accent"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
      }`}
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
        active ? "bg-accent/20 text-accent" : "bg-white/5 text-white/40"
      }`}>
        {PATH_ICONS[p.id]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-xs text-white/80">{p.name}</div>
        <div className="text-[10px] text-white/35">{p.tagline}</div>
      </div>
      <div className={`shrink-0 h-4 w-4 rounded-full flex items-center justify-center ${
        active ? "bg-accent text-white" : "bg-white/10 text-white/25"
      }`}>
        {active ? <Check size={10} strokeWidth={3} /> : <div className="h-1.5 w-1.5 rounded-full bg-white/15" />}
      </div>
    </motion.button>
  );
}

function OSCard({ o, active, onClick }: {
  o: (typeof OS_LIST)[number];
  active: boolean;
  onClick: () => void;
}) {
  const disabled = !!o.stub;
  return (
    <motion.button
      variants={item}
      onClick={() => !disabled && onClick()}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all border ${
        disabled
          ? "border-white/[0.04] bg-white/[0.01] opacity-50 cursor-not-allowed"
          : active
            ? "border-accent/40 bg-accent/[0.08]"
            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
      }`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          background: disabled ? "rgba(255,255,255,0.03)" : `${o.branding.accent}15`,
          color: disabled ? "rgba(255,255,255,0.15)" : o.branding.accent,
          border: `1px solid ${disabled ? "rgba(255,255,255,0.04)" : `${o.branding.accent}25`}`,
        }}
      >
        {disabled ? <Lock size={12} /> : o.branding.logo}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-xs text-white/80 truncate">{o.branding.name}</div>
        {disabled && <div className="text-[9px] text-white/25 uppercase tracking-wider">Coming soon</div>}
      </div>
      <div className={`shrink-0 h-4 w-4 rounded-full flex items-center justify-center ${
        active ? "bg-accent text-white" : "bg-white/10 text-white/25"
      }`}>
        {active ? <Check size={10} strokeWidth={3} /> : <div className="h-1.5 w-1.5 rounded-full bg-white/15" />}
      </div>
    </motion.button>
  );
}

/* ── Step Guide Dropdown ──────────────────────────────────────── */
const GUIDE_STEPS = [
  {
    title: "Download the Ubuntu ISO",
    desc: "Search the official site and download the desktop ISO",
  },
  {
    title: "Flash a bootable USB",
    desc: "Use Rufus, Ventoy, or BalenaEtcher to write the ISO to USB",
  },
  {
    title: "Enter BIOS & boot from USB",
    desc: "Restart, press F2/F12, enable USB boot, set USB as first priority",
  },
  {
    title: "Install Ubuntu",
    desc: "Choose language, keyboard, partition disk, create user, done",
  },
];

function StepGuide() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="space-y-1.5">
      {GUIDE_STEPS.map((step, i) => (
        <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
          >
            <span className="h-6 w-6 rounded-md bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-xs text-white/75">{step.title}</span>
              {openIdx === i && <p className="text-[10px] text-white/35 mt-0.5">{step.desc}</p>}
            </div>
            <motion.span animate={{ rotate: openIdx === i ? 180 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown size={14} className="text-white/25" />
            </motion.span>
          </button>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [path, setPath] = useState<InstallPath | null>(null);
  const [os, setOs] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const canStart = path && os;
  const selectedOS = os ? OS_LIST.find((x) => x.id === os) : null;
  const selectedPath = path ? PATHS.find((x) => x.id === path) : null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBootReady = useCallback((_ready?: boolean) => {}, []);

  function start() {
    if (!path || !os) return;
    navigate(`/${os}/${path}`);
  }

  return (
    <div className="min-h-full flex flex-col relative overflow-hidden">
      <BootSequence onReady={handleBootReady} />

      {/* Background */}
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
      </div>
      <div className="dot-grid" aria-hidden />
      <svg className="noise-overlay" aria-hidden>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
      <div className="vignette-overlay" aria-hidden />

      <div className="relative z-0 flex-1 flex flex-col">
        {/* Header */}
        <header className="w-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-accent/20 flex items-center justify-center">
              <Cpu size={14} className="text-accent" />
            </div>
            <span className="font-semibold text-sm text-white/80 tracking-tight">OS Install Simulator</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHelp(true)}
              className="flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-white/45 hover:bg-white/10 hover:text-white/65 transition-colors">
              <Info size={12} /> Help
            </button>
            <ThemePicker />
          </div>
        </header>

        {/* Hero — minimal centered */}
        <section className="w-full px-6 pt-6 pb-6">
          <div className="text-center max-w-xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 mb-3">
              <img src="/logo.svg" alt="Logo" className="w-12 h-12" />
              <div className="text-left">
                <div className="text-xl font-bold tracking-tight text-white/90">OS Install Simulator</div>
                <div className="text-xs text-white/35">Practice installing an OS — safely</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-xs text-white/40">
              <TypingEffect />
            </motion.div>
          </div>
        </section>

        {/* Main content — everything in one section */}
        <section className="w-full px-6 pb-8 flex-1">
          <div className="max-w-5xl mx-auto">
            {/* How it works */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">How it works</span>
              </div>
              <StepGuide />
            </div>

            {/* Selection grid: Path (vertical 3) | OS (vertical 5) */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Path selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-5 w-5 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center">1</span>
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Install method</span>
                </div>
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-1.5">
                  {PATHS.map((p) => (
                    <PathCard key={p.id} p={p} active={path === p.id} onClick={() => setPath(p.id)} />
                  ))}
                </motion.div>
              </div>

              {/* OS selection */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-5 w-5 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center">2</span>
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Operating system</span>
                </div>
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-1.5">
                  {OS_LIST.map((o) => (
                    <OSCard key={o.id} o={o} active={os === o.id} onClick={() => setOs(o.id)} />
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Start button */}
            <div className="mt-6 text-center">
              <motion.button
                whileTap={canStart ? { scale: 0.97 } : {}}
                disabled={!canStart}
                onClick={start}
                className={`text-sm font-semibold rounded-xl px-10 py-3 transition-all ${
                  canStart
                    ? "bg-accent text-white shadow-[0_0_30px_-8px] shadow-accent hover:shadow-[0_0_40px_-6px] hover:shadow-accent"
                    : "bg-white/[0.03] text-white/20 border border-white/[0.06] cursor-not-allowed"
                }`}
              >
                {canStart ? `Start ${selectedOS?.branding.shortName} — ${selectedPath?.name}` : "Select a method and OS above"}
              </motion.button>
            </div>
          </div>
        </section>

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
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white/90">Keyboard shortcuts</h2>
                <button onClick={() => setShowHelp(false)} className="text-white/40 hover:text-white/70 text-xl">×</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                {[
                  ["Enter", "Next step"],
                  ["Backspace", "Go back"],
                  ["N", "Scene navigator"],
                  ["B", "Speaker notes"],
                  ["S", "Speed mode"],
                  ["T", "Change theme"],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-2">
                    <kbd className="rounded bg-white/10 px-2 py-1 text-[10px] font-mono text-white/50">{key}</kbd>
                    <span className="text-white/40">{desc}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowHelp(false)}
                className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
