/// <reference types="vite/client" />
import { vi } from "vitest";
import type { Location } from "../../location";
import { sizedContainer } from "../container";

/** A container a script reads: `byId("list")` or `querySelector<HTMLElement>("#map")`. */
const CONTAINER_ID = /byId\("([\w-]+)"\)|querySelector(?:<\w+>)?\("#([\w-]+)"\)/g;

/** The data the example pages fetch, by path: `examples/data/locations.json` is `/locations.json`. */
const EXAMPLE_DATA: Readonly<Record<string, unknown>> = Object.fromEntries(
  Object.entries(
    import.meta.glob("../../../examples/data/*.json", { import: "default", eager: true }),
  ).map(([file, data]) => [`/${file.split("/").at(-1)}`, data]),
);

/** The page around `source`: a sized `<div>` for every element it reads by id. */
export function containersFor(source: string): void {
  document.body.replaceChildren();
  for (const [, byId, bySelector] of source.matchAll(CONTAINER_ID)) {
    const id = byId ?? bySelector ?? "";
    if (document.getElementById(id) === null) Object.assign(sizedContainer(), { id });
  }
}

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

/** `count` titled markers spread over the globe, as `big` loads them. */
export function spreadPoints(count: number): Location[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index}`,
    lat: (index % 170) - 85,
    lng: (index % 360) - 180,
    title: `Point ${index}`,
  }));
}
