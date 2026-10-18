import type { MaplaceMapElement } from "../../element/index";

/** A page opened in the test document: its map, and what went wrong on it. */
export interface OpenedPage {
  readonly map: MaplaceMapElement;
  /** The element holding the page's nodes. */
  readonly root: HTMLElement;
  /** Errors thrown by the page's scripts, and the map's `maplace-error` details. */
  readonly errors: readonly unknown[];
}

interface PageOptions {
  /** Replaces the pages' `YOUR_KEY`, for a run on real Google Maps. */
  readonly apiKey?: string;
}

/** Script types a browser runs; any other (`application/json`) is data. */
const EXECUTABLE = new Set(["", "module", "text/javascript"]);

let stopRecording: (() => void) | undefined;

/** The one CDN script a page loads, by file name. */
export function cdnScriptOf(html: string): string {
  const sources = [...parse(html).querySelectorAll("script[src]")].map(
    (script) => script.getAttribute("src") ?? "",
  );
  if (sources.length !== 1)
    throw new Error(`a page loads one CDN script, this one ${sources.length}`);
  return sources[0]?.split("/").at(-1) ?? "";
}

/**
 * `html` as the test document's body, its own scripts run: the CDN script is left out, since
 * the test has defined the elements already.
 */
export function openPage(html: string, options: PageOptions = {}): OpenedPage {
  const { maps, roots, errors } = openPages([html], options);
  return { map: maps[0] as MaplaceMapElement, root: roots[0] as HTMLElement, errors };
}

/**
 * Pages opened together in the test document, as a site shows them: each page's map, and the
 * element holding the page, in order.
 */
export interface OpenedPages {
  readonly maps: readonly MaplaceMapElement[];
  readonly roots: readonly HTMLElement[];
  readonly errors: readonly unknown[];
}

/**
 * `htmls` one after another as the test document's body, each in a `<div>` of its own with its
 * styles, then every page's scripts run.
 */
export function openPages(htmls: readonly string[], { apiKey }: PageOptions = {}): OpenedPages {
  const pages = htmls.map((html) => parse(withKey(html, apiKey)));
  // Before the nodes connect: an element reports some misuse as it connects.
  const errors = recordErrors();
  const roots = pages.map((page) => rootOf(importedNodes(page, "style")));
  document.body.replaceChildren(...roots);
  for (const script of document.body.querySelectorAll("script")) runScript(script);
  const maps = [...document.querySelectorAll("maplace-map")];
  if (maps.length !== htmls.length) {
    throw new Error(`${htmls.length} pages opened ${maps.length} maps: each page has one`);
  }
  return { maps, roots, errors };
}

/** `html` with `YOUR_KEY` replaced, when a key is given. */
export function withKey(html: string, apiKey: string | undefined): string {
  return apiKey === undefined ? html : html.replaceAll("YOUR_KEY", apiKey);
}

export function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

/**
 * A parsed document's nodes, imported into the test document: its head's nodes that match
 * `headSelector` (the parser puts a leading `<style>` or `<script>` there), then its body's.
 */
export function importedNodes(page: Document, headSelector: string): Node[] {
  const head = [...page.head.children].filter((node) => node.matches(headSelector));
  return [...head, ...page.body.childNodes].map((node) => document.importNode(node, true));
}

/** A `<div>` holding `nodes`. */
export function rootOf(nodes: readonly Node[]): HTMLElement {
  const root = document.createElement("div");
  root.append(...nodes);
  return root;
}

/** A script imported from another document never runs: a fresh one in its place does. */
export function runScript(imported: HTMLScriptElement): void {
  if (!EXECUTABLE.has(imported.type)) return;
  const script = document.createElement("script");
  script.type = imported.type;
  script.textContent = imported.textContent;
  imported.replaceWith(script);
}

/** Records what goes wrong on the page from now until the next call: errors and `maplace-error`s. */
export function recordErrors(): unknown[] {
  stopRecording?.();
  const errors: unknown[] = [];
  const record = (event: Event) => errors.push(detailOf(event));
  const events = ["error", "unhandledrejection", "maplace-error"] as const;
  for (const name of events) globalThis.addEventListener(name, record);
  stopRecording = () => {
    for (const name of events) globalThis.removeEventListener(name, record);
  };
  return errors;
}

function detailOf(event: Event): unknown {
  if (event instanceof ErrorEvent) return event.error ?? event.message;
  if (event instanceof PromiseRejectionEvent) return event.reason;
  return (event as CustomEvent).detail;
}
