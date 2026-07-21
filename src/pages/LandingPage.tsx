import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, ArrowLeftRight, Usb, ChevronDown, ExternalLink, Play, Check, BookOpen } from "lucide-react";
import { OS_LIST } from "../data";
import Footer from "../components/Footer";
import BootSequence from "../components/BootSequence";
import ThemePicker from "../components/shared/ThemePicker";
import OsIcon from "../components/shared/OsIcon";

/* ═══════════════════════════════════════════════════════════════════
   TYPING EFFECT
   ═══════════════════════════════════════════════════════════════════ */
const TYPING_TEXTS = [
  "before you actually do it",
  "without risking your PC",
  "step-by-step",
];

function TypingEffect() {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    const currentText = TYPING_TEXTS[textIndex];
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setText(currentText.slice(0, charIndex + 1));
          setCharIndex((p) => p + 1);
        } else setTimeout(() => setIsDeleting(true), 2000);
      } else {
        if (charIndex > 0) {
          setText(currentText.slice(0, charIndex - 1));
          setCharIndex((p) => p - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((p) => (p + 1) % TYPING_TEXTS.length);
        }
      }
    }, isDeleting ? 30 : 50);
    return () => clearTimeout(timer);
  }, [textIndex, charIndex, isDeleting]);

  return (
    <span className="text-white/40 font-medium inline-block min-w-[140px]">
      {text}
      <span className="inline-block w-0.5 h-[0.9em] bg-white/50 ml-0.5 align-middle animate-pulse" />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HOW IT WORKS — dropdown in header
   ═══════════════════════════════════════════════════════════════════ */
const GUIDE_STEPS: Record<string, { step: string; title: string; desc: string; img: string }[]> = {
  ubuntu: [
    { step: "01", title: "Download the ISO", desc: "Get the Ubuntu 24.04 LTS desktop image from ubuntu.com", img: "/images/ubuntu/02-language.png" },
    { step: "02", title: "Flash to USB", desc: "Use Rufus, Ventoy, or BalenaEtcher to write the ISO to a USB drive", img: "/images/ubuntu/04-network.webp" },
    { step: "03", title: "Boot from USB", desc: "Enter BIOS, set USB as first boot device, save & restart", img: "/images/ubuntu/01-try-or-install.png" },
    { step: "04", title: "Install Ubuntu", desc: "Follow the installer wizard — language, partition, user, done", img: "/images/ubuntu/07-install-type.webp" },
  ],
  arch: [
    { step: "01", title: "Download the ISO", desc: "Get the latest Arch Linux image from archlinux.org/download", img: "/images/arch/07-boot-menu.png" },
    { step: "02", title: "Flash to USB", desc: "Use Rufus, Ventoy, or dd to write the ISO to a USB drive", img: "/images/arch/07-boot-menu.png" },
    { step: "03", title: "Boot from USB", desc: "Enter BIOS, set USB as first boot device, save & restart", img: "/images/arch/07-boot-menu.png" },
    { step: "04", title: "Install Arch", desc: "Run archinstall and follow the guided installer", img: "/images/arch/09-archinstall-menu.png" },
  ],
  windows: [
    { step: "01", title: "Download the ISO", desc: "Get Windows 11 from microsoft.com/software-download", img: "/images/win11-setup/01-setup-language.webp" },
    { step: "02", title: "Flash to USB", desc: "Use Rufus or Microsoft Media Creation Tool", img: "/images/win11-setup/01-setup-language.webp" },
    { step: "03", title: "Boot from USB", desc: "Enter BIOS, set USB as first boot device, save & restart", img: "/images/win11-setup/03-install-option.webp" },
    { step: "04", title: "Install Windows", desc: "Follow the setup wizard — language, partition, account, done", img: "/images/win11-setup/05-choose-edition.webp" },
  ],
  zorin: [
    { step: "01", title: "Download the ISO", desc: "Get Zorin OS Core from zorin.com os/download", img: "/images/zorin/02-live-desktop.png" },
    { step: "02", title: "Flash to USB", desc: "Use Rufus, Ventoy, or BalenaEtcher to write the ISO to a USB drive", img: "/images/zorin/02-live-desktop.png" },
    { step: "03", title: "Boot from USB", desc: "Enter BIOS, set USB as first boot device, save & restart", img: "/images/zorin/03-installer-welcome.png" },
    { step: "04", title: "Install Zorin OS", desc: "Follow the installer wizard — language, partition, user, done", img: "/images/zorin/11-installer.png" },
  ],
  mint: [
    { step: "01", title: "Download the ISO", desc: "Get Linux Mint from linuxmint.com/download", img: "/images/mint/02-live-desktop.png" },
    { step: "02", title: "Flash to USB", desc: "Use Rufus, Ventoy, or BalenaEtcher to write the ISO to a USB drive", img: "/images/mint/02-live-desktop.png" },
    { step: "03", title: "Boot from USB", desc: "Enter BIOS, set USB as first boot device, save & restart", img: "/images/mint/01-grub-boot.png" },
    { step: "04", title: "Install Linux Mint", desc: "Follow the installer wizard — language, partition, user, done", img: "/images/mint/06-installation-type.png" },
  ],
};

function HowItWorksDropdown({ open, osId }: { open: boolean; osId: string }) {
  if (!open) return null;
  const steps = GUIDE_STEPS[osId] || GUIDE_STEPS.ubuntu;
  const os = OS_LIST.find((o) => o.id === osId);
  const accent = os?.branding.accent || "#E95420";
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute top-full right-0 mt-2 w-[520px] max-w-[calc(100vw-3rem)] rounded-2xl border border-white/10 bg-[#12121a]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/10">
        <div className="text-xs font-semibold text-white/60 uppercase tracking-wider">How it works</div>
        <div className="text-[10px] text-white/30 mt-0.5">4 simple steps to install {os?.branding.name || "Ubuntu"}</div>
      </div>
      <div className="p-3 space-y-2">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 hover:bg-white/[0.05] transition-colors"
          >
            <div className="h-10 w-14 rounded-lg overflow-hidden bg-black/30 shrink-0 border border-white/5">
              <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold" style={{ color: accent }}>{s.step}</span>
                <span className="text-xs font-semibold text-white/80">{s.title}</span>
              </div>
              <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-white/10 text-[10px] text-white/25 text-center">
        Each step is a fully interactive mini-simulation
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   OUTCOME CARDS — ways to install an OS
   ═══════════════════════════════════════════════════════════════════ */
type Outcome = "live-usb" | "dual-boot" | "vm" | "practical";
type SelectedOS = "ubuntu" | "arch" | "windows" | "zorin" | "mint" | "fedora" | "debian";

interface OutcomeInfo {
  id: Outcome;
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  steps: string[];
  time: string;
  risk: string;
  sceneCount: number;
}

const OS_OUTCOMES: Record<SelectedOS, OutcomeInfo[]> = {
  ubuntu: [
    {
      id: "live-usb",
      title: "Try Ubuntu Live",
      tagline: "No install needed",
      description: "Boot from USB into a full Ubuntu desktop. Try it without touching your hard drive.",
      icon: <Usb size={22} strokeWidth={1.5} />,
      accent: "#22c55e",
      steps: ["Download ISO", "Flash USB", "Boot from USB", "Try Ubuntu"],
      time: "~5 min",
      risk: "Zero risk",
      sceneCount: 11,
    },
    {
      id: "dual-boot",
      title: "Dual Boot",
      tagline: "Ubuntu + Windows",
      description: "Install Ubuntu alongside Windows. Choose which OS to boot each time you start your PC.",
      icon: <ArrowLeftRight size={22} strokeWidth={1.5} />,
      accent: "#E95420",
      steps: ["Download ISO", "Flash USB", "BIOS Setup", "Install Ubuntu", "GRUB Menu"],
      time: "~15 min",
      risk: "Low risk",
      sceneCount: 14,
    },
    {
      id: "vm",
      title: "Virtual Machine",
      tagline: "Safest option",
      description: "Run Ubuntu inside a virtual machine on your current OS. Completely isolated, zero risk.",
      icon: <Monitor size={22} strokeWidth={1.5} />,
      accent: "#6366f1",
      steps: ["Download ISO", "Create VM", "Boot VM", "Install Ubuntu"],
      time: "~10 min",
      risk: "Zero risk",
      sceneCount: 10,
    },
    {
      id: "practical",
      title: "Practical Guide",
      tagline: "Real install on your PC",
      description: "Step-by-step guide with real terminal commands you can follow on your actual hardware.",
      icon: <BookOpen size={22} strokeWidth={1.5} />,
      accent: "#f59e0b",
      steps: ["Download", "Flash USB", "Boot", "Follow guide"],
      time: "~15 min",
      risk: "Real install",
      sceneCount: 0,
    },
  ],
  arch: [
    {
      id: "vm",
      title: "Virtual Machine",
      tagline: "Safest first try",
      description: "Install Arch Linux in VirtualBox using the archinstall guided wizard. No risk to your real files.",
      icon: <Monitor size={22} strokeWidth={1.5} />,
      accent: "#1793D1",
      steps: ["Download ISO", "Create VM", "Boot Arch", "archinstall", "Done"],
      time: "~10 min",
      risk: "Zero risk",
      sceneCount: 10,
    },
    {
      id: "dual-boot",
      title: "Dual Boot",
      tagline: "Arch + Windows",
      description: "Install Arch alongside Windows using archinstall. GRUB bootloader auto-detects both OSes.",
      icon: <ArrowLeftRight size={22} strokeWidth={1.5} />,
      accent: "#1793D1",
      steps: ["Download ISO", "Flash USB", "BIOS Setup", "archinstall", "GRUB"],
      time: "~15 min",
      risk: "Low risk",
      sceneCount: 12,
    },
    {
      id: "live-usb",
      title: "Live USB",
      tagline: "Try it first",
      description: "Boot from a USB stick into the Arch live environment. Explore without installing.",
      icon: <Usb size={22} strokeWidth={1.5} />,
      accent: "#22c55e",
      steps: ["Download ISO", "Flash USB", "Boot from USB", "Live Env"],
      time: "~5 min",
      risk: "Zero risk",
      sceneCount: 8,
    },
    {
      id: "practical",
      title: "Practical Guide",
      tagline: "Real install on your PC",
      description: "Step-by-step guide with real archinstall commands you can follow on your actual hardware.",
      icon: <BookOpen size={22} strokeWidth={1.5} />,
      accent: "#f59e0b",
      steps: ["Download", "Flash USB", "Boot", "Follow guide"],
      time: "~15 min",
      risk: "Real install",
      sceneCount: 0,
    },
  ],
  windows: [
    {
      id: "vm",
      title: "Virtual Machine",
      tagline: "Safest first try",
      description: "Run Windows 11 inside VirtualBox with TPM 2.0 and Secure Boot. No risk to your real files.",
      icon: <Monitor size={22} strokeWidth={1.5} />,
      accent: "#0078d4",
      steps: ["Download ISO", "Create VM", "Enable TPM", "Install", "OOBE"],
      time: "~15 min",
      risk: "Zero risk",
      sceneCount: 12,
    },
    {
      id: "dual-boot",
      title: "Clean Install",
      tagline: "Replace or alongside",
      description: "Install Windows 11 from a bootable USB. Partition your disk and set up from scratch.",
      icon: <ArrowLeftRight size={22} strokeWidth={1.5} />,
      accent: "#0078d4",
      steps: ["Download ISO", "Flash USB", "BIOS Setup", "Windows Setup", "OOBE"],
      time: "~20 min",
      risk: "Low risk",
      sceneCount: 14,
    },
    {
      id: "live-usb",
      title: "Dual Boot",
      tagline: "Windows + Linux",
      description: "Install Windows alongside Linux. Shrink your Linux partition and install Windows side by side.",
      icon: <Usb size={22} strokeWidth={1.5} />,
      accent: "#22c55e",
      steps: ["Download ISO", "Flash USB", "BIOS Setup", "Partition", "Install"],
      time: "~20 min",
      risk: "Low risk",
      sceneCount: 14,
    },
    {
      id: "practical",
      title: "Practical Guide",
      tagline: "Real install on your PC",
      description: "Step-by-step guide with real Windows 11 installation commands and steps you can follow.",
      icon: <BookOpen size={22} strokeWidth={1.5} />,
      accent: "#f59e0b",
      steps: ["Download", "Flash USB", "Boot", "Follow guide"],
      time: "~20 min",
      risk: "Real install",
      sceneCount: 0,
    },
  ],
  zorin: [
    {
      id: "vm",
      title: "Virtual Machine",
      tagline: "Safest first try",
      description: "Run Zorin OS inside VirtualBox — no risk to your real files. Perfect for a first rehearsal.",
      icon: <Monitor size={22} strokeWidth={1.5} />,
      accent: "#15A66E",
      steps: ["Download ISO", "Create VM", "Boot VM", "Install Zorin"],
      time: "~10 min",
      risk: "Zero risk",
      sceneCount: 10,
    },
    {
      id: "dual-boot",
      title: "Dual Boot",
      tagline: "Zorin + Windows",
      description: "Install Zorin OS alongside Windows. Choose which OS to boot each time you start your PC.",
      icon: <ArrowLeftRight size={22} strokeWidth={1.5} />,
      accent: "#15A66E",
      steps: ["Download ISO", "Flash USB", "BIOS Setup", "Install Zorin", "GRUB Menu"],
      time: "~15 min",
      risk: "Low risk",
      sceneCount: 14,
    },
    {
      id: "live-usb",
      title: "Try Zorin Live",
      tagline: "No install needed",
      description: "Boot from USB into a full Zorin OS desktop. Try it without touching your hard drive.",
      icon: <Usb size={22} strokeWidth={1.5} />,
      accent: "#22c55e",
      steps: ["Download ISO", "Flash USB", "Boot from USB", "Try Zorin"],
      time: "~5 min",
      risk: "Zero risk",
      sceneCount: 11,
    },
    {
      id: "practical",
      title: "Practical Guide",
      tagline: "Real install on your PC",
      description: "Step-by-step guide with real terminal commands for an actual installation on your hardware.",
      icon: <BookOpen size={22} strokeWidth={1.5} />,
      accent: "#f59e0b",
      steps: ["Download", "Flash USB", "Boot", "Follow guide"],
      time: "~15 min",
      risk: "Real install",
      sceneCount: 0,
    },
  ],
  mint: [
    {
      id: "vm",
      title: "Virtual Machine",
      tagline: "Safest first try",
      description: "Run Linux Mint inside VirtualBox — no risk to your real files. Perfect for a first rehearsal.",
      icon: <Monitor size={22} strokeWidth={1.5} />,
      accent: "#88C999",
      steps: ["Download ISO", "Create VM", "Boot VM", "Install Mint"],
      time: "~10 min",
      risk: "Zero risk",
      sceneCount: 10,
    },
    {
      id: "dual-boot",
      title: "Dual Boot",
      tagline: "Mint + Windows",
      description: "Install Linux Mint alongside Windows. Choose which OS to boot each time you start your PC.",
      icon: <ArrowLeftRight size={22} strokeWidth={1.5} />,
      accent: "#88C999",
      steps: ["Download ISO", "Flash USB", "BIOS Setup", "Install Mint", "GRUB Menu"],
      time: "~15 min",
      risk: "Low risk",
      sceneCount: 14,
    },
    {
      id: "live-usb",
      title: "Try Mint Live",
      tagline: "No install needed",
      description: "Boot from USB into a full Linux Mint desktop. Try it without touching your hard drive.",
      icon: <Usb size={22} strokeWidth={1.5} />,
      accent: "#22c55e",
      steps: ["Download ISO", "Flash USB", "Boot from USB", "Try Mint"],
      time: "~5 min",
      risk: "Zero risk",
      sceneCount: 11,
    },
    {
      id: "practical",
      title: "Practical Guide",
      tagline: "Real install on your PC",
      description: "Step-by-step guide with real terminal commands for an actual installation on your hardware.",
      icon: <BookOpen size={22} strokeWidth={1.5} />,
      accent: "#f59e0b",
      steps: ["Download", "Flash USB", "Boot", "Follow guide"],
      time: "~15 min",
      risk: "Real install",
      sceneCount: 0,
    },
  ],
  fedora: [
    {
      id: "vm",
      title: "Virtual Machine",
      tagline: "Safest first try",
      description: "Run Fedora Workstation inside VirtualBox — no risk to your real files. Perfect for a first rehearsal.",
      icon: <Monitor size={22} strokeWidth={1.5} />,
      accent: "#3C6EB4",
      steps: ["Download ISO", "Create VM", "Boot VM", "Install Fedora"],
      time: "~10 min",
      risk: "Zero risk",
      sceneCount: 10,
    },
    {
      id: "dual-boot",
      title: "Dual Boot",
      tagline: "Fedora + Windows",
      description: "Install Fedora alongside Windows. Choose which OS to boot each time you start your PC.",
      icon: <ArrowLeftRight size={22} strokeWidth={1.5} />,
      accent: "#3C6EB4",
      steps: ["Download ISO", "Flash USB", "BIOS Setup", "Install Fedora", "GRUB Menu"],
      time: "~15 min",
      risk: "Low risk",
      sceneCount: 14,
    },
    {
      id: "live-usb",
      title: "Try Fedora Live",
      tagline: "No install needed",
      description: "Boot from USB into a full Fedora Workstation desktop. Try it without touching your hard drive.",
      icon: <Usb size={22} strokeWidth={1.5} />,
      accent: "#22c55e",
      steps: ["Download ISO", "Flash USB", "Boot from USB", "Try Fedora"],
      time: "~5 min",
      risk: "Zero risk",
      sceneCount: 11,
    },
    {
      id: "practical",
      title: "Practical Guide",
      tagline: "Real install on your PC",
      description: "Step-by-step guide with real terminal commands for an actual installation on your hardware.",
      icon: <BookOpen size={22} strokeWidth={1.5} />,
      accent: "#f59e0b",
      steps: ["Download", "Flash USB", "Boot", "Follow guide"],
      time: "~15 min",
      risk: "Real install",
      sceneCount: 0,
    },
  ],
  debian: [
    {
      id: "vm",
      title: "Virtual Machine",
      tagline: "Safest first try",
      description: "Run Debian inside VirtualBox — no risk to your real files. Perfect for a first rehearsal.",
      icon: <Monitor size={22} strokeWidth={1.5} />,
      accent: "#A80030",
      steps: ["Download ISO", "Create VM", "Boot VM", "Install Debian"],
      time: "~10 min",
      risk: "Zero risk",
      sceneCount: 10,
    },
    {
      id: "dual-boot",
      title: "Dual Boot",
      tagline: "Debian + Windows",
      description: "Install Debian alongside Windows. Choose which OS to boot each time you start your PC.",
      icon: <ArrowLeftRight size={22} strokeWidth={1.5} />,
      accent: "#A80030",
      steps: ["Download ISO", "Flash USB", "BIOS Setup", "Install Debian", "GRUB Menu"],
      time: "~15 min",
      risk: "Low risk",
      sceneCount: 14,
    },
    {
      id: "live-usb",
      title: "Try Debian Live",
      tagline: "No install needed",
      description: "Boot from USB into a full Debian desktop. Try it without touching your hard drive.",
      icon: <Usb size={22} strokeWidth={1.5} />,
      accent: "#22c55e",
      steps: ["Download ISO", "Flash USB", "Boot from USB", "Try Debian"],
      time: "~5 min",
      risk: "Zero risk",
      sceneCount: 11,
    },
    {
      id: "practical",
      title: "Practical Guide",
      tagline: "Real install on your PC",
      description: "Step-by-step guide with real terminal commands for an actual installation on your hardware.",
      icon: <BookOpen size={22} strokeWidth={1.5} />,
      accent: "#f59e0b",
      steps: ["Download", "Flash USB", "Boot", "Follow guide"],
      time: "~15 min",
      risk: "Real install",
      sceneCount: 0,
    },
  ],
};

function OutcomeCard({ outcome, selected, onSelect }: {
  outcome: OutcomeInfo;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={`relative text-left rounded-2xl border transition-all overflow-hidden ${
        selected
          ? "border-white/20 bg-white/[0.06] shadow-[0_0_40px_-12px]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
      }`}
      style={selected ? { boxShadow: `0 0 40px -12px ${outcome.accent}40` } : {}}
    >
      {/* Accent top stripe */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${outcome.accent}, transparent)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: `${outcome.accent}15`, border: `1px solid ${outcome.accent}25` }}>
              <span style={{ color: outcome.accent }}>{outcome.icon}</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white/90">{outcome.title}</div>
              <div className="text-[11px] text-white/35">{outcome.tagline}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {selected && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-5 w-5 rounded-full flex items-center justify-center" style={{ background: outcome.accent }}>
                <Check size={12} className="text-white" strokeWidth={3} />
              </motion.div>
            )}
          </div>
        </div>

        <p className="text-xs text-white/40 leading-relaxed mb-4">{outcome.description}</p>

        {/* Steps preview */}
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
          {outcome.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-1 shrink-0">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/35 border border-white/5">{step}</span>
              {i < outcome.steps.length - 1 && <span className="text-white/15 text-[8px]">→</span>}
            </div>
          ))}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] text-white/30">
          <span className="flex items-center gap-1"><span className="text-white/15">⏱</span> {outcome.time}</span>
          <span className="flex items-center gap-1"><span className="text-white/15">🛡</span> {outcome.risk}</span>
          <span className="flex items-center gap-1"><span className="text-white/15">🎬</span> {outcome.sceneCount} scenes</span>
        </div>
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Outcome | null>(null);
  const [selectedOS, setSelectedOS] = useState<SelectedOS>("ubuntu");
  const [showHelp, setShowHelp] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const [bootSkipped, setBootSkipped] = useState(() => !!sessionStorage.getItem("boot_skipped"));
  const guideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showGuide) return;
    function handleClick(e: MouseEvent) {
      if (guideRef.current && !guideRef.current.contains(e.target as Node)) setShowGuide(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showGuide]);

  useEffect(() => {
    const skip = sessionStorage.getItem("boot_skipped");
    if (skip) setBootSkipped(true);
  }, []);

  const handleBootReady = useCallback(() => {
    sessionStorage.setItem("boot_skipped", "1");
    setBootSkipped(true);
  }, []);

  const activeOS = OS_LIST.find((o) => o.id === selectedOS);
  const outcomes = OS_OUTCOMES[selectedOS];

  /* ── S key skips landing page ── */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "s" || e.key === "S") {
        if ((e.target as HTMLElement).closest("input, textarea, [contenteditable]")) return;
        e.preventDefault();
        const os = selectedOS;
        const path = selected || outcomes?.[0]?.id;
        if (path) navigate(`/${os}/${path}`);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedOS, selected, navigate, outcomes]);

  function start() {
    if (!selected || !activeOS) return;
    navigate(`/${selectedOS}/${selected}`);
  }

  function switchOS(osId: SelectedOS) {
    setSelectedOS(osId);
    setSelected(null);
  }

  return (
    <div className="min-h-full flex flex-col relative overflow-hidden">
      {!bootSkipped && <BootSequence onReady={handleBootReady} />}

      {/* Background */}
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
      </div>
      <div className="dot-grid" aria-hidden />
      <svg className="noise-overlay" aria-hidden>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
      <div className="vignette-overlay" aria-hidden />

      <div className="relative z-0 flex-1 flex flex-col">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="w-full px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.location.reload()}
              title="OS Install Simulator — click to refresh"
              className="flex items-center gap-2.5 rounded-lg hover:bg-white/5 transition-colors px-1 py-0.5 cursor-pointer"
            >
              <img src="/logo.png" alt="OS Install Simulator" className="h-9 w-auto" />
              <span className="font-semibold text-sm text-white/80 tracking-tight">OS Install Simulator</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* How it works — dropdown */}
            <div className="relative" ref={guideRef}>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-1.5 rounded-md bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] text-white/45 hover:bg-white/10 hover:text-white/65 transition-colors"
              >
                How it works
                <ChevronDown size={12} className={`transition-transform ${showGuide ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                <HowItWorksDropdown open={showGuide} osId={selectedOS} />
              </AnimatePresence>
            </div>
            <button
              onClick={() => setShowHelp(true)}
              className="rounded-md bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] text-white/45 hover:bg-white/10 hover:text-white/65 transition-colors"
            >
              Shortcuts
            </button>
            <ThemePicker />
          </div>
        </header>

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="w-full px-6 pt-8 pb-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* OS badge — dynamic */}
            <motion.div
              key={selectedOS}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-5"
              style={{ background: `${activeOS?.branding.accent}10`, borderColor: `${activeOS?.branding.accent}20` }}
            >
              <div className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: activeOS?.branding.accent }}>
                {activeOS && <OsIcon osId={activeOS.id} accent={activeOS.branding.accent} img={activeOS.branding.logoImg} size={20} />}
              </div>
              <span className="text-[11px] font-semibold" style={{ color: activeOS?.branding.accent }}>
                {activeOS?.branding.name}
              </span>
              <span className="text-[10px] text-white/30">•</span>
              <span className="text-[10px] text-white/30">{selectedOS === "windows" ? "Free to try" : "Free & Open Source"}</span>
            </motion.div>

            <motion.h1
              key={`h1-${selectedOS}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white/90 mb-3"
            >
              Install {activeOS?.branding.name}
              <br />
              <span className="text-white/40">before you actually do it</span>
            </motion.h1>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-sm text-white/30 mb-6">
              <TypingEffect />
            </motion.div>

            {/* CTA row — dynamic */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center justify-center gap-3">
              <a
                href={activeOS?.branding.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-xs text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors"
              >
                <ExternalLink size={12} />
                Get {activeOS?.branding.shortName}
              </a>
              <div className="text-[10px] text-white/20">or try it safe below ↓</div>
            </motion.div>
          </div>
        </section>

        {/* ── Outcome Selection — the core of the landing page ── */}
        <section className="w-full px-6 pb-8 flex-1">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Choose your path</span>
              </div>
              <p className="text-[11px] text-white/25">
                {selectedOS === "arch"
                  ? "Four ways to install Arch Linux — from practical guide to bare metal dual-boot"
                  : selectedOS === "windows"
                    ? "Four ways to install Windows 11 — from safest VM to bare metal clean install"
                    : selectedOS === "zorin"
                      ? "Four ways to install Zorin OS — from practical guide to bare metal dual-boot"
                      : selectedOS === "mint"
                        ? "Four ways to install Linux Mint — from practical guide to bare metal dual-boot"
                        : selectedOS === "fedora"
                          ? "Four ways to install Fedora Workstation — from practical guide to bare metal dual-boot"
                          : selectedOS === "debian"
                            ? "Four ways to install Debian — from practical guide to bare metal dual-boot"
                            : "Four ways to experience Ubuntu — pick one and start the simulation"}
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedOS}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                {outcomes.map((o) => (
                  <OutcomeCard
                    key={o.id}
                    outcome={o}
                    selected={selected === o.id}
                    onSelect={() => setSelected(o.id)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Start button */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-6 text-center">
              <motion.button
                whileTap={selected ? { scale: 0.97 } : {}}
                disabled={!selected}
                onClick={start}
                className={`inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-10 py-3.5 transition-all ${
                  selected
                    ? "text-white"
                    : "bg-white/[0.03] text-white/20 border border-white/[0.06] cursor-not-allowed"
                }`}
                style={selected ? { background: activeOS?.branding.accent, boxShadow: `0 0 40px -10px ${activeOS?.branding.accent}80` } : {}}
              >
                {selected ? (
                  <>
                    <Play size={16} fill="white" />
                    Start {activeOS?.branding.name} {outcomes.find((o) => o.id === selected)?.title}
                  </>
                ) : (
                  "Choose a path above to begin"
                )}
              </motion.button>
            </motion.div>

            {/* OS cards row — clickable to switch OS */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-10">
              <div className="text-center text-[10px] text-white/20 uppercase tracking-wider mb-3">Choose an operating system</div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {OS_LIST.map((o) => {
                  const isActive = o.id === selectedOS;
                  return (
                    <button
                      key={o.id}
                      onClick={() => switchOS(o.id as SelectedOS)}
                      className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 border text-xs font-medium transition-all ${
                        isActive
                          ? "border-white/25 bg-white/[0.07] shadow-lg"
                          : "border-white/[0.08] bg-white/[0.02] text-white/55 hover:border-white/[0.18] hover:bg-white/[0.05] cursor-pointer"
                      }`}
                      style={isActive ? { borderColor: `${o.branding.accent}55`, background: `${o.branding.accent}18`, color: o.branding.accent, boxShadow: `0 0 24px -8px ${o.branding.accent}80` } : {}}
                    >
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                        style={{
                          background: `${o.branding.accent}18`,
                          border: `1px solid ${o.branding.accent}30`,
                        }}
                      >
                        <OsIcon osId={o.id} accent={o.branding.accent} img={o.branding.logoImg} size={22} />
                      </div>
                      <span>{o.branding.name}</span>
                      {isActive && (
                        <span className="text-[8px] font-semibold ml-1" style={{ color: o.branding.accent }}>Active</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>

      {/* ── Help Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowHelp(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white/90">Keyboard shortcuts</h2>
                <button onClick={() => setShowHelp(false)} className="text-white/40 hover:text-white/70 text-xl">×</button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                {[
                  ["Enter", "Next step"],
                  ["Backspace", "Go back"],
                  ["N", "Scene navigator"],
                  ["B", "Speaker notes"],
                  ["S", "Speed mode"],
                  ["T", "Change theme"],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-2">
                    <kbd className="rounded bg-white/10 px-2 py-1 text-[10px] font-mono text-white/50">{key}</kbd>
                    <span className="text-white/40">{desc}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowHelp(false)}
                className="mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: activeOS?.branding.accent || "#E95420" }}>
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
