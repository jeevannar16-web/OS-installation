import type { InstallPath, PathInfo, OSData } from "./types";
import { ubuntu } from "./ubuntu";
import { windows } from "./windows";
import { arch } from "./arch";
import { zorin } from "./zorin";
import { mint } from "./mint";
import { debian } from "./debian";
import { fedora } from "./fedora";

export const OS_REGISTRY: OSData = {
  ubuntu,
  windows,
  arch,
  zorin,
  mint,
  fedora,
  debian,
};

export const OS_LIST = Object.values(OS_REGISTRY);

export function getOS(id: string | undefined): OSData[string] | undefined {
  if (!id) return undefined;
  return OS_REGISTRY[id];
}

export const PATHS: PathInfo[] = [
  {
    id: "vm" as InstallPath,
    name: "Virtual Machine",
    tagline: "Safest first try",
    description:
      "Run the installer inside VirtualBox or VMware — no risk to your real files. Perfect for a first rehearsal.",
    icon: "🖥️",
    supported: true,
  },
  {
    id: "dual-boot" as InstallPath,
    name: "Dual Boot",
    tagline: "Keep your OS + add Linux",
    description:
      "Boot from a USB stick, shrink your disk, and install alongside Windows. Includes the BIOS menu & GRUB.",
    icon: "🔀",
    supported: true,
  },
  {
    id: "live-usb" as InstallPath,
    name: "Live USB",
    tagline: "Try it, no install",
    description:
      "Flash a USB, boot into a working desktop, and explore the OS without touching your hard drive.",
    icon: "📀",
    supported: true,
  },
  {
    id: "practical" as InstallPath,
    name: "Practical Guide",
    tagline: "Real install",
    description:
      "Step-by-step guide with real terminal commands for an actual installation on your hardware.",
    icon: "📖",
    supported: true,
  },
];
