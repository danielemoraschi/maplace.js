import { createGoogleAdapter } from "../google/index";
import { defineProvider } from "./define";
import { adapterAfter } from "./google-after-loading";
import { googleSettingsOf } from "./google-attributes";
import { mapsLoadingFor } from "./google-loading";
import type { MaplaceMapElement, ProviderFactory } from "./index";

/**
 * Registers the `google` provider for `<maplace-map>`; the CDN builds are this entry bundled.
 *
 * Provider attributes, read when the map opens: `map-id` (required), and for Maps JS `api-key`
 * (required unless the page loaded Maps JS itself), `version`, `language`, `region` and `nonce`.
 * The first map to open adds Maps JS to the page, once however many maps; a map asking for
 * another `api-key`, `version`, `language` or `region` than the page loaded is misuse (error
 * state and `maplace-error`). A held map adds nothing until released.
 */
const googleProvider: ProviderFactory = (element) => {
  const { mapId, script } = googleSettingsOf(element);
  const loading = mapsLoadingFor(script, element.ownerDocument);
  return adapterAfter(loading, createGoogleAdapter({ mapId }));
};

defineProvider("google", googleProvider);

export type { MaplaceMapElement };
