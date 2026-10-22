import type { Provider } from "./example-providers.ts";
import { attributeValue, requireOnce } from "./page-markup.ts";
import type { SiteMapSettings } from "./site-map-settings.ts";

/** What a provider rewrites in an example's markup for the site to run it. */
export interface ProviderMarkup {
  /** The page's map, `<maplace-map …>…</maplace-map>`, held until the visitor consents. */
  readonly holdMap: (map: string) => string;
  /** A vanilla or React version's host, before the site makes it live (`liveHost`). */
  readonly prepareHost: (hostHtml: string) => string;
}

/** The map's own opening tag, whose attributes are the map's: a quoted value may hold a `>`. */
const MAP_TAG = /^<maplace-map\b(?:[^>"']|"[^"]*"|'[^']*')*>/;

/** Where an example page has the reader put their key: the map's attribute. */
const MAP_KEY_ATTRIBUTE = / api-key="YOUR_KEY"/g;

/** A map ID the page's map sets itself. */
const OWN_MAP_ID_ATTRIBUTE = /\smap-id=/;

/** Where a host's bootstrap has the reader put their key. */
const BOOTSTRAP_KEY_PLACEHOLDER = /key: "YOUR_KEY"/g;

/**
 * Each provider's rewrite of its examples, with the site's settings:
 * - Google's map gets the site's key, or none when it has none, and the site's map ID when the
 *   page sets none (a page's own `map-id` stays); its hosts' bootstrap gets the key, or keeps the
 *   placeholder when the site has none (the frame then says so before running anything). The
 *   site's map ID reaches the hosts' modules through the site's `maplace/google`
 *   (`example-map-id.ts`).
 * - MapLibre's map takes no key or map ID; its hosts load nothing but their module.
 */
export const PROVIDER_MARKUP: Readonly<
  Record<Provider, (settings: SiteMapSettings) => ProviderMarkup>
> = {
  google: (settings) => ({
    holdMap: (map) => heldGoogleMap(map, settings),
    prepareHost: (hostHtml) => keyedBootstrap(hostHtml, settings),
  }),
  maplibre: () => ({
    holdMap: (map) => heldBy(map, "maplibre"),
    prepareHost: (hostHtml) => hostHtml,
  }),
};

/**
 * `map` held, naming its `provider` (both providers register on the site's page, and a map
 * without `provider` then refuses to load), with `attributes` added after.
 */
function heldBy(map: string, provider: Provider, attributes = ""): string {
  return map.replace("<maplace-map", `<maplace-map hold provider="${provider}"${attributes}`);
}

function heldGoogleMap(map: string, { apiKey, mapId }: SiteMapSettings): string {
  requireOnce(map, MAP_KEY_ATTRIBUTE, `an example's map has${MAP_KEY_ATTRIBUTE.source} once`);
  const key = apiKey === undefined ? "" : ` api-key="${attributeValue(apiKey)}"`;
  const keyed = map.replaceAll(MAP_KEY_ATTRIBUTE, () => key);
  return heldBy(keyed, "google", siteMapIdFor(keyed, mapId));
}

/** ` map-id="<mapId>"` for a map whose own tag sets none, or nothing. */
function siteMapIdFor(map: string, mapId: string | undefined): string {
  const ownTag = MAP_TAG.exec(map)?.[0] ?? "";
  if (mapId === undefined || OWN_MAP_ID_ATTRIBUTE.test(ownTag)) return "";
  return ` map-id="${attributeValue(mapId)}"`;
}

function keyedBootstrap(hostHtml: string, { apiKey }: SiteMapSettings): string {
  requireOnce(
    hostHtml,
    BOOTSTRAP_KEY_PLACEHOLDER,
    `an example's host has the bootstrap's ${BOOTSTRAP_KEY_PLACEHOLDER.source} once`,
  );
  if (apiKey === undefined) return hostHtml;
  return hostHtml.replaceAll(BOOTSTRAP_KEY_PLACEHOLDER, () => keyIn(apiKey));
}

/** `key: "<apiKey>"`, a JS string that can't end the script it is in. */
function keyIn(apiKey: string): string {
  const scriptSafe = JSON.stringify(apiKey).replaceAll("<", String.raw`\x3c`);
  return `key: ${scriptSafe}`;
}
