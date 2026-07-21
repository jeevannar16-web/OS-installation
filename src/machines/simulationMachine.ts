import { setup, assign } from "xstate";
import type { InstallPath, HostOS } from "../data/types";

/**
 * OS simulation state machine — realistic installation flows:
 *
 * Physical dual-boot:
 *   idle → searching → downloading → flashing_usb → disk_prep
 *        → bios_setup → rebooting → boot_prompt → boot_menu → installing
 *        → grub_menu → complete
 *   (Partitioning is handled INSIDE the Install.tsx wizard when "Something else" is selected)
 *
 * Physical dual-boot (Windows):
 *   idle → searching → downloading → flashing_usb → disk_prep
 *        → bios_setup → rebooting → boot_prompt → boot_menu → windows_setup
 *        → installing → grub_menu → oobe → complete
 *
 * Physical live-usb:
 *   idle → searching → downloading → flashing_usb → bios_setup
 *        → rebooting → boot_prompt → boot_menu → live_welcome → live_desktop
 *        → installing → grub_menu → complete
 *
 * VM:
 *   idle → select_host_os → searching → downloading → create_vm → mount_iso
 *        → vm_boot → installing → complete
 *
 * VM (Windows):
 *   idle → select_host_os → searching → downloading → create_vm → mount_iso
 *        → vm_boot → windows_setup → installing → vm_close → oobe → complete
 */

export type SimEvent =
  | { type: "START"; osId: string; path: InstallPath }
  | { type: "SET_HOST_OS"; hostOS: HostOS }
  | { type: "SEARCH_DONE" }
  | { type: "DOWNLOAD_DONE" }
  | { type: "FLASH_DONE" }
  | { type: "BIOS_DONE" }
  | { type: "BOOT_KEY_PRESSED" }
  | { type: "BOOT_KEY_TIMEOUT" }
  | { type: "REBOOT_DONE" }
  | { type: "BOOT_SELECTED" }
  | { type: "LIVE_TRY" }
  | { type: "LIVE_INSTALL" }
  | { type: "POST_INSTALL" }
  | { type: "SETUP_DONE" }
  | { type: "PARTITION_DONE" }
  | { type: "VM_CREATED" }
  | { type: "ISO_MOUNTED" }
  | { type: "VM_POWERED_ON" }
  | { type: "INSTALL_DONE" }
  | { type: "GRUB_DONE" }
  | { type: "OOBE_DONE" }
  | { type: "VM_CLOSED" }
  | { type: "DISK_PREPPED" }
  | { type: "SET_SPEED"; speed: "normal" | "fast" }
  | { type: "RESET" };

export type SimContext = {
  osId: string | null;
  path: InstallPath | null;
  hostOS: HostOS | null;
  speed: "normal" | "fast";
};

export const simulationMachine = setup({
  types: {
    context: {} as SimContext,
    events: {} as SimEvent,
  },
  guards: {
    isDualBoot: ({ context }) => context.path === "dual-boot",
    isLiveUsb: ({ context }) => context.path === "live-usb",
    isVm: ({ context }) => context.path === "vm",
    isPhysical: ({ context }) => context.path !== "vm",
    isWindows: ({ context }) => context.osId === "windows",
    isNotWindows: ({ context }) => context.osId !== "windows",
  },
  actions: {
    setMeta: assign(({ event }) => {
      if (event.type === "START") {
        return { osId: event.osId, path: event.path };
      }
      return {};
    }),
    setHostOS: assign(({ event }) => {
      if (event.type === "SET_HOST_OS") {
        return { hostOS: event.hostOS };
      }
      return {};
    }),
    setSpeed: assign(({ event }) => {
      if (event.type === "SET_SPEED") return { speed: event.speed };
      return {};
    }),
    clear: assign(() => ({ osId: null, path: null, hostOS: null, speed: "normal" })),
  },
}).createMachine({
  id: "simulation",
  initial: "idle",
  context: { osId: null, path: null, hostOS: null, speed: "normal" },
  on: {
    SET_SPEED: { actions: "setSpeed" },
    RESET: { target: ".idle", actions: "clear" },
  },
  states: {
    idle: {
      on: {
        START: [
          {
            target: "select_host_os",
            actions: "setMeta",
            guard: "isVm",
          },
          {
            target: "searching",
            actions: "setMeta",
          },
        ],
      },
    },
    select_host_os: {
      on: {
        SET_HOST_OS: {
          target: "searching",
          actions: "setHostOS",
        },
      },
    },

    searching: {
      on: { SEARCH_DONE: "downloading" },
    },

    downloading: {
      on: {
        DOWNLOAD_DONE: [
          { guard: "isVm", target: "create_vm" },
          { target: "flashing_usb" },
        ],
      },
    },

    /* ── Physical path: Flash USB ── */
    flashing_usb: {
      on: {
        FLASH_DONE: [
          { guard: "isDualBoot", target: "disk_prep" },
          { target: "bios_setup" },
        ],
      },
    },

    disk_prep: {
      on: { DISK_PREPPED: "bios_setup" },
    },

    /* ── BIOS Setup ── */
    bios_setup: {
      on: { BIOS_DONE: "rebooting" },
    },

    /* ── Reboot / POST ── */
    rebooting: {
      on: { REBOOT_DONE: "boot_prompt" },
    },

    /* ── Press any key to boot from USB ── */
    boot_prompt: {
      on: {
        BOOT_KEY_PRESSED: "boot_menu",
        BOOT_KEY_TIMEOUT: "boot_menu",
      },
    },

    /* ── Boot Menu ── */
    boot_menu: {
      on: {
        LIVE_TRY: "live_welcome",
        BOOT_SELECTED: [
          // Windows physical → windows_setup
          { guard: "isWindows", target: "windows_setup" },
          // Ubuntu dual-boot → installing (partitioning is now inside Install.tsx)
          { guard: "isDualBoot", target: "installing" },
          // Ubuntu live-usb → installing
          { target: "installing" },
        ],
      },
    },

    /* ── Windows Setup (only for Windows) ── */
    windows_setup: {
      on: {
        SETUP_DONE: [
          // Partitioning is now inside Install.tsx
          { target: "installing" },
        ],
      },
    },

    /* ── Live USB path ── */
    live_welcome: {
      on: {
        LIVE_TRY: "live_desktop",
        LIVE_INSTALL: "installing",
      },
    },

    live_desktop: {
      on: {
        LIVE_INSTALL: "installing",
        POST_INSTALL: "grub_menu",
      },
    },

    /* ── VM path ── */
    create_vm: {
      on: { VM_CREATED: "mount_iso" },
    },

    mount_iso: {
      on: { ISO_MOUNTED: "vm_boot" },
    },

    vm_boot: {
      on: {
        VM_POWERED_ON: [
          // Windows VM → windows_setup
          { guard: "isWindows", target: "windows_setup" },
          // Ubuntu VM → installing directly
          { target: "installing" },
        ],
      },
    },

    /* ── Installing ── */
    installing: {
      on: {
        INSTALL_DONE: [
          { guard: "isVm", target: "vm_close" },
          { target: "grub_menu" },
        ],
      },
    },

    /* ── GRUB Menu ── */
    grub_menu: {
      on: {
        GRUB_DONE: [
          // Windows → OOBE
          { guard: "isWindows", target: "oobe" },
          // Ubuntu → complete (no OOBE)
          { target: "complete" },
        ],
      },
    },

    /* ── OOBE (Windows only) ── */
    oobe: {
      on: { OOBE_DONE: "complete" },
    },

    vm_close: {
      on: {
        VM_CLOSED: [
          // Windows → OOBE
          { guard: "isWindows", target: "oobe" },
          // Ubuntu → complete
          { target: "complete" },
        ],
      },
    },

    complete: {},
  },
});

/** Ordered list of ALL possible scenes — filtered per-path in the UI. */
export const SIM_SCENES = [
  "idle",
  "select_host_os",
  "searching",
  "downloading",
  "flashing_usb",
  "disk_prep",
  "bios_setup",
  "rebooting",
  "boot_prompt",
  "boot_menu",
  "windows_setup",
  "live_welcome",
  "live_desktop",
  "create_vm",
  "mount_iso",
  "vm_boot",
  "installing",
  "grub_menu",
  "oobe",
  "vm_close",
  "complete",
] as const;
