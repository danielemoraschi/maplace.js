import type { ProviderFactory } from "./index";
import { MaplaceLocation } from "./location-element";
import { MaplaceMap } from "./map-element";
import { registerProvider } from "./providers";
import { MAPLACE_VERSION } from "./version";

let otherCopyReported = false;

/**
 * Defines `<maplace-map>` and `<maplace-location>` once per page. When another copy of maplace
 * defined either first, its element stays, and this copy says so: its providers are not seen, or
 * its maps can't read the other copy's location children.
 */
export function defineElements(): void {
  const map = customElements.get("maplace-map");
  if (map !== undefined) {
    if (map !== MaplaceMap) reportOtherCopy("maplace-map", map);
    return;
  }
  const location = customElements.get("maplace-location");
  if (location === undefined) customElements.define("maplace-location", MaplaceLocation);
  else if (location !== MaplaceLocation) reportOtherCopy("maplace-location", location);
  customElements.define("maplace-map", MaplaceMap);
}

/**
 * Registers a provider under a name for `<maplace-map provider="…">`, and defines the elements
 * if needed. Throws for a name already taken by another provider.
 */
export function defineProvider(name: string, factory: ProviderFactory): void {
  registerProvider(name, factory);
  defineElements();
}

function reportOtherCopy(name: string, defined: CustomElementConstructor): void {
  if (otherCopyReported) return;
  otherCopyReported = true;
  const other = (defined as { maplaceVersion?: unknown }).maplaceVersion ?? "(unknown version)";
  console.error(
    `maplace ${MAPLACE_VERSION}: <${name}> is already defined by maplace ${String(other)}. ` +
      "Load one copy of maplace per page.",
  );
}
