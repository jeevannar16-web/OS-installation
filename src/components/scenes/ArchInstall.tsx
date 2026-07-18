import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type Phase = "boot" | "shell" | "tui" | "installing" | "done";

type PreviewSlide = { title: string; description: string; image: string };

const PREVIEW_SLIDES: PreviewSlide[] = [
  { title: "Locales", description: "Keyboard layout (us) and locale language (en_US.UTF-8).", image: "/images/arch/03-wizard.png" },
  { title: "Mirror Selection", description: "Choose a close mirror region for fast downloads.", image: "/images/arch/04-mirror-region.png" },
  { title: "Disk Configuration", description: "Partition drive with ext4 and swap.", image: "/images/arch/06-best-effort.png" },
  { title: "Filesystem", description: "ext4 (most common) or btrfs with swap.", image: "/images/arch/07-filesystem.png" },
  { title: "Bootloader", description: "GRUB installed to disk. Detects Windows for dual-boot.", image: "/images/arch/10-select-kernels.png" },
  { title: "Hostname & Users", description: "Machine name, root password, and a user with sudo.", image: "/images/arch/12-user-accounts.png" },
  { title: "Desktop Profile", description: "KDE Plasma, GNOME, or XFCE with SDDM/GDM.", image: "/images/arch/12-desktop-profile.png" },
  { title: "Graphics & Audio", description: "Open-source drivers + PipeWire.", image: "/images/arch/05-optional-repos.png" },
  { title: "Network & Timezone", description: "NetworkManager + NTP sync.", image: "/images/arch/13-network-config.png" },
  { title: "Review & Install", description: "Confirm all options and begin.", image: "/images/arch/14-confirm-install.png" },
];

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

type TuiOption = {
  id: string;
  label: string;
  configured: boolean;
  value: string;
  configPrompt: string;
  values: string[];
};

const DEFAULT_TUI_OPTIONS: TuiOption[] = [
  { id: "locales", label: "Locales", configured: false, value: "Keyboard: us | Lang: en_US.UTF-8", configPrompt: "Keyboard layout [us]:", values: ["us"] },
  { id: "mirrors", label: "Mirror selection", configured: false, value: "Region: Worldwide", configPrompt: "Mirror region [Worldwide]:", values: ["Worldwide"] },
  { id: "disk", label: "Disk configuration", configured: false, value: "Best effort ext4 + swap", configPrompt: "Disk config method [best-effort]:", values: ["best-effort"] },
  { id: "bootloader", label: "Bootloader", configured: false, value: "GRUB (dual-boot detection)", configPrompt: "Bootloader [grub]:", values: ["grub"] },
  { id: "hostname", label: "Hostname", configured: false, value: "archlinux", configPrompt: "Hostname [archlinux]:", values: ["archlinux"] },
  { id: "users", label: "Users", configured: false, value: "user (sudo)", configPrompt: "Username [user]:", values: ["user"] },
  { id: "profile", label: "Profile", configured: false, value: "KDE Plasma", configPrompt: "Desktop environment [kde]:", values: ["kde"] },
  { id: "graphics", label: "Graphics driver", configured: false, value: "All open-source", configPrompt: "Graphics drivers [all-open-source]:", values: ["all-open-source"] },
  { id: "network", label: "Network", configured: false, value: "NetworkManager", configPrompt: "Network config [networkmanager]:", values: ["networkmanager"] },
  { id: "timezone", label: "Timezone", configured: false, value: "UTC", configPrompt: "Timezone [UTC]:", values: ["UTC"] },
  { id: "audio", label: "Audio", configured: false, value: "PipeWire", configPrompt: "Audio server [pipewire]:", values: ["pipewire"] },
];


function processCommand(input: string): string[] {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case "help":
      return [
        "── Arch Linux Installation Commands ──────────────────────",
        "  archinstall      Launch guided installer (TUI menu)",
        "  preview          See what archinstall will configure",
        "  ping <host>     Test internet connection",
        "  iwctl           Connect to WiFi",
        "  timedatectl     Check/sync system clock",
        "  fdisk -l        List disks and partitions",
        "  ls, cat, uname, ip, free, df, neofetch, clear",
      ];
    case "preview":
      return [];
    case "archinstall":
      return [];
    case "ls": {
      const dir = args[0] || "";
      if (dir === "/") return ["bin   boot   dev   etc   home   lib   mnt   opt   proc   root   run   sbin   sys   tmp   usr   var"];
      if (dir.includes("home") || !dir) return ["Desktop   Documents   Downloads   Music   Pictures   Public   Templates   Videos"];
      if (dir === "/etc") return ["hostname   resolv.conf   fstab   pacman.conf   NetworkManager"];
      return [`ls: cannot access '${dir}': No such file or directory`];
    }
    case "pwd":
      return ["/root"];
    case "cd":
      return [];
    case "cat": {
      const file = args.join(" ");
      if (/hostname/.test(file)) return ["archiso"];
      if (/resolv/.test(file)) return ["nameserver 8.8.8.8", "nameserver 1.1.1.1"];
      if (/os-release/.test(file)) return ["NAME=\"Arch Linux\"", "ID=arch", "PRETTY_NAME=\"Arch Linux\""];
      return [`cat: ${file}: No such file or directory`];
    }
    case "uname": {
      if (args.includes("-a")) return ["Linux archiso 6.8.9-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"];
      return ["Linux"];
    }
    case "ip": {
      if (args.includes("a") || args.includes("addr")) return [
        "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536    inet 127.0.0.1/8",
        "2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500",
        "    inet 192.168.1.100/24 brd 192.168.1.255 scope global enp0s3",
      ];
      return ["Usage: ip a"];
    }
    case "ping": {
      const host = args.find(a => !a.startsWith("-")) || "archlinux.org";
      return [
        `PING ${host} (95.217.163.246) 56(84) bytes of data.`,
        "64 bytes from 95.217.163.246: icmp_seq=1 ttl=52 time=12.3 ms",
        "64 bytes from 95.217.163.246: icmp_seq=2 ttl=52 time=11.8 ms",
        "64 bytes from 95.217.163.246: icmp_seq=3 ttl=52 time=13.1 ms",
        "", "--- ping statistics ---",
        "3 packets transmitted, 3 received, 0% packet loss",
      ];
    }
    case "iwctl":
      return ["iwctl v2.11", "", "  Station: wlan0    Status: disconnected", "",
        "  Available networks: HomeWiFi (54%), Neighbor (28%)", "",
        "  Commands: station wlan0 connect <SSID>"];
    case "station": {
      if (args.includes("wlan0") && args.includes("connect")) {
        return ["Connecting...", "  ✓ Authentication completed", "  ✓ DHCP lease obtained", `  ✓ Connected`];
      }
      return [`Unknown command: station ${args.join(" ")}`];
    }
    case "timedatectl":
      return ["               Local time: Sat 2026-07-18 12:00:00 UTC", "     NTP enabled: yes", "NTP synchronized: yes"];
    case "fdisk":
      if (args.includes("-l")) return [
        "Disk /dev/nvme0n1: 512.11 GiB",
        "Device                Start       End   Sectors  Size  Type",
        "/dev/nvme0n1p1         2048   1026047   1024000  500M  EFI System",
        "/dev/nvme0n1p2      1026048 932069375 931043328  444G  Microsoft basic  (Windows 11)",
        "/dev/nvme0n1p3    932069376 987004927  54935552 26.2G  Linux filesystem  (Arch /)",
        "/dev/nvme0n1p4    987004928 999999999  12995072  6.2G  Linux swap",
      ];
      return ["Usage: fdisk -l"];
    case "free":
      return ["               total        used        free      shared  buff/cache   available", "Mem:           7.7Gi       1.2Gi       4.1Gi       89Mi       2.4Gi       6.0Gi", "Swap:          2.0Gi          0B       2.0Gi"];
    case "df":
      return ["Filesystem      Size  Used Avail Use% Mounted on", "dev             3.9G     0  3.9G   0% /dev", "run             3.9G  1.6M  3.9G   1% /run", "/dev/nvme0n1p3   26G  9.5G   16G  38% /"];
    case "neofetch":
      return [
        "            .-/+oossssoo+/-.               root@archiso",
        "        :+oosssoooooooooosso+:.            -----------------",
        "      -+osssooooo       oooosso+-          OS: Arch Linux x86_64",
        "    :+ssooooooo/         :+oooooss+:       Kernel: 6.8.9-arch1-1",
        "   +ssoooooo:              /ooooosso+      Uptime: 5 mins",
        "  +ssoooooo.  .oosso+:    `ooooosso+      Shell: bash 5.2",
        " :sssooooo+  :oooooooo+   +oooooooss:     Resolution: 1920x1080",
        " /sssooooo/  :ooooooooo. /ooooooooss/     DE: TTY (none)",
        " osssooooo+   -+oooo+:-  +ooooooossso     Terminal: linux console",
        " osssoooooo`              /ooooooosss+    CPU: AMD Ryzen 7 (2) @ 3.40GHz",
        " /sssooooo/              :ooooooooss/     Memory: 1220MiB / 7680MiB",
        "  +ssoooooo.            :ooooooooss+",
        "   +ssooooo/           /ooooooooss+",
        "    :+ssooo+:        :+oooooooss+:",
        "      -++ssoo++:.:++ooooooss++-",
        "        .:+oossooooooooossso+:.", "            .-:/+++oss+/:-.",
      ];
    case "echo":
      return [args.join(" ") || ""];
    case "clear":
      return [];
    default:
      return [`bash: ${cmd}: command not found`];
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
  const [showPreview, setShowPreview] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [tuiOptions, setTuiOptions] = useState(() => DEFAULT_TUI_OPTIONS.map(o => ({ ...o })));
  const [tuiConfiguring, setTuiConfiguring] = useState<string | null>(null);
  const [tuiMsg, setTuiMsg] = useState("");
  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tuiInputRef = useRef<HTMLInputElement>(null);
  const [tuiInput, setTuiInput] = useState("");

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
        setTerminal(["Type 'help' for commands, 'archinstall' to launch the guided installer TUI"]);
      }, speed === "fast" ? 200 : 500);
      return () => clearTimeout(t);
    }
  }, [phase, bootIdx, speed]);

  useEffect(() => {
    if (phase === "installing") {
      const t = setTimeout(() => setPhase("done"), speed === "fast" ? 1500 : 3000);
      return () => clearTimeout(t);
    }
  }, [phase, speed]);

  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(() => onComplete(), speed === "fast" ? 800 : 2000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete, speed]);

  useEffect(() => {
    if (phase === "shell" || phase === "tui") registerAdvance(() => onComplete());
  }, [phase, registerAdvance, onComplete]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (phase === "shell" && inputRef.current && document.activeElement !== inputRef.current) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          inputRef.current.focus(); setInput(e.key);
        }
      }
      if (phase === "tui" && tuiInputRef.current && document.activeElement !== tuiInputRef.current) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          tuiInputRef.current.focus(); setTuiInput(e.key);
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

  function addTerminal(lines: string[]) { setTerminal(prev => [...prev, ...lines]); }

  function handleShellSubmit() {
    const cmd = input.trim();
    if (!cmd) return;
    playKeyClick();
    setHistory(prev => [...prev, cmd]);
    setHistIdx(-1);
    if (cmd.toLowerCase() === "archinstall") {
      playClick(); setInput(""); setTuiInput("");
      setTuiOptions(DEFAULT_TUI_OPTIONS.map(o => ({ ...o })));
      setTuiConfiguring(null); setTuiMsg("");
      setPhase("tui"); return;
    }
    if (cmd.toLowerCase() === "preview") {
      playClick(); setInput(""); setPreviewIdx(0); setShowPreview(true); return;
    }
    const output = processCommand(cmd);
    addTerminal([`[root@archiso ~]# ${cmd}`, ...output]); setInput("");
  }

  function handleHistory(dir: "up" | "down") {
    if (dir === "up" && history.length > 0) {
      const next = Math.max(-1, histIdx - 1);
      setHistIdx(next);
      setInput(next === -1 ? "" : history[history.length - 1 - next]);
    } else if (dir === "down" && histIdx >= 0) {
      const next = histIdx + 1;
      setHistIdx(next);
      setInput(next >= history.length ? "" : history[history.length - 1 - next]);
    }
  }

  function handleTuiSubmit() {
    const raw = tuiInput.trim();
    if (!raw) return;
    const cmd = raw.toLowerCase();
    playKeyClick();
    setTuiInput("");

    if (tuiConfiguring) {
      if (cmd === "back" || cmd === "menu") {
        setTuiConfiguring(null); setTuiMsg(""); return;
      }
      if (cmd === "done") {
        setTuiOptions(prev => prev.map(o => o.id === tuiConfiguring ? { ...o, configured: true } : o));
        setTuiConfiguring(null);
        setTuiMsg(`  ✓ ${tuiOptions.find(o => o.id === tuiConfiguring)?.label} configured`);
        return;
      }
      setTuiOptions(prev => prev.map(o => {
        if (o.id !== tuiConfiguring) return o;
        return { ...o, value: raw, values: [raw] };
      }));
      return;
    }

    const configuredCount = tuiOptions.filter(o => o.configured).length;
    const total = tuiOptions.length;

    if (cmd === "install") {
      if (configuredCount < total) {
        setTuiMsg("  ✗ Not all options configured yet. Configure each option first.");
        return;
      }
      playClick();
      setPhase("installing");
      return;
    }

    if (cmd === "exit" || cmd === "quit") {
      playClick();
      setTuiInput("");
      setPhase("shell");
      addTerminal(["Exiting archinstall...", "[root@archiso ~]#"]);
      return;
    }

    const opt = tuiOptions.find(o => o.id === cmd || o.label.toLowerCase() === cmd);
    if (opt) {
      setTuiConfiguring(cmd);
      setTuiMsg(`Configuring: ${opt.label} — type a value or 'done' to keep defaults`);
      return;
    }

    setTuiMsg(`  Option '${raw}' not found. Type an option name, 'install', or 'exit'.`);
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
            <div className="text-[#888] mb-2">Last login: Sat Jul 18 12:00:00 2026 on tty1</div>
            {terminal.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap"
                style={{ color: line.startsWith("[root@") ? "#00e676" : line.startsWith("──") ? "#888" : "#c0c0c0" }}>{line}</div>
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
            <span>help • ping • iwctl • fdisk • preview • archinstall</span>
            <span className="text-[#00e676]/30">tty1</span>
          </div>
        </div>

        <AnimatePresence>
          {showPreview && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setShowPreview(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl rounded-xl border border-white/10 bg-[#12121a] overflow-hidden shadow-2xl">
                <div className="relative h-64 sm:h-80 bg-black">
                  <img src={PREVIEW_SLIDES[previewIdx].image} alt={PREVIEW_SLIDES[previewIdx].title}
                    className="absolute inset-0 w-full h-full object-contain" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{ color: accent, background: `${accent}1a`, border: `1px solid ${accent}33` }}>
                      {previewIdx + 1}/{PREVIEW_SLIDES.length}
                    </span>
                    <span className="text-sm font-bold text-white/90">{PREVIEW_SLIDES[previewIdx].title}</span>
                  </div>
                  <p className="text-xs text-white/50 mb-3">{PREVIEW_SLIDES[previewIdx].description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {PREVIEW_SLIDES.map((_, i) => (
                        <div key={i} className="h-1.5 w-1.5 rounded-full transition-colors"
                          style={{ background: i === previewIdx ? accent : "rgba(255,255,255,0.15)" }} />
                      ))}
                    </div>
                    <button onClick={() => {
                      playClick();
                      if (previewIdx < PREVIEW_SLIDES.length - 1) setPreviewIdx(p => p + 1);
                      else setShowPreview(false);
                    }} className="rounded-lg px-4 py-1.5 text-xs font-bold text-white transition-all hover:scale-[1.02]"
                      style={{ background: accent }}>
                      {previewIdx < PREVIEW_SLIDES.length - 1 ? "Next →" : "Done"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── archinstall TUI ───
  if (phase === "tui") {
    const allConfigured = tuiOptions.every(o => o.configured);
    const isConfiguring = tuiConfiguring !== null;
    const currentOpt = tuiOptions.find(o => o.id === tuiConfiguring);

    return (
      <div className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}
        onClick={() => tuiInputRef.current?.focus()}>
        <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col">
          {/* TUI Window */}
          <div className="flex-1 p-3 sm:p-5 font-mono text-xs flex items-center justify-center">
            <div className="w-full max-w-lg border border-white/20 rounded-lg bg-[#0a0a0a] shadow-2xl overflow-hidden">
              {/* Title bar */}
              <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] px-4 py-2 border-b border-white/10 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                  <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                  <span className="h-2 w-2 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-white/40 text-[9px] uppercase tracking-wider">archinstall v2.8.1 — Guided Installer</span>
              </div>

              {/* Body */}
              <div className="p-3 sm:p-4">
                {isConfiguring && currentOpt ? (
                  /* ── Configuring an option ── */
                  <div>
                    <div className="text-[#60a5fa] font-bold mb-2 text-xs uppercase tracking-wider">{currentOpt.label}</div>
                    <div className="text-white/50 text-[10px] mb-3 leading-relaxed">
                      Current: {currentOpt.value}
                    </div>
                    <div className="bg-[#1a1a2e] border border-white/10 rounded px-3 py-2 mb-2">
                      <span className="text-[#00e676]">{currentOpt.configPrompt}</span>
                    </div>
                    <div className="text-[9px] text-white/30 mb-3">Type a value and press Enter, or type 'done' to keep defaults, 'back' to return</div>
                  </div>
                ) : (
                  /* ── Main menu ── */
                  <div>
                    <div className="text-white/70 font-bold mb-2 text-xs text-center">Arch Linux Guided Installer</div>
                    <div className="border-t border-white/10 mb-2" />
                    {tuiOptions.map((opt, i) => (
                      <div key={opt.id} className={`flex justify-between items-center py-1 px-2 rounded ${
                        i % 2 === 0 ? "bg-white/[0.02]" : ""
                      }`}>
                        <span className="text-white/80">{opt.label}</span>
                        <span className={opt.configured ? "text-[#4ade80] text-[10px]" : "text-white/25 text-[10px]"}>
                          {opt.configured ? "✓ configured" : "—"}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-white/10 mt-2 mb-1" />
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/30">Type option name to configure • <span className="text-[#4ade80]">install</span> to start</span>
                      <span className={allConfigured ? "text-[#4ade80]" : "text-white/30"}>{tuiOptions.filter(o => o.configured).length}/{tuiOptions.length}</span>
                    </div>
                  </div>
                )}

                {/* Error/info message */}
                {tuiMsg && (
                  <div className="mt-2 text-[10px] font-mono"
                    style={{ color: tuiMsg.includes("✗") ? "#f87171" : "#4ade80" }}>{tuiMsg}</div>
                )}
              </div>
            </div>
          </div>

          {/* TUI Input bar */}
          <div className="border-t border-white/10 bg-[#0a0a0a] px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[#00e676] font-mono text-xs shrink-0">{isConfiguring ? ">" : "$"}</span>
              <input ref={tuiInputRef} type="text" value={tuiInput} autoFocus autoComplete="off" spellCheck={false}
                onChange={(e) => { setTuiInput(e.target.value); playKeyClick(); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleTuiSubmit(); } }}
                placeholder={isConfiguring ? "type value or 'done'" : "option name, 'install', or 'exit'"}
                className="flex-1 bg-transparent text-white/90 outline-none font-mono text-xs placeholder:text-white/20" />
              <button onClick={handleTuiSubmit}
                className="rounded px-2 py-1 text-[11px] font-bold text-white shrink-0"
                style={{ background: accent }}>↵</button>
            </div>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <div className="text-[#888] mt-2">:: Starting full system installation...</div>
          </motion.div>
          {[
            "Installing base system (linux, base, base-devel)...",
            "Installing linux-firmware (510 packages)...",
            "Installing grub (bootloader)...",
            "Installing NetworkManager...",
            "Installing KDE Plasma desktop...",
            "Generating initramfs...",
            "Installing GRUB to EFI partition...",
            "Detecting Windows Boot Manager... ✓",
          ].map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * (speed === "fast" ? 0.06 : 0.18) }}
              className="text-[#c0c0c0]">  ({i + 1}) {line}</motion.div>
          ))}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.4 : 3.0 }}
            className="mt-3 text-[#4ade80] font-bold">✓ Installation complete!</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.6 : 3.2 }}
            className="mt-2 text-xs text-white/30">Dual-boot: Arch Linux + Windows 11</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.8 : 3.5 }}
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
            <div className="text-[#4ade80]">✓ GRUB configured (dual-boot)</div>
            <div className="text-[#4ade80]">✓ Windows 11 detected</div>
            <p className="text-xs text-white/50 max-w-xs mx-auto mt-2">Reboot to enter GRUB and choose between Arch and Windows.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
