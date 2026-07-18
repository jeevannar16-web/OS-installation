import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type Phase = "boot" | "shell" | "tui" | "installing" | "postinstall" | "done";

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
  id: string; label: string; summary: string; desc?: string;
  kind: "menu" | "text" | "action";
  items?: SubItem[]; selectedIdx?: number; textValue: string;
  subItems?: TuiConfig[];
  required?: boolean;
};

function freshOptions(): TuiConfig[] {
  const diskSub: TuiConfig[] = [
    { id: "disk_partitioning", label: "Partitioning", summary: "Best-effort", kind: "menu",
      items: [
        { label: "Best-effort", desc: "Auto partition (default)" },
        { label: "Manual", desc: "Manual partitioning" },
        { label: "Wipe", desc: "Wipe entire disk" },
      ], selectedIdx: 0, textValue: "" },
    { id: "disk_filesystem", label: "Filesystem", summary: "ext4", kind: "menu",
      items: [
        { label: "ext4", desc: "Standard Linux filesystem (default)" },
        { label: "btrfs", desc: "CoW with snapshots" },
        { label: "xfs", desc: "High-performance 64-bit" },
        { label: "f2fs", desc: "Flash-friendly" },
      ], selectedIdx: 0, textValue: "" },
    { id: "disk_encryption", label: "Encryption", summary: "None", kind: "menu",
      items: [
        { label: "None", desc: "No encryption" },
        { label: "LUKS2", desc: "Full disk encryption" },
      ], selectedIdx: 0, textValue: "" },
  ];
  const authSub: TuiConfig[] = [
    { id: "auth_root_pass", label: "Root password", summary: "********", kind: "text", textValue: "********" },
    { id: "auth_user", label: "Create superuser", summary: "Yes", kind: "menu",
      items: [
        { label: "Yes", desc: "Create user with sudo privileges" },
        { label: "No", desc: "No user account" },
      ], selectedIdx: 0, textValue: "" },
    { id: "auth_username", label: "Username", summary: "user", kind: "text", textValue: "user" },
    { id: "auth_user_pass", label: "User password", summary: "********", kind: "text", textValue: "********" },
  ];
  const appSub: TuiConfig[] = [
    { id: "app_audio", label: "Audio", summary: "PipeWire", kind: "menu",
      items: [
        { label: "PipeWire", desc: "Modern audio server (recommended)" },
        { label: "PulseAudio", desc: "Traditional audio server" },
        { label: "None", desc: "No audio setup" },
      ], selectedIdx: 0, textValue: "" },
    { id: "app_bluetooth", label: "Bluetooth", summary: "Yes", kind: "menu",
      items: [
        { label: "Yes", desc: "Install BlueZ bluetooth stack" },
        { label: "No", desc: "Skip bluetooth" },
      ], selectedIdx: 0, textValue: "" },
    { id: "app_printing", label: "Printing", summary: "Yes", kind: "menu",
      items: [
        { label: "Yes", desc: "Install CUPS printing system" },
        { label: "No", desc: "Skip printing" },
      ], selectedIdx: 0, textValue: "" },
  ];
  return [
    { id: "language", label: "Archinstall language", desc: "Choose the language displayed in the installer and your system", summary: "English", kind: "menu",
      items: [
        { label: "English", desc: "English (default)" },
        { label: "Deutsch", desc: "German" },
        { label: "Français", desc: "French" },
        { label: "Español", desc: "Spanish" },
      ], selectedIdx: 0, textValue: "" },
    { id: "locales", label: "Locales", desc: "Set your keyboard layout and locale for the system", summary: "us / en_US.UTF-8", kind: "menu", required: true,
      items: [
        { label: "us", desc: "English (US)" },
        { label: "uk", desc: "English (UK)" },
        { label: "de", desc: "German" },
        { label: "fr", desc: "French" },
        { label: "es", desc: "Spanish" },
        { label: "jp", desc: "Japanese" },
        { label: "br", desc: "Portuguese (Brazil)" },
      ], selectedIdx: 0, textValue: "" },
    { id: "mirrors", label: "Mirrors and repositories", desc: "Select which mirror region to download packages from", summary: "Worldwide", kind: "menu",
      items: [
        { label: "Worldwide", desc: "Auto-select fastest mirror" },
        { label: "United States", desc: "US-based mirrors" },
        { label: "Europe", desc: "EU-based mirrors" },
        { label: "Asia", desc: "Asia-based mirrors" },
      ], selectedIdx: 0, textValue: "" },
    { id: "disk", label: "Disk configuration", desc: "Set up partitions, filesystem type, and encryption for your installation", summary: "Best-effort, ext4", kind: "menu",
      selectedIdx: 0, textValue: "", subItems: diskSub, required: true },
    // Disk starts with a default but user must at least open & confirm it
    { id: "swap", label: "Swap", desc: "Configure swap space — used when RAM is full", summary: "2 GB", kind: "menu",
      items: [
        { label: "None", desc: "No swap" },
        { label: "512 MB", desc: "512 MB swap" },
        { label: "1 GB", desc: "1 GB swap" },
        { label: "2 GB", desc: "2 GB swap (recommended)" },
        { label: "4 GB", desc: "4 GB swap" },
        { label: "Zram", desc: "Compressed RAM swap" },
      ], selectedIdx: 3, textValue: "" },
    { id: "bootloader", label: "Bootloader", desc: "Choose how your system boots — GRUB detects Windows for dual-boot", summary: "GRUB (dual-boot)", kind: "menu", required: true,
      items: [
        { label: "GRUB", desc: "GRUB — detects Windows for dual-boot" },
        { label: "systemd-boot", desc: "Simple UEFI boot" },
        { label: "efistub", desc: "Direct UEFI boot entry" },
      ], selectedIdx: 0, textValue: "" },
    { id: "kernels", label: "Kernels", desc: "Select which Linux kernel to install", summary: "linux", kind: "menu",
      items: [
        { label: "linux", desc: "Stable kernel (default)" },
        { label: "linux-lts", desc: "Long-term support kernel" },
        { label: "linux-hardened", desc: "Security-hardened kernel" },
        { label: "linux-zen", desc: "Performance-tuned kernel" },
      ], selectedIdx: 0, textValue: "" },
    { id: "hostname", label: "Hostname", desc: "Set your computer's network name", summary: "", kind: "text", textValue: "archlinux", required: true },
    { id: "authentication", label: "Authentication", desc: "Set the root password and create a user account with sudo", summary: "root + user", kind: "menu",
      selectedIdx: 0, textValue: "", subItems: authSub, required: true },
    { id: "profile", label: "Profile", desc: "Choose your desktop environment — the look and feel of your system", summary: "KDE Plasma", kind: "menu", required: true,
      items: [
        { label: "KDE Plasma", desc: "Full-featured KDE desktop" },
        { label: "GNOME", desc: "Modern GNOME desktop" },
        { label: "XFCE", desc: "Lightweight XFCE desktop" },
        { label: "i3", desc: "Tiling window manager" },
        { label: "Sway", desc: "Wayland tiling compositor" },
        { label: "Hyprland", desc: "Dynamic Wayland compositor" },
        { label: "None", desc: "No desktop (minimal)" },
      ], selectedIdx: 0, textValue: "" },
    { id: "applications", label: "Applications", desc: "Choose which extra software to install (audio, Bluetooth, printing)", summary: "Audio, BT, Print", kind: "menu",
      selectedIdx: 0, textValue: "", subItems: appSub },
    { id: "network", label: "Network configuration", desc: "Choose how your system connects to networks", summary: "NetworkManager", kind: "menu",
      items: [
        { label: "NetworkManager", desc: "Full network manager (default)" },
        { label: "systemd-networkd", desc: "Minimal systemd networking" },
        { label: "iwd", desc: "Standalone WiFi daemon" },
        { label: "None", desc: "No network config" },
      ], selectedIdx: 0, textValue: "" },
    { id: "additional_packages", label: "Additional packages", desc: "Install extra packages (space-separated, e.g. vim firefox)", summary: "(none)", kind: "text", textValue: "" },
    { id: "timezone", label: "Timezone", desc: "Set your timezone (e.g. America/New_York, Europe/Berlin, Asia/Kolkata)", summary: "", kind: "text", textValue: "UTC", required: true },
    { id: "ntp", label: "Automatic time sync (NTP)", desc: "Keep your system clock accurate automatically", summary: "Yes", kind: "menu",
      items: [
        { label: "Yes", desc: "Enable NTP time sync" },
        { label: "No", desc: "Disable NTP" },
      ], selectedIdx: 0, textValue: "" },
    { id: "save_config", label: "Save configuration", desc: "Save your settings to a file for later use", summary: "", kind: "action", textValue: "" },
    { id: "install", label: "Install", desc: "Begin the installation with your current settings", summary: "", kind: "action", textValue: "" },
    { id: "abort", label: "Abort", desc: "Cancel installation and return to the shell", summary: "", kind: "action", textValue: "" },
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
        "  nmtui        Network Manager text UI (WiFi setup)",
        "  nmcli        Network Manager command line",
        "  ping         Test internet (check WiFi first!)",
        "  iwctl        iNet Wireless Daemon (interactive)",
        "  timedatectl  Check/sync system clock",
        "  fdisk        Partition tool: fdisk -l or fdisk /dev/sdX",
        "  cfdisk       TUI partition manager",
        "  lsblk        List block devices",
        "  ls, cat, uname, ip, free, df, neofetch, clear",
        "",
        "  ── Internet is REQUIRED before archinstall ──",
        "  Step 1: nmtui     → Connect to WiFi",
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
    case "nmtui":
      return [
        "nmtui 1.48  (NetworkManager TUI)", "",
        "  A visual network manager will open.",
        "  Use the WiFi tab above to connect.",
        "  Or run: nmcli device wifi connect <SSID> password <pass>",
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
    case "lsblk":
      return [
        "NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS",
        "nvme0n1     259:0    0 512.1G  0 disk",
        "├─nvme0n1p1 259:1    0   500M  0 part /boot",
        "├─nvme0n1p2 259:2    0   444G  0 part",
        "├─nvme0n1p3 259:3    0  26.2G  0 part /",
        "└─nvme0n1p4 259:4    0   6.2G  0 part [SWAP]",
      ];
    case "cfdisk":
      return [
        "┌─────────────────────────────────────────────────────┐",
        "│                cfdisk (partition manager)           │",
        "├──────────┬──────────┬──────┬──────────┬────────────┤",
        "│ Device   │   Size   │ Type │ Mount    │ Filesystem │",
        "├──────────┼──────────┼──────┼──────────┼────────────┤",
        "│ nvme0n1p1│   500M   │ EFI  │ /boot    │ vfat       │",
        "│ nvme0n1p2│   444G   │ Win  │ —        │ ntfs       │",
        "│ nvme0n1p3│  26.2G   │ Linux│ /        │ ext4       │",
        "│ nvme0n1p4│   6.2G   │ Swap │ [SWAP]   │ swap       │",
        "├──────────┴──────────┴──────┴──────────┴────────────┤",
        "│ [Write] [Quit]  ↑↓ navigate, Enter to select       │",
        "└─────────────────────────────────────────────────────┘",
      ];
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
  type SubShell = "bash" | "nmtui" | "fdisk";
  const [subshell, setSubshell] = useState<SubShell>("bash");
  const [fdiskDisk, setFdiskDisk] = useState("");

  const [tuiOptions, setTuiOptions] = useState<TuiConfig[]>([]);
  const [tuiSelected, setTuiSelected] = useState(0);
  const [tuiConfiguring, setTuiConfiguring] = useState(false);
  const [tuiSubIdx, setTuiSubIdx] = useState(0);
  const [tuiSubMenu, setTuiSubMenu] = useState<TuiConfig[] | null>(null);
  const [tuiSubSel, setTuiSubSel] = useState(0);
  const [tuiSubCfg, setTuiSubCfg] = useState(false);
  const [tuiSubCfgIdx, setTuiSubCfgIdx] = useState(0);
  const [tuiMsg, setTuiMsg] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [shellStep, setShellStep] = useState(1);
  const [postStep, setPostStep] = useState(0);
  const [completionIdx, setCompletionIdx] = useState(-1);
  const COMMANDS = [
    { cmd: "archinstall", desc: "Launch guided installer (TUI)" },
    { cmd: "nmtui", desc: "Network Manager text UI (WiFi config)" },
    { cmd: "iwctl", desc: "iNet Wireless Daemon (advanced)" },
    { cmd: "ping", desc: "Test internet connectivity" },
    { cmd: "fdisk", desc: "Partition manager (use fdisk -l, fdisk /dev/sdX)" },
    { cmd: "lsblk", desc: "List block devices" },
    { cmd: "cfdisk", desc: "ASCII partition table viewer" },
    { cmd: "timedatectl", desc: "Check system clock" },
    { cmd: "ls", desc: "List directory contents" },
    { cmd: "cat", desc: "Show file contents" },
    { cmd: "uname", desc: "Print system info" },
    { cmd: "ip", desc: "Show network addresses" },
    { cmd: "free", desc: "Show memory usage" },
    { cmd: "df", desc: "Show disk usage" },
    { cmd: "neofetch", desc: "System info with logo" },
    { cmd: "echo", desc: "Print text" },
    { cmd: "clear", desc: "Clear terminal" },
    { cmd: "help", desc: "Show all commands" },
    { cmd: "pwd", desc: "Print working directory" },
    { cmd: "cd", desc: "Change directory" },
    { cmd: "exit", desc: "Exit current shell" },
  ];
  const ALL_COMMANDS = COMMANDS.map(c => c.cmd);

  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tuiRef = useRef<HTMLDivElement>(null);

  const setWifi = useCallback((v: boolean) => setWifiConnected(v), []);

  useEffect(() => {
    if (termRef.current) requestAnimationFrame(() => { termRef.current!.scrollTop = termRef.current!.scrollHeight; });
  }, [terminal, bootIdx, phase]);

  useEffect(() => {
    if (phase !== "boot") return;
    if (bootIdx < BOOT_LINES.length) {
      const t = setTimeout(() => setBootIdx(p => p + 1), speed === "fast"
        ? BOOT_LINES[bootIdx].delay * 0.25 : BOOT_LINES[bootIdx].delay);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setPhase("shell");
        setShellStep(1);
        setTerminal(["── Arch Linux Dual-Boot Installation ──────────────", "  Internet is required. Follow the 3 steps below:", "", "  ❶ nmtui     → Connect to WiFi", "  ❷ ping      → Verify internet", "  ❸ archinstall → Start guided installer", "────────────────────────────────────────────────────"]);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [phase, bootIdx, speed]);

  useEffect(() => {
    if (phase === "installing") { const t = setTimeout(() => setPhase("postinstall"), speed === "fast" ? 1500 : 3000); return () => clearTimeout(t); }
  }, [phase, speed]);
  useEffect(() => {
    if (phase === "postinstall") { const t = setTimeout(() => setPhase("done"), speed === "fast" ? 4000 : 10000); return () => clearTimeout(t); }
  }, [phase, speed]);

  // Auto-advance postinstall sub-steps
  useEffect(() => {
    if (phase !== "postinstall") return;
    const delays = speed === "fast" ? [400, 900, 1400, 2000] : [800, 2500, 4500, 7000];
    if (postStep < 4) {
      const t = setTimeout(() => setPostStep(p => p + 1), delays[postStep] || 800);
      return () => clearTimeout(t);
    }
  }, [phase, postStep, speed]);
  useEffect(() => {
    if (phase === "done") { const t = setTimeout(() => onComplete(), speed === "fast" ? 800 : 2000); return () => clearTimeout(t); }
  }, [phase, onComplete, speed]);
  useEffect(() => {
    if (phase === "shell") registerAdvance(() => onComplete());
  }, [phase, registerAdvance, onComplete]);

  useEffect(() => {
    if (phase === "tui") tuiRef.current?.focus();
  }, [phase]);

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

  function getMissingRequired(opts: TuiConfig[]): string[] {
    const missing: string[] = [];
    for (const o of opts) {
      if (o.kind === "action") continue;
      if (o.required && !o.summary) missing.push(o.label);
      if (o.subItems) {
        for (const sub of o.subItems) {
          if (sub.required && !sub.summary) missing.push(`  ${sub.label}`);
        }
      }
    }
    return missing;
  }

  function handleFdiskSubmit(raw: string) {
    const cmd = raw.trim().toLowerCase();
    if (cmd === "q" || cmd === "quit") {
      playClick();
      setSubshell("bash");
      addTerminal([`Command (m for help): ${cmd}`, "  Back to shell"]);
      setInput("");
      return;
    }
    if (cmd === "w" || cmd === "write") {
      addTerminal([`Command (m for help): ${cmd}`, "  The partition table has been altered.", "  Calling ioctl() to re-read partition table.", "  Syncing disks."]);
      setInput("");
      return;
    }
    if (cmd === "p" || cmd === "print") {
      addTerminal([`Command (m for help): ${cmd}`,
        "Disk /dev/" + fdiskDisk + ": 512.11 GiB",
        "Device                Size  Type",
        "/dev/" + fdiskDisk + "p1       500M  EFI System",
        "/dev/" + fdiskDisk + "p2       444G  Windows 11",
        "/dev/" + fdiskDisk + "p3      26.2G  Linux root",
        "/dev/" + fdiskDisk + "p4       6.2G  Linux swap",
      ]);
    } else if (cmd === "m" || cmd === "help") {
      addTerminal([`Command (m for help): ${cmd}`,
        "  p   print partition table",
        "  n   new partition",
        "  d   delete partition",
        "  w   write to disk",
        "  q   quit",
      ]);
    } else if (cmd === "n" || cmd === "new") {
      addTerminal([`Command (m for help): ${cmd}`,
        "Partition type",
        "  p   primary (4 max)",
        "  e   extended",
        "Select (default p): p",
        "Partition number (1-4, default 4): ",
        "  (pressed Enter - using default)",
        "First sector (2048-1073741823, default 2048): ",
        "  (pressed Enter - using default)",
        "Last sector: +10G",
        "  Created new partition 4 of type 'Linux filesystem'",
      ]);
    } else if (cmd === "d" || cmd === "delete") {
      addTerminal([`Command (m for help): ${cmd}`,
        "Partition number (1-4): 4",
        "  Partition 4 has been deleted.",
      ]);
    } else {
      addTerminal([`Command (m for help): ${cmd}`, `  Unknown command. Type 'm' for help.`]);
    }
    setInput("");
  }

  function handleShellSubmit(cmd?: string) {
    const raw = (cmd ?? input).trim();
    if (!raw) return;
    if (!cmd) playKeyClick();
    setHistory(prev => [...prev, raw]);
    setHistIdx(-1);

    if (subshell === "nmtui") {
      const c = raw.toLowerCase();
      if (c === "exit" || c === "quit" || c === "back") {
        setSubshell("bash"); addTerminal(["  Back to shell"]); setInput("");
        return;
      }
      addTerminal([`  Unknown command in nmtui. Type 'exit' to return.`]);
      setInput("");
      return;
    }
    if (subshell === "fdisk") { handleFdiskSubmit(raw); return; }

    const lower = raw.toLowerCase();

    if (lower === "archinstall") {
      if (!wifiConnected) {
        addTerminal([`[root@archiso ~]# ${raw}`, "  ✗ No internet. Connect to WiFi first:", "    nmtui → connect to a network", "    exit → ping archlinux.org"]);
        setInput("");
        return;
      }
      playClick();
      setInput("");
      setTuiOptions(freshOptions());
      setTuiSelected(0);
      setTuiConfiguring(false);
      setTuiSubIdx(0);
      setTuiSubMenu(null);
      setTuiSubSel(0);
      setTuiSubCfg(false);
      setTuiSubCfgIdx(0);
      setTuiMsg("");
      setPhase("tui");
      return;
    }

    if (lower === "iwctl") {
      addTerminal(["[root@archiso ~]# iwctl",
        "iwctl v2.11  (iNet Wireless Daemon)",
        "  Tip: Use 'nmtui' for a simpler WiFi setup.",
      ]);
      setInput("");
      return;
    }

    if (lower === "nmtui") {
      playClick();
      setInput("");
      setSubshell("nmtui");
      addTerminal(["[root@archiso ~]# nmtui",
        "  ✓ NetworkManager TUI opened. Select a network below.",
      ]);
      return;
    }

    if (lower.startsWith("fdisk")) {
      const parts = raw.trim().split(/\s+/);
      if (parts.length >= 2 && parts[1] !== "-l") {
        const dev = parts[1].replace("/dev/", "");
        playClick();
        setInput("");
        setFdiskDisk(dev);
        setSubshell("fdisk");
        addTerminal([`[root@archiso ~]# fdisk /dev/${dev}`,
          `Welcome to fdisk (util-linux 2.39.3).`,
          `Changes will remain in memory only until you write them.`,
          `Be careful before using the write command.`,
          ``,
          `Command (m for help): `,
        ]);
        return;
      }
    }

    const output = processCommand(raw, setWifi);
    addTerminal([`[root@archiso ~]# ${raw}`, ...output]);
    if (lower === "ping" || lower.startsWith("ping ")) {
      if (wifiConnected) setShellStep(3);
    }
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
    e.stopPropagation();
    // Level 3: configuring a sub-menu item's value
    if (tuiSubCfg && tuiSubMenu) {
      const subOpt = tuiSubMenu[tuiSubSel];
      if (!subOpt) return;
      if (subOpt.kind === "menu" && subOpt.items) {
        if (e.key === "ArrowUp") { e.preventDefault(); setTuiSubCfgIdx(p => Math.max(0, p - 1)); playClick(); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); setTuiSubCfgIdx(p => Math.min(subOpt.items!.length - 1, p + 1)); playClick(); return; }
        if (e.key === "Enter") {
          e.preventDefault(); playClick();
          const val = subOpt.items![tuiSubCfgIdx].label;
          setTuiSubMenu(prev => prev!.map((o, i) => i === tuiSubSel ? { ...o, summary: val, selectedIdx: tuiSubCfgIdx } : o));
          setTuiSubCfg(false);
          setTuiMsg(`  ✓ ${subOpt.label}: ${val}`);
          return;
        }
        if (e.key === "Escape" || e.key === "Backspace") {
          e.preventDefault(); playClick(); setTuiSubCfg(false); return;
        }
      }
      if (subOpt.kind === "text") {
        if (e.key === "Enter") {
          e.preventDefault(); playClick();
          const val = (e.target as HTMLInputElement).value.trim() || subOpt.textValue;
          setTuiSubMenu(prev => prev!.map((o, i) => i === tuiSubSel ? { ...o, textValue: val, summary: val } : o));
          setTuiSubCfg(false);
          setTuiMsg(`  ✓ ${subOpt.label}: ${val}`);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault(); playClick(); setTuiSubCfg(false); return;
        }
        playKeyClick();
        return;
      }
    }

    // Level 2: in a sub-menu (e.g., Disk config, Authentication, Applications)
    if (tuiSubMenu) {
      if (e.key === "ArrowUp") { e.preventDefault(); setTuiSubSel(p => Math.max(0, p - 1)); playClick(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setTuiSubSel(p => Math.min(tuiSubMenu.length - 1, p + 1)); playClick(); return; }
      if (e.key === "Enter") {
        e.preventDefault(); playClick();
        const opt = tuiSubMenu[tuiSubSel];
        if (!opt) return;
        if (opt.kind === "menu") { setTuiSubCfgIdx(opt.selectedIdx || 0); setTuiSubCfg(true); setTuiMsg(""); return; }
        if (opt.kind === "text") { setTuiSubCfg(true); setTuiMsg(""); return; }
      }
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault(); playClick(); setTuiSubMenu(null); setTuiSubCfg(false); setTuiMsg(""); return;
      }
      return;
    }

    // Level 1b: configuring a main menu item's value (e.g., Language, Hostname)
    const cfgItem = tuiOptions[tuiSelected];
    if (tuiConfiguring && cfgItem) {
      if (cfgItem.kind === "menu" && cfgItem.items) {
        if (e.key === "ArrowUp") { e.preventDefault(); setTuiSubIdx(p => Math.max(0, p - 1)); playClick(); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); setTuiSubIdx(p => Math.min(cfgItem.items!.length - 1, p + 1)); playClick(); return; }
        if (e.key === "Enter") {
          e.preventDefault(); playClick();
          const val = cfgItem.items[tuiSubIdx].label;
          setTuiOptions(prev => prev.map((o, i) => i === tuiSelected ? { ...o, summary: val, selectedIdx: tuiSubIdx } : o));
          setTuiConfiguring(false);
          setTuiMsg(`  ✓ ${cfgItem.label}: ${val}`);
          return;
        }
        if (e.key === "Escape" || e.key === "Backspace") {
          e.preventDefault(); playClick(); setTuiConfiguring(false); setTuiMsg(""); return;
        }
        return;
      }
      if (cfgItem.kind === "text") {
        if (e.key === "Enter") {
          e.preventDefault(); playClick();
          const val = (e.target as HTMLInputElement).value.trim() || cfgItem.textValue;
          setTuiOptions(prev => prev.map((o, i) => i === tuiSelected ? { ...o, textValue: val, summary: val } : o));
          setTuiConfiguring(false);
          setTuiMsg(`  ✓ ${cfgItem.label}: ${val}`);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault(); playClick(); setTuiConfiguring(false); return;
        }
        playKeyClick();
        return;
      }
      return;
    }

    // Level 1: Main menu navigation
    if (e.key === "ArrowUp") { e.preventDefault(); setTuiSelected(p => Math.max(0, p - 1)); playClick(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setTuiSelected(p => Math.min(tuiOptions.length - 1, p + 1)); playClick(); return; }
    if (e.key === "Enter") {
      e.preventDefault(); playClick();
      const opt = tuiOptions[tuiSelected];
      if (!opt) return;
      if (opt.kind === "action") {
        if (opt.id === "install") {
          const missing = getMissingRequired(tuiOptions);
          if (missing.length > 0) {
            setTuiMsg("  ✗ Required: " + missing.join(", "));
            return;
          }
          playClick(); setPhase("installing");
          return;
        }
        if (opt.id === "abort") {
          playClick(); setTuiMsg(""); setPhase("shell");
          return;
        }
        if (opt.id === "save_config") {
          setTuiMsg("  ✓ Configuration saved to /root/archinstall.json");
          return;
        }
        return;
      }
      if (opt.subItems) {
        setTuiSubMenu(opt.subItems);
        setTuiSubSel(0);
        setTuiSubCfg(false);
        setTuiMsg("");
        return;
      }
      if (opt.kind === "menu" && opt.items) {
        setTuiSubIdx(opt.selectedIdx || 0);
        setTuiConfiguring(true);
        setTuiMsg("");
        return;
      }
      if (opt.kind === "text") { setTuiConfiguring(true); setTuiMsg(""); return; }
    }
    if (showHelp && (e.key === "Escape" || e.key === "?" || e.key.toLowerCase() === "h")) {
      e.preventDefault(); setShowHelp(false); playClick(); return;
    }
    if (e.key === "?" || e.key.toLowerCase() === "h") {
      e.preventDefault(); setShowHelp(p => !p); playClick(); return;
    }
    if (e.key === "Escape") {
      e.preventDefault(); playClick(); setPhase("shell"); setTuiMsg(""); return;
    }
  }

  // ─── Boot ───
  if (phase === "boot") {
    return (
      <div className="w-full max-w-6xl mx-auto h-full"
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
    const prompt = "[root@archiso ~]# ";
    const promptColor = "#00e676";

    const nextHint = (() => {
      if (!wifiConnected) return { cmd: "nmtui", desc: "Open Network Manager (WiFi)", step: "❶ WiFi" };
      if (shellStep < 3) return { cmd: "ping archlinux.org", desc: "Verify internet", step: "❷ Verify" };
      return { cmd: "archinstall", desc: "Launch installer", step: "❸ Install" };
    })();

    return (
      <div data-no-auto-advance className="w-full max-w-6xl mx-auto h-full">
        <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col">

          {/* ── nmtui WiFi panel ── */}
          {subshell === "nmtui" && (
            <div className="flex-1 p-4 sm:p-6 font-mono text-xs flex flex-col overflow-y-auto">
              <div className="text-[#60a5fa] font-bold text-[10px] mb-3 uppercase tracking-wider">Available Networks</div>
              <div className="space-y-2 flex-1">
                {[
                  { name: "HomeWiFi", sec: "WPA2", sig: "████ 54%", connected: wifiConnected },
                  { name: "Neighbor", sec: "WPA3", sig: "██  28%", connected: false },
                  { name: "Starbucks_Guest", sec: "Open", sig: "███ 40%", connected: false },
                  { name: "Library_Public", sec: "Open", sig: "█    12%", connected: false },
                ].map((net) => (
                  <div key={net.name}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                      wifiConnected && net.connected ? "bg-[#4ade80]/10 border-[#4ade80]/30" : "bg-white/[0.03] border-white/5 hover:border-[#60a5fa]/30 hover:bg-[#60a5fa]/5"
                    }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-base ${wifiConnected && net.connected ? "" : "text-white/40"}`}>
                        {wifiConnected && net.connected ? "🔒" : "📶"}
                      </span>
                      <div className="min-w-0">
                        <div className={`font-bold text-[11px] truncate ${wifiConnected && net.connected ? "text-[#4ade80]" : "text-white/80"}`}>
                          {net.name} {wifiConnected && net.connected && "✓ Connected"}
                        </div>
                        <div className="text-white/30 text-[9px]">{net.sec} — {net.sig}</div>
                      </div>
                    </div>
                    <button onClick={() => {
                      playClick(); setWifiConnected(true); setShellStep(2);
                      addTerminal(["✓ Connected to " + net.name, "WiFi ready! Type 'ping archlinux.org' to verify."]);
                    }}
                      className={`shrink-0 px-3 py-1.5 rounded text-[10px] font-bold transition-all border ${
                        wifiConnected && net.connected
                          ? "bg-[#4ade80]/20 text-[#4ade80] border-[#4ade80]/30 cursor-default"
                          : "bg-[#60a5fa]/15 text-[#60a5fa] border-[#60a5fa]/30 hover:bg-[#60a5fa]/25"
                      }`}>
                      {wifiConnected && net.connected ? "Connected" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[9px] text-white/30">
                {wifiConnected ? "✓ WiFi connected. Type 'ping archlinux.org' to verify." : "Click Connect on your WiFi network."}
              </div>
              <button onClick={() => { playClick(); setSubshell("bash"); }}
                className="mt-2 self-start px-3 py-1.5 rounded border border-white/10 text-white/40 hover:text-white/70 text-[10px] font-mono transition-colors">
                ← Back to terminal
              </button>
            </div>
          )}

          {/* ── Disk tab content ── */}
          {subshell === "fdisk" && (
            <div className="flex-1 p-4 sm:p-6 font-mono text-xs overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-white/40 text-[9px] uppercase tracking-wider border-b border-white/10">
                      <th className="text-left py-2 pr-4">Device</th>
                      <th className="text-right pr-4">Size</th>
                      <th className="text-left pr-4">Type</th>
                      <th className="text-left">Mount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { dev: `${fdiskDisk || "nvme0n1"}p1`, size: "500M", type: "EFI System", mount: "/boot" },
                      { dev: `${fdiskDisk || "nvme0n1"}p2`, size: "444G", type: "Windows 11", mount: "—" },
                      { dev: `${fdiskDisk || "nvme0n1"}p3`, size: "26.2G", type: "Linux root", mount: "/" },
                      { dev: `${fdiskDisk || "nvme0n1"}p4`, size: "6.2G", type: "Linux swap", mount: "[SWAP]" },
                    ].map((part) => (
                      <tr key={part.dev} className="border-b border-white/5 last:border-0">
                        <td className="py-2 pr-4 text-white/80 font-bold">{part.dev}</td>
                        <td className="py-2 pr-4 text-right text-white/60">{part.size}</td>
                        <td className="py-2 pr-4 text-white/70">{part.type}</td>
                        <td className="py-2 text-white/50">{part.mount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { label: "p Print", action: "p", desc: "Print table" },
                  { label: "n New", action: "n", desc: "New partition" },
                  { label: "d Delete", action: "d", desc: "Delete" },
                  { label: "w Write", action: "w", desc: "Save changes" },
                  { label: "q Quit", action: "q", desc: "Back to Terminal" },
                ].map((btn) => (
                  <button key={btn.action} onClick={() => {
                    playClick();
                    if (btn.action === "q") { setSubshell("bash"); return; }
                    if (btn.action === "w") { addTerminal(["Writing partition table...", "✓ Done"]); return; }
                    if (btn.action === "n") { addTerminal(["Creating new partition... (10 GB)", "✓ New partition created"]); return; }
                    if (btn.action === "d") { addTerminal(["Deleting partition 4...", "✓ Partition deleted"]); return; }
                    addTerminal([`Partition table for /dev/${fdiskDisk || "nvme0n1"}`]);
                  }}
                    className="px-3 py-1.5 rounded text-[10px] font-bold border transition-colors bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20 hover:bg-[#fbbf24]/20">
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Terminal (always shown when no subshell) ── */}
          {subshell === "bash" && (
            <div className="flex-1 flex flex-col bg-[#0a0a0a]" onClick={() => inputRef.current?.focus()}>
              <div className="flex-1 overflow-y-auto p-4 pb-0 font-mono text-xs leading-relaxed" ref={termRef}
                style={{ fontFamily: "'Courier New', 'JetBrains Mono', 'Fira Code', monospace" }}>
                <div className="text-[#60a5fa] font-bold mb-1 text-[11px]">Arch Linux 6.8.9-arch1-1 (tty1)</div>
                <div className="text-[#4ade80] mb-2 text-[11px]">archiso login: root (automatic)</div>
                {terminal.map((line, i) => (
                  <div key={i} className="whitespace-pre-wrap" style={{
                    color: line.startsWith("[root@") ? "#00e676"
                      : line.startsWith("  ✓") ? "#4ade80"
                      : line.startsWith("  ✗") ? "#f87171"
                      : line.startsWith("──") ? "#888"
                      : "#c0c0c0"
                  }}>{line}</div>
                ))}
              </div>
              <div className="shrink-0 px-4 py-2 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0 text-sm leading-none" style={{ color: promptColor }}>{prompt}</span>
                  <input ref={inputRef} type="text" value={input} autoFocus autoComplete="off" spellCheck={false}
                    onChange={(e) => { setInput(e.target.value); setCompletionIdx(-1); playKeyClick(); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); handleShellSubmit(); setCompletionIdx(-1); return; }
                      if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); handleHistory("up"); return; }
                      if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); handleHistory("down"); return; }
                      if (e.key === "Tab") {
                        e.preventDefault(); e.stopPropagation();
                        const prefix = input.trim().toLowerCase();
                        if (!prefix) return;
                        const matches = ALL_COMMANDS.filter(c => c.startsWith(prefix) && c !== prefix);
                        if (matches.length === 0) return;
                        const next = (completionIdx + 1) % matches.length;
                        setCompletionIdx(next);
                        setInput(matches[next] + " ");
                        return;
                      }
                      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setInput(""); }
                    }}
                    className="flex-1 bg-transparent text-[#e8e8e8] outline-none font-mono text-xs caret-[#00e676] selection:bg-white/10"
                    style={{ fontFamily: "'Courier New', 'JetBrains Mono', 'Fira Code', monospace" }} />
                </div>
              </div>
            </div>
          )}

          {/* ── Bottom hint bar (always visible) ── */}
          <div className="border-t border-white/5 bg-[#0a0a0a] px-3 py-1.5 text-[9px] font-mono flex items-center gap-2 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); playClick(); handleShellSubmit(nextHint.cmd); }}
              className="flex items-center gap-1.5 bg-[#60a5fa]/15 hover:bg-[#60a5fa]/25 border border-[#60a5fa]/30 rounded px-2 py-1 text-[10px] text-[#60a5fa] font-bold transition-colors shrink-0">
              <span className="text-[8px]">⟳</span> {nextHint.cmd}
            </button>
            <span className="text-white/30 truncate">{nextHint.desc}</span>
            <span className="flex-1" />
            <span className="text-white/20 shrink-0">{nextHint.step}</span>
            <span className={`shrink-0 ml-1 ${!wifiConnected ? "text-[#f87171]" : shellStep < 3 ? "text-[#fbbf24]" : "text-[#4ade80]"}`}>
              {!wifiConnected ? "✗" : shellStep < 3 ? "◉" : "✓"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── TUI — classic menu ───
  if (phase === "tui") {
    function handleTuiClick(i: number) {
      const opt = tuiOptions[i];
      if (!opt) return;
      setTuiSelected(i);
      playClick();
      if (opt.kind === "action") {
        if (opt.id === "install") {
          const missing = getMissingRequired(tuiOptions);
          if (missing.length > 0) { setTuiMsg("  ✗ Required: " + missing.join(", ")); return; }
          playClick(); setPhase("installing");
        } else if (opt.id === "abort") {
          setTuiMsg(""); setPhase("shell");
        } else if (opt.id === "save_config") {
          setTuiMsg("  ✓ Configuration saved to /root/archinstall.json");
        }
        return;
      }
      if (opt.subItems) {
        setTuiSubMenu(opt.subItems); setTuiSubSel(0); setTuiSubCfg(false); setTuiMsg("");
        return;
      }
      if (opt.kind === "menu" && opt.items) {
        setTuiSubIdx(opt.selectedIdx || 0); setTuiConfiguring(true); setTuiMsg("");
        return;
      }
      if (opt.kind === "text") { setTuiConfiguring(true); setTuiMsg(""); }
    }



    return (
      <div data-no-auto-advance ref={tuiRef} className="fixed inset-0 z-50 bg-black font-mono leading-none overflow-hidden select-none"
        onKeyDown={handleTuiKey} tabIndex={0}
        style={{
          fontFamily: "'Courier New', monospace",
          color: "#aaaaaa",
          fontSize: 9,
          WebkitFontSmoothing: "none",
          MozOsxFontSmoothing: "unset",
          fontSmooth: "never",
          textRendering: "optimizeSpeed",
          lineHeight: "9px",
        }}>
        {/* Help overlay */}
        {showHelp && (
          <div className="absolute inset-0 z-10 bg-black flex items-center justify-center"
            onClick={() => setShowHelp(false)}>
            <div className="bg-black" onClick={e => e.stopPropagation()}
              style={{padding: "3px", fontSize: 9, lineHeight: "9px"}}>
              <div style={{color: "#ffffff"}}>archinstall 4.0 Help</div>
              <div><span style={{color: "#888"}}>Up/Down</span>Navigate</div>
              <div><span style={{color: "#888"}}>Enter</span>Select</div>
              <div><span style={{color: "#888"}}>Esc</span>Back</div>
              <div><span style={{color: "#888"}}>H</span>Help</div>
              <button onClick={() => setShowHelp(false)}
                style={{color: "#aaaaaa", background: "none", border: "none", cursor: "pointer", fontSize: 9, lineHeight: "9px", padding: 0, marginTop: 2}}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Level 3: sub-menu item configuration */}
        {tuiSubMenu && tuiSubCfg ? (
          <div style={{padding: "2px"}}>
            <div style={{color: "#ffffff"}}>{tuiSubMenu[tuiSubSel]?.label || ""}</div>
            {tuiSubMenu[tuiSubSel]?.kind === "menu" && tuiSubMenu[tuiSubSel]?.items ? (
              tuiSubMenu[tuiSubSel]!.items!.map((item, i) => (
                <div key={item.label} onClick={() => {
                  setTuiSubCfgIdx(i); playClick();
                  const subOpt = tuiSubMenu![tuiSubSel];
                  const val = subOpt.items![i].label;
                  setTuiSubMenu(prev => prev!.map((o, j) => j === tuiSubSel ? {...o, summary: val, selectedIdx: i} : o));
                  setTuiSubCfg(false);
                  setTuiMsg(`ok ${subOpt.label}: ${val}`);
                }} style={{color: i === tuiSubCfgIdx ? "#ffffff" : "#aaaaaa"}}>
                  {i === tuiSubCfgIdx ? ">" : " "}{item.label}
                </div>
              ))
            ) : (
              <div>
                <div>Enter value:</div>
                <input type="text" defaultValue={tuiSubMenu[tuiSubSel]?.textValue || ""} autoFocus
                  onKeyDown={handleTuiKey} onChange={() => playKeyClick()}
                  style={{background:"#000", border:"1px solid #333", color:"#fff", fontFamily:"'Courier New', monospace", fontSize:9, lineHeight:"9px", padding:0}} />
              </div>
            )}
          </div>
        ) : tuiSubMenu ? (
          /* Level 2: sub-menu list */
          <div style={{padding: "2px"}}>
            <div style={{color: "#ffffff"}}>{tuiOptions[tuiSelected]?.label || ""}</div>
            {tuiSubMenu.map((opt, i) => (
              <div key={opt.id} onClick={() => setTuiSubSel(i)}
                style={{color: i === tuiSubSel ? "#ffffff" : "#aaaaaa"}}>
                {i === tuiSubSel ? ">" : " "}{opt.label}
                <span style={{color: "#666"}}>{opt.summary}</span>
                {(opt.kind === "menu" && opt.items) || opt.kind === "text"
                  ? <span style={{color: "#555"}}>{" >"}</span>
                  : null}
              </div>
            ))}
          </div>
        ) : tuiConfiguring ? (
          /* Level 1b: configuring a value */
          <div style={{padding: "2px"}}>
            <div style={{color: "#ffffff"}}>{tuiOptions[tuiSelected]?.label || ""}</div>
            {tuiOptions[tuiSelected]?.kind === "menu" && tuiOptions[tuiSelected]?.items ? (
              tuiOptions[tuiSelected]!.items!.map((item, i) => (
                <div key={item.label} onClick={() => {
                  setTuiSubIdx(i); playClick();
                  setTuiOptions(prev => prev.map((o, j) => j === tuiSelected ? {...o, summary: item.label, selectedIdx: i} : o));
                  setTuiConfiguring(false);
                  setTuiMsg(`ok ${tuiOptions[tuiSelected]?.label}: ${item.label}`);
                }} style={{color: i === tuiSubIdx ? "#ffffff" : "#aaaaaa"}}>
                  {i === tuiSubIdx ? ">" : " "}{item.label}
                </div>
              ))
            ) : (
              <div>
                <div>Enter value:</div>
                <input type="text" defaultValue={tuiOptions[tuiSelected]?.textValue || ""} autoFocus
                  onKeyDown={handleTuiKey} onChange={() => playKeyClick()}
                  style={{background:"#000", border:"1px solid #333", color:"#fff", fontFamily:"'Courier New', monospace", fontSize:9, lineHeight:"9px", padding:0}} />
              </div>
            )}
          </div>
        ) : (
          /* Level 1: main menu */
          <div style={{padding: "1px"}}>
            {tuiOptions.map((opt, i) => {
              const sel = i === tuiSelected;
              const hasSub = (opt.subItems && opt.subItems.length > 0) || (opt.kind === "menu" && opt.items);
              const isInstall = opt.id === "install";
              const isAbort = opt.id === "abort";
              const isSave = opt.id === "save_config";
              return (
                <div key={opt.id} onClick={() => handleTuiClick(i)}
                  style={{color: sel ? "#ffffff" : "#aaaaaa", whiteSpace: "nowrap"}}>
                  {sel ? ">" : " "}
                  {opt.label}
                  {opt.required ? <span style={{color: "#aa0000"}}>{" *"}</span> : null}
                  <span style={{color: sel ? "#0000aa" : "#666"}}>
                    {opt.summary}
                    {hasSub && !isInstall && !isAbort && !isSave ? <span style={{color: "#555"}}>{" >"}</span> : null}
                  </span>
                </div>
              );
            })}
            {tuiMsg && (
              <div style={{color: tuiMsg.includes("✗") || tuiMsg.includes("Required") ? "#aa0000" : "#aaaaaa"}}>
                {tuiMsg}
              </div>
            )}
          </div>
        )}

        {/* Footer hints */}
        <div style={{color: "#aa0000", padding: "1px"}}>
          {tuiSubCfg ? "Enter confirm  Esc cancel"
            : tuiSubMenu ? "Enter select  Esc back"
            : tuiConfiguring ? "Enter select  Esc cancel"
            : "Up/Down navigate  Enter select  H Help  Esc back"}
        </div>
      </div>
    );
  }

  // ─── Installing ───
  if (phase === "installing") {
    const pkgLines = [
      "( 1/42)  linux                             ######## 100%",
      "( 2/42)  linux-firmware                    ######## 100%",
      "( 3/42)  base                              ######## 100%",
      "( 4/42)  base-devel                        ######## 100%",
      "( 5/42)  grub                              ######## 100%",
      "( 6/42)  networkmanager                    ######## 100%",
      "( 7/42)  plasma-desktop                    ######## 100%",
      "( 8/42)  sddm                              ######## 100%",
      "( 9/42)  pipewire                          ######## 100%",
      "(10/42)  bluez                             ######## 100%",
    ];
    return (
      <div data-no-auto-advance className="w-full max-w-6xl mx-auto h-full">
        <div className="h-full rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden p-4 font-mono text-xs leading-relaxed"
          style={{ fontFamily: "'Courier New', 'JetBrains Mono', 'Fira Code', monospace" }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-[#4ade80] mb-1">:: Synchronizing package databases...</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <div className="text-[#4ade80] ml-2"> core ........................ up to date</div>
            <div className="text-[#4ade80] ml-2"> extra ....................... up to date</div>
            <div className="text-[#4ade80] ml-2"> community .................. up to date</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="mt-3 text-[#fbbf24]">:: Starting full system installation...</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="mt-2 text-white/40">:: Installing packages (42 total)...</motion.div>
          <div className="mt-2 space-y-0.5">
            {pkgLines.map((line, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * (speed === "fast" ? 0.06 : 0.15) }}
                className="text-white/70">{line}</motion.div>
            ))}
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.0 : 2.0 }}
            className="mt-2 text-[#888]">:: Generating initramfs...</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.1 : 2.2 }}
            className="text-[#888] ml-2">  -&gt; Running mkinitcpio...</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.2 : 2.4 }}
            className="text-[#888]">:: Installing GRUB to /dev/nvme0n1...</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.3 : 2.6 }}
            className="text-[#888] ml-2">  -&gt; Installing for x86_64-efi platform.</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.4 : 2.8 }}
            className="text-[#888] ml-2">  -&gt; Windows Boot Manager detected at /dev/nvme0n1p2</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.5 : 3.0 }}
            className="text-[#4ade80] font-bold mt-2">✓ Installation complete!</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.6 : 3.2 }}
            className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: accent }}
              initial={{ width: "0%" }} animate={{ width: "100%" }}
              transition={{ duration: speed === "fast" ? 0.3 : 0.8, ease: "easeInOut" }} />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.8 : 3.5 }}
            className="mt-3 text-[#fbbf24] text-[11px] font-bold">Press any key to reboot...</motion.div>
        </div>
      </div>
    );
  }

  // ─── Post-Install: GRUB → Boot → Login → Desktop ───
  if (phase === "postinstall") {
    const steps = [
      { label: "Rebooting", icon: "🔁" },
      { label: "GRUB menu", icon: "📋" },
      { label: "Booting kernel", icon: "⚙️" },
      { label: "Login", icon: "👤" },
      { label: "Desktop", icon: "🖥️" },
    ];
    return (
      <div data-no-auto-advance className="w-full max-w-6xl mx-auto h-full"
        onClick={() => { if (postStep < 4) setPostStep(4); }}>
        <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] px-4 py-2 border-b border-white/10 flex items-center gap-2 shrink-0">
            <span className="text-white/60 text-[10px] font-mono font-bold tracking-wider flex-1">
              Arch Linux — First Boot
            </span>
            <span className="text-white/20 text-[9px] font-mono">
              {postStep + 1} / 5
            </span>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed">
            {/* Step indicators */}
            <div className="flex justify-center gap-1 px-4 pt-3 pb-2 border-b border-white/5">
              {steps.map((s, i) => (
                <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-all ${
                  i <= postStep ? "text-white/80" : "text-white/20"
                } ${i === postStep ? "bg-[#60a5fa]/10 border border-[#60a5fa]/20" : ""}`}>
                  <span>{i <= postStep ? s.icon : "○"}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="p-4">
              {postStep === 0 && (
                <div>
                  <div className="text-[#fbbf24] font-bold mb-2">Rebooting system...</div>
                  <div className="text-white/60">Unmounting filesystems...</div>
                  <div className="text-white/60 mt-1">The system will reboot in 5 seconds...</div>
                  <div className="text-white/60 mt-1"> Rebooting now.</div>
                  <div className="mt-4 text-white/20 text-[9px]">Click to skip to desktop</div>
                </div>
              )}
              {postStep === 1 && (
                <div className="space-y-3">
                  <div className="bg-black/60 rounded-lg p-4 border border-white/10">
                    <div className="text-[#60a5fa] font-bold text-sm mb-3">GNU GRUB version 2.12</div>
                    <div className="space-y-2 text-white/70">
                      <div className="bg-[#60a5fa]/20 text-white border border-[#60a5fa]/30 rounded px-3 py-2 font-bold">
                        ▶ Arch Linux (linux-6.8.9-arch1-1)
                      </div>
                      <div className="text-white/50 px-3 py-1">  Advanced options for Arch Linux</div>
                      <div className="border-t border-white/10 my-2" />
                      <div className="text-white/50 px-3 py-1">  Windows Boot Manager (on /dev/nvme0n1p2)</div>
                      <div className="text-white/20 text-[9px] mt-3">Use ↑↓ to highlight, Enter to boot. Automatic boot in 5s...</div>
                    </div>
                  </div>
                </div>
              )}
              {postStep === 2 && (
                <div>
                  <div className="text-[#888] space-y-1">
                    <div>[    0.000000] Linux version 6.8.9-arch1-1 (root@archiso) (gcc 13.2.1)</div>
                    <div>[    0.010000] Command line: BOOT_IMAGE=/boot/vmlinuz-linux root=UUID=arch</div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                      <span className="text-[#4ade80]">[  OK  ]</span> Loaded initial ramdisk
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                      <span className="text-[#4ade80]">[  OK  ]</span> Mounted root filesystem
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                      <span className="text-[#4ade80]">[  OK  ]</span> Started NetworkManager
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                      <span className="text-[#4ade80]">[  OK  ]</span> Started Display Manager (SDDM)
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                      <span className="text-[#4ade80]">[  OK  ]</span> Reached target Graphical Interface
                    </motion.div>
                  </div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
                    className="mt-3 text-[#60a5fa]">Arch Linux 6.8.9-arch1-1 (tty1)</motion.div>
                </div>
              )}
              {postStep === 3 && (
                <div className="bg-black/60 rounded-lg p-5 border border-white/10 max-w-sm mx-auto">
                  <div className="text-center mb-4">
                    <div className="text-[#60a5fa] font-bold">Arch Linux 6.8.9-arch1-1 (tty1)</div>
                    <div className="text-white/30 text-[9px] mt-1">KDE Plasma 6.1</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#4ade80]">archlinux login:</span>
                      <span className="text-white font-bold">user</span>
                      <span className="text-white/30 animate-pulse">▊</span>
                    </div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                      className="flex items-center gap-2">
                      <span className="text-[#fbbf24]">Password:</span>
                      <span className="text-white/50">••••••••</span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                      className="text-[#4ade80] text-[10px]">  ✓ Authentication successful</motion.div>
                  </div>
                </div>
              )}
              {postStep === 4 && (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-white/10 mb-3">
                    <img src="/images/arch/12-desktop-profile.png" alt="KDE Plasma Desktop"
                      className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="text-center">
                    <div className="text-[#4ade80] font-bold">✓ Welcome to Arch Linux!</div>
                    <div className="text-white/50 text-[10px] mt-1">KDE Plasma 6.1 — Wayland</div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 bg-[#0a0a0a] px-4 py-1.5 text-[9px] text-white/20 font-mono flex justify-between shrink-0">
            <span>Click to advance</span>
            <span>{steps[postStep]?.label || ""}</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Done ───
  if (phase === "done") {
    return (
      <div data-no-auto-advance className="w-full max-w-6xl mx-auto h-full">
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
