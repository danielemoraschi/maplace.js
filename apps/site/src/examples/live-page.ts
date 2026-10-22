import { inertScripts, requireOnce, withoutDoctype } from "./page-markup.ts";

/** An example page's map, from its opening tag to its closing one. */
const MAP = /<maplace-map\b[\s\S]*?<\/maplace-map>/g;

/** The page's CDN script, which the site's own bundle stands in for. */
const CDN_SCRIPT = /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/maplace@[^"]+"><\/script>\s*/g;

/**
 * An example page as the site runs it, beside the others: its map as its provider holds it
 * (`holdMap`, `PROVIDER_MARKUP`) until the visitor consents (`release()`); its own scripts inert
 * until then (`runPageScripts`); its doctype and CDN script left out, since the site's bundle
 * defines the element. Everything else stays as written, in order.
 */
export function livePage(pageHtml: string, holdMap: (map: string) => string): string {
  const map = requireOnce(pageHtml, MAP, "an example page has one <maplace-map>");
  const [before = "", after = ""] = pageHtml.split(map);
  const head = withoutCdnScript(withoutDoctype(before));
  return `${inertScripts(head)}${holdMap(map)}${inertScripts(after)}`;
}

function withoutCdnScript(head: string): string {
  requireOnce(head, CDN_SCRIPT, "an example page loads the CDN script once, before its map");
  return head.replaceAll(CDN_SCRIPT, "");
}
