import type { OSConfig } from "./types";

export const windows: OSConfig = {
  id: "windows",
  branding: {
    name: "Windows 11",
    shortName: "Windows",
    accent: "#0078D4",
    surface: "#0a0a0a",
    logo: "🪟",
    officialUrl: "https://www.microsoft.com/software-download/windows11",
  },
  downloadPage: {
    title: "Download Windows 11",
    url: "https://www.microsoft.com/software-download/windows11",
    cta: "Download ISO (64-bit)",
    blurb: "Create Windows 11 installation media, or download the ISO to build your own.",
  },
  iso: { filename: "Win11_24H2_English_x64.iso", size: "6.5 GB" },
  flashers: [
    { id: "rufus", name: "Rufus", note: "Recommended for Windows ISOs" },
    { id: "ventoy", name: "Ventoy", note: "Multi-ISO on one stick" },
    { id: "balena", name: "BalenaEtcher", note: "Also works" },
  ],
  wizard: [
    { kind: "language", title: "Windows Setup", options: ["English (United States)", "English (United Kingdom)", "Español", "Français"] },
    { kind: "keyboard", title: "Keyboard layout", layouts: ["US", "UK", "International"] },
    {
      kind: "disk",
      title: "Where do you want to install Windows?",
      choices: [
        { id: "drive0", label: "Drive 0 Unallocated Space", hint: "Fresh install — erases everything." },
        { id: "shrink", label: "Shrink an existing partition", hint: "Make room for dual boot." },
      ],
    },
    {
      kind: "account",
      title: "Let's set up your account",
      prompts: [
        { label: "Country or region", placeholder: "United States" },
        { label: "Microsoft account email", placeholder: "you@outlook.com" },
        { label: "Create a PIN", placeholder: "••••" },
      ],
    },
    {
      kind: "confirm",
      title: "All set",
      body: "Windows will finish setting up your device. This might take a few minutes.",
    },
  ],
  installTips: [
    "Copying Windows files…",
    "Getting files ready for installation…",
    "Installing features…",
    "Installing updates…",
    "Finishing up…",
  ],
  completion: {
    headline: "You just simulated installing Windows 11! 🎉",
    sub: "Same flow you'll see on real hardware. Go make that bootable USB for real.",
  },
};
