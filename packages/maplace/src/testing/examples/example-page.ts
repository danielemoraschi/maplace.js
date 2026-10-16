import type { MaplaceMapElement } from "../../element/index";

/** A page opened in the test document: its map, and what went wrong on it. */
export interface OpenedPage {
  readonly map: MaplaceMapElement;
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
export function openPage(html: string, { apiKey }: PageOptions = {}): OpenedPage {
  const page = parse(apiKey === undefined ? html : html.replaceAll("YOUR_KEY", apiKey));
  // Before the nodes connect: an element reports some misuse as it connects.
  const errors = recordErrors();
  document.body.replaceChildren(
    ...[...page.body.childNodes].map((node) => document.importNode(node, true)),
  );
  for (const script of document.body.querySelectorAll("script")) runScript(script);
  const map = document.querySelector("maplace-map");
  if (map === null) throw new Error("the page has no <maplace-map>");
  return { map, errors };
}

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

/** A script imported from another document never runs: a fresh one in its place does. */
function runScript(imported: HTMLScriptElement): void {
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
