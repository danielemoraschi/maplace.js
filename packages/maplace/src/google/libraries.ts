/// <reference types="google.maps" />
import { MaplaceError } from "../errors";

/** The Maps JS libraries the adapter draws with. */
export interface GoogleLibraries {
  readonly core: google.maps.CoreLibrary;
  readonly maps: google.maps.MapsLibrary;
  readonly marker: google.maps.MarkerLibrary;
}

/**
 * Every library the adapter needs, together, from the Maps JS the page loaded (Google's bootstrap
 * or js-api-loader put `importLibrary` there). Google caches each library per page, so nothing is
 * cached here.
 */
export async function loadLibraries(): Promise<GoogleLibraries> {
  if (!canImportLibraries()) {
    throw new MaplaceError(
      "provider-load-failed",
      "attach: google.maps.importLibrary is missing; load Maps JS (Google's bootstrap or " +
        "js-api-loader) before attaching",
    );
  }
  const [core, maps, marker] = await Promise.all([
    google.maps.importLibrary("core"),
    google.maps.importLibrary("maps"),
    google.maps.importLibrary("marker"),
  ]);
  return { core, maps, marker };
}

function canImportLibraries(): boolean {
  return typeof google === "object" && typeof google.maps?.importLibrary === "function";
}

/**
 * Google's routes library, on the first route: a map that draws none never fetches it. Called
 * once the map is open, so Maps JS is on the page.
 */
export function loadRoutesLibrary(): Promise<google.maps.RoutesLibrary> {
  return google.maps.importLibrary("routes");
}
