import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playClick, playKeyClick } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type Phase = "boot" | "shell" | "preview" | "installing" | "done";

type PreviewStep = {
  title: string;
  description: string;
  image: string;
};

const PREVIEW_STEPS: PreviewStep[] = [
  {
    title: "Locales",
    description: "Set your keyboard layout (us) and locale language (en_US.UTF-8).",
    image: "/images/arch/03-wizard.png",
  },
  {
    title: "Mirror Selection",
    description: "Choose a mirror region close to you for fast package downloads.",
    image: "/images/arch/04-mirror-region.png",
  },
  {
    title: "Disk Configuration",
    description: "Partition your drive. 'Best effort' handles it automatically with ext4 and swap.",
    image: "/images/arch/06-best-effort.png",
  },
  {
    title: "Filesystem",
    description: "Pick ext4 (most common) or btrfs. Swap is enabled for memory management.",
    image: "/images/arch/07-filesystem.png",
  },
  {
    title: "Bootloader",
    description: "GRUB is installed to your disk. Detects other OSes for dual-boot.",
    image: "/images/arch/10-select-kernels.png",
  },
  {
    title: "Hostname & Users",
    description: "Set your machine name, root password, and create a user with sudo.",
    image: "/images/arch/12-user-accounts.png",
  },
  {
    title: "Desktop Profile",
    description: "Choose KDE Plasma, GNOME, or XFCE. SDDM or GDM greeter.",
    image: "/images/arch/12-desktop-profile.png",
  },
  {
    title: "Graphics & Audio",
    description: "Open-source drivers for AMD/Intel/NVIDIA. PipeWire for audio.",
    image: "/images/arch/05-optional-repos.png",
  },
  {
    title: "Network & Timezone",
    description: "NetworkManager manages WiFi/Ethernet. NTP syncs your clock.",
    image: "/images/arch/13-network-config.png",
  },
  {
    title: "Review & Install",
    description: "Review all options. Once confirmed, packages are downloaded and configured.",
    image: "/images/arch/14-confirm-install.png",
  },
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

function processCommand(input: string): string[] {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case "help":
      return [
        "Available commands:",
        "  preview          Preview what archinstall will configure",
        "  archinstall      Start the guided installer",
        "  ping <host>     Test network connectivity",
        "  iwctl           WiFi configuration tool",
        "  timedatectl     System clock & NTP",
        "  fdisk -l        List available disks",
        "  ls              List directory contents",
        "  cat <file>      Show file contents",
        "  uname -a        System information",
        "  ip a            Show network interfaces",
        "  free -h         Memory usage",
        "  df -h           Disk usage",
        "  neofetch        System info",
        "  clear           Clear the screen",
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
      if (/fstab/.test(file)) return ["# /etc/fstab", "UUID=xxxx-xxxx  /  ext4  defaults  0  1"];
      if (/os-release/.test(file)) return ["NAME=\"Arch Linux\"", "ID=arch", "PRETTY_NAME=\"Arch Linux\""];
      return [`cat: ${file}: No such file or directory`];
    }
    case "uname": {
      if (args.includes("-a")) return ["Linux archiso 6.8.9-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux"];
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
        "  Type 'station wlan0 connect <SSID>' to connect.",
      ];
    case "station": {
      if (args.includes("wlan0") && args.includes("connect")) {
        return ["Connecting to network...", "  ✓ Authentication completed", "  ✓ DHCP lease obtained", "  Connected to " + args.slice(2).join(" ")];
      }
      return [`station ${args.join(" ")}: command not understood`];
    }
    case "timedatectl": {
      if (args.includes("set-ntp") || input.includes("set-ntp")) return ["  ✓ NTP synchronization enabled", "  System clock synchronized: yes"];
      return ["               Local time: Sat 2026-07-18 12:00:00 UTC", "  Universal time: Sat 2026-07-18 12:00:00 UTC", "     NTP enabled: yes", "NTP synchronized: no"];
    }
    case "fdisk": {
      if (args.includes("-l")) return [
        "Disk /dev/sda: 25 GiB, 26843545600 bytes, 52428800 sectors",
        "Device       Boot  Start      End  Sectors  Size  Id  Type",
        "/dev/sda1         2048  1048575  1046528  512M   83  Linux",
        "/dev/sda2      1048576 52426751 51378176 24.5G   83  Linux",
      ];
      return ["Usage: fdisk -l  (list disks)"];
    }
    case "free":
      return ["               total        used        free      shared  buff/cache   available", "Mem:           7.7Gi       1.2Gi       4.1Gi       89Mi       2.4Gi       6.0Gi", "Swap:          2.0Gi          0B       2.0Gi"];
    case "df":
      return ["Filesystem      Size  Used Avail Use% Mounted on", "dev             3.9G     0  3.9G   0% /dev", "run             3.9G  1.6M  3.9G   1% /run", "/dev/sda1        25G   12G   13G  48% /"];
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
  const [previewIdx, setPreviewIdx] = useState(0);
  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        setTerminal(["Type 'help' for commands, 'preview' to see what archinstall does, 'archinstall' to start"]);
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
    if (phase === "shell") registerAdvance(() => onComplete());
  }, [phase, registerAdvance, onComplete]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (phase === "shell" && inputRef.current && document.activeElement !== inputRef.current) {
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
      setInput("");
      setPhase("installing");
      return;
    }
    if (cmd.toLowerCase() === "preview") {
      playClick();
      setInput("");
      setPreviewIdx(0);
      setPhase("preview");
      return;
    }

    const output = processCommand(cmd);
    addTerminal([`[root@archiso ~]# ${cmd}`, ...output]);
    setInput("");
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

  function handlePreviewAdvance() {
    playClick();
    if (previewIdx < PREVIEW_STEPS.length - 1) {
      setPreviewIdx(p => p + 1);
    } else {
      setPhase("shell");
      addTerminal(["Preview complete. Type 'archinstall' to begin installation."]);
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

  // ─── Shell ───
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
            <span>ping archlinux.org • timedatectl • fdisk -l • preview • archinstall</span>
            <span className="text-[#00e676]/30">tty1</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Preview ───
  if (phase === "preview") {
    const step = PREVIEW_STEPS[previewIdx];
    return (
      <div className="mx-auto w-full max-w-5xl" style={{ height: "min(600px, 70vh)" }}>
        <div className="h-full rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden flex flex-col">
          <div className="relative flex-1">
            <img src={step.image} alt={step.title}
              className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117]/90 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{ color: accent, background: `${accent}1a`, border: `1px solid ${accent}33` }}>
                  STEP {previewIdx + 1}/{PREVIEW_STEPS.length}
                </span>
                <span className="text-sm font-bold text-white/90">{step.title}</span>
              </div>
              <p className="text-xs text-white/50">{step.description}</p>
            </div>
          </div>
          <div className="border-t border-white/10 bg-[#0a0a0a] px-4 py-2.5 flex items-center justify-between">
            <div className="flex gap-1">
              {PREVIEW_STEPS.map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full transition-colors"
                  style={{ background: i === previewIdx ? accent : "rgba(255,255,255,0.15)" }} />
              ))}
            </div>
            <button onClick={handlePreviewAdvance}
              className="rounded-lg px-5 py-1.5 text-xs font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: accent }}>
              {previewIdx < PREVIEW_STEPS.length - 1 ? "Next →" : "Back to shell"}
            </button>
          </div>
          {previewIdx === PREVIEW_STEPS.length - 1 && (
            <div className="border-t border-white/5 bg-[#0a0a0a]/80 px-4 py-1.5 text-[9px] text-[#4ade80]/60 font-mono text-center">
              Preview complete — type 'archinstall' in the shell to begin installation
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Installing ───
  if (phase === "installing") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden p-4 font-mono text-xs leading-relaxed">
          <div className="text-[#4ade80] mb-2">:: Synchronizing package databases...</div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="text-[#4ade80]"> core is up to date</div>
            <div className="text-[#4ade80]"> extra is up to date</div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <div className="text-[#888] mt-2">:: Starting full system installation...</div>
          </motion.div>
          {[
            "Installing base system (linux, base, base-devel)...",
            "Installing linux-firmware...",
            "Installing grub (bootloader)...",
            "Installing NetworkManager...",
            "Installing KDE Plasma desktop...",
            "Installing SDDM display manager...",
            "Configuring system...",
            "Setting up users...",
            "Generating initramfs...",
          ].map((line, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + i * (speed === "fast" ? 0.08 : 0.2) }}
              className="text-[#c0c0c0]">  {line}</motion.div>
          ))}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.6 : 3.0 }}
            className="mt-3 text-[#4ade80] font-bold">
            ✓ Installation complete!
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: speed === "fast" ? 1.8 : 3.5 }}
            className="mt-1 h-2 w-full bg-white/10 rounded-full overflow-hidden">
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
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden p-6 font-mono text-xs leading-relaxed flex items-center justify-center">
          <div className="text-center space-y-4 bg-black/40 rounded-xl p-8" style={{ borderColor: `${accent}33`, borderWidth: 1 }}>
            <SparkleBurst trigger={true} />
            <div className="text-3xl">🏹</div>
            <h2 className="text-lg font-bold" style={{ color: accent }}>{osName} installed!</h2>
            <div className="text-[#4ade80]">✓ All packages installed</div>
            <div className="text-[#4ade80]">✓ Bootloader configured</div>
            <div className="text-[#4ade80]">✓ User account created</div>
            <p className="text-xs text-white/50 max-w-xs mx-auto mt-2">
              reboot into your new {osName} system.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
