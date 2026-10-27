import type { ConsentStore } from "./consent-store.ts";

export interface ConsentControls {
  readonly document: Document;
  readonly store: ConsentStore;
  /** Lets the site's maps load: the page's consent latch turned on (`map-gate.ts`). */
  readonly openMaps: () => void;
  /** Reloads the page: Maps JS can't be unloaded, so turning maps off starts the page again. */
  readonly reload: () => void;
}

/**
 * The site's one consent to its maps, on the page: every placeholder's "Load maps" and the
 * footer's toggle. `<html data-maps>` says which, `on` or `off`, for the styles: the page's head
 * sets it from the kept consent before first paint, and this sets it again whenever the maps open,
 * so they never load under their placeholders. Turning maps off reloads the page.
 */
export function startConsent({ document, store, openMaps, reload }: ConsentControls): void {
  function turnMapsOn(): void {
    document.documentElement.dataset.maps = "on";
    openMaps();
  }

  function grant(): void {
    store.grant();
    turnMapsOn();
  }

  function toggleMaps(): void {
    if (store.isGranted()) {
      store.revoke();
      reload();
    } else {
      grant();
    }
  }

  // On the document, so a placeholder in a group's panel added later grants too.
  document.addEventListener("click", ({ target }) => {
    if (!(target instanceof Element)) return;
    if (target.closest("[data-maps-grant]")) grant();
    else if (target.closest("[data-maps-toggle]")) toggleMaps();
  });
  if (store.isGranted()) turnMapsOn();
}
