import type { OSConfig } from "./types";

export const fedora: OSConfig = {
  id: "fedora",
  stub: true,
  branding: {
    name: "Fedora",
    shortName: "Fedora",
    accent: "#3C6EB4",
    surface: "#0d1117",
    logo: "🎩",
    officialUrl: "https://fedoraproject.org/workstation/",
  },
  downloadPage: {
    title: "Fedora Workstation",
    searchTerm: "download fedora",
    host: "fedoraproject.org",
    url: "https://fedoraproject.org/workstation/",
    cta: "Download now",
    blurb: "A reliable, user-friendly, and powerful operating system built by the community.",
    versions: ["Fedora 41 Workstation", "Fedora 41 KDE", "Fedora 41 Server"],
    selectorLabel: "Choose your edition",
  },
  iso: { filename: "Fedora-Workstation-Live-x86_64-41.iso", size: "2.4 GB" },
  flashers: [
    { id: "balena", name: "BalenaEtcher", note: "Fedora's recommended flasher" },
    { id: "rufus", name: "Rufus", note: "Also works" },
    { id: "ventoy", name: "Ventoy", note: "Multi-ISO on one stick" },
  ],
  wizard: [
    { kind: "language", title: "Welcome to Fedora", options: ["English", "Español", "Français"] },
    { kind: "keyboard", title: "Keyboard", layouts: ["English (US)", "English (UK)"] },
    {
      kind: "disk",
      title: "Installation Destination",
      choices: [
        { id: "auto", label: "Automatic partitioning", hint: "Let Anaconda decide." },
        { id: "custom", label: "Custom", hint: "Manual layout via Blivet." },
      ],
    },
    {
      kind: "account",
      title: "Create user",
      prompts: [
        { label: "Full name", placeholder: "Fedora User" },
        { label: "Username", placeholder: "fedora" },
        { label: "Password", placeholder: "••••••••", secret: true },
      ],
    },
    { kind: "confirm", title: "Begin Installation", body: "Anaconda will now write changes to disk." },
  ],
  installTips: ["Writing disk image…", "Setting up packages…", "Configuring system…"],
  searchKeywords: ["fedora", "download fedora", "fedora iso", "fedora workstation", "fedora linux"],
  completion: {
    headline: "Fedora flow is stubbed — coming soon!",
    sub: "Reusing the same components; data only needs filling in.",
  },
};
