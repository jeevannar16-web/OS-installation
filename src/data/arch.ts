import type { OSConfig } from "./types";

export const arch: OSConfig = {
  id: "arch",
  stub: true,
  branding: {
    name: "Arch Linux",
    shortName: "Arch",
    accent: "#1793D1",
    surface: "#111111",
    logo: "🏹",
    officialUrl: "https://archlinux.org/download/",
  },
  downloadPage: {
    title: "Arch Linux — Download",
    url: "https://archlinux.org/download/",
    cta: "Download ISO",
    blurb: "A lightweight and flexible Linux distribution that follows the KISS principle.",
  },
  iso: { filename: "archlinux-2024.07.01-x86_64.iso", size: "1.1 GB" },
  flashers: [
    { id: "rufus", name: "Rufus", note: "Use DD image mode" },
    { id: "ventoy", name: "Ventoy", note: "Multi-ISO on one stick" },
    { id: "balena", name: "BalenaEtcher", note: "Also works" },
  ],
  wizard: [
    { kind: "language", title: "Arch ISO Boot", options: ["Arch Linux install medium (x86_64)"] },
    { kind: "keyboard", title: "Keymap", layouts: ["us", "uk", "dvorak"] },
    {
      kind: "disk",
      title: "Partition the disk",
      choices: [
        { id: "manual", label: "cfdisk / fdisk (manual)", hint: "You partition by hand on Arch." },
      ],
    },
    {
      kind: "account",
      title: "Set root & user",
      prompts: [
        { label: "Root password", placeholder: "••••••••", secret: true },
        { label: "Username", placeholder: "archuser" },
      ],
    },
    { kind: "confirm", title: "pacstrap", body: "Install the base system with pacstrap." },
  ],
  installTips: ["Booting into the live environment…", "You'll use the terminal for everything."],
  completion: {
    headline: "Arch is more hands-on — coming soon!",
    sub: "The manual terminal flow is stubbed. Full build planned for a later milestone.",
  },
};
