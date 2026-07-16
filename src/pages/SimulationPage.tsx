import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { motion, AnimatePresence } from "framer-motion";
import { simulationMachine, SIM_SCENES } from "../machines/simulationMachine";
import { getOS } from "../data";
import { ToastProvider } from "../components/shared/Toast";
import ErrorBoundary from "../components/shared/ErrorBoundary";
import Showcase from "../components/shared/Showcase";
import Footer from "../components/Footer";
import DesktopShell, { type AppInfo } from "../components/shell/DesktopShell";
import FakeBrowser from "../components/scenes/FakeBrowser";
import FileManager from "../components/scenes/FileManager";
import FlashUSB from "../components/scenes/FlashUSB";
import UsbReinsert from "../components/scenes/UsbReinsert";
import Reboot from "../components/scenes/Reboot";
import BootMenu from "../components/scenes/BootMenu";
import LiveWelcome from "../components/scenes/LiveWelcome";
import LiveDesktop from "../components/scenes/LiveDesktop";
import Partition from "../components/scenes/Partition";
import Install from "../components/scenes/Install";
import ArchInstall from "../components/scenes/ArchInstall";
import CreateVM from "../components/scenes/CreateVM";
import MountISO from "../components/scenes/MountISO";
import VmBoot from "../components/scenes/VmBoot";
import VmClose from "../components/scenes/VmClose";
import Done from "../components/scenes/Done";
import GrubMenu from "../components/scenes/GrubMenu";
import FirstBoot from "../components/scenes/FirstBoot";
import SelectHostOS from "../components/scenes/SelectHostOS";
import DiskManagement from "../components/scenes/DiskManagement";
import { toggleMute, isMuted } from "../components/shared/sounds";
import ThemePicker from "../components/shared/ThemePicker";
import { useTheme } from "../components/shared/ThemeProvider";
import { SceneAdvanceProvider, useSceneAdvance } from "../components/shared/SceneAdvance";

const SCENE_LABELS: Record<string, string> = {
  idle: "Start",
  select_host_os: "Host OS",
  searching: "Search & Download",
  downloading: "Locate ISO",
  flashing_usb: "Flash USB",
  usb_reinsert: "Insert USB",
  disk_prep: "Disk Prep",
  rebooting: "Reboot",
  boot_menu: "Boot Menu",
  partitioning: "Partition",
  live_welcome: "Live Welcome",
  live_desktop: "Live Desktop",
  create_vm: "Create VM",
  mount_iso: "Mount ISO",
  vm_boot: "Power On",
  installing: "Install",
  vm_close: "Close VM",
  complete: "Done",
};

const ACTIVE_APP: Record<string, AppInfo> = {
  select_host_os: { name: "Setup", icon: "⚙️" },
  searching: { name: "Browser", icon: "🌐" },
  downloading: { name: "Files", icon: "📁" },
  flashing_usb: { name: "USB Tool", icon: "🔌" },
  usb_reinsert: { name: "Setup", icon: "🔌" },
  disk_prep: { name: "Disk Management", icon: "💾" },
  rebooting: { name: "System", icon: "⏻" },
  boot_menu: { name: "Boot Menu", icon: "💻" },
  live_welcome: { name: "Installer", icon: "💿" },
  live_desktop: { name: "Live Session", icon: "🖥️" },
  partitioning: { name: "Installer", icon: "🧩" },
  create_vm: { name: "VirtualBox", icon: "💻" },
  mount_iso: { name: "VirtualBox", icon: "💿" },
  vm_boot: { name: "VirtualBox", icon: "▶" },
  installing: { name: "Installer", icon: "🧩" },
  vm_close: { name: "VirtualBox", icon: "💻" },
  complete: { name: "Done", icon: "🎉" },
};

const FULLSCREEN_SCENES = new Set(["rebooting", "boot_menu", "live_welcome", "live_desktop"]);

const STATUS_TEXT: Record<string, string> = {
  select_host_os: "Select your host operating system…",
  searching: "Searching for the official download page…",
  downloading: "Locating the ISO file in your Downloads folder…",
  flashing_usb: "Flashing the ISO image to your USB drive…",
  usb_reinsert: "Insert the USB into the target machine…",
  disk_prep: "Shrink Windows partition to create space…",
  rebooting: "Restarting and entering BIOS…",
  boot_menu: "Select a boot device from the menu…",
  live_welcome: "Choose between trying or installing…",
  live_desktop: "Exploring the live desktop environment…",
  partitioning: "Allocating disk space for the new OS…",
  create_vm: "Setting up a new virtual machine…",
  mount_iso: "Attaching the installation ISO…",
  vm_boot: "Powering on the virtual machine…",
  installing: "Installing the operating system…",
  vm_close: "Closing the virtual machine…",
  complete: "Installation complete!",
};

const VM_ONLY = new Set(["select_host_os", "create_vm", "mount_iso", "vm_boot"]);
const PHYSICAL_ONLY = new Set(["flashing_usb", "usb_reinsert", "disk_prep", "rebooting", "boot_menu"]);

const SCENE_CONTEXT: Record<string, string> = {
  searching: "Use the browser to find the official download page for your OS.",
  downloading: "Locate the ISO file you just downloaded in your file manager.",
  flashing_usb: "Write the ISO image to a USB drive using a flashing tool.",
  usb_reinsert: "Remove the USB, then plug it back into the target machine.",
  disk_prep: "Open Disk Management in Windows to shrink your partition.",
  rebooting: "Restart the computer and enter the BIOS/UEFI setup.",
  boot_menu: "Select the USB drive from the boot device menu to start the installer.",
  live_welcome: "Choose whether to try the OS live or install it directly.",
  live_desktop: "Explore the live desktop — everything runs from the USB.",
  partitioning: "Resize your existing partition and allocate space for the new OS.",
  create_vm: "Configure a new virtual machine with the right settings.",
  mount_iso: "Attach the downloaded ISO as a virtual CD/DVD drive.",
  vm_boot: "Power on the VM and boot from the attached ISO.",
  installing: "Follow the installer wizard to set up your new operating system.",
  vm_close: "Shut down the VM now that installation is complete.",
  complete: "Congratulations — your new OS is ready to use!",
};

export default function SimulationPage() {
  return (
    <SceneAdvanceProvider>
      <SimulationPageInner />
    </SceneAdvanceProvider>
  );
}

function SimulationPageInner() {
  const { os, path } = useParams();
  const config = getOS(os);
  const { cycleTheme } = useTheme();
  const { current: sceneAdvance } = useSceneAdvance();

  const [state, send] = useMachine(simulationMachine);
  const [showcase, setShowcase] = useState(() => {
    return !sessionStorage.getItem("showcase_seen");
  });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [muted, setMuted] = useState(() => isMuted());
  const [presentationMode, setPresentationMode] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sceneLabelKey, setSceneLabelKey] = useState(0);
  const [sceneLabelVisible, setSceneLabelVisible] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jumpRef = useRef<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const historyRef = useRef<string[]>([]);

  const [diskShrunk, setDiskShrunk] = useState(false);
  const [secureBoot, setSecureBoot] = useState(true);
  const [vtEnabled, setVtEnabled] = useState(false);
  const [bootOrderUSB, setBootOrderUSB] = useState(false);
  const setRufusPartitionScheme = () => {};

  const current = String(state.value);
  const speed = state.context.speed;

  const STORAGE_KEY = "os-sim-progress";

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.osId && data.path && data.state && data.state !== "idle" && data.state !== "complete") {
          if (data.osId === os && data.path === path) {
            // Machine state can't be directly restored with XState v5
          }
        }
      } catch { /* ignore corrupt data */ }
    }
  }, [os, path]);

  useEffect(() => {
    const current = String(state.value);
    console.log(`[SimPage] STATE → ${current}`);
    if (current !== "idle") {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          osId: config?.id ?? null,
          path: path,
          state: current,
          timestamp: Date.now(),
        })
      );
    }
    if (current === "complete") {
      localStorage.removeItem(STORAGE_KEY);
    }
    // Track scene history for back navigation (skip idle, duplicate last, and jump targets)
    if (current !== "idle" && current !== "complete" && !jumpRef.current) {
      const last = historyRef.current[historyRef.current.length - 1];
      if (last !== current) {
        historyRef.current.push(current);
      }
    }
  }, [state.value, config, path]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "?" || (e.key === "/" && !e.ctrlKey && !e.metaKey)) {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        e.preventDefault();
        setShowShortcuts((p) => !p);
      }
      if (e.key === "Escape") {
        setShowShortcuts(false);
      }
      if (e.key === "m" || e.key === "M") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        const now = toggleMute();
        setMuted(now);
      }
      if (e.key === "s" || e.key === "S") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        send({ type: "SET_SPEED", speed: speed === "fast" ? "normal" : "fast" });
      }
      if (e.key === "t" || e.key === "T") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        cycleTheme();
      }
      if (e.key === "Backspace") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        e.preventDefault();
        goBack();
      }
      if (e.key === "Enter") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "BUTTON")) return;
        const s = String(state.value);
        console.log("[SimPage] Enter pressed in state:", s);
        if (s === "searching") send({ type: "SEARCH_DONE" });
        else if (s === "downloading") send({ type: "DOWNLOAD_DONE" });
        else if (s === "flashing_usb") send({ type: "FLASH_DONE" });
        else if (s === "usb_reinsert") send({ type: "USB_INSERTED" });
        else if (s === "rebooting") send({ type: "REBOOT_DONE" });
        else if (s === "partitioning") send({ type: "PARTITION_DONE" });
        else if (s === "live_welcome") send({ type: "LIVE_INSTALL" });
        else if (s === "live_desktop") send({ type: "LIVE_INSTALL" });
        else if (s === "create_vm") send({ type: "VM_CREATED" });
        else if (s === "mount_iso") send({ type: "ISO_MOUNTED" });
        else if (s === "vm_boot") send({ type: "VM_POWERED_ON" });
        else if (s === "grub_menu") send({ type: "GRUB_DONE" });
        else if (s === "first_boot") send({ type: "FIRST_BOOT_DONE" });
        else if (s === "vm_close") send({ type: "VM_CLOSED" });
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [speed, send, state.value]);

  useEffect(() => {
    if (config && path && state.matches("idle")) {
      send({ type: "START", osId: config.id, path: path as never });
    }
  }, [config, path]);

  // Show scene context label when scene changes
  useEffect(() => {
    if (current === "idle" || current === "complete") {
      setSceneLabelVisible(false);
      return;
    }
    setSceneLabelKey((k) => k + 1);
    setSceneLabelVisible(true);
    const t = setTimeout(() => setSceneLabelVisible(false), 3500);
    return () => clearTimeout(t);
  }, [current]);

  // Presentation mode: auto-advance every 15 seconds (with pause support)
  useEffect(() => {
    if (presentationMode && !paused && current !== "idle" && current !== "complete") {
      autoAdvanceRef.current = setInterval(() => {
        const s = String(state.value);
        if (s === "searching") send({ type: "SEARCH_DONE" });
        else if (s === "downloading") send({ type: "DOWNLOAD_DONE" });
        else if (s === "flashing_usb") send({ type: "FLASH_DONE" });
        else if (s === "usb_reinsert") send({ type: "USB_INSERTED" });
        else if (s === "rebooting") send({ type: "REBOOT_DONE" });
        else if (s === "partitioning") send({ type: "PARTITION_DONE" });
        else if (s === "live_welcome") send({ type: "LIVE_INSTALL" });
        else if (s === "live_desktop") send({ type: "LIVE_INSTALL" });
        else if (s === "create_vm") send({ type: "VM_CREATED" });
        else if (s === "mount_iso") send({ type: "ISO_MOUNTED" });
        else if (s === "vm_boot") send({ type: "VM_POWERED_ON" });
        else if (s === "grub_menu") send({ type: "GRUB_DONE" });
        else if (s === "first_boot") send({ type: "FIRST_BOOT_DONE" });
        else if (s === "vm_close") send({ type: "VM_CLOSED" });
      }, 15000);
    }
    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [presentationMode, paused, state.value, send, current]);

  // Exit presentation mode on Escape; Space to pause/resume
  useEffect(() => {
    if (!presentationMode) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPresentationMode(false);
        setPaused(false);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
      if (e.key === "n" || e.key === "N") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        setShowNavigator((v) => !v);
        setShowNotes(false);
      }
      if (e.key === "b" || e.key === "B") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        setShowNotes((v) => !v);
        setShowNavigator(false);
      }
      if (e.key === " " || e.code === "Space") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        e.preventDefault();
        setPaused((p) => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presentationMode]);

  // Close navigator/notes on click outside
  useEffect(() => {
    if (!showNavigator && !showNotes) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-nav-panel]") && !target.closest("[data-nav-btn]")) {
        setShowNavigator(false);
        setShowNotes(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showNavigator, showNotes]);

  // ── Auto-jump: fast-forward to a target scene ──
  useEffect(() => {
    if (!jumpRef.current || !config) return;
    const target = jumpRef.current;
    const s = String(state.value);
    if (s === target) {
      jumpRef.current = null;
      return;
    }
    if (s === "idle") {
      send({ type: "START", osId: config.id, path: path as never });
      return;
    }
    // Map states to their forward-transition events
    const transitions: Record<string, string> = {
      searching: "SEARCH_DONE",
      downloading: "DOWNLOAD_DONE",
      flashing_usb: "FLASH_DONE",
      usb_reinsert: "USB_INSERTED",
      disk_prep: "DISK_PREPPED",
      rebooting: "REBOOT_DONE",
      boot_menu: "BOOT_SELECTED",
      partitioning: "PARTITION_DONE",
      live_welcome: "LIVE_INSTALL",
      live_desktop: "LIVE_INSTALL",
      create_vm: "VM_CREATED",
      mount_iso: "ISO_MOUNTED",
      vm_boot: "VM_POWERED_ON",
      installing: "INSTALL_DONE",
      vm_close: "VM_CLOSED",
    };
    const evt = transitions[s];
    if (evt) {
      // Small delay so the user sees scenes flash by
      const t = setTimeout(() => send({ type: evt as never }), 150);
      return () => clearTimeout(t);
    }
  }, [state.value, config, path, send]);

  // ── Countdown timer for presentation mode ──
  useEffect(() => {
    if (!presentationMode || paused || current === "idle" || current === "complete") {
      setCountdown(0);
      return;
    }
    const total = 15;
    setCountdown(total);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return 0;
        return c - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [presentationMode, paused, current]);

  if (!config) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-white/60">Unknown OS: {os}</p>
        <Link to="/" className="btn-ghost">
          ← Back to home
        </Link>
      </div>
    );
  }

  const currentIndex = (SIM_SCENES as readonly string[]).indexOf(current);
  const cfg = config;
  const activeApp = ACTIVE_APP[current] ?? { name: "OS Simulator", icon: "💿" };
  const isFullscreen = FULLSCREEN_SCENES.has(current);
  const isVm = path === "vm";

  function jumpToScene(target: string) {
    jumpRef.current = target;
    send({ type: "RESET" });
    setShowNavigator(false);
  }

  function goBack() {
    if (historyRef.current.length < 2) return;
    // Remove current scene from history, then jump to the previous one
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    if (prev) jumpToScene(prev);
  }

  function advanceScene() {
    const s = String(state.value);
    const transitions: Record<string, string> = {
      searching: "SEARCH_DONE",
      downloading: "DOWNLOAD_DONE",
      flashing_usb: "FLASH_DONE",
      usb_reinsert: "USB_INSERTED",
      disk_prep: "DISK_PREPPED",
      rebooting: "REBOOT_DONE",
      boot_menu: "BOOT_SELECTED",
      partitioning: "PARTITION_DONE",
      live_welcome: "LIVE_INSTALL",
      live_desktop: "LIVE_INSTALL",
      create_vm: "VM_CREATED",
      mount_iso: "ISO_MOUNTED",
      vm_boot: "VM_POWERED_ON",
      installing: "INSTALL_DONE",
      grub_menu: "GRUB_DONE",
      first_boot: "FIRST_BOOT_DONE",
      vm_close: "VM_CLOSED",
    };
    const evt = transitions[s];
    if (evt) send({ type: evt as never });
  }

  const canGoBack = historyRef.current.length >= 2;

  const SPEAKER_NOTES: Record<string, string> = {
    searching: "This is the browser search step. Explain that you always go to the official website to download — never third-party sites. Point out the URL bar and search results.",
    downloading: "Show the file manager with the downloaded ISO. Explain that ISO files are disk images — like a perfect copy of a DVD. They're typically 2-4 GB.",
    flashing_usb: "Walk through Rufus/Ventoy/BalenaEtcher. Explain that 'flashing' writes the ISO to USB sector-by-sector — it's not just copying files. The USB will become bootable.",
    usb_reinsert: "This simulates physically removing the USB and plugging it into the target machine. On real hardware, you'd move the USB from your current PC to the one you want to install on.",
    rebooting: "Explain POST (Power-On Self-Test) and how to enter BIOS. Different brands use different keys: F2, F12, Del, Esc. Show the BIOS splash screen.",
    boot_menu: "This is the BIOS boot device menu. Explain that you select the USB drive to boot from. On real hardware, pressing F12 during POST opens this on most PCs.",
    partitioning: "This is the scariest part for beginners. Explain that you're shrinking Windows to make room for Linux. Emphasize: nothing is deleted — you're just resizing. Use the slider to show how it works.",
    live_desktop: "Welcome to the live desktop! Everything runs from USB — nothing touches the hard drive. You can browse, open apps, test hardware compatibility. When ready, click Install.",
    live_welcome: "The installer asks: Try or Install? 'Try' boots into the live desktop. 'Install' goes straight to installation. For a first-timer, 'Try' is safer.",
    create_vm: "In VirtualBox, you create a virtual PC inside your real PC. Set RAM (4GB+), create a virtual hard disk, and attach the ISO as a virtual CD drive.",
    mount_iso: "Attach the downloaded ISO as a virtual CD/DVD. This is like inserting a physical disc — the VM will boot from it.",
    vm_boot: "Power on the VM. It boots from the attached ISO, just like a real machine booting from USB. You'll see the same installer screens.",
    installing: "The installer copies files, sets up your user account, configures the bootloader. This is the part that takes 10-30 minutes on real hardware. We're speeding through it.",
    vm_close: "After installation, shut down the VM. In VirtualBox, you'd remove the ISO from the virtual drive and reboot — but here we're just closing the window.",
    grub_menu: "This is the GRUB bootloader menu. On a dual-boot machine, you choose between Ubuntu and Windows every time you start the PC. Explain that GRUB is installed to the EFI partition and controls which OS boots.",
    first_boot: "The first-boot wizard guides you through online accounts, privacy settings, and initial configuration. This only happens once — after that, you go straight to the desktop.",
  };

  function renderScene() {
    console.log(`[SimPage] renderScene called — state="${current}", path="${path}"`);
    switch (current) {
      case "idle":
        return null;
      case "select_host_os":
        return (
          <SelectHostOS
            onSelect={(hostOS) => {
              console.log("[SimPage] SET_HOST_OS", hostOS);
              send({ type: "SET_HOST_OS", hostOS });
            }}
          />
        );
      case "searching":
        return (
          <FakeBrowser
            config={cfg}
            speed={speed}
            onComplete={() => { console.log("[SimPage] SEARCH_DONE"); send({ type: "SEARCH_DONE" }); }}
          />
        );
      case "downloading":
        return <FileManager config={cfg} onComplete={() => { console.log("[SimPage] DOWNLOAD_DONE"); send({ type: "DOWNLOAD_DONE" }); }} />;
      case "flashing_usb":
        return (
          <FlashUSB
            config={cfg}
            speed={speed}
            onComplete={() => { console.log("[SimPage] FLASH_DONE send"); send({ type: "FLASH_DONE" }); }}
            setRufusPartitionScheme={setRufusPartitionScheme}
          />
        );
      case "usb_reinsert":
        console.log("[SimPage] Rendering usb_reinsert scene");
        return (
          <UsbReinsert onComplete={() => { console.log("[SimPage] USB_INSERTED send"); send({ type: "USB_INSERTED" }); }} />
        );
      case "disk_prep":
        return (
          <DiskManagement
            onComplete={() => { console.log("[SimPage] DISK_PREPPED send"); send({ type: "DISK_PREPPED" }); }}
            setDiskShrunk={setDiskShrunk}
          />
        );
      case "rebooting":
        return (
          <Reboot
            speed={speed}
            onComplete={() => send({ type: "REBOOT_DONE" })}
            secureBoot={secureBoot}
            setSecureBoot={setSecureBoot}
            vtEnabled={vtEnabled}
            setVtEnabled={setVtEnabled}
            bootOrderUSB={bootOrderUSB}
            setBootOrderUSB={setBootOrderUSB}
          />
        );
      case "boot_menu":
        return (
          <BootMenu
            onComplete={() => send({ type: path === "live-usb" ? "LIVE_TRY" : "BOOT_SELECTED" })}
          />
        );
      case "live_welcome":
        return (
          <LiveWelcome
            config={cfg}
            onTry={() => send({ type: "LIVE_TRY" })}
            onInstall={() => send({ type: "LIVE_INSTALL" })}
          />
        );
      case "live_desktop":
        return (
          <LiveDesktop
            config={cfg}
            onInstallClick={() => send({ type: "LIVE_INSTALL" })}
          />
        );
      case "partitioning":
        return (
          <Partition
            onComplete={() => send({ type: "PARTITION_DONE" })}
            diskShrunk={diskShrunk}
            onRebootWindows={() => send({ type: "RESET" })}
          />
        );
      case "create_vm":
        return (
          <CreateVM config={cfg} onComplete={() => send({ type: "VM_CREATED" })} />
        );
      case "mount_iso":
        return (
          <MountISO config={cfg} onComplete={() => send({ type: "ISO_MOUNTED" })} />
        );
      case "vm_boot":
        return (
          <VmBoot
            config={cfg}
            speed={speed}
            onComplete={() => send({ type: "VM_POWERED_ON" })}
            vtEnabled={vtEnabled}
          />
        );
      case "installing":
        if (cfg.id === "arch") {
          return (
            <ArchInstall config={cfg} speed={speed} onComplete={() => send({ type: "INSTALL_DONE" })} />
          );
        }
        return (
          <Install config={cfg} speed={speed} onComplete={() => send({ type: "INSTALL_DONE" })} />
        );
      case "grub_menu":
        return (
          <GrubMenu onComplete={() => send({ type: "GRUB_DONE" })} />
        );
      case "first_boot":
        return (
          <FirstBoot
            osName={cfg.branding.name}
            osLogo={cfg.branding.logo}
            accent={cfg.branding.accent}
            onComplete={() => send({ type: "FIRST_BOOT_DONE" })}
          />
        );
      case "vm_close":
        return (
          <VmClose config={cfg} onComplete={() => send({ type: "VM_CLOSED" })} />
        );
      case "complete":
        return (
          <Done
            config={cfg}
            path={path ?? ""}
            onBack={() => {
              historyRef.current.pop();
              const prev = historyRef.current[historyRef.current.length - 1];
              if (prev) jumpToScene(prev);
            }}
          />
        );
      default:
        console.warn(`[SimPage] UNKNOWN state: "${current}" — no scene to render`);
        return (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <div className="text-3xl mb-3">⚠️</div>
            <div className="text-sm">Unknown state: {current}</div>
            <div className="text-xs mt-1 text-white/20">Check console for details</div>
          </div>
        );
    }
  }

  function handleShowcaseDismiss() {
    sessionStorage.setItem("showcase_seen", "1");
    setShowcase(false);
  }

  const visibleScenes = SIM_SCENES.filter((s) => {
    if (s === "idle") return false;
    if (isVm) {
      if (PHYSICAL_ONLY.has(s)) return false;
      if (s === "partitioning") return false;
      if (s === "live_welcome" || s === "live_desktop") return false;
      return true;
    }
    if (VM_ONLY.has(s)) return false;
    if (s === "vm_close") return false;
    if (s === "disk_prep" && path !== "dual-boot") return false;
    if (s === "partitioning" && path !== "dual-boot") return false;
    if (s === "live_welcome" && path !== "live-usb") return false;
    if (s === "live_desktop" && path !== "live-usb") return false;
    return true;
  });

  return (
    <ToastProvider>
      {showcase && <Showcase onDismiss={handleShowcaseDismiss} />}

      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl max-w-sm w-full"
            >
              <h3 className="text-lg font-bold text-white/90 mb-4">⌨ Keyboard shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Show this overlay</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">?</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Continue / Skip scene</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">Enter ↵</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Go back to previous scene</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">←</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Toggle speed run</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">S</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Cycle theme</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">T</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Toggle sound (mute/unmute)</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">M</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Close overlay / Exit presentation</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">Esc</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Pause / Resume auto-advance</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">Space</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Scene navigator (jump to any)</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">N</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Speaker notes</span>
                  <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/70">B</kbd>
                </div>
              </div>
              <p className="mt-4 text-xs text-white/30 text-center">
                Press <kbd className="font-mono text-white/50">?</kbd> or <kbd className="font-mono text-white/50">Esc</kbd> to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob" />
        <div className="aurora-blob" />
        <div className="aurora-blob" />
      </div>
      <div className="dot-grid" aria-hidden />
      <svg className="noise-overlay" aria-hidden>
        <filter id="noise-sim">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise-sim)" />
      </svg>

      <svg className="constellation-layer" aria-hidden viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <circle cx="150" cy="100" r="1.5" fill="#7c5cff" opacity="0.5" />
        <circle cx="400" cy="80" r="2" fill="#06b6d4" opacity="0.4" />
        <circle cx="650" cy="150" r="1.5" fill="#a855f7" opacity="0.4" />
        <circle cx="250" cy="300" r="1.8" fill="#7c5cff" opacity="0.3" />
        <circle cx="550" cy="350" r="2" fill="#06b6d4" opacity="0.3" />
        <circle cx="100" cy="450" r="1.5" fill="#a855f7" opacity="0.3" />
        <circle cx="700" cy="480" r="1.8" fill="#7c5cff" opacity="0.3" />
        <circle cx="400" cy="500" r="1.5" fill="#06b6d4" opacity="0.25" />
        <line x1="150" y1="100" x2="400" y2="80" stroke="#7c5cff" strokeWidth="0.4" opacity="0.12" />
        <line x1="400" y1="80" x2="650" y2="150" stroke="#06b6d4" strokeWidth="0.4" opacity="0.1" />
        <line x1="250" y1="300" x2="550" y2="350" stroke="#a855f7" strokeWidth="0.3" opacity="0.08" />
        <line x1="100" y1="450" x2="400" y2="500" stroke="#7c5cff" strokeWidth="0.3" opacity="0.08" />
        <line x1="550" y1="350" x2="700" y2="480" stroke="#06b6d4" strokeWidth="0.3" opacity="0.06" />
      </svg>

      <div className="vignette-overlay" aria-hidden />

      <div className="min-h-full flex flex-col relative z-0">
        <header className="mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] px-4 sm:px-6 py-3 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/" className="text-xs sm:text-sm text-white/60 hover:text-white">
                ← OS Install Simulator
              </Link>
              {canGoBack && (
                <button
                  onClick={goBack}
                  className="rounded-full border border-white/10 px-2 sm:px-2.5 py-1 text-xs sm:text-sm text-white/50 hover:text-white transition-colors"
                  title="Go back to previous scene (Backspace)"
                >
                  ← back
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <button
                onClick={() => {
                  const now = toggleMute();
                  setMuted(now);
                }}
                className={`rounded-full border px-2.5 sm:px-3 py-1 text-xs sm:text-sm transition-colors ${
                  muted
                    ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
                title={muted ? "Unmute sounds (M)" : "Mute sounds (M)"}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <ThemePicker />
              <button
                onClick={() => {
                  setPresentationMode((p) => {
                    const next = !p;
                    if (next) {
                      document.documentElement.requestFullscreen?.().catch(() => {});
                    } else {
                      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                    }
                    return next;
                  });
                }}
                className={`rounded-full border px-2.5 sm:px-3 py-1 text-xs sm:text-sm transition-colors ${
                  presentationMode
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
                title="Presentation mode (fullscreen + auto-advance)"
              >
                🎬 present
              </button>
              <button
                onClick={() =>
                  send({ type: "SET_SPEED", speed: speed === "fast" ? "normal" : "fast" })
                }
                className={`rounded-full border px-2.5 sm:px-3 py-1 text-xs sm:text-sm transition-colors ${
                  speed === "fast"
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
                title="Speed run mode (S)"
              >
                ⏭ speed run
              </button>
              <button
                onClick={() => setShowShortcuts(true)}
                className="rounded-full border border-white/10 px-2 sm:px-2.5 py-1 text-xs sm:text-sm text-white/40 hover:text-white/70 transition-colors"
                title="Keyboard shortcuts (?)"
              >
                ?
              </button>
              <div className="relative">
                <button
                  data-nav-btn
                  onClick={() => { setShowNavigator((v) => !v); setShowNotes(false); }}
                  className={`rounded-full border px-2.5 sm:px-3 py-1 text-xs sm:text-sm transition-colors ${
                    showNavigator
                      ? "border-accent bg-accent/20 text-white"
                      : "border-white/10 text-white/50 hover:text-white"
                  }`}
                  title="Scene navigator — jump to any scene"
                >
                  🗺️
                </button>
                {showNavigator && (
                  <div data-nav-panel className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl p-2 max-h-80 overflow-y-auto">
                    <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-white/30 font-semibold">
                      Jump to scene
                    </div>
                    {visibleScenes.map((s) => {
                      const idx = (SIM_SCENES as readonly string[]).indexOf(s);
                      const isCurrent = idx === currentIndex;
                      const isDone = idx < currentIndex;
                      return (
                        <button
                          key={s}
                          onClick={() => jumpToScene(s)}
                          disabled={isCurrent}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left ${
                            isCurrent
                              ? "bg-accent/20 text-white font-semibold cursor-default"
                              : isDone
                                ? "text-emerald-400/80 hover:bg-white/[0.06]"
                                : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                          }`}
                        >
                          <span className="text-xs w-5">
                            {isCurrent ? "▶" : isDone ? "✓" : "○"}
                          </span>
                          <span>{SCENE_LABELS[s]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                onClick={() => { setShowNotes((v) => !v); setShowNavigator(false); }}
                className={`rounded-full border px-2.5 sm:px-3 py-1 text-xs sm:text-sm transition-colors ${
                  showNotes
                    ? "border-accent bg-accent/20 text-white"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
                title="Speaker notes — what to say at each step"
              >
                📝
              </button>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">{cfg.branding.logo}</span>
                <span className="font-semibold text-xs sm:text-sm">{cfg.branding.shortName}</span>
                <span className="text-white/40 hidden sm:inline">· {path}</span>
              </div>
            </div>
          </div>

          {/* Progress indicator — only shows scenes relevant to the current path */}
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-1">
            {visibleScenes.map((s) => {
              const idx = (SIM_SCENES as readonly string[]).indexOf(s);
              const active = idx === currentIndex;
              const done = idx < currentIndex;
              return (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm ${
                      active
                        ? "bg-accent text-white"
                        : done
                          ? "bg-white/10 text-white/70"
                          : "bg-white/5 text-white/35"
                    }`}
                  >
                    <span
                      className={`h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full ${
                        active ? "bg-white" : done ? "bg-emerald-400" : "bg-white/30"
                      }`}
                    />
                    <span className="hidden sm:inline">{SCENE_LABELS[s]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-1.5 sm:mt-2 min-h-[1rem] sm:min-h-[1.25rem] text-xs sm:text-sm text-white/40" key={`status-${current}`}>
            {presentationMode && !paused && countdown > 0 && current !== "complete" && (
              <span className="inline-flex items-center gap-1.5 text-accent font-mono font-semibold mr-3">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                Next: {countdown}s
              </span>
            )}
            {presentationMode && paused && (
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold mr-3">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                PAUSED
              </span>
            )}
            {STATUS_TEXT[current] ?? ""}
          </div>
        </header>

        {isFullscreen ? (
          <div className="flex-1" key={current}>
            <ErrorBoundary label={current}>
              {renderScene()}
            </ErrorBoundary>
          </div>
        ) : (
          <main className="mx-auto w-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] flex-1 px-3 sm:px-6 pb-6 sm:pb-8">
            <DesktopShell activeApp={activeApp}>
              <div className="w-full max-w-5xl" key={current}>
                <ErrorBoundary label={current}>
                  {renderScene()}
                </ErrorBoundary>
              </div>
            </DesktopShell>
          </main>
        )}

        <div className="px-4 sm:px-6 pb-3 sm:pb-4 text-center text-xs sm:text-sm text-white/30">
          Simulation only — no files are downloaded or executed.
        </div>

        {/* ── Floating step navigation bar (touch-friendly for smartboards) ── */}
        {current !== "idle" && (
          <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-4 pb-4 px-4 pointer-events-none">
            {current === "complete" ? (
              <>
                <button
                  onClick={() => {
                    historyRef.current.pop();
                    const prev = historyRef.current[historyRef.current.length - 1];
                    if (prev) jumpToScene(prev);
                  }}
                  disabled={!canGoBack}
                  className={`pointer-events-auto rounded-2xl border px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold transition-all shadow-lg ${
                    canGoBack
                      ? "border-white/20 bg-[#14142a]/95 text-white hover:bg-white/10 active:scale-95 backdrop-blur-xl"
                      : "border-white/5 bg-[#14142a]/60 text-white/20 cursor-not-allowed"
                  }`}
                >
                  ← Back to previous scene
                </button>
                <button
                  onClick={() => { send({ type: "RESET" }); }}
                  className="pointer-events-auto rounded-2xl border border-accent/40 bg-accent/90 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-white transition-all shadow-lg shadow-accent/20 hover:bg-accent active:scale-95 backdrop-blur-xl"
                >
                  🔄 Start Over
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={goBack}
                  disabled={!canGoBack}
                  className={`pointer-events-auto rounded-2xl border px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold transition-all shadow-lg ${
                    canGoBack
                      ? "border-white/20 bg-[#14142a]/95 text-white hover:bg-white/10 active:scale-95 backdrop-blur-xl"
                      : "border-white/5 bg-[#14142a]/60 text-white/20 cursor-not-allowed"
                  }`}
                >
                  ← Previous
                </button>
                <div className="pointer-events-auto rounded-full bg-[#14142a]/95 border border-white/10 px-4 py-2 text-xs sm:text-sm text-white/50 font-mono backdrop-blur-xl">
                  {SCENE_LABELS[current] ?? current}
                </div>
                <button
                  onClick={() => {
                    if (sceneAdvance) sceneAdvance();
                    else advanceScene();
                  }}
                  className="pointer-events-auto rounded-2xl border border-accent/40 bg-accent/90 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-white transition-all shadow-lg shadow-accent/20 hover:bg-accent active:scale-95 backdrop-blur-xl"
                >
                  Next →
                </button>
              </>
            )}
          </div>
        )}

        {/* Scene context label */}
        <AnimatePresence>
          {sceneLabelVisible && (
            <motion.div
              key={sceneLabelKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-lg w-11/12"
            >
              <div className="glass rounded-xl p-4 text-center border border-white/10 shadow-lg shadow-black/20">
                <p className="text-sm text-white/80">{SCENE_CONTEXT[current]}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Speaker notes panel */}
        <AnimatePresence>
          {showNotes && SPEAKER_NOTES[current] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="mx-4 sm:mx-6 mb-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 sm:p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">📝</span>
                <span className="text-xs uppercase tracking-wider text-amber-400/80 font-semibold">Speaker Notes</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{SPEAKER_NOTES[current]}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Footer />
      </div>
    </ToastProvider>
  );
}
