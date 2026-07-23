<div align="center">

# OS Install Simulator

<br />

![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![XState](https://img.shields.io/badge/XState_5-222222?style=for-the-badge&logo=xstate&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**Practice installing operating systems — without risking your real machine.**

[Try it live](https://os-installation.vercel.app) · [Report Bug](https://github.com/jeevannar16-web/OS-installation/issues)

</div>

---

## What is this?

A fully interactive browser-based OS installation simulator. Choose an OS (Ubuntu, Windows 11, Arch Linux, Fedora, Debian, Zorin, Linux Mint) and an install path (Virtual Machine, Dual Boot, or Live USB), then go through **every real-world step** — from downloading the ISO to booting into the finished desktop.

No files are actually downloaded. No disks are modified. It's all simulated — but every click, every decision, and every sequence matches real installation.

---

## One Command to Run

```bash
npm start
```

Or manually:

```bash
git clone https://github.com/jeevannar16-web/OS-installation.git
cd OS-installation
npm install
npm run dev
```

---

## Features

- **20+ interactive scenes** — real browser, file manager, Rufus/Ventoy/Etcher UIs, BIOS setup with 5 tabs, boot menu, disk management, partition editor, GRUB menu, Windows OOBE, and more
- **3 install paths** — Virtual Machine (VirtualBox 7.0), Dual Boot (shrink + partition), Live USB (try before installing)
- **7 supported OSes** — Ubuntu, Windows 11, Arch Linux, Fedora, Debian, Zorin OS, Linux Mint
- **Full BIOS simulation** — 5 tabs (Main, Advanced, Security, Boot, Exit), toggle Secure Boot, VT-x, boot order
- **Interactive USB flashing** — plug, eject, reconnect with drag-and-drop + click-to-connect
- **Guided help** — `? Guide` button on every step shows what to do, how to do it, and what happens next
- **Dual-boot flow** — shrink Windows partition, install alongside, pick OS from GRUB
- **Live desktop** — open apps, browse files, install from within the live environment
- **VirtualBox integration** — create VM, mount ISO, power on, close VM
- **Scrolling terminal install output** — real file-copy names scroll during installation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| State | XState 5 (state machines) |
| Animation | Framer Motion 11 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| Audio | Web Audio API |

---

## Project Structure

```
src/
├── components/
│   ├── scenes/         20+ interactive OS installation scenes
│   │   ├── FakeBrowser.tsx       Download ISO from official site
│   │   ├── FileManager.tsx       Locate ISO in Downloads
│   │   ├── FlashUSB.tsx          Rufus / Ventoy / BalenaEtcher
│   │   ├── Reboot.tsx            POST + BIOS setup + boot
│   │   ├── BootMenu.tsx          Select boot device
│   │   ├── DiskManagement.tsx    Shrink Windows partition
│   │   ├── Partition.tsx         Partition slider + table
│   │   ├── Install.tsx           Installer wizard + terminal output
│   │   ├── ArchInstall.tsx       Arch Linux terminal installer
│   │   ├── CreateVM.tsx          VirtualBox 7.0 VM wizard
│   │   ├── MountISO.tsx          Attach ISO in VM settings
│   │   ├── VmBoot.tsx            Power on VM boot sequence
│   │   ├── GrubMenu.tsx          Dual-boot GRUB menu
│   │   ├── WindowsSetup.tsx      Windows Setup wizard
│   │   ├── WindowsOOBE.tsx       Windows first-boot setup
│   │   ├── Done.tsx              Completion + desktop
│   │   └── ...                   More scenes
│   ├── shared/          Reusable UI components
│   │   ├── SceneAdvance.tsx      Scene flow control
│   │   ├── ThemeProvider.tsx     9 themes
│   │   └── ErrorBoundary.tsx     Error handling
│   └── ...
├── data/               OS configurations (7 OSes)
├── machines/           XState state machine
└── pages/              Landing + simulation pages
```

---

## SEO & Uniqueness

This is the **only interactive OS installation simulator** on the web. There are tutorial videos, written guides, and virtual lab services — but nothing that lets you click through every step of installing Ubuntu, Windows, Arch, and more, in a realistic browser-based environment.

The simulator is used in classrooms, tech workshops, and by individuals learning to install operating systems for the first time — all without risk to their actual computer.

---

## License

[MIT](https://opensource.org/licenses/MIT)

<br />

<div align="center">

**Built with React, XState, and an unreasonable number of simulated reboots.**

</div>
