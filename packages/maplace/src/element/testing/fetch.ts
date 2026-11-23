import { vi } from "vitest";

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
