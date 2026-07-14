import type { OSConfig } from "./types";

export const debian: OSConfig = {
  id: "debian",
  stub: true,
  branding: {
    name: "Debian",
    shortName: "Debian",
    accent: "#A80030",
    surface: "#101010",
    logo: "🌀",
    officialUrl: "https://www.debian.org/distrib/",
  },
  downloadPage: {
    title: "Debian — Getting Debian",
    url: "https://www.debian.org/distrib/",
    cta: "Download a small installation image",
    blurb: "The Universal Operating System — stable, free, and community-driven.",
  },
  iso: { filename: "debian-12.7.0-amd64-netinst.iso", size: "0.7 GB" },
  flashers: [
    { id: "rufus", name: "Rufus", note: "Recommended" },
    { id: "ventoy", name: "Ventoy", note: "Multi-ISO on one stick" },
    { id: "balena", name: "BalenaEtcher", note: "Also works" },
  ],
  wizard: [
    { kind: "language", title: "Debian Installer", options: ["English", "Español", "Français", "Deutsch"] },
    { kind: "keyboard", title: "Keyboard layout", layouts: ["American English", "British English"] },
    {
      kind: "disk",
      title: "Partition disks",
      choices: [
        { id: "guided", label: "Guided - use entire disk", hint: "Easiest option." },
        { id: "manual", label: "Manual", hint: "Advanced partitioning." },
      ],
    },
    {
      kind: "account",
      title: "Set up users",
      prompts: [
        { label: "Full name", placeholder: "Debian User" },
        { label: "Username", placeholder: "debian" },
        { label: "Password", placeholder: "••••••••", secret: true },
      ],
    },
    { kind: "confirm", title: "Finish", body: "Install the GRUB boot loader to the disk." },
  ],
  installTips: ["Detecting hardware…", "Installing the base system…", "Configuring apt…"],
  completion: {
    headline: "Debian flow is stubbed — coming soon!",
    sub: "Reusing the same components; data only needs filling in.",
  },
};
