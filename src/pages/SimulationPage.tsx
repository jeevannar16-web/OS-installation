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
import BiosSetup from "../components/scenes/BiosSetup";
import BootPrompt from "../components/scenes/BootPrompt";
import WindowsSetup from "../components/scenes/WindowsSetup";
import WindowsOOBE from "../components/scenes/WindowsOOBE";
import Done from "../components/scenes/Done";
import GrubMenu from "../components/scenes/GrubMenu";
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
  bios_setup: "BIOS Setup",
  rebooting: "Reboot",
  boot_prompt: "Boot from USB",
  boot_menu: "Boot Menu",
  windows_setup: "Windows Setup",
  partitioning: "Partition",
  live_welcome: "Live Welcome",
  live_desktop: "Live Desktop",
  create_vm: "Create VM",
  mount_iso: "Mount ISO",
  vm_boot: "Power On",
  installing: "Install",
  grub_menu: "GRUB Menu",
  oobe: "First Boot",
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
  bios_setup: { name: "BIOS Setup", icon: "🔧" },
  rebooting: { name: "System", icon: "⏻" },
  boot_prompt: { name: "Boot", icon: "💻" },
  boot_menu: { name: "Boot Menu", icon: "💻" },
  windows_setup: { name: "Windows Setup", icon: "🪟" },
  live_welcome: { name: "Installer", icon: "💿" },
  live_desktop: { name: "Live Session", icon: "🖥️" },
  partitioning: { name: "Installer", icon: "🧩" },
  create_vm: { name: "VirtualBox", icon: "💻" },
  mount_iso: { name: "VirtualBox", icon: "💿" },
  vm_boot: { name: "VirtualBox", icon: "▶" },
  installing: { name: "Installer", icon: "🧩" },
  grub_menu: { name: "GRUB", icon: "🐧" },
  oobe: { name: "First Boot", icon: "🎉" },
  vm_close: { name: "VirtualBox", icon: "💻" },
  complete: { name: "Done", icon: "🎉" },
};

const FULLSCREEN_SCENES = new Set<string>();

const STATUS_TEXT: Record<string, string> = {
  select_host_os: "Select your host operating system…",
  searching: "Searching for the official download page…",
  downloading: "Locating the ISO file in your Downloads folder…",
  flashing_usb: "Flashing the ISO image to your USB drive…",
  usb_reinsert: "Insert the USB into the target machine…",
  disk_prep: "Shrink Windows partition to create space…",
  bios_setup: "Configuring BIOS/UEFI settings…",
  rebooting: "Restarting and entering BIOS…",
  boot_prompt: "Press a key to boot from USB…",
  boot_menu: "Select a boot device from the menu…",
  windows_setup: "Running Windows Setup…",
  live_welcome: "Choose between trying or installing…",
  live_desktop: "Exploring the live desktop environment…",
  partitioning: "Allocating disk space for the new OS…",
  create_vm: "Setting up a new virtual machine…",
  mount_iso: "Attaching the installation ISO…",
  vm_boot: "Powering on the virtual machine…",
  installing: "Installing the operating system…",
  grub_menu: "Selecting your operating system…",
  oobe: "Setting up Windows for the first time…",
  vm_close: "Closing the virtual machine…",
  complete: "Installation complete!",
};

const VM_ONLY = new Set(["select_host_os", "create_vm", "mount_iso", "vm_boot"]);
const PHYSICAL_ONLY = new Set(["flashing_usb", "usb_reinsert", "disk_prep", "bios_setup", "rebooting", "boot_prompt", "boot_menu"]);

const SCENE_CONTEXT: Record<string, string> = {
  searching: "Use the browser to find the official download page for your OS.",
  downloading: "Locate the ISO file you just downloaded in your file manager.",
  flashing_usb: "Write the ISO image to a USB drive using a flashing tool.",
  usb_reinsert: "Remove the USB, then plug it back into the target machine.",
  disk_prep: "Open Disk Management in Windows to shrink your partition.",
  bios_setup: "Enter BIOS/UEFI to configure boot order and enable USB boot.",
  rebooting: "Restart the computer and enter the BIOS/UEFI setup.",
  boot_prompt: "Press any key within 5 seconds to boot from the USB drive.",
  boot_menu: "Select the USB drive from the boot device menu to start the installer.",
  windows_setup: "Follow the Windows Setup wizard: language, product key, license, install type.",
  live_welcome: "Choose whether to try the OS live or install it directly.",
  live_desktop: "Explore the live desktop — everything runs from the USB.",
  partitioning: "Resize your existing partition and allocate space for the new OS.",
  create_vm: "Configure a new virtual machine with the right settings.",
  mount_iso: "Attach the downloaded ISO as a virtual CD/DVD drive.",
  vm_boot: "Power on the VM and boot from the attached ISO.",
  installing: "Follow the installer wizard to set up your new operating system.",
  grub_menu: "GRUB lets you choose between your installed operating systems.",
  oobe: "Windows first-boot wizard: region, keyboard, account, and privacy settings.",
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
  const [sceneLabelKey, setSceneLabelKey] = useState(0);
  const [sceneLabelVisible, setSceneLabelVisible] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const jumpRef = useRef<string | null>(null);
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
      if (e.key === "Enter") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "BUTTON")) return;
        const s = String(state.value);
        console.log("[SimPage] Enter pressed in state:", s);
        if (s === "searching") send({ type: "SEARCH_DONE" });
        else if (s === "downloading") send({ type: "DOWNLOAD_DONE" });
        else if (s === "flashing_usb") send({ type: "FLASH_DONE" });
        else if (s === "usb_reinsert") send({ type: "USB_INSERTED" });
        else if (s === "disk_prep") send({ type: "DISK_PREPPED" });
        else if (s === "bios_setup") send({ type: "BIOS_DONE" });
        else if (s === "rebooting") send({ type: "REBOOT_DONE" });
        else if (s === "boot_prompt") send({ type: "BOOT_KEY_PRESSED" });
        else if (s === "boot_menu") send({ type: "BOOT_SELECTED" });
        else if (s === "windows_setup") send({ type: "SETUP_DONE" });
        else if (s === "partitioning") send({ type: "PARTITION_DONE" });
        else if (s === "live_welcome") send({ type: "LIVE_INSTALL" });
        else if (s === "live_desktop") send({ type: "LIVE_INSTALL" });
        else if (s === "create_vm") send({ type: "VM_CREATED" });
        else if (s === "mount_iso") send({ type: "ISO_MOUNTED" });
        else if (s === "vm_boot") send({ type: "VM_POWERED_ON" });
        else if (s === "installing") send({ type: "INSTALL_DONE" });
        else if (s === "grub_menu") send({ type: "GRUB_DONE" });
        else if (s === "oobe") send({ type: "OOBE_DONE" });
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

  // Escape exits fullscreen; Backspace/Left goes back; N/B for navigator/notes
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const active = document.activeElement;
      const isInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || (active as HTMLElement).isContentEditable);
      if (e.key === "Escape") {
        if (presentationMode) {
          setPresentationMode(false);
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        }
        setShowNavigator(false);
        setShowNotes(false);
      }
      if (!isInput && (e.key === "Backspace" || e.key === "ArrowLeft")) {
        e.preventDefault();
        goBack();
      }
      if (!isInput && (e.key === "n" || e.key === "N")) {
        e.preventDefault();
        setShowNavigator((v) => !v);
        setShowNotes(false);
      }
      if (!isInput && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setShowNotes((v) => !v);
        setShowNavigator(false);
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

  // Single source of truth for state transitions
  const TRANSITIONS: Record<string, string> = {
    searching: "SEARCH_DONE",
    downloading: "DOWNLOAD_DONE",
    flashing_usb: "FLASH_DONE",
    usb_reinsert: "USB_INSERTED",
    disk_prep: "DISK_PREPPED",
    bios_setup: "BIOS_DONE",
    rebooting: "REBOOT_DONE",
    boot_prompt: "BOOT_KEY_PRESSED",
    boot_menu: "BOOT_SELECTED",
    windows_setup: "SETUP_DONE",
    partitioning: "PARTITION_DONE",
    live_welcome: "LIVE_INSTALL",
    live_desktop: "LIVE_INSTALL",
    create_vm: "VM_CREATED",
    mount_iso: "ISO_MOUNTED",
    vm_boot: "VM_POWERED_ON",
    installing: "INSTALL_DONE",
    grub_menu: "GRUB_DONE",
    oobe: "OOBE_DONE",
    vm_close: "VM_CLOSED",
  };

  function advanceScene() {
    const evt = TRANSITIONS[String(state.value)];
    if (evt) send({ type: evt as never });
  }

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
    const evt = TRANSITIONS[s];
    if (evt) {
      const t = setTimeout(() => send({ type: evt as never }), 100);
      return () => clearTimeout(t);
    }
  }, [state.value, config, path, send]);

  function jumpToScene(target: string) {
    jumpRef.current = target;
    send({ type: "RESET" });
    setShowNavigator(false);
  }

  function goBack() {
    if (historyRef.current.length < 2) {
      send({ type: "RESET" });
      return;
    }
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    if (prev) jumpToScene(prev);
  }

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

  const canGoBack = current !== "idle";

  const SPEAKER_NOTES: Record<string, string> = {
    searching: "This is the browser search step. Explain that you always go to the official website to download — never third-party sites. Point out the URL bar and search results.",
    downloading: "Show the file manager with the downloaded ISO. Explain that ISO files are disk images — like a perfect copy of a DVD. They're typically 2-4 GB.",
    flashing_usb: "Walk through Rufus/Ventoy/BalenaEtcher. Explain that 'flashing' writes the ISO to USB sector-by-sector — it's not just copying files. The USB will become bootable.",
    usb_reinsert: "This simulates physically removing the USB and plugging it into the target machine. On real hardware, you'd move the USB from your current PC to the one you want to install on.",
    disk_prep: "Open Disk Management in Windows to shrink the existing partition. Right-click the C: drive, select Shrink Volume, and enter the amount of space to free up for the new OS.",
    bios_setup: "Enter BIOS/UEFI setup. Show the different tabs (Main, Advanced, Boot, Exit). Explain Secure Boot, USB Boot priority, and boot order. F10 to save and exit.",
    rebooting: "Explain POST (Power-On Self-Test) and how to enter BIOS. Different brands use different keys: F2, F12, Del, Esc. Show the BIOS splash screen.",
    boot_prompt: "This is the 'Press any key to boot from USB' prompt. You have 5 seconds — if you miss it, the computer boots from the hard drive instead. Press any key!",
    boot_menu: "This is the BIOS boot device menu. Explain that you select the USB drive to boot from. On real hardware, pressing F12 during POST opens this on most PCs.",
    windows_setup: "Walk through the Windows Setup wizard: choose language/time/keyboard, click Install Now, enter a product key (or skip), accept the license, choose Custom install.",
    partitioning: "This is the scariest part for beginners. Explain that you're shrinking Windows to make room for Linux. Emphasize: nothing is deleted — you're just resizing. Use the slider to show how it works.",
    live_desktop: "Welcome to the live desktop! Everything runs from USB — nothing touches the hard drive. You can browse, open apps, test hardware compatibility. When ready, click Install.",
    live_welcome: "The installer asks: Try or Install? 'Try' boots into the live desktop. 'Install' goes straight to installation. For a first-timer, 'Try' is safer.",
    create_vm: "In VirtualBox, you create a virtual PC inside your real PC. Set RAM (4GB+), create a virtual hard disk, and attach the ISO as a virtual CD drive.",
    mount_iso: "Attach the downloaded ISO as a virtual CD/DVD. This is like inserting a physical disc — the VM will boot from it.",
    vm_boot: "Power on the VM. It boots from the attached ISO, just like a real machine booting from USB. You'll see the same installer screens.",
    installing: "The installer copies files, sets up your user account, configures the bootloader. This is the part that takes 10-30 minutes on real hardware. We're speeding through it.",
    grub_menu: "This is the GRUB bootloader menu. On a dual-boot machine, you choose between Ubuntu and Windows every time you start the PC. Explain that GRUB is installed to the EFI partition and controls which OS boots.",
    oobe: "The OOBE (Out-of-Box Experience) is Windows' first-boot wizard. Walk through region, keyboard, Wi-Fi, account creation, PIN setup, and privacy settings. This only happens once.",
    vm_close: "After installation, shut down the VM. In VirtualBox, you'd remove the ISO from the virtual drive and reboot — but here we're just closing the window.",
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
      case "bios_setup":
        return (
          <BiosSetup
            onComplete={() => send({ type: "BIOS_DONE" })}
            secureBoot={secureBoot}
            setSecureBoot={setSecureBoot}
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
      case "boot_prompt":
        return (
          <BootPrompt
            onComplete={() => send({ type: "BOOT_KEY_PRESSED" })}
            onError={() => send({ type: "BOOT_KEY_TIMEOUT" })}
          />
        );
      case "boot_menu":
        return (
          <BootMenu
            onComplete={() => send({ type: path === "live-usb" ? "LIVE_TRY" : "BOOT_SELECTED" })}
          />
        );
      case "windows_setup":
        return (
          <WindowsSetup config={cfg} onComplete={() => send({ type: "SETUP_DONE" })} />
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
      case "oobe":
        return (
          <WindowsOOBE
            osName={cfg.branding.name}
            onComplete={() => send({ type: "OOBE_DONE" })}
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
    if (s === "windows_setup" && path === "live-usb") return false;
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
                title="Presentation mode (fullscreen)"
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
            {STATUS_TEXT[current] ?? ""}
          </div>
        </header>

        {/* ── Presentation mode exit hint ── */}
        {presentationMode && (
          <div className="fixed top-3 right-3 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-[#14142a]/80 px-3 py-1.5 text-[11px] text-white/40 font-mono backdrop-blur-md pointer-events-none">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            ESC to exit fullscreen
          </div>
        )}

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

        {/* ── Corner navigation (small, unobtrusive) ── */}
        {current !== "idle" && (
          <>
            {/* Back — bottom-left */}
            <button
              onClick={goBack}
              disabled={!canGoBack}
              className={`fixed bottom-4 left-4 z-50 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all backdrop-blur-md pointer-events-auto ${
                canGoBack
                  ? "border-white/10 bg-[#14142a]/90 text-white/60 hover:text-white hover:border-white/20"
                  : "border-white/5 bg-[#14142a]/50 text-white/15 cursor-not-allowed"
              }`}
            >
              ← Back
            </button>

            {/* Scene label — bottom-center */}
            {current !== "complete" && (
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#14142a]/90 border border-white/[0.08] px-3 py-1.5 text-[10px] text-white/30 font-mono backdrop-blur-md pointer-events-none">
                {SCENE_LABELS[current] ?? current}
              </div>
            )}

            {/* Next / Restart — bottom-right */}
            <button
              onClick={() => {
                if (current === "complete") {
                  send({ type: "RESET" });
                } else if (sceneAdvance) {
                  sceneAdvance();
                } else {
                  advanceScene();
                }
              }}
              className={`fixed bottom-4 right-4 z-50 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all backdrop-blur-md pointer-events-auto ${
                current === "complete"
                  ? "border-accent/30 bg-accent/80 text-white hover:bg-accent"
                  : "border-accent/30 bg-accent/80 text-white hover:bg-accent"
              }`}
            >
              {current === "complete" ? "Restart" : "Next →"}
            </button>
          </>
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
