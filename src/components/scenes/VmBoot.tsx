import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playSuccess } from "../shared/sounds";

const DISPLAY: Record<string, { bg: string; accent: string; logo: string; bootMsg: string }> = {
  ubuntu:  { bg: "from-[#2c001e] to-[#1a0011]", accent: "#e95420", logo: "Ubuntu 24.04 LTS", bootMsg: "Starting Ubuntu installer..." },
  windows: { bg: "from-[#1a2b6b] to-[#0d1b4a]", accent: "#0078d7", logo: "Windows 11", bootMsg: "Starting Windows Setup..." },
  fedora:  { bg: "from-[#1a2a3a] to-[#0d1520]", accent: "#2b5e8c", logo: "Fedora Workstation 41", bootMsg: "Starting Fedora installer..." },
  mint:    { bg: "from-[#1a2a1a] to-[#0d150d]", accent: "#5a8c3e", logo: "Linux Mint 22", bootMsg: "Starting Linux Mint installer..." },
  zorin:   { bg: "from-[#0d1a2a] to-[#060e17]", accent: "#1a6ba0", logo: "Zorin OS 17.3 Core", bootMsg: "Starting Zorin OS installer..." },
  debian:  { bg: "from-[#1a0000] to-[#0d0000]", accent: "#d63333", logo: "Debian GNU/Linux 12", bootMsg: "Starting Debian installer..." },
};

export default function VmBoot({
  config,
  speed,
  onComplete,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const d = DISPLAY[config.id] || DISPLAY.ubuntu;
  const [phase, setPhase] = useState<"presskey" | "booting">("presskey");
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (phase === "presskey") {
      const t = setTimeout(() => setPhase("booting"), speed === "fast" ? 800 : 3000);
      return () => clearTimeout(t);
    }
  }, [phase, speed]);

  useEffect(() => {
    if (phase === "booting") {
      const t = setTimeout(() => { playSuccess(); onComplete(); }, speed === "fast" ? 600 : 2000);
      return () => clearTimeout(t);
    }
  }, [phase, speed, onComplete]);

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl select-none">
      <div className="overflow-hidden rounded-lg border border-gray-600/30 shadow-2xl">
        <div className="bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] px-2 py-1 text-[9px] text-gray-600 flex items-center border-b border-gray-300/50">
          <span className="font-semibold">{config.branding.shortName} VM</span>
          <span className="mx-2">—</span>
          <span className="text-gray-400">Oracle VM VirtualBox</span>
          <div className="flex-1" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        </div>
        <div className={`bg-gradient-to-b ${d.bg} flex items-center justify-center min-h-[360px] sm:min-h-[440px] lg:min-h-[540px]`}>
          {phase === "presskey" && (
            <div className="text-center px-6">
              <div className="font-mono text-white/40 text-sm mb-4">ISO: {config.iso.filename}</div>
              <div className="font-mono text-white text-lg sm:text-xl mb-2">Press any key to boot from CD/DVD{dots}</div>
              <div className="font-mono text-white/20 text-xs mt-6">Press Esc for boot menu</div>
            </div>
          )}
          {phase === "booting" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center px-6">
              <div className="text-white/60 text-base sm:text-lg font-semibold mb-2">{d.logo}</div>
              <div className="text-white/30 text-xs font-mono">{d.bootMsg}</div>
              <div className="flex justify-center gap-1 mt-4">
                {[0,1,2,3,4].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
