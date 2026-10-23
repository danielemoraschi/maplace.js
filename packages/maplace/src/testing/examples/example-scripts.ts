import { importedNodes, parse, rootOf, runScript } from "./example-dom";
import type { Provider } from "./example-files";

/**
 * A script version (W33): a page of its own script, its program an inline module calling the CDN
 * script's `Maplace`, which the runners stub.
 */
export interface ScriptVersion {
  readonly example: string;
  readonly provider: Provider;
  readonly kind: "script";
  readonly html: string;
}

/** A version opened: the nodes it mounts on, and what runs it there. */
export interface OpenedVersion {
  readonly root: HTMLElement;
  readonly run: () => Promise<unknown>;
}

export function scriptOf(example: string, provider: Provider, html: string): ScriptVersion {
  return { example, provider, kind: "script", html };
}

/**
 * A script version's nodes, in a fresh `<div>` appended to the test document: its styles and what
 * its program mounts on, its CDN script left out; its program runs when `run` is called, as a
 * host's module runs when its `run` imports it.
 */
export function openScript({ html }: ScriptVersion): OpenedVersion {
  // The CDN script comes before anything the page shows, so the parser puts it in <head>.
  const root = rootOf(importedNodes(parse(html), "style"));
  document.body.append(root);
  // A script imported from another document never runs by itself: `runScript` runs it, once.
  const run = async () => {
    for (const program of root.querySelectorAll("script")) runScript(program);
  };
  return { root, run };
}
