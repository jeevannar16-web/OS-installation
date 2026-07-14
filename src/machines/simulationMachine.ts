import { setup, assign } from "xstate";
import type { InstallPath } from "../data/types";

/**
 * Generic, OS/path-agnostic simulation state machine.
 *
 * Flow (dual-boot):
 *   idle → searching → downloading → flashing_usb → usb_reinsert → rebooting → boot_menu
 *        → partitioning → installing → complete
 *
 * Flow (vm):
 *   idle → searching → downloading → flashing_usb → usb_reinsert → rebooting → boot_menu
 *        → installing → vm_close → complete
 *
 * Flow (live-usb):
 *   idle → searching → downloading → flashing_usb → usb_reinsert → rebooting → boot_menu
 *        → live_welcome → live_desktop → installing → complete
 */

export type SimEvent =
  | { type: "START"; osId: string; path: InstallPath }
  | { type: "SEARCH_DONE" }
  | { type: "DOWNLOAD_DONE" }
  | { type: "FLASH_DONE" }
  | { type: "USB_INSERTED" }
  | { type: "REBOOT_DONE" }
  | { type: "BOOT_SELECTED" }
  | { type: "LIVE_TRY" }
  | { type: "LIVE_INSTALL" }
  | { type: "PARTITION_DONE" }
  | { type: "INSTALL_DONE" }
  | { type: "VM_CLOSED" }
  | { type: "SET_SPEED"; speed: "normal" | "fast" }
  | { type: "RESET" };

export type SimContext = {
  osId: string | null;
  path: InstallPath | null;
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
  },
  actions: {
    setMeta: assign(({ event }) => {
      if (event.type === "START") {
        return { osId: event.osId, path: event.path };
      }
      return {};
    }),
    setSpeed: assign(({ event }) => {
      if (event.type === "SET_SPEED") return { speed: event.speed };
      return {};
    }),
    clear: assign(() => ({ osId: null, path: null, speed: "normal" })),
  },
}).createMachine({
  id: "simulation",
  initial: "idle",
  context: { osId: null, path: null, speed: "normal" },
  on: {
    SET_SPEED: { actions: "setSpeed" },
    RESET: { target: ".idle", actions: "clear" },
  },
  states: {
    idle: {
      on: {
        START: {
          target: "searching",
          actions: "setMeta",
        },
      },
    },

    searching: {
      on: { SEARCH_DONE: "downloading" },
    },

    downloading: {
      on: { DOWNLOAD_DONE: "flashing_usb" },
    },

    flashing_usb: {
      on: { FLASH_DONE: "usb_reinsert" },
    },

    usb_reinsert: {
      on: { USB_INSERTED: "rebooting" },
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

    installing: {
      on: {
        INSTALL_DONE: [
          { guard: "isVm", target: "vm_close" },
          { target: "complete" },
        ],
      },
    },

    vm_close: {
      on: { VM_CLOSED: "complete" },
    },

    complete: {
      type: "final",
    },
  },
});

/** Ordered list of scenes used by the persistent progress indicator. */
export const SIM_SCENES = [
  "idle",
  "searching",
  "downloading",
  "flashing_usb",
  "usb_reinsert",
  "rebooting",
  "boot_menu",
  "partitioning",
  "live_welcome",
  "live_desktop",
  "installing",
  "vm_close",
  "complete",
] as const;
