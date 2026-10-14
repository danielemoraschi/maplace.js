// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Drawable } from "../drawable";
import {
  adding,
  circleDrawable,
  manyMarkers,
  markerDrawable,
  removing,
  updating,
} from "../testing/conformance/fixtures";
import { createDrawing } from "./drawing";
import { NOT_YET_PLACED } from "./inert";
import { createMapState } from "./map-state";
import type { PlacedLocation, Placers } from "./placed-location";
import { stubMounted } from "./testing/stub-site";

/** Placers that record what they were asked to do, as "place a", "update a", "remove a". */
function recordingPlacers() {
  const log: string[] = [];
  const placeRecorded = (drawable: Drawable): PlacedLocation =>
    ({
      kind: "marker",
      update: () => log.push(`update ${drawable.id}`),
      present: () => {},
      remove: () => log.push(`remove ${drawable.id}`),
    }) as unknown as PlacedLocation;
  const placers: Placers = {
    ...NOT_YET_PLACED,
    marker: (drawable) => {
      log.push(`place ${drawable.id}`);
      return placeRecorded(drawable);
    },
  };
  return { placers, log };
}

function openDrawing() {
  const state = createMapState();
  const { placers, log } = recordingPlacers();
  const drawing = createDrawing(state, placers);
  const mounted = stubMounted(state);
  drawing.part.open(mounted.mounted);
  return { drawing, log, ...mounted };
}

describe("createDrawing", () => {
  it("places nothing before the map opens", async () => {
    const state = createMapState();
    const { placers, log } = recordingPlacers();
    await createDrawing(state, placers).apply(adding(markerDrawable("a")));
    expect(log).toEqual([]);
  });

  it("applies diffs in order without waiting for each, removals first", async () => {
    const { drawing, log } = openDrawing();
    await Promise.all([
      drawing.apply(adding(markerDrawable("a"))),
      drawing.apply({
        added: [markerDrawable("b")],
        updated: [markerDrawable("a")],
        removed: ["a"],
      }),
    ]);
    expect(log).toEqual(["place a", "remove a", "place b", "place a"]);
  });

  it("updates a placed location in place", async () => {
    const { drawing, log, state } = openDrawing();
    await drawing.apply(adding(markerDrawable("a")));
    await drawing.apply(updating(markerDrawable("a")));
    expect(log).toEqual(["place a", "update a"]);
    expect([...state.placed.keys()]).toEqual(["a"]);
  });

  it("skips the types not drawn yet", async () => {
    const { drawing, state } = openDrawing();
    await drawing.apply(adding(circleDrawable("c"), markerDrawable("a")));
    expect([...state.placed.keys()]).toEqual(["a"]);
  });

  it("removes every location on destroy, and stops a diff still being drawn", async () => {
    const { drawing, state, close, log } = openDrawing();
    const drawn = drawing.apply(adding(...manyMarkers(1000)));
    close();
    await drawn;
    expect(state.placed.size).toBe(0);
    expect(log.filter((entry) => entry.startsWith("place")).length).toBeLessThan(1000);
    await drawing.apply(adding(markerDrawable("late")));
    expect(log).not.toContain("place late");
  });

  it("never rejects: a failure reaches the host, and later diffs still draw", async () => {
    const failure = new Error("Google refused");
    const { placers } = recordingPlacers();
    const refusing: Placers = {
      ...placers,
      marker: (drawable, site) => {
        if (drawable.id === "refused") throw failure;
        return placers.marker(drawable, site);
      },
    };
    const state = createMapState();
    const drawing = createDrawing(state, refusing);
    const { host, mounted } = stubMounted(state);
    drawing.part.open(mounted);
    await expect(drawing.apply(adding(markerDrawable("refused")))).resolves.toBeUndefined();
    expect(host.reportsOf("reportError")).toEqual([
      [expect.objectContaining({ code: "provider-load-failed", cause: failure })],
    ]);
    await drawing.apply(adding(markerDrawable("b")));
    expect([...state.placed.keys()]).toEqual(["b"]);
  });

  it("removes a location the diff removes", async () => {
    const { drawing, state, log } = openDrawing();
    await drawing.apply(adding(markerDrawable("a")));
    await drawing.apply(removing("a"));
    expect(log).toEqual(["place a", "remove a"]);
    expect(state.placed.size).toBe(0);
  });
});
