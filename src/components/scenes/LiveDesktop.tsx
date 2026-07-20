import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";
import OsIcon from "../shared/OsIcon";

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

const OS_GRADIENTS: Record<string, string> = {
  ubuntu: "linear-gradient(135deg, #2c001e 0%, #481c34 50%, #1a1a2e 100%)",
  zorin: "linear-gradient(135deg, #0a2647 0%, #144272 50%, #0a1628 100%)",
  mint: "linear-gradient(135deg, #0d2818 0%, #1a4a2e 50%, #0a1a0a 100%)",
  debian: "linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #0d0000 100%)",
  fedora: "linear-gradient(135deg, #0d1117 0%, #1f3a5f 50%, #0d1117 100%)",
  arch: "linear-gradient(135deg, #0a0a1a 0%, #1793d1 50%, #0a0a1a 100%)",
};

const DESKTOP_ICONS = [
  { id: "terminal", icon: "💻", label: "Terminal", shortcut: "Ctrl+Alt+T" },
  { id: "files", icon: "📁", label: "Files", shortcut: "Super+E" },
  { id: "browser", icon: "🌐", label: "Firefox", shortcut: "Super+W" },
  { id: "settings", icon: "⚙️", label: "Settings", shortcut: "" },
];

export default function LiveDesktop({
  config,
  onInstallClick,
}: {
  config: OSConfig;
  onInstallClick: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [openApp, setOpenApp] = useState<OpenApp>(null);
  const [time, setTime] = useState(new Date());
  const osName = config.branding.name;

  useEffect(() => {
    registerAdvance(() => onInstallClick());
  }, [registerAdvance, onInstallClick]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [entries, setEntries] = useState<TerminalEntry[]>([
    { cmd: "", output: getWelcomeText(osName) },
  ]);
  const [input, setInput] = useState("");
  const termEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

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

  return (
    <div className="flex-1 flex flex-col" style={{ borderRadius: "1rem", overflow: "hidden" }}>
      <div className="flex-1 relative overflow-hidden">
        {/* Wallpaper */}
        <div className="absolute inset-0" style={{ background: OS_GRADIENTS[config.id] || `linear-gradient(135deg, ${config.branding.surface}, #000)` }} />
        <div className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(circle at 30% 40%, ${config.branding.accent}55 0%, transparent 70%)` }} />

        {/* Desktop icons */}
        <div className="absolute inset-0 z-10 p-4 flex flex-col flex-wrap gap-2 content-start">
          {DESKTOP_ICONS.map((app) => (
            <button key={app.id}
              onClick={() => { playClick(); setOpenApp(app.id as OpenApp); }}
              className="flex flex-col items-center gap-1.5 rounded-xl p-3 w-20 text-center hover:bg-white/10 backdrop-blur-sm transition-all group">
              <div className="text-3xl group-hover:scale-110 transition-transform">{app.icon}</div>
              <div className="text-[11px] text-white/90 drop-shadow-lg font-medium">{app.label}</div>
            </button>
          ))}
          {/* Install icon - prominent and separate */}
          <button
            onClick={() => { playClick(); onInstallClick(); }}
            className="flex flex-col items-center gap-1.5 rounded-xl p-3 w-20 text-center hover:bg-white/15 backdrop-blur-sm transition-all group mt-4"
            style={{ boxShadow: `0 0 20px ${config.branding.accent}30` }}>
            <div className="text-3xl group-hover:scale-110 transition-transform" style={{ filter: `drop-shadow(0 0 4px ${config.branding.accent})` }}>💿</div>
            <div className="text-[11px] font-bold drop-shadow-lg"
              style={{ color: config.branding.accent }}>Install {config.branding.shortName}</div>
          </button>
        </div>

        {/* App windows */}
        <AnimatePresence>
          {openApp === "terminal" && (
            <motion.div key="terminal" initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="absolute left-1/2 top-1/2 z-20 flex h-[350px] sm:h-[450px] lg:h-[520px] w-[calc(100%-2rem)] sm:w-[600px] lg:w-[720px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl shadow-2xl border border-white/15"
              style={{ background: "#1a1a2e" }}>
              <div className="flex items-center gap-2 bg-[#2a2a3e] px-3 py-2 shrink-0">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e] border border-[#d9a01e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840] border border-[#1aab29]" />
                </div>
                <div className="mx-auto text-xs text-white/50 font-medium">Terminal — {osName}</div>
                <button onClick={() => setOpenApp(null)}
                  className="text-white/40 hover:text-white text-lg min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">×</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 font-mono text-xs" style={{ color: "#22c55e" }}>
                {entries.map((e, i) => (
                  <div key={i} className="mb-2">
                    {e.cmd && (
                      <div>
                        <span style={{ color: config.branding.accent }}>user@{osName.toLowerCase().replace(/\s/g, "-")}</span>
                        <span className="text-white/40">:</span>
                        <span className="text-blue-400">~</span>
                        <span className="text-white/40">$ </span>
                        <span className="text-white/80">{e.cmd}</span>
                      </div>
                    )}
                    <pre className="whitespace-pre-wrap text-white/60">{e.output}</pre>
                  </div>
                ))}
                <div ref={termEndRef} />
              </div>
              <form onSubmit={handleSubmit} className="flex border-t border-white/10 px-3 py-2 font-mono text-xs bg-[#1a1a2e] shrink-0">
                <span style={{ color: config.branding.accent }}>user@{osName.toLowerCase().replace(/\s/g, "-")}</span>
                <span className="text-white/40">:</span>
                <span className="text-blue-400">~</span>
                <span className="text-white/40">$ </span>
                <input value={input} onChange={e => setInput(e.target.value)}
                  className="flex-1 bg-transparent text-white/80 outline-none" autoFocus />
              </form>
            </motion.div>
          )}

          {openApp === "files" && (
            <motion.div key="files" initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[520px] rounded-xl shadow-2xl border border-white/15 overflow-hidden"
              style={{ background: "#1a1a2e" }}>
              <div className="flex items-center gap-2 bg-[#2a2a3e] px-3 py-2">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="mx-auto text-xs text-white/50 font-medium">Files — Home</div>
                <button onClick={() => setOpenApp(null)}
                  className="text-white/40 hover:text-white text-lg min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">×</button>
              </div>
              <div className="grid grid-cols-3 gap-3 p-5">
                {["Documents", "Downloads", "Music", "Pictures", "Videos", "Desktop"].map((f) => (
                  <div key={f} className="flex flex-col items-center gap-1.5 rounded-xl p-4 hover:bg-white/10 cursor-pointer transition-all">
                    <span className="text-3xl">📁</span>
                    <span className="text-[11px] text-white/60 font-medium">{f}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 px-4 py-2.5 text-[10px] text-white/30 flex items-center justify-between">
                <span>6 folders</span>
                <span>Free space: 28.1 GB</span>
              </div>
            </motion.div>
          )}

          {openApp === "browser" && (
            <motion.div key="browser" initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[560px] rounded-xl shadow-2xl border border-white/15 overflow-hidden"
              style={{ background: "#1a1a2e" }}>
              <div className="flex items-center gap-2 bg-[#2a2a3e] px-3 py-2">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="mx-auto text-xs text-white/50 font-medium">Firefox — {osName}</div>
                <button onClick={() => setOpenApp(null)}
                  className="text-white/40 hover:text-white text-lg min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">×</button>
              </div>
              {/* Browser toolbar */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/20">
                <div className="flex gap-1">
                  <span className="text-white/30 text-xs">←</span>
                  <span className="text-white/30 text-xs">→</span>
                  <span className="text-white/30 text-xs">↻</span>
                </div>
                <div className="flex-1 rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-white/40 font-mono">about:welcome</div>
              </div>
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">🦊</div>
                <div className="text-sm text-white/60 mb-5">Firefox is running in the live session</div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-5 max-w-sm mx-auto">
                  <div className="text-xs text-white/40 mb-2">You're browsing from a live USB. No changes will be saved.</div>
                  <div className="text-xs text-white/30 font-mono">Network: Live USB (Connected)</div>
                </div>
              </div>
            </motion.div>
          )}

          {openApp === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[440px] rounded-xl shadow-2xl border border-white/15 overflow-hidden"
              style={{ background: "#1a1a2e" }}>
              <div className="flex items-center gap-2 bg-[#2a2a3e] px-3 py-2">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="mx-auto text-xs text-white/50 font-medium">Settings</div>
                <button onClick={() => setOpenApp(null)}
                  className="text-white/40 hover:text-white text-lg min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">×</button>
              </div>
              <div className="p-3">
                {[
                  { icon: "📶", label: "Wi-Fi", detail: "Connected — Live Network" },
                  { icon: "🖥️", label: "Display", detail: "1920×1080 — Built-in" },
                  { icon: "🔊", label: "Sound", detail: "Built-in Audio — 100%" },
                  { icon: "🔋", label: "Power", detail: "AC Adapter — Balanced" },
                  { icon: "🔒", label: "Privacy", detail: "Location: Off" },
                  { icon: "ℹ️", label: "About", detail: `${osName} Linux 6.8.0 — Live Session` },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 cursor-pointer transition-all">
                    <span className="text-xl">{s.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs text-white/70 font-medium">{s.label}</div>
                      <div className="text-[10px] text-white/30">{s.detail}</div>
                    </div>
                    <span className="text-white/20 text-xs">›</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Taskbar */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex h-11 items-center gap-3 border-t border-white/10 px-4 backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
            <OsIcon osId={config.id} accent={config.branding.accent} size={18} />
            <span className="hidden sm:inline">{osName}</span>
          </div>
          {/* App indicators */}
          <div className="flex items-center gap-1">
            {DESKTOP_ICONS.map((app) => (
              <button key={app.id} onClick={() => { playClick(); setOpenApp(openApp === app.id ? null : app.id as OpenApp); }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                  openApp === app.id ? "bg-white/20" : "hover:bg-white/10"
                }`}>
                {app.icon}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-xs">
            <span className="text-white/50 hidden sm:block">Live Session</span>
            <span className="text-white/70 font-medium">
              {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
