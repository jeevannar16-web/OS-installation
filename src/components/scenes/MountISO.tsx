import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

type Tab = "system" | "display" | "storage" | "network";

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: "system", icon: "🔧", label: "System" },
  { key: "display", icon: "🖥", label: "Display" },
  { key: "storage", icon: "💿", label: "Storage" },
  { key: "network", icon: "🌐", label: "Network" },
];

export default function MountISO({
  config,
  onComplete,
}: {
  config: OSConfig;
  onComplete: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [tab, setTab] = useState<Tab>("storage");
  const [isoAttached, setIsoAttached] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);

  useEffect(() => {
    if (isoAttached) {
      registerAdvance(() => onComplete());
    }
  }, [isoAttached, registerAdvance, onComplete]);

  function handleAttach() {
    playClick();
    setShowFilePicker(true);
    setTimeout(() => {
      setShowFilePicker(false);
      setIsoAttached(true);
    }, 1200);
  }

  return (
    <div className="mx-auto w-full max-w-4xl lg:max-w-5xl space-y-4">
      {/* Settings dialog */}
      <div className="overflow-hidden rounded-xl bg-[#2a2a2b] shadow-2xl ring-1 ring-white/10">
        {/* Title bar */}
        <div className="flex items-center gap-2 bg-[#3c3c3c] px-3 py-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="mx-auto text-xs text-white/60">
            {config.branding.shortName} VM — Settings
          </span>
        </div>

        <div className="flex h-[420px] lg:h-[520px] xl:h-[600px]">
          {/* Sidebar tabs */}
          <div className="w-44 shrink-0 border-r border-white/10 bg-[#1e1e1e] p-2">
            <div className="mb-2 text-xs uppercase tracking-wide text-white/40 px-2 pt-1">
              General
            </div>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); playClick(); }}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                  tab === t.key
                    ? "bg-accent/20 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-6">
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              {tab === "storage" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white/80">Storage Devices</h3>

                  {/* Storage tree */}
                  <div className="rounded-lg border border-white/10 bg-[#1e1e1e] p-3">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-white/40">
                        <span>Storage Devices</span>
                      </div>
                      <div className="ml-4 flex items-center gap-2 text-white/60 hover:text-white cursor-pointer rounded px-2 py-1 hover:bg-white/5">
                        <span>💿</span>
                        <span>Controller: IDE</span>
                      </div>
                      <div
                        className={`ml-8 flex items-center gap-2 rounded px-2 py-1 cursor-pointer ${
                          isoAttached
                            ? "text-emerald-300 bg-emerald-500/10"
                            : "text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        <span>{isoAttached ? "💿" : "📀"}</span>
                        <span>
                          {isoAttached
                            ? `${config.iso.filename} (attached)`
                            : "Empty optical drive"}
                        </span>
                      </div>
                      <div className="ml-4 flex items-center gap-2 text-white/60 hover:text-white cursor-pointer rounded px-2 py-1 hover:bg-white/5">
                        <span>🗄</span>
                        <span>Controller: SATA</span>
                      </div>
                      <div className="ml-8 flex items-center gap-2 rounded px-2 py-1 text-white/50">
                        <span>💾</span>
                        <span>{config.branding.shortName}.vdi (25.00 GB)</span>
                      </div>
                    </div>
                  </div>

                  {/* Attributes */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold text-white/60">Attributes</h4>
                    <div className="rounded-lg border border-white/10 bg-[#1e1e1e] p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white/50">Optical Drive:</span>
                        <span className="text-white/80">
                          {isoAttached ? "SATA Port 2" : "SATA Port 2 (Empty)"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50">Type:</span>
                        <span className="text-white/80">DVD</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50">Live CD/DVD:</span>
                        <span className="text-white/80">Off</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAttach}
                    disabled={isoAttached}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isoAttached
                        ? "bg-emerald-500/20 text-emerald-300 cursor-default"
                        : "bg-accent/20 text-accent hover:bg-accent/30"
                    }`}
                  >
                    {isoAttached ? `✓ ${config.iso.filename} attached` : `💿 Choose / Attach ISO`}
                  </button>
                </div>
              )}

              {tab === "system" && (
                <div className="space-y-4 text-sm text-white/60">
                  <h3 className="font-semibold text-white/80">System Settings</h3>
                  <div className="rounded-lg border border-white/10 bg-[#1e1e1e] p-3 space-y-2">
                    <div className="flex justify-between"><span>Base Memory:</span><span className="text-white/80">2048 MB</span></div>
                    <div className="flex justify-between"><span>Processors:</span><span className="text-white/80">2 CPU</span></div>
                    <div className="flex justify-between"><span>Boot Order:</span><span className="text-white/80">Optical → Hard Disk</span></div>
                    <div className="flex justify-between"><span>Acceleration:</span><span className="text-white/80">VT-x/AMD-V ✓</span></div>
                  </div>
                  <p className="text-xs text-white/40">Navigate to <strong className="text-white/70">Storage</strong> to attach the installation ISO.</p>
                </div>
              )}

              {tab === "display" && (
                <div className="space-y-4 text-sm text-white/60">
                  <h3 className="font-semibold text-white/80">Display Settings</h3>
                  <div className="rounded-lg border border-white/10 bg-[#1e1e1e] p-3 space-y-2">
                    <div className="flex justify-between"><span>Video Memory:</span><span className="text-white/80">128 MB</span></div>
                    <div className="flex justify-between"><span>Graphics Controller:</span><span className="text-white/80">VMSVGA</span></div>
                    <div className="flex justify-between"><span>Acceleration:</span><span className="text-white/80">3D Acceleration ✓</span></div>
                  </div>
                </div>
              )}

              {tab === "network" && (
                <div className="space-y-4 text-sm text-white/60">
                  <h3 className="font-semibold text-white/80">Network Settings</h3>
                  <div className="rounded-lg border border-white/10 bg-[#1e1e1e] p-3 space-y-2">
                    <div className="flex justify-between"><span>Adapter 1:</span><span className="text-white/80">NAT ✓</span></div>
                    <div className="flex justify-between"><span>Attached to:</span><span className="text-white/80">NAT</span></div>
                    <div className="flex justify-between"><span>Name:</span><span className="text-white/80">enp0s3</span></div>
                    <div className="flex justify-between"><span>MAC:</span><span className="text-white/80 font-mono">08:00:27:XX:XX:XX</span></div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Bottom */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
              <div className="text-xs text-white/30">
                {isoAttached
                  ? "✓ ISO mounted — you can start the VM now"
                  : "⚠ Attach the ISO before starting the VM"}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { playClick(); }}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { playClick(); onComplete(); }}
                  disabled={!isoAttached}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isoAttached
                      ? "bg-accent text-white hover:bg-accent/80"
                      : "bg-white/10 text-white/30 cursor-not-allowed"
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File picker overlay */}
      {showFilePicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="rounded-xl bg-[#1e1e1e] border border-white/10 p-4 shadow-2xl w-80"
          >
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
              <span className="text-sm">📂</span>
              <span className="text-xs text-white/60">Select disk image…</span>
            </div>
            <div className="rounded-lg bg-[#2a2a2b] p-3 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="inline-block text-2xl"
              >
                💿
              </motion.div>
              <div className="mt-2 text-xs text-white/50">Browsing Downloads…</div>
              <div className="mt-1 text-[10px] sm:text-xs text-white/30 font-mono">{config.iso.filename}</div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="text-center text-sm text-white/50">
        Open Settings → Storage and attach the <span className="text-accent">{config.iso.filename}</span> ISO.
      </div>
    </div>
  );
}
