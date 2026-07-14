import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";

const GRUB_ENTRIES = [
  { id: "new", label: "", os: "" },
  { id: "windows", label: "Windows Boot Manager", os: "Windows" },
  { id: "memtest", label: "Memory Test (memtest86+)", os: "" },
  { id: "advanced", label: "Advanced options for New OS", os: "" },
];

type DonePhase = "grub" | "desktop" | "complete";

const REPO_URL = "https://github.com/jeevannar16-web/OS-installation";

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
    playClick();
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
                Use ↑↓ to select. Press Enter to boot.
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
            <div
              className="relative h-[500px] overflow-hidden rounded-2xl border border-white/10"
              style={{
                background: `linear-gradient(135deg, ${config.branding.surface} 0%, #0a0a1a 100%)`,
              }}
            >
              {!loginDone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl ring-2 ring-white/20">
                    {config.branding.logo}
                  </div>
                  <div className="mt-3 text-lg font-semibold text-white/90">User</div>
                  <div className="mt-2 text-xs text-white/40">Click to log in</div>
                  <button
                    onClick={() => { playClick(); setLoginDone(true); }}
                    className="mt-4 rounded-lg bg-white/10 px-6 py-2 text-sm text-white/80 hover:bg-white/15 transition-colors"
                  >
                    Log In
                  </button>
                </motion.div>
              )}

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
                      onClick={() => { playClick(); onComplete(); }}
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

              {/* GitHub CTA */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors"
                >
                  ⭐ Star on GitHub
                </a>
                <a
                  href={`${REPO_URL}/fork`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors"
                >
                  🍴 Fork
                </a>
                <a
                  href={`https://github.com/jeevannar16-web`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors"
                >
                  👤 Follow
                </a>
              </div>

              {/* Start Over */}
              <div className="mt-8">
                <button
                  onClick={() => { playClick(); onComplete(); }}
                  className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors"
                >
                  🔄 Start Over
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
