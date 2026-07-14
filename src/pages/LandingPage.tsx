import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PATHS, OS_LIST } from "../data";
import type { InstallPath } from "../data/types";
import Footer from "../components/Footer";
import MiniDemo from "../components/MiniDemo";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
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
      className={`glass rounded-2xl p-6 text-left transition-all ${
        active ? "ring-2 ring-accent shadow-[0_0_40px_-10px] shadow-accent" : ""
      }`}
    >
      <div className="relative h-10 overflow-hidden">
        <div className="text-3xl">{p.icon}</div>
        {/* Hover animation cue */}
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
      <p className="mt-3 text-sm text-white/55">{p.description}</p>
    </motion.button>
  );
}

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
      className={`glass rounded-2xl p-5 flex flex-col items-center text-center transition-all ${
        disabled
          ? "opacity-40 cursor-not-allowed grayscale"
          : `hover:-translate-y-1 ${active ? "ring-2 ring-accent" : ""}`
      }`}
      title={disabled ? "Coming soon" : undefined}
    >
      <div
        className="text-4xl"
        style={{
          filter: disabled
            ? "grayscale(1) opacity(0.5)"
            : `drop-shadow(0 0 12px ${o.branding.accent}66)`,
        }}
      >
        {o.branding.logo}
      </div>
      <div className="mt-3 font-semibold">{o.branding.name}</div>
      {disabled && (
        <span className="mt-1.5 rounded-full bg-white/5 text-white/30 text-[10px] px-2 py-0.5 border border-white/5">
          Coming soon
        </span>
      )}
    </motion.button>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [path, setPath] = useState<InstallPath | null>(null);
  const [os, setOs] = useState<string | null>(null);

  const canStart = path && os;
  const selectedOS = os ? OS_LIST.find((x) => x.id === os) : null;
  const selectedPath = path ? PATHS.find((x) => x.id === path) : null;

  function start() {
    if (!path || !os) return;
    navigate(`/${os}/${path}`);
  }

  const ctaLabel = canStart
    ? `Start ${selectedOS?.branding.shortName} — ${selectedPath?.name} →`
    : "Select a path and an OS to begin";

  return (
    <div className="min-h-full flex flex-col relative overflow-hidden">
      {/* Ambient background motion */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <motion.div
          animate={{
            background: [
              "radial-gradient(800px 600px at 20% 0%, rgba(124,92,255,0.08) 0%, transparent 60%)",
              "radial-gradient(800px 600px at 80% 20%, rgba(124,92,255,0.06) 0%, transparent 60%)",
              "radial-gradient(800px 600px at 20% 0%, rgba(124,92,255,0.08) 0%, transparent 60%)",
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        />
        <motion.div
          animate={{
            background: [
              "radial-gradient(600px 500px at 90% 80%, rgba(6,182,212,0.06) 0%, transparent 55%)",
              "radial-gradient(600px 500px at 30% 90%, rgba(6,182,212,0.04) 0%, transparent 55%)",
              "radial-gradient(600px 500px at 90% 80%, rgba(6,182,212,0.06) 0%, transparent 55%)",
            ],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        />
      </div>

      {/* Header */}
      <header className="mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-xl">💿</span>
          <span>OS Install Simulator</span>
        </div>
        <span className="text-xs uppercase tracking-widest text-white/40">
          Practice · Don't risk
        </span>
      </header>

      {/* Hero with live mini-demo */}
      <section className="mx-auto w-full max-w-5xl px-6 pt-8 pb-10">
        <div className="flex flex-col lg:flex-row items-center gap-10">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
            >
              Interactive · Realistic · 100% safe
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 20 }}
              className="mt-5 text-4xl sm:text-5xl font-bold leading-tight"
            >
              Practice installing an OS
              <br />
              <span className="bg-gradient-to-r from-accent-soft to-accent bg-clip-text text-transparent">
                before you actually do it
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-5 text-white/60 text-lg max-w-lg"
            >
              Watch and interact with a convincingly real simulation — search &amp; download the ISO,
              flash a USB, survive the BIOS menu, and run the installer. No real hardware, no risk.
            </motion.p>
          </div>

          {/* Live mini-demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          >
            <MiniDemo />
          </motion.div>
        </div>
      </section>

      {/* Path selection */}
      <section className="mx-auto w-full max-w-6xl px-6 mt-6">
        <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">
          Step 1 — Choose how you'll install
        </h2>
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

      {/* OS selection */}
      <section className="mx-auto w-full max-w-6xl px-6 mt-10">
        <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">
          Step 2 — Pick an operating system
        </h2>
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

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 mt-10 mb-4">
        <motion.button
          whileTap={canStart ? { scale: 0.97 } : {}}
          disabled={!canStart}
          onClick={start}
          className={`w-full sm:w-auto text-base font-semibold rounded-xl px-6 py-3 transition-all duration-500 ${
            canStart
              ? "bg-accent text-white shadow-[0_0_30px_-6px] shadow-accent hover:bg-accent-soft hover:shadow-[0_0_40px_-6px] hover:shadow-accent cursor-pointer"
              : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={ctaLabel}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {ctaLabel}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        {!canStart && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-sm text-white/40"
          >
            Pick one install method above and one operating system.
          </motion.p>
        )}
      </section>

      <div className="flex-1" />
      <Footer />
    </div>
  );
}
