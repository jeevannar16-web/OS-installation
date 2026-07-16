<div align="center">

<img src="https://raw.githubusercontent.com/jeevannar16-web/OS-installation/main/public/og-banner.png" alt="OS Install Simulator" width="0" height="0" />

# OS Install Simulator

### Practice installing an operating system before you actually do it.

An interactive, pixel-perfect simulation that walks you through installing Ubuntu, Windows, Arch Linux, and more — via **Virtual Machine**, **Dual Boot**, or **Live USB** — using a convincingly realistic fake-OS UI.

No real emulator. No risk to your hardware. Just confidence.

<br />

[![License: MIT](https://img.shields.io/badge/License-MIT-7c5cff?style=for-the-badge&logo=github&logoColor=white)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![XState](https://img.shields.io/badge/XState_5-222222?style=for-the-badge&logo=xstate&logoColor=white)](https://stately.ai/docs/xstate)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Deploy](https://img.shields.io/badge/Live-Demo-00C853?style=for-the-badge&logo=vercel&logoColor=white)](https://os-installation.vercel.app)

</div>

---

## Demo

<div align="center">

<!-- Replace the placeholder below with an actual screen recording GIF -->
<!-- Record with: https://github.com/nicedoc/screenity or https://www.loom.com -->
<img src="https://raw.githubusercontent.com/jeevannar16-web/OS-installation/main/public/demo-placeholder.png" alt="OS Install Simulator Demo" width="720" />

*Replace this with a screen recording GIF showing the full dual-boot flow*

</div>

---

## Why

Buying a USB stick, downloading an ISO, and rebooting into a BIOS menu for the first time is
intimidating. **OS Install Simulator** lets you rehearse the entire process in a safe, guided,
visually faithful environment — so when you sit down at real hardware, you already know exactly
what to expect at every click.

Think of it like [learngitbranching](https://learngitbranching.js.org/) — but for OS installation.

---

## Features

| | Feature | Details |
|---|---|---|
| **Three install paths** | Virtual Machine, Dual Boot, Live USB — each has its own completely separate scene flow and state machine. |
| **Interactive scenes** | Search & download ISO, flash USB (Rufus / Ventoy / BalenaEtcher), BIOS boot menu, disk partitioning, live desktop terminal, and a full installer wizard. |
| **Multi-OS support** | Ubuntu, Windows 11, Arch Linux fully built. Debian & Fedora stubbed on the same data-driven engine. |
| **VM path** | Create VirtualBox VM, attach ISO, boot from BIOS — entirely separate from physical hardware scenes. |
| **XState v5 machines** | Every simulation is modeled with a real finite state machine for predictable, consistent behavior. |
| **Sound effects** | Web Audio API — USB connect, POST beep, key click, success chimes. Toggle with 🔊/🔇 button or `M` key. |
| **Presentation mode** | Fullscreen + auto-advance timer. Press the 🎬 button to present to a class. |
| **Projector mode** | One-click high-contrast dark theme for smartboards and projectors. Press `P` to toggle. |
| **Scene labels** | Context tooltip appears at the start of each scene explaining what to do. |
| **Keyboard shortcuts** | `?` overlay, `Enter` to advance, `S` speed toggle, `M` mute, `P` projector mode. |
| **LocalStorage resume** | Progress is saved and can be resumed on reload. |
| **Speed run mode** | Fast-forward all animations with a single toggle. |
| **Premium UI** | Aurora background, constellation network layer, glassmorphism, animated gradient text, parallax tilt hero. |
| **Responsive** | Scales from phones to 85" school whiteboard touchscreens with dynamic font sizing. |
| **100% client-side** | Static-hostable on Vercel, Netlify, or GitHub Pages. Zero backend. |

---

## Tech Stack

```
┌─────────────────────────────────────────────────────┐
│  Framework       React 18 + Vite 5 + TypeScript 5   │
│  Styling         Tailwind CSS 3                     │
│  Animation       Framer Motion 11                   │
│  State Machine   XState 5 + @xstate/react           │
│  Routing         React Router 6                     │
│  Drag & Drop     Native HTML5 DnD + @dnd-kit        │
│  Audio           Web Audio API (no external deps)   │
└─────────────────────────────────────────────────────┘
```

---

## Simulation Flow

Each install path is a completely separate flow through the XState state machine:

```
┌─ Virtual Machine ──────────────────────────────────────┐
│  Search → Download → Create VM → Mount ISO → Boot VM  │
│  → Install → Close VM → Done                           │
└────────────────────────────────────────────────────────┘

┌─ Dual Boot ────────────────────────────────────────────┐
│  Search → Download → Flash USB → Re-insert USB        │
│  → Reboot → Boot Menu → Partition Disk → Install → Done│
└────────────────────────────────────────────────────────┘

┌─ Live USB ─────────────────────────────────────────────┐
│  Search → Download → Flash USB → Re-insert USB        │
│  → Reboot → Boot Menu → Welcome → Live Desktop        │
│  → Install → Done                                      │
└────────────────────────────────────────────────────────┘
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `?` | Show keyboard shortcuts overlay |
| `Enter` | Advance / skip current scene |
| `S` | Toggle speed-run mode |
| `M` | Mute / unmute sounds |
| `P` | Toggle projector mode (high contrast for smartboards) |
| `Esc` | Close overlays / exit presentation mode |

---

## Projector / Smartboard Mode

Presenting on a school whiteboard or projector? Press **`P`** or click the **📽️** button to enable **Projector Mode**:

- Solid dark backgrounds (no glass transparency that washes out)
- High-contrast text visible from across the room
- Decorative effects hidden (aurora, constellation, noise)
- Oversized touch targets for interactive whiteboards
- Persists across page loads via localStorage

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

Open the printed local URL in your browser. That's it.

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run TypeScript type-checking |

---

## Project Structure

```
src/
├── components/
│   ├── scenes/            # Individual simulation scenes
│   │   ├── FakeBrowser.tsx     # Search for ISO
│   │   ├── FileManager.tsx     # Locate + drag ISO
│   │   ├── FlashUSB.tsx        # Rufus / Ventoy / BalenaEtcher
│   │   ├── UsbReinsert.tsx     # Physical USB insertion
│   │   ├── Reboot.tsx          # POST + BIOS entry
│   │   ├── BootMenu.tsx        # BIOS boot device selection
│   │   ├── Partition.tsx       # Disk partitioning slider
│   │   ├── Install.tsx         # Generic installer wizard
│   │   ├── ArchInstall.tsx     # Arch Linux terminal installer
│   │   ├── LiveWelcome.tsx     # Try / Install choice
│   │   ├── LiveDesktop.tsx     # Fake live desktop
│   │   ├── CreateVM.tsx        # VirtualBox new VM wizard
│   │   ├── MountISO.tsx        # Attach ISO in settings
│   │   ├── VmBoot.tsx          # Power on + BIOS → boot menu
│   │   ├── VmClose.tsx         # Close VM window
│   │   └── Done.tsx            # 3D hardware completion scene
│   ├── shared/            # Reusable UI + effects
│   │   ├── Toast.tsx
│   │   ├── FilePickerModal.tsx
│   │   ├── InteractiveEffects.tsx  # SparkleBurst, Tooltip, PulseHint
│   │   ├── sounds.ts              # Web Audio API + global mute
│   │   ├── ProjectorMode.tsx      # Projector/smartboard high-contrast toggle
│   │   └── Showcase.tsx           # First-visit walkthrough
│   ├── shell/
│   │   └── DesktopShell.tsx   # OS window frame
│   ├── BootSequence.tsx       # Overlay boot animation
│   ├── MiniDemo.tsx           # Hero preview widget
│   └── Footer.tsx             # GitHub link
├── data/
│   ├── types.ts               # Shared OSConfig types
│   ├── ubuntu.ts              # Ubuntu config
│   ├── windows.ts             # Windows 11 config
│   ├── arch.ts                # Arch Linux config
│   ├── debian.ts              # Debian (stub)
│   └── fedora.ts              # Fedora (stub)
├── machines/
│   └── simulationMachine.ts   # XState state machine
├── pages/
│   ├── LandingPage.tsx        # Home — path + OS selection + typing animation
│   └── SimulationPage.tsx     # Scene router + progress bar + presentation mode
└── index.css                  # Aurora, constellation, projector mode CSS
```

---

## Adding a New OS

Adding an OS is mostly a **data-entry exercise**. Create a new file in `src/data/`:

```typescript
// src/data/fedora.ts
import type { OSConfig } from "./types";

export const fedora: OSConfig = {
  id: "fedora",
  branding: {
    name: "Fedora Linux",
    shortName: "Fedora",
    accent: "#294172",
    surface: "#1a1a2e",
    logo: "🎩",
    officialUrl: "https://fedoraproject.org",
  },
  downloadPage: { /* ... */ },
  iso: { filename: "Fedora-Workstation-40.iso", size: "2.1 GB" },
  flashers: [ /* ... */ ],
  wizard: [ /* ... */ ],
  installTips: [ /* ... */ ],
  searchKeywords: ["fedora", "workstation"],
  completion: { headline: "Fedora is installed!", sub: "..." },
};
```

Then register it in `src/data/index.ts` — no new components needed.

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

If this helped you, consider giving it a ⭐

</div>
