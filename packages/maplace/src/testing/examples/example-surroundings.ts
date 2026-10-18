/// <reference types="vite/client" />
import { vi } from "vitest";

/** The data the example pages fetch, by path: `examples/data/locations.json` is `/locations.json`. */
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
  const fetchFromPage = async (input: RequestInfo | URL): Promise<Response> => {
    const data = EXAMPLE_DATA[pathOf(input)];
    return data === undefined ? new Response(null, { status: 404 }) : Response.json(data);
  };
  vi.stubGlobal("fetch", fetchFromPage);
}

/** The path a script fetched: `/locations.json` from a string, a URL or a request. */
function pathOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  return input instanceof URL ? input.pathname : new URL(input.url).pathname;
}
