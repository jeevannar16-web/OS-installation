import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

type TerminalEntry = { cmd: string; output: string };
type OpenApp = "files" | "browser" | "settings" | "terminal" | null;

function getWelcomeText(osName: string): string {
  return `Welcome to ${osName} (Linux 6.8.0-generic)\nLast login: ${new Date().toUTCString()}`;
}

function processCommand(cmd: string, osName: string): string {
  const c = cmd.trim().toLowerCase();
  if (!c) return "";
  if (c === "ls") return "Desktop  Documents  Downloads  Music  Pictures  Public  Templates  Videos";
  if (c === "pwd") return "/home/user";
  if (c === "whoami") return "user";
  if (c === "hostname") return osName.toLowerCase().replace(/\s+/g, "-") + "-live";
  if (c === "uname -a") return `Linux live 6.8.0-generic #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`;
  if (c === "uname -r") return "6.8.0-generic";
  if (c === "uptime") return ` ${new Date().toLocaleTimeString()} up 5 min, 1 user, load average: 0.12, 0.08, 0.03`;
  if (c === "df -h") return `Filesystem      Size  Used Avail Use% Mounted on\n/dev/sdb1       30G  2.1G   28G   7% /\ntmpfs           8.0G     0  8.0G   0% /dev/shm`;
  if (c === "free -h") return `              total        used        free      shared  buff/cache   available\nMem:           16Gi       1.2Gi       13Gi       256Mi       1.5Gi        14Gi\nSwap:         2.0Gi          0B       2.0Gi`;
  if (c === "neofetch") {
    return `${osName} (Live)\n-------------\nOS: ${osName} Linux 6.8.0\nHost: VirtualBox\nKernel: 6.8.0-generic\nUptime: 5 mins\nShell: bash 5.2.21\nDE: GNOME 46\nCPU: Intel i7-12700K\nMemory: 1.2GiB / 16GiB`;
  }
  if (c === "help") return "Available: ls, pwd, whoami, hostname, uname, uptime, df, free, neofetch, clear, help";
  if (c === "clear") return "__CLEAR__";
  return `bash: ${cmd}: command not found`;
}

const OS_WALLPAPER: Record<string, string> = {
  ubuntu: "/images/ubuntu/12-welcome-desktop.png",
  zorin: "/images/zorin/02-live-desktop.png",
  mint: "/images/mint/02-live-desktop.png",
  arch: "/images/arch/08-live-login.png",
};

export default function LiveDesktop({
  config,
  onInstallClick,
}: {
  config: OSConfig;
  onInstallClick: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [openApp, setOpenApp] = useState<OpenApp>(null);
  const osName = config.branding.name;

  useEffect(() => {
    registerAdvance(() => onInstallClick());
  }, [registerAdvance, onInstallClick]);

  const [entries, setEntries] = useState<TerminalEntry[]>([
    { cmd: "", output: getWelcomeText(osName) },
  ]);
  const [input, setInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const output = processCommand(input, osName);
    if (output === "__CLEAR__") {
      setEntries([]);
    } else {
      setEntries((prev) => [...prev, { cmd: input, output }]);
    }
    setInput("");
  }

  const name = osName;

  return (
    <div
      className="relative min-h-[400px] sm:h-[680px] lg:h-[75vh] overflow-hidden rounded-2xl border border-white/10"
    >
      {/* Real Ubuntu desktop background */}
      <img
        src={OS_WALLPAPER[config.id] || OS_WALLPAPER.ubuntu}
        alt={`${config.branding.name} desktop`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Desktop icons overlay */}
      <div className="absolute inset-0 p-6 z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => { playClick(); setOpenApp("terminal"); }}
            className="flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-black/30 backdrop-blur-sm transition-colors"
          >
            <div className="text-3xl">💻</div>
            <div className="text-xs sm:text-sm text-white/90 drop-shadow-lg">Terminal</div>
          </button>
          <button
            onClick={() => { playClick(); setOpenApp("files"); }}
            className="flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-black/30 backdrop-blur-sm transition-colors"
          >
            <div className="text-3xl">📁</div>
            <div className="text-xs sm:text-sm text-white/90 drop-shadow-lg">Files</div>
          </button>
          <button
            onClick={() => { playClick(); setOpenApp("browser"); }}
            className="flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-black/30 backdrop-blur-sm transition-colors"
          >
            <div className="text-3xl">🌐</div>
            <div className="text-xs sm:text-sm text-white/90 drop-shadow-lg">Browser</div>
          </button>
          <button
            onClick={() => { playClick(); setOpenApp("settings"); }}
            className="flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-black/30 backdrop-blur-sm transition-colors"
          >
            <div className="text-3xl">⚙️</div>
            <div className="text-xs sm:text-sm text-white/90 drop-shadow-lg">Settings</div>
          </button>
        </div>

        {/* Install icon */}
        <button
          onClick={() => { playClick(); onInstallClick(); }}
          className="absolute bottom-20 left-6 flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-black/30 backdrop-blur-sm transition-colors"
        >
          <div className="text-3xl">💿</div>
          <div className="text-xs sm:text-sm text-white/90 drop-shadow-lg">Install {name}</div>
        </button>
      </div>

      {/* App windows */}
      <AnimatePresence>
        {openApp === "terminal" && (
          <motion.div
            key="terminal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-1/2 top-1/2 z-10 flex h-[300px] sm:h-[400px] lg:h-[500px] w-[calc(100%-2rem)] sm:w-[560px] lg:w-[700px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1a1a2e] shadow-2xl"
          >
            <div className="flex items-center gap-2 bg-[#2a2a3e] px-3 py-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="mx-auto text-xs text-white/50">Terminal — {name}</div>
              <button
                onClick={() => setOpenApp(null)}
                className="text-white/40 hover:text-white text-sm min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-emerald-400">
              {entries.map((e, i) => (
                <div key={i} className="mb-2">
                  {e.cmd && (
                    <div>
                      <span className="text-accent-soft">user@{name.toLowerCase().replace(/\s/g, "-")}</span>
                      <span className="text-white/40">:</span>
                      <span className="text-blue-400">~</span>
                      <span className="text-white/40">$ </span>
                      <span className="text-white/80">{e.cmd}</span>
                    </div>
                  )}
                  <pre className="whitespace-pre-wrap text-white/70">{e.output}</pre>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex border-t border-white/10 px-3 py-2 font-mono text-xs">
              <span className="text-accent-soft">user@{name.toLowerCase().replace(/\s/g, "-")}</span>
              <span className="text-white/40">:</span>
              <span className="text-blue-400">~</span>
              <span className="text-white/40">$ </span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent text-white/80 outline-none"
                autoFocus
              />
            </form>
          </motion.div>
        )}

        {openApp === "files" && (
          <motion.div
            key="files"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[480px] rounded-xl bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10 overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-[#2a2a3e] px-3 py-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="mx-auto text-xs text-white/50">Files — Home</div>
              <button onClick={() => setOpenApp(null)} className="text-white/40 hover:text-white text-sm min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">×</button>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {["Documents", "Downloads", "Music", "Pictures", "Videos", "Desktop"].map((f) => (
                <div key={f} className="flex flex-col items-center gap-1 rounded-lg p-3 hover:bg-white/10 cursor-pointer">
                  <span className="text-2xl">📁</span>
                  <span className="text-[10px] text-white/60">{f}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 px-4 py-2 text-[10px] text-white/30">
              6 folders — Free space: 28.1 GB
            </div>
          </motion.div>
        )}

        {openApp === "browser" && (
          <motion.div
            key="browser"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[520px] rounded-xl bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10 overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-[#2a2a3e] px-3 py-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="mx-auto text-xs text-white/50">Firefox — {name} Start Page</div>
              <button onClick={() => setOpenApp(null)} className="text-white/40 hover:text-white text-sm min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">×</button>
            </div>
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">🌐</div>
              <div className="text-sm text-white/60 mb-4">Firefox is running in the live session</div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                <div className="text-xs text-white/40 mb-2">You're browsing from a live USB — no changes are saved.</div>
                <div className="text-xs text-white/30">Network: {config.branding.name} Live</div>
              </div>
            </div>
          </motion.div>
        )}

        {openApp === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[420px] rounded-xl bg-[#1a1a2e] shadow-2xl ring-1 ring-white/10 overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-[#2a2a3e] px-3 py-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="mx-auto text-xs text-white/50">Settings</div>
              <button onClick={() => setOpenApp(null)} className="text-white/40 hover:text-white text-sm min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">×</button>
            </div>
            <div className="p-2">
              {[
                { icon: "📶", label: "Wi-Fi", detail: "Connected" },
                { icon: "🖥️", label: "Display", detail: "1920×1080" },
                { icon: "🔊", label: "Sound", detail: "Built-in Audio" },
                { icon: "🔋", label: "Power", detail: "Balanced" },
                { icon: "🔒", label: "Privacy", detail: "Location: Off" },
                { icon: "ℹ️", label: "About", detail: `${name} Linux 6.8.0` },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer">
                  <span className="text-lg">{s.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs text-white/70">{s.label}</div>
                    <div className="text-[10px] text-white/30">{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Taskbar */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center gap-3 border-t border-white/10 bg-black/60 px-4 backdrop-blur">
        <div className="text-sm font-semibold text-white/80">{config.branding.logo} {name}</div>
        <div className="ml-auto text-xs text-white/50 hidden sm:block">
          Live Session — {name} is running from USB
        </div>
      </div>
    </div>
  );
}
