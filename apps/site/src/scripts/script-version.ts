import type { Provider } from "../examples/example-providers.ts";
import { runPageScripts } from "../examples/page-scripts.ts";
import { providerOf } from "./by-provider.ts";

/**
 * What starts a script version (W33), its provider readied: its provider's `Maplace` put on the
 * page (`installMaplace`), as its CDN script would set it, then its program run. A failed install
 * runs nothing, and fails the version's start.
 */
export function scriptVersionStart(
  installMaplace: (provider: Provider) => Promise<void>,
): (version: HTMLElement) => Promise<void> {
  return async (version) => {
    await installMaplace(providerOf(version));
    runPageScripts(version);
  };
}
