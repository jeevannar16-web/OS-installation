import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, ChevronRight, Terminal } from "lucide-react";
import type { OSConfig } from "../../data/types";
import { playClick } from "../shared/sounds";
import { useSceneAdvance } from "../shared/SceneAdvance";

/* ═══════════════════════════════════════════════════════════════════
   STEP DATA — Real commands for each OS
   ═══════════════════════════════════════════════════════════════════ */
type StepKind = "info" | "command" | "gui";

type GuideStep = {
  title: string;
  description: string;
  kind: StepKind;
  /** Shell command(s) to display */
  commands?: string[];
  /** Expected output after running */
  output?: string;
  /** For GUI steps: what to click */
  guiAction?: string;
  /** Screenshot to show */
  image?: string;
  /** Extra tips or warnings */
  tip?: string;
};

/* ─── Arch Linux — archinstall guided ─── */
const ARCH_STEPS: GuideStep[] = [
  {
    title: "Download Arch Linux ISO",
    description: "Get the latest ISO from the official Arch Linux download page. The ISO is a live environment that boots directly into a shell.",
    kind: "info",
    image: "/images/arch/01-welcome-page.png",
    tip: "Verify the checksum after downloading for security. Use 'certUtil -hashfile archlinux-*.iso SHA256' on Windows or 'sha256sum archlinux-*.iso' on Linux/macOS.",
  },
  {
    title: "Create Bootable USB",
    description: "Use Rufus (Windows), Ventoy (cross-platform), or dd (Linux/macOS) to write the ISO to a USB drive (2GB+).",
    kind: "info",
    guiAction: "Open Rufus → Device: select USB → SELECT → choose ISO → Image option: DD Image mode → START → OK",
    tip: "For Ventoy: just copy the ISO to the Ventoy partition. For dd: sudo dd if=archlinux.iso of=/dev/sdX bs=4M status=progress && sync",
  },
  {
    title: "Boot from USB",
    description: "Restart your PC, enter the BIOS/UEFI setup (F2/Del/F12), disable Secure Boot, set USB as first boot device, save & exit.",
    kind: "info",
    image: "/images/arch/07-boot-menu.png",
    tip: "On some laptops hold F12 at startup for a one-time boot menu. If USB doesn't appear, try a different USB port (USB 2.0 is more reliable).",
  },
  {
    title: "Live Environment",
    description: "The USB boots into the Arch live environment. You'll see kernel messages scrolling by, then land at a root shell prompt.",
    kind: "info",
    image: "/images/arch/02-live-env.png",
    tip: "You are automatically logged in as root. No password is needed. The prompt should show '[root@archiso ~]#'.",
  },
  {
    title: "Connect to Internet",
    description: "For WiFi, use iwctl. For Ethernet, it's usually automatic. Check with 'ip link' to find your wireless interface.",
    kind: "command",
    commands: [
      "iwctl",
      "[iwd]# device list",
      "[iwd]# station wlan0 scan",
      "[iwd]# station wlan0 get-networks",
      "[iwd]# station wlan0 connect \"YourWiFiName\"",
      "[iwd]# exit",
    ],
    output: "Connected to 'YourWiFiName' successfully",
    tip: "Replace wlan0 with your wireless interface name (wlan0, wlp2s0, etc.). Use 'ip link' to find it. For Ethernet, just plug in the cable.",
  },
  {
    title: "Verify Internet",
    description: "Ping the Arch Linux servers to confirm connectivity before proceeding.",
    kind: "command",
    commands: ["ping -c 3 archlinux.org"],
    output: "64 bytes from 95.217.163.246: icmp_seq=1 ttl=50 time=12.3 ms\n--- archlinux.org ping statistics ---\n3 packets transmitted, 0% packet loss",
  },
  {
    title: "Update System Clock",
    description: "Ensure the system clock is accurate — important for HTTPS and package verification.",
    kind: "command",
    commands: ["timedatectl"],
    output: "Local time: ...\nUniversal time: ...\nNTP service: active",
    tip: "This is usually automatic with NTP enabled. If NTP is off, run: timedatectl set-ntp true",
  },
  {
    title: "Launch archinstall",
    description: "Run the guided installer. It handles partitioning, packages, users, and configuration automatically through an interactive TUI menu.",
    kind: "gui",
    guiAction: "archinstall → (TUI menu opens with all configuration options)",
    image: "/images/arch/09-archinstall-menu.png",
    tip: "If archinstall is not found, first update mirrors: pacman -Sy archinstall",
  },
  {
    title: "Configure Locales",
    description: "Set keyboard layout and locale language from the archinstall menu.",
    kind: "gui",
    guiAction: "Locales → Keyboard layout: us (or your layout) → Locale language: en_US.UTF-8 → Back",
    image: "/images/arch/03-wizard.png",
  },
  {
    title: "Select Mirrors",
    description: "Choose a mirror region close to you for fast package downloads. Select 'Worldwide' if unsure.",
    kind: "gui",
    guiAction: "Mirrors → Select your region (e.g. United States, India, Germany) → Back",
    image: "/images/arch/04-mirror-region.png",
  },
  {
    title: "Disk Configuration",
    description: "Let archinstall handle partitioning automatically. Choose the target drive and filesystem.",
    kind: "gui",
    guiAction: "Disk configuration → Best effort → Select drive (e.g. /dev/sda or /dev/nvme0n1) → Filesystem: ext4 → Confirm",
    image: "/images/arch/06-best-effort.png",
    tip: "For dual-boot: choose your existing drive. archinstall will create partitions alongside Windows. A separate /home partition is optional but recommended.",
  },
  {
    title: "Filesystem & Swap",
    description: "Confirm filesystem choice and set up swap (zram or swap file).",
    kind: "gui",
    guiAction: "Disk configuration → Filesystem: ext4 → Swap: zram (recommended) → Confirm",
    image: "/images/arch/09-swap-zram.png",
  },
  {
    title: "Bootloader",
    description: "Select GRUB as the bootloader — it handles dual-boot detection automatically.",
    kind: "gui",
    guiAction: "Bootloader → GRUB (or systemd-boot for UEFI-only) → Back",
    tip: "GRUB is recommended for dual-boot. Use systemd-boot for UEFI-only single-boot setups.",
  },
  {
    title: "User Accounts",
    description: "Set the machine hostname, root password, and create a user account with sudo privileges.",
    kind: "gui",
    guiAction: "Hostname → archlinux → Root password: [set password] → User account → Add user → [username] → [password] → Super user: Yes → Confirm",
    image: "/images/arch/12-user-accounts.png",
  },
  {
    title: "Set Passwords",
    description: "Enter and confirm strong passwords for the root account and your user account.",
    kind: "gui",
    guiAction: "Root password → [set password] → Confirm → User password → [set password] → Confirm → Back",
    image: "/images/arch/11-user-password.png",
  },
  {
    title: "Desktop Environment",
    description: "Choose a desktop profile. KDE Plasma is the most feature-rich; GNOME is cleaner and more modern.",
    kind: "gui",
    guiAction: "Profile → Type: Desktop → KDE Plasma (or GNOME, XFCE, i3) → Graphics driver: All open source → Audio: PipeWire → Back",
    image: "/images/arch/12-desktop-profile.png",
    tip: "KDE Plasma offers the most Windows-like experience. GNOME is simpler but requires extensions for customization.",
  },
  {
    title: "Optional Repositories",
    description: "Enable the multilib repository for 32-bit packages (needed for Steam, Wine, etc.).",
    kind: "gui",
    guiAction: "Optional repositories → multilib: enable → Back",
    image: "/images/arch/05-optional-repos.png",
    tip: "Enable multilib if you plan to game or use Wine. It's not needed for basic desktop use.",
  },
  {
    title: "Select Kernels",
    description: "Choose which kernel(s) to install. linux (default) is recommended; linux-lts is more stable; linux-zen is optimized for desktop.",
    kind: "gui",
    guiAction: "Kernels → linux (default) → Optionally: linux-lts or linux-zen → Confirm",
    image: "/images/arch/10-select-kernels.png",
    tip: "Install all three if you have disk space — GRUB will let you choose at boot.",
  },
  {
    title: "Network & Additional Packages",
    description: "Use NetworkManager for WiFi/Ethernet management. Add extra packages like a web browser.",
    kind: "gui",
    guiAction: "Network configuration → NetworkManager → Back → Additional packages → firefox → Back",
    image: "/images/arch/13-network-config.png",
  },
  {
    title: "Timezone, NTP & Install",
    description: "Set your timezone, enable NTP, and start the installation.",
    kind: "gui",
    guiAction: "Timezone → Select your timezone (e.g. Asia/Kolkata, America/New_York) → NTP: True → Install → Confirm",
    image: "/images/arch/14-confirm-install.png",
    tip: "This is the point of no return. The installer will format partitions and install the base system.",
  },
  {
    title: "Installation Progress",
    description: "archinstall will now partition the disks, install the base system, configure the bootloader, and set up your desktop environment. This takes 5-15 minutes.",
    kind: "info",
    image: "/images/arch/15-install-progress.png",
    tip: "Sit back and wait. The installer will print progress for each step. Do NOT power off during installation.",
  },
  {
    title: "Installation Complete",
    description: "archinstall finishes with a summary. You can optionally chroot into the new system to make manual adjustments.",
    kind: "info",
    image: "/images/arch/16-install-complete.png",
    tip: "If GRUB didn't install properly, select 'Yes' to enter chroot, then run: grub-install && grub-mkconfig -o /boot/grub/grub.cfg",
  },
  {
    title: "Reboot into Arch",
    description: "Exit the chroot, unmount partitions, and reboot. Remove the USB drive when prompted.",
    kind: "command",
    commands: [
      "exit",
      "umount -R /mnt",
      "reboot",
    ],
    image: "/images/arch/13-reboot.png",
    tip: "Make sure to remove the USB when the system reboots, or it might boot back into the installer. If it does, just power off and remove the USB.",
  },
  {
    title: "GRUB Menu",
    description: "GRUB will show Arch Linux in the boot menu. Select it (or let it boot automatically after the timeout).",
    kind: "info",
    image: "/images/arch/17-reboot-grub.png",
    tip: "If you installed multiple kernels, GRUB will show them as separate entries. The default kernel is at the top.",
  },
  {
    title: "Login & Desktop",
    description: "Log in with the user you created during installation. The display manager (SDDM for KDE, GDM for GNOME) will start automatically.",
    kind: "info",
    image: "/images/arch/14-login.png",
    tip: "Run 'sudo pacman -Syu' after first login to update all packages. Then install your favorite apps!",
  },
];

/* ─── Dynamic installer steps — OS-aware ─── */
function getInstallerSteps(config: OSConfig): GuideStep[] {
  const os = config.branding.name;
  const short = config.branding.shortName;

  // Each OS has different image naming — map directly to actual files
  const imgs: Record<string, string> = {
    ubuntu: {
      language: "/images/ubuntu/02-language.png",
      boot: "/images/ubuntu/01-try-or-install.png",
      network: "/images/ubuntu/04-network.webp",
      installType: "/images/ubuntu/07-install-type.webp",
      createUser: "/images/ubuntu/08-create-user.webp",
      copying: "/images/ubuntu/10-progress.png",
      restart: "/images/ubuntu/11-restart.png",
      desktop: "/images/ubuntu/12-welcome-desktop.png",
    },
    mint: {
      language: "/images/mint/03-language-select.png",
      boot: "/images/mint/01-grub-boot.png",
      network: "/images/mint/04-keyboard-layout.png",
      installType: "/images/mint/06-installation-type.png",
      createUser: "/images/mint/09-user-creation.png",
      copying: "/images/mint/10-installing.png",
      restart: "/images/mint/11-install-complete.png",
      desktop: "/images/mint/13-welcome-screen.png",
    },
    zorin: {
      language: "/images/zorin/03-installer-welcome.png",
      boot: "/images/zorin/01-grub-boot-menu.png",
      network: "/images/zorin/10-welcome-menu.png",
      installType: "/images/zorin/11-installer.png",
      createUser: "/images/zorin/09-files-manager.png",
      copying: "/images/zorin/05-version-check.png",
      restart: "/images/zorin/07-apt-update.png",
      desktop: "/images/zorin/02-live-desktop.png",
    },
    windows: {
      language: "/images/win11-setup/01-setup-language.webp",
      boot: "/images/win11-setup/03-install-option.webp",
      network: "/images/win11-setup/05-choose-edition.webp",
      installType: "/images/win11-setup/07-partition-select.webp",
      createUser: "/images/win11-setup/13-oobe-account.webp",
      copying: "/images/win11-setup/08-clean-install.webp",
      restart: "/images/win11-setup/17-oobe-new-pc.webp",
      desktop: "/images/win11-setup/17-oobe-new-pc.webp",
    },
  }[config.id] || {
    language: "/images/ubuntu/02-language.png",
    boot: "/images/ubuntu/01-try-or-install.png",
    network: "/images/ubuntu/04-network.webp",
    installType: "/images/ubuntu/07-install-type.webp",
    createUser: "/images/ubuntu/08-create-user.webp",
    copying: "/images/ubuntu/10-progress.png",
    restart: "/images/ubuntu/11-restart.png",
    desktop: "/images/ubuntu/12-welcome-desktop.png",
  };

  const updateCmd = config.id === "arch" ? "sudo pacman -Syu" : "sudo apt update && sudo apt upgrade";

  return [
    {
      title: `Download ${short}`,
      description: `Get the desktop ISO from ${short.toLowerCase()}.com.`,
      kind: "info",
      image: imgs.language,
      tip: config.id === "ubuntu" ? "Choose the LTS (Long Term Support) version for stability." : undefined,
    },
    {
      title: "Create Bootable USB",
      description: `Use Rufus (Windows) or Startup Disk Creator to flash the ISO to a USB drive (4GB+).`,
      kind: "info",
      guiAction: "Open Rufus → Select ISO → GPT partition scheme → Start",
    },
    {
      title: "Boot from USB",
      description: "Restart, enter BIOS (F2/Del/F12), set USB first, save & exit.",
      kind: "info",
      image: imgs.boot,
      tip: `Select 'Try or Install ${os}' from the GRUB menu.`,
    },
    {
      title: "Language & Keyboard",
      description: "Choose your language and keyboard layout in the installer wizard.",
      kind: "gui",
      guiAction: "Select English → Continue → Keyboard: English (US) → Continue",
      image: imgs.language,
    },
    {
      title: "Network Connection",
      description: "Connect to WiFi or Ethernet. The installer will check for updates.",
      kind: "gui",
      guiAction: "Select your WiFi network → Enter password → Connect → Continue",
      image: imgs.network,
    },
    {
      title: "Installation Type",
      description: `Choose how to install ${os} on your disk.`,
      kind: "gui",
      guiAction: `Erase disk and install ${os} (clean install) — OR — Install alongside Windows (dual-boot)`,
      image: imgs.installType,
      tip: "For dual-boot, the installer will automatically shrink your Windows partition.",
    },
    {
      title: "Create User",
      description: "Set your name, computer name, username, and password.",
      kind: "gui",
      guiAction: "Your name → Computer name → Username → Password → Continue",
      image: imgs.createUser,
    },
    {
      title: "Installation Progress",
      description: `Sit back while ${os} copies files and configures the system.`,
      kind: "info",
      image: imgs.copying,
      tip: "This takes 5-15 minutes depending on your hardware.",
    },
    {
      title: "Restart",
      description: "Remove the USB when prompted, then press Enter to reboot.",
      kind: "info",
      image: imgs.restart,
      tip: `${os} will show 'Please remove the installation medium, then press Enter'.`,
    },
    {
      title: "First Boot",
      description: `Log in with the user you created. Welcome to ${os}!`,
      kind: "info",
      image: imgs.desktop,
      tip: `Run '${updateCmd}' after first boot.`,
    },
  ];
}

/* ═══════════════════════════════════════════════════════════════════
   COPY BUTTON
   ═══════════════════════════════════════════════════════════════════ */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      playClick();
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={handleCopy} className="text-white/30 hover:text-white/70 transition-colors" title="Copy">
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
export default function PracticalGuide({
  config,
  speed: _speed,
  onComplete,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [stepIdx, setStepIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const steps = config.id === "arch" ? ARCH_STEPS : getInstallerSteps(config);
  const currentStep = steps[stepIdx];
  const isLast = stepIdx >= steps.length - 1;

  useEffect(() => {
    registerAdvance(() => {
      if (isLast) onComplete();
      else setStepIdx((p) => Math.min(p + 1, steps.length - 1));
    });
  }, [isLast, registerAdvance, onComplete, steps.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIdx]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (isLast) onComplete();
        else setStepIdx((p) => Math.min(p + 1, steps.length - 1));
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        setStepIdx((p) => Math.max(p - 1, 0));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLast, onComplete, steps.length]);

  function next() {
    playClick();
    if (isLast) onComplete();
    else setStepIdx((p) => p + 1);
  }

  function prev() {
    playClick();
    setStepIdx((p) => Math.max(p - 1, 0));
  }

  const accent = config.branding.accent;
  const allCommands = currentStep.commands?.join("\n") ?? "";

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(650px, 75vh)" }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#12121a]/80 backdrop-blur-sm rounded-t-2xl shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5">
            <Terminal size={14} style={{ color: accent }} />
            <span className="text-xs font-semibold text-white/70">{config.branding.name}</span>
          </div>
          <span className="text-[10px] text-white/30">Practical Install Guide</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/30">{stepIdx + 1}/{steps.length}</span>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="px-4 py-2 bg-[#0d0d14]/60 border-b border-white/5 shrink-0">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: accent }}
            animate={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }} />
        </div>
      </div>

      {/* ── Step content ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div key={stepIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Step title */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}25` }}>
                  STEP {stepIdx + 1}
                </span>
                <span className="text-sm font-bold text-white/80">{currentStep.title}</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">{currentStep.description}</p>
            </div>

            {/* Screenshot (if any) */}
            {currentStep.image && (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
                <img src={currentStep.image} alt={currentStep.title}
                  className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}

            {/* GUI action */}
            {currentStep.guiAction && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight size={12} style={{ color: accent }} />
                  <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">What to do</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed font-mono">{currentStep.guiAction}</p>
              </div>
            )}

            {/* Terminal commands */}
            {currentStep.commands && currentStep.commands.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-[#0a0a0f] overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-[9px] text-white/30 font-mono">terminal</span>
                  <CopyButton text={allCommands} />
                </div>
                <div className="p-3 font-mono text-[11px] leading-relaxed space-y-0.5">
                  {currentStep.commands.map((cmd, i) => (
                    <div key={i} className={cmd.startsWith("#") ? "text-white/30" : "text-emerald-400/90"}>
                      {cmd}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expected output */}
            {currentStep.output && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="text-[9px] text-white/25 mb-1.5 font-mono uppercase">Expected output</div>
                <pre className="text-[10px] text-white/35 font-mono whitespace-pre-wrap leading-relaxed">{currentStep.output}</pre>
              </div>
            )}

            {/* Tip */}
            {currentStep.tip && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="text-[9px] text-amber-400/60 mb-1 font-mono uppercase">Tip</div>
                <p className="text-[11px] text-amber-400/40 leading-relaxed">{currentStep.tip}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation footer ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 bg-[#12121a]/80 backdrop-blur-sm rounded-b-2xl shrink-0">
        <button onClick={prev} disabled={stepIdx === 0}
          className={`rounded-lg border border-white/10 px-4 py-2 text-[11px] font-medium transition-all ${
            stepIdx === 0 ? "opacity-30 cursor-not-allowed" : "text-white/50 hover:text-white hover:bg-white/5"
          }`}>
          ← Previous
        </button>

        <div className="text-[10px] text-white/20">
          {isLast ? "Guide complete!" : "Press → or Enter to continue"}
        </div>

        <button onClick={next}
          className="rounded-lg px-4 py-2 text-[11px] font-bold text-white transition-all hover:brightness-110"
          style={{ background: accent }}>
          {isLast ? "✓ Done" : "Next →"}
        </button>
      </div>
    </div>
  );
}
