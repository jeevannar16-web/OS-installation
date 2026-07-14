import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PATHS, OS_LIST } from "../data";
import type { InstallPath } from "../data/types";
import Footer from "../components/Footer";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [path, setPath] = useState<InstallPath | null>(null);
  const [os, setOs] = useState<string | null>(null);

  const canStart = path && os;

  function start() {
    if (!path || !os) return;
    navigate(`/${os}/${path}`);
  }

  return (
    <div className="min-h-full flex flex-col">
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

      {/* Hero */}
      <section className="mx-auto w-full max-w-3xl px-6 pt-10 text-center">
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
          transition={{ delay: 0.05 }}
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
          className="mt-5 text-white/60 text-lg"
        >
          Watch and interact with a convincingly real simulation — search &amp; download the ISO,
          flash a USB, survive the BIOS menu, and run the installer. No real hardware, no risk.
        </motion.p>
      </section>

      {/* Path selection */}
      <section className="mx-auto w-full max-w-6xl px-6 mt-14">
        <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">
          Step 1 — Choose how you'll install
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-3"
        >
          {PATHS.map((p) => {
            const active = path === p.id;
            return (
              <motion.button
                key={p.id}
                variants={item}
                onClick={() => setPath(p.id)}
                className={`glass rounded-2xl p-6 text-left transition-all hover:-translate-y-1 ${
                  active ? "ring-2 ring-accent shadow-[0_0_40px_-10px] shadow-accent" : ""
                }`}
              >
                <div className="text-3xl">{p.icon}</div>
                <div className="mt-3 font-semibold text-lg">{p.name}</div>
                <div className="text-accent-soft text-xs uppercase tracking-wide mt-1">
                  {p.tagline}
                </div>
                <p className="mt-3 text-sm text-white/55">{p.description}</p>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      {/* OS selection */}
      <section className="mx-auto w-full max-w-6xl px-6 mt-12">
        <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">
          Step 2 — Pick an operating system
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
        >
          {OS_LIST.map((o) => {
            const active = os === o.id;
            return (
              <motion.button
                key={o.id}
                variants={item}
                onClick={() => setOs(o.id)}
                className={`glass rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:-translate-y-1 ${
                  active ? "ring-2 ring-accent" : ""
                }`}
              >
                <div className="text-4xl" style={{ filter: `drop-shadow(0 0 12px ${o.branding.accent}66)` }}>
                  {o.branding.logo}
                </div>
                <div className="mt-3 font-semibold">{o.branding.name}</div>
                {o.stub && (
                  <span className="mt-1 rounded-full bg-amber-400/15 text-amber-300 text-[10px] px-2 py-0.5">
                    Soon
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 mt-10 mb-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!canStart}
          onClick={start}
          className="btn-primary w-full sm:w-auto text-base"
        >
          {canStart
            ? `Start simulating ${os && (OS_LIST.find((x) => x.id === os)?.branding.shortName)} (${path})`
            : "Select a path and an OS to begin"}
        </motion.button>
        {!canStart && (
          <p className="mt-3 text-sm text-white/40">
            Pick one install method above and one operating system.
          </p>
        )}
      </section>

      <div className="flex-1" />
      <Footer />
    </div>
  );
}
