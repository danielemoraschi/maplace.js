import { inertScripts, requireOnce, withoutDoctype } from "./page-markup.ts";

/** A host's module script: the site runs the version's module from its own bundle instead. */
const MODULE_SCRIPT = /<script type="module" src="[^"]+"><\/script>\s*/g;

/**
 * A vanilla or React version's HTML as the site runs it: its styles and the nodes its module
 * mounts on, in order, any inline script (Google's bootstrap) inert until the version starts; its
 * doctype and module script left out, since the site imports the module itself.
 */
export function liveHost(hostHtml: string): string {
  requireOnce(hostHtml, MODULE_SCRIPT, "an example's host loads one module script");
  return inertScripts(withoutDoctype(hostHtml.replaceAll(MODULE_SCRIPT, "")));
}
