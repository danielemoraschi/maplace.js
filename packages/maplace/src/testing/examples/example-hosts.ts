import { importedNodes, parse, rootOf, runScript, withKey } from "./example-page";

interface HostOptions {
  /**
   * Replaces the host's `YOUR_KEY` and runs its bootstrap, for a run on real Google Maps. Left
   * out on a page that has Maps JS already, as a site's later maps.
   */
  readonly apiKey?: string | undefined;
}

/** The module script a host loads, which the test runs itself. */
const MODULE_SCRIPT = "script[type=module][src]";

/**
 * A vanilla or React host's nodes, in a fresh `<div>` appended to the test document (never
 * replacing what is there: a React root already rendered would be orphaned): its styles and
 * the nodes its module mounts on. Its module script is left out, for the test to run, and its
 * bootstrap too unless a key is given, since the fake needs no Maps JS.
 */
export function openHost(html: string, { apiKey }: HostOptions = {}): HTMLElement {
  const host = parse(withKey(html, apiKey));
  for (const script of host.querySelectorAll(MODULE_SCRIPT)) script.remove();
  if (apiKey === undefined) bootstrapScript(host).remove();
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

/** The source of a host's one inline script: Google's bootstrap loader. */
export function bootstrapOf(html: string): string {
  return bootstrapScript(parse(html)).textContent ?? "";
}

function bootstrapScript(host: Document): HTMLScriptElement {
  const inline = [...host.querySelectorAll("script:not([src])")];
  const script = inline[0];
  if (inline.length !== 1 || !script?.textContent?.includes("importLibrary")) {
    throw new Error("a host's one inline script is Google's bootstrap loader");
  }
  return script as HTMLScriptElement;
}
