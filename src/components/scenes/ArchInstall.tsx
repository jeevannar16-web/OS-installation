import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OSConfig } from "../../data/types";
import { playKeyClick, playClick, playSuccess } from "../shared/sounds";
import { SparkleBurst } from "../shared/InteractiveEffects";
import { useSceneAdvance } from "../shared/SceneAdvance";

type Phase = "boot" | "archinstall" | "terminal" | "done";

type TerminalLine = { text: string; kind: "input" | "output" | "error" | "success" };

type ArchStep = {
  prompt: string;
  commands: string[];
  output: TerminalLine[];
  hint: string;
  screenshot?: string;
};

const ARCH_STEPS: ArchStep[] = [
  {
    prompt: "Set keyboard keymap:",
    commands: ["loadkeys us"],
    output: [
      { text: "# loadkeys us", kind: "input" },
      { text: "keymap set to us", kind: "success" },
    ],
    hint: "Try: loadkeys us",
  },
  {
    prompt: "Verify UEFI boot mode:",
    commands: ["ls /sys/firmware/efi/efivars"],
    output: [
      { text: "# ls /sys/firmware/efi/efivars", kind: "input" },
      { text: "BootOrder-8be4df61-...", kind: "output" },
      { text: "✓ UEFI confirmed", kind: "success" },
    ],
    hint: "Try: ls /sys/firmware/efi/efivars",
  },
  {
    prompt: "Test internet connection:",
    commands: ["ping -c 3 archlinux.org"],
    output: [
      { text: "# ping -c 3 archlinux.org", kind: "input" },
      { text: "64 bytes from 95.217.163.246: time=12.3 ms", kind: "output" },
      { text: "3 packets transmitted, 0% packet loss", kind: "success" },
    ],
    hint: "Try: ping -c 3 archlinux.org",
  },
  {
    prompt: "Update system clock:",
    commands: ["timedatectl set-ntp true"],
    output: [
      { text: "# timedatectl set-ntp true", kind: "input" },
      { text: "✓ NTP synchronized: yes", kind: "success" },
    ],
    hint: "Try: timedatectl set-ntp true",
  },
  {
    prompt: "Partition the disk (EFI + swap + root):",
    commands: ["fdisk /dev/sda"],
    output: [
      { text: "# fdisk /dev/sda", kind: "input" },
      { text: "Created GPT disklabel", kind: "output" },
      { text: "Created partition 1: EFI (512M)", kind: "output" },
      { text: "Created partition 2: swap (4G)", kind: "output" },
      { text: "Created partition 3: root (rest)", kind: "output" },
      { text: "✓ 3 partitions created", kind: "success" },
    ],
    hint: "Try: fdisk /dev/sda",
  },
  {
    prompt: "Format partitions:",
    commands: ["mkfs.fat -F32 /dev/sda1", "mkfs.ext4 /dev/sda3"],
    output: [
      { text: "# mkfs.fat -F32 /dev/sda1", kind: "input" },
      { text: "✓ FAT32 formatted", kind: "success" },
      { text: "# mkfs.ext4 /dev/sda3", kind: "input" },
      { text: "✓ ext4 formatted", kind: "success" },
    ],
    hint: "Try: mkfs.fat -F32 /dev/sda1 && mkfs.ext4 /dev/sda3",
  },
  {
    prompt: "Mount partitions:",
    commands: ["swapon /dev/sda2", "mount /dev/sda3 /mnt", "mkdir -p /mnt/boot && mount /dev/sda1 /mnt/boot"],
    output: [
      { text: "# swapon /dev/sda2 && mount /dev/sda3 /mnt", kind: "input" },
      { text: "# mkdir -p /mnt/boot && mount /dev/sda1 /mnt/boot", kind: "input" },
      { text: "✓ Partitions mounted", kind: "success" },
    ],
    hint: "Try: swapon /dev/sda2 && mount /dev/sda3 /mnt",
  },
  {
    prompt: "Install base system with pacstrap:",
    commands: ["pacstrap /mnt base linux linux-firmware"],
    output: [
      { text: "# pacstrap /mnt base linux linux-firmware", kind: "input" },
      { text: ":: Synchronizing package databases...", kind: "output" },
      { text: "Packages (142) — Total Download Size: 2145.3 MiB", kind: "output" },
      { text: "✓ Base system installed", kind: "success" },
    ],
    hint: "Try: pacstrap /mnt base linux linux-firmware",
  },
  {
    prompt: "Generate fstab:",
    commands: ["genfstab -U /mnt >> /mnt/etc/fstab"],
    output: [
      { text: "# genfstab -U /mnt >> /mnt/etc/fstab", kind: "input" },
      { text: "✓ fstab generated", kind: "success" },
    ],
    hint: "Try: genfstab -U /mnt >> /mnt/etc/fstab",
  },
  {
    prompt: "Chroot into new system:",
    commands: ["arch-chroot /mnt"],
    output: [
      { text: "# arch-chroot /mnt", kind: "input" },
      { text: "[root@archlinux /]#", kind: "output" },
      { text: "✓ Entered chroot", kind: "success" },
    ],
    hint: "Try: arch-chroot /mnt",
  },
  {
    prompt: "Set timezone and locale:",
    commands: ["ln -sf /usr/share/zoneinfo/UTC /etc/localtime", "hwclock --systohc", "locale-gen"],
    output: [
      { text: "# ln -sf /usr/share/zoneinfo/UTC /etc/localtime", kind: "input" },
      { text: "# hwclock --systohc", kind: "input" },
      { text: "# locale-gen", kind: "input" },
      { text: "✓ Timezone and locale configured", kind: "success" },
    ],
    hint: "Try: ln -sf /usr/share/zoneinfo/UTC /etc/localtime && locale-gen",
  },
  {
    prompt: "Set hostname and root password:",
    commands: ["echo archlinux > /etc/hostname", "passwd"],
    output: [
      { text: "# echo archlinux > /etc/hostname", kind: "input" },
      { text: "# passwd", kind: "input" },
      { text: "passwd: password updated successfully", kind: "success" },
    ],
    hint: "Try: echo archlinux > /etc/hostname && passwd",
  },
  {
    prompt: "Install and configure GRUB:",
    commands: ["grub-install --target=x86_64-efi --efi-directory=/boot", "grub-mkconfig -o /boot/grub/grub.cfg"],
    output: [
      { text: "# grub-install --target=x86_64-efi --efi-directory=/boot", kind: "input" },
      { text: "Installation finished. No error reported.", kind: "output" },
      { text: "# grub-mkconfig -o /boot/grub/grub.cfg", kind: "input" },
      { text: "✓ GRUB bootloader installed", kind: "success" },
    ],
    hint: "Try: grub-install --target=x86_64-efi --efi-directory=/boot",
  },
  {
    prompt: "Generate initramfs and reboot:",
    commands: ["mkinitcpio -P", "exit", "umount -R /mnt", "reboot"],
    output: [
      { text: "# mkinitcpio -P", kind: "input" },
      { text: "==> Image generation successful", kind: "output" },
      { text: "# exit", kind: "input" },
      { text: "# umount -R /mnt && reboot", kind: "input" },
      { text: "✓ Rebooting into Arch Linux...", kind: "success" },
    ],
    hint: "Try: mkinitcpio -P && exit && umount -R /mnt && reboot",
  },
];

export default function ArchInstall({
  config: _config,
  speed,
  onComplete,
}: {
  config: OSConfig;
  speed: "normal" | "fast";
  onComplete: () => void;
}) {
  const { register: registerAdvance } = useSceneAdvance();
  const [phase, setPhase] = useState<Phase>("boot");
  const [stepIdx, setStepIdx] = useState(0);
  const [lines, setLines] = useState<TerminalLine[]>([
    { text: "Welcome to Arch Linux (archlinux-2024.07.01-x86_64.iso)", kind: "output" },
    { text: "archlinux login: root", kind: "output" },
    { text: "", kind: "output" },
    { text: "Type each command or click Auto-complete.", kind: "output" },
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
    if (phase === "terminal") registerAdvance(() => onComplete());
  }, [phase, registerAdvance, onComplete]);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [lines]);

  useEffect(() => {
    if (phase === "terminal" && !isComplete && !isProcessing) inputRef.current?.focus();
  }, [phase, stepIdx, isComplete, isProcessing]);

  useEffect(() => {
    if (phase === "terminal" && currentStep) {
      const timer = setTimeout(() => setHintVisible(true), speed === "fast" ? 2000 : 8000);
      setHintTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [stepIdx, phase, currentStep, speed]);

  useEffect(() => {
    if (isComplete && phase === "terminal") {
      const timer = setTimeout(() => setPhase("done"), speed === "fast" ? 500 : 1500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, phase, speed]);

  useEffect(() => {
    if (phase === "done") {
      const timer = setTimeout(() => onComplete(), speed === "fast" ? 1000 : 2500);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete, speed]);

  function handleNext() {
    if (phase === "done") { playSuccess(); onComplete(); return; }
    if (phase === "boot") { playClick(); setPhase("archinstall"); return; }
    if (phase === "archinstall") { playClick(); setPhase("terminal"); return; }
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Enter" && phase !== "terminal") { e.preventDefault(); handleNext(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleSubmit = useCallback(() => {
    if (!currentStep || isProcessing) return;
    const cmd = inputValue.trim();
    if (!cmd) return;
    setIsProcessing(true);
    playClick();
    const isCorrect = currentStep.commands.some((c) => cmd.toLowerCase() === c.toLowerCase());
    if (isCorrect) {
      setLines((prev) => [...prev, { text: `$ ${cmd}`, kind: "input" }, ...currentStep.output.slice(1)]);
      if (hintTimer) clearTimeout(hintTimer);
      setHintVisible(false);
      setTimeout(() => { setStepIdx((p) => p + 1); setCompletedSteps((p) => p + 1); setInputValue(""); setIsProcessing(false); }, speed === "fast" ? 200 : 500);
    } else {
      setLines((prev) => [...prev, { text: `$ ${cmd}`, kind: "input" }, { text: `bash: ${cmd.split(" ")[0]}: command not found`, kind: "error" }, { text: `Hint: ${currentStep.hint}`, kind: "error" }]);
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
    setTimeout(() => { setStepIdx((p) => p + 1); setCompletedSteps((p) => p + 1); setInputValue(""); }, speed === "fast" ? 200 : 500);
  }, [currentStep, isProcessing, hintTimer, speed]);

  /* ═══════════════════════════════════════════════════════════════
     BOOT — Arch Linux boot menu screenshot
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "boot") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black">
          <img src="/images/arch/07-boot-menu.png" alt="Arch Linux boot menu"
            className="absolute inset-0 w-full h-full object-contain bg-[#111]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/60 to-transparent pt-24 pb-4 px-6 flex items-end">
            <div className="max-w-md mx-auto space-y-3 text-center w-full">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <p className="text-xs text-white/50 mb-3">
                  Select <strong className="text-white/80">Boot Arch Linux (x86_64)</strong> and press Enter
                </p>
                <button onClick={() => { playClick(); setPhase("archinstall"); }}
                  className="rounded-lg bg-[#1793D1] px-6 py-3 text-sm font-bold text-white hover:bg-[#1380b8] transition-all hover:scale-[1.02] shadow-lg shadow-[#1793D1]/30">
                  Boot Arch Linux →
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     ARCHINSTALL — Use archinstall guided installer screenshot
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "archinstall") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black">
          <img src="/images/arch/09-archinstall-menu.png" alt="archinstall guided installer"
            className="absolute inset-0 w-full h-full object-contain bg-[#111]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#12121a]/95 via-[#12121a]/60 to-transparent pt-24 pb-4 px-6 flex items-end">
            <div className="max-w-md mx-auto space-y-3 text-center w-full">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <p className="text-xs text-white/50 mb-1">
                  The <strong className="text-[#1793D1]">archinstall</strong> guided installer simplifies the process.
                </p>
                <p className="text-[10px] text-white/30 mb-3">
                  Configure language, mirrors, disk, users, and desktop — or use the terminal for manual control.
                </p>
                <button onClick={() => { playClick(); setPhase("terminal"); }}
                  className="rounded-lg bg-[#1793D1] px-6 py-3 text-sm font-bold text-white hover:bg-[#1380b8] transition-all hover:scale-[1.02] shadow-lg shadow-[#1793D1]/30">
                  Open Terminal →
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     DONE — Installation complete
     ═══════════════════════════════════════════════════════════════ */
  if (phase === "done") {
    return (
      <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
        <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-[#111]">
          <img src="/images/arch/16-install-complete.png" alt="Arch Linux install complete"
            className="absolute inset-0 w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 bg-black/60 backdrop-blur-sm rounded-2xl p-8 border border-[#1793D1]/20">
              <SparkleBurst trigger={true} />
              <div className="text-3xl">🏹</div>
              <h2 className="text-lg font-bold text-[#1793D1]">Arch Linux installed!</h2>
              <p className="text-xs text-white/50 max-w-xs mx-auto">
                You completed the manual terminal install. That's the Arch way.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     TERMINAL — Manual Arch install with real screenshot backgrounds
     ═══════════════════════════════════════════════════════════════ */
  const TERMINAL_BG = "/images/arch/08-live-login.png";

  return (
    <div className="mx-auto w-full max-w-5xl flex flex-col" style={{ height: "min(600px, 70vh)" }}>
      <div className="flex-1 relative overflow-hidden rounded-t-2xl border border-white/10 border-b-0 bg-black">
        {/* Real screenshot background */}
        <img src={TERMINAL_BG} alt="Arch Linux live environment"
          className="absolute inset-0 w-full h-full object-contain opacity-20" />

        {/* Terminal overlay */}
        <div className="absolute inset-0 flex flex-col">
          {/* Progress bar */}
          <div className="flex items-center gap-3 px-4 pt-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full rounded-full bg-[#1793D1]"
                animate={{ width: `${(completedSteps / ARCH_STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }} />
            </div>
            <span className="text-[10px] text-white/40 font-mono">{completedSteps}/{ARCH_STEPS.length}</span>
          </div>

          {/* Prompt */}
          {currentStep && (
            <motion.div key={stepIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mx-4 mt-2 rounded-lg border border-[#1793D1]/20 bg-[#1793D1]/5 px-4 py-2 text-xs text-white/70">
              <span className="text-[#1793D1] mr-2">→</span>{currentStep.prompt}
            </motion.div>
          )}

          {/* Terminal body */}
          <div ref={terminalRef} className="flex-1 overflow-y-auto mx-4 mt-2 mb-1 rounded-xl border border-white/10 bg-[#0c0c0c]/95 backdrop-blur-sm p-4 font-mono text-sm leading-relaxed">
            <AnimatePresence>
              {lines.map((line, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1 }}
                  className={`whitespace-pre-wrap ${
                    line.kind === "input" ? "text-white/90" : line.kind === "error" ? "text-red-400" : line.kind === "success" ? "text-emerald-400" : "text-white/50"
                  }`}>{line.text}</motion.div>
              ))}
            </AnimatePresence>
            {!isComplete && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/90">$</span>
                <input ref={inputRef} type="text" value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); playKeyClick(); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  disabled={isProcessing}
                  className="flex-1 bg-transparent text-white/90 outline-none font-mono text-sm placeholder:text-white/20"
                  placeholder={isProcessing ? "" : "Type command and press Enter..."}
                  autoComplete="off" spellCheck={false} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between border-t border-white/10 bg-[#1a1a24] px-4 py-2 rounded-b-2xl shrink-0">
        <div className="text-[10px] text-white/30 flex-1">
          {hintVisible && currentStep && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400/70">
              💡 {currentStep.hint}
            </motion.span>
          )}
        </div>
        <button onClick={handleAutoComplete} disabled={isProcessing}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/50 hover:text-white hover:bg-white/10 transition-colors">
          ⏩ Auto-complete
        </button>
      </div>
    </div>
  );
}
