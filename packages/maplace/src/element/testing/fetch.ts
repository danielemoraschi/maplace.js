import { vi } from "vitest";
import { nextTask } from "../../adapter-kit/chunks";

/** A request the stubbed `fetch` holds until the test answers it, ignoring any abort. */
export interface HeldRequest {
  readonly url: string;
  answer(response: Response): void;
  fail(error: unknown): void;
}

/**
 * `fetch` stubbed until the test's globals are unstubbed: each request answered at once by
 * `respond`, or held, without it, for the test to answer. Returns the requests, in order.
 */
export function stubFetch(respond?: (url: string) => Response): HeldRequest[] {
  const requests: HeldRequest[] = [];
  vi.stubGlobal(
    "fetch",
    (url: string) =>
      new Promise<Response>((resolve, reject) => {
        requests.push({ url, answer: resolve, fail: reject });
        if (respond !== undefined) resolve(respond(url));
      }),
  );
  return requests;
}

/**
 * `fetch` answering from `files` by path (404 for any other), at once, or held until the test
 * lets each go, oldest first, with `answer(path)`. Returns the paths asked for.
 */
export function serve(files: Record<string, unknown>, { held = false } = {}) {
  const respond = (url: string) =>
    url in files ? Response.json(files[url]) : new Response("", { status: 404 });
  const requests = stubFetch(held ? undefined : respond);
  const answered = new Set<HeldRequest>();
  /** The oldest request for `url` not answered yet. */
  const pending = (url: string) =>
    requests.find((request) => request.url === url && !answered.has(request));
  return {
    asked: () => requests.map(({ url }) => url),
    answer: (url: string) => {
      const request = pending(url);
      if (request === undefined) return;
      answered.add(request);
      request.answer(respond(url));
    },
  };
}

/** Long enough for a served file to be fetched, read and applied. */
export async function loaded(): Promise<void> {
  for (let task = 0; task < 3; task++) await nextTask();
}

/** A GeoJSON FeatureCollection of one point, the gate `gate` titled "Gate". */
export const PARK = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "gate",
      geometry: { type: "Point", coordinates: [-0.15, 51.53] },
      properties: { title: "Gate" },
    },
  ],
};
