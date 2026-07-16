import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playKeyClick, playClick } from "../shared/sounds";
import { SparkleBurst, PulseHint } from "../shared/InteractiveEffects";

type Phase = "terminal" | "done";

type TerminalLine = { text: string; kind: "input" | "output" | "error" | "success" };

type ArchStep = {
  prompt: string;
  commands: string[];
  output: TerminalLine[];
  hint: string;
};

const ARCH_STEPS: ArchStep[] = [
  {
    prompt: "Set keyboard keymap (useful for non-US layouts). Type the loadkeys command:",
    commands: ["loadkeys us", "loadkeys uk", "loadkeys de", "loadkeys fr"],
    output: [
      { text: "# loadkeys us", kind: "input" },
      { text: "keymap set to us", kind: "success" },
    ],
    hint: "Try: loadkeys us",
  },
  {
    prompt: "Verify the boot mode is UEFI. Check the EFI variables directory exists:",
    commands: ["ls /sys/firmware/efi/efivars"],
    output: [
      { text: "# ls /sys/firmware/efi/efivars", kind: "input" },
      { text: "BootOrder-8be4df61-93ca-11d2-aa0d-00e098032b8c", kind: "output" },
      { text: "Boot0000-8be4df61-93ca-11d2-aa0d-00e098032b8c", kind: "output" },
      { text: "Boot0001-8be4df61-93ca-11d2-aa0d-00e098032b8c", kind: "output" },
      { text: "✓ UEFI boot mode confirmed — /sys/firmware/efi/efivars exists", kind: "success" },
    ],
    hint: "Try: ls /sys/firmware/efi/efivars",
  },
  {
    prompt: "Connect to the internet. Test with a ping:",
    commands: ["ping -c 3 archlinux.org"],
    output: [
      { text: "# ping -c 3 archlinux.org", kind: "input" },
      { text: "PING archlinux.org (95.217.163.246) 56(84) bytes of data.", kind: "output" },
      { text: "64 bytes from 95.217.163.246: icmp_seq=1 ttl=56 time=12.3 ms", kind: "output" },
      { text: "64 bytes from 95.217.163.246: icmp_seq=2 ttl=56 time=11.8 ms", kind: "output" },
      { text: "64 bytes from 95.217.163.246: icmp_seq=3 ttl=56 time=12.1 ms", kind: "output" },
      { text: "--- archlinux.org ping statistics ---", kind: "output" },
      { text: "3 packets transmitted, 3 received, 0% packet loss, time 2004ms", kind: "success" },
    ],
    hint: "Try: ping -c 3 archlinux.org",
  },
  {
    prompt: "Update the system clock with NTP:",
    commands: ["timedatectl set-ntp true", "timedatectl"],
    output: [
      { text: "# timedatectl set-ntp true", kind: "input" },
      { text: "# timedatectl", kind: "input" },
      { text: "               Local time: Tue 2024-07-01 14:32:07 UTC", kind: "output" },
      { text: "           Universal time: Tue 2024-07-01 14:32:07 UTC", kind: "output" },
      { text: "                 RTC time: Tue 2024-07-01 14:32:07", kind: "output" },
      { text: "                Time zone: UTC (UTC, +0000)", kind: "output" },
      { text: "System clock synchronized: yes", kind: "success" },
    ],
    hint: "Try: timedatectl set-ntp true",
  },
  {
    prompt: "Partition the disk with fdisk. Create EFI, swap, and root partitions:",
    commands: ["fdisk /dev/sda"],
    output: [
      { text: "# fdisk /dev/sda", kind: "input" },
      { text: "Welcome to fdisk (util-linux 2.39.3).", kind: "output" },
      { text: "Changes will remain in memory only, until you decide to write them.", kind: "output" },
      { text: "Command (m for help): g", kind: "output" },
      { text: "Created a new GPT disklabel", kind: "output" },
      { text: "Command: n  →  Partition 1, default, +512M  →  Type: EFI System", kind: "output" },
      { text: "Command: n  →  Partition 2, default, +4G     →  Type: Linux swap", kind: "output" },
      { text: "Command: n  →  Partition 3, default, rest    →  Type: Linux filesystem", kind: "output" },
      { text: "Command: w  →  The partition table has been altered.", kind: "output" },
      { text: "✓ Created 3 partitions: /dev/sda1 (EFI 512M), /dev/sda2 (swap 4G), /dev/sda3 (root)", kind: "success" },
    ],
    hint: "Try: fdisk /dev/sda",
  },
  {
    prompt: "Format the EFI partition as FAT32:",
    commands: ["mkfs.fat -F32 /dev/sda1"],
    output: [
      { text: "# mkfs.fat -F32 /dev/sda1", kind: "input" },
      { text: "mkfs.fat 4.2 (2021-01-31)", kind: "output" },
      { text: "✓ /dev/sda1 formatted as FAT32 (EFI)", kind: "success" },
    ],
    hint: "Try: mkfs.fat -F32 /dev/sda1",
  },
  {
    prompt: "Format the root partition as ext4:",
    commands: ["mkfs.ext4 /dev/sda3"],
    output: [
      { text: "# mkfs.ext4 /dev/sda3", kind: "input" },
      { text: "mke2fs 1.47.0 (5-Feb-2023)", kind: "output" },
      { text: "Creating filesystem with 11945984 4k blocks and 2988032 inodes", kind: "output" },
      { text: "Filesystem UUID: a1b2c3d4-e5f6-7890-abcd-ef1234567890", kind: "output" },
      { text: "✓ /dev/sda3 formatted as ext4", kind: "success" },
    ],
    hint: "Try: mkfs.ext4 /dev/sda3",
  },
  {
    prompt: "Enable swap and mount partitions:",
    commands: ["swapon /dev/sda2", "mount /dev/sda3 /mnt", "mkdir -p /mnt/boot && mount /dev/sda1 /mnt/boot"],
    output: [
      { text: "# swapon /dev/sda2", kind: "input" },
      { text: "# mount /dev/sda3 /mnt", kind: "input" },
      { text: "# mkdir -p /mnt/boot", kind: "input" },
      { text: "# mount /dev/sda1 /mnt/boot", kind: "input" },
      { text: "✓ Partitions mounted: / (ext4), /boot (EFI), swap enabled", kind: "success" },
    ],
    hint: "Try: swapon /dev/sda2 && mount /dev/sda3 /mnt && mkdir -p /mnt/boot && mount /dev/sda1 /mnt/boot",
  },
  {
    prompt: "Install the base system with pacstrap:",
    commands: ["pacstrap /mnt base linux linux-firmware", "pacstrap /mnt base linux linux-firmware nano"],
    output: [
      { text: "# pacstrap /mnt base linux linux-firmware", kind: "input" },
      { text: ":: Synchronizing package databases...", kind: "output" },
      { text: "  core                   156.2 MiB  12.3 MiB/s  00:12 [------------------] 100%", kind: "output" },
      { text: "  extra                 1823.4 MiB  14.1 MiB/s  02:09 [------------------] 100%", kind: "output" },
      { text: ":: Starting full system upgrade...", kind: "output" },
      { text: "resolving dependencies...", kind: "output" },
      { text: "looking for conflicting packages...", kind: "output" },
      { text: "Packages (142)  base-1r1  linux-6.9.7.arch1-1  linux-firmware-20240610  ...", kind: "output" },
      { text: "", kind: "output" },
      { text: "Total Download Size:   2145.3 MiB", kind: "output" },
      { text: "Installed Size:        3421.7 MiB", kind: "output" },
      { text: "", kind: "output" },
      { text: "✓ Base system installed (142 packages)", kind: "success" },
    ],
    hint: "Try: pacstrap /mnt base linux linux-firmware",
  },
  {
    prompt: "Generate an fstab file for the new system:",
    commands: ["genfstab -U /mnt >> /mnt/etc/fstab"],
    output: [
      { text: "# genfstab -U /mnt >> /mnt/etc/fstab", kind: "input" },
      { text: "✓ /mnt/etc/fstab generated", kind: "success" },
    ],
    hint: "Try: genfstab -U /mnt >> /mnt/etc/fstab",
  },
  {
    prompt: "Change root into the new system:",
    commands: ["arch-chroot /mnt"],
    output: [
      { text: "# arch-chroot /mnt", kind: "input" },
      { text: "[root@archlinux /]#", kind: "output" },
      { text: "✓ Entered new system via arch-chroot", kind: "success" },
    ],
    hint: "Try: arch-chroot /mnt",
  },
  {
    prompt: "Set the timezone to UTC:",
    commands: ["ln -sf /usr/share/zoneinfo/UTC /etc/localtime", "hwclock --systohc"],
    output: [
      { text: "# ln -sf /usr/share/zoneinfo/UTC /etc/localtime", kind: "input" },
      { text: "# hwclock --systohc", kind: "input" },
      { text: "✓ Timezone set to UTC, hardware clock synced", kind: "success" },
    ],
    hint: "Try: ln -sf /usr/share/zoneinfo/UTC /etc/localtime",
  },
  {
    prompt: "Generate locale and set hostname:",
    commands: ["echo 'en_US.UTF-8 UTF-8' >> /etc/locale.gen", "locale-gen", "echo 'archlinux' > /etc/hostname"],
    output: [
      { text: "# echo 'en_US.UTF-8 UTF-8' >> /etc/locale.gen", kind: "input" },
      { text: "# locale-gen", kind: "input" },
      { text: "Generating locales...", kind: "output" },
      { text: "  en_US.UTF-8... done", kind: "output" },
      { text: "Generation complete.", kind: "output" },
      { text: "# echo 'archlinux' > /etc/hostname", kind: "input" },
      { text: "✓ Locale generated, hostname set to 'archlinux'", kind: "success" },
    ],
    hint: "Try: echo 'en_US.UTF-8 UTF-8' >> /etc/locale.gen && locale-gen",
  },
  {
    prompt: "Set the root password:",
    commands: ["passwd", "passwd root"],
    output: [
      { text: "# passwd", kind: "input" },
      { text: "New password: ********", kind: "output" },
      { text: "Retype password: ********", kind: "output" },
      { text: "passwd: password updated successfully", kind: "success" },
    ],
    hint: "Try: passwd",
  },
  {
    prompt: "Install and configure the GRUB bootloader:",
    commands: ["grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB", "grub-mkconfig -o /boot/grub/grub.cfg"],
    output: [
      { text: "# grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB", kind: "input" },
      { text: "Installing for x86_64-efi platform.", kind: "output" },
      { text: "Installation finished. No error reported.", kind: "output" },
      { text: "# grub-mkconfig -o /boot/grub/grub.cfg", kind: "input" },
      { text: "Generating grub configuration file ...", kind: "output" },
      { text: "Found linux image: /boot/vmlinuz-linux", kind: "output" },
      { text: "Found initrd image: /boot/initramfs-linux.img", kind: "output" },
      { text: "✓ GRUB bootloader installed and configured", kind: "success" },
    ],
    hint: "Try: grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB",
  },
  {
    prompt: "Generate initramfs image:",
    commands: ["mkinitcpio -P", "mkinitcpio -P linux"],
    output: [
      { text: "# mkinitcpio -P", kind: "input" },
      { text: "==> Building image from preset: /etc/mkinitcpio.d/linux.preset: 'default'", kind: "output" },
      { text: "  -> -k /boot/vmlinuz-linux -g /boot/initramfs-linux.img", kind: "output" },
      { text: "==> Starting build: default", kind: "output" },
      { text: "  ...", kind: "output" },
      { text: "==> Image generation successful", kind: "success" },
    ],
    hint: "Try: mkinitcpio -P",
  },
  {
    prompt: "Exit chroot, unmount, and reboot:",
    commands: ["exit", "umount -R /mnt", "reboot"],
    output: [
      { text: "# exit", kind: "input" },
      { text: "$ umount -R /mnt", kind: "input" },
      { text: "$ reboot", kind: "input" },
      { text: "Rebooting into your new Arch Linux installation…", kind: "success" },
    ],
    hint: "Try: exit",
  },
];

export default function ArchInstall({
  config,
  speed,
  onComplete,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const [phase] = useState<Phase>("terminal");
  const [stepIdx, setStepIdx] = useState(0);
  const [lines, setLines] = useState<TerminalLine[]>([
    { text: "Welcome to Arch Linux (archlinux-2024.07.01-x86_64.iso)", kind: "output" },
    { text: "archlinux login: root", kind: "output" },
    { text: "", kind: "output" },
    { text: "Follow the official Installation Guide.", kind: "output" },
    { text: "Type each command and press Enter, or click Auto-complete.", kind: "output" },
    { text: "", kind: "output" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintTimer, setHintTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentStep = ARCH_STEPS[stepIdx];
  const isComplete = stepIdx >= ARCH_STEPS.length;

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (phase === "terminal" && !isComplete && !isProcessing) {
      inputRef.current?.focus();
    }
  }, [phase, stepIdx, isComplete, isProcessing]);

  useEffect(() => {
    if (phase === "terminal" && currentStep) {
      const timer = setTimeout(() => {
        setHintVisible(true);
      }, speed === "fast" ? 2000 : 8000);
      setHintTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [stepIdx, phase, currentStep, speed]);

  useEffect(() => {
    if (isComplete && phase === "terminal") {
      const timer = setTimeout(() => {
        onComplete();
      }, speed === "fast" ? 500 : 1500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, phase, onComplete, speed]);

  const handleSubmit = useCallback(() => {
    if (!currentStep || isProcessing) return;

    const cmd = inputValue.trim();
    if (!cmd) return;

    setIsProcessing(true);
    playClick();

    const isCorrect = currentStep.commands.some(
      (c) => cmd.toLowerCase() === c.toLowerCase()
    );

    if (isCorrect) {
      setLines((prev) => [
        ...prev,
        { text: `$ ${cmd}`, kind: "input" },
        ...currentStep.output.slice(1),
      ]);

      if (hintTimer) clearTimeout(hintTimer);
      setHintVisible(false);

      setTimeout(() => {
        setStepIdx((p) => p + 1);
        setCompletedSteps((p) => p + 1);
        setInputValue("");
        setIsProcessing(false);
      }, speed === "fast" ? 200 : 500);
    } else {
      setLines((prev) => [
        ...prev,
        { text: `$ ${cmd}`, kind: "input" },
        { text: `bash: ${cmd.split(" ")[0]}: command not found`, kind: "error" },
        { text: "", kind: "output" },
        { text: `Hint: ${currentStep.hint}`, kind: "error" },
      ]);
      setInputValue("");
      setIsProcessing(false);
    }
  }, [inputValue, currentStep, isProcessing, hintTimer, speed]);

  const handleAutoComplete = useCallback(() => {
    if (!currentStep || isProcessing) return;
    playClick();

    setLines((prev) => [...prev, ...currentStep.output]);

    if (hintTimer) clearTimeout(hintTimer);
    setHintVisible(false);

    setTimeout(() => {
      setStepIdx((p) => p + 1);
      setCompletedSteps((p) => p + 1);
      setInputValue("");
    }, speed === "fast" ? 200 : 500);
  }, [currentStep, isProcessing, hintTimer, speed]);

  if (phase === "done" || isComplete) {
    return (
      <>
        <SparkleBurst trigger={true} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center shadow-2xl"
        >
          <div className="text-4xl mb-4">{config.branding.logo}</div>
          <h2 className="text-lg font-bold text-emerald-300">Arch Linux installed!</h2>
          <p className="mt-2 text-sm text-white/50">
            You completed the full terminal-based install. Rebooting…
          </p>
        </motion.div>
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-4xl">
      {/* Progress bar */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: config.branding.accent }}
            animate={{ width: `${(completedSteps / ARCH_STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs text-white/40 font-mono">
          {completedSteps}/{ARCH_STEPS.length}
        </span>
      </div>

      {/* Prompt */}
      {currentStep && (
        <motion.div
          key={stepIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70"
        >
          <span className="text-white/40 mr-2">→</span>
          {currentStep.prompt}
        </motion.div>
      )}

      {/* Terminal window */}
      <div
        className="rounded-xl border border-white/10 overflow-hidden shadow-2xl"
        style={{ background: "#0c0c0c" }}
      >
        {/* Terminal title bar */}
        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 border-b border-white/10">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-white/30 font-mono">root@archlinux ~ #</span>
        </div>

        {/* Terminal body */}
        <div
          ref={terminalRef}
          className="h-80 lg:h-96 xl:h-[500px] overflow-y-auto p-4 font-mono text-sm lg:text-base leading-relaxed"
        >
          <AnimatePresence>
            {lines.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.1 }}
                className={`whitespace-pre-wrap ${
                  line.kind === "input"
                    ? "text-white/90"
                    : line.kind === "error"
                      ? "text-red-400"
                      : line.kind === "success"
                        ? "text-emerald-400"
                        : "text-white/50"
                }`}
              >
                {line.text}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Input line */}
          {!isComplete && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/90">$</span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  playKeyClick();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                disabled={isProcessing}
                className="flex-1 bg-transparent text-white/90 outline-none font-mono text-sm placeholder:text-white/20"
                placeholder={isProcessing ? "" : "Type command and press Enter..."}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-white/30">
          {hintVisible && currentStep && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-amber-400/70"
            >
              💡 {currentStep.hint}
            </motion.span>
          )}
        </div>
        <PulseHint pulse={hintVisible}>
          <button
            onClick={handleAutoComplete}
            disabled={isProcessing}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            ⏩ Auto-complete step
          </button>
        </PulseHint>
      </div>
    </div>
  );
}
