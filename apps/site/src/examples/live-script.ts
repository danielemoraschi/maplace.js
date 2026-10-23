import { inertScripts, withoutCdnScript, withoutDoctype } from "./page-markup.ts";

/**
 * A script version's HTML as the site runs it (W33): its styles, the nodes its program mounts on
 * and its program, inert until the version starts (`startScriptVersion`), in order, as `prepare`
 * (its provider's, `PROVIDER_MARKUP`) leaves it; its doctype and CDN script left out, since the
 * site's bundle sets the page's `Maplace`.
 */
export function liveScript(scriptHtml: string, prepare: (html: string) => string): string {
  return inertScripts(prepare(withoutDoctype(withoutCdnScript(scriptHtml))));
}
