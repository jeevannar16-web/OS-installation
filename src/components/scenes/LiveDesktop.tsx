import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

type TerminalEntry = { cmd: string; output: string };

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

export default function LiveDesktop({
  config,
  onInstallClick,
}: {
  config: OSConfig;
  onInstallClick: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [termOpen, setTermOpen] = useState(false);
  const osName = config.branding.name;

  useEffect(() => {
    registerAdvance(() => onInstallClick());
  }, [registerAdvance, onInstallClick]);
  const [entries, setEntries] = useState<TerminalEntry[]>([
    { cmd: "", output: getWelcomeText(osName) },
  ]);
  const [input, setInput] = useState("");
  const name = osName;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const output = processCommand(input, name);
    if (output === "__CLEAR__") {
      setEntries([]);
    } else {
      setEntries((prev) => [...prev, { cmd: input, output }]);
    }
    setInput("");
  }

  return (
    <div
      className="relative min-h-[400px] sm:h-[680px] lg:h-[75vh] overflow-hidden rounded-2xl border border-white/10"
      style={{
        background: `linear-gradient(135deg, ${config.branding.surface} 0%, #0a0a1a 100%)`,
      }}
    >
      {/* Desktop icons */}
      <div className="absolute inset-0 p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => { playClick(); setTermOpen(true); }}
            className="flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-white/10 transition-colors"
          >
            <div className="text-3xl">💻</div>
            <div className="text-xs sm:text-sm text-white/70">Terminal</div>
          </button>
          <div className="flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-white/10 transition-colors cursor-pointer">
            <div className="text-3xl">📁</div>
            <div className="text-xs sm:text-sm text-white/70">Files</div>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-white/10 transition-colors cursor-pointer">
            <div className="text-3xl">🌐</div>
            <div className="text-xs sm:text-sm text-white/70">Browser</div>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-white/10 transition-colors cursor-pointer">
            <div className="text-3xl">⚙️</div>
            <div className="text-xs sm:text-sm text-white/70">Settings</div>
          </div>
        </div>

        {/* Install icon */}
        <button
          onClick={() => { playClick(); onInstallClick(); }}
          className="absolute bottom-20 left-6 flex flex-col items-center gap-1 rounded-lg p-3 text-center hover:bg-white/10 transition-colors"
        >
          <div className="text-3xl">💿</div>
          <div className="text-xs sm:text-sm text-white/70">Install {name}</div>
        </button>
      </div>

      {/* Terminal window */}
      <AnimatePresence>
        {termOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-1/2 top-1/2 z-10 flex h-[300px] sm:h-[400px] lg:h-[500px] w-[calc(100%-2rem)] sm:w-[560px] lg:w-[700px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1a1a2e] shadow-2xl"
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 bg-[#2a2a3e] px-3 py-2">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="mx-auto text-xs text-white/50">Terminal — {name}</div>
              <button
                onClick={() => setTermOpen(false)}
                className="text-white/40 hover:text-white text-sm min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Output */}
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

            {/* Input */}
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
