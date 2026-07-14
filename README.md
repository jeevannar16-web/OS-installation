<div align="center">

# 💿 OS Install Simulator

**Practice installing an operating system before you actually do it.**

An interactive, fully-scripted simulation that walks you through installing Ubuntu, Windows, and
more — via Virtual Machine, Dual Boot, or Live USB — using a convincingly realistic fake-OS UI
theater. No real emulator, no risk. Just confidence.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Built with React](https://img.shields.io/badge/Built%20with-React%20%2B%20Vite-61dafb?logo=react&logoColor=white)](https://react.dev)
[![State Machine: XState](https://img.shields.io/badge/State%20Machine-XState-000000?logo=xstate&logoColor=white)](https://stately.ai/docs/xstate)
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg)](#contributing)

</div>

---

## ✨ Why?

Buying a USB stick, downloading an ISO, and rebooting into a BIOS menu for the first time is
intimidating. **OS Install Simulator** lets you rehearse the entire process in a safe, guided,
visually faithful environment — so that when you sit down at real hardware, you already know
exactly what to expect at every click.

Think of it like [learngitbranching](https://learngitbranching.js.org/) — but for OS installation.

## 🚀 Features

- 🖥️ **Three realistic paths** — Virtual Machine, Dual Boot, and Live USB, each with its own flow.
- 🧭 **Guided, interactive scenes** — search & download the ISO, flash a USB drive (Rufus /
  Ventoy / BalenaEtcher style), navigate a fake BIOS boot menu, partition a disk with a slider,
  and run through a faithfully recreated installer wizard.
- 🐧 🪟 **Multi-OS support** — Ubuntu and Windows 11 fully built; Arch, Debian, and Fedora
  stubbed on the same data-driven engine.
- ⚙️ **Real finite state machines** — every simulation is modeled with XState for predictable,
  consistent behavior.
- 🎞️ **Premium UI** — dark theme, glassmorphism, smooth Framer Motion scene transitions.
- 🐢 **Speed toggle** — skip or fast-forward animations when you just want to click through.
- 🌐 **100% client-side** — static-hostable on Vercel / Netlify / GitHub Pages. No backend.

## 🧱 Tech Stack

| Layer        | Choice                                            |
| ------------ | ------------------------------------------------- |
| Framework    | React + Vite + TypeScript                         |
| Styling      | Tailwind CSS                                      |
| Animation    | Framer Motion                                     |
| State        | XState (simulation state machines)                |
| Drag & Drop  | dnd-kit / native HTML5 DnD                        |
| Routing      | React Router                                      |

## 🗺️ Simulation Flow

```text
idle → searching → downloading → flashing_usb → rebooting
     → boot_menu → partitioning (dual boot) → installing → complete
```

> The VM path skips the physical framing of scenes 1–4 but keeps the same installer wizard.

## 📦 Getting Started (Local Dev)

```bash
# 1. Clone
git clone https://github.com/jeevannar16-web/OS-installation.git
cd OS-installation

# 2. Install dependencies
npm install

# 3. Run the dev server
npm run dev
```

Open the printed local URL in your browser. 🎉

## 🤝 Contributing

Contributions are very welcome — whether that's adding a new OS data file, polishing a scene,
or fixing a typo.

1. Fork the repo and create your branch (`git checkout -b feature/my-os`).
2. Make your changes.
3. Commit (`git commit -m "Add Fedora installer data"`) and push.
4. Open a Pull Request.

Adding a new OS is mostly **data entry** — drop a config into `src/data/<os>.ts` and the
existing scene components render it.

## 📄 License

Released under the [MIT License](https://opensource.org/licenses/MIT).

---

<div align="center">

Made with ☕ and way too many reboot simulations.

⭐ If this helped you, consider starring the repo!

</div>
