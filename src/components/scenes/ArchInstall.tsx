import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type Phase = "boot" | "shell" | "tui" | "installing" | "done";

const BOOT_LINES: { text: string; color?: string; delay: number }[] = [
  { text: "Booting Arch Linux 6.8.9-arch1-1...", color: "#888", delay: 200 },
  { text: "[    0.000000] Linux version 6.8.9-arch1-1 (root@archiso) (gcc 13.2.1) #1 SMP PREEMPT_DYNAMIC Tue Jun 30 2026", delay: 150 },
  { text: "[    0.010000] Command line: BOOT_IMAGE=/boot/vmlinuz-linux root=UUID=archiso", delay: 100 },
  { text: "[    0.020000] x86/fpu: Supporting XSAVE feature set", delay: 80 },
  { text: "[    0.150000] CPU: AMD Ryzen 7 5700X 8-Core Processor (16 SMT)", delay: 100 },
  { text: "[    0.300000] Memory: 8192MB available (6144MB physical)", delay: 80 },
  { text: "[    1.100000] systemd[1]: Starting systemd 255.2-1 running in system mode...", delay: 120 },
  { text: "", delay: 50 },
  { text: "[  OK  ] Started udev Kernel Device Manager.", color: "#4ade80", delay: 100 },
  { text: "[  OK  ] Started Journal Service.", color: "#4ade80", delay: 80 },
  { text: "[  OK  ] Reached target Local File Systems.", color: "#4ade80", delay: 60 },
  { text: "[  OK  ] Started Network Manager.", color: "#4ade80", delay: 100 },
  { text: "[  OK  ] Reached target Basic System.", color: "#4ade80", delay: 50 },
  { text: "[  OK  ] Started archiso (Live Environment).", color: "#4ade80", delay: 150 },
  { text: "", delay: 100 },
  { text: "Arch Linux 6.8.9-arch1-1 (tty1)", color: "#60a5fa", delay: 200 },
  { text: "", delay: 50 },
  { text: "archiso login: root (automatic)", delay: 250 },
  { text: "Password: (automatic)", delay: 200 },
  { text: "", delay: 100 },
  { text: "Last login: Sat Jul 18 12:00:00 2026 on tty1", color: "#888", delay: 150 },
];

type SubItem = { label: string; desc: string };
type TuiConfig = {
  id: string; label: string; summary: string;
  kind: "menu" | "text" | "toggle";
  items?: SubItem[]; selectedIdx?: number; textValue: string;
};

function freshOptions(): TuiConfig[] {
  return [
    { id: "locales", label: "Locales", summary: "Keyboard: us, Locale: en_US.UTF-8", kind: "menu",
      items: [
        { label: "us", desc: "English (US) — default" },
        { label: "uk", desc: "English (UK)" },
        { label: "de", desc: "German" },
        { label: "fr", desc: "French" },
        { label: "it", desc: "Italian" },
        { label: "es", desc: "Spanish" },
        { label: "jp", desc: "Japanese" },
        { label: "br", desc: "Portuguese (Brazil)" },
      ], selectedIdx: 0, textValue: "" },
    { id: "mirrors", label: "Mirror selection", summary: "Region: Worldwide", kind: "menu",
      items: [
        { label: "Worldwide", desc: "Auto-select fastest mirror" },
        { label: "United States", desc: "US-based mirrors" },
        { label: "Europe", desc: "EU-based mirrors" },
        { label: "Asia", desc: "Asia-based mirrors" },
        { label: "India", desc: "India-based mirrors" },
      ], selectedIdx: 0, textValue: "" },
    { id: "disk", label: "Disk configuration", summary: "Best effort: ext4 + swap", kind: "menu",
      items: [
        { label: "Best-effort", desc: "Automatically partition (default)" },
        { label: "Manual", desc: "Manually configure disk layout" },
        { label: "Wipe", desc: "Wipe entire disk and install" },
      ], selectedIdx: 0, textValue: "" },
    { id: "bootloader", label: "Bootloader", summary: "GRUB (dual-boot)", kind: "menu",
      items: [
        { label: "GRUB", desc: "GRUB — detects Windows for dual-boot" },
        { label: "systemd-boot", desc: "systemd-boot — simple UEFI only" },
        { label: "efistub", desc: "EFISTUB — direct UEFI boot entry" },
      ], selectedIdx: 0, textValue: "" },
    { id: "hostname", label: "Hostname", summary: "archlinux", kind: "text", textValue: "archlinux" },
    { id: "users", label: "Users", summary: "user (sudo)", kind: "text", textValue: "user" },
    { id: "profile", label: "Profile", summary: "KDE Plasma", kind: "menu",
      items: [
        { label: "KDE Plasma", desc: "Full-featured KDE desktop" },
        { label: "GNOME", desc: "Modern GNOME desktop" },
        { label: "XFCE", desc: "Lightweight XFCE desktop" },
        { label: "i3", desc: "Tiling window manager i3" },
        { label: "Sway", desc: "Wayland tiling compositor" },
        { label: "None", desc: "No desktop (minimal)" },
      ], selectedIdx: 0, textValue: "" },
    { id: "graphics", label: "Graphics driver", summary: "All open-source", kind: "menu",
      items: [
        { label: "All open-source", desc: "AMD / Intel / NVIDIA (open)" },
        { label: "AMD", desc: "AMD only" },
        { label: "Intel", desc: "Intel only" },
        { label: "NVIDIA", desc: "Proprietary NVIDIA driver" },
        { label: "NVIDIA Optimus", desc: "Hybrid Intel + NVIDIA" },
      ], selectedIdx: 0, textValue: "" },
    { id: "network", label: "Network", summary: "NetworkManager", kind: "menu",
      items: [
        { label: "NetworkManager", desc: "Full network manager (default)" },
        { label: "systemd-networkd", desc: "Minimal systemd networking" },
        { label: "iwd", desc: "Standalone WiFi daemon" },
        { label: "None", desc: "No network config" },
      ], selectedIdx: 0, textValue: "" },
    { id: "timezone", label: "Timezone", summary: "UTC", kind: "text", textValue: "UTC" },
    { id: "audio", label: "Audio", summary: "PipeWire", kind: "menu",
      items: [
        { label: "PipeWire", desc: "Modern audio server (recommended)" },
        { label: "PulseAudio", desc: "Traditional audio server" },
        { label: "None", desc: "No audio setup" },
      ], selectedIdx: 0, textValue: "" },
  ];
}

function processCommand(input: string, setWifi: (v: boolean) => void): string[] {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case "help":
      return [
        "── Arch Linux Installation Commands ─────────────────",
        "  archinstall   Launch guided installer (TUI menu)",
        "  ping         Test internet (check WiFi first!)",
        "  iwctl        Connect to WiFi",
        "  timedatectl  Check/sync system clock",
        "  fdisk -l     List disks and partitions",
        "  ls, cat, uname, ip, free, df, neofetch, clear",
        "",
        "  ── Internet is REQUIRED before archinstall ──",
        "  Step 1: iwctl → connect to WiFi",
        "  Step 2: ping archlinux.org (verify)",
        "  Step 3: archinstall",
      ];
    case "archinstall":
      return [];
    case "iwctl":
      return [
        "iwctl v2.11  (iNet Wireless Daemon)", "",
        "  Station: wlan0    Status: disconnected", "",
        "  Available networks:",
        "    HomeWiFi    ████ 54%  WPA2",
        "    Neighbor    ██  28%  WPA3", "",
        "  Connect: station wlan0 connect <SSID>",
        "  After connecting, type: ping archlinux.org",
      ];
    case "station": {
      if (args.includes("wlan0") && args.includes("connect")) {
        setWifi(true);
        return ["Connecting...", "  ✓ Authentication completed", "  ✓ DHCP lease obtained", "  ✓ Connected to " + args.slice(2).join(" "), "", "  Internet ready! Type 'archinstall' to begin."];
      }
      return ["Usage: station wlan0 connect <SSID>"];
    }
    case "ping": {
      const host = args.find(a => !a.startsWith("-")) || "archlinux.org";
      return [
        `PING ${host} (95.217.163.246) 56(84) bytes of data.`,
        "64 bytes from 95.217.163.246: icmp_seq=1 ttl=52 time=12.3 ms",
        "  ✓ Internet connected",
      ];
    }
    case "timedatectl":
      return ["               Local time: Sat 2026-07-18 12:00:00 UTC", "     NTP enabled: yes", "NTP synchronized: yes"];
    case "fdisk":
      if (args.includes("-l")) return [
        "Disk /dev/nvme0n1: 512.11 GiB",
        "Device                Size  Type",
        "/dev/nvme0n1p1       500M  EFI System",
        "/dev/nvme0n1p2       444G  Windows 11",
        "/dev/nvme0n1p3      26.2G  Arch root (/)",
        "/dev/nvme0n1p4       6.2G  Linux swap",
      ];
      return ["Usage: fdisk -l"];
    case "ls": {
      const dir = args[0] || "";
      if (dir === "/") return ["bin   boot   dev   etc   home   lib   mnt   opt   proc   root   run   sbin   sys   tmp   usr   var"];
      return ["Desktop   Documents   Downloads   Music   Pictures   Public   Templates   Videos"];
    }
    case "pwd": return ["/root"];
    case "cd": return [];
    case "cat": {
      const file = args.join(" ");
      if (/hostname/.test(file)) return ["archiso"];
      if (/resolv/.test(file)) return ["nameserver 8.8.8.8", "nameserver 1.1.1.1"];
      return [`cat: ${file}: No such file or directory`];
    }
    case "uname": return ["Linux archiso 6.8.9-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"];
    case "ip":
      return ["1: lo: <LOOPBACK,UP,LOWER_UP> inet 127.0.0.1/8", "2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> inet 192.168.1.100/24"];
    case "free": return ["Mem: 7.7Gi total, 1.2Gi used, 4.1Gi free", "Swap: 2.0Gi total, 0 used"];
    case "df": return ["/dev/nvme0n1p3   26G  9.5G   16G  38% /"];
    case "neofetch":
      return ["            .-/+oossssoo+/-.               root@archiso", "        :+oosssoooooooooosso+:.            -----------------", "      -+osssooooo       oooosso+-          OS: Arch Linux x86_64", "    :+ssooooooo/         :+oooooss+:       Kernel: 6.8.9-arch1-1", "   +ssoooooo:              /ooooosso+      Uptime: 5 mins", "  +ssoooooo.  .oosso+:    `ooooosso+      Shell: bash 5.2", " :sssooooo+  :oooooooo+   +oooooooss:     Resolution: 1920x1080", " /sssooooo/  :ooooooooo. /ooooooooss/     DE: TTY (none)", " osssooooo+   -+oooo+:-  +ooooooossso     Terminal: linux console", " osssoooooo`              /ooooooosss+    CPU: AMD Ryzen 7 (2) @ 3.40GHz", " /sssooooo/              :ooooooooss/     Memory: 1220MiB / 7680MiB", "  +ssoooooo.            :ooooooooss+", "   +ssooooo/           /ooooooooss+", "    :+ssooo+:        :+oooooooss+:",
        "      -++ssoo++:.:++ooooooss++-",
        "        .:+oossooooooooossso+:.", "            .-:/+++oss+/:-."];
    case "echo": return [args.join(" ") || ""];
    case "clear": return [];
    default: return [`bash: ${cmd}: command not found`];
  }
}

export default function ArchInstall({ config, speed, onComplete }: {
  config: OSConfig; speed: "normal" | "fast"; onComplete: () => void;
}) {
  const { branding } = config;
  const accent = branding.accent;
  const osName = branding.name;
  const { register: registerAdvance } = useSceneAdvance();

  const [phase, setPhase] = useState<Phase>("boot");
  const [bootIdx, setBootIdx] = useState(0);
  const [terminal, setTerminal] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [wifiConnected, setWifiConnected] = useState(false);

  const [tuiOptions, setTuiOptions] = useState<TuiConfig[]>([]);
  const [tuiSelected, setTuiSelected] = useState(0);
  const [tuiConfiguring, setTuiConfiguring] = useState(false);
  const [tuiSubIdx, setTuiSubIdx] = useState(0);
  const [tuiMsg, setTuiMsg] = useState("");

  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const setWifi = useCallback((v: boolean) => setWifiConnected(v), []);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [terminal, bootIdx]);

  useEffect(() => {
    if (phase !== "boot") return;
    if (bootIdx < BOOT_LINES.length) {
      const t = setTimeout(() => setBootIdx(p => p + 1), speed === "fast"
        ? BOOT_LINES[bootIdx].delay * 0.25 : BOOT_LINES[bootIdx].delay);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setPhase("shell");
        setTerminal(["Connect to WiFi first: iwctl → station wlan0 connect <SSID>", "Then: ping archlinux.org → archinstall"]);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [phase, bootIdx, speed]);

  useEffect(() => {
    if (phase === "installing") { const t = setTimeout(() => setPhase("done"), speed === "fast" ? 1500 : 3000); return () => clearTimeout(t); }
  }, [phase, speed]);
  useEffect(() => {
    if (phase === "done") { const t = setTimeout(() => onComplete(), speed === "fast" ? 800 : 2000); return () => clearTimeout(t); }
  }, [phase, onComplete, speed]);
  useEffect(() => {
    if (phase === "shell" || phase === "tui") registerAdvance(() => onComplete());
  }, [phase, registerAdvance, onComplete]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (phase === "shell" && inputRef.current && document.activeElement !== inputRef.current) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { inputRef.current.focus(); setInput(e.key); }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

  function addTerminal(lines: string[]) { setTerminal(prev => [...prev, ...lines]); }

  function handleShellSubmit() {
    const raw = input.trim();
    if (!raw) return;
    playKeyClick();
    setHistory(prev => [...prev, raw]);
    setHistIdx(-1);

    if (raw.toLowerCase() === "archinstall") {
      if (!wifiConnected) {
        addTerminal([`[root@archiso ~]# ${raw}`, "  ✗ No internet connection. Connect to WiFi first:", "    iwctl → station wlan0 connect <SSID>", "    ping archlinux.org"]);
        setInput("");
        return;
      }
      playClick();
      setInput("");
      setTuiOptions(freshOptions());
      setTuiSelected(0);
      setTuiConfiguring(false);
      setTuiSubIdx(0);
      setTuiMsg("");
      setPhase("tui");
      return;
    }

    const output = processCommand(raw, setWifi);
    addTerminal([`[root@archiso ~]# ${raw}`, ...output]);
    setInput("");
  }

  function handleHistory(dir: "up" | "down") {
    if (dir === "up" && history.length > 0) {
      const next = Math.max(-1, histIdx - 1);
      setHistIdx(next); setInput(next === -1 ? "" : history[history.length - 1 - next]);
    } else if (dir === "down" && histIdx >= 0) {
      const next = histIdx + 1; setHistIdx(next);
      setInput(next >= history.length ? "" : history[history.length - 1 - next]);
    }
  }

  // ─── TUI keyboard handling ───
  function handleTuiKey(e: React.KeyboardEvent) {
    if (tuiConfiguring) {
      const opt = tuiOptions[tuiSelected];
      if (!opt) return;
      if (opt.kind === "menu" && opt.items) {
        if (e.key === "ArrowUp") { e.preventDefault(); setTuiSubIdx(p => Math.max(0, p - 1)); playClick(); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); setTuiSubIdx(p => Math.min(opt.items!.length - 1, p + 1)); playClick(); return; }
        if (e.key === "Enter") {
          e.preventDefault(); playClick();
          const val = opt.items[tuiSubIdx].label;
          setTuiOptions(prev => prev.map((o, i) => i === tuiSelected ? { ...o, summary: val, selectedIdx: tuiSubIdx } : o));
          setTuiConfiguring(false);
          setTuiMsg(`  ✓ ${opt.label}: ${val}`);
          return;
        }
        if (e.key === "Escape" || e.key === "Backspace") {
          e.preventDefault(); playClick(); setTuiConfiguring(false); setTuiMsg(""); return;
        }
      }
      if (opt.kind === "text") {
        if (e.key === "Enter") {
          e.preventDefault(); playClick();
          const val = (e.target as HTMLInputElement).value.trim() || opt.textValue;
          setTuiOptions(prev => prev.map((o, i) => i === tuiSelected ? { ...o, textValue: val, summary: val } : o));
          setTuiConfiguring(false);
          setTuiMsg(`  ✓ ${opt.label}: ${val}`);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault(); playClick(); setTuiConfiguring(false); setTuiMsg(""); return;
        }
        playKeyClick();
        return;
      }
    }

    // Main menu navigation
    if (e.key === "ArrowUp") { e.preventDefault(); setTuiSelected(p => Math.max(0, p - 1)); playClick(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setTuiSelected(p => Math.min(tuiOptions.length - 1, p + 1)); playClick(); return; }
    if (e.key === "Enter") {
      e.preventDefault(); playClick();
      const opt = tuiOptions[tuiSelected];
      if (!opt) return;
      if (opt.kind === "menu") { setTuiSubIdx(opt.selectedIdx || 0); setTuiConfiguring(true); setTuiMsg(""); return; }
      if (opt.kind === "text") { setTuiConfiguring(true); setTuiMsg(""); return; }
    }
    if (e.key === "i" || e.key === "I") {
      // Type 'i' or 'I' to install
      const allDone = tuiOptions.every(o => o.summary !== "");
      if (!allDone) { setTuiMsg("  ✗ Configure all options first"); return; }
      playClick(); setPhase("installing");
    }
  }

  // ─── Boot ───
  if (phase === "boot") {
    return (
      <div className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}
        onClick={() => setBootIdx(BOOT_LINES.length)}>
        <div className="h-full rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
          <div className="h-full overflow-y-auto p-4 font-mono text-xs leading-relaxed" ref={termRef}>
            {BOOT_LINES.slice(0, bootIdx).map((line, i) => (
              <div key={i} style={{ color: line.color || "#c0c0c0" }} className="whitespace-pre-wrap">
                {line.text || "\u00A0"}
              </div>
            ))}
            {bootIdx < BOOT_LINES.length && <span className="inline-block w-2 h-4 bg-white/70 animate-pulse" />}
          </div>
        </div>
      </div>
    );
  }

  // ─── Shell ───
  if (phase === "shell") {
    return (
      <div className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}>
        <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col"
          onClick={() => inputRef.current?.focus()}>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed" ref={termRef}>
            <div className="text-[#60a5fa] font-bold mb-1">Arch Linux 6.8.9-arch1-1 (tty1)</div>
            <div className="text-[#4ade80] mb-1">archiso login: root (automatic)</div>
            <div className="text-[#888] mb-2">Connection: {wifiConnected ? "✓ Connected" : "✗ No internet — connect WiFi first"}</div>
            {terminal.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap"
                style={{ color: line.startsWith("[root@") ? "#00e676" : line.startsWith("  ✗") ? "#f87171" : line.startsWith("──") ? "#888" : "#c0c0c0" }}>{line}</div>
            ))}
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[#00e676] shrink-0">[root@archiso ~]#</span>
              <input ref={inputRef} type="text" value={input} autoFocus autoComplete="off" spellCheck={false}
                onChange={(e) => { setInput(e.target.value); playKeyClick(); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleShellSubmit(); }
                  if (e.key === "ArrowUp") { e.preventDefault(); handleHistory("up"); }
                  if (e.key === "ArrowDown") { e.preventDefault(); handleHistory("down"); }
                }}
                className="flex-1 bg-transparent text-white/90 outline-none font-mono text-xs caret-white/70" />
            </div>
          </div>
          <div className="border-t border-white/5 bg-[#0a0a0a] px-4 py-1.5 text-[9px] text-white/20 font-mono flex justify-between">
            <span>{wifiConnected ? "✓ WiFi • type 'archinstall'" : "✗ Connect WiFi: iwctl → station wlan0 connect <SSID>"}</span>
            <span className="text-[#00e676]/30">tty1</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── TUI ───
  if (phase === "tui") {
    const configuring = tuiOptions[tuiSelected];
    const allDone = tuiOptions.every(o => o.summary !== "");

    return (
      <div className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}
        onKeyDown={handleTuiKey} tabIndex={0}>
        <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col">
          <div className="flex-1 p-3 sm:p-5 font-mono text-xs flex items-center justify-center">
            <div className="w-full max-w-lg border border-white/20 rounded-lg bg-[#0a0a0a] shadow-2xl overflow-hidden">
              {/* Title bar */}
              <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-white/30 text-[9px] uppercase tracking-widest flex-1 text-center">archinstall — Guided Installer</span>
              </div>

              {/* Body */}
              <div className="p-3 sm:p-4 min-h-[280px]">
                {tuiConfiguring && configuring ? (
                  /* ── Configuring pane ── */
                  <div>
                    <div className="text-[#60a5fa] font-bold mb-3 text-xs uppercase tracking-wider border-b border-white/10 pb-1">
                      {configuring.label}
                    </div>
                    {configuring.kind === "menu" && configuring.items ? (
                      <div className="space-y-0.5 mb-2">
                        {configuring.items.map((item, i) => (
                          <div key={item.label}
                            className={`flex items-center justify-between px-3 py-1.5 rounded text-[11px] cursor-pointer transition-colors ${
                              i === tuiSubIdx ? "bg-[#60a5fa]/20 text-white border border-[#60a5fa]/30" : "text-white/60 hover:bg-white/5"
                            }`}
                            onClick={() => { setTuiSubIdx(i); }}>
                            <div>
                              <span className={i === tuiSubIdx ? "text-white font-bold" : ""}>{item.label}</span>
                              <span className="text-white/30 ml-2">— {item.desc}</span>
                            </div>
                            {i === tuiSubIdx && <span className="text-[#60a5fa] text-[10px]">◀</span>}
                          </div>
                        ))}
                        <div className="text-[9px] text-white/20 mt-3 pt-2 border-t border-white/5">
                          ↑↓ navigate • Enter select • Esc back
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2">
                        <div className="text-white/40 text-[10px] mb-2">Enter value for {configuring.label}:</div>
                        <input type="text" defaultValue={configuring.textValue} autoFocus
                          onKeyDown={handleTuiKey}
                          onChange={() => playKeyClick()}
                          className="w-full bg-[#1a1a2e] border border-white/10 rounded px-3 py-2 text-xs text-white/90 outline-none font-mono"
                          placeholder={`Enter ${configuring.label.toLowerCase()}`} />
                        <div className="text-[9px] text-white/20 mt-2">Enter to confirm • Esc to cancel</div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── Main menu ── */
                  <div>
                    <div className="text-white/50 font-bold text-[11px] text-center mb-2 uppercase tracking-wider">Arch Linux Guided Installer</div>
                    <div className="border-t border-white/10 mb-1" />
                    {tuiOptions.map((opt, i) => (
                      <div key={opt.id}
                        className={`flex justify-between items-center px-3 py-1.5 rounded cursor-pointer transition-all ${
                          i === tuiSelected
                            ? "bg-[#60a5fa]/15 text-white border border-[#60a5fa]/20"
                            : "text-white/60 hover:bg-white/[0.03]"
                        }`}
                        onClick={() => setTuiSelected(i)}>
                        <div className="flex items-center gap-2">
                          {i === tuiSelected && <span className="text-[#60a5fa] text-[10px]">▶</span>}
                          <span className={i === tuiSelected ? "font-bold" : ""}>{opt.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={i === tuiSelected ? "text-white/60 text-[10px]" : "text-white/30 text-[10px]"}>
                            {opt.summary}
                          </span>
                          {i === tuiSelected && <span className="text-[#4ade80] text-[10px]">←</span>}
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-white/10 mt-2 pt-2" />
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/20">
                        ↑↓ navigate • Enter configure • <span className={allDone ? "text-[#4ade80]" : "text-white/20"}>I</span> install
                      </span>
                      <span className={allDone ? "text-[#4ade80]" : "text-white/20"}>
                        {tuiOptions.filter(o => o.summary !== "").length}/{tuiOptions.length}
                      </span>
                    </div>
                  </div>
                )}

                {tuiMsg && (
                  <div className="mt-2 text-[10px] font-mono" style={{ color: tuiMsg.includes("✗") ? "#f87171" : "#4ade80" }}>{tuiMsg}</div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom status bar */}
          <div className="border-t border-white/10 bg-[#0a0a0a] px-4 py-1.5 text-[9px] text-white/20 font-mono flex justify-between">
            <span>{tuiConfiguring ? "Esc to go back" : (allDone ? "Press I to install" : "Configure all options then press I")}</span>
            <span>{tuiConfiguring ? `Configuring: ${configuring.label}` : `WiFi: ${wifiConnected ? "Connected" : "No internet"}`}</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Installing ───
  if (phase === "installing") {
    return (
      <div className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}>
        <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden p-4 font-mono text-xs leading-relaxed">
          <div className="text-[#4ade80] mb-2">:: Synchronizing package databases...</div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="text-[#4ade80]"> core is up to date</div>
            <div className="text-[#4ade80]"> extra is up to date</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="text-[#888] mt-2">:: Starting full system installation...</div>
          </motion.div>
          {[
            "Installing base system (linux, base, base-devel)...",
            "Installing linux-firmware (510 packages)...",
            "Installing GRUB bootloader...",
            "Installing NetworkManager...",
            "Installing KDE Plasma desktop...",
            "Generating initramfs...",
            "Installing GRUB to EFI partition...",
            "Detecting Windows Boot Manager... ✓",
          ].map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * (speed === "fast" ? 0.06 : 0.18) }}
              className="text-[#c0c0c0]">  ({i + 1}) {line}</motion.div>
          ))}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.2 : 2.8 }}
            className="mt-3 text-[#4ade80] font-bold">✓ Installation complete!</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.4 : 3.0 }}
            className="mt-2 text-xs text-white/30">Dual-boot: Arch Linux + Windows 11</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.6 : 3.2 }}
            className="mt-2 h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: accent }}
              initial={{ width: "0%" }} animate={{ width: "100%" }}
              transition={{ duration: speed === "fast" ? 0.4 : 1.0, ease: "easeInOut" }} />
          </motion.div>
        </div>
      </div>
    );
  }

  // ─── Done ───
  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}>
        <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden p-6 font-mono text-xs leading-relaxed flex items-center justify-center">
          <div className="text-center space-y-4 bg-black/40 rounded-xl p-8" style={{ borderColor: `${accent}33`, borderWidth: 1 }}>
            <SparkleBurst trigger={true} />
            <div className="text-3xl">🏹</div>
            <h2 className="text-lg font-bold" style={{ color: accent }}>{osName} + Windows 11</h2>
            <div className="text-[#4ade80]">✓ Arch Linux installed</div>
            <div className="text-[#4ade80]">✓ GRUB configured (detects Windows)</div>
            <div className="text-xs text-white/50 max-w-xs mx-auto mt-2">Reboot to enter GRUB and choose between Arch and Windows.</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
