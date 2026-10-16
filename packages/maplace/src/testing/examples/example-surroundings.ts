import { vi } from "vitest";
import { sizedContainer } from "../container";

/** A container a script reads: `byId("list")` or `querySelector<HTMLElement>("#map")`. */
const CONTAINER_ID = /byId\("([\w-]+)"\)|querySelector(?:<\w+>)?\("#([\w-]+)"\)/g;

/** The data a page serves its examples, until the site's own (W2, W4); built for each request. */
const EXAMPLE_DATA: Readonly<Record<string, () => unknown>> = {
  "/locations.json": () => [
    { id: "rome", lat: 41.9028, lng: 12.4964, title: "Rome" },
    {
      id: "ring",
      type: "circle",
      center: { lat: 45.4642, lng: 9.19 },
      radius: 8000,
      title: "Milan area",
    },
  ],
  "/points-4k.json": () =>
    Array.from({ length: 4000 }, (_, index) => ({
      id: `p${index}`,
      lat: (index % 170) - 85,
      lng: (index % 360) - 180,
      title: `Point ${index}`,
    })),
};

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
    return data === undefined ? new Response(null, { status: 404 }) : Response.json(data());
  };
  vi.stubGlobal("fetch", fetchFromPage);
}

/** The path a script fetched: `/locations.json` from a string, a URL or a request. */
function pathOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  return input instanceof URL ? input.pathname : new URL(input.url).pathname;
}
