<div align="center">

# OS Install Simulator

<br />

![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![XState](https://img.shields.io/badge/XState_5-222222?style=for-the-badge&logo=xstate&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Deploy](https://img.shields.io/badge/Live_Demo-00C853?style=for-the-badge&logo=vercel&logoColor=white)

### Practice installing an OS before you actually do it.

**100% interactive. Every scene requires real user input.**

**[Try it live](https://os-installation.vercel.app)**

</div>

---

## How It Works

```
 You choose an OS          You go through           You finish with
 and install path     ---> real interactive   ---> a working desktop
                          scenes that match
                          real-world steps
```

```
 .─────────────────────────────────────────────────────────.
 │  SEARCH    DOWNLOAD    FLASH USB    REBOOT    INSTALL   │
 │   🔍    ->   📥    ->   💾    ->    🔄   ->   ⚙️     │
 │                                                         │
 │  Every arrow = you must complete the scene to advance   │
 '─────────────────────────────────────────────────────────'
```

---

## 3 Installation Paths

```
    ┌──────────────────────────────────────────────────────────────┐
    │                    CHOOSE YOUR PATH                          │
    └──────────┬───────────────────┬───────────────────┬──────────┘
               │                   │                   │
               ▼                   ▼                   ▼
        ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
        │  VIRTUAL    │    │   DUAL      │    │   LIVE      │
        │  MACHINE    │    │   BOOT      │    │   USB       │
        │             │    │             │    │             │
        │  Safest     │    │  Most       │    │  Try before │
        │  option     │    │  realistic  │    │  you install│
        └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
               │                  │                   │
               ▼                  ▼                   ▼
        Create VirtualBox   Flash USB to stick    Flash USB to stick
        Attach ISO          Boot from USB         Boot from USB
        Boot from ISO       Shrink Windows        Try Ubuntu live
        Install             Partition & Install    Install from desktop
        Done                GRUB Menu             GRUB Menu
                            First Boot            First Boot
```

---

## 20+ Interactive Scenes

```
 .───────────────────────────────────────────────────────────────────.
 │                                                                   │
 │   🔍 Search         Fake browser with real URLs                  │
 │      ──────>        Type query, click results, download ISO      │
 │                                                                   │
 │   📥 Download       File manager with ISO + drag                 │
 │      ──────>        See the file, drag it to USB                 │
 │                                                                   │
 │   💾 Flash USB      Rufus / Ventoy / BalenaEtcher               │
 │      ──────>        Pick tool, watch progress + logs             │
 │                                                                   │
 │   🔌 Reinsert       Drag-and-drop USB to port                    │
 │      ──────>        Simulates moving USB to target PC            │
 │                                                                   │
 │   🔄 Reboot         POST screen + memory test + F12              │
 │      ──────>        Press F2 for full BIOS setup                 │
 │                                                                   │
 │   🖥️  BIOS          Full interactive BIOS (5 tabs)               │
 │      ──────>        Boot order, Secure Boot, VT-x               │
 │                                                                   │
 │   📋 Boot Menu      Select USB from device list                  │
 │      ──────>        Wrong entries show error feedback            │
 │                                                                   │
 │   💿 Disk Mgmt      Right-click C: -> Shrink                     │
 │      ──────>        Full Windows Disk Management UI              │
 │                                                                   │
 │   📊 Partition      Drag slider + partition table                │
 │      ──────>        Shows NTFS, ext4, swap, FAT32               │
 │                                                                   │
 │   ⚙️  Install        Fill wizard -> watch progress               │
 │      ──────>        File-copy names scroll in terminal           │
 │                                                                   │
 │   🐧 GRUB Menu      Select Ubuntu or Windows                     │
 │      ──────>        Windows actually boots!                      │
 │                                                                   │
 │   🪟 Windows        Explore Windows 11 desktop                   │
 │      ──────>        "Restart to GRUB" to go back                 │
 │                                                                   │
 │   👋 First Boot     Online Accounts + Privacy                    │
 │      ──────>        Toggle switches, complete wizard             │
 │                                                                   │
 │   🎉 Done           Open apps, type neofetch                    │
 │      ──────>        Interactive desktop with terminal            │
 │                                                                   │
 '───────────────────────────────────────────────────────────────────'
```

---

## Presentation Tools

```
 .───────────────────────────────────────────────────────────────.
 │                                                               │
 │   🎬  PRESENTATION MODE                                      │
 │       Click button -> Fullscreen + auto-advance               │
 │                                                               │
 │   📝  SPEAKER NOTES                ⌨  KEYBOARD SHORTCUTS     │
 │       Press B -> shows what            Press ? -> overlay     │
 │       to say at each scene                                        │
 │                                                               │
 │   🗺️  SCENE NAVIGATOR             ⏪  BACK NAVIGATION        │
 │       Press N -> jump to               Press Backspace ->     │
 │       any scene directly                go back (even from     │
 │                                         the Done screen!)      │
 │                                                               │
 │   ⚡  SPEED MODE                   🎨  9 THEMES              │
 │       Press S -> 3-4x faster           Press T -> Dark,       │
 │                                         Light, Projector,     │
 │                                         Hi-Contrast, Ocean,   │
 │                                         Neon, Midnight, Warm,  │
 │                                         Minimal                │
 │                                                               │
 │   🔇  SOUND TOGGLE                 📱  TOUCH BAR             │
 │       Press M -> mute/unmute           Big buttons at bottom  │
 │                                         for smartboard touch   │
 │                                                               │
 '───────────────────────────────────────────────────────────────'
```

### Keyboard Shortcuts

```
  ┌──────────┬──────────────────────────────┐
  │    ?     │  Show shortcuts              │
  │  Enter   │  Continue / skip             │
  │ Backspace│  Go back                     │
  │  Space   │  Pause auto-advance          │
  │    S     │  Speed mode                  │
  │    T     │  Cycle theme                 │
  │    M     │  Mute sounds                 │
  │    N     │  Scene navigator             │
  │    B     │  Speaker notes               │
  │   Esc    │  Close overlays              │
  └──────────┴──────────────────────────────┘
```

---

## What Makes It Realistic

```
  REAL SIMULATOR                         WHAT YOU SEE
  ─────────────                          ────────────

  Searching Google            ──>     Fake browser with real URLs
  Downloading an ISO          ──>     File manager + progress bar
  Flashing with Rufus         ──>     Rufus UI with log output
  Moving USB to PC            ──>     Drag-and-drop animation
  POST + BIOS                 ──>     Memory test, F12 prompt, full BIOS
  Selecting boot device       ──>     Boot menu with wrong-entry errors
  Shrinking C: drive          ──>     Windows Disk Management UI
  Partitioning disk           ──>     Slider + table (NTFS/ext4/swap)
  Running the installer       ──>     Wizard + scrolling filenames
  GRUB bootloader             ──>     Interactive menu + countdown
  First boot welcome          ──>     Ubuntu welcome wizard
  Using the desktop           ──>     Files, Browser, Settings, Terminal
```

---

## Dual Boot Proof

```
  ┌─────────────────────────────────────────────────┐
  │              GRUB BOOTLOADER MENU                │
  │                                                  │
  │  > Ubuntu                    Kernel 6.8.0-41     │
  │    Advanced options for Ubuntu                   │
  │    Windows Boot Manager      On /dev/sda1        │
  │    UEFI Firmware Settings                        │
  │                                                  │
  │  Automatically boot in 10 seconds...             │
  └──────────────────┬──────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
   ┌─────────────┐      ┌─────────────┐
   │   Ubuntu    │      │  Windows    │
   │   boots!    │      │  11 boots!  │
   │             │      │             │
   │  "Restart   │      │  "Restart   │
   │   to GRUB"  │      │   to GRUB"  │
   └─────────────┘      └─────────────┘
          │                     │
          └──────────┬──────────┘
                     │
                     ▼
            Back to GRUB menu
```

---

## Tech Stack

```
  ┌─────────────────────────────────────────┐
  │                                         │
  │   React 18 + TypeScript 5 + Vite 5     │
  │                                         │
  │   Tailwind CSS 3  +  Framer Motion 11  │
  │                                         │
  │   XState 5 (state machines)            │
  │                                         │
  │   Web Audio API (no external deps)     │
  │                                         │
  │   React Router 6  +  HTML5 DnD         │
  │                                         │
  └─────────────────────────────────────────┘
```

---

## Project Structure

```
  src/
  ├── components/
  │   ├── scenes/                  20+ interactive scenes
  │   │   ├── FakeBrowser.tsx          🔍 Search for ISO
  │   │   ├── FileManager.tsx          📥 Download ISO
  │   │   ├── FlashUSB.tsx             💾 Flash USB drive
  │   │   ├── UsbReinsert.tsx          🔌 Drag-and-drop USB
  │   │   ├── Reboot.tsx               🔄 POST + BIOS setup
  │   │   ├── BootMenu.tsx             📋 Boot device selector
  │   │   ├── DiskManagement.tsx       💿 Windows Disk Mgmt
  │   │   ├── Partition.tsx            📊 Partition slider + table
  │   │   ├── Install.tsx              ⚙️  Installer wizard
  │   │   ├── ArchInstall.tsx          🏹 Arch terminal installer
  │   │   ├── LiveWelcome.tsx          👋 Try / Install choice
  │   │   ├── LiveDesktop.tsx          🖥️  Live desktop with apps
  │   │   ├── CreateVM.tsx             📦 VirtualBox VM wizard
  │   │   ├── MountISO.tsx             💿 Attach ISO
  │   │   ├── VmBoot.tsx               ⚡ Power on VM
  │   │   ├── VmClose.tsx              ❌ Close VM
  │   │   ├── GrubMenu.tsx             🐧 GRUB bootloader
  │   │   ├── FirstBoot.tsx            👋 Welcome wizard
  │   │   ├── Done.tsx                 🎉 Celebration + desktop
  │   │   └── SelectHostOS.tsx         💻 Host OS picker
  │   ├── shared/
  │   │   ├── SceneAdvance.tsx         Scene advance system
  │   │   ├── ThemeProvider.tsx        9 themes
  │   │   ├── ThemePicker.tsx          Theme dropdown
  │   │   ├── sounds.ts               Sound effects
  │   │   └── ErrorBoundary.tsx        Error catcher
  │   └── shell/
  │       └── DesktopShell.tsx         OS window frame
  ├── data/
  │   ├── types.ts                     Shared types
  │   ├── ubuntu.ts                    Ubuntu config
  │   ├── windows.ts                   Windows 11 config
  │   ├── arch.ts                      Arch Linux config
  │   ├── debian.ts                    Debian (stub)
  │   └── fedora.ts                    Fedora (stub)
  ├── machines/
  │   └── simulationMachine.ts         XState state machine
  └── pages/
      ├── LandingPage.tsx              Home page
      └── SimulationPage.tsx           Scene router + tools
```

---

## Getting Started

```bash
git clone https://github.com/jeevannar16-web/OS-installation.git
cd OS-installation
npm install
npm run dev
```

```
  ┌──────────────────────────────────────┐
  │  Commands:                           │
  │                                      │
  │  npm run dev       Start dev server  │
  │  npm run build     Production build  │
  │  npm run preview   Preview build     │
  └──────────────────────────────────────┘
```

---

## Presentation Script (10-15 min)

```
  .───────────────────────────────────────────────────────.
  │  STEP    WHAT TO SHOW           WHAT TO SAY          │
  ├───────────────────────────────────────────────────────┤
  │                                                       │
  │   1      Landing page           "This simulates OS   │
  │          Choose Ubuntu +        installation — 100%   │
  │          Dual Boot              interactive"          │
  │                                                       │
  │   2      Search browser         "Search for the ISO  │
  │          Click download         like you would on     │
  │                                  a real PC"           │
  │                                                       │
  │   3      Flash USB              "Flash the ISO to    │
  │          Watch Rufus            USB — Rufus is the    │
  │          progress               most popular tool"    │
  │                                                       │
  │   4      Drag USB               "Physically move the  │
  │          Reboot                 USB to the target PC" │
  │                                                       │
  │   5      Press F2 for BIOS      "This is a full BIOS │
  │          Navigate tabs          simulator — 5 tabs,   │
  │          Show boot order        Secure Boot, VT-x"   │
  │                                                       │
  │   6      Shrink C: drive        "Windows Disk Mgmt — │
  │          Drag partition slider  Create room for Linux"│
  │                                                       │
  │   7      Watch install          "File-copy names      │
  │          Scroll filenames       scroll by — real      │
  │          Watch timer            Linux filenames"      │
  │                                                       │
  │   8      Select Windows         "Dual-boot proof —    │
  │          from GRUB              Windows boots!"       │
  │                                                       │
  │   9      Open Terminal          "Type neofetch —      │
  │          Type neofetch          system info shows"    │
  │                                                       │
  '───────────────────────────────────────────────────────'
```

**Pro tips:**
- Press **T** for Projector theme on big screens
- Press **S** to speed through boring parts
- Press **B** for speaker notes that tell you what to say
- Ask students "which OS?" then press **N** to jump to it

---

## Contributing

1. Fork the repo
2. Create your branch (`git checkout -b feature/my-os`)
3. Make your changes
4. Commit and push
5. Open a Pull Request

---

## License

[MIT](https://opensource.org/licenses/MIT)

---

<div align="center">

**Built with React, XState, and an unreasonable number of reboot simulations.**

If this helped you, consider giving it a star

</div>
