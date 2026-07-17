import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, ArrowLeftRight, Usb, Check, Search, Info, ChevronRight, Cpu, Usb as UsbIcon, ArrowRightLeft } from "lucide-react";
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
    <span className="text-white/50 font-medium inline-block min-w-[160px]">
      {text}
      <span className="inline-block w-0.5 h-[0.9em] bg-accent ml-0.5 align-middle animate-pulse" />
    </span>
  );
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

/* ── Path Card ───────────────────────────────────────────────── */
const PATH_ICONS: Record<string, React.ReactNode> = {
  vm: <Monitor size={22} strokeWidth={1.5} />,
  "dual-boot": <ArrowLeftRight size={22} strokeWidth={1.5} />,
  "live-usb": <Usb size={22} strokeWidth={1.5} />,
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
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`glass rounded-xl p-4 text-left transition-all relative ${
        active
          ? "ring-2 ring-accent shadow-[0_0_30px_-10px] shadow-accent bg-accent/[0.06]"
          : "hover:border-white/[0.12]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
          active ? "bg-accent/20 text-accent" : "bg-white/5 text-white/50"
        }`}>
          {PATH_ICONS[p.id]}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm text-white/90">{p.name}</div>
          <div className="text-[11px] text-white/40 truncate">{p.tagline}</div>
        </div>
        <div className={`ml-auto shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
          active ? "bg-accent text-white" : "bg-white/10 text-white/30"
        }`}>
          {active ? <Check size={12} strokeWidth={3} /> : <ChevronRight size={12} />}
        </div>
      </div>
    </motion.button>
  );
}

/* ── OS Card ─────────────────────────────────────────────────── */
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
      whileHover={!disabled ? { y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`glass rounded-xl p-4 flex items-center gap-3 text-left transition-all relative ${
        disabled
          ? "opacity-40 cursor-not-allowed"
          : `hover:border-white/[0.14] ${active ? "ring-2 ring-accent bg-accent/[0.08]" : ""}`
      }`}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
        style={{
          background: disabled ? "rgba(255,255,255,0.05)" : `${o.branding.accent}20`,
          color: disabled ? "rgba(255,255,255,0.2)" : o.branding.accent,
          border: `1px solid ${disabled ? "rgba(255,255,255,0.05)" : `${o.branding.accent}30`}`,
        }}
      >
        {o.branding.logo}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm text-white/90 truncate">{o.branding.name}</div>
        {disabled && <div className="text-[10px] text-white/30 uppercase tracking-wider">Coming soon</div>}
      </div>
      <div className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
        active ? "bg-accent text-white" : "bg-white/10 text-white/30"
      }`}>
        {active ? <Check size={12} strokeWidth={3} /> : <ChevronRight size={12} />}
      </div>
    </motion.button>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [path, setPath] = useState<InstallPath | null>(null);
  const [os, setOs] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const canStart = path && os;
  const selectedOS = os ? OS_LIST.find((x) => x.id === os) : null;
  const selectedPath = path ? PATHS.find((x) => x.id === path) : null;

  const filteredOS = OS_LIST.filter((o) =>
    o.branding.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.branding.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="relative z-0">
        {/* Header */}
        <header className="mx-auto w-full max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Cpu size={16} className="text-accent" />
            </div>
            <span className="font-semibold text-white/90 tracking-tight">OS Install Simulator</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHelp(true)}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors">
              <Info size={13} /> Help
            </button>
            <ThemePicker />
          </div>
        </header>

        {/* Hero — compact */}
        <section className="mx-auto w-full max-w-5xl px-6 pt-6 pb-8">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 mb-4">
              <img src="/logo.svg" alt="Logo" className="w-14 h-14" />
              <div className="text-left">
                <div className="text-2xl font-bold tracking-tight text-white/90">OS Install Simulator</div>
                <div className="text-xs text-white/40">Practice installing an operating system — safely</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-sm text-white/50">
              <TypingEffect />
            </motion.div>
          </div>
        </section>

        {/* Main content — two columns on desktop */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-8">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Steps */}
            <div className="space-y-5">
              {/* Step 1: Path */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-5 w-5 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center">1</span>
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Choose install method</span>
                </div>
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
                  {PATHS.map((p) => (
                    <PathCard key={p.id} p={p} active={path === p.id} onClick={() => setPath(p.id)} />
                  ))}
                </motion.div>
              </div>

              {/* Step 2: OS */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-5 w-5 rounded-full bg-accent/20 text-accent text-[10px] font-bold flex items-center justify-center">2</span>
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Pick an operating system</span>
                </div>
                <div className="mb-2 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input type="text" placeholder="Search OS..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white/80 outline-none focus:border-accent placeholder:text-white/20 transition-colors" />
                </div>
                <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
                  {filteredOS.map((o) => (
                    <OSCard key={o.id} o={o} active={os === o.id} onClick={() => setOs(o.id)} />
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Right: Preview + Start */}
            <div className="flex flex-col">
              {/* Preview card */}
              <div className="glass rounded-xl p-5 flex-1">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">What you'll practice</div>
                <div className="space-y-2">
                  {[
                    { icon: <Search size={14} />, label: "Search & download the OS ISO" },
                    { icon: <UsbIcon size={14} />, label: "Flash a bootable USB drive" },
                    { icon: <ArrowRightLeft size={14} />, label: "Enter BIOS & configure boot order" },
                    { icon: <Monitor size={14} />, label: "Partition disks & run the installer" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
                      <div className="h-7 w-7 rounded-md bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        {step.icon}
                      </div>
                      <span className="text-xs text-white/60">{step.label}</span>
                    </div>
                  ))}
                </div>

                {/* What's included */}
                <div className="mt-5 pt-4 border-t border-white/[0.06]">
                  <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Includes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["BIOS/UEFI", "USB Boot", "Disk Part.", "Ubuntu", "Windows", "GRUB"].map((tag) => (
                      <span key={tag} className="rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] text-white/35">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start button */}
              <div className="mt-4">
                <motion.button
                  whileTap={canStart ? { scale: 0.97 } : {}}
                  disabled={!canStart}
                  onClick={start}
                  className={`w-full text-sm font-semibold rounded-xl px-6 py-3 transition-all ${
                    canStart
                      ? "bg-accent text-white shadow-[0_0_30px_-8px] shadow-accent hover:shadow-[0_0_40px_-6px] hover:shadow-accent"
                      : "bg-white/[0.03] text-white/25 border border-white/[0.06] cursor-not-allowed"
                  }`}
                >
                  {canStart ? `Start ${selectedOS?.branding.shortName} → ${selectedPath?.name}` : "Select a path and OS"}
                </motion.button>
              </div>
            </div>
          </div>
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
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white/90">How it works</h2>
                <button onClick={() => setShowHelp(false)} className="text-white/40 hover:text-white/70 text-xl">×</button>
              </div>
              <div className="space-y-4">
                {[
                  { n: "1", title: "Choose your path", desc: "Virtual Machine (safest), Dual Boot (real hardware), or Live USB (try without installing)." },
                  { n: "2", title: "Pick an OS", desc: "Ubuntu, Windows, Arch, and more." },
                  { n: "3", title: "Follow the steps", desc: "Search for the ISO, flash a USB, enter BIOS, partition disks, and run the installer." },
                  { n: "4", title: "Learn as you go", desc: "Press B for speaker notes, N for scene navigator, S for speed mode." },
                ].map((s) => (
                  <div key={s.title} className="flex gap-3">
                    <span className="h-6 w-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0">{s.n}</span>
                    <div>
                      <div className="text-sm font-semibold text-white/80">{s.title}</div>
                      <div className="text-xs text-white/40 mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-4">
                  <div className="text-xs font-semibold text-white/60 mb-2">Keyboard shortcuts</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {[
                      ["Enter", "Next step"],
                      ["Backspace", "Go back"],
                      ["N", "Scene navigator"],
                      ["B", "Speaker notes"],
                      ["S", "Speed mode"],
                      ["T", "Change theme"],
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
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
