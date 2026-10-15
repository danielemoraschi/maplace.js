import type { ProviderFactory } from "./index";
import { MaplaceLocation } from "./location-element";
import { MaplaceMap } from "./map-element";
import { registerProvider } from "./providers";
import { MAPLACE_VERSION } from "./version";

let otherCopyReported = false;

/**
 * Defines `<maplace-map>` and `<maplace-location>` once per page. When another copy of maplace
 * defined them first, its elements stay, and this copy says so: its providers are not seen.
 */
export function defineElements(): void {
  const defined = customElements.get("maplace-map");
  if (defined !== undefined) {
    if (defined !== MaplaceMap) reportOtherCopy(defined);
    return;
  }
  if (customElements.get("maplace-location") === undefined) {
    customElements.define("maplace-location", MaplaceLocation);
  }
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

function reportOtherCopy(defined: CustomElementConstructor): void {
  if (otherCopyReported) return;
  otherCopyReported = true;
  const other = (defined as { maplaceVersion?: unknown }).maplaceVersion ?? "(unknown version)";
  console.error(
    `maplace ${MAPLACE_VERSION}: <maplace-map> is already defined by maplace ${String(other)}; ` +
      "this copy's providers are not seen. Load one copy of maplace per page.",
  );
}
