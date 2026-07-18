import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type Phase = "boot" | "shell" | "wizard" | "installing" | "done";

type WizardStep = {
  title: string;
  description: string;
  image: string;
  action: string;
  commands: string[];
};

const BOOT_LINES: { text: string; color?: string; delay: number }[] = [
  { text: "Booting Arch Linux 6.8.9-arch1-1...", color: "#888", delay: 200 },
  { text: "[    0.000000] Linux version 6.8.9-arch1-1 (root@archiso) (gcc 13.2.1) #1 SMP PREEMPT_DYNAMIC Tue Jun 30 2026", delay: 150 },
  { text: "[    0.010000] Command line: BOOT_IMAGE=/boot/vmlinuz-linux root=UUID=archiso", delay: 100 },
  { text: "[    0.020000] x86/fpu: Supporting XSAVE feature set 'x87' 'SSE' 'SSE2' 'AVX' 'AVX2'", delay: 80 },
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

const WIZARD_STEPS: WizardStep[] = [
  {
    title: "Run archinstall",
    description: "Launch the guided installer from the live terminal",
    image: "/images/arch/01-welcome-page.png",
    action: "Type archinstall and press Enter",
    commands: ["archinstall"],
  },
  {
    title: "Archinstall — Main Menu",
    description: "The guided installer TUI presents all configuration options. Work through them top to bottom.",
    image: "/images/arch/09-archinstall-menu.png",
    action: "Select Locales → Enter",
    commands: ["locales", "select locales", "enter"],
  },
  {
    title: "Locales — Language & Keyboard",
    description: "Set your keyboard layout and locale. Defaults are fine.",
    image: "/images/arch/03-wizard.png",
    action: "Keep defaults → Back to main menu",
    commands: ["back", "done", "confirm"],
  },
  {
    title: "Mirrors — Package Sources",
    description: "Select a mirror region close to you for fast package downloads.",
    image: "/images/arch/04-mirror-region.png",
    action: "Select your region → Back",
    commands: ["back", "done", "select", "confirm"],
  },
  {
    title: "Disk Configuration",
    description: "Choose how to partition the disk. 'Best effort' is easiest.",
    image: "/images/arch/06-best-effort.png",
    action: "Select 'Best effort' → Choose drive → ext4",
    commands: ["best effort", "select disk", "confirm"],
  },
  {
    title: "Filesystem & Swap",
    description: "Pick ext4 (most common) or btrfs. Enable swap for better memory management.",
    image: "/images/arch/07-filesystem.png",
    action: "Select ext4 → Enable swap → Back",
    commands: ["ext4", "btrfs", "swap", "confirm", "back"],
  },
  {
    title: "Disk Partitioning",
    description: "Review the partition layout. Confirm to continue.",
    image: "/images/arch/08-disk-partitioning.png",
    action: "Review partitions → Confirm",
    commands: ["confirm", "continue", "yes", "done"],
  },
  {
    title: "Bootloader",
    description: "GRUB is recommended for most setups, especially dual-boot.",
    image: "/images/arch/10-select-kernels.png",
    action: "Select GRUB → Back to main menu",
    commands: ["grub", "select grub", "back", "confirm"],
  },
  {
    title: "Hostname",
    description: "Set the network name for your machine.",
    image: "/images/arch/11-hostname.png",
    action: "Type archlinux → Enter",
    commands: ["archlinux", "enter", "confirm"],
  },
  {
    title: "Root Password",
    description: "Set the root (superuser) password.",
    image: "/images/arch/11-user-password.png",
    action: "Enter password → Confirm",
    commands: ["password", "confirm", "enter"],
  },
  {
    title: "User Account",
    description: "Create a regular user account with sudo privileges.",
    image: "/images/arch/12-user-accounts.png",
    action: "Add user → Set username & password → Confirm",
    commands: ["add user", "create user", "done"],
  },
  {
    title: "Profile — Desktop Environment",
    description: "Choose a desktop environment. KDE Plasma, GNOME, or XFCE.",
    image: "/images/arch/12-desktop-profile.png",
    action: "Select Profile → Type: Desktop → Pick one",
    commands: ["desktop", "kde", "gnome", "xfce", "profile", "select"],
  },
  {
    title: "Graphics Driver & Audio",
    description: "Select open-source graphics drivers and PipeWire for audio.",
    image: "/images/arch/05-optional-repos.png",
    action: "Graphics: All open-source → Audio: PipeWire → Back",
    commands: ["open source", "pipewire", "back", "confirm"],
  },
  {
    title: "Network Configuration",
    description: "Use NetworkManager for automatic WiFi and Ethernet.",
    image: "/images/arch/13-network-config.png",
    action: "Select NetworkManager → Back",
    commands: ["networkmanager", "network manager", "back", "confirm"],
  },
  {
    title: "Timezone & NTP",
    description: "Set your timezone and enable automatic time sync.",
    image: "/images/arch/10-disk-config.png",
    action: "Set timezone → NTP: True → Back",
    commands: ["timezone", "ntp", "back", "confirm", "true"],
  },
  {
    title: "Review & Install",
    description: "Review all options. Hit Install to begin.",
    image: "/images/arch/14-confirm-install.png",
    action: "Select 'Install' → Confirm",
    commands: ["install", "confirm", "yes", "begin"],
  },
];

function processCommand(input: string): string[] {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case "help":
      return [
        "Available commands:",
        "  archinstall    Launch the guided installer",
        "  ls             List directory contents",
        "  pwd            Print working directory",
        "  cd <dir>      Change directory",
        "  cat <file>    Show file contents",
        "  uname -a      System information",
        "  ip a          Show network interfaces",
        "  ping <host>   Test network connectivity",
        "  iwctl         WiFi configuration tool",
        "  free -h       Memory usage",
        "  df -h         Disk usage",
        "  neofetch      System info",
        "  echo <text>   Print text",
        "  clear         Clear the screen",
      ];
    case "archinstall":
      return [];
    case "ls": {
      const dir = args[0] || "";
      if (dir === "/") return ["bin   boot   dev   etc   home   lib   mnt   opt   proc   root   run   sbin   sys   tmp   usr   var"];
      if (dir.includes("home") || !dir) return ["Desktop   Documents   Downloads   Music   Pictures   Public   Templates   Videos"];
      if (dir === "/etc") return ["hostname   resolv.conf   fstab   pacman.conf   NetworkManager"];
      if (dir === "/dev") return ["sda   sda1   sda2   loop0   tty1   null   zero   random"];
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
      if (/fstab/.test(file)) return ["# /etc/fstab", "UUID=xxxx-xxxx  /  ext4  defaults  0  1"];
      return [`cat: ${file}: No such file or directory`];
    }
    case "uname": {
      if (args.includes("-a")) return ["Linux archiso 6.8.9-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"];
      if (args.includes("-r")) return ["6.8.9-arch1-1"];
      return ["Linux"];
    }
    case "ip": {
      if (args.includes("a") || args.includes("addr")) return [
        "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536",
        "    inet 127.0.0.1/8 scope host lo",
        "2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500",
        "    inet 192.168.1.100/24 brd 192.168.1.255 scope global enp0s3",
      ];
      if (args.includes("link")) return [
        "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536",
        "2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500",
        "3: wlan0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500",
      ];
      return ["Usage: ip a | ip link"];
    }
    case "ping": {
      const host = args.find(a => !a.startsWith("-")) || "archlinux.org";
      return [
        `PING ${host} (95.217.163.246) 56(84) bytes of data.`,
        "64 bytes from 95.217.163.246: icmp_seq=1 ttl=52 time=12.3 ms",
        "64 bytes from 95.217.163.246: icmp_seq=2 ttl=52 time=11.8 ms",
        "64 bytes from 95.217.163.246: icmp_seq=3 ttl=52 time=13.1 ms",
        "",
        `--- ${host} ping statistics ---`,
        "3 packets transmitted, 3 received, 0% packet loss",
        "rtt min/avg/max/mdev = 11.8/12.4/13.1/0.53 ms",
      ];
    }
    case "iwctl":
      return [
        "iwctl is starting...",
        "",
        "Network Configuration (iwctl)",
        "  Station: wlan0        Status: disconnected",
        "",
        "  Available networks:",
        "    HomeWiFi    ████ 54%  WPA2",
        "    Neighbor    ██  28%  WPA3",
        "",
        "  Type 'station wlan0 connect HomeWiFi' to connect.",
      ];
    case "free":
      return [
        "               total        used        free      shared  buff/cache   available",
        "Mem:           7.7Gi       1.2Gi       4.1Gi       89Mi       2.4Gi       6.0Gi",
        "Swap:          2.0Gi          0B       2.0Gi",
      ];
    case "df":
      return [
        "Filesystem      Size  Used Avail Use% Mounted on",
        "dev             3.9G     0  3.9G   0% /dev",
        "run             3.9G  1.6M  3.9G   1% /run",
        "/dev/sda1        25G   12G   13G  48% /",
      ];
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
        "        .:+oossooooooooossso+:.", 
        "            .-:/+++oss+/:-.",
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
  const [stepIdx, setStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStep = WIZARD_STEPS[stepIdx];
  const isWizardComplete = stepIdx >= WIZARD_STEPS.length;

  // Scroll terminal to bottom
  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [terminal, bootIdx]);

  // Boot animation
  useEffect(() => {
    if (phase !== "boot") return;
    if (bootIdx < BOOT_LINES.length) {
      const t = setTimeout(() => setBootIdx(p => p + 1), speed === "fast"
        ? BOOT_LINES[bootIdx].delay * 0.25 : BOOT_LINES[bootIdx].delay);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setPhase("shell");
        setTerminal(["[root@archiso ~]# Type 'help' for available commands"]);
      }, speed === "fast" ? 200 : 500);
      return () => clearTimeout(t);
    }
  }, [phase, bootIdx, speed]);

  // Wizard auto-advance
  useEffect(() => {
    if (isWizardComplete && phase === "wizard") {
      const t = setTimeout(() => setPhase("installing"), speed === "fast" ? 300 : 800);
      return () => clearTimeout(t);
    }
  }, [isWizardComplete, phase, speed]);

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
    if (phase === "shell") registerAdvance(() => onComplete());
    if (phase === "wizard") registerAdvance(() => onComplete());
  }, [phase, registerAdvance, onComplete]);

  // Keyboard shortcut: focus input on any key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (phase === "shell" && inputRef.current && document.activeElement !== inputRef.current) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          inputRef.current.focus();
          setInput(e.key);
        }
      }
      if (phase === "wizard" && inputRef.current && document.activeElement !== inputRef.current) {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          inputRef.current.focus();
          setInput(e.key);
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

  function addTerminal(lines: string[]) {
    setTerminal(prev => [...prev, ...lines]);
  }

  function handleShellSubmit() {
    const cmd = input.trim();
    if (!cmd) return;
    playKeyClick();
    setHistory(prev => [...prev, cmd]);
    setHistIdx(-1);

    if (cmd.toLowerCase() === "archinstall") {
      playClick();
      addTerminal([`[root@archiso ~]# ${cmd}`]);
      setInput("");
      setTimeout(() => {
        setPhase("wizard");
        setTerminal([]);
        setCompletedSteps(0);
      }, speed === "fast" ? 200 : 500);
      return;
    }

    const output = processCommand(cmd);
    addTerminal([`[root@archiso ~]# ${cmd}`, ...output]);
    setInput("");
  }

  function handleWizardSubmit() {
    const cmd = input.trim().toLowerCase();
    if (!cmd || !currentStep || isProcessing) return;
    setIsProcessing(true);
    playClick();
    const isCorrect = currentStep.commands.some(c => cmd.includes(c));
    if (isCorrect) {
      setError(null);
      setInput("");
      setTimeout(() => {
        setStepIdx(p => p + 1);
        setCompletedSteps(p => p + 1);
        setIsProcessing(false);
      }, speed === "fast" ? 150 : 400);
    } else {
      setError(`Try: "${currentStep.commands[0]}"`);
      setInput("");
      setIsProcessing(false);
    }
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

  // ─── Boot phase ───
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
            {bootIdx < BOOT_LINES.length && (
              <span className="inline-block w-2 h-4 bg-white/70 animate-pulse" />
            )}
          </div>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-white/20 font-mono">
            Click anywhere to skip
          </div>
        </div>
      </div>
    );
  }

  // ─── Shell phase ───
  if (phase === "shell") {
    return (
      <div className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}>
        <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col"
          onClick={() => inputRef.current?.focus()}>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed" ref={termRef}>
            <div className="text-[#60a5fa] font-bold mb-2">Arch Linux 6.8.9-arch1-1 (tty1)</div>
            <div className="text-[#4ade80] mb-1">archiso login: root (automatic)</div>
            <div className="text-[#888] mb-2">Last login: Sat Jul 18 12:00:00 2026 on tty1</div>
            {terminal.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap"
                style={{ color: line.startsWith("[root@") ? "#00e676" : "#c0c0c0" }}>{line}</div>
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
            <span>Type 'help' for commands • 'archinstall' to start installer</span>
            <span className="text-[#00e676]/30">tty1</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Installing ───
  if (phase === "installing") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
          <img src="/images/arch/15-install-progress.png" alt={`Installing ${osName}`}
            className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-[#12121a]/80 flex items-center justify-center">
            <div className="text-center space-y-6 px-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="text-4xl">🏹</div>
                <h2 className="text-xl font-bold" style={{ color: accent }}>Installing {osName}...</h2>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  Packages are being downloaded and configured. This takes a few minutes.
                </p>
                <div className="max-w-xs mx-auto h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: accent }}
                    initial={{ width: "0%" }} animate={{ width: "100%" }}
                    transition={{ duration: speed === "fast" ? 1.2 : 2.8, ease: "easeInOut" }} />
                </div>
                <div className="font-mono text-[10px] text-white/25 space-y-1 max-w-md mx-auto text-left">
                  {[":: Synchronizing package databases...", ":: Downloading core packages...",
                    ":: Installing base system...", ":: Configuring bootloader..."].map((line, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * (speed === "fast" ? 0.2 : 0.6) }}>
                      {line}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Done ───
  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
          <img src="/images/arch/16-install-complete.png" alt={`${osName} install complete`}
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 bg-black/60 backdrop-blur-sm rounded-2xl p-8" style={{ borderColor: `${accent}33`, borderWidth: 1 }}>
              <SparkleBurst trigger={true} />
              <div className="text-3xl">🏹</div>
              <h2 className="text-lg font-bold" style={{ color: accent }}>{osName} installed!</h2>
              <p className="text-xs text-white/50 max-w-xs mx-auto">
                You completed the archinstall guided installer. Welcome to {osName}.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // WIZARD — archinstall TUI with integrated terminal bar
  // ══════════════════════════════════════════════════════════════
  if (!currentStep) return null;

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-2xl border border-white/10 bg-black">
        <AnimatePresence mode="wait">
          <motion.img key={stepIdx} src={currentStep.image} alt={currentStep.title}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full object-cover bg-[#111]" />
        </AnimatePresence>

        {/* Step progress bar */}
        <div className="absolute top-3 left-4 right-4 flex items-center gap-3 pointer-events-none">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: accent }}
              animate={{ width: `${(completedSteps / WIZARD_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }} />
          </div>
          <span className="text-[10px] text-white/40 font-mono">{completedSteps + 1}/{WIZARD_STEPS.length}</span>
        </div>

        {/* Terminal bar at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          {error && (
            <div className="mx-2 mb-1 px-3 py-1 rounded bg-amber-500/15 border border-amber-500/20 text-[10px] text-amber-400/80 font-mono">
              💡 {error}
            </div>
          )}
          <div className="bg-[#0d1117]/95 backdrop-blur-sm border-t border-white/10 px-3 py-2"
            onClick={() => inputRef.current?.focus()}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1">
                <span className="font-mono text-xs" style={{ color: accent }}>$</span>
                <input ref={inputRef} type="text" value={input} autoFocus autoComplete="off" spellCheck={false}
                  onChange={(e) => { setInput(e.target.value); playKeyClick(); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleWizardSubmit(); }
                  }}
                  placeholder={currentStep.action}
                  className="flex-1 bg-transparent text-white/90 outline-none font-mono text-xs placeholder:text-white/20" />
              </div>
              <span className="text-[9px] text-white/20 font-mono shrink-0">{currentStep.title}</span>
              <button onClick={handleWizardSubmit} disabled={isProcessing}
                className="rounded px-2 py-1 text-[11px] font-bold text-white shrink-0"
                style={{ background: accent }}>↵</button>
              <button onClick={() => {
                if (!currentStep) return;
                setIsProcessing(true);
                setTimeout(() => {
                  setStepIdx(p => p + 1);
                  setCompletedSteps(p => p + 1);
                  setIsProcessing(false);
                  setError(null);
                }, speed === "fast" ? 150 : 400);
              }} disabled={isProcessing}
                className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/40 hover:text-white/80 transition-colors">
                ⏩
              </button>
            </div>
            <div className="text-[8px] text-white/15 font-mono mt-0.5">
              Type a command and press Enter, or click ⏩ to auto-advance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
