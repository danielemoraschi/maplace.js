import { importedNodes, parse, rootOf, runScript, withKey } from "./example-dom";

interface HostOptions {
  /**
   * Replaces the host's `YOUR_KEY` and runs its bootstrap, for a run on real Google Maps. Left
   * out on a page that has Maps JS already, as a site's later maps.
   */
  readonly apiKey?: string | undefined;
}

/** The module script a host loads, which the test runs itself. */
const MODULE_SCRIPT = "script[type=module][src]";

/** What tells Google's bootstrap loader from any other inline script: it defines this. */
const BOOTSTRAP_CALL = "importLibrary";

/**
 * A vanilla or React host's nodes, in a fresh `<div>` appended to the test document (never
 * replacing what is there: a React root already rendered would be orphaned): its styles and
 * the nodes its module mounts on. Its module script is left out, for the test to run, and its
 * bootstrap too, where it has one, unless a key is given, since the fake needs no Maps JS.
 */
export function openHost(html: string, { apiKey }: HostOptions = {}): HTMLElement {
  const host = parse(withKey(html, apiKey));
  for (const script of host.querySelectorAll(MODULE_SCRIPT)) script.remove();
  if (apiKey === undefined) bootstrapIn(host)?.remove();
  const root = rootOf(importedNodes(host, "script, style"));
  document.body.append(root);
  for (const script of root.querySelectorAll("script")) runScript(script);
  return root;
}

/** The `src` of the one module script a host loads. */
export function moduleScriptOf(html: string): string {
  const scripts = [...parse(html).querySelectorAll(MODULE_SCRIPT)];
  if (scripts.length !== 1) throw new Error(`a host loads one module, this one ${scripts.length}`);
  return scripts[0]?.getAttribute("src") ?? "";
}

/** How a MapLibre version's module brings maplibre-gl's stylesheet (contract 1). */
export const MAPLIBRE_STYLESHEET_IMPORT = 'import "maplibre-gl/dist/maplibre-gl.css";';

/** The text of each inline script a host carries. */
export function inlineScriptsOf(html: string): string[] {
  return inlineScripts(parse(html)).map((script) => script.textContent ?? "");
}

/** The source of a Google host's one inline script: Google's bootstrap loader. */
export function bootstrapOf(html: string): string {
  const host = parse(html);
  const bootstrap = bootstrapIn(host);
  if (inlineScripts(host).length !== 1 || bootstrap === undefined) {
    throw new Error("a Google host's one inline script is Google's bootstrap loader");
  }
  return bootstrap.textContent ?? "";
}

/** Google's bootstrap loader, where the host has one. */
function bootstrapIn(host: Document): HTMLScriptElement | undefined {
  return inlineScripts(host).find((script) => script.textContent?.includes(BOOTSTRAP_CALL));
}

function inlineScripts(host: Document): HTMLScriptElement[] {
  return [...host.querySelectorAll<HTMLScriptElement>("script:not([src])")];
}
