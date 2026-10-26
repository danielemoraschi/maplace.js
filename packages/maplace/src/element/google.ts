import { createGoogleAdapter } from "../google/create-adapter";
import { mountAfter } from "../google/mount-after";
import { defineBuiltInProvider } from "./built-in-provider";
import { googleSettingsOf } from "./google-attributes";
import { mapsLoadingFor } from "./google-loading";
import { GOOGLE_MAP_SETTINGS } from "./google-map-attributes";
import type { ProviderFactory } from "./index";

/**
 * Registers the `google` provider for `<maplace-map>`; the CDN builds are this entry bundled.
 *
 * Provider attributes, read when the map opens: `map-id` (Google's demo map ID when left out),
 * `color-scheme` (`light`, `dark` or `follow-system`: Google checks the system once, as the map
 * opens) and `map-options` (a JSON object of Google's map options, as `mapOptions`: not centre,
 * zoom, map ID, colour scheme or `styles`) for the map it creates, a change of either opening the
 * map again where it was; and for Maps JS `api-key` (required unless the page loaded Maps JS
 * itself), `version`, `language`, `region` and `nonce` (read as the element's property, which
 * keeps its value when a header CSP hides the attribute).
 * The first map to open adds Maps JS to the page, once however many maps; a map asking for
 * another `api-key`, `version`, `language` or `region` than the page loaded is misuse (error
 * state and `maplace-error`). A held map adds nothing until released.
 */
const googleProvider: ProviderFactory = (element) => {
  const { adapterOptions, script } = googleSettingsOf(element);
  const loading = mapsLoadingFor(script, element.ownerDocument);
  return mountAfter(createGoogleAdapter(adapterOptions), () => loading);
};

defineBuiltInProvider("google", googleProvider, GOOGLE_MAP_SETTINGS);

export type { MaplaceMapElement } from "./index";
