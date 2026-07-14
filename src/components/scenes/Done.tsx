import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";

const GRUB_ENTRIES = [
  { id: "new", label: "", os: "" },
  { id: "windows", label: "Windows Boot Manager", os: "Windows" },
  { id: "memtest", label: "Memory Test (memtest86+)", os: "" },
  { id: "advanced", label: "Advanced options for New OS", os: "" },
];

type DonePhase = "grub" | "desktop" | "complete";

export default function Done({
  config,
  path,
  onComplete,
}: {
  config: OSConfig;
  path: string;
  onComplete: () => void;
}) {
  const isDualBoot = path === "dual-boot";
  const [phase, setPhase] = useState<DonePhase>(
    isDualBoot ? "grub" : path === "live-usb" ? "desktop" : "complete"
  );
  const [grubSelected, setGrubSelected] = useState(0);
  const [loginDone, setLoginDone] = useState(false);

  const grubEntries = GRUB_ENTRIES.map((e, i) => ({
    ...e,
    label: i === 0 ? config.branding.name : e.label,
  }));

  function handleGrubSelect() {
    setPhase("desktop");
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AnimatePresence mode="wait">
        {/* GRUB menu (dual-boot only) */}
        {phase === "grub" && (
          <motion.div
            key="grub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black font-mono"
          >
            <div className="w-full max-w-xl space-y-1">
              <div className="mb-4 text-sm font-bold text-white/80">
                GNU GRUB version 2.12
              </div>
              {grubEntries.map((entry, i) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setGrubSelected(i);
                    handleGrubSelect();
                  }}
                  onMouseEnter={() => setGrubSelected(i)}
                  className={`w-full rounded px-4 py-3 text-left text-sm transition-colors ${
                    grubSelected === i
                      ? "bg-white/15 text-white"
                      : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  {grubSelected === i && (
                    <span className="mr-2 text-white/40">▶</span>
                  )}
                  {entry.label}
                </button>
              ))}
              <div className="mt-4 text-xs text-white/30">
                Use the ↑ and ↓ keys to select which entry is highlighted.
                Press enter to boot the selected entry.
              </div>
            </div>
          </motion.div>
        )}

        {/* Fake desktop + login */}
        {phase === "desktop" && (
          <motion.div
            key="desktop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Fake desktop background */}
            <div
              className="relative h-[500px] overflow-hidden rounded-2xl border border-white/10"
              style={{
                background: `linear-gradient(135deg, ${config.branding.surface} 0%, #0a0a1a 100%)`,
              }}
            >
              {/* Login screen overlay */}
              {!loginDone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl ring-2 ring-white/20">
                    {config.branding.logo}
                  </div>
                  <div className="mt-3 text-lg font-semibold text-white/90">
                    User
                  </div>
                  <div className="mt-2 text-xs text-white/40">
                    Click to log in
                  </div>
                  <button
                    onClick={() => setLoginDone(true)}
                    className="mt-4 rounded-lg bg-white/10 px-6 py-2 text-sm text-white/80 hover:bg-white/15 transition-colors"
                  >
                    Log In
                  </button>
                </motion.div>
              )}

              {/* Desktop icons after login */}
              {loginDone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 p-6"
                >
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { icon: "📁", label: "Files" },
                      { icon: "🌐", label: "Browser" },
                      { icon: "⚙️", label: "Settings" },
                      { icon: "📄", label: "Text Editor" },
                    ].map((d) => (
                      <div
                        key={d.label}
                        className="flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <div className="text-3xl">{d.icon}</div>
                        <div className="text-[10px] text-white/70">{d.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                    <button
                      onClick={() => onComplete()}
                      className="rounded-xl bg-white/10 border border-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                    >
                      Continue to completion →
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Completion card */}
        {phase === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-2xl font-bold text-white/90">
                {config.completion.headline}
              </h1>
              <p className="mt-3 text-sm text-white/50 max-w-md mx-auto">
                {config.completion.sub}
              </p>

              <div className="mt-8 space-y-4">
                <div className="text-xs uppercase tracking-widest text-white/30">
                  Real Download Links
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { name: "Ubuntu", url: "https://ubuntu.com/download/desktop" },
                    { name: "Windows", url: "https://microsoft.com/software-download/windows11" },
                    { name: "Arch", url: "https://archlinux.org/download/" },
                    { name: "Debian", url: "https://www.debian.org/distrib/" },
                    { name: "Fedora", url: "https://fedoraproject.org/workstation/download" },
                  ].map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {link.name} →
                    </a>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors"
                >
                  ⭐ Star on GitHub
                </a>
              </div>
            </div>

            <button
              onClick={() => onComplete()}
              className="btn-ghost mx-auto block"
            >
              ← Start over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
