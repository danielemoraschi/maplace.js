import { attributeValue, inertScripts, requireOnce, withoutDoctype } from "./page-markup.ts";

/** An example page's map, from its opening tag to its closing one. */
const MAP = /<maplace-map\b[\s\S]*?<\/maplace-map>/g;

/** Where an example page has the reader put their key: the map's attribute. */
const MAP_KEY_ATTRIBUTE = / api-key="YOUR_KEY"/g;

/** The page's CDN script, which the site's own bundle stands in for. */
const CDN_SCRIPT = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/maplace@[^"]+"><\/script>\s*/g;

/**
 * An example page as the site runs it, beside the others: its map held until the visitor
 * consents (`release()`), with the site's key, or none when it has none; its own scripts inert
 * until then (`runPageScripts`); its doctype and CDN script left out, since the site's bundle
 * defines the element. Everything else stays as written, in order.
 */
export function livePage(pageHtml: string, apiKey: string | undefined): string {
  const map = requireOnce(pageHtml, MAP, "an example page has one <maplace-map>");
  const held = heldMap(map, apiKey);
  const [before = "", after = ""] = pageHtml.split(map);
  const head = withoutCdnScript(withoutDoctype(before));
  return `${inertScripts(head)}${held}${inertScripts(after)}`;
}

function heldMap(map: string, apiKey: string | undefined): string {
  requireOnce(map, MAP_KEY_ATTRIBUTE, `an example's map has${MAP_KEY_ATTRIBUTE.source} once`);
  const key = apiKey === undefined ? "" : ` api-key="${attributeValue(apiKey)}"`;
  return map.replaceAll(MAP_KEY_ATTRIBUTE, () => key).replace("<maplace-map", "<maplace-map hold");
}

function withoutCdnScript(head: string): string {
  requireOnce(head, CDN_SCRIPT, "an example page loads the CDN script once, before its map");
  return head.replaceAll(CDN_SCRIPT, "");
}
