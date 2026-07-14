import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
type OpenApp = "files" | "editor" | "settings" | "browser" | null;

const REPO_URL = "https://github.com/jeevannar16-web/OS-installation";

function useClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 10000);
    return () => clearInterval(t);
  }, []);
  return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function FilesPopover({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute left-6 top-6 z-30 w-72 overflow-hidden rounded-xl bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10"
    >
      <div className="flex items-center gap-2 bg-[#252536] px-3 py-2 text-[10px] text-white/50">
        <span>📁</span> Files — Home
      </div>
      <div className="grid grid-cols-3 gap-2 p-3">
        {["Documents", "Downloads", "Music", "Pictures", "Videos", "Desktop"].map((f) => (
          <div key={f} className="flex flex-col items-center gap-1 rounded-lg p-2 text-center hover:bg-white/10 cursor-pointer transition-colors">
            <div className="text-2xl">📁</div>
            <div className="text-[9px] text-white/60">{f}</div>
          </div>
        ))}
      </div>
      <button onClick={onClose} className="w-full border-t border-white/10 py-1.5 text-[10px] text-white/40 hover:text-white/60">
        Close
      </button>
    </motion.div>
  );
}

function EditorPopover({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute left-6 top-6 z-30 w-80 overflow-hidden rounded-xl bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10"
    >
      <div className="flex items-center gap-2 bg-[#252536] px-3 py-2 text-[10px] text-white/50">
        <span>📄</span> Untitled — Text Editor
      </div>
      <div className="h-32 p-3 font-mono text-xs text-white/40 leading-relaxed">
        <div className="text-white/60"># Welcome to your new system!</div>
        <div className="mt-1">You've successfully installed Linux.</div>
        <div className="mt-1">Start customizing your setup.</div>
        <div className="mt-2 animate-pulse text-accent">▌</div>
      </div>
      <button onClick={onClose} className="w-full border-t border-white/10 py-1.5 text-[10px] text-white/40 hover:text-white/60">
        Close
      </button>
    </motion.div>
  );
}

function SettingsPopover({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute left-6 top-6 z-30 w-72 overflow-hidden rounded-xl bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10"
    >
      <div className="flex items-center gap-2 bg-[#252536] px-3 py-2 text-[10px] text-white/50">
        <span>⚙️</span> Settings
      </div>
      <div className="space-y-1 p-3">
        {["Wi-Fi", "Bluetooth", "Display", "Sound", "Power", "About"].map((s) => (
          <div key={s} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-white/60 hover:bg-white/5 cursor-pointer transition-colors">
            <span>{s}</span>
            <span className="text-white/20">›</span>
          </div>
        ))}
      </div>
      <button onClick={onClose} className="w-full border-t border-white/10 py-1.5 text-[10px] text-white/40 hover:text-white/60">
        Close
      </button>
    </motion.div>
  );
}

export default function Done({
  config,
  path,
  onComplete,
}: {
  config: OSConfig;
  path: string;
  onComplete: () => void;
}) {
  const navigate = useNavigate();
  const isDualBoot = path === "dual-boot";
  const [phase, setPhase] = useState<DonePhase>(
    isDualBoot ? "grub" : path === "live-usb" ? "desktop" : "complete"
  );
  const [grubSelected, setGrubSelected] = useState(0);
  const [loginDone, setLoginDone] = useState(false);
  const [openApp, setOpenApp] = useState<OpenApp>(null);
  const clock = useClock();

  const grubEntries = GRUB_ENTRIES.map((e, i) => ({
    ...e,
    label: i === 0 ? config.branding.name : e.label,
  }));

  const desktopIcons = [
    { id: "files" as const, icon: "📁", label: "Files" },
    { id: "browser" as const, icon: "🌐", label: "Browser" },
    { id: "settings" as const, icon: "⚙️", label: "Settings" },
    { id: "editor" as const, icon: "📄", label: "Text Editor" },
  ];

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
                  onClick={() => { setGrubSelected(i); handleGrubSelect(); }}
                  onMouseEnter={() => setGrubSelected(i)}
                  className={`w-full rounded px-4 py-3 text-left text-sm transition-colors ${
                    grubSelected === i ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  {grubSelected === i && <span className="mr-2 text-white/40">▶</span>}
                  {entry.label}
                </button>
              ))}
              <div className="mt-4 text-xs text-white/30">Use ↑↓ to select. Press Enter to boot.</div>
            </div>
          </motion.div>
        )}

        {/* Desktop + login */}
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
              {/* Login screen */}
              {!loginDone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl ring-2 ring-white/20"
                  >
                    {config.branding.logo}
                  </motion.div>
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

              {/* Desktop with staggered icons */}
              {loginDone && (
                <>
                  <div className="absolute inset-0 p-6">
                    <div className="grid grid-cols-4 gap-4">
                      {desktopIcons.map((d, i) => (
                        <motion.button
                          key={d.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 200, damping: 15 }}
                          onClick={() => { playClick(); setOpenApp(d.id); }}
                          className="flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-white/10 transition-colors relative"
                        >
                          <div className="text-3xl">{d.icon}</div>
                          <div className="text-[10px] text-white/70">{d.label}</div>
                        </motion.button>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="absolute bottom-14 left-0 right-0 flex justify-center"
                    >
                      <button
                        onClick={() => { playClick(); onComplete(); }}
                        className="rounded-xl bg-white/10 border border-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                      >
                        Continue to completion →
                      </button>
                    </motion.div>
                  </div>

                  {/* Popovers */}
                  <AnimatePresence>
                    {openApp === "files" && <FilesPopover onClose={() => setOpenApp(null)} />}
                    {openApp === "editor" && <EditorPopover onClose={() => setOpenApp(null)} />}
                    {openApp === "settings" && <SettingsPopover onClose={() => setOpenApp(null)} />}
                    {openApp === "browser" && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute left-6 top-6 z-30 w-80 overflow-hidden rounded-xl bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10"
                      >
                        <div className="flex items-center gap-2 bg-[#252536] px-3 py-2 text-[10px] text-white/50">
                          <span>🌐</span> Browser — New Tab
                        </div>
                        <div className="flex h-24 items-center justify-center text-xs text-white/30">
                          Welcome to the web browser
                        </div>
                        <button onClick={() => setOpenApp(null)} className="w-full border-t border-white/10 py-1.5 text-[10px] text-white/40 hover:text-white/60">
                          Close
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Taskbar */}
                  <div className="absolute inset-x-0 bottom-0 flex h-10 items-center gap-3 border-t border-white/10 bg-black/60 px-4 backdrop-blur">
                    <div className="text-sm font-semibold text-white/80">{config.branding.logo} {config.branding.name}</div>
                    <div className="ml-auto text-xs text-white/50">{clock}</div>
                  </div>
                </>
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
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

              <div className="mt-8 flex items-center justify-center gap-3">
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors">
                  ⭐ Star on GitHub
                </a>
                <a href={`${REPO_URL}/fork`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors">
                  🍴 Fork
                </a>
                <a href="https://github.com/jeevannar16-web" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors">
                  👤 Follow
                </a>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => { playClick(); navigate("/"); }}
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
