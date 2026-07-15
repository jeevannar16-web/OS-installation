import type { OSConfig } from "./types";

export const arch: OSConfig = {
  id: "arch",
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
    searchTerm: "download arch linux",
    host: "archlinux.org",
    url: "https://archlinux.org/download/",
    cta: "Download ISO",
    blurb: "A lightweight and flexible Linux distribution that follows the KISS principle.",
    versions: ["archlinux-2024.07.01-x86_64.iso"],
    selectorLabel: "Latest release",
  },
  iso: { filename: "archlinux-2024.07.01-x86_64.iso", size: "1.1 GB" },
  flashers: [
    { id: "rufus", name: "Rufus", note: "Use DD image mode" },
    { id: "ventoy", name: "Ventoy", note: "Multi-ISO on one stick" },
    { id: "balena", name: "BalenaEtcher", note: "Also works" },
  ],
  wizard: [],
  installTips: [
    "Booting into the live environment…",
    "Setting up the terminal…",
    "You'll use the terminal for everything.",
  ],
  searchKeywords: ["arch linux", "download arch", "arch iso", "archlinux", "arch linux download"],
  completion: {
    headline: "You just installed Arch Linux — the hard way! 🏹",
    sub: "You used the terminal for everything. That's the Arch way.",
  },
  vmConfig: {
    osType: "Linux",
    osVersion: "Arch Linux (64-bit)",
    defaultMemoryMB: 2048,
    defaultDiskGB: 20,
    hasNoGUIInstall: true,
  },
};
