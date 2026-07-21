import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { motion, AnimatePresence } from "framer-motion";
import { simulationMachine, SIM_SCENES } from "../machines/simulationMachine";
import { getOS } from "../data";
import { ToastProvider } from "../components/shared/Toast";
import ErrorBoundary from "../components/shared/ErrorBoundary";
import Showcase from "../components/shared/Showcase";
import FakeBrowser from "../components/scenes/FakeBrowser";
import FileManager from "../components/scenes/FileManager";
import FlashUSB from "../components/scenes/FlashUSB";
import Reboot from "../components/scenes/Reboot";
import BootMenu from "../components/scenes/BootMenu";
import LiveWelcome from "../components/scenes/LiveWelcome";
import LiveDesktop from "../components/scenes/LiveDesktop";
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
import PracticalGuide from "../components/scenes/PracticalGuide";
import { toggleMute, isMuted } from "../components/shared/sounds";
import { useTheme } from "../components/shared/ThemeProvider";
import { SceneAdvanceProvider, useSceneAdvance } from "../components/shared/SceneAdvance";
import OsIcon from "../components/shared/OsIcon";

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */
const SCENE_LABELS: Record<string, string> = {
  idle: "Start",
  select_host_os: "Host OS",
  searching: "Search & Download",
  downloading: "Locate ISO",
  flashing_usb: "Flash USB",
  disk_prep: "Disk Prep",
  bios_setup: "BIOS Setup",
  rebooting: "Reboot",
  boot_prompt: "Boot from USB",
  boot_menu: "Boot Menu",
  windows_setup: "Windows Setup",
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

const STATUS_TEXT: Record<string, string> = {
  select_host_os: "Select your host operating system…",
  searching: "Searching for the official download page…",
  downloading: "Locating the ISO file in your Downloads folder…",
  flashing_usb: "Flashing the ISO image to your USB drive…",
  disk_prep: "Shrink Windows partition to create space…",
  bios_setup: "Configuring BIOS/UEFI settings…",
  rebooting: "Restarting and entering BIOS…",
  boot_prompt: "Press a key to boot from USB…",
  boot_menu: "Select a boot device from the menu…",
  windows_setup: "Running Windows Setup…",
  live_welcome: "Choose between trying or installing…",
  live_desktop: "Exploring the live desktop environment…",
  create_vm: "Setting up a new virtual machine…",
  mount_iso: "Attaching the installation ISO…",
  vm_boot: "Powering on the virtual machine…",
  installing: "Installing the operating system…",
  grub_menu: "Selecting your operating system…",
  oobe: "Setting up Windows for the first time…",
  vm_close: "Closing the virtual machine…",
  complete: "Installation complete!",
};



const SPEAKER_NOTES: Record<string, string> = {
  searching: "This is the browser search step. Explain that you always go to the official website to download — never third-party sites. Point out the URL bar and search results.",
  downloading: "Show the file manager with the downloaded ISO. Explain that ISO files are disk images — like a perfect copy of a DVD. They're typically 2-4 GB.",
  flashing_usb: "Walk through Rufus/Ventoy/BalenaEtcher. Explain that 'flashing' writes the ISO to USB sector-by-sector — it's not just copying files. The USB will become bootable.",
  disk_prep: "Open Disk Management in Windows to shrink the existing partition. Right-click the C: drive, select Shrink Volume, and enter the amount of space to free up for the new OS.",
  bios_setup: "Enter BIOS/UEFI setup. Show the different tabs (Main, Advanced, Boot, Exit). Explain Secure Boot, USB Boot priority, and boot order. F10 to save and exit.",
  rebooting: "Explain POST (Power-On Self-Test) and how to enter BIOS. Different brands use different keys: F2, F12, Del, Esc. Show the BIOS splash screen.",
  boot_prompt: "This is the 'Press any key to boot from USB' prompt. You have 5 seconds — if you miss it, the computer boots from the hard drive instead. Press any key!",
  boot_menu: "This is the BIOS boot device menu. Explain that you select the USB drive to boot from. On real hardware, pressing F12 during POST opens this on most PCs.",
  windows_setup: "Walk through the Windows Setup wizard: choose language/time/keyboard, click Install Now, enter a product key (or skip), accept the license, choose Custom install.",
  live_desktop: "Welcome to the live desktop! Everything runs from USB — nothing touches the hard drive. You can browse, open apps, test hardware compatibility.",
  live_welcome: "The installer asks: Try or Install? 'Try' boots into the live desktop. 'Install' goes straight to installation. For a first-timer, 'Try' is safer.",
  create_vm: "In VirtualBox, you create a virtual PC inside your real PC. Set RAM (4GB+), create a virtual hard disk, and attach the ISO as a virtual CD drive.",
  mount_iso: "Attach the downloaded ISO as a virtual CD/DVD. This is like inserting a physical disc — the VM will boot from it.",
  vm_boot: "Power on the VM. It boots from the attached ISO, just like a real machine booting from USB. You'll see the same installer screens.",
  installing: "The installer copies files, sets up your user account, configures the bootloader. This takes 10-30 minutes on real hardware.",
  grub_menu: "This is the GRUB bootloader menu. On a dual-boot machine, you choose between your Linux OS and Windows every time you start the PC.",
  oobe: "The OOBE (Out-of-Box Experience) is Windows' first-boot wizard. Walk through region, keyboard, Wi-Fi, account creation, PIN setup, and privacy settings.",
  vm_close: "After installation, shut down the VM. In VirtualBox, you'd remove the ISO from the virtual drive and reboot.",
};

const VM_ONLY = new Set(["select_host_os", "create_vm", "mount_iso", "vm_boot"]);
const PHYSICAL_ONLY = new Set(["flashing_usb", "disk_prep", "bios_setup", "rebooting", "boot_prompt", "boot_menu"]);

const TRANSITIONS: Record<string, string> = {
  searching: "SEARCH_DONE",
  downloading: "DOWNLOAD_DONE",
  disk_prep: "DISK_PREPPED",
  bios_setup: "BIOS_DONE",
  rebooting: "REBOOT_DONE",
  boot_prompt: "BOOT_KEY_PRESSED",
  boot_menu: "BOOT_SELECTED",
  windows_setup: "SETUP_DONE",
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

/* ═══════════════════════════════════════════════════════════════════
   ENTRY POINT
   ═══════════════════════════════════════════════════════════════════ */
export default function SimulationPage() {
  return (
    <SceneAdvanceProvider>
      <SimulationPageInner />
    </SceneAdvanceProvider>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function SimulationPageInner() {
  const { os, path } = useParams();
  const navigate = useNavigate();
  const config = getOS(os);
  const { cycleTheme } = useTheme();
  const { current: sceneAdvance } = useSceneAdvance();

  const [state, send] = useMachine(simulationMachine);
  const [showcase, setShowcase] = useState(() => !sessionStorage.getItem("showcase_seen"));
  const [muted, setMuted] = useState(() => isMuted());
  const [presentationMode, setPresentationMode] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const jumpRef = useRef<string | null>(null);
  const historyRef = useRef<string[]>([]);

  const [, setDiskShrunk] = useState(false);
  const [secureBoot, setSecureBoot] = useState(true);
  const [vtEnabled, setVtEnabled] = useState(false);
  const [bootOrderUSB, setBootOrderUSB] = useState(false);
  const setRufusPartitionScheme = () => {};

  const current = String(state.value);
  const speed = state.context.speed;
  const currentIndex = (SIM_SCENES as readonly string[]).indexOf(current);
  const isVm = path === "vm";
  const canGoBack = current !== "idle";

  // Narrow config — guaranteed defined after the early return below
  const cfg = config!;

  const STORAGE_KEY = "os-sim-progress";

  /* ── Persist progress ── */
  useEffect(() => {
    if (current !== "idle") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ osId: config?.id ?? null, path, state: current, timestamp: Date.now() }));
    }
    if (current === "complete") localStorage.removeItem(STORAGE_KEY);
    if (current !== "idle" && current !== "complete" && !jumpRef.current) {
      const last = historyRef.current[historyRef.current.length - 1];
      if (last !== current) historyRef.current.push(current);
    }
  }, [state.value, config, path]);

  /* ── Auto-start ── */
  useEffect(() => {
    if (config && path && state.matches("idle")) {
      send({ type: "START", osId: config.id, path: path as never });
    }
  }, [config, path]);

  /* ── Auto-enter fullscreen on first non-idle state ── */
  useEffect(() => {
    if (current !== "idle") {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }, [current]);

  /* ── Keyboard shortcuts (single handler) ── */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const active = document.activeElement;
      const isInput = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");

      // ESC — close overlays only, never exit presentation
      if (e.key === "Escape") {
        if (showShortcuts) { setShowShortcuts(false); return; }
        if (showNavigator) { setShowNavigator(false); return; }
        if (showNotes) { setShowNotes(false); return; }
        if (showMenu) { setShowMenu(false); return; }
        return;
      }

      if (isInput) return;

      // Navigation
      if (e.key === "Backspace" || e.key === "ArrowLeft") {
        e.preventDefault(); goBack();
      }
      if (e.key === "Enter") {
        if ((e.target as HTMLElement).closest("[data-no-auto-advance]")) return;
        e.preventDefault();
        const s = String(state.value);
        const evt = TRANSITIONS[s];
        if (evt) send({ type: evt as never });
        else if (sceneAdvance) sceneAdvance();
      }
      if (e.key === "n" || e.key === "N") {
        if ((e.target as HTMLElement).closest("[data-no-auto-advance]")) return;
        e.preventDefault();
        const s = String(state.value);
        const evt = TRANSITIONS[s];
        if (evt) send({ type: evt as never });
        else if (sceneAdvance) sceneAdvance();
      }
      if (e.key === "b" || e.key === "B") { e.preventDefault(); setShowNotes((v) => !v); setShowNavigator(false); setShowMenu(false); }
      if (e.key === "?" || e.key === "/") { e.preventDefault(); setShowShortcuts((v) => !v); }
      if (e.key === "m" || e.key === "M") { const now = toggleMute(); setMuted(now); }
      if (e.key === "s" || e.key === "S") {
        if ((e.target as HTMLElement).closest("[data-no-auto-advance]")) return;
        // Toggle speed AND advance one scene
        send({ type: "SET_SPEED", speed: speed === "fast" ? "normal" : "fast" });
        const s = String(state.value);
        const evt = TRANSITIONS[s];
        if (evt) send({ type: evt as never });
        else if (sceneAdvance) sceneAdvance();
      }
      if (e.key === "t" || e.key === "T") { cycleTheme(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [speed, send, state.value, showShortcuts, showNavigator, showNotes, showMenu, sceneAdvance, cycleTheme]);

  /* ── Click outside to close panels ── */
  useEffect(() => {
    if (!showNavigator && !showNotes && !showMenu) return;
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-panel]")) {
        setShowNavigator(false);
        setShowNotes(false);
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showNavigator, showNotes, showMenu]);

  /* ── Auto-jump ── */
  useEffect(() => {
    if (!jumpRef.current || !config) return;
    const target = jumpRef.current;
    const s = String(state.value);
    if (s === target) { jumpRef.current = null; return; }
    if (s === "idle") { send({ type: "START", osId: config.id, path: path as never }); return; }
    const evt = TRANSITIONS[s];
    if (evt) { const t = setTimeout(() => send({ type: evt as never }), 20); return () => clearTimeout(t); }
  }, [state.value, config, path, send]);

  function jumpToScene(target: string) {
    jumpRef.current = target;
    send({ type: "RESET" });
    setShowNavigator(false);
  }

  function goBack() {
    if (historyRef.current.length < 2) { navigate("/"); return; }
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    if (prev) jumpToScene(prev);
  }

  function advanceScene() {
    const evt = TRANSITIONS[String(state.value)];
    if (evt) send({ type: evt as never });
  }

  /* ── Visible scenes for progress ── */
  const visibleScenes = SIM_SCENES.filter((s) => {
    if (s === "idle") return false;
    if (isVm) {
      if (PHYSICAL_ONLY.has(s)) return false;
      if (s === "live_welcome" || s === "live_desktop") return false;
      if (s === "windows_setup" && cfg.id !== "windows") return false;
      if (s === "oobe" && cfg.id !== "windows") return false;
      return true;
    }
    if (VM_ONLY.has(s)) return false;
    if (s === "vm_close") return false;
    if (s === "disk_prep" && path !== "dual-boot") return false;
    if (s === "windows_setup" && (path === "live-usb" || cfg.id !== "windows")) return false;
    if (s === "oobe" && cfg.id !== "windows") return false;
    if (s === "live_welcome" && path !== "live-usb") return false;
    if (s === "live_desktop" && path !== "live-usb") return false;
    return true;
  });

  if (!config) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-white/60">Unknown OS: {os}</p>
        <Link to="/" className="text-sm text-accent hover:underline">← Back to home</Link>
      </div>
    );
  }

  /* ── Practical path: bypass state machine, show real guide ── */
  if (path === "practical") {
    return (
      <ToastProvider>
        <div className="aurora-bg" aria-hidden>
          <div className="aurora-blob" /><div className="aurora-blob" /><div className="aurora-blob" />
        </div>
        <div className="dot-grid" aria-hidden />
        <div className="vignette-overlay" aria-hidden />
        <div className="min-h-screen flex flex-col relative z-0">
          {/* Header */}
          <header className="w-full px-4 py-2 flex items-center justify-between border-b border-white/[0.04] bg-[#0d0d14]/60 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Link to="/" className="text-[11px] text-white/40 hover:text-white/70 transition-colors shrink-0">← Home</Link>
              <div className="h-3 w-px bg-white/10 mx-0.5" />
              <div className="flex items-center gap-1.5">
                <OsIcon osId={config.id} accent={config.branding.accent} img={config.branding.logoImg} size={14} />
                <span className="text-[11px] font-semibold text-white/60">{config.branding.shortName}</span>
                <span className="text-[9px] text-white/25">· practical guide</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={config.branding.officialUrl} target="_blank" rel="noopener noreferrer"
                className="rounded-md bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] text-white/45 hover:bg-white/10 hover:text-white/65 transition-colors">
                Download {config.branding.shortName} ↗
              </a>
            </div>
          </header>
          {/* Guide */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <PracticalGuide config={config} speed={speed} onComplete={() => navigate("/")} />
          </div>
        </div>
      </ToastProvider>
    );
  }

  function renderScene() {
    switch (current) {
      case "idle": return null;
      case "select_host_os": return <SelectHostOS onSelect={(hostOS) => send({ type: "SET_HOST_OS", hostOS })} />;
      case "searching": return <FakeBrowser config={cfg} speed={speed} onComplete={() => send({ type: "SEARCH_DONE" })} />;
      case "downloading": return <FileManager config={cfg} onComplete={() => send({ type: "DOWNLOAD_DONE" })} />;
      case "flashing_usb": return <FlashUSB config={cfg} speed={speed} onComplete={() => send({ type: "FLASH_DONE" })} setRufusPartitionScheme={setRufusPartitionScheme} />;
      case "disk_prep": return <DiskManagement onComplete={() => send({ type: "DISK_PREPPED" })} setDiskShrunk={setDiskShrunk} />;
      case "bios_setup": return <BiosSetup onComplete={() => send({ type: "BIOS_DONE" })} secureBoot={secureBoot} setSecureBoot={setSecureBoot} osId={cfg.id} />;
      case "rebooting": return <Reboot speed={speed} onComplete={() => send({ type: "REBOOT_DONE" })} secureBoot={secureBoot} setSecureBoot={setSecureBoot} vtEnabled={vtEnabled} setVtEnabled={setVtEnabled} bootOrderUSB={bootOrderUSB} setBootOrderUSB={setBootOrderUSB} />;
      case "boot_prompt": return <BootPrompt onComplete={() => send({ type: "BOOT_KEY_PRESSED" })} onError={() => send({ type: "BOOT_KEY_TIMEOUT" })} />;
      case "boot_menu": return <BootMenu config={cfg} onComplete={() => send({ type: path === "live-usb" ? "LIVE_TRY" : "BOOT_SELECTED" })} />;
      case "windows_setup": return <WindowsSetup onComplete={() => send({ type: "SETUP_DONE" })} />;
      case "live_welcome": return <LiveWelcome config={cfg} onTry={() => send({ type: "LIVE_TRY" })} onInstall={() => send({ type: "LIVE_INSTALL" })} />;
      case "live_desktop": return <LiveDesktop config={cfg} onInstallClick={() => send({ type: "LIVE_INSTALL" })} />;
      case "create_vm": return <CreateVM config={cfg} onComplete={() => send({ type: "VM_CREATED" })} />;
      case "mount_iso": return <MountISO config={cfg} onComplete={() => send({ type: "ISO_MOUNTED" })} />;
      case "vm_boot": return <VmBoot config={cfg} speed={speed} onComplete={() => send({ type: "VM_POWERED_ON" })} vtEnabled={vtEnabled} onEnableVT={() => setVtEnabled(true)} />;
      case "installing": return cfg.id === "arch"
        ? <ArchInstall config={cfg} speed={speed} onComplete={() => send({ type: "INSTALL_DONE" })} />
        : <Install config={cfg} speed={speed} onComplete={() => send({ type: "INSTALL_DONE" })} path={path} />;
      case "grub_menu": return <GrubMenu config={cfg} onComplete={() => send({ type: "GRUB_DONE" })} />;
      case "oobe": return cfg.id === "windows"
        ? <WindowsOOBE onComplete={() => send({ type: "OOBE_DONE" })} />
        : <Done config={cfg} path={path ?? ""} onBack={goBack} />;
      case "vm_close": return <VmClose config={cfg} onComplete={() => send({ type: "VM_CLOSED" })} />;
      case "complete": return <Done config={cfg} path={path ?? ""} onBack={goBack} />;
      default: return (
        <div className="flex flex-col items-center justify-center py-20 text-white/40">
          <div className="text-sm">Unknown state: {current}</div>
        </div>
      );
    }
  }

  return (
    <ToastProvider>
      {showcase && <Showcase onDismiss={() => { sessionStorage.setItem("showcase_seen", "1"); setShowcase(false); }} />}

      {/* Background */}
      <div className="aurora-bg" aria-hidden>
        <div className="aurora-blob" /><div className="aurora-blob" /><div className="aurora-blob" />
      </div>
      <div className="dot-grid" aria-hidden />
      <div className="vignette-overlay" aria-hidden />

      <div className="min-h-screen flex flex-col relative z-0">
        {/* ═══════════════════════════════════════════════════════════
           HEADER — slim, one row, all controls in a dropdown
           ═══════════════════════════════════════════════════════════ */}
        <header className="w-full px-4 py-2 flex items-center justify-between border-b border-white/[0.04] bg-[#0d0d14]/60 backdrop-blur-md shrink-0">
          {/* Left: back + OS info */}
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" className="text-[11px] text-white/40 hover:text-white/70 transition-colors shrink-0">← Home</Link>
            {canGoBack && (
              <button onClick={goBack} className="text-[11px] text-white/40 hover:text-white/70 transition-colors shrink-0">← back</button>
            )}
            <div className="h-3 w-px bg-white/10 mx-0.5" />
            <div className="flex items-center gap-1.5 min-w-0">
              <OsIcon osId={cfg.id} accent={cfg.branding.accent} img={cfg.branding.logoImg} size={14} />
              <span className="text-[11px] font-semibold text-white/60 truncate">{cfg.branding.shortName}</span>
              <span className="text-[9px] text-white/25 hidden sm:inline">· {path}</span>
            </div>
          </div>

          {/* Center: scene label */}
          {current !== "idle" && current !== "complete" && (
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] text-white/50 font-medium">{SCENE_LABELS[current]}</span>
            </div>
          )}

          {/* Right: single dropdown menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              data-panel
              className="flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-white/45 hover:bg-white/10 hover:text-white/65 transition-colors"
            >
              {showMenu ? "✕" : "☰"} Menu
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  data-panel
                  className="absolute right-4 top-full mt-1 w-56 rounded-xl border border-white/10 bg-[#12121a]/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-1">
                    {/* Mute */}
                    <button onClick={() => { const now = toggleMute(); setMuted(now); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-white/60 hover:bg-white/[0.06] transition-colors">
                      <span className="text-sm">{muted ? "🔇" : "🔊"}</span>
                      <span>{muted ? "Unmute" : "Mute"} sounds</span>
                      <kbd className="ml-auto text-[9px] font-mono text-white/25 bg-white/5 px-1.5 py-0.5 rounded">M</kbd>
                    </button>
                    {/* Speed */}
                    <button onClick={() => send({ type: "SET_SPEED", speed: speed === "fast" ? "normal" : "fast" })}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-white/60 hover:bg-white/[0.06] transition-colors">
                      <span className="text-sm">⏭</span>
                      <span>Speed: {speed === "fast" ? "Fast" : "Normal"}</span>
                      <kbd className="ml-auto text-[9px] font-mono text-white/25 bg-white/5 px-1.5 py-0.5 rounded">S</kbd>
                    </button>
                    {/* Theme */}
                    <button onClick={cycleTheme}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-white/60 hover:bg-white/[0.06] transition-colors">
                      <span className="text-sm">🎨</span>
                      <span>Change theme</span>
                      <kbd className="ml-auto text-[9px] font-mono text-white/25 bg-white/5 px-1.5 py-0.5 rounded">T</kbd>
                    </button>
                    {/* Present */}
                    <button onClick={() => {
                      const next = !presentationMode;
                      setPresentationMode(next);
                      if (next) document.documentElement.requestFullscreen?.().catch(() => {});
                      else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                    }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] hover:bg-white/[0.06] transition-colors ${presentationMode ? "text-accent" : "text-white/60"}`}>
                      <span className="text-sm">🖥</span>
                      <span>{presentationMode ? "Exit presentation" : "Fullscreen"}</span>
                    </button>
                    <div className="h-px bg-white/[0.06] my-1" />
                    {/* Navigator */}
                    <button onClick={() => { setShowNavigator((v) => !v); setShowNotes(false); setShowMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-white/60 hover:bg-white/[0.06] transition-colors">
                      <span className="text-sm">🗺</span>
                      <span>Jump to scene</span>
                      <kbd className="ml-auto text-[9px] font-mono text-white/25 bg-white/5 px-1.5 py-0.5 rounded">N</kbd>
                    </button>
                    {/* Notes */}
                    <button onClick={() => { setShowNotes((v) => !v); setShowNavigator(false); setShowMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-white/60 hover:bg-white/[0.06] transition-colors">
                      <span className="text-sm">📝</span>
                      <span>Speaker notes</span>
                      <kbd className="ml-auto text-[9px] font-mono text-white/25 bg-white/5 px-1.5 py-0.5 rounded">B</kbd>
                    </button>
                    {/* Shortcuts */}
                    <button onClick={() => { setShowShortcuts(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-white/60 hover:bg-white/[0.06] transition-colors">
                      <span className="text-sm">⌨</span>
                      <span>Keyboard shortcuts</span>
                      <kbd className="ml-auto text-[9px] font-mono text-white/25 bg-white/5 px-1.5 py-0.5 rounded">?</kbd>
                    </button>
                    <div className="h-px bg-white/[0.06] my-1" />
                    <div className="px-3 py-2 text-[10px] text-white/30 leading-relaxed">
                      <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono text-white/50 text-[9px]">ESC</kbd> Exit fullscreen ·{" "}
                      <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono text-white/50 text-[9px]">N</kbd> Next step
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════
           PROGRESS BAR — slim, below header
           ═══════════════════════════════════════════════════════════ */}
        {current !== "idle" && (
          <div className="w-full px-4 py-1.5 border-b border-white/[0.04] bg-[#0d0d14]/40 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-0.5 min-w-max mx-auto max-w-6xl">
              {visibleScenes.map((s) => {
                const idx = (SIM_SCENES as readonly string[]).indexOf(s);
                const active = idx === currentIndex;
                const done = idx < currentIndex;
                return (
                  <div key={s} className="flex items-center">
                    <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] transition-all ${
                      active ? "bg-accent/20 text-accent font-semibold" : done ? "text-white/40" : "text-white/20"
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent" : done ? "bg-emerald-400/60" : "bg-white/15"}`} />
                      <span className="hidden md:inline">{SCENE_LABELS[s]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           STATUS BAR — one line below progress
           ═══════════════════════════════════════════════════════════ */}
        {current !== "idle" && current !== "complete" && (
          <div className="w-full px-4 py-1 bg-[#0d0d14]/30 border-b border-white/[0.03] shrink-0">
            <p className="text-[11px] text-white/30 max-w-6xl mx-auto">
              {STATUS_TEXT[current] ?? ""}
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           SCENE CONTENT — full width, maximum space
           ═══════════════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col px-4 py-2 overflow-auto" key={current}>
          <ErrorBoundary label={current}>
            <div className="w-full max-w-6xl mx-auto flex flex-col flex-1 min-h-0">
              {renderScene()}
            </div>
          </ErrorBoundary>
        </main>

        {/* ═══════════════════════════════════════════════════════════
           BOTTOM BAR — back/help left, scene label center, next right
           ═══════════════════════════════════════════════════════════ */}
        {current !== "idle" && (
          <div className="w-full px-4 py-2 flex items-center justify-between border-t border-white/[0.04] bg-[#0d0d14]/60 backdrop-blur-md shrink-0">
            {/* Left: Back + Help */}
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                disabled={!canGoBack}
                className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all ${
                  canGoBack ? "border-white/10 text-white/50 hover:text-white hover:border-white/20" : "border-white/5 text-white/15 cursor-not-allowed"
                }`}
              >
                ← Back
              </button>
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all ${
                  showNotes ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-white/10 text-white/50 hover:text-white"
                }`}
              >
                {showNotes ? "✕ Notes" : "? Help"}
              </button>
            </div>

            {/* Center: step X of Y */}
            <div className="text-[10px] text-white/25 font-mono">
              {currentIndex >= 0 ? `${currentIndex + 1} / ${visibleScenes.length}` : ""}
            </div>

            {/* Right: Next */}
            <button
              onClick={() => {
                if (current === "complete") { send({ type: "RESET" }); }
                else if (sceneAdvance) sceneAdvance();
                else advanceScene();
              }}
              className="rounded-lg border border-accent/30 bg-accent/80 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-accent transition-colors"
            >
              {current === "complete" ? "Restart" : "Next →"}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
           PANELS — Scene Navigator (dropdown)
           ═══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showNavigator && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              data-panel
              className="fixed top-12 right-4 z-50 w-64 rounded-xl border border-white/10 bg-[#12121a]/95 backdrop-blur-xl shadow-2xl p-2 max-h-80 overflow-y-auto"
            >
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-white/30 font-semibold">Jump to scene</div>
              {visibleScenes.map((s) => {
                const idx = (SIM_SCENES as readonly string[]).indexOf(s);
                const isCurrent = idx === currentIndex;
                const isDone = idx < currentIndex;
                return (
                  <button key={s} onClick={() => jumpToScene(s)} disabled={isCurrent}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-colors text-left ${
                      isCurrent ? "bg-accent/20 text-white font-semibold cursor-default" : isDone ? "text-emerald-400/70 hover:bg-white/[0.04]" : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                    }`}>
                    <span className="text-[10px] w-4">{isCurrent ? "▶" : isDone ? "✓" : "○"}</span>
                    <span>{SCENE_LABELS[s]}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════
           PANELS — Speaker Notes (inline bar)
           ═══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showNotes && SPEAKER_NOTES[current] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full px-4 py-2 bg-amber-500/[0.06] border-t border-amber-500/20 shrink-0 overflow-hidden"
            >
              <div className="max-w-6xl mx-auto flex items-start gap-2">
                <span className="text-xs mt-0.5">📝</span>
                <p className="text-[12px] text-white/60 leading-relaxed">{SPEAKER_NOTES[current]}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════
           PANELS — Shortcuts modal
           ═══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showShortcuts && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setShowShortcuts(false)}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="rounded-2xl border border-white/10 bg-[#12121a] p-5 shadow-2xl max-w-sm w-full">
                <h3 className="text-base font-bold text-white/90 mb-3">Keyboard shortcuts</h3>
                <div className="space-y-1.5 text-[12px]">
                  {[["Enter", "Next step"], ["Backspace", "Go back"], ["N", "Scene navigator"], ["B", "Speaker notes"],
                    ["S", "Speed mode"], ["T", "Change theme"], ["M", "Mute/unmute"], ["?", "This panel"], ["Esc", "Close panels"],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex justify-between items-center py-1">
                      <span className="text-white/50">{desc}</span>
                      <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/60">{key}</kbd>
                    </div>
                  ))}
                </div>
                <button onClick={() => setShowShortcuts(false)}
                  className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity">
                  Got it
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Footer */}
        <div className="w-full px-4 py-2 text-center text-[10px] text-white/20 border-t border-white/[0.03]">
          Simulation only — no files are downloaded or executed
        </div>
      </div>
    </ToastProvider>
  );
}
