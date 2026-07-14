import type { OSConfig } from "./types";

export const ubuntu: OSConfig = {
  id: "ubuntu",
  branding: {
    name: "Ubuntu",
    shortName: "Ubuntu",
    accent: "#E95420",
    surface: "#2c001e",
    logo: "🐧",
    officialUrl: "https://ubuntu.com/download/desktop",
  },
  downloadPage: {
    title: "Download Ubuntu Desktop",
    searchTerm: "download ubuntu",
    host: "ubuntu.com",
    url: "https://ubuntu.com/download/desktop",
    cta: "Download Ubuntu 24.04 LTS",
    blurb:
      "The Ubuntu desktop is easy to use, free to download, and a world of customisation options.",
    versions: ["Ubuntu 24.04.1 LTS", "Ubuntu 22.04.5 LTS", "Ubuntu 20.04.6 LTS"],
    selectorLabel: "Download the latest LTS version",
  },
  iso: { filename: "ubuntu-24.04.1-desktop-amd64.iso", size: "5.9 GB" },
  flashers: [
    { id: "balena", name: "BalenaEtcher", note: "Simplest — flash & done" },
    { id: "rufus", name: "Rufus", note: "Fast, Windows-friendly" },
    { id: "ventoy", name: "Ventoy", note: "Multi-ISO on one stick" },
  ],
  wizard: [
    { kind: "language", title: "Welcome", options: ["English", "Español", "Français", "Deutsch", "中文"] },
    { kind: "keyboard", title: "Keyboard layout", layouts: ["English (US)", "English (UK)", "Dvorak", "Colemak"] },
    {
      kind: "disk",
      title: "Installation type",
      choices: [
        { id: "erase", label: "Erase disk and install Ubuntu", hint: "Wipes the whole drive. Use for VMs." },
        { id: "alongside", label: "Install Ubuntu alongside", hint: "Shrinks Windows and dual-boots." },
        { id: "something", label: "Something else", hint: "Manual partitions (advanced)." },
      ],
    },
    {
      kind: "account",
      title: "Who are you?",
      prompts: [
        { label: "Your name", placeholder: "Ada Lovelace" },
        { label: "Your computer's name", placeholder: "ada-ubuntu" },
        { label: "Pick a username", placeholder: "ada" },
        { label: "Choose a password", placeholder: "••••••••", secret: true },
      ],
    },
    {
      kind: "confirm",
      title: "Ready to install",
      body: "You will be able to review your choices before the installation begins.",
    },
  ],
  installTips: [
    "Installing the base system…",
    "Configuring hardware drivers…",
    "Setting up the desktop environment…",
    "Creating your user account…",
    "Almost there — finishing up…",
  ],
  searchKeywords: [
    "ubuntu",
    "download ubuntu",
    "ubuntu iso",
    "ubuntu linux",
    "linux ubuntu",
    "ubuntu 24.04",
  ],
  completion: {
    headline: "You just simulated installing Ubuntu! 🎉",
    sub: "That was the full dual-boot flow. You're ready to try it on real hardware.",
  },
};
