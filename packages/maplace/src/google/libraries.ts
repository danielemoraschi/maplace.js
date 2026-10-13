/// <reference types="google.maps" />
import { MaplaceError } from "../errors";

type Libraries = google.maps.ImportLibraryMap;

/**
 * A Maps JS library, from the Maps JS the page loaded (Google's bootstrap or js-api-loader put
 * `importLibrary` there). Google caches each library per page, so nothing is cached here.
 */
export async function loadLibrary<K extends keyof Libraries>(name: K): Promise<Libraries[K]> {
  if (!canImportLibraries()) {
    throw new MaplaceError(
      "provider-load-failed",
      "attach: google.maps.importLibrary is missing; load Maps JS (Google's bootstrap or " +
        "js-api-loader) before attaching",
    );
  }
  return google.maps.importLibrary(name);
}

function canImportLibraries(): boolean {
  return typeof google === "object" && typeof google.maps?.importLibrary === "function";
}
