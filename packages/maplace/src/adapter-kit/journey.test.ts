import { describe, expect, it } from "vitest";
import type { LatLng } from "../geometry";
import { type Journey, journeyOf, sameJourney } from "./journey";

const A = { lat: 44.5, lng: 11.3 };
const B = { lat: 44.6, lng: 10.9 };

const placedAt =
  (placed: Record<string, LatLng>) =>
  (id: string): LatLng | undefined =>
    placed[id];

describe("journeyOf", () => {
  it("is where each stop is, in order, with the route's travel mode", () => {
    const journey = journeyOf(
      { stops: ["b", "a"], travelMode: "walking" },
      placedAt({ a: A, b: B }),
    );
    expect(journey).toEqual({ stops: ["b", "a"], travelMode: "walking", points: [B, A] });
  });

  it("carries the stops the route passes through", () => {
    const route = { stops: ["a", "b", "a"], via: ["b"] };
    expect(journeyOf(route, placedAt({ a: A, b: B }))?.via).toEqual(["b"]);
  });

  it("is undefined until every stop is placed", () => {
    expect(journeyOf({ stops: ["a", "b"] }, placedAt({ a: A }))).toBeUndefined();
  });
});

describe("sameJourney", () => {
  const journey = (travelMode?: "walking", a: LatLng = A): Journey => ({
    stops: ["a", "b"],
    via: undefined,
    travelMode,
    points: [a, B],
  });

  it("holds for the same stops, travel mode and points", () => {
    expect(sameJourney(journey(), journey())).toBe(true);
  });

  it("fails when a stop moved, the travel mode changed, or none was computed", () => {
    const first = journey();
    expect(sameJourney(first, journey(undefined, { lat: 44.51, lng: 11.3 }))).toBe(false);
    expect(sameJourney(first, journey("walking"))).toBe(false);
    expect(sameJourney(undefined, first)).toBe(false);
  });

  it("fails when other stops are passed through, never for the same ones in another order", () => {
    const through = (via?: string[]): Journey => ({
      stops: ["a", "b", "c", "a"],
      via,
      travelMode: undefined,
      points: [A, B, B, A],
    });
    expect(sameJourney(through(["b"]), through(["c"]))).toBe(false);
    expect(sameJourney(through(["b", "c"]), through(["c", "b"]))).toBe(true);
  });

  it("fails for other stops at the same points", () => {
    const other: Journey = { ...journey(), stops: ["c", "b"] };
    expect(sameJourney(journey(), other)).toBe(false);
  });
});
