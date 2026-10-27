import type { MaplaceMapElement } from "maplace/element";
import { type ConsentLatch, gateMaps } from "../consent/map-gate.ts";
import type { WhenVisible } from "../consent/when-visible.ts";
import { startFailureNotes } from "./map-failures.ts";
import { startReloadButtons } from "./reload-buttons.ts";
import { startTabs } from "./tabs.ts";

/** What starting the sections under a root needs from the page, wired once for the page. */
export interface SectionStarting {
  readonly whenVisible: WhenVisible;
  /** Lets a page's map load: its element and `Maplace` loaded, its page scripts run. */
  readonly release: (map: MaplaceMapElement) => Promise<void>;
  /** Starts a script, vanilla or React version: its provider readied, its program run. */
  readonly startVersion: (version: HTMLElement) => Promise<void>;
  /** Adds the root's sections to those the page's provider toggle switches. */
  readonly followToggle: (root: ParentNode) => void;
  readonly reload: () => void;
  /** Opens the maps once the visitor consents, at once if they have. */
  readonly latch: ConsentLatch;
}

/**
 * Returns what starts the example sections under a root, the page itself at load or a group's
 * panel added later (`group-switch.ts`): its Map/code tabs, its version switches on the page's
 * toggle, its failure notes and reload buttons, then its maps and versions, held until consent
 * and released as each comes into view. A root is started once.
 */
export function sectionStarter({
  whenVisible,
  release,
  startVersion,
  followToggle,
  reload,
  latch,
}: SectionStarting): (root: ParentNode) => void {
  return (root) => {
    const maps = [...root.querySelectorAll<MaplaceMapElement>("maplace-map[hold]")];
    const versions = [
      ...root.querySelectorAll<HTMLElement>('[data-live-version]:not([data-live-version="html"])'),
    ];
    // Tabs first: a section with no version on the provider shown goes back to its Map tab.
    startTabs(root);
    followToggle(root);
    startReloadButtons(root, reload);
    startFailureNotes(maps);
    latch.whenOn(gateMaps(maps, { whenVisible, release }));
    latch.whenOn(gateMaps(versions, { whenVisible, release: startVersion }));
  };
}
