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
  id: string; label: string; summary: string;
  kind: "menu" | "text" | "action";
  items?: SubItem[]; selectedIdx?: number; textValue: string;
  subItems?: TuiConfig[];
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
    { id: "language", label: "Archinstall language", summary: "English", kind: "menu",
      items: [
        { label: "English", desc: "English (default)" },
        { label: "Deutsch", desc: "German" },
        { label: "Français", desc: "French" },
        { label: "Español", desc: "Spanish" },
      ], selectedIdx: 0, textValue: "" },
    { id: "locales", label: "Locales", summary: "us / en_US.UTF-8", kind: "menu",
      items: [
        { label: "us", desc: "English (US)" },
        { label: "uk", desc: "English (UK)" },
        { label: "de", desc: "German" },
        { label: "fr", desc: "French" },
        { label: "es", desc: "Spanish" },
        { label: "jp", desc: "Japanese" },
        { label: "br", desc: "Portuguese (Brazil)" },
      ], selectedIdx: 0, textValue: "" },
    { id: "mirrors", label: "Mirrors and repositories", summary: "Worldwide", kind: "menu",
      items: [
        { label: "Worldwide", desc: "Auto-select fastest mirror" },
        { label: "United States", desc: "US-based mirrors" },
        { label: "Europe", desc: "EU-based mirrors" },
        { label: "Asia", desc: "Asia-based mirrors" },
      ], selectedIdx: 0, textValue: "" },
    { id: "disk", label: "Disk configuration", summary: "Best-effort, ext4", kind: "menu",
      selectedIdx: 0, textValue: "", subItems: diskSub },
    { id: "swap", label: "Swap", summary: "2 GB", kind: "menu",
      items: [
        { label: "None", desc: "No swap" },
        { label: "512 MB", desc: "512 MB swap" },
        { label: "1 GB", desc: "1 GB swap" },
        { label: "2 GB", desc: "2 GB swap (recommended)" },
        { label: "4 GB", desc: "4 GB swap" },
        { label: "Zram", desc: "Compressed RAM swap" },
      ], selectedIdx: 3, textValue: "" },
    { id: "bootloader", label: "Bootloader", summary: "GRUB (dual-boot)", kind: "menu",
      items: [
        { label: "GRUB", desc: "GRUB — detects Windows for dual-boot" },
        { label: "systemd-boot", desc: "Simple UEFI boot" },
        { label: "efistub", desc: "Direct UEFI boot entry" },
      ], selectedIdx: 0, textValue: "" },
    { id: "kernels", label: "Kernels", summary: "linux", kind: "menu",
      items: [
        { label: "linux", desc: "Stable kernel (default)" },
        { label: "linux-lts", desc: "Long-term support kernel" },
        { label: "linux-hardened", desc: "Security-hardened kernel" },
        { label: "linux-zen", desc: "Performance-tuned kernel" },
      ], selectedIdx: 0, textValue: "" },
    { id: "hostname", label: "Hostname", summary: "archlinux", kind: "text", textValue: "archlinux" },
    { id: "authentication", label: "Authentication", summary: "root + user", kind: "menu",
      selectedIdx: 0, textValue: "", subItems: authSub },
    { id: "profile", label: "Profile", summary: "KDE Plasma", kind: "menu",
      items: [
        { label: "KDE Plasma", desc: "Full-featured KDE desktop" },
        { label: "GNOME", desc: "Modern GNOME desktop" },
        { label: "XFCE", desc: "Lightweight XFCE desktop" },
        { label: "i3", desc: "Tiling window manager" },
        { label: "Sway", desc: "Wayland tiling compositor" },
        { label: "Hyprland", desc: "Dynamic Wayland compositor" },
        { label: "None", desc: "No desktop (minimal)" },
      ], selectedIdx: 0, textValue: "" },
    { id: "applications", label: "Applications", summary: "Audio, BT, Print", kind: "menu",
      selectedIdx: 0, textValue: "", subItems: appSub },
    { id: "network", label: "Network configuration", summary: "NetworkManager", kind: "menu",
      items: [
        { label: "NetworkManager", desc: "Full network manager (default)" },
        { label: "systemd-networkd", desc: "Minimal systemd networking" },
        { label: "iwd", desc: "Standalone WiFi daemon" },
        { label: "None", desc: "No network config" },
      ], selectedIdx: 0, textValue: "" },
    { id: "additional_packages", label: "Additional packages", summary: "(none)", kind: "text", textValue: "" },
    { id: "timezone", label: "Timezone", summary: "UTC", kind: "text", textValue: "UTC" },
    { id: "ntp", label: "Automatic time sync (NTP)", summary: "Yes", kind: "menu",
      items: [
        { label: "Yes", desc: "Enable NTP time sync" },
        { label: "No", desc: "Disable NTP" },
      ], selectedIdx: 0, textValue: "" },
    { id: "save_config", label: "Save configuration", summary: "", kind: "action", textValue: "" },
    { id: "install", label: "Install", summary: "", kind: "action", textValue: "" },
    { id: "abort", label: "Abort", summary: "", kind: "action", textValue: "" },
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
        "  iwctl        iNet Wireless Daemon (interactive)",
        "  timedatectl  Check/sync system clock",
        "  fdisk        Partition tool: fdisk -l or fdisk /dev/sdX",
        "  cfdisk       TUI partition manager",
        "  lsblk        List block devices",
        "  ls, cat, uname, ip, free, df, neofetch, clear",
        "",
        "  ── Internet is REQUIRED before archinstall ──",
        "  Step 1: iwctl → station wlan0 get-networks",
        "  Step 2: iwctl → station wlan0 connect <SSID>",
        "  Step 3: ping archlinux.org (verify)",
        "  Step 4: archinstall",
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
  type SubShell = "bash" | "iwctl" | "fdisk";
  const [subshell, setSubshell] = useState<SubShell>("bash");
  const [floatingImg, setFloatingImg] = useState<string | null>(null);
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
  const [suggestionIdx, setSuggestionIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const COMMANDS = [
    { cmd: "archinstall", desc: "Launch guided installer (TUI)" },
    { cmd: "iwctl", desc: "WiFi connection manager" },
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
        setShellStep(1);
        setTerminal(["── Arch Linux Dual-Boot Installation ──────────────", "  Internet is required. Follow the 3 steps below:", "", "  ❶ iwctl     → Connect to WiFi", "  ❷ ping      → Verify internet", "  ❸ archinstall → Start guided installer", "────────────────────────────────────────────────────"]);
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
    function handleKey(e: KeyboardEvent) {
      if (phase === "shell" && inputRef.current && document.activeElement !== inputRef.current) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { inputRef.current.focus(); setInput(e.key); }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

  function addTerminal(lines: string[]) { setTerminal(prev => [...prev, ...lines]); }

  function showImageFor(img: string) {
    setFloatingImg(img);
    setTimeout(() => setFloatingImg(null), speed === "fast" ? 1500 : 3500);
  }

  function handleIwctlSubmit(raw: string) {
    const parts = raw.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    if (cmd === "exit" || cmd === "quit") {
      playClick();
      setSubshell("bash");
      addTerminal(["[iwctl]# exit", "  Back to shell"]);
      setInput("");
      return;
    }
    if (cmd === "help") {
      addTerminal(["[iwctl]# help",
        "── iwctl commands ───────────────────────",
        "  station list               Show WiFi stations",
        "  station wlan0 scan         Scan for networks",
        "  station wlan0 get-networks Show available networks",
        "  station wlan0 connect <S>  Connect to a network",
        "  exit                       Return to shell",
      ]);
      setInput("");
      return;
    }
    if (cmd === "device") {
      addTerminal(["[iwctl]# device list", "                Devices",
        "┌──────┬──────────┬──────────┬──────────┐",
        "│ Name │ Address  │ Powered  │ Adapter  │",
        "├──────┼──────────┼──────────┼──────────┤",
        "│ wlan0│ 00:1a:2b:3c:4d:5e │ on       │ phy0    │",
        "└──────┴──────────┴──────────┴──────────┘",
      ]);
      setInput("");
      return;
    }
    if (cmd === "station") {
      const sub = args[0];
      if (sub === "list") {
        addTerminal(["[iwctl]# station list", "                Stations",
          "┌──────┬──────────┬──────────┬──────────┐",
          "│ Name │ State    │ Network  │  Address │",
          "├──────┼──────────┼──────────┼──────────┤",
          `│ wlan0│ ${wifiConnected ? "connected" : "disconnected"} │ ${wifiConnected ? "HomeWiFi" : "—"}      │ 00:1a:2b:3c:4d:5e│`,
          "└──────┴──────────┴──────────┴──────────┘",
        ]);
      } else if (sub === "wlan0") {
        if (args[1] === "scan") {
          showImageFor("/images/arch/13-network-config.png");
          addTerminal(["[iwctl]# station wlan0 scan", "  ✓ Scan completed", "  Type 'station wlan0 get-networks' to see results"]);
        } else if (args[1] === "get-networks") {
          addTerminal(["[iwctl]# station wlan0 get-networks",
            "                              Available Networks",
            "┌─────┬──────────────────────────┬──────────┬──────────┐",
            "│ Nr. │ Network name             │ Security │ Strength │",
            "├─────┼──────────────────────────┼──────────┼──────────┤",
            "│   1 │ HomeWiFi                 │ WPA2     │ ████ 54% │",
            "│   2 │ Neighbor                 │ WPA3     │ ██  28%  │",
            "│   3 │ Starbucks_Guest          │ Open     │ ███ 40%  │",
            "│   4 │ Library_Public           │ Open     │ █    12%  │",
            "└─────┴──────────────────────────┴──────────┴──────────┘",
          ]);
        } else if (args[1] === "connect") {
          const ssid = args.slice(2).join(" ");
          if (ssid) {
            setWifiConnected(true);
            setShellStep(2);
            showImageFor("/images/arch/13-network-config.png");
            addTerminal(["[iwctl]# station wlan0 connect " + ssid,
              "  ✓ Authentication completed",
              "  ✓ DHCP lease obtained",
              `  ✓ Connected to ${ssid}`,
              "  Internet ready! exit iwctl → ping → archinstall",
            ]);
          } else {
            addTerminal(["[iwctl]# station wlan0 connect <SSID>", "  Usage: station wlan0 connect HomeWiFi"]);
          }
        } else {
          addTerminal(["[iwctl]# station wlan0 ...", "  Commands: scan, get-networks, connect <SSID>"]);
        }
      } else {
        addTerminal(["[iwctl]# station ...", "  Usage: station list | station wlan0 <command>"]);
      }
      setInput("");
      return;
    }
    // fallback
    addTerminal([`[iwctl]# ${raw}`, `  Unknown iwctl command. Type 'help'`]);
    setInput("");
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

    if (subshell === "iwctl") { handleIwctlSubmit(raw); return; }
    if (subshell === "fdisk") { handleFdiskSubmit(raw); return; }

    const lower = raw.toLowerCase();

    if (lower === "archinstall") {
      if (!wifiConnected) {
        addTerminal([`[root@archiso ~]# ${raw}`, "  ✗ No internet. Connect to WiFi first:", "    iwctl → station wlan0 get-networks", "    station wlan0 connect <SSID>", "    exit → ping archlinux.org"]);
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
      playClick();
      setInput("");
      setSubshell("iwctl");
      addTerminal(["[root@archiso ~]# iwctl",
        "iwctl v2.11  (iNet Wireless Daemon)",
        "  Type 'help' for commands, 'exit' to return to shell",
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
        showImageFor("/images/arch/08-disk-partitioning.png");
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

    // Normal bash commands
    const output = processCommand(raw, setWifi);
    addTerminal([`[root@archiso ~]# ${raw}`, ...output]);
    if (lower === "lsblk" || lower === "cfdisk" || lower === "fdisk -l") {
      showImageFor("/images/arch/08-disk-partitioning.png");
    }
    if (lower === "ping" || lower.startsWith("ping ")) {
      if (wifiConnected) { showImageFor("/images/arch/13-network-config.png"); setShellStep(3); }
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

    // Level 1: Main menu navigation
    if (e.key === "ArrowUp") { e.preventDefault(); setTuiSelected(p => Math.max(0, p - 1)); playClick(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setTuiSelected(p => Math.min(tuiOptions.length - 1, p + 1)); playClick(); return; }
    if (e.key === "Enter") {
      e.preventDefault(); playClick();
      const opt = tuiOptions[tuiSelected];
      if (!opt) return;
      if (opt.kind === "action") {
        if (opt.id === "install") {
          const allConfigurable = tuiOptions.filter(o => o.kind !== "action");
          const allDone = allConfigurable.every(o => o.summary !== "");
          if (!allDone) { setTuiMsg("  ✗ Configure all options first"); return; }
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
    if (e.key === "?" || e.key.toLowerCase() === "h") {
      e.preventDefault(); setShowHelp(p => !p); playClick(); return;
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
    const prompt = subshell === "bash" ? "[root@archiso ~]# " : "";
    const promptColor = "#00e676";

    // Next-action hint always visible in bottom bar
    const nextHint = (() => {
      if (!wifiConnected) return { cmd: "iwctl", desc: "Open WiFi manager", step: "❶ WiFi" };
      if (shellStep < 3) return { cmd: "ping archlinux.org", desc: "Verify internet", step: "❷ Verify" };
      return { cmd: "archinstall", desc: "Launch installer", step: "❸ Install" };
    })();

    if (subshell === "iwctl") {
      // ── Visual WiFi panel ──
      return (
        <div data-no-auto-advance className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}>
          <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] px-4 py-2 border-b border-white/10 flex items-center shrink-0">
              <span className="text-[#60a5fa] text-[10px] font-mono font-bold tracking-wider flex-1">iwctl — WiFi Setup</span>
              <span className="text-white/20 text-[9px] font-mono">iwd 2.11</span>
            </div>
            <div className="flex-1 p-4 sm:p-6 font-mono text-xs flex flex-col">
              <div className="text-white/40 text-[10px] mb-3 uppercase tracking-wider">Available Networks</div>
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
                      playClick();
                      setWifiConnected(true);
                      setShellStep(2);
                      setSubshell("bash");
                      addTerminal(["✓ Connected to " + net.name, "WiFi ready! Type 'ping archlinux.org' to verify."]);
                      showImageFor("/images/arch/13-network-config.png");
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
                {wifiConnected ? "✓ WiFi connected. Click 'Back to shell' to continue." : "Click Connect on your WiFi network."}
              </div>
              <button onClick={() => { playClick(); setSubshell("bash"); addTerminal(["Back to shell"]); }}
                className="mt-2 self-start px-3 py-1.5 rounded border border-white/10 text-white/40 hover:text-white/70 text-[10px] font-mono transition-colors">
                ← Back to shell
              </button>
            </div>
            <div className="border-t border-white/5 bg-[#0a0a0a] px-4 py-1.5 text-[9px] text-white/30 font-mono flex justify-between">
              <span>{wifiConnected ? "✓ Connected" : "✗ Disconnected — click a network"}</span>
              <span>iwd 2.11</span>
            </div>
          </div>
        </div>
      );
    }

    if (subshell === "fdisk") {
      // ── Visual partition panel ──
      return (
        <div data-no-auto-advance className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}>
          <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] px-4 py-2 border-b border-white/10 flex items-center shrink-0">
              <span className="text-[#fbbf24] text-[10px] font-mono font-bold tracking-wider flex-1">fdisk — /dev/{fdiskDisk}</span>
              <span className="text-white/20 text-[9px] font-mono">util-linux 2.39.3</span>
            </div>
            <div className="flex-1 p-4 sm:p-6 font-mono text-xs">
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
                      { dev: `${fdiskDisk}p1`, size: "500M", type: "EFI System", mount: "/boot" },
                      { dev: `${fdiskDisk}p2`, size: "444G", type: "Windows 11", mount: "—" },
                      { dev: `${fdiskDisk}p3`, size: "26.2G", type: "Linux root", mount: "/" },
                      { dev: `${fdiskDisk}p4`, size: "6.2G", type: "Linux swap", mount: "[SWAP]" },
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
                  { label: "q Quit", action: "q", desc: "Exit" },
                ].map((btn) => (
                  <button key={btn.action}
                    onClick={() => {
                      playClick();
                      if (btn.action === "q") { setSubshell("bash"); addTerminal(["Quit fdisk"]); return; }
                      if (btn.action === "w") { addTerminal(["Writing partition table...", "✓ Done"]); return; }
                      if (btn.action === "n") { addTerminal(["Creating new partition... (10 GB)", "✓ New partition created"]); return; }
                      if (btn.action === "d") { addTerminal(["Deleting partition 4...", "✓ Partition deleted"]); return; }
                      addTerminal([`Partition table for /dev/${fdiskDisk}`]);
                    }}
                    className="px-3 py-1.5 rounded text-[10px] font-bold border transition-colors bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20 hover:bg-[#fbbf24]/20">
                    {btn.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-[9px] text-white/30">
                Click an action above. Use q Quit to exit.
              </div>
            </div>
            <div className="border-t border-white/5 bg-[#0a0a0a] px-4 py-1.5 text-[9px] text-white/30 font-mono">
              fdisk — {fdiskDisk} • q Quit to exit
            </div>
          </div>
        </div>
      );
    }

    // ── Bash: text terminal ──
    return (
      <div data-no-auto-advance className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}>
        <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col relative"
          onClick={() => inputRef.current?.focus()}>
          {/* Floating image overlay */}
          {floatingImg && (
            <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center p-4 sm:p-8"
              onClick={() => setFloatingImg(null)}>
              <div className="relative max-w-2xl w-full rounded-lg overflow-hidden border border-white/20 shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <img src={floatingImg} alt="screenshot"
                  className="w-full h-auto object-contain max-h-[50vh]" />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
                  <div className="text-[9px] text-white/50 font-mono">Click anywhere to close</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed" ref={termRef}>
            <div className="text-[#60a5fa] font-bold mb-1">Arch Linux 6.8.9-arch1-1 (tty1)</div>
            <div className="text-[#4ade80] mb-1">archiso login: root (automatic)</div>
            <div className="text-[#888] mb-2">
              Connection: {wifiConnected ? "✓ Connected" : "✗ No internet — connect WiFi first"}
            </div>
            {subshell === "bash" && (
              <div className="mb-3 p-2 rounded border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3 text-[10px]">
                  {[
                    { num: 1, label: "WiFi", done: wifiConnected },
                    { num: 2, label: "Verify", done: shellStep >= 3 },
                    { num: 3, label: "Install", done: false },
                  ].map((s, i) => (
                    <div key={i} className={`flex items-center gap-1.5 ${
                      (i === 0 && !wifiConnected) || (i === 1 && wifiConnected && shellStep < 3) || (i === 2 && shellStep >= 3)
                        ? "text-[#60a5fa] font-bold" : s.done ? "text-[#4ade80]" : "text-white/30"
                    }`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border ${
                        (i === 0 && !wifiConnected) || (i === 1 && wifiConnected && shellStep < 3) || (i === 2 && shellStep >= 3)
                          ? "border-[#60a5fa] bg-[#60a5fa]/20" : s.done ? "border-[#4ade80] bg-[#4ade80]/20" : "border-white/10"
                      }`}>{s.done ? "✓" : s.num}</span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </div>
                  ))}
                  <span className="flex-1" />
                  {!wifiConnected && <span className="text-[#f87171]">✗ No internet</span>}
                  {wifiConnected && shellStep < 3 && <span className="text-[#fbbf24]">✓ WiFi — verify with ping</span>}
                  {shellStep >= 3 && <span className="text-[#4ade80]">✓ Ready — type archinstall</span>}
                </div>
              </div>
            )}
            {terminal.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap"
                style={{
                  color: line.startsWith("[root@") ? "#00e676"
                    : line.startsWith("  ✓") ? "#4ade80"
                    : line.startsWith("  ✗") ? "#f87171"
                    : line.startsWith("──") ? "#888"
                    : line.startsWith("┌") || line.startsWith("│") || line.startsWith("├") || line.startsWith("└") ? "#888"
                    : "#c0c0c0"
                }}>{line}</div>
            ))}
            <div className="relative flex items-center gap-1 mt-1">
              <span className="shrink-0" style={{ color: promptColor }}>{prompt}</span>
              <input ref={inputRef} type="text" value={input} autoFocus autoComplete="off" spellCheck={false}
                onChange={(e) => {
                  const val = e.target.value;
                  setInput(val);
                  setCompletionIdx(-1);
                  setSuggestionIdx(-1);
                  playKeyClick();
                  if (val.trim()) {
                    const prefix = val.trim().toLowerCase();
                    const matches = COMMANDS.filter(c => c.cmd.startsWith(prefix));
                    setShowSuggestions(matches.length > 0 && matches.length < ALL_COMMANDS.length);
                  } else if (val.trim() === "" && document.activeElement === inputRef.current) {
                    setShowSuggestions(true);
                    setSuggestionIdx(0);
                  } else {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => { if (!input.trim()) { setShowSuggestions(true); setSuggestionIdx(0); } }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => {
                  const getMatches = () => {
                    const prefix = input.trim().toLowerCase();
                    return prefix ? COMMANDS.filter(c => c.cmd.startsWith(prefix) && c.cmd !== prefix) : COMMANDS;
                  };
                  if (showSuggestions && e.key === "ArrowDown") { e.preventDefault(); const m = getMatches(); setSuggestionIdx(p => Math.min(m.length - 1, p + 1)); void m; return; }
                  if (showSuggestions && e.key === "ArrowUp") { e.preventDefault(); setSuggestionIdx(p => Math.max(0, p - 1)); return; }
                  if (showSuggestions && (e.key === "Enter" || e.key === "Tab")) {
                    e.preventDefault();
                    const m = getMatches();
                    if (m.length > 0 && suggestionIdx >= 0 && suggestionIdx < m.length) {
                      setInput(m[suggestionIdx].cmd + " ");
                    }
                    setShowSuggestions(false);
                    setSuggestionIdx(-1);
                    inputRef.current?.focus();
                    return;
                  }
                  if (e.key === "Enter") { e.preventDefault(); handleShellSubmit(); setCompletionIdx(-1); setShowSuggestions(false); setSuggestionIdx(-1); }
                  if (e.key === "ArrowUp") { e.preventDefault(); if (!showSuggestions) handleHistory("up"); }
                  if (e.key === "ArrowDown") { e.preventDefault(); if (!showSuggestions) handleHistory("down"); }
                  if (e.key === "Escape") { e.preventDefault(); setShowSuggestions(false); setSuggestionIdx(-1); }
                  if (e.key === "Tab" && !showSuggestions) {
                    e.preventDefault();
                    const prefix = input.trim().toLowerCase();
                    if (!prefix) { setShowSuggestions(true); setSuggestionIdx(0); return; }
                    const matches = ALL_COMMANDS.filter(c => c.startsWith(prefix) && c !== prefix);
                    if (matches.length === 0) return;
                    const next = (completionIdx + 1) % matches.length;
                    setCompletionIdx(next);
                    setInput(matches[next] + " ");
                  }
                }}
                className="flex-1 bg-transparent text-white/90 outline-none font-mono text-xs caret-white/70"
                placeholder="Type a command... (Tab ⇥ for autocomplete)" />

              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-30"
                  onMouseDown={e => e.preventDefault()}>
                  {(() => {
                    const prefix = input.trim().toLowerCase();
                    const matches = prefix ? COMMANDS.filter(c => c.cmd.startsWith(prefix) && c.cmd !== prefix) : COMMANDS;
                    return matches.slice(0, 10).map((c, i) => (
                      <div key={c.cmd}
                        className={`flex items-center justify-between px-3 py-1.5 text-[10px] cursor-pointer transition-colors ${
                          i === suggestionIdx ? "bg-[#60a5fa]/20 text-white" : "text-white/60 hover:bg-white/5"
                        }`}
                        onClick={() => { setInput(c.cmd + " "); setShowSuggestions(false); inputRef.current?.focus(); }}
                        onMouseEnter={() => setSuggestionIdx(i)}>
                        <span className="font-bold text-[11px]" style={{ color: i === suggestionIdx ? "#60a5fa" : "#c0c0c0" }}>{c.cmd}</span>
                        <span className="text-white/30 ml-2 truncate">{c.desc}</span>
                      </div>
                    ));
                  })()}
                  <div className="border-t border-white/5 px-3 py-1 text-[8px] text-white/20 flex justify-between">
                    <span>↑↓ navigate • Enter select</span>
                    <span>{COMMANDS.filter(c => !input.trim() || c.cmd.startsWith(input.trim().toLowerCase())).length} commands</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-white/5 bg-[#0a0a0a] px-3 py-1.5 text-[9px] font-mono flex items-center gap-2">
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

  // ─── TUI — full terminal, no popup ───
  if (phase === "tui") {
    const configuring = tuiOptions[tuiSelected];
    const configurable = tuiOptions.filter(o => o.kind !== "action");
    const allDone = configurable.every(o => o.summary !== "");

    return (
      <div data-no-auto-advance className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}
        onKeyDown={handleTuiKey} tabIndex={0}>
        <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col">
          {/* Header bar — same full width as terminal */}
          <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] px-4 py-2 border-b border-white/10 flex items-center gap-2 shrink-0">
            <span className="text-white/60 text-[10px] font-mono font-bold tracking-wider flex-1">
              archinstall 4.0 — Textual UI
            </span>
            <button onClick={(e) => { e.stopPropagation(); setShowHelp(p => !p); playClick(); }}
              className="text-white/30 hover:text-white/70 text-[11px] font-mono px-1.5 py-0.5 rounded border border-white/10 hover:border-white/30 transition-colors"
              title="Help (H/? key)">?</button>
          </div>

          {/* Help overlay */}
          {showHelp && (
            <div className="absolute inset-0 z-10 bg-[#0d1117]/95 flex items-center justify-center p-4 sm:p-8"
              onClick={() => setShowHelp(false)}>
              <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-5 max-w-md w-full font-mono text-xs space-y-3"
                onClick={e => e.stopPropagation()}>
                <div className="text-[#60a5fa] font-bold text-sm mb-3">archinstall 4.0 — How to Use</div>
                <div className="space-y-2 text-white/70">
                  <div className="flex justify-between"><span className="text-white/40">↑ ↓</span><span>Navigate menu items</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Enter</span><span>Select / configure / confirm</span></div>
                  <div className="flex justify-between"><span className="text-white/40">Esc</span><span>Go back one level</span></div>
                  <div className="flex justify-between"><span className="text-white/40">H / ?</span><span>Toggle this help screen</span></div>
                  <div className="border-t border-white/10 pt-2 mt-3" />
                  <div className="text-white/50">Work through each option from top to bottom.</div>
                  <div className="text-white/50">Navigate to "Install" and press Enter when ready.</div>
                  <div className="text-white/50">"Abort" returns to the shell.</div>
                </div>
                <button onClick={() => setShowHelp(false)}
                  className="mt-3 w-full py-1.5 rounded border border-white/10 text-white/60 hover:text-white/80 text-[11px] transition-colors">
                  Close (Enter / Esc)
                </button>
              </div>
            </div>
          )}

          {/* Body — scrollable menu area, fills remaining space */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-mono text-xs">
            {tuiSubMenu && tuiSubCfg ? (
              /* ── Level 3: configuring a sub-menu item's value ── */
              <div>
                <div className="text-[#60a5fa] font-bold mb-3 uppercase tracking-wider border-b border-white/10 pb-1">
                  {tuiSubMenu[tuiSubSel]?.label || ""}
                </div>
                {tuiSubMenu[tuiSubSel]?.kind === "menu" && tuiSubMenu[tuiSubSel]?.items ? (
                  <div className="space-y-0.5 mb-2">
                    {tuiSubMenu[tuiSubSel]!.items!.map((item, i) => (
                      <div key={item.label}
                        className={`flex items-center justify-between px-3 py-1.5 rounded cursor-pointer transition-colors ${
                          i === tuiSubCfgIdx ? "bg-[#60a5fa]/20 text-white border border-[#60a5fa]/30" : "text-white/60 hover:bg-white/5"
                        }`}
                        onClick={() => { setTuiSubCfgIdx(i); }}>
                        <div>
                          <span className={i === tuiSubCfgIdx ? "text-white font-bold" : ""}>{item.label}</span>
                          <span className="text-white/30 ml-2">— {item.desc}</span>
                        </div>
                        {i === tuiSubCfgIdx && <span className="text-[#60a5fa] text-[10px]">◀</span>}
                      </div>
                    ))}
                    <div className="text-[9px] text-white/20 mt-3 pt-2 border-t border-white/5">
                      ↑↓ navigate • Enter select • Esc back
                    </div>
                  </div>
                ) : (
                  <div className="mb-2">
                    <div className="text-white/40 text-[10px] mb-2">Enter value for {tuiSubMenu[tuiSubSel]?.label}:</div>
                    <input type="text" defaultValue={tuiSubMenu[tuiSubSel]?.textValue || ""} autoFocus
                      onKeyDown={handleTuiKey}
                      onChange={() => playKeyClick()}
                      className="w-full bg-[#1a1a2e] border border-white/10 rounded px-3 py-2 text-xs text-white/90 outline-none font-mono" />
                    <div className="text-[9px] text-white/20 mt-2">Enter to confirm • Esc to cancel</div>
                  </div>
                )}
              </div>
            ) : tuiSubMenu ? (
              /* ── Level 2: sub-menu items (Disk, Auth, Apps) ── */
              <div>
                <div className="text-white/50 font-bold text-[11px] text-center mb-2 uppercase tracking-wider">
                  {tuiOptions[tuiSelected]?.label || ""}
                </div>
                <div className="border-t border-white/10 mb-1" />
                {tuiSubMenu.map((opt, i) => (
                  <div key={opt.id}
                    className={`flex justify-between items-center px-3 py-1.5 rounded cursor-pointer transition-all ${
                      i === tuiSubSel
                        ? "bg-[#60a5fa]/15 text-white border border-[#60a5fa]/20"
                        : "text-white/60 hover:bg-white/[0.03]"
                    }`}
                    onClick={() => setTuiSubSel(i)}>
                    <div className="flex items-center gap-2">
                      {i === tuiSubSel && <span className="text-[#60a5fa] text-[10px]">▶</span>}
                      <span className={i === tuiSubSel ? "font-bold" : ""}>{opt.label}</span>
                    </div>
                    <span className={i === tuiSubSel ? "text-white/60 text-[10px]" : "text-white/30 text-[10px]"}>
                      {opt.summary}
                    </span>
                  </div>
                ))}
                <div className="border-t border-white/10 mt-2 pt-2" />
                <div className="text-[9px] text-white/20">
                  ↑↓ navigate • Enter configure • Esc back
                </div>
              </div>
            ) : tuiConfiguring && configuring ? (
              /* ── Level 2b: simple sub-menu (value picking) ── */
              <div>
                <div className="text-[#60a5fa] font-bold mb-3 uppercase tracking-wider border-b border-white/10 pb-1">
                  {configuring.label}
                </div>
                {configuring.kind === "menu" && configuring.items ? (
                  <div className="space-y-0.5 mb-2">
                    {configuring.items.map((item, i) => (
                      <div key={item.label}
                        className={`flex items-center justify-between px-3 py-1.5 rounded cursor-pointer transition-colors ${
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
              /* ── Level 1: Main menu — fills container width ── */
              <div>
                <div className="text-white/50 font-bold text-[11px] text-center mb-2 uppercase tracking-wider">Arch Linux Guided Installer</div>
                <div className="border-t border-white/10 mb-1" />
                {tuiOptions.map((opt, i) => {
                  const isInstall = opt.id === "install";
                  const isAbort = opt.id === "abort";
                  const isSave = opt.id === "save_config";
                  const selected = i === tuiSelected;
                  return (
                    <div key={opt.id}
                      className={`flex justify-between items-center px-3 py-1.5 rounded cursor-pointer transition-all ${
                        selected
                          ? isAbort ? "bg-[#f87171]/15 border border-[#f87171]/20"
                            : isInstall && allDone ? "bg-[#4ade80]/15 border border-[#4ade80]/20"
                            : "bg-[#60a5fa]/15 border border-[#60a5fa]/20"
                          : "text-white/60 hover:bg-white/[0.03]"
                      }`}
                      onClick={() => setTuiSelected(i)}>
                      <div className="flex items-center gap-2 min-w-0">
                        {selected && isAbort && <span className="text-[#f87171] text-[10px] shrink-0">▶</span>}
                        {selected && isInstall && allDone && <span className="text-[#4ade80] text-[10px] shrink-0">▶</span>}
                        {selected && !isInstall && !isAbort && <span className="text-[#60a5fa] text-[10px] shrink-0">▶</span>}
                        <span className={`truncate ${selected ? "font-bold text-white" : ""}`} style={{
                          color: selected && isAbort ? "#f87171" : selected && isSave ? "#fbbf24" : selected && isInstall && allDone ? "#4ade80" : selected ? "white" : undefined
                        }}>{opt.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {opt.summary && (
                          <span className={selected ? "text-white/60 text-[10px]" : "text-white/30 text-[10px]"}>
                            {opt.summary}
                          </span>
                        )}
                        {selected && !isInstall && !isAbort && !isSave && <span className="text-[#4ade80] text-[10px]">←</span>}
                      </div>
                    </div>
                  );
                })}
                <div className="border-t border-white/10 mt-2 pt-2" />
                <div className="flex justify-between text-[9px]">
                  <span className="text-white/20">
                    ↑↓ navigate • Enter configure • H help
                  </span>
                  <span className={allDone ? "text-[#4ade80]" : "text-white/20"}>
                    {configurable.filter(o => o.summary !== "").length}/{configurable.length}
                  </span>
                </div>
              </div>
            )}

            {tuiMsg && (
              <div className="mt-3 text-[10px] font-mono" style={{ color: tuiMsg.includes("✗") ? "#f87171" : "#4ade80" }}>{tuiMsg}</div>
            )}
          </div>

          {/* Bottom status bar */}
          <div className="border-t border-white/10 bg-[#0a0a0a] px-4 py-1.5 text-[9px] text-white/30 font-mono flex justify-between shrink-0">
            <span>
              {tuiSubMenu ? "Esc back" : tuiConfiguring ? "Esc cancel" : "↓ Install → Enter"}
            </span>
            <span>
              {tuiSubCfg ? `${tuiSubMenu?.[tuiSubSel]?.label || ""}`
                : tuiSubMenu ? `${tuiOptions[tuiSelected]?.label || ""} sub-menu`
                : tuiConfiguring ? `${configuring?.label || ""}`
                : `WiFi ${wifiConnected ? "✓" : "✗"}`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Installing ───
  if (phase === "installing") {
    return (
      <div data-no-auto-advance className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.8 : 3.5 }}
            className="mt-3 text-[#fbbf24] text-[11px]">Press any key to reboot...</motion.div>
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
      <div data-no-auto-advance className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}
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
      <div data-no-auto-advance className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}>
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
