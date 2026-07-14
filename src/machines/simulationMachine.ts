import { setup, assign } from "xstate";
import type { InstallPath } from "../data/types";

/**
 * Generic, OS/path-agnostic simulation state machine.
 *
 * Flow:
 *   idle → searching → downloading → flashing_usb → rebooting → boot_menu
 *        → partitioning (dual boot only) → installing → complete
 *
 * The VM path reuses the same wizard but conceptually skips the physical framing;
 * the dual-boot path inserts a `partitioning` state between boot_menu and installing.
 *
 * The "Live USB" path diverges from `boot_menu` directly into a live desktop and then
 * `complete` (no `installing` step) — modeled via the `LIVE_DONE` event below.
 */

export type SimEvent =
  | { type: "START"; osId: string; path: InstallPath }
  | { type: "SEARCH_DONE" }
  | { type: "DOWNLOAD_DONE" }
  | { type: "FLASH_DONE" }
  | { type: "REBOOT_DONE" }
  | { type: "BOOT_SELECTED" }
  | { type: "LIVE_DONE" } // live-usb path: boot into live desktop, skip install
  | { type: "PARTITION_DONE" }
  | { type: "INSTALL_DONE" }
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
      on: { FLASH_DONE: "rebooting" },
    },

    rebooting: {
      on: { REBOOT_DONE: "boot_menu" },
    },

    boot_menu: {
      on: {
        // Live USB never installs — boots straight into a desktop, then completes.
        LIVE_DONE: "complete",
        // Dual boot and VM both continue; dual boot first partitions.
        BOOT_SELECTED: [
          { guard: "isDualBoot", target: "partitioning" },
          { target: "installing" },
        ],
      },
    },

    partitioning: {
      on: { PARTITION_DONE: "installing" },
    },

    installing: {
      on: { INSTALL_DONE: "complete" },
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
  "rebooting",
  "boot_menu",
  "partitioning",
  "installing",
  "complete",
] as const;
