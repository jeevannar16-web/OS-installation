<div align="center">

# OS Install Simulator

### The fully interactive, pixel-perfect OS installation simulator for education.

Practice installing Ubuntu, Windows 11, Arch Linux, Debian, and Fedora — via **Virtual Machine**, **Dual Boot**, or **Live USB** — in a 100% interactive web app where every scene requires real user input. No real emulator. No risk. Just confidence.

<br />

[![License: MIT](https://img.shields.io/badge/License-MIT-7c5cff?style=for-the-badge&logo=github&logoColor=white)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![XState](https://img.shields.io/badge/XState_5-222222?style=for-the-badge&logo=xstate&logoColor=white)](https://stately.ai/docs/xstate)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Deploy](https://img.shields.io/badge/Live_Demo-00C853?style=for-the-badge&logo=vercel&logoColor=white)](https://os-installation.vercel.app)

</div>

---

## Live Demo

**[os-installation.vercel.app](https://os-installation.vercel.app)**

---

## Why

Buying a USB stick, downloading an ISO, and rebooting into a BIOS menu for the first time is intimidating. **OS Install Simulator** lets you rehearse the entire process in a safe, guided, visually faithful environment — so when you sit down at real hardware, you already know exactly what to expect at every click.

Think of it like [learngitbranching](https://learngitbranching.js.org/) — but for OS installation.

---

## Interactive Scenes

Every scene is a standalone React component that requires **real user interaction**. You cannot skip ahead — you must complete each step.

| Scene | What you do | What's realistic |
|---|---|---|
| **Search & Download** | Type "download ubuntu" in a fake browser, click search results, pick a version, download the ISO | Fake search results with real URLs, download page with version selector, progress bar |
| **Flash USB** | Choose Rufus / Ventoy / BalenaEtcher, click Flash, watch progress + log output | Realistic log output, progress bar, partition scheme options |
| **USB Reinsert** | Drag USB cable from one port to another (drag-and-drop) | Simulates physically moving USB to target machine |
| **Reboot + BIOS** | Watch POST screen, memory test, F12 prompt. Press F2 to enter full BIOS setup | Full interactive BIOS with Main/Advanced/Security/Boot/Exit tabs, boot order reordering, Secure Boot toggle, VT-x toggle |
| **Boot Menu** | Select USB from boot device list | Wrong entries show realistic error feedback |
| **Disk Management** | Right-click C: drive, Shrink, enter size | Full Windows Disk Management table with volumes, file systems, status |
| **Partition** | Drag slider to allocate space | Partition table shows EFI (FAT32), NTFS, swap, ext4 with sizes and mount points |
| **Install Wizard** | Fill in language, keyboard, network, timezone, disk choice, user account | Every step requires input — cannot advance without filling fields |
| **Install Progress** | Watch file-copy names scroll by, elapsed timer, rotating tips | Real filenames (`/usr/lib/libc.so.6`, `grub-install`, `update-grub`) per OS |
| **GRUB Menu** | Arrow keys to navigate, select Ubuntu or Windows Boot Manager | Auto-countdown like real GRUB, select Windows boots into Windows 11 |
| **Windows Desktop** | After selecting Windows from GRUB, explore Windows 11 desktop | Taskbar, icons, "Restart to GRUB" button — proves dual-boot works |
| **First Boot Wizard** | Online Accounts, Privacy Settings | OS-specific welcome wizard with toggle switches |
| **Done Desktop** | Open Files, Browser, Settings, Terminal | Terminal with `neofetch` output showing system info |

---

## Presentation Tools

Built-in tools for classroom presentations on smartboards and projectors.

| Tool | How | What it does |
|---|---|---|
| **Presentation mode** | Click the movie button | Fullscreen + auto-advance every 15 seconds |
| **Pause/Resume** | Press Space | Pause the auto-advance timer |
| **Speaker notes** | Press B | Shows what to say at each scene |
| **Scene navigator** | Press N | Jump to any scene directly (dropdown) |
| **Back navigation** | Press Backspace or click "back" | Go backward through the entire flow — even from the Done screen |
| **Speed mode** | Press S | Speeds up all animations 3-4x |
| **Themes** | Press T | Cycle through 9 themes: Dark, Light, Projector, Hi-Contrast, Ocean, Neon, Midnight, Warm, Minimal |
| **Sound toggle** | Press M | Mute/unmute all sound effects |
| **Touch bar** | Floating bottom bar | Big Previous/Next buttons for smartboard touch |
| **Keyboard shortcuts** | Press ? | Shows all shortcuts overlay |

### Keyboard Shortcuts Reference

| Key | Action |
|---|---|
| `?` | Show keyboard shortcuts overlay |
| `Enter` | Advance / continue current scene |
| `Backspace` | Go back to previous scene |
| `Space` | Pause / resume presentation auto-advance |
| `S` | Toggle speed-run mode |
| `T` | Cycle theme |
| `M` | Mute / unmute sounds |
| `N` | Open scene navigator |
| `B` | Toggle speaker notes |
| `Esc` | Close overlays / exit presentation mode |

---

## Simulation Flow

Each install path is a completely separate flow through the XState state machine:

```
Virtual Machine:
  Search -> Download -> Select Host OS -> Create VM -> Mount ISO
  -> Boot VM -> Install -> Close VM -> Done

Dual Boot:
  Search -> Download -> Flash USB -> Re-insert USB
  -> Reboot (POST + BIOS) -> Boot Menu
  -> Disk Management -> Partition -> Install
  -> GRUB Menu -> First Boot -> Done

Live USB:
  Search -> Download -> Flash USB -> Re-insert USB
  -> Reboot (POST + BIOS) -> Boot Menu
  -> Live Welcome -> Live Desktop -> Install
  -> GRUB Menu -> First Boot -> Done
```

---

## Tech Stack

```
Framework       React 18 + Vite 5 + TypeScript 5
Styling         Tailwind CSS 3
Animation       Framer Motion 11
State Machine   XState 5 + @xstate/react
Routing         React Router 6
Drag and Drop   Native HTML5 DnD
Audio           Web Audio API (no external deps)
```

---

## Project Structure

```
src/
  components/
    scenes/              20+ interactive scene components
      FakeBrowser.tsx       Search for ISO
      FileManager.tsx       Locate + drag ISO
      FlashUSB.tsx          Rufus / Ventoy / BalenaEtcher
      UsbReinsert.tsx       Physical USB insertion
      Reboot.tsx            POST + BIOS entry + full BIOS setup
      BootMenu.tsx          BIOS boot device selection
      DiskManagement.tsx    Windows Disk Management (shrink)
      Partition.tsx         Disk partitioning slider + table
      Install.tsx           Generic installer wizard + progress
      ArchInstall.tsx       Arch Linux terminal installer
      LiveWelcome.tsx       Try / Install choice
      LiveDesktop.tsx       Fake live desktop with apps
      CreateVM.tsx          VirtualBox new VM wizard
      MountISO.tsx          Attach ISO in settings
      VmBoot.tsx            Power on + BIOS -> boot menu
      VmClose.tsx           Close VM window
      GrubMenu.tsx          GRUB bootloader (Ubuntu + Windows)
      FirstBoot.tsx         Post-install welcome wizard
      Done.tsx              3D completion scene + desktop
      SelectHostOS.tsx      Host OS selection (VM path)
    shared/              Reusable UI + effects
      SceneAdvance.tsx      Scene advance registration
      ThemeProvider.tsx     9-theme system
      ThemePicker.tsx       Theme dropdown UI
      sounds.ts             Web Audio API + global mute
      ErrorBoundary.tsx     Catches React crashes
    shell/
      DesktopShell.tsx     OS window frame
  data/
    types.ts               Shared OSConfig types
    ubuntu.ts              Ubuntu config (16 install files)
    windows.ts             Windows 11 config (12 install files)
    arch.ts                Arch Linux config (9 install files)
    debian.ts              Debian config (7 install files)
    fedora.ts              Fedora config (7 install files)
  machines/
    simulationMachine.ts   XState state machine (all 3 paths)
  pages/
    LandingPage.tsx        Home with typing animation
    SimulationPage.tsx     Scene router + all presentation tools
  index.css                Aurora, 9 theme CSS, responsive rules
```

---

## Tech Features

| Feature | Details |
|---|---|
| **3 install paths** | Virtual Machine, Dual Boot, Live USB — completely separate scene flows |
| **5 operating systems** | Ubuntu, Windows 11, Arch Linux (fully built), Debian, Fedora (stubbed) |
| **XState v5 state machine** | Every simulation modeled with a real finite state machine |
| **20+ interactive scenes** | Each scene is a standalone React component with its own state |
| **Error recovery** | Wrong BIOS settings trigger error messages with fix instructions |
| **Dual-boot proof** | GRUB menu lets you boot into Windows to prove dual-boot works |
| **Partition visualization** | Real partition table with filesystem types (NTFS, ext4, FAT32, swap) |
| **Sound effects** | Web Audio API — USB connect, POST beep, key click, success chimes |
| **9 themes** | Dark, Light, Projector, Hi-Contrast, Ocean, Neon, Midnight, Warm, Minimal |
| **Responsive** | Scales from phones to 85" school whiteboard touchscreens |
| **100% client-side** | Static-hostable on Vercel/Netlify/GitHub Pages. Zero backend |

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/jeevannar16-web/OS-installation.git
cd OS-installation

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open the printed local URL in your browser.

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run TypeScript type-checking |

---

## Presentation Guide (10-15 min)

### Before You Start

1. Press the movie button to enter fullscreen presentation mode
2. Press B to show speaker notes (they tell you what to say)
3. Press T to select "Projector" theme for big-screen visibility

### Step-by-Step Script

**Landing Page (30s)**
"This is an OS Installation Simulator — a web app that simulates installing Ubuntu, Windows, or Arch Linux. It's 100% interactive — every step requires real user input."

**Choose OS + Path (30s)**
"Pick an OS — let's go with Ubuntu. Then choose how to install: Virtual Machine, Dual Boot, or Live USB. Dual Boot is the most realistic."

**Search & Download (1 min)**
"Step 1: search for the ISO. Notice the fake browser with real-looking search results. Click the official Ubuntu link, pick a version, and download."

**Flash USB (1 min)**
"Now we flash the ISO to a USB drive. Three tools: Rufus, Ventoy, BalenaEtcher. Rufus is the most popular. Watch the progress bar and log output."

**USB Reinsert (30s)**
"On a real PC, you'd physically move the USB to the target machine. Drag the USB to the port."

**Reboot + BIOS (1-2 min)**
"The most realistic part. POST screen, memory test, F12 prompt. Press F2 to enter the full BIOS setup — navigate tabs, toggle Secure Boot, change boot order."

**Boot Menu (30s)**
"Select the USB drive to boot Ubuntu."

**Disk Management (1 min)**
"Right-click C: drive, Shrink, enter 30GB. This creates room for Ubuntu."

**Partition (1 min)**
"Drag the slider. Notice the partition table — EFI (FAT32), Windows (NTFS), swap, Linux root (ext4)."

**Install Wizard (1-2 min)**
"The Ubuntu installer. Language, keyboard, network, timezone, disk choice, user account. Every step requires input."

**Install Progress (1 min)**
"Watch the file-copy names scroll by. Real filenames. The elapsed timer shows how long it takes."

**GRUB Menu (30s)**
"After install, GRUB appears. Select Windows Boot Manager — Windows 11 boots! See? Dual-boot works. Restart back to GRUB, select Ubuntu."

**First Boot (1 min)**
"The first-boot wizard — Online Accounts, Privacy Settings."

**Done (1 min)**
"Desktop is ready. Open Terminal, type neofetch. See system info. Open Files, Settings. All interactive."

### Pro Tips

- Ask students "which OS should we install?" then use N key to jump to that OS
- Show the BIOS setup — students love navigating real BIOS tabs
- Select Windows from GRUB to prove dual-boot really works
- Press S to speed through boring parts, S again to slow down
- Use the floating bottom bar — big touch targets for the smartboard

---

## Contributing

Contributions are welcome — whether that's adding a new OS, polishing a scene, or fixing a typo.

1. **Fork** the repo and create your branch (`git checkout -b feature/my-os`)
2. Make your changes
3. **Commit** and push (`git push origin feature/my-os`)
4. Open a **Pull Request**

---

## License

Released under the [MIT License](https://opensource.org/licenses/MIT).

---

<div align="center">

**Built with React, XState, and an unreasonable number of reboot simulations.**

If this helped you, consider giving it a star

</div>
