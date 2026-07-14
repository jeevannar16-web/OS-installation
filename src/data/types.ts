/**
 * Shared types for the data-driven OS simulation config.
 *
 * The goal of this module is to make "adding a new OS" mostly a data-entry exercise:
 * every scene component reads from a `OSConfig` so new operating systems can be dropped
 * in (see src/data/*.ts) without writing new components.
 */

export type InstallPath = "vm" | "dual-boot" | "live-usb";

export const ALL_PATHS: InstallPath[] = ["vm", "dual-boot", "live-usb"];

export type PathInfo = {
  id: InstallPath;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  /** Some paths don't make sense for every OS; restrict where needed. */
  supported: boolean;
};

export type Branding = {
  name: string;
  /** Short label used in chips / breadcrumbs. */
  shortName: string;
  /** Accent color used across the simulation chrome for this OS. */
  accent: string;
  /** Base background color for fake installer windows. */
  surface: string;
  /** Emoji or short glyph used as a lightweight logo in the grid / headers. */
  logo: string;
  /** Real, official download URL (used in the final "do it for real" card). */
  officialUrl: string;
};

/**
 * A single installer-wizard step. Scenes render these generically; OS-specific
 * quirks (e.g. Windows product key) are expressed via `kind` discriminators.
 */
export type WizardStep =
  | { kind: "language"; title: string; options: string[] }
  | { kind: "keyboard"; title: string; layouts: string[] }
  | { kind: "network"; title: string; interfaces: { id: string; label: string; signal?: number }[] }
  | { kind: "timezone"; title: string; zones: string[] }
  | {
      kind: "disk";
      title: string;
      /** e.g. "Erase disk and install", "Install alongside", "Something else". */
      choices: { id: string; label: string; hint: string }[];
    }
  | { kind: "account"; title: string; prompts: { label: string; placeholder: string; secret?: boolean }[] }
  | { kind: "confirm"; title: string; body: string };

export type OSConfig = {
  id: string;
  branding: Branding;
  /** Marks stubbed OSes that render placeholder content. */
  stub?: boolean;
  /** Mock content for the fake download page (scene 2). */
  downloadPage: {
    title: string;
    /** The query the user "types" into the fake browser search box. */
    searchTerm: string;
    /** Host shown in the green search-result URL, e.g. ubuntu.com. */
    host: string;
    url: string;
    cta: string;
    blurb: string;
    /** Optional version selector entries on the download page. */
    versions?: string[];
    /** Label above the version selector. */
    selectorLabel?: string;
  };
  /** ISO artifact metadata shown in the fake file manager. */
  iso: { filename: string; size: string };
  /** Which flashing tools are offered (scene 3) — purely cosmetic. */
  flashers: { id: string; name: string; note: string }[];
  /** Per-OS installer wizard (scene 6). */
  wizard: WizardStep[];
  /** Tips that rotate during the install progress bar. */
  installTips: string[];
  /** Keywords the fake browser search matches against to show relevant results. */
  searchKeywords: string[];
  /** Final completion card copy. */
  completion: { headline: string; sub: string };
};

export type OSData = Record<string, OSConfig>;
