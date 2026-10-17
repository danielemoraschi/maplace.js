import type { ConsentStore } from "./consent-store.ts";

export interface ConsentControls {
  readonly document: Document;
  readonly store: ConsentStore;
  /** Lets the site's maps load (`gateMaps`). */
  readonly openMaps: () => void;
  /** Reloads the page: Maps JS can't be unloaded, so turning maps off starts the page again. */
  readonly reload: () => void;
}

/**
 * The site's consent to Google Maps, on the page: every placeholder's "Load Google Maps" and the
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

  for (const button of document.querySelectorAll("[data-maps-grant]")) {
    button.addEventListener("click", grant);
  }
  for (const toggle of document.querySelectorAll("[data-maps-toggle]")) {
    toggle.addEventListener("click", toggleMaps);
  }
  if (store.isGranted()) turnMapsOn();
}
