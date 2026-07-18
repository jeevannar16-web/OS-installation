import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

export default function MountISO({
  config,
  onComplete,
}: {
  config: OSConfig;
  onComplete: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [phase, setPhase] = useState<"settings" | "browsing" | "attached">("settings");
  const [showFilePicker, setShowFilePicker] = useState(false);

  useEffect(() => {
    if (phase === "attached") {
      registerAdvance(() => onComplete());
    }
  }, [phase, registerAdvance, onComplete]);

  function handleAttach() {
    playClick();
    setPhase("browsing");
    setShowFilePicker(true);
    setTimeout(() => {
      setShowFilePicker(false);
      setPhase("attached");
    }, 1500);
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black">
        <AnimatePresence mode="wait">
          <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} className="absolute inset-0">

            {/* Real VirtualBox Select ISO screenshot */}
            <img src="/images/virtualbox/05-select-iso.jpg" alt="Select ISO in VirtualBox"
              className="absolute inset-0 w-full h-full object-cover bg-[#2a2a2b]" />

            {/* Interactive overlay */}
            <div className="absolute inset-x-0 bottom-0">
              <div className="bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/60 to-transparent pt-20 pb-4 px-6">
                <div className="max-w-lg mx-auto space-y-3">

                  {phase === "settings" && (
                    <div className="space-y-2">
                      <div className="text-[10px] text-accent font-semibold uppercase tracking-wider">Mount the installation ISO</div>
                      <p className="text-xs text-white/60">
                        In VirtualBox Settings → Storage, select the <strong className="text-white/80">Empty optical drive</strong> under Controller: IDE, then click the CD icon to browse for your ISO.
                      </p>
                      <p className="text-[10px] text-white/40">
                        This is like inserting a physical DVD — the VM will boot from the ISO.
                      </p>
                    </div>
                  )}

                  {phase === "browsing" && (
                    <div className="space-y-2">
                      <div className="text-[10px] text-accent font-semibold uppercase tracking-wider">Browsing for ISO…</div>
                      <p className="text-xs text-white/60">Selecting <span className="font-mono text-accent">{config.iso.filename}</span> from Downloads…</p>
                    </div>
                  )}

                  {phase === "attached" && (
                    <div className="space-y-2">
                      <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">✓ ISO mounted successfully</div>
                      <p className="text-xs text-white/60">
                        <span className="font-mono text-white/80">{config.iso.filename}</span> is attached to the virtual optical drive.
                      </p>
                      <p className="text-[10px] text-white/40">
                        The VM is ready to start. Click <strong className="text-white/60">Next →</strong> to power it on.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ISO file picker overlay */}
        {showFilePicker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="rounded-xl bg-[#1e1e1e] border border-white/10 p-4 shadow-2xl w-80">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                <span className="text-sm">📂</span>
                <span className="text-xs text-white/60">Virtual Optical Disk Selector</span>
              </div>
              <div className="rounded-lg bg-[#2a2a2b] p-3 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="inline-block text-2xl">💿</motion.div>
                <div className="mt-2 text-xs text-white/50">Selecting disk image…</div>
                <div className="mt-1 text-[10px] text-white/30 font-mono">{config.iso.filename}</div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }} animate={{ width: "100%" }}
                    transition={{ duration: 1.4, ease: "easeInOut" }} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between border-t border-white/10 bg-[#1a1a24] px-4 py-2.5 rounded-b-2xl shrink-0">
        <div className="text-xs text-white/30">
          {phase === "attached"
            ? "✓ ISO mounted — ready to start the VM"
            : "⚠ Attach the ISO before starting the VM"}
        </div>
        {phase === "settings" ? (
          <button onClick={handleAttach}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/80 transition-colors">
            💿 Choose / Attach ISO
          </button>
        ) : phase === "attached" ? (
          <button onClick={onComplete}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/80 transition-colors">
            Start VM →
          </button>
        ) : (
          <div className="text-xs text-white/40">Attaching…</div>
        )}
      </div>
    </div>
  );
}
