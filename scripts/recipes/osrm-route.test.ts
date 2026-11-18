import { readFileSync } from "node:fs";
import type { RouteRequest } from "@maplacejs/maplace";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STORED_ROUTE_STOPS } from "../route-data/stops.ts";
import { answerOf, type OsrmAnswer, osrmRoute } from "./osrm-route.ts";

/** OSRM's demo server's answer for Milan → (Zurich) → Paris → Munich, kept with its fields read. */
const STORED: OsrmAnswer = JSON.parse(
  readFileSync(new URL("../route-data/osrm-milan-munich.json", import.meta.url), "utf8"),
);

const request = (asked: Partial<RouteRequest> = {}): RouteRequest => ({
  stops: STORED_ROUTE_STOPS,
  travelMode: "driving",
  avoid: [],
  signal: new AbortController().signal,
  ...asked,
});

/** `fetch` answering `answer` to every request, recording each URL and its init. */
function osrmAnswering(answer: unknown) {
  const fetched = vi.fn(async (_url: string, _init?: RequestInit) => Response.json(answer));
  vi.stubGlobal("fetch", fetched);
  return fetched;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the OSRM recipe", () => {
  it("asks for every stop, the legs ending at those not passed through, with its signal", async () => {
    const fetched = osrmAnswering(STORED);
    const asked = request();
    await osrmRoute()(asked);
    const [url, init] = fetched.mock.calls[0] ?? [];
    expect(url).toBe(
      "https://router.project-osrm.org/route/v1/driving/9.19,45.4642;8.5417,47.3769;2.3522,48.8566;11.582,48.1351?waypoints=0;2;3&overview=simplified&steps=true&geometries=geojson",
    );
    expect(init?.signal).toBe(asked.signal);
  });

  it("asks a server of the page's own, by its profile for walking", async () => {
    const fetched = osrmAnswering(STORED);
    await osrmRoute("https://osrm.example.com")(request({ travelMode: "walking" }));
    expect(fetched.mock.calls[0]?.[0]).toMatch(/^https:\/\/osrm\.example\.com\/route\/v1\/foot\//);
  });

  it("gives a leg between each two stops not passed through, with OSRM's distances and path", () => {
    const answer = answerOf(STORED, request());
    expect(answer.legs.map(({ from, to }) => [from, to])).toEqual([
      ["milan", "paris"],
      ["paris", "munich"],
    ]);
    expect(answer.legs[0]?.distanceMeters).toBe(STORED.routes?.[0]?.legs[0]?.distance);
    expect(answer.path).toHaveLength(STORED.routes?.[0]?.geometry.coordinates.length ?? 0);
    expect(answer.path[0]).toEqual({ lat: expect.closeTo(45.46, 1), lng: expect.closeTo(9.19, 1) });
  });

  it("words each step from its manoeuvre and road", () => {
    const steps = answerOf(STORED, request()).legs.flatMap((leg) => leg.steps);
    expect(steps[0]?.instruction).toMatch(/^Head out/);
    expect(steps.at(-1)?.instruction).toBe("Arrive");
    expect(steps.map(({ instruction }) => instruction)).toContain(
      "Turn right onto Piazza Armando Diaz",
    );
  });

  it("words a U-turn as one", () => {
    const uturn = {
      ...STORED,
      routes: [
        {
          ...STORED.routes?.[0],
          legs: [
            {
              distance: 1,
              duration: 1,
              steps: [
                {
                  name: "Via Dante",
                  distance: 1,
                  duration: 1,
                  maneuver: { type: "turn", modifier: "uturn" },
                },
              ],
            },
          ],
        },
      ],
    } as OsrmAnswer;
    const [leg] = answerOf(uturn, request()).legs;
    expect(leg?.steps[0]?.instruction).toBe("Make a U-turn onto Via Dante");
  });

  it("is what the route example's stored route was made from", () => {
    const stored = JSON.parse(
      readFileSync(
        new URL("../../packages/maplace/examples/data/route-milan-munich.json", import.meta.url),
        "utf8",
      ),
    );
    expect(stored).toEqual({
      attribution: stored.attribution,
      stops: STORED_ROUTE_STOPS.map(({ id }) => id),
      ...answerOf(STORED, { stops: STORED_ROUTE_STOPS }),
    });
  });

  it("fails with OSRM's own message when it finds no route", async () => {
    osrmAnswering({ code: "NoRoute", message: "Impossible route between points" });
    await expect(osrmRoute()(request())).rejects.toThrow("OSRM: Impossible route between points");
  });

  it("fails with the server's status when it answers no JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>Too Many Requests</html>", { status: 429 })),
    );
    await expect(osrmRoute()(request())).rejects.toThrow("OSRM: 429");
  });

  it("passes on a point that isn't two numbers, for maplace to refuse", () => {
    const broken: OsrmAnswer = {
      code: "Ok",
      routes: [{ ...STORED.routes?.[0], geometry: { coordinates: [[9.19, 45.46], [11.58]] } }],
    } as OsrmAnswer;
    expect(answerOf(broken, request()).path[1]).toEqual({ lat: undefined, lng: 11.58 });
  });

  it("refuses transit, which OSRM doesn't route", async () => {
    osrmAnswering(STORED);
    await expect(osrmRoute()(request({ travelMode: "transit" }))).rejects.toThrow(
      "OSRM has no transit",
    );
  });
});
