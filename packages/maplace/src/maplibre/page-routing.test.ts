import { describe, expect, it, vi } from "vitest";
import type { Journey } from "../adapter-kit/journey";
import { MaplaceError } from "../errors";
import type { RouteLeg } from "../route";
import type { RouteAnswer, RouteComputer, RouteRequest } from "../route-request";
import { pageCompute } from "./page-routing";

const JOURNEY: Journey = {
  stops: ["milan", "zurich", "paris"],
  via: ["zurich"],
  travelMode: undefined,
  avoid: undefined,
  points: [
    { lat: 45.46, lng: 9.19 },
    { lat: 47.37, lng: 8.54 },
    { lat: 48.86, lng: 2.35 },
  ],
};

const LEG: RouteLeg = {
  from: "milan",
  to: "paris",
  distanceMeters: 850_000,
  durationSeconds: 30_000,
  steps: [{ instruction: "Head north", distanceMeters: 850_000, durationSeconds: 30_000 }],
};

const ANSWER: RouteAnswer = { legs: [LEG], path: JOURNEY.points };

/** What `computeRoute` answered with, through `pageCompute`, or the error it failed with. */
async function computed(computeRoute: RouteComputer, journey = JOURNEY) {
  return pageCompute(computeRoute)(journey, new AbortController().signal);
}

async function failure(computeRoute: RouteComputer): Promise<MaplaceError> {
  const error = await computed(computeRoute).then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(MaplaceError);
  expect((error as MaplaceError).code).toBe("route-failed");
  return error as MaplaceError;
}

describe("the page's routing", () => {
  it("asks for each stop where it is, those passed through marked, with the defaults filled in", async () => {
    const computeRoute = vi.fn<RouteComputer>(async () => ANSWER);
    const signal = new AbortController().signal;
    await pageCompute(computeRoute)(JOURNEY, signal);
    expect(computeRoute).toHaveBeenCalledWith({
      stops: [
        { id: "milan", lat: 45.46, lng: 9.19, via: false },
        { id: "zurich", lat: 47.37, lng: 8.54, via: true },
        { id: "paris", lat: 48.86, lng: 2.35, via: false },
      ],
      travelMode: "driving",
      avoid: [],
      signal,
    } satisfies RouteRequest);
  });

  it("passes the travel mode and what to avoid as the route asks", async () => {
    const computeRoute = vi.fn<RouteComputer>(async () => ANSWER);
    await computed(computeRoute, { ...JOURNEY, travelMode: "walking", avoid: ["ferries"] });
    expect(computeRoute.mock.calls[0]?.[0]).toMatchObject({
      travelMode: "walking",
      avoid: ["ferries"],
    });
  });

  it("totals the legs, keeping the path", async () => {
    const two = { ...LEG, to: "zurich" };
    const legs = [two, { ...LEG, from: "zurich", durationSeconds: 1_000 }];
    const { result } = await computed(async () => ({ legs, path: ANSWER.path }), {
      ...JOURNEY,
      via: undefined,
    });
    expect(result).toEqual({
      legs,
      distanceMeters: 1_700_000,
      durationSeconds: 31_000,
      path: ANSWER.path,
    });
  });

  it("ignores fields of the answer it doesn't read", async () => {
    const answer = { ...ANSWER, distanceMeters: 1, attribution: "OpenStreetMap" };
    const { result } = await computed(async () => answer);
    expect(result.distanceMeters).toBe(850_000);
    expect(result).not.toHaveProperty("attribution");
  });

  it("fails the route with what the function rejected with", async () => {
    const cause = new Error("no route found");
    const error = await failure(async () => Promise.reject(cause));
    expect(error.message).toBe("setRoute: computeRoute failed");
    expect(error.cause).toBe(cause);
  });

  it("fails the route with what the function threw before answering", async () => {
    const cause = new Error("offline");
    const error = await failure(() => {
      throw cause;
    });
    expect(error.cause).toBe(cause);
  });

  it("fails the route when the answer isn't a route, naming the field", async () => {
    const legs = [{ ...LEG, distanceMeters: -1 }];
    const error = await failure(async () => ({ legs, path: ANSWER.path }));
    expect(error.message).toBe("setRoute: computeRoute answered no route");
    expect((error.cause as Error).message).toBe(
      "computeRoute's answer: legs[0].distanceMeters must be a number of at least 0, got -1",
    );
  });

  it("fails the route on a leg's or step's field it doesn't know, a typo it would drop", async () => {
    // A page in plain JavaScript: in TypeScript the typo doesn't compile.
    const steps = [{ ...LEG.steps[0], instructions: "Head north" }];
    const error = await failure(
      async () => ({ legs: [{ ...LEG, steps }], path: ANSWER.path }) as never,
    );
    expect((error.cause as Error).message).toBe(
      "computeRoute's answer: legs[0].steps[0].instructions is not a step field",
    );
  });

  it("fails the route when its path has fewer than 2 points", async () => {
    const error = await failure(async () => ({ legs: [LEG], path: [{ lat: 1, lng: 2 }] }));
    expect((error.cause as Error).message).toMatch(/path must be an array of at least 2 points/);
  });

  it("fails the route when its legs don't run between the stops that end legs", async () => {
    const error = await failure(async () => ({
      legs: [{ ...LEG, to: "zurich" }],
      path: ANSWER.path,
    }));
    expect(error.message).toBe(
      "setRoute: computeRoute's legs don't run between the stops that end legs (milan → paris)",
    );
  });
});
