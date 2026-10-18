import { inertScripts, withoutDoctype } from "./page-markup.ts";

/** A host's module script: the site runs the version's module from its own bundle instead. */
const MODULE_SCRIPT = /<script type="module" src="[^"]+"><\/script>\s*/g;

/** Where a host's bootstrap has the reader put their key. */
const KEY_PLACEHOLDER = 'key: "YOUR_KEY"';

/**
 * A vanilla or React version's HTML as the site runs it: its styles and the nodes its module
 * mounts on, in order; its Google bootstrap inert until the version starts, with the site's key
 * (or the placeholder, when the site has none: the frame then says so before running anything);
 * its doctype and module script left out, since the site imports the module itself.
 */
export function liveHost(hostHtml: string, apiKey: string | undefined): string {
  const modules = hostHtml.match(MODULE_SCRIPT) ?? [];
  if (modules.length !== 1) {
    throw new Error(`an example's host loads one module script; this one ${modules.length}`);
  }
  if (hostHtml.split(KEY_PLACEHOLDER).length !== 2) {
    throw new Error(`an example's host has the bootstrap's ${KEY_PLACEHOLDER} once`);
  }
  const keyed =
    apiKey === undefined ? hostHtml : hostHtml.replace(KEY_PLACEHOLDER, () => keyIn(apiKey));
  return inertScripts(withoutDoctype(keyed.replaceAll(MODULE_SCRIPT, "")));
}

/** `key: "<apiKey>"`, a JS string that can't end the script it is in. */
function keyIn(apiKey: string): string {
  const scriptSafe = JSON.stringify(apiKey).replaceAll("<", String.raw`\x3c`);
  return `key: ${scriptSafe}`;
}
