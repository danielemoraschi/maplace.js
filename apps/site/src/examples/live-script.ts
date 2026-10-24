import { inertScripts, withoutCdnScript, withoutDoctype } from "./page-markup.ts";

/** An inline classic script: a script version's program must be a module, run as one. */
const CLASSIC_SCRIPT = "<script>";

/**
 * A script version's HTML as the site runs it (W33): its styles, the nodes its program mounts on
 * and its program, inert until the version starts (`scriptVersionStart`), in order, as `prepare`
 * (its provider's, `PROVIDER_MARKUP`) leaves it; its doctype and CDN script left out, since the
 * site's bundle sets the page's `Maplace`. Its program must be a module script, as the site
 * imports it (`importAsModule`).
 */
export function liveScript(scriptHtml: string, prepare: (html: string) => string): string {
  const page = prepare(withoutDoctype(withoutCdnScript(scriptHtml)));
  if (page.includes(CLASSIC_SCRIPT)) {
    throw new Error("a script version's program must be a module script");
  }
  return inertScripts(page);
}
