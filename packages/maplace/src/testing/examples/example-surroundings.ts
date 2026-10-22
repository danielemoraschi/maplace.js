/// <reference types="vite/client" />
import { vi } from "vitest";
import { OPENFREEMAP_STYLES } from "./openfreemap-styles";

/** The data the example pages fetch, by path: `examples/data/mixed-a.json` is `/mixed-a.json`. */
const EXAMPLE_DATA: Readonly<Record<string, unknown>> = Object.fromEntries(
  Object.entries(
    import.meta.glob("../../../examples/data/*.json", { import: "default", eager: true }),
  ).map(([file, data]) => [`/${file.split("/").at(-1)}`, data]),
);

/**
 * `fetch` answering the examples' data paths; others are a 404, as on a page without them.
 * Undone by `vi.unstubAllGlobals()`.
 */
export function serveExampleData(): void {
  stubFetch(() => undefined);
}

/** The offsite URLs a page asked for, in order: a copy each call. */
export interface OffsiteLog {
  asked(): readonly string[];
}

/**
 * The examples served with nothing leaving the machine: their data, and OpenFreeMap's styles
 * answered with `localStyle`; every offsite URL asked is logged. Undone by `vi.unstubAllGlobals()`.
 */
export function serveExamplesOffline(localStyle: object): OffsiteLog {
  const log: string[] = [];
  stubFetch((url) => {
    log.push(url.href);
    return url.href.startsWith(OPENFREEMAP_STYLES) ? localStyle : undefined;
  });
  return { asked: () => [...log] };
}

/**
 * `fetch` answering the page's own origin from the examples' data, and another origin with
 * `answerOffsite`; anything unanswered is a 404.
 */
function stubFetch(answerOffsite: (url: URL) => unknown): void {
  const fetchFromPage = async (input: RequestInfo | URL): Promise<Response> => {
    const url = urlOf(input);
    const data = url.origin === location.origin ? EXAMPLE_DATA[url.pathname] : answerOffsite(url);
    return data === undefined ? new Response(null, { status: 404 }) : Response.json(data);
  };
  vi.stubGlobal("fetch", fetchFromPage);
}

/** The URL a script fetched: `/mixed-a.json` resolved against the page, a URL, or a request's. */
function urlOf(input: RequestInfo | URL): URL {
  if (input instanceof URL) return input;
  return new URL(typeof input === "string" ? input : input.url, location.href);
}
