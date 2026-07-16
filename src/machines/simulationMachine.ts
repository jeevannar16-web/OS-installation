import { setup, assign } from "xstate";
import type { InstallPath, HostOS } from "../data/types";

/**
 * OS simulation state machine — two distinct flows:
 *
 * Physical path (dual-boot / live-usb):
 *   idle → searching → downloading → flashing_usb → usb_reinsert → rebooting → boot_menu
 *        → [partitioning | live_welcome → live_desktop] → installing → complete
 *
 * VM path:
 *   idle → searching → downloading → create_vm → mount_iso → vm_boot → installing → vm_close → complete
 */

export type SimEvent =
  | { type: "START"; osId: string; path: InstallPath }
  | { type: "SET_HOST_OS"; hostOS: HostOS }
  | { type: "SEARCH_DONE" }
  | { type: "DOWNLOAD_DONE" }
  | { type: "FLASH_DONE" }
  | { type: "USB_INSERTED" }
  | { type: "REBOOT_DONE" }
  | { type: "BOOT_SELECTED" }
  | { type: "LIVE_TRY" }
  | { type: "LIVE_INSTALL" }
  | { type: "PARTITION_DONE" }
  | { type: "VM_CREATED" }
  | { type: "ISO_MOUNTED" }
  | { type: "VM_POWERED_ON" }
  | { type: "INSTALL_DONE" }
  | { type: "GRUB_DONE" }
  | { type: "FIRST_BOOT_DONE" }
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

    /* ── Physical path states ── */
    flashing_usb: {
      on: { FLASH_DONE: "usb_reinsert" },
    },

    usb_reinsert: {
      on: {
        USB_INSERTED: [
          { guard: "isDualBoot", target: "disk_prep" },
          { target: "rebooting" },
        ],
      },
    },

    disk_prep: {
      on: { DISK_PREPPED: "rebooting" },
    },

    rebooting: {
      on: { REBOOT_DONE: "boot_menu" },
    },

    boot_menu: {
      on: {
        LIVE_TRY: "live_welcome",
        BOOT_SELECTED: [
          { guard: "isDualBoot", target: "partitioning" },
          { target: "installing" },
        ],
      },
    },

    live_welcome: {
      on: {
        LIVE_TRY: "live_desktop",
        LIVE_INSTALL: "installing",
      },
    },

    live_desktop: {
      on: { LIVE_INSTALL: "installing" },
    },

    partitioning: {
      on: { PARTITION_DONE: "installing" },
    },

    /* ── VM path states ── */
    create_vm: {
      on: { VM_CREATED: "mount_iso" },
    },

    mount_iso: {
      on: { ISO_MOUNTED: "vm_boot" },
    },

    vm_boot: {
      on: { VM_POWERED_ON: "installing" },
    },

    /* ── Shared terminal states ── */
    installing: {
      on: {
        INSTALL_DONE: [
          { guard: "isVm", target: "vm_close" },
          { target: "grub_menu" },
        ],
      },
    },

    grub_menu: {
      on: { GRUB_DONE: "first_boot" },
    },

    first_boot: {
      on: { FIRST_BOOT_DONE: "complete" },
    },

    vm_close: {
      on: { VM_CLOSED: "complete" },
    },

    complete: {
      type: "final",
    },
  },
});

/** Ordered list of ALL possible scenes — filtered per-path in the UI. */
export const SIM_SCENES = [
  "idle",
  "select_host_os",
  "searching",
  "downloading",
  "flashing_usb",
  "usb_reinsert",
  "disk_prep",
  "rebooting",
  "boot_menu",
  "partitioning",
  "live_welcome",
  "live_desktop",
  "create_vm",
  "mount_iso",
  "vm_boot",
  "installing",
  "grub_menu",
  "first_boot",
  "vm_close",
  "complete",
] as const;
