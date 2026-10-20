import { attributeValue, inertScripts, requireOnce, withoutDoctype } from "./page-markup.ts";
import type { SiteMapSettings } from "./site-map-settings.ts";

/** An example page's map, from its opening tag to its closing one. */
const MAP = /<maplace-map\b[\s\S]*?<\/maplace-map>/g;

/** The map's own opening tag, whose attributes are the map's: a quoted value may hold a `>`. */
const MAP_TAG = /^<maplace-map\b(?:[^>"']|"[^"]*"|'[^']*')*>/;

/** Where an example page has the reader put their key: the map's attribute. */
const MAP_KEY_ATTRIBUTE = / api-key="YOUR_KEY"/g;

/** A map ID the page's map sets itself. */
const OWN_MAP_ID_ATTRIBUTE = /\smap-id=/;

/** The page's CDN script, which the site's own bundle stands in for. */
const CDN_SCRIPT = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/maplace@[^"]+"><\/script>\s*/g;

/**
 * An example page as the site runs it, beside the others: its map held until the visitor
 * consents (`release()`), with the site's key, or none when it has none, and the site's map ID
 * when the page sets none (a page's own `map-id` stays); its own scripts inert until then
 * (`runPageScripts`); its doctype and CDN script left out, since the site's bundle defines the
 * element. Everything else stays as written, in order.
 */
export function livePage(pageHtml: string, settings: SiteMapSettings): string {
  const map = requireOnce(pageHtml, MAP, "an example page has one <maplace-map>");
  const held = heldMap(map, settings);
  const [before = "", after = ""] = pageHtml.split(map);
  const head = withoutCdnScript(withoutDoctype(before));
  return `${inertScripts(head)}${held}${inertScripts(after)}`;
}

function heldMap(map: string, { apiKey, mapId }: SiteMapSettings): string {
  requireOnce(map, MAP_KEY_ATTRIBUTE, `an example's map has${MAP_KEY_ATTRIBUTE.source} once`);
  const key = apiKey === undefined ? "" : ` api-key="${attributeValue(apiKey)}"`;
  const keyed = map.replaceAll(MAP_KEY_ATTRIBUTE, () => key);
  return keyed.replace("<maplace-map", `<maplace-map hold${siteMapIdFor(keyed, mapId)}`);
}

/** ` map-id="<mapId>"` for a map whose own tag sets none, or nothing. */
function siteMapIdFor(map: string, mapId: string | undefined): string {
  const ownTag = MAP_TAG.exec(map)?.[0] ?? "";
  if (mapId === undefined || OWN_MAP_ID_ATTRIBUTE.test(ownTag)) return "";
  return ` map-id="${attributeValue(mapId)}"`;
}

function withoutCdnScript(head: string): string {
  requireOnce(head, CDN_SCRIPT, "an example page loads the CDN script once, before its map");
  return head.replaceAll(CDN_SCRIPT, "");
}
